import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ApiError, type ErrorCode } from '../api/errors.ts';
import { handleApi } from '../api/responses.ts';
import { boundedText, readJson, strictObject, uuid } from '../api/validation.ts';
import type { SqlExecutor } from '../database/ports.ts';
import { loadWebAuthConfig, type WebAuthConfig } from './web-auth.ts';
import type { VerifiedIdentity } from './supabase.ts';
export const privilegedRoles = ['ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER'] as const;
export const protectedActions = ['role.assign','role.remove','vendor.verify','account.suspend','refund.approve',
  'payment.release','payout.change','security.settings','security.read','dispute.review'] as const;
export type SecurityConfig = WebAuthConfig & Readonly<{ environment:'preview'|'local'; codeKey:string }>;
type Environment=Record<string,string|undefined>;
export function loadSecurityConfig(env:Environment):SecurityConfig|undefined {
  if (!['true','false'].includes(env.SECURITY_ADMIN_ENABLED??'false')) throw new Error('Invalid security configuration.');
  if(env.SECURITY_ADMIN_ENABLED!=='true')return undefined;
  const auth=loadWebAuthConfig(env);
  // This review feature cannot enable Production. An exact independent project
  // binding is also checked against a DB-owned marker on every command.
  if(!auth || !['preview','local'].includes(env.SECURITY_ENVIRONMENT??'') || env.VERCEL_ENV==='production' ||
    env.VERCEL_ENV==='preview'&&env.SECURITY_ENVIRONMENT!=='preview' ||
    env.SECURITY_ENVIRONMENT==='preview'&&auth.projectUrl==='https://odgxcuwueessxfsoveza.supabase.co' ||
    env.SECURITY_PROJECT_URL!==auth.projectUrl || !/^[a-f0-9]{64}$/.test(env.SECURITY_CODE_HMAC_KEY??'')) {
    throw new Error('An isolated security environment and private code key are required.');
  }
  return Object.freeze({...auth,environment:env.SECURITY_ENVIRONMENT as 'preview'|'local',codeKey:env.SECURITY_CODE_HMAC_KEY!});
}
export type SecurityIdentity=Readonly<{subject:string;issuer:string;sessionId:string;aal:'aal1'|'aal2';mfaAt:number|null;primaryAt:number|null;stepUpAt:number|null}>;
function stepUpSignature(identity:SecurityIdentity,key:string,expiry:number):string {
  return createHmac('sha256',Buffer.from(key,'hex')).update(JSON.stringify(['virtual-ink-step-up-v1',identity.issuer,
    identity.subject,identity.sessionId,identity.mfaAt,identity.primaryAt,expiry])).digest('hex');
}
export function issueApplicationStepUp(identity:SecurityIdentity,key:string,now=Math.floor(Date.now()/1000)) {
  if(identity.aal!=='aal2'||identity.mfaAt===null||identity.primaryAt===null||identity.mfaAt>now||identity.primaryAt>now)throw new ApiError('UNAUTHENTICATED');
  const expiry=Math.min(identity.mfaAt+300,identity.primaryAt+300);
  if(expiry<=now)throw new ApiError('UNAUTHENTICATED');
  return Object.freeze({value:`v1.${expiry}.${stepUpSignature(identity,key,expiry)}`,maxAge:expiry-now});
}
export function withApplicationStepUp(identity:SecurityIdentity,cookie:string|undefined,key:string,now=Math.floor(Date.now()/1000)):SecurityIdentity {
  const match=cookie?.match(/^v1\.([0-9]{1,16})\.([a-f0-9]{64})$/);
  const expiry=match?Number(match[1]):0;
  const valid=identity.aal==='aal2'&&identity.mfaAt!==null&&identity.primaryAt!==null&&match&&Number.isSafeInteger(expiry)&&expiry>now&&
    expiry===Math.min(identity.mfaAt+300,identity.primaryAt+300)&&
    timingSafeEqual(Buffer.from(match[2],'hex'),Buffer.from(stepUpSignature(identity,key,expiry),'hex'));
  return Object.freeze({...identity,stepUpAt:valid?identity.mfaAt:null});
}
// Input claims must come from provider/JWKS verification of the SAME bearer.
export function securityIdentityFromClaims(value:Record<string,unknown>,identity:VerifiedIdentity,now=Math.floor(Date.now()/1000)):SecurityIdentity {
  try {
    const validSecond=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=0;
    if(value.iss!==identity.issuer||uuid(value.sub)!==identity.subject||value.role!=='authenticated'||
      !(value.aud==='authenticated'||Array.isArray(value.aud)&&value.aud.length<=8&&value.aud.every(v=>typeof v==='string')&&value.aud.includes('authenticated'))||
      !validSecond(value.iat)||!validSecond(value.exp)||value.iat>now||value.exp<=now||value.exp<=value.iat||
      value.nbf!==undefined&&(!validSecond(value.nbf)||value.nbf>now)||
      !['aal1','aal2'].includes(String(value.aal))||!Array.isArray(value.amr)||value.amr.length>16)throw new Error();
    const amr=value.amr as Record<string,unknown>[];
    if(amr.some(v=>!v||typeof v!=='object'||Array.isArray(v)||typeof v.method!=='string'||!validSecond(v.timestamp)||(v.timestamp as number)>(value.iat as number)))throw new Error();
    const method=(name:string)=>{const matches=amr.filter(v=>v.method===name);return matches.length===1?matches[0].timestamp as number:null;};
    return Object.freeze({subject:identity.subject,issuer:identity.issuer,sessionId:uuid(value.session_id),
      aal:value.aal as 'aal1'|'aal2',mfaAt:method('totp'),primaryAt:method('password'),stepUpAt:null});
  }catch{throw new ApiError('UNAUTHENTICATED');}
}
export interface SecurityAuth {
  identity():Promise<SecurityIdentity>;
  factors():Promise<readonly {id:string;status:string;type:string}[]>;
  assurance():Promise<{currentLevel:string|null;nextLevel:string|null}>;
  enroll():Promise<{factorId:string;qr:string;manualKey:string}>;
  challenge(factorId:string):Promise<{challengeId:string;expiresAt:number}>;
  verify(factorId:string,challengeId:string,code:string):Promise<void>;
  reauthenticate(password:string):Promise<void>;
  updatePassword(password:string):Promise<void>;
  unenroll(factorId:string):Promise<void>;
  logout():Promise<void>;
}
export const securityCommandStatement='SELECT virtual_ink_security.command($1,$2::jsonb,$3::jsonb) AS result';
export function createSecurityCommands(database:SqlExecutor,config:SecurityConfig) {
  return {async run(action:string,input:Record<string,unknown>,identity:SecurityIdentity,correlationId:string) {
    try {
      const result=await database.query(securityCommandStatement,[action,JSON.stringify(input),JSON.stringify({
        ...identity,environment:config.environment,correlationId})]);
      const row=result.rows[0]?.result;
      if(result.rows.length!==1||!row||typeof row!=='object'||Array.isArray(row))throw new Error();
      const record=row as Record<string,unknown>;
      if(record.ok!==true) {
        const allowed=['UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED'];
        throw new ApiError(allowed.includes(String(record.error))?record.error as ErrorCode:'IDENTITY_UNAVAILABLE');
      }
      return {data:record.data,auditId:uuid(record.auditId)};
    } catch(error) {if(error instanceof ApiError)throw error;throw new ApiError('AUDIT_UNAVAILABLE');}
  }};
}
export type SecurityCommands=ReturnType<typeof createSecurityCommands>;
const emptyActions=['status','self-status','enroll','replace-enroll','requests','events','logout'];
function inputFor(action:string,value:unknown):Record<string,unknown> {
  if(emptyActions.includes(action))return strictObject(value,[]);
  if(action==='challenge'||action==='unenroll'||action==='cancel-enrollment') {const v=strictObject(value,['factorId']);return {factorId:uuid(v.factorId)};}
  if(action==='verify') {
    const v=strictObject(value,['factorId','challengeId','code']);
    if(typeof v.code!=='string'||!/^\d{6}$/.test(v.code))throw new ApiError('VALIDATION_FAILED',['code']);
    return {factorId:uuid(v.factorId),challengeId:uuid(v.challengeId),code:v.code};
  }
  if(action==='reauthenticate'||action==='password-update') {
    const v=strictObject(value,['password']);
    // eslint-disable-next-line no-control-regex -- This security filter intentionally rejects ASCII control characters.
    if(typeof v.password!=='string'||v.password.length<(action==='password-update'?12:1)||v.password.length>128||/[\u0000-\u001f\u007f]/.test(v.password))throw new ApiError('VALIDATION_FAILED',['password']);
    return {password:v.password};
  }
  if(action==='lookup') {const v=strictObject(value,['targetUserId']);return {targetUserId:uuid(v.targetUserId)};}
  if(['approve','execute','recovery-approve'].includes(action)) {const v=strictObject(value,['requestId']);return {requestId:uuid(v.requestId)};}
  if(action==='recovery-request') {const v=strictObject(value,['reason']);return {requestId:randomUUID(),reason:boundedText(v.reason,'reason',500)};}
  if(action==='request') {
    const v=strictObject(value,['targetUserId','expectedAssignmentId','role','reason','expiresAt']);
    const reason=boundedText(v.reason,'reason',500);
    if(reason.length<10||!['CUSTOMER',...privilegedRoles].includes(String(v.role)))throw new ApiError('VALIDATION_FAILED',['reason','role']);
    if(v.expiresAt!==null&&v.expiresAt!==undefined&&(typeof v.expiresAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v.expiresAt)||!Number.isFinite(Date.parse(v.expiresAt))))throw new ApiError('VALIDATION_FAILED',['expiresAt']);
    return {requestId:randomUUID(),targetUserId:uuid(v.targetUserId),expectedAssignmentId:uuid(v.expectedAssignmentId),role:v.role,reason,expiresAt:v.expiresAt??null};
  }
  if(action==='protected') {
    const v=strictObject(value,['capability']);
    if(!(protectedActions as readonly unknown[]).includes(v.capability))throw new ApiError('VALIDATION_FAILED',['capability']);
    return v;
  }
  throw new ApiError('NOT_FOUND');
}
export function securityResponse(request:Request,action:string,
  dependencies:()=>Promise<{config:SecurityConfig;auth:SecurityAuth;commands:SecurityCommands}>):Promise<Response> {
  return handleApi(request,async(_request,context)=>{
    if(request.method!=='POST')throw new ApiError('METHOD_NOT_ALLOWED');
    const {config,auth,commands}=await dependencies();
    if(new URL(request.url).search)throw new ApiError('VALIDATION_FAILED',['query']);
    if(request.headers.get('origin')!==config.origin||request.headers.get('sec-fetch-site')==='cross-site')throw new ApiError('FORBIDDEN');
    let identity=await auth.identity(); // Online provider verification, never client identity/role fields.
    let input:Record<string,unknown>;
    try {input=await readJson(request,value=>inputFor(action,value));}
    catch(error) {
      try{await commands.run('request.invalid',{},identity,context.requestId);}
      catch(auditError){if(!(auditError instanceof ApiError)||auditError.code!=='VALIDATION_FAILED')throw auditError;}
      throw error;
    }
    const run=(name:string,data:Record<string,unknown>={})=>commands.run(name,data,identity,context.requestId);
    if(action==='status'||action==='self-status') {
      const result=await run(action==='self-status'?'account.security':'status');
      const [factors,assurance]=await Promise.all([auth.factors(),auth.assurance()]);
      return {...result.data as object,factors,assurance,needsStepUp:identity.stepUpAt===null,auditId:result.auditId};
    }
    if(['enroll','replace-enroll','challenge','verify','reauthenticate','unenroll','cancel-enrollment'].includes(action)) {
      const reserved={kind:action,...(['unenroll','cancel-enrollment'].includes(action)?{factorId:input.factorId}:{}),...(action==='verify'?{factorId:input.factorId,
        digest:createHmac('sha256',config.codeKey).update(`${identity.subject}:${input.factorId}:${input.code}`).digest('hex')}:{})};
      await run('mfa.reserve',reserved); // Durable attempt budget before contacting the provider.
      let result:unknown;
      let providerAttempted=false;
      try {
        if(action==='enroll'||action==='replace-enroll') {
          const factors=await auth.factors();
          if(action==='enroll'?factors.some(f=>f.status==='verified'):
            !factors.some(f=>f.status==='verified'&&f.type==='totp'))throw new ApiError('FORBIDDEN');
          // Replacement has a separate strong database reservation. First-factor
          // setup cannot be reused to add a factor to an already protected account.
          result=await auth.enroll();
        } else if(action==='challenge')result=await auth.challenge(input.factorId as string);
        else if(action==='verify') {await auth.verify(input.factorId as string,input.challengeId as string,input.code as string);identity=await auth.identity();result={state:'verified'};}
        else if(action==='reauthenticate') {await auth.reauthenticate(input.password as string);identity=await auth.identity();result={state:'primary_verified',next:'challenge'};}
        else {
          const factors=await auth.factors();
          if(action==='cancel-enrollment') {
            if(!factors.some(f=>f.id===input.factorId&&f.status==='unverified'&&f.type==='totp'))throw new ApiError('FORBIDDEN');
          }else if(factors.filter(f=>f.status==='verified').length<2||!factors.some(f=>f.id===input.factorId&&f.status==='verified'))throw new ApiError('FORBIDDEN');
          providerAttempted=true;
          await auth.unenroll(input.factorId as string);result={state:'factor_removed'};
        }
      } catch(error) {
        await run('mfa.result',{kind:action,outcome:'failure',providerAttempted,factorId:input.factorId});
        throw error instanceof ApiError?error:new ApiError('IDENTITY_UNAVAILABLE');
      }
      const event=await run('mfa.result',{kind:action,outcome:'success',factorId:input.factorId??(result as {factorId?:string}|undefined)?.factorId});
      return {...result as object,auditId:event.auditId};
    }
    if(action==='logout') {
      await run('logout');
      try{await auth.logout();}catch(error){await run('logout.result',{outcome:'failure'});throw error instanceof ApiError?error:new ApiError('IDENTITY_UNAVAILABLE');}
      const result=await run('logout.result',{outcome:'success'});return {state:'signed_out',auditId:result.auditId};
    }
    if(action==='password-update') {
      await run('password.begin');
      try{await auth.updatePassword(input.password as string);}catch(error){await run('password.result',{outcome:'failure'});throw error instanceof ApiError?error:new ApiError('IDENTITY_UNAVAILABLE');}
      const result=await run('password.result',{outcome:'success'});return {state:'password_updated',auditId:result.auditId};
    }
    const commandsByAction:Record<string,string>={lookup:'roles.lookup',request:'role.request',approve:'role.approve',execute:'role.execute',
      requests:'requests.list',events:'events.list','recovery-request':'recovery.request','recovery-approve':'recovery.approve',protected:'protected.check'};
    const result=await run(commandsByAction[action],input);
    // A capability check never executes an unbuilt financial/vendor/account action.
    if(action==='protected')throw new ApiError('NOT_FOUND');
    return result;
  }).then(response=>{
    response.headers.set('Cache-Control','private, no-store, max-age=0');
    response.headers.set('Vary','Cookie, Origin');
    if(response.status===405)response.headers.set('Allow','POST');
    if(response.status===429)response.headers.set('Retry-After','300');
    return response;
  });
}
