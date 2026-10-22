// Real local Supabase Auth, synthetic identities only. No hosted target or mock responses.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes,randomUUID,createHmac,createDecipheriv,hkdfSync,createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import pg from 'pg';
import {checkProviderMfaGuard} from './provider-mfa-guard-check.mjs';
import {checkGenuineWorkflowAuth} from './order-workflow-auth-check.mjs';
const runFile=promisify(execFile),root=resolve('.');
const webRequire=createRequire(resolve('apps/web/package.json'));
const {createClient}=webRequire('@supabase/supabase-js');
const nativeFetch=globalThis.fetch,ts=webRequire('typescript'),modules=new Map();
function load(path){
 if(modules.has(path))return modules.get(path).exports;
 const module={exports:{}};modules.set(path,module);
 const source=ts.transpileModule(readFileSync(path,'utf8').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(path).href)),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 function localRequire(name){
  if(name==='server-only')return {};
  if(name.startsWith('@backend/'))return load(resolve(root,'src/backend',name.slice(9)));
  if(name.startsWith('@/'))return load(resolve(root,'apps/web/src',`${name.slice(2)}.ts`));
  if(name.startsWith('.')){const target=resolve(dirname(path),name);return load(/\.[cm]?[jt]sx?$/.test(target)?target:`${target}.ts`);}
  return webRequire(name);
 }
 vm.runInThisContext(`(function(require,module,exports){${source}\n})`,{filename:path})(localRequire,module,module.exports);
 return module.exports;
}
const authImage='supabase/gotrue@sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b';
const dbImage='postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873';
const runId=randomUUID().replaceAll('-',''),prefix=`vi-mfa-${runId.slice(0,12)}`;
const folder=resolve('.private',prefix),authOrigin='http://127.0.0.1:55391',dbPort=55392;
const issuer='https://abcdefghijklmnopqrst.supabase.co/auth/v1';
const privateValues=[];const secret=()=>{const value=randomBytes(32).toString('hex');privateValues.push(value);return value;};
const databasePassword=secret(),authPassword=secret(),jwtSecret=secret(),encryptionKey=randomBytes(32).toString('base64url');
privateValues.push(encryptionKey);
const created=[];let networkCreated=false,client,appClient,stage='prepare',checks=0;
const report={check:'genuine_local_supabase_mfa',date:new Date().toISOString(),status:'blocked',
 authImage,dbImage,checks:[],limits:['Local real Auth engine with synthetic identities','Not managed-cloud, email delivery, browser QR scan or Vercel acceptance']};
const docker=async(...args)=>(await runFile('docker',args,{timeout:60000,maxBuffer:2*1024*1024,windowsHide:true})).stdout.trim();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,name){if(!value)throw new Error(name);checks++;report.checks.push({name,status:'pass'});}
function signed(claims){const head=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
 const body=Buffer.from(JSON.stringify(claims)).toString('base64url');const data=`${head}.${body}`;
 const token=`${data}.${createHmac('sha256',jwtSecret).update(data).digest('base64url')}`;privateValues.push(token);return token;}
