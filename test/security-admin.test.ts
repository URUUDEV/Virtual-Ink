import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError} from '../src/backend/api/errors.ts';
import {createSecurityCommands,loadSecurityConfig,securityIdentityFromClaims,securityResponse,securityCommandStatement,
 type SecurityAuth,type SecurityCommands,type SecurityConfig, type SecurityIdentity} from '../src/backend/identity/security-admin.ts';
import type {SqlExecutor,SqlParameter} from '../src/backend/database/ports.ts';
const subject='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222',factorId='33333333-3333-4333-8333-333333333333';
const env={SECURITY_ADMIN_ENABLED:'true',WEB_AUTH_ENABLED:'true',SECURITY_ENVIRONMENT:'preview',VERCEL_ENV:'preview',
 APP_ORIGIN:'https://preview.example.test',SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',
 SECURITY_PROJECT_URL:'https://abcdefghijklmnopqrst.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',SECURITY_CODE_HMAC_KEY:'a'.repeat(64)};
const config=loadSecurityConfig(env)!;
const identity:SecurityIdentity={subject,issuer:`${env.SUPABASE_URL}/auth/v1`,sessionId,aal:'aal2',mfaAt:990,primaryAt:980};
const claims={iss:identity.issuer,sub:subject,session_id:sessionId,role:'authenticated',aud:'authenticated',aal:'aal2',iat:1000,exp:1600,
 amr:[{method:'password',timestamp:980},{method:'totp',timestamp:990}]};
