// Called only by the disposable, loopback-only genuine Auth harness.
import {randomUUID} from 'node:crypto';
import pg from 'pg';
export async function checkProviderMfaGuard({database,nativeDatabase,admin,createClient,options,issuer,
 config,transport,totp,secret,privateValues,check,second,until,record,createApplicationActor}) {
 const hookDatabase=new pg.Client(nativeDatabase);
 await hookDatabase.connect();
 try {
  await hookDatabase.query('BEGIN');
  try {
   const contract=(await hookDatabase.query('SELECT virtual_ink_auth_guard.mfa_verification_attempt($1) AS r',[
    {user_id:randomUUID(),factor_id:randomUUID(),factor_type:'totp',valid:false}])).rows[0].r;
   check(contract.decision==='continue','native_hook_sql_contract_with_invoker_permissions');
  } finally {await hookDatabase.query('ROLLBACK');}
  async function fixture(label) {
   const email=`synthetic-hook-${label}-${randomUUID()}@example.invalid`,password=secret();
   const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
   if(created.error)throw new Error('hook_fixture_identity_failed');
   const sdk=createClient(config.projectUrl,config.publishableKey,options);
   if((await sdk.auth.signInWithPassword({email,password})).error)throw new Error('hook_fixture_primary_failed');
   const enrolled=await sdk.auth.mfa.enroll({factorType:'totp',issuer:'Virtual Ink guard fixture'});
   if(enrolled.error)throw new Error('hook_fixture_enrollment_failed');
   privateValues.push(enrolled.data.totp.secret);
   return {sdk,id:created.data.user.id,factorId:enrolled.data.id,totpSecret:enrolled.data.totp.secret};
  }
  async function verify(actor,code) {
   const challenge=await actor.sdk.auth.mfa.challenge({factorId:actor.factorId});
   if(challenge.error)throw new Error('hook_fixture_challenge_failed');
   const result=await actor.sdk.auth.mfa.verify({factorId:actor.factorId,challengeId:challenge.data.id,code});
   if(result.data?.access_token)privateValues.push(result.data.access_token,result.data.refresh_token);
   return result;
  }
  const probe=await fixture('rate');
  const validCodes=[-30,0,30].map(offset=>totp(probe.totpSecret,Math.floor(Date.now()/1000)+offset));
  const invalids=['000000','111111','222222','333333','444444','555555','666666'].filter(code=>!validCodes.includes(code));
  for(const code of invalids.slice(0,3))check((await verify(probe,code)).error?.status===422,'provider_hook_rejects_invalid_code');
  check((await database.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE subject=$1 AND source='auth-provider-hook' AND outcome='failure' AND severity='alert'",[probe.id])).rows[0].n>=1,'provider_direct_failures_generate_alert');
  const accepted=await verify(probe,totp(probe.totpSecret));
  check(!accepted.error&&accepted.data?.access_token,'hook_allows_first_genuine_valid_totp');
  check((await probe.sdk.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel==='aal2','hook_native_verification_establishes_aal2');
  const repeated=await verify(probe,totp(probe.totpSecret));
  check(repeated.error?.status===429,'provider_direct_cross_challenge_replay_denied');
  check((await verify(probe,totp(probe.totpSecret))).error?.status===429,'provider_direct_attempt_budget_enforced');
  const extra=await probe.sdk.auth.mfa.enroll({factorType:'totp',issuer:'Virtual Ink guard backup fixture',friendlyName:'Native guard alternate factor'});
  record({backupFactorStatus:extra.error?.status??200,backupFactorCode:extra.error?.code??null});
  if(extra.error)throw new Error('native_backup_factor_fixture_failed');
  privateValues.push(extra.data.totp.secret);
  check((await verify({sdk:probe.sdk,factorId:extra.data.id},totp(extra.data.totp.secret))).error?.status===429,'new_factor_cannot_reset_account_attempt_budget');
  const nativeEvents=(await database.query("SELECT outcome,severity,metadata->>'decision' AS decision FROM virtual_ink_security.events WHERE subject=$1 AND source='auth-provider-hook' ORDER BY occurred_at",[probe.id])).rows;
  check(nativeEvents.some(e=>e.decision==='cooldown'&&e.outcome==='blocked')&&nativeEvents.some(e=>e.decision==='rate_limited'&&e.severity==='alert'),'native_replay_and_rate_denials_durably_audited');
  check(nativeEvents.filter(e=>e.decision==='allowed').every(e=>e.outcome==='attempt'),'native_hook_intent_is_not_claimed_as_session_success');
  // Existing application reader includes native alerts, through the same AAL2
  // and role guard. No new browser table grant or native credential is needed.
  check((await second.request('events')).status===401,'old_aal2_without_native_hook_receipt_denied');
  const raced=await fixture('race');
  const challenges=[await raced.sdk.auth.mfa.challenge({factorId:raced.factorId}),await raced.sdk.auth.mfa.challenge({factorId:raced.factorId})];
  record({challengeStatuses:challenges.map(c=>c.error?.status??200)});
  if(challenges.some(c=>c.error))throw new Error('concurrent_hook_challenges_failed');
  const bearer=(await raced.sdk.auth.getSession()).data.session.access_token,code=totp(raced.totpSecret);
  privateValues.push(bearer);
  const racedResults=await Promise.all(challenges.map(async c=>{
   const response=await transport(`${issuer}/factors/${raced.factorId}/verify`,{method:'POST',headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify({challenge_id:c.data.id,code})});
   const body=await response.json();if(body.access_token)privateValues.push(body.access_token,body.refresh_token);
   return response.status;
  }));
  check(racedResults.filter(s=>s===200).length===1&&racedResults.filter(s=>s===429).length===1,'concurrent_native_challenges_cannot_double_verify');
  const raceEvents=(await database.query("SELECT metadata->>'decision' AS decision FROM virtual_ink_security.events WHERE subject=$1 AND source='auth-provider-hook'",[raced.id])).rows;
  check(raceEvents.filter(e=>e.decision==='allowed').length===1&&raceEvents.filter(e=>e.decision==='cooldown').length===1,'race_denial_originates_in_native_database_hook');
  const factors=(await second.sdk.auth.mfa.listFactors()).data.totp;
  const secondFactor=factors.find(f=>f.status==='verified').id;
  const previous=(await database.query('SELECT max(verified_at) AS at FROM auth.mfa_challenges WHERE factor_id=$1',[secondFactor])).rows[0].at;
  const oldNativeAttempt=await verify({sdk:second.sdk,factorId:secondFactor},totp(second.totpSecret));
  check(oldNativeAttempt.error?.status===429,'hook_cold_start_covers_native_verifications_before_activation');
  // Wait real wall time; do not edit the acceptance timestamp to fake expiry.
  console.log('Passed: direct-provider replay, rate and race probes; waiting for the real cooldown to expire.');
  await until(()=>Date.now()>previous.getTime()+90500,100,'native_cooldown_not_expired');
  const challenge=await second.request('challenge',{factorId:secondFactor});
  check(challenge.status===200,'application_challenge_with_provider_hook');
  const stepped=await second.request('verify',{factorId:secondFactor,challengeId:challenge.body.data.challengeId,code:totp(second.totpSecret)});
  check(stepped.status===200,'genuine_application_step_up_after_native_cooldown');
  check((await second.request('lookup',{targetUserId:second.id})).status===200,'protected_application_access_with_provider_wide_guard');
  const listed=await second.request('events');
  record({auditViewStatus:listed.status,auditViewError:listed.body.error?.code??null,
   returnedEvents:Array.isArray(listed.body.data?.data)?listed.body.data.data.length:0,
   returnedProviderAlerts:Array.isArray(listed.body.data?.data)?listed.body.data.data.filter(e=>e.action==='mfa.provider.verify'&&e.severity==='alert').length:0});
  check(listed.status===200&&listed.body.data.data.some(e=>e.action==='mfa.provider.verify'&&e.severity==='alert'),'restricted_application_audit_view_includes_provider_alerts');
  check((await second.request('requests')).status===200,'restricted_role_request_list_is_readable');
  const first=await createApplicationActor('native-guard-requester','SUPER_ADMIN');
  check((await first.sdk.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel==='aal1','requester_genuine_primary_login_after_cutover');
  check((await first.request('lookup',{targetUserId:second.id})).status===401,'requester_primary_login_cannot_bypass_native_receipt');
  let firstSecret;
  const nativeEnroll=first.sdk.auth.mfa.enroll.bind(first.sdk.auth.mfa);
  first.sdk.auth.mfa.enroll=async input=>{const response=await nativeEnroll(input);firstSecret=response.data?.totp?.secret;if(firstSecret)privateValues.push(firstSecret);return response;};
  const requesterEnrollment=await first.request('enroll');
  check(requesterEnrollment.status===200&&!!firstSecret,'requester_application_enrollment_with_native_hook');
  const firstFactor=requesterEnrollment.body.data.factorId;
  const requesterChallenge=await first.request('challenge',{factorId:firstFactor});
  check(requesterChallenge.status===200,'requester_native_guarded_challenge');
  check((await first.request('verify',{factorId:firstFactor,challengeId:requesterChallenge.body.data.challengeId,code:totp(firstSecret)})).status===200,'requester_native_guarded_application_step_up');
  const roleTarget=await createApplicationActor('native-guard-target');
  const roleRequest=await first.request('request',{targetUserId:roleTarget.id,expectedAssignmentId:roleTarget.assignment,
   role:'ADMIN',reason:'Synthetic native-hook role grant integration',expiresAt:null});
  check(roleRequest.status===200,'native_hook_guarded_privileged_role_request');
  const roleRequestId=roleRequest.body.data.data.requestId;
  check((await first.request('approve',{requestId:roleRequestId})).status===403,'native_hook_does_not_bypass_separated_approval');
  check((await second.request('approve',{requestId:roleRequestId})).status===200,'native_hook_guarded_distinct_role_approval');
  check((await first.request('execute',{requestId:roleRequestId})).status===200,'native_hook_guarded_role_grant_executes');
  check((await roleTarget.request('status')).status===401,'native_hook_guarded_grant_revokes_target_session');
  check((await roleTarget.login()).error===null,'native_hook_role_target_fresh_primary_login');
  check((await roleTarget.request('status')).body.data.role==='ADMIN','native_hook_grant_is_effective');
  const currentTarget=await first.request('lookup',{targetUserId:roleTarget.id});
  const removal=await first.request('request',{targetUserId:roleTarget.id,expectedAssignmentId:currentTarget.body.data.data.assignmentId,
   role:'CUSTOMER',reason:'Synthetic native-hook privilege removal integration',expiresAt:null});
  check(removal.status===200,'native_hook_guarded_removal_request');
  const removalId=removal.body.data.data.requestId;
  check((await second.request('approve',{requestId:removalId})).status===200,'native_hook_guarded_removal_approval');
  check((await first.request('execute',{requestId:removalId})).status===200,'native_hook_guarded_removal_executes');
  check((await roleTarget.request('status')).status===401,'native_hook_guarded_removal_revokes_stale_session');
  check((await database.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE target_id=$1 AND action='role.execute' AND outcome='success' AND requester=$2 AND approver=$3 AND executor=$2 AND assurance='aal2'",[roleTarget.id,first.id,second.id])).rows[0].n===2,'native_hook_role_grant_and_removal_are_audited');
  for(const active of [first,second]){const session=(await active.sdk.auth.getSession()).data.session;if(session)privateValues.push(session.access_token,session.refresh_token);}
  check((await first.request('logout')).status===200,'native_hook_guarded_logout_is_audited');
  // Native identity can append only provider-scoped records, not role/audit data.
  let denied=false;
  try {await hookDatabase.query("INSERT INTO virtual_ink_security.events(subject,action,outcome,severity,correlation_id,assurance,source) VALUES($1,'role.execute','success','info',gen_random_uuid(),'aal2','web-admin')",[probe.id]);}catch(e){denied=e.code==='42501';}
  check(denied,'native_hook_cannot_forge_role_audit');
  check((await hookDatabase.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE source='web-admin'")).rows[0].n===0,'native_hook_cannot_read_administrative_events');
  denied=false;try{await hookDatabase.query('SELECT reason FROM virtual_ink_security.events');}catch(e){denied=e.code==='42501';}
  check(denied,'native_hook_cannot_read_private_audit_reasons');
  denied=false;try{await hookDatabase.query("UPDATE virtual_ink_phase1.role_assignments SET role='SUPER_ADMIN'");}catch(e){denied=e.code==='42501';}
  check(denied,'native_hook_cannot_write_privileged_roles');
  denied=false;try{await hookDatabase.query("UPDATE virtual_ink_auth_guard.settings SET enabled=false");}catch(e){denied=e.code==='42501';}
  check(denied,'native_hook_cannot_disable_its_guard');
  denied=false;try{await hookDatabase.query("DELETE FROM virtual_ink_security.events WHERE source='auth-provider-hook'");}catch(e){denied=e.code==='42501';}
  check(denied,'native_hook_audits_are_append_only');
  const malformed=(await hookDatabase.query('SELECT virtual_ink_auth_guard.mfa_verification_attempt($1) AS r',[{user_id:probe.id,factor_id:probe.factorId,factor_type:'totp',valid:'true',code:'private-input-discarded',metadata:{ip_address:'synthetic-redaction-canary'}}])).rows[0].r;
  check(malformed.error?.http_code===400,'hook_rejects_non_boolean_provider_validation');
  const leaked=(await database.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE source='auth-provider-hook' AND metadata::text ~ 'private-input-discarded|synthetic-redaction-canary'")).rows[0].n;
  check(leaked===0,'hook_discards_raw_payload_and_address_metadata');
  for(const role of ['anon','authenticated','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service']) {
   for(const [label,statement] of [['invoke_native_hook',"SELECT virtual_ink_auth_guard.mfa_verification_attempt('{}')"],
    ['disable_native_guard','UPDATE virtual_ink_auth_guard.settings SET enabled=false'],
    ['forge_native_receipt',"UPDATE virtual_ink_auth_guard.factor_state SET last_accepted_at=clock_timestamp()"]]) {
    await database.query('BEGIN');await database.query(`SET LOCAL ROLE ${role}`);
    denied=false;try{await database.query(statement);}catch(e){denied=e.code==='42501';}
    await database.query('ROLLBACK');check(denied,`${role}_cannot_${label}`);
   }
  }
  const unavailableAudit=await fixture('audit-outage');
  const auditColumns='subject,action,outcome,severity,correlation_id,assurance,source,metadata,occurred_at';
  await database.query(`REVOKE INSERT(${auditColumns}) ON virtual_ink_security.events FROM supabase_auth_admin`);
  try {
   check((await verify(unavailableAudit,totp(unavailableAudit.totpSecret))).error?.status===500,'native_verification_fails_closed_when_audit_write_fails');
   check((await unavailableAudit.sdk.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel==='aal1','audit_failure_does_not_issue_aal2');
   check((await database.query('SELECT count(*)::int AS n FROM virtual_ink_auth_guard.factor_state WHERE user_id=$1',[unavailableAudit.id])).rows[0].n===0,'audit_failure_rolls_back_native_hook_reservation');
  } finally {await database.query(`GRANT INSERT(${auditColumns}) ON virtual_ink_security.events TO supabase_auth_admin`);}
  await database.query("UPDATE virtual_ink_auth_guard.settings SET enabled=false");
  check((await second.request('lookup',{targetUserId:second.id})).status===401,'disabling_native_guard_denies_protected_actions');
  const unavailable=await verify(await fixture('disabled'),invalids[0]);
  check(unavailable.error?.status===503,'configured_hook_fails_closed_when_disabled');
  await database.query("UPDATE virtual_ink_auth_guard.settings SET enabled=true");
  check((await database.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE source='auth-provider-hook' AND metadata->>'decision'='disabled' AND severity='alert'")).rows[0].n===1,'disabled_hook_denial_is_audited');
 } finally {await hookDatabase.end();}
}