function totp(base32,time=Math.floor(Date.now()/1000)){
 let bits='',bytes=[];for(const c of base32.replace(/=+$/,'').toUpperCase()){
  const digit='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c);if(digit<0)throw new Error('invalid_private_totp_key');bits+=digit.toString(2).padStart(5,'0');}
 for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/30)));
 const hash=createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=hash[19]&15;
 const code=String((hash.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');privateValues.push(code);return code;
}
async function until(work,seconds,label){for(let i=0;i<seconds*2;i++){try{const value=await work();if(value)return value;}catch{}await pause(500);}throw new Error(label);}
async function container(name,image,envFile,publish,extra=[]){
 const id=await docker('create','--name',name,'--label',`virtualink.genuine-mfa=${runId}`,
  '--network',prefix,'--memory','512m','--cpus','1','--env-file',envFile,'-p',publish,...extra,image);
 if(!/^[a-f0-9]{64}$/.test(id))throw new Error('invalid_container_id');created.push(id);
 await docker('start',id);
 const ports=JSON.parse(await docker('inspect','--format','{{json .NetworkSettings.Ports}}',id));
 const expected=publish.split(':');
 if(!Array.isArray(ports[`${expected[2]}/tcp`])||!ports[`${expected[2]}/tcp`].every(port=>port.HostIp==='127.0.0.1'&&port.HostPort===expected[1]))throw new Error('loopback_binding_required');
 return id;
}
try{
 if(JSON.parse(await readFile(resolve('package.json'),'utf8')).name!=='virtual-ink')throw new Error('wrong_workspace');
 await mkdir(folder,{recursive:true});await mkdir('coverage',{recursive:true});
 await writeFile(resolve(folder,'database.env'),`POSTGRES_PASSWORD=${databasePassword}\nPOSTGRES_DB=postgres\n`);
 await docker('network','create','--label',`virtualink.genuine-mfa=${runId}`,prefix);networkCreated=true;
 stage='start_database';
 await container(`${prefix}-db`,dbImage,resolve(folder,'database.env'),`127.0.0.1:${dbPort}:5432`,['--network-alias','db']);
 client=await until(async()=>{const c=new pg.Client({host:'127.0.0.1',port:dbPort,database:'postgres',user:'postgres',password:databasePassword,
  ssl:false,connectionTimeoutMillis:1500,statement_timeout:10000});try{await c.connect();return c;}catch{await c.end().catch(()=>{});return undefined;}},30,'database_unavailable');
 console.log('Passed: disposable local database started.');
 // All SQL literals here are generated hex, never user data or shell interpolation.
 await client.query(`CREATE ROLE supabase_auth_admin NOLOGIN NOSUPERUSER NOBYPASSRLS;
  CREATE ROLE vi_local_auth LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${authPassword}';
  GRANT supabase_auth_admin TO vi_local_auth;
  CREATE SCHEMA auth AUTHORIZATION vi_local_auth; GRANT CREATE ON DATABASE postgres TO vi_local_auth;
  ALTER ROLE vi_local_auth SET search_path=auth,public;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
 const authEnvironment={API_EXTERNAL_URL:issuer,GOTRUE_API_HOST:'0.0.0.0',GOTRUE_API_PORT:'9999',PORT:'9999',
  GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:`postgres://vi_local_auth:${authPassword}@db:5432/postgres?sslmode=disable`,
  GOTRUE_SITE_URL:'https://virtual-ink-local.example.test',GOTRUE_JWT_SECRET:jwtSecret,GOTRUE_JWT_ISSUER:issuer,
  GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_ADMIN_ROLES:'service_role',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_EXP:'3600',
  GOTRUE_DISABLE_SIGNUP:'true',GOTRUE_EXTERNAL_EMAIL_ENABLED:'true',GOTRUE_MAILER_AUTOCONFIRM:'false',GOTRUE_LOG_LEVEL:'error',
  GOTRUE_MFA_TOTP_ENROLL_ENABLED:'true',GOTRUE_MFA_TOTP_VERIFY_ENABLED:'true',
  GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPT:'true',GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY_ID:'local-test',
  GOTRUE_SECURITY_DB_ENCRYPTION_ENCRYPTION_KEY:encryptionKey,GOTRUE_SECURITY_DB_ENCRYPTION_DECRYPTION_KEYS:`local-test:${encryptionKey}`};
 await writeFile(resolve(folder,'auth.env'),Object.entries(authEnvironment).map(([key,value])=>`${key}=${value}`).join('\n')+'\n');
 stage='start_auth';const originalAuth=await container(`${prefix}-auth`,authImage,resolve(folder,'auth.env'),'127.0.0.1:55391:9999');
 const health=await until(async()=>{const r=await fetch(`${authOrigin}/health`,{signal:AbortSignal.timeout(1500)});return r.ok?await r.json():undefined;},40,'auth_unavailable');
 report.providerVersion=health.version;console.log('Passed: real local Auth engine started; synthetic checks beginning.');
 let providerVerifications=0;
 const transport=async(input,init)=>{const url=new URL(typeof input==='string'?input:input.url??String(input));
  if(url.origin!=='https://abcdefghijklmnopqrst.supabase.co'||!url.pathname.startsWith('/auth/v1/'))throw new Error('external_target_refused');
  const destination=new URL(url.pathname.slice('/auth/v1'.length)+url.search,authOrigin);
  if(url.pathname.endsWith('/verify'))providerVerifications++;
  return nativeFetch(destination,{...init,redirect:'error',signal:AbortSignal.timeout(8000)});
 };
 const now=Math.floor(Date.now()/1000),adminToken=signed({iss:issuer,role:'service_role',aud:'authenticated',iat:now,exp:now+3600});
 const options={global:{fetch:transport},auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
 const admin=createClient('https://abcdefghijklmnopqrst.supabase.co',adminToken,options);
 const userClient=createClient('https://abcdefghijklmnopqrst.supabase.co','sb_publishable_local_fixture',options);
 const email=`synthetic-${runId}@example.invalid`,password=secret();
 stage='create_synthetic_identity';
 const createdUser=await admin.auth.admin.createUser({email,password,email_confirm:true});check(!createdUser.error&&createdUser.data.user,'provider_created_synthetic_identity');
 const userId=createdUser.data.user.id;
 stage='primary_login';const login=await userClient.auth.signInWithPassword({email,password});check(!login.error&&login.data.session,'genuine_primary_password_login');
 if(login.data.session){privateValues.push(login.data.session.access_token,login.data.session.refresh_token);}
 check((await userClient.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel==='aal1','primary_session_is_aal1');
 stage='enrollment';const enrolled=await userClient.auth.mfa.enroll({factorType:'totp',issuer:'Virtual Ink local test'});
 check(!enrolled.error&&enrolled.data?.totp?.secret&&enrolled.data.totp.qr_code,'provider_generated_totp_and_qr');
 const factorId=enrolled.data.id,totpSecret=enrolled.data.totp.secret;privateValues.push(totpSecret);
 const validWindow=[-30,0,30].map(offset=>totp(totpSecret,Math.floor(Date.now()/1000)+offset));
 let expiredOffset=300,expiredCode=totp(totpSecret,Math.floor(Date.now()/1000)-expiredOffset);
 while(validWindow.includes(expiredCode)){expiredOffset+=30;expiredCode=totp(totpSecret,Math.floor(Date.now()/1000)-expiredOffset);}
 const invalidCode=['000000','111111','222222','333333'].find(code=>!validWindow.includes(code));privateValues.push(invalidCode);
 stage='invalid_code';let challenge=await userClient.auth.mfa.challenge({factorId});check(!challenge.error,'provider_challenge_created');
 let verified=await userClient.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:invalidCode});check(!!verified.error,'provider_rejects_invalid_code');
 stage='expired_code';challenge=await userClient.auth.mfa.challenge({factorId});
 verified=await userClient.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:expiredCode});check(!!verified.error,'provider_rejects_expired_totp');
 stage='expired_challenge';challenge=await userClient.auth.mfa.challenge({factorId});
 await client.query("UPDATE auth.mfa_challenges SET created_at=clock_timestamp()-interval '10 minutes' WHERE id=$1",[challenge.data.id]);
 verified=await userClient.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:totp(totpSecret)});check(!!verified.error,'provider_rejects_expired_challenge');
 stage='valid_verification';challenge=await userClient.auth.mfa.challenge({factorId});
 verified=await userClient.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:totp(totpSecret)});
 check(!verified.error&&verified.data?.access_token,'provider_verifies_valid_totp');
 privateValues.push(verified.data.access_token,verified.data.refresh_token);
 check((await userClient.auth.mfa.getAuthenticatorAssuranceLevel()).data?.currentLevel==='aal2','provider_establishes_aal2');
 check((await userClient.auth.mfa.listFactors()).data?.totp.some(f=>f.id===factorId&&f.status==='verified'),'provider_marks_factor_verified');
 stage='replay';const replay=await userClient.auth.mfa.verify({factorId,challengeId:challenge.data.id,code:totp(totpSecret)});
 check(!!replay.error,'provider_rejects_same_challenge_replay');
 // Record cross-challenge behavior separately; the application has its own durable reservation.
 const another=await userClient.auth.mfa.challenge({factorId});
 const repeated=await userClient.auth.mfa.verify({factorId,challengeId:another.data.id,code:totp(totpSecret)});
 report.unhookedProviderCrossChallengeReplayRejected=!!repeated.error;
 if(repeated.data?.access_token)privateValues.push(repeated.data.access_token,repeated.data.refresh_token);
 stage='encrypted_storage';const stored=await client.query('SELECT secret FROM auth.mfa_factors WHERE id=$1',[factorId]);
 check(stored.rows.length===1&&!stored.rows[0].secret.includes(totpSecret)&&stored.rows[0].secret.length>totpSecret.length&&!/^[A-Z2-7]+=*$/.test(stored.rows[0].secret),'provider_secret_encrypted_at_rest');
 const sealed=JSON.parse(stored.rows[0].secret);
 if(sealed.alg!=='aes-gcm-hkdf'||sealed.key_id!=='local-test'||Buffer.from(sealed.nonce,'base64').length!==12)throw new Error('unexpected_encryption_format');
 const ciphertext=Buffer.from(sealed.data,'base64');
 const cipher=createDecipheriv('aes-256-gcm',hkdfSync('sha256',Buffer.from(encryptionKey,'base64url'),Buffer.alloc(0),Buffer.from(factorId),32),Buffer.from(sealed.nonce,'base64'));
 cipher.setAuthTag(ciphertext.subarray(-16));
 check(Buffer.concat([cipher.update(ciphertext.subarray(0,-16)),cipher.final()]).toString()===totpSecret,'provider_encryption_authentically_protects_original_totp');
 stage='application_authority_boundary';
 await client.query('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;');
 for(const name of(await readdir(resolve('supabase/migrations'))).filter(name=>name.endsWith('.sql')).sort()){
  if(name>='20261016122143_virtual_ink_provider_mfa_guard.sql')continue; // Apply follow-up security migrations after the twelve-migration baseline.
  await client.query(await readFile(resolve('supabase/migrations',name),'utf8'));
 }
 const appUser=randomUUID(),assignmentId=randomUUID();
 await client.query('BEGIN');
 await client.query('INSERT INTO virtual_ink.users(id) VALUES($1)',[appUser]);
 await client.query("INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase',$1,$2,$3)",[issuer,userId,appUser]);
 await client.query("INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome) VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('e',64),$1,'created')",[appUser]);
 await client.query("INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code) VALUES($1,$2,'SUPER_ADMIN',$2,gen_random_uuid(),'synthetic_provider_test')",[assignmentId,appUser]);
 await client.query("INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id) SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid() FROM virtual_ink_phase1.role_assignments WHERE id=$1",[assignmentId]);
 await client.query("UPDATE virtual_ink_security.configuration SET enabled=true,environment='local',issuer=$1",[issuer]);
 await client.query('COMMIT');
 const currentClaims=(await userClient.auth.getClaims()).data.claims;
 const nativeContext={issuer,environment:'local',subject:userId,sessionId:currentClaims.session_id,aal:currentClaims.aal,
  mfaAt:currentClaims.amr.find(m=>m.method==='totp')?.timestamp,primaryAt:currentClaims.amr.find(m=>m.method==='password')?.timestamp,
  stepUpAt:null,correlationId:randomUUID()};
 await client.query('BEGIN');await client.query('SET LOCAL ROLE virtual_ink_security_service');
 const authority=(await client.query("SELECT virtual_ink_security.command('protected.check',$1,$2) AS result",[{capability:'security.read'},nativeContext])).rows[0].result;
 await client.query('COMMIT');
 report.outOfBandProviderProofAccepted=authority.ok===true;
 report.nativeGuardDiagnostics=(await client.query(`SELECT s.aal::text AS session_aal,
   s.factor_id IS NOT NULL AS factor_present,
   (SELECT floor(extract(epoch FROM updated_at))::bigint=$3 FROM auth.mfa_amr_claims WHERE session_id=s.id AND authentication_method='totp') AS mfa_time_matches,
   (SELECT floor(extract(epoch FROM updated_at))::bigint=$4 FROM auth.mfa_amr_claims WHERE session_id=s.id AND authentication_method='password') AS primary_time_matches
   FROM auth.sessions s WHERE id=$1 AND user_id=$2`,[currentClaims.session_id,userId,nativeContext.mfaAt,nativeContext.primaryAt])).rows;
 report.authRls=(await client.query("SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='auth' AND c.relname IN('users','sessions','mfa_factors','mfa_amr_claims') ORDER BY c.relname")).rows;
 report.rootProviderGuard=(await client.query('SELECT virtual_ink_security.provider_session($1,$2,$3,$4,true,true) AS allowed',[userId,currentClaims.session_id,nativeContext.mfaAt,nativeContext.primaryAt])).rows[0].allowed;
 check(authority.ok===false&&authority.error==='UNAUTHENTICATED','application_rejects_out_of_band_provider_proof');
 check(report.rootProviderGuard===true,'real_provider_guard_accepts_live_aal2');
 const appPassword=secret();
 await client.query(`CREATE ROLE vi_security_test LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '${appPassword}'; GRANT virtual_ink_security_service TO vi_security_test;`);
 appClient=new pg.Client({host:'127.0.0.1',port:dbPort,database:'postgres',user:'vi_security_test',password:appPassword,ssl:false,statement_timeout:10000});
 await appClient.connect();
 let denied=false;try{await appClient.query('SELECT secret FROM auth.mfa_factors');}catch(error){denied=error.code==='42501';}
 check(denied,'runtime_cannot_read_auth_secrets');
 denied=false;try{await appClient.query("UPDATE virtual_ink_phase1.role_assignments SET role='SUPER_ADMIN'");}catch(error){denied=error.code==='42501';}
 check(denied,'runtime_cannot_directly_write_roles');
 denied=false;try{await appClient.query('SELECT virtual_ink_security.provider_session($1,$2,$3,$4,true,true)',[userId,currentClaims.session_id,nativeContext.mfaAt,nativeContext.primaryAt]);}catch(error){denied=error.code==='42501';}
 check(denied,'runtime_cannot_call_private_provider_broker');
 stage='load_core';const core=load(resolve(root,'src/backend/identity/security-admin.ts'));
 stage='load_web_gateway';const {securityAuthGateway}=load(resolve(root,'apps/web/src/lib/security-admin.ts'));
 const config={origin:'https://virtual-ink-local.example.test',projectUrl:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_local_fixture',environment:'local',codeKey:secret()};
 const commands=core.createSecurityCommands(appClient,config);
 function actor(sdk,id,subject,assignment){
  const cookies=new Map(),writes=[];
  const auth=securityAuthGateway(sdk,config,{get:name=>cookies.get(name),set:cookie=>{writes.push(cookie);cookie.value?cookies.set(cookie.name,cookie.value):cookies.delete(cookie.name);}});
  async function request(action,input={}){
   const response=await core.securityResponse(new Request(`${config.origin}/api/security/${action}`,{method:'POST',headers:{origin:config.origin,'content-type':'application/json','sec-fetch-site':'same-origin'},body:JSON.stringify(input)}),action,async()=>({config,auth,commands}));
   const body=await response.json();
   check(!/"(?:access_token|refresh_token|secret|password)"\s*:|"code"\s*:\s*"\d{6}"/.test(JSON.stringify(body)),`safe_${action}_response_${checks}`);
    return {status:response.status,body,cacheControl:response.headers.get('cache-control')};
  }
  return {sdk,id,subject,assignment,cookies,writes,auth,request};
 }
 stage='bind_real_gateway';globalThis.fetch=transport;
 const first=actor(userClient,appUser,userId,assignmentId);
 check((await first.request('lookup',{targetUserId:appUser})).status===401,'native_aal2_without_application_proof_denied');
 const oldCode=totp(totpSecret);
 await until(()=>totp(totpSecret)!==oldCode,35,'fresh_totp_window_unavailable');
 stage='real_application_step_up';
 let appChallenge=await first.request('challenge',{factorId});
 check(appChallenge.status===200,'application_challenge_with_live_provider');
 const applicationCode=totp(totpSecret);
 let appVerified=await first.request('verify',{factorId,challengeId:appChallenge.body.data.challengeId,code:applicationCode});
 check(appVerified.status===200,'application_verifies_genuine_totp');
 const cookie=first.writes.find(c=>c.name==='__Host-vi-step-up'&&c.value);
 check(cookie?.options.httpOnly&&cookie.options.secure&&cookie.options.sameSite==='strict'&&cookie.options.path==='/'&&cookie.options.maxAge<=300,'signed_step_up_cookie_is_restricted');
 check((await first.auth.identity()).stepUpAt!==null,'application_binds_proof_to_verified_session');
 check((await first.request('lookup',{targetUserId:appUser})).status===200,'restricted_database_accepts_genuine_application_step_up');
 first.cookies.delete(cookie.name);
 check((await first.request('lookup',{targetUserId:appUser})).status===401,'removing_application_proof_denies_live_aal2');
 first.cookies.set(cookie.name,cookie.value.slice(0,-1)+(cookie.value.endsWith('a')?'b':'a'));
 check((await first.request('lookup',{targetUserId:appUser})).status===401,'tampered_application_proof_denied');
 first.cookies.set(cookie.name,cookie.value);
 check((await first.request('lookup',{targetUserId:appUser})).status===200,'restored_valid_proof_succeeds');
 appChallenge=await first.request('challenge',{factorId});
 const beforeReplay=providerVerifications;
 appVerified=await first.request('verify',{factorId,challengeId:appChallenge.body.data.challengeId,code:applicationCode});
 check(appVerified.status===401&&providerVerifications===beforeReplay,'cross_challenge_replay_blocked_before_provider');
 // Exercise one fixed budget immediately after the new 30-second TOTP window,
 // before waiting for the role expiry. This avoids crossing its five-minute bucket.
 stage='real_application_rate_limit';
 const invalids=['444444','555555','666666','777777','888888','999999','123456'].filter(code=>![-30,0,30].map(offset=>totp(totpSecret,Math.floor(Date.now()/1000)+offset)).includes(code));
 for(const code of invalids.slice(0,3))check((await first.request('verify',{factorId,challengeId:appChallenge.body.data.challengeId,code})).status===401,'invalid_application_code_rejected');
 const beforeLimit=providerVerifications;
 check((await first.request('verify',{factorId,challengeId:appChallenge.body.data.challengeId,code:invalids[3]})).status===429&&providerVerifications===beforeLimit,'repeated_failures_rate_limited_before_provider');
 check((await client.query("SELECT count(*)::int AS count FROM virtual_ink_security.events WHERE subject=$1 AND severity='alert' AND outcome='failure'",[userId])).rows[0].count>=1,'repeated_mfa_failures_create_security_alert');
 async function createActor(label,role){
  const identityEmail=`synthetic-${label}-${runId}@example.invalid`,identityPassword=secret();
  const result=await admin.auth.admin.createUser({email:identityEmail,password:identityPassword,email_confirm:true});
  if(result.error)throw new Error('synthetic_identity_creation_failed');
  const subject=result.data.user.id,id=randomUUID(),assignment=randomUUID();
  await client.query('BEGIN');
  await client.query('INSERT INTO virtual_ink.users(id) VALUES($1)',[id]);
  await client.query("INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase',$1,$2,$3)",[issuer,subject,id]);
  await client.query("INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome) VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('e',64),$1,'created')",[id]);
  await client.query('INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code) VALUES($1,$2,$3,$4,gen_random_uuid(),\'synthetic_provider_test\')',[assignment,id,role,appUser]);
  await client.query("INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id) SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid() FROM virtual_ink_phase1.role_assignments WHERE id=$1",[assignment]);
  await client.query('COMMIT');
  const sdk=createClient(config.projectUrl,config.publishableKey,options);
  if((await sdk.auth.signInWithPassword({email:identityEmail,password:identityPassword})).error)throw new Error('synthetic_primary_login_failed');
  const fixture=actor(sdk,id,subject,assignment);
  fixture.login=async()=>sdk.auth.signInWithPassword({email:identityEmail,password:identityPassword});
  return fixture;
 }
 stage='real_application_enrollment';
 const second=await createActor('approver','SUPER_ADMIN'),target=await createActor('target','CUSTOMER');
 check((await second.request('lookup',{targetUserId:appUser})).status===401,'aal1_administrator_denied_sensitive_read');
 let secondSecret;
 const originalEnroll=second.sdk.auth.mfa.enroll.bind(second.sdk.auth.mfa);
 // Observe the real provider response for this synthetic authenticator; never replace it.
 second.sdk.auth.mfa.enroll=async input=>{const response=await originalEnroll(input);secondSecret=response.data?.totp?.secret;if(secondSecret)privateValues.push(secondSecret);
  report.providerQrShape={length:response.data?.totp?.qr_code?.length,expectedPrefix:response.data?.totp?.qr_code?.startsWith('data:image/svg+xml;utf-8,')};return response;};
 const appEnrollment=await second.request('enroll');
  report.applicationEnrollment={status:appEnrollment.status,qrReturned:typeof appEnrollment.body.data?.qr==='string',observedRealSecret:!!secondSecret,manualKeyReturned:typeof appEnrollment.body.data?.manualKey==='string',
  providerErrorCode:appEnrollment.body.error?.code??null};
  check(appEnrollment.status===200&&appEnrollment.body.data.qr.startsWith('data:image/svg+xml;base64,')&&!!secondSecret,'application_real_enrollment_returns_private_qr');
  check(appEnrollment.body.data.manualKey===secondSecret&&/^[A-Z2-7]{16,256}$/.test(secondSecret),'manual_enrollment_key_matches_genuine_provider_secret');
  check(appEnrollment.cacheControl==='private, no-store, max-age=0'&&!JSON.stringify(second.writes).includes(secondSecret),'manual_enrollment_key_is_not_cached_or_written_to_cookies');
 const secondFactor=appEnrollment.body.data.factorId;
 second.totpSecret=secondSecret;
 const secondChallenge=await second.request('challenge',{factorId:secondFactor});
 check(secondChallenge.status===200,'second_administrator_challenge');
 check((await second.request('verify',{factorId:secondFactor,challengeId:secondChallenge.body.data.challengeId,code:totp(secondSecret)})).status===200,'second_administrator_genuine_step_up');
 stage='real_role_change';
 const expiry=new Date(Date.now()+20000).toISOString();
 let change=await first.request('request',{targetUserId:target.id,expectedAssignmentId:target.assignment,role:'ADMIN',reason:'Synthetic temporary privilege integration check',expiresAt:expiry});
 check(change.status===200,'genuine_mfa_role_request');
 const requestId=change.body.data.data.requestId;
 check((await first.request('approve',{requestId})).status===403,'same_requester_cannot_approve');
 check((await second.request('approve',{requestId})).status===200,'distinct_genuine_mfa_approver');
 change=await first.request('execute',{requestId});
 check(change.status===200,'dual_approved_role_write_through_private_database');
 check((await target.request('status')).status===401,'granted_role_invalidates_old_provider_session');
 check((await target.login()).error===null,'target_reauthenticates_after_role_change');
 const status=await target.request('status');
 check(status.status===200&&status.body.data.role==='ADMIN','temporary_role_is_effective_after_fresh_login');
 check((await target.request('request',{targetUserId:target.id,expectedAssignmentId:target.assignment,role:'SUPER_ADMIN',reason:'Synthetic prohibited escalation test',expiresAt:null})).status!==200,'new_admin_cannot_promote_itself');
 await until(()=>Date.now()>Date.parse(expiry)+100,25,'temporary_expiry_not_reached');
 check((await target.request('status')).status===403,'expired_grant_loses_access_with_valid_session');
 const targetLookup=await first.request('lookup',{targetUserId:target.id});
 const removal=await first.request('request',{targetUserId:target.id,expectedAssignmentId:targetLookup.body.data.data.assignmentId,role:'CUSTOMER',reason:'Synthetic removal of expired temporary privilege',expiresAt:null});
 check(removal.status===200,'role_removal_request');
 const removalId=removal.body.data.data.requestId;
 check((await second.request('approve',{requestId:removalId})).status===200,'role_removal_approved');
 check((await first.request('execute',{requestId:removalId})).status===200,'role_removal_executed');
 check((await target.request('status')).status===401,'role_removal_revokes_stale_session_immediately');
 const audit=(await client.query("SELECT count(*)::int AS count FROM virtual_ink_security.events WHERE target_id=$1 AND action='role.execute' AND outcome='success' AND requester=$2 AND approver=$3 AND executor=$2 AND reason IS NOT NULL AND assurance='aal2' AND source='web-admin' AND jsonb_array_length(previous_roles)=1 AND jsonb_array_length(new_roles)=1",[target.id,first.id,second.id])).rows[0];
 check(audit.count===2,'genuine_role_grant_and_removal_are_fully_audited');
 stage='logout';check((await first.request('logout')).status===200,'application_audits_real_provider_logout');
 const sessions=await client.query('SELECT count(*) FROM auth.sessions WHERE user_id=$1',[userId]);
 check(sessions.rows[0].count==='0','provider_logout_removed_session');
 check((await client.query("SELECT count(*)::int AS count FROM virtual_ink_security.events WHERE subject=$1 AND action='logout' AND outcome='success'",[userId])).rows[0].count===1,'logout_success_audit');
 stage='local_log_privacy';
 let safeLogs=true;
 for(const id of created){const captured=await runFile('docker',['logs',id],{timeout:10000,maxBuffer:2*1024*1024,windowsHide:true});
  const logs=captured.stdout+captured.stderr;
  if(privateValues.some(value=>value.length>=20&&logs.includes(value))||/"(?:access_token|refresh_token|totp_secret|password)"\s*:|"code"\s*:\s*"\d{6}"/.test(logs))safeLogs=false;
 }
 check(safeLogs,'local_provider_logs_exclude_generated_secrets_and_tokens');
 report.baselineChecks=checks;
 stage='provider_hook_start';
 await client.query(await readFile(resolve('supabase/migrations/20261016122143_virtual_ink_provider_mfa_guard.sql'),'utf8'));
 await client.query(await readFile(resolve('supabase/migrations/20261016173857_virtual_ink_authenticator_replacement.sql'),'utf8'));
 await client.query("UPDATE virtual_ink_auth_guard.settings SET enabled=true,environment='local'");
 await docker('stop','--timeout','10',originalAuth);
 // All synthetic accounts share one loopback IP. Raise only this fixture's IP
 // budget so it cannot mask the hook's per-account and concurrent denial tests.
 const guardedEnvironment={...authEnvironment,GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY:'60',GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED:'true',
  GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI:'pg-functions://postgres/virtual_ink_auth_guard/mfa_verification_attempt'};
 await writeFile(resolve(folder,'guarded-auth.env'),Object.entries(guardedEnvironment).map(([key,value])=>`${key}=${value}`).join('\n')+'\n');
 await container(`${prefix}-guarded-auth`,authImage,resolve(folder,'guarded-auth.env'),'127.0.0.1:55391:9999');
 await until(async()=>{const response=await nativeFetch(`${authOrigin}/health`,{signal:AbortSignal.timeout(1500)});return response.ok;},40,'guarded_auth_unavailable');
 stage='provider_hook_checks';
 await checkProviderMfaGuard({database:client,nativeDatabase:{host:'127.0.0.1',port:dbPort,database:'postgres',user:'vi_local_auth',password:authPassword,ssl:false},
  admin,createClient,options,issuer,config,transport,totp,secret,privateValues,check,second,until,
  createApplicationActor:(label,role='CUSTOMER')=>createActor(label,role),record:result=>{report.hookDiagnostics={...report.hookDiagnostics,...result};}});
 report.hookedProviderCrossChallengeReplayRejected=true;
 stage='workflow_auth_checks';
 const workflowMigration=await readFile(resolve('supabase/migrations/20261021095139_virtual_ink_order_workflows.sql'),'utf8');
 report.workflowMigrationSha256=createHash('sha256').update(workflowMigration.replace(/\r\n/g,'\n').replace(/^\uFEFF/,'')).digest('hex');
 await client.query(workflowMigration);
  const dashboardMigration=await readFile(resolve('supabase/migrations/20261021204416_virtual_ink_order_dashboards.sql'),'utf8');
  report.dashboardMigrationSha256=createHash('sha256').update(dashboardMigration.replace(/\r\n/g,'\n').replace(/^\uFEFF/,'')).digest('hex');
  await client.query(dashboardMigration);
 const workflowStart=checks;
 await checkGenuineWorkflowAuth({database:client,applicationDatabase:appClient,createActor,
    core:{...load(resolve(root,'src/backend/orders/workflow.ts')),...load(resolve(root,'src/backend/orders/dashboard.ts'))},check,privateValues,totp,config});
 report.workflowAuthChecks=checks-workflowStart;
 stage='provider_hook_log_privacy';
 for(const id of created){const captured=await runFile('docker',['logs',id],{timeout:10000,maxBuffer:2*1024*1024,windowsHide:true});
  const logs=captured.stdout+captured.stderr;
  if(privateValues.some(value=>typeof value==='string'&&value.length>=20&&logs.includes(value))||/"(?:access_token|refresh_token|totp_secret|password)"\s*:|"code"\s*:\s*"\d{6}"/.test(logs))safeLogs=false;
 }
 check(safeLogs,'native_hook_logs_exclude_generated_secrets_and_tokens');
 report.providerGuardChecks=checks-report.baselineChecks-report.workflowAuthChecks;
 report.status='pass';report.countedChecks=checks;
}catch(error){report.status='blocked';report.failedStage=stage;report.errorCode=typeof error?.code==='string'&&/^[A-Z0-9_]{1,30}$/.test(error.code)?error.code:'LOCAL_CHECK_FAILED';
 report.errorType=['Error','TypeError','ReferenceError','SyntaxError'].includes(error?.name)?error.name:'OtherError';
 report.errorLocations=String(error?.stack??'').split('\n').slice(1).map(line=>line.match(/([a-zA-Z0-9_-]+\.(?:mjs|js|ts)):(\d+):(\d+)/)?.slice(1)).filter(Boolean).slice(0,4);
 if(typeof error?.message==='string'&&/^[a-z_]{1,60}$/.test(error.message))report.failedCheck=error.message;
 if(['start_database','start_auth'].includes(stage)&&typeof error?.stderr==='string'){
  let diagnostic=error.stderr;for(const value of privateValues.filter(v=>typeof v==='string'&&v.length>=12))diagnostic=diagnostic.replaceAll(value,'[REDACTED]');
  report.startupDiagnostic=diagnostic.slice(-1600);
 }
}
finally{
 globalThis.fetch=nativeFetch;
 if(appClient)await appClient.end().catch(()=>{});
 if(client)await client.end().catch(()=>{});
 const cleanup=[];
 for(const id of created.reverse()){
  try{
   const label=await docker('inspect','--format',`{{index .Config.Labels "virtualink.genuine-mfa"}}`,id);
   if(label!==runId){cleanup.push(false);continue;}
   if(report.status!=='pass'&&['start_database','start_auth'].includes(stage)){
    const captured=await runFile('docker',['logs','--tail','12',id],{timeout:10000,maxBuffer:65536,windowsHide:true}).catch(error=>({stdout:String(error.stdout??''),stderr:String(error.stderr??'')}));
    let diagnostic=captured.stdout+captured.stderr;
    for(const value of privateValues.filter(v=>typeof v==='string'&&v.length>=12))diagnostic=diagnostic.replaceAll(value,'[REDACTED]');
    report.startupLogs??=[];report.startupLogs.push(diagnostic.slice(-1600));
   }
   await docker('stop','--time','10',id);await docker('rm','-v',id);cleanup.push(true);
  }catch{cleanup.push(false);}
 }
 if(networkCreated){try{await docker('network','rm',prefix);cleanup.push(true);}catch{cleanup.push(false);}}
 report.cleanupPassed=cleanup.every(Boolean);
 if(!report.cleanupPassed)report.status='blocked';
 await mkdir('coverage',{recursive:true});await writeFile('coverage/genuine-mfa-local.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,checks:undefined,lastChecks:report.checks.slice(-5)},null,2));process.exitCode=report.status==='pass'?0:1;
}
