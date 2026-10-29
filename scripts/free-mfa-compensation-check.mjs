// Genuine disposable local Auth without either paid MFA or custom token hook.
// Real SDK, application gateway/commands and restricted SQL login; synthetic users.
import {randomUUID} from 'node:crypto';
export async function checkPaidMfaPolicyRegression({database,createActor,check,privateValues,totp}) {
 const account=await createActor('post-migration-paid','SUPER_ADMIN');
 const enrolled=await account.request('enroll');
 check(enrolled.status===200,'paid_policy_after_migration_enrolls');
 const {factorId,manualKey}=enrolled.body.data;privateValues.push(manualKey);
 const challenge=await account.request('challenge',{factorId});
 check(challenge.status===200,'paid_policy_after_migration_challenges');
 check((await account.request('verify',{factorId,challengeId:challenge.body.data.challengeId,code:totp(manualKey)})).status===200,'paid_policy_after_migration_verifies_native_hook');
 check((await account.request('lookup',{targetUserId:account.id})).status===200,'paid_policy_after_migration_allows_genuine_protected_read');
 const row=(await database.query(`SELECT
  (SELECT count(*)::int FROM virtual_ink_security.application_mfa_receipts WHERE subject=$1) AS application,
  (SELECT count(*)::int FROM virtual_ink_auth_guard.factor_state WHERE user_id=$1) AS native`,[account.subject])).rows[0];
 check(row.application===0&&row.native===1,'paid_policy_after_migration_uses_only_native_receipt');
}
export async function checkFreeMfaCompensation({database,applicationDatabase,createActor,check,privateValues,totp,config,core,providerVerifications,until}) {
 const receipts=async subject=>(await database.query('SELECT count(*)::int AS n FROM virtual_ink_security.application_mfa_receipts WHERE subject=$1',[subject])).rows[0].n;
 const native=async subject=>(await database.query('SELECT count(*)::int AS n FROM virtual_ink_auth_guard.factor_state WHERE user_id=$1',[subject])).rows[0].n;
 async function enroll(account){
  const response=await account.request('enroll');
  check(response.status===200&&!!response.body.data.manualKey,'free_genuine_application_enrollment');
  const {factorId,manualKey}=response.body.data;privateValues.push(manualKey);
  return {factorId,manualKey};
 }
 async function verify(account,factor,code=totp(factor.manualKey)){
  const challenge=await account.request('challenge',{factorId:factor.factorId});
  check(challenge.status===200,'free_genuine_application_challenge');
  const response=await account.request('verify',{factorId:factor.factorId,challengeId:challenge.body.data.challengeId,code});
  return {response,code,challengeId:challenge.body.data.challengeId};
 }
 async function denied(sql,values=[],expected='42501'){
  try{await applicationDatabase.query(sql,values);return false;}catch(error){return error.code===expected;}
 }
 // Explicit permission probes catch inherited/default grants, including the old
 // command name which would otherwise bypass the new success-receipt boundary.
 for(const role of ['anon','authenticated','service_role','supabase_auth_admin','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service']){
  const row=(await database.query(`SELECT
    has_function_privilege($1,'virtual_ink_security.provider_session_facts(uuid,uuid,bigint,bigint,boolean,boolean,uuid)','EXECUTE') AS facts,
    has_function_privilege($1,'virtual_ink_security.command_native_policy(text,jsonb,jsonb)','EXECUTE') AS legacy,
    has_table_privilege($1,'virtual_ink_security.application_mfa_receipts','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS receipts`,[role])).rows[0];
  check(!row.facts&&!row.legacy&&!row.receipts,`free_${role}_private_acl`);
 }
 check(await denied("SELECT virtual_ink_security.command_native_policy('status','{}','{}')"),'free_runtime_cannot_bypass_wrapper');
 check(await denied("UPDATE virtual_ink_security.configuration SET mfa_policy='application_receipt'"),'free_runtime_cannot_select_policy');
 check(await denied('SELECT * FROM virtual_ink_security.application_mfa_receipts'),'free_runtime_cannot_read_receipts');
 check(await denied('INSERT INTO virtual_ink_security.application_mfa_receipts DEFAULT VALUES'),'free_runtime_cannot_forge_receipts');
 const admin=await createActor('free-admin','SUPER_ADMIN'),factor=await enroll(admin);
 check((await admin.request('lookup',{targetUserId:admin.id})).status===401,'free_aal1_sensitive_read_denied');
 const verification=await verify(admin,factor);
 check(verification.response.status===200,'free_application_accepts_genuine_mfa_without_paid_hook');
 check(await receipts(admin.subject)===1&&await native(admin.subject)===0,'free_success_creates_application_receipt_and_no_native_receipt');
 check((await admin.request('lookup',{targetUserId:admin.id})).status===200,'free_receipt_cookie_and_native_facts_allow_sensitive_read');
 await database.query("UPDATE virtual_ink_security.configuration SET mfa_policy='provider_hook'");
 try{check((await admin.request('lookup',{targetUserId:admin.id})).status===401,'paid_policy_never_falls_back_to_application_receipt');}
 finally{await database.query("UPDATE virtual_ink_security.configuration SET mfa_policy='application_receipt'");}
 let immutable=false;
 try{await database.query('UPDATE virtual_ink_security.application_mfa_receipts SET mfa_at=mfa_at WHERE subject=$1',[admin.subject]);}catch(error){immutable=error.code==='23514';}
 check(immutable,'free_committed_receipt_is_immutable_even_to_migration_owner');
 const signedCookie=admin.cookies.get('__Host-vi-step-up');
 check(typeof signedCookie==='string'&&admin.writes.some(c=>c.name==='__Host-vi-step-up'&&c.options.httpOnly&&c.options.secure&&c.options.sameSite==='strict'),'free_committed_cookie_is_restricted');
 admin.cookies.delete('__Host-vi-step-up');
 check((await admin.request('lookup',{targetUserId:admin.id})).status===401,'free_receipt_without_cookie_denied');
 admin.cookies.set('__Host-vi-step-up',signedCookie.slice(0,-1)+(signedCookie.endsWith('a')?'b':'a'));
 check((await admin.request('lookup',{targetUserId:admin.id})).status===401,'free_tampered_cookie_denied');
 admin.cookies.set('__Host-vi-step-up',signedCookie);
 const beforeReplay=providerVerifications();
 const replay=await verify(admin,factor,verification.code);
 check(replay.response.status===401&&providerVerifications()===beforeReplay,'free_cross_challenge_replay_denied_before_provider');
 check(await receipts(admin.subject)===1,'free_replay_creates_no_receipt');
 const direct=await createActor('free-direct','SUPER_ADMIN'),directFactor=await enroll(direct);
 const challenge=await direct.sdk.auth.mfa.challenge({factorId:directFactor.factorId});
 const issued=await direct.sdk.auth.mfa.verify({factorId:directFactor.factorId,challengeId:challenge.data.id,code:totp(directFactor.manualKey)});
 check(!issued.error&&(await direct.auth.identity()).aal==='aal2','free_provider_direct_can_issue_native_aal2');
 check(await receipts(direct.subject)===0&&await native(direct.subject)===0,'free_provider_direct_has_no_application_or_native_receipt');
 check((await direct.request('lookup',{targetUserId:direct.id})).status===401,'free_provider_direct_aal2_denied');
 // Even a correctly signed test cookie cannot replace the database receipt.
 // This is a controlled negative probe with the local synthetic signing key.
 direct.cookies.set('__Host-vi-step-up',core.issueApplicationStepUp(await direct.auth.identity(),config.codeKey).value);
 check((await direct.request('lookup',{targetUserId:direct.id})).status===401,'free_correctly_signed_cookie_without_receipt_denied');
 direct.cookies.set('__Host-vi-step-up',signedCookie);
 check((await direct.request('lookup',{targetUserId:direct.id})).status===401,'free_other_subject_cookie_denied');
 // Account-level invalid-code budget remains durable before native requests.
 const limited=await createActor('free-limited','SUPER_ADMIN'),limitedFactor=await enroll(limited);
 const limitedChallenge=await limited.request('challenge',{factorId:limitedFactor.factorId});
 const valid=new Set([-30,0,30].map(offset=>totp(limitedFactor.manualKey,Math.floor(Date.now()/1000)+offset)));
 const invalid=['101010','202020','303030','404040','505050','606060'].filter(code=>!valid.has(code));
 for(const code of invalid.slice(0,5))check((await limited.request('verify',{factorId:limitedFactor.factorId,challengeId:limitedChallenge.body.data.challengeId,code})).status===401,'free_invalid_code_denied');
 const beforeLimit=providerVerifications();
 check((await limited.request('verify',{factorId:limitedFactor.factorId,challengeId:limitedChallenge.body.data.challengeId,code:invalid[5]})).status===429&&providerVerifications()===beforeLimit,'free_account_budget_denies_before_provider');
 check((await database.query("SELECT count(*)::int AS n FROM virtual_ink_security.events WHERE subject=$1 AND severity='alert' AND outcome='failure'",[limited.subject])).rows[0].n>0,'free_repeated_failure_alert_is_durable');
 // Fail after native verification: the separately committed reservation survives;
 // success audit/receipt roll back together and no pending cookie is committed.
 const outage=await createActor('free-audit-outage','SUPER_ADMIN'),outageFactor=await enroll(outage);
 await database.query('REVOKE INSERT ON virtual_ink_security.application_mfa_receipts FROM virtual_ink_security_owner');
 let failed;try{failed=await verify(outage,outageFactor);}finally{await database.query('GRANT INSERT ON virtual_ink_security.application_mfa_receipts TO virtual_ink_security_owner');}
 check(failed.response.status===503&&(await outage.auth.identity()).aal==='aal2','free_receipt_outage_after_genuine_provider_verification_fails_closed');
 check(!outage.cookies.has('__Host-vi-step-up')&&await receipts(outage.subject)===0,'free_receipt_outage_commits_no_cookie_or_receipt');
 const audited=(await database.query("SELECT outcome,count(*)::int AS n FROM virtual_ink_security.events WHERE subject=$1 AND action='mfa.verify' GROUP BY outcome",[outage.subject])).rows;
 check(audited.some(e=>e.outcome==='attempt'&&e.n===1)&&!audited.some(e=>e.outcome==='success'),'free_receipt_outage_keeps_attempt_and_rolls_back_success');
 check((await outage.request('lookup',{targetUserId:outage.id})).status===401,'free_outage_aal2_cannot_authorize');
 // Nonadministrative vendor/customer identities retain their own-account scope.
 for(const role of ['CUSTOMER','VENDOR']){
  const account=await createActor(`free-${role.toLowerCase()}`,role),own=await enroll(account);
  check((await verify(account,own)).response.status===200,`free_${role}_genuine_self_service_step_up`);
  check((await account.request('self-status')).status===200,`free_${role}_own_security_status`);
  check((await account.request('lookup',{targetUserId:admin.id})).status===403,`free_${role}_administrator_read_denied`);
  check((await account.request('unenroll',{factorId:own.factorId})).status===403,`free_${role}_last_factor_preserved`);
  const replacement=await account.request('replace-enroll');
  check(replacement.status===200,`free_${role}_protected_replacement_allowed`);
  privateValues.push(replacement.body.data.manualKey);
  check((await account.request('cancel-enrollment',{factorId:replacement.body.data.factorId})).status===200,`free_${role}_unfinished_factor_discarded`);
 }
 const older=await admin.auth.identity();
 const oldContext={...older,environment:config.environment,correlationId:randomUUID()};
 check(!(await admin.login()).error,'free_same_account_new_primary_session');
 await until(()=>totp(factor.manualKey)!==verification.code,35,'free_fresh_totp_window_required');
 check((await verify(admin,factor)).response.status===200,'free_same_factor_new_session_genuine_verification');
 check(await receipts(admin.subject)===2,'free_new_session_has_its_own_durable_receipt');
 const superseded=(await applicationDatabase.query("SELECT virtual_ink_security.command('roles.lookup',$1,$2) AS result",[{targetUserId:admin.id},oldContext])).rows[0].result;
 check(!superseded.ok&&superseded.error==='UNAUTHENTICATED','free_latest_verification_supersedes_older_session_receipt');
 check((await admin.request('lookup',{targetUserId:admin.id})).status===200,'free_latest_session_receipt_remains_usable');
 const identity=await admin.auth.identity();
 const context={...identity,environment:config.environment,correlationId:randomUUID()};
 const command=async ctx=>(await applicationDatabase.query("SELECT virtual_ink_security.command('roles.lookup',$1,$2) AS result",[{targetUserId:admin.id},ctx])).rows[0].result;
 check(!(await command({...context,mfaAt:identity.mfaAt-1,stepUpAt:identity.mfaAt-1})).ok,'free_native_amr_timestamp_mismatch_denied');
 check(!(await command({...context,primaryAt:identity.primaryAt-1})).ok,'free_native_primary_timestamp_mismatch_denied');
 check(!(await command({...context,subject:direct.subject})).ok,'free_other_subject_native_session_denied');
 await database.query("UPDATE auth.mfa_amr_claims SET updated_at=clock_timestamp()-interval '6 minutes' WHERE session_id=$1 AND authentication_method='password'",[identity.sessionId]);
 check((await admin.request('lookup',{targetUserId:admin.id})).status===401,'free_expired_primary_reauthentication_denied');
 await database.query('DELETE FROM auth.sessions WHERE id=$1',[identity.sessionId]);
 check((await admin.request('lookup',{targetUserId:admin.id})).status!==200,'free_revoked_native_session_denied');
 return {paidHook:false,customTokenHook:false,nativeProviderFacts:true,applicationReceipts:true,
  providerDirectAccountCooldown:false,hostedAcceptance:false,pendingCookieBoundary:'gateway harness; separate Next transport contracts remain required'};
}
