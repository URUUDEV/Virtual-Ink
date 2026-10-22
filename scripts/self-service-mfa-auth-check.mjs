// Actual application routes, restricted DB account and native Auth/hook.
// Synthetic accounts inside the disposable loopback-only harness; no hosted access.
import {createHash} from 'node:crypto';
export async function checkSelfServiceMfa({database,createActor,check,privateValues,totp}) {
 const actors=[];
 for(const role of ['CUSTOMER','VENDOR']){
  const account=await createActor(`self-${role.toLowerCase()}`,role);actors.push(account);
  const own=await account.request('self-status');
  check(own.status===200&&own.body.data.userId===account.id&&own.body.data.role===role&&own.body.data.canManageRoles===false,`self_${role}_own_aal1_status`);
  // Validation denies; the private audit command can additionally deny a
  // nonadministrative malformed request. Neither path returns account data.
  const injected=await account.request('self-status',{subject:actors[0].subject,role:'SUPER_ADMIN'});
  check([400,403].includes(injected.status)&&!injected.body.data,`self_${role}_identity_injection_denied`);
  check((await account.request('status')).status===403,`self_${role}_administrative_status_denied`);
  const enrolled=await account.request('enroll');
  check(enrolled.status===200&&!!enrolled.body.data.manualKey,`self_${role}_genuine_enrollment`);
  const {factorId,manualKey}=enrolled.body.data;account.factorId=factorId;privateValues.push(manualKey);
  const challenge=await account.request('challenge',{factorId});
  check(challenge.status===200,`self_${role}_genuine_challenge`);
  const verified=await account.request('verify',{factorId,challengeId:challenge.body.data.challengeId,code:totp(manualKey)});
  check(verified.status===200&&(await account.auth.identity()).stepUpAt!==null,`self_${role}_native_and_application_aal2`);
  const status=await account.request('self-status');
  check(status.status===200&&status.body.data.factors.some(f=>f.id===factorId&&f.status==='verified'),`self_${role}_verified_factor_list`);
  for(const action of ['status','events','requests'])check((await account.request(action)).status===403,`self_${role}_${action}_denied_after_step_up`);
  check((await account.request('lookup',{targetUserId:actors[0].id})).status===403,`self_${role}_role_lookup_denied_after_step_up`);
  check((await account.request('protected',{capability:'payment.release'})).status===403,`self_${role}_payment_release_denied_after_step_up`);
  check((await account.request('enroll')).status===403,`self_${role}_protected_factor_cannot_use_initial_enrollment`);
  check((await account.request('unenroll',{factorId})).status===403,`self_${role}_last_verified_factor_preserved`);
  const replacement=await account.request('replace-enroll');
  check(replacement.status===200,`self_${role}_strong_replacement_allowed`);
  privateValues.push(replacement.body.data.manualKey);
  check((await account.request('cancel-enrollment',{factorId:replacement.body.data.factorId})).status===200,`self_${role}_unfinished_replacement_discarded`);
  if(actors.length>1){
   check((await account.request('challenge',{factorId:actors[0].factorId})).status===401,`self_${role}_other_account_factor_denied`);
  }
  check(!(await account.login()).error,`self_${role}_primary_reauthentication`);
  check((await account.request('replace-enroll')).status===401,`self_${role}_aal1_replacement_denied`);
  const identity=await account.auth.identity();
  await database.query('DELETE FROM auth.sessions WHERE id=$1',[identity.sessionId]);
  check((await account.request('self-status')).status!==200,`self_${role}_revoked_session_denied`);
 }
 // Fingerprints only: never put native seeds or enrollment responses in reports.
 return {roles:['CUSTOMER','VENDOR'],nativeHook:true,seedLogging:false,
  scopeFingerprint:createHash('sha256').update('self-scoped-mfa-v1').digest('hex')};
}