const verified={provider:'supabase' as const,issuer:identity.issuer,subject};
function fixture(options:{providerFailure?:boolean;dbFailure?:boolean;factors?:{id:string;status:string;type:string}[];failAction?:string}={}) {
 const calls:{name:string;input?:Record<string,unknown>}[]=[];
 const provider=async(name:string)=>{calls.push({name});if(options.providerFailure)throw new Error('sensitive upstream detail');};
 const auth:SecurityAuth={
  async identity(){calls.push({name:'identity'});return identity;},
  async factors(){return options.factors??[];},async assurance(){return {currentLevel:'aal2',nextLevel:'aal2'};},
  async enroll(){await provider('provider.enroll');return {factorId,qr:'data:image/svg+xml;base64,c3ludGhldGlj'};},
  async challenge(id){assert.equal(id,factorId);await provider('provider.challenge');return {challengeId:sessionId,expiresAt:1400};},
  async verify(id,challenge,code){assert.equal(id,factorId);assert.equal(challenge,sessionId);assert.equal(code,'123456');await provider('provider.verify');},
  async reauthenticate(password){assert.equal(password,'synthetic password');await provider('provider.reauthenticate');},
  async updatePassword(password){assert.equal(password,'synthetic password');await provider('provider.password-update');},
  async unenroll(id){assert.equal(id,factorId);await provider('provider.unenroll');},async logout(){await provider('provider.logout');}
 };
 const commands:SecurityCommands={async run(name,input,actual,cid){
  calls.push({name,input});assert.deepEqual(actual,identity);assert.match(cid,/^[a-f0-9-]{36}$/);
  if(options.dbFailure)throw new ApiError('AUDIT_UNAVAILABLE');
  if(name===options.failAction)throw new ApiError('UNAUTHENTICATED');
  return {data:{role:'SUPER_ADMIN',userId:subject,canManageRoles:true},auditId:subject};
 }};
 const request=(action:string,value:unknown={},override:{method?:string;origin?:string;query?:string;type?:string}={})=>{
  const method=override.method??'POST';return securityResponse(new Request(`${config.origin}/api/security/${action}${override.query??''}`,{
   method,headers:{Origin:override.origin??config.origin,'Content-Type':override.type??'application/json'},...(method==='GET'||method==='HEAD'?{}:{body:JSON.stringify(value)})}),action,async()=>({config,auth,commands}));};
 return {calls,request};
}
test('security environment fails closed on Production, shared project and mismatched bindings',()=>{
 assert.equal(loadSecurityConfig({}),undefined);assert.equal(loadSecurityConfig({SECURITY_ADMIN_ENABLED:'false'}),undefined);
 assert.equal(config.environment,'preview');assert.ok(Object.isFrozen(config));
 for(const patch of [{SECURITY_ADMIN_ENABLED:'yes'},{WEB_AUTH_ENABLED:'false'},{SECURITY_ENVIRONMENT:'production'},
  {VERCEL_ENV:'production'},{SECURITY_ENVIRONMENT:'local'},{SECURITY_CODE_HMAC_KEY:'weak'},
  {SECURITY_PROJECT_URL:'https://other.example.test'},{SUPABASE_URL:'https://odgxcuwueessxfsoveza.supabase.co',SECURITY_PROJECT_URL:'https://odgxcuwueessxfsoveza.supabase.co'}]) {
  assert.throws(()=>loadSecurityConfig({...env,...patch}));
 }
 assert.equal(loadSecurityConfig({...env,VERCEL_ENV:undefined,SECURITY_ENVIRONMENT:'local'})!.environment,'local');
});
test('security identity uses verified claims and denies stale, ambiguous and metadata-derived assurance',()=>{
 assert.deepEqual(securityIdentityFromClaims(claims,verified,1000),identity);
 const lower=securityIdentityFromClaims({...claims,aal:'aal1',aud:['authenticated'],nbf:999,amr:[]},verified,1000);
 assert.equal(lower.mfaAt,null);assert.equal(lower.primaryAt,null);
 assert.equal(securityIdentityFromClaims({...claims,amr:[...claims.amr,...claims.amr]},verified,1000).mfaAt,null);
 for(const value of [{...claims,iss:'attacker'},{...claims,sub:factorId},{...claims,sub:'bad'},{...claims,role:'service_role'},
  {...claims,aud:[]},{...claims,aud:['authenticated',5]},{...claims,aud:Array(9).fill('authenticated')},
  {...claims,iat:1001},{...claims,iat:'1000'},{...claims,iat:-1},{...claims,exp:1000},{...claims,exp:900},
  {...claims,nbf:1001},{...claims,nbf:'1'},{...claims,aal:'unknown'},{...claims,amr:null},{...claims,amr:Array(17).fill({})},
  {...claims,amr:[null]},{...claims,amr:[[]]},{...claims,amr:[{method:5,timestamp:990}]},
  {...claims,amr:[{method:'totp',timestamp:1001}]},{...claims,amr:[{method:'totp',timestamp:'990'}]},
  {...claims,session_id:'bad'}])assert.throws(()=>securityIdentityFromClaims(value,verified,1000),{code:'UNAUTHENTICATED'});
 const now=Math.floor(Date.now()/1000);assert.ok(securityIdentityFromClaims({...claims,iat:now,exp:now+100},verified));
});
test('security API requires same-origin POST, bounded input and no client-supplied actor or role authority',async()=>{
 const f=fixture();assert.equal((await f.request('status')).status,200);
 for(const [override,status] of [[{method:'GET'},405],[{origin:'https://attacker.invalid'},403],[{query:'?role=SUPER_ADMIN'},400],[{type:'text/plain'},415]] as const) {
  assert.equal((await f.request('status',{},override)).status,status);
 }
 const invalid: [string,unknown][]=[['status',{mfaEnabled:true}],['unknown',{}],['challenge',{factorId:'bad'}],['verify',{factorId,challengeId:sessionId,code:'wrong'}],
  ['verify',{factorId,challengeId:'bad',code:'123456'}],['verify',{factorId,challengeId:sessionId,code:123456}],
  ['reauthenticate',{password:''}],['reauthenticate',{password:'x'.repeat(129)}],['reauthenticate',{password:'bad\n'}],
  ['lookup',{targetUserId:'bad'}],['approve',{requestId:'bad'}],['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'SUPER_ADMIN',reason:'short'}],
  ['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'hacker',reason:'A valid reason for review'}],
  ['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'ADMIN',reason:'A valid reason for review',expiresAt:'bad'}],
  ['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'ADMIN',reason:'A valid reason for review',actorRole:'SUPER_ADMIN'}],
  ['protected',{capability:'blockchain.execute'}]];
 for(const [action,value] of invalid)assert.ok((await f.request(action,value)).status>=400);
 assert.ok(f.calls.some(c=>c.name==='request.invalid'));
 const unavailable=await securityResponse(new Request(`${config.origin}/api/security/status`,{method:'POST'}),'status',async()=>{throw new ApiError('IDENTITY_UNAVAILABLE');});
 assert.equal(unavailable.status,503);
});
test('MFA controller reserves attempts before provider calls, returns no tokens and records results',async()=>{
 for(const [action,input] of [['enroll',{}],['challenge',{factorId}],['verify',{factorId,challengeId:sessionId,code:'123456'}],
  ['reauthenticate',{password:'synthetic password'}],['unenroll',{factorId}]] as const) {
  const factors=action==='unenroll'?[{id:factorId,status:'verified',type:'totp'},{id:subject,status:'verified',type:'totp'}]:[];
  const f=fixture({factors});const response=await f.request(action,input);assert.equal(response.status,200,action);
  const names=f.calls.map(c=>c.name);assert.ok(names.indexOf('mfa.reserve')<names.indexOf(`provider.${action}`));
  assert.ok(names.indexOf('mfa.result')>names.indexOf(`provider.${action}`));
  assert.match(response.headers.get('Cache-Control')!,/private.*no-store/);
  const body=await response.text();assert.ok(!body.includes('123456')&&!body.includes('password')&&!body.includes('access_token'));
  const reserve=f.calls.find(c=>c.name==='mfa.reserve')!.input!;
  assert.ok(!('code'in reserve)&&!('password'in reserve));
  if(action==='verify')assert.match(String(reserve.digest),/^[a-f0-9]{64}$/);
 }
 const already=fixture({factors:[{id:factorId,status:'verified',type:'totp'}]});assert.equal((await already.request('enroll')).status,403);
 assert.ok(already.calls.some(c=>c.name==='mfa.result'&&c.input!.outcome==='failure'));
 assert.equal((await fixture({factors:[{id:factorId,status:'unverified',type:'totp'}]}).request('cancel-enrollment',{factorId})).status,200);
 assert.equal((await already.request('cancel-enrollment',{factorId})).status,403);
 for(const factors of [[],[{id:subject,status:'verified',type:'totp'},{id:sessionId,status:'verified',type:'totp'}]]) {
  assert.equal((await fixture({factors}).request('unenroll',{factorId})).status,403);
 }
 for(const action of ['enroll','challenge','verify','reauthenticate','unenroll']) {
  const input=action==='verify'?{factorId,challengeId:sessionId,code:'123456'}:action==='reauthenticate'?{password:'synthetic password'}:action==='enroll'?{}:{factorId};
  const f=fixture({providerFailure:true,factors:action==='unenroll'?[{id:factorId,status:'verified',type:'totp'},{id:subject,status:'verified',type:'totp'}]:[]});
  const response=await f.request(action,input);assert.equal(response.status,503,action);assert.ok(!(await response.text()).includes('sensitive upstream'));
 }
 const unavailable=fixture({dbFailure:true});assert.equal((await unavailable.request('verify',{factorId,challengeId:sessionId,code:'123456'})).status,503);
 assert.ok(!unavailable.calls.some(c=>c.name==='provider.verify'));
 const lower=fixture({failAction:'mfa.reserve'});assert.equal((await lower.request('unenroll',{factorId})).status,401);
});
test('role controller accepts reasoned target changes, never accepts actor identity and records logout outcomes',async()=>{
 const f=fixture();
 for(const [action,input] of [['lookup',{targetUserId:subject}],['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'ADMIN',reason:'A valid synthetic review reason',expiresAt:null}],
  ['request',{targetUserId:subject,expectedAssignmentId:sessionId,role:'ADMIN',reason:'A valid synthetic review reason',expiresAt:'2026-10-17T12:00:00Z'}],
  ['approve',{requestId:subject}],['execute',{requestId:subject}],['requests',{}],['events',{}],
  ['recovery-request',{reason:'Synthetic lost authenticator'}],['recovery-approve',{requestId:subject}],['logout',{}],['password-update',{password:'synthetic password'}]] as const)assert.equal((await f.request(action,input)).status,200,action);
 assert.ok(f.calls.some(c=>c.name==='logout.result'&&c.input!.outcome==='success'));
 const fail=fixture({providerFailure:true});assert.equal((await fail.request('logout')).status,503);
 assert.ok(fail.calls.some(c=>c.name==='logout.result'&&c.input!.outcome==='failure'));
 assert.equal((await fail.request('password-update',{password:'synthetic password'})).status,503);
 assert.ok(fail.calls.some(c=>c.name==='password.result'&&c.input!.outcome==='failure'));
 assert.equal((await f.request('protected',{capability:'payment.release'})).status,404,'No financial action is implemented by a guard');
});
test('security command transport parameterizes input and redacts database/unknown failures',async()=>{
 let returned:unknown={ok:true,data:{role:'ADMIN'},auditId:subject};
 let error:unknown;let count=1;
 const db:SqlExecutor={async query<Row extends Record<string,unknown>>(sql:string,parameters:readonly SqlParameter[]){
  assert.equal(sql,securityCommandStatement);assert.equal(parameters[0],'status');assert.deepEqual(JSON.parse(parameters[1] as string),{});
  assert.equal(JSON.parse(parameters[2] as string).subject,subject);if(error)throw error;
  return {rows:Array(count).fill({result:returned}) as Row[],rowCount:count};
 }};
 const run=()=>createSecurityCommands(db,config).run('status',{},identity,sessionId);
 assert.equal((await run()).auditId,subject);
 for(const code of ['UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED']) {
  returned={ok:false,error:code};await assert.rejects(run(),{code});
 }
 returned={ok:false,error:'sensitive detail'};await assert.rejects(run(),{code:'IDENTITY_UNAVAILABLE'});
 for(const row of [null,[],true]){returned=row;await assert.rejects(run(),{code:'AUDIT_UNAVAILABLE'});}
 returned={ok:true,auditId:subject};count=0;await assert.rejects(run(),{code:'AUDIT_UNAVAILABLE'});count=2;await assert.rejects(run(),{code:'AUDIT_UNAVAILABLE'});
 count=1;error=new Error('private connection string');await assert.rejects(run(),{code:'AUDIT_UNAVAILABLE'});
});
