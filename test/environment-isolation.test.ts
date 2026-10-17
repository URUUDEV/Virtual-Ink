import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {assertEnvironmentIsolation,acceptancePurposes,disabledIntegrations,protectedProduction,IsolationError} from '../src/backend/setup/environment-isolation.ts';
const ref='abcdefghijklmnopqrst',site='https://virtual-ink-acceptance.example.test';
function staging():Record<string,string|undefined>{return {
 APPLICATION_ENVIRONMENT:'staging',VERCEL_ENV:'preview',VERCEL_PROJECT_ID:'prj_syntheticAcceptance',ACCEPTANCE_VERCEL_PROJECT_ID:'prj_syntheticAcceptance',
 STAGING_SUPABASE_PROJECT_REF:ref,SUPABASE_URL:`https://${ref}.supabase.co`,SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',
 APP_ORIGIN:site,STAGING_APP_ORIGIN:site,AUTH_SITE_URL:site,
 STAGING_AUTH_REDIRECT_URLS:JSON.stringify([`${site}/auth/callback`,`${site}/auth/recovery-callback`]),STAGING_WEBHOOK_URLS:'[]',
 STAGING_STORAGE_BUCKETS:JSON.stringify(acceptancePurposes.map(p=>`vi-acceptance-${ref}-${p}`)),STORAGE_ENABLED:'false',EMAIL_MODE:'sandbox',
 ...Object.fromEntries(disabledIntegrations.map(name=>[`${name}_MODE`,'disabled']))};}
function denied(patch:Record<string,string|undefined>,code:string){
 assert.throws(()=>assertEnvironmentIsolation({...staging(),...patch}),error=>error instanceof IsolationError&&error.code===code&&error.message==='Environment isolation check failed.');
}
test('application environments are explicit and deployment targets cannot contradict them',()=>{
 for(const environment of ['local','test','production'])assert.equal(assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:environment}).environment,environment);
 for(const value of [undefined,'','preview','prod','STAGING'])assert.throws(()=>assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:value}),{code:'ENVIRONMENT_REQUIRED'});
 denied({VERCEL_ENV:'invalid'},'VERCEL_ENVIRONMENT_INVALID');denied({VERCEL_ENV:'production'},'ENVIRONMENT_CONTRADICTION');
 denied({VERCEL_ENV:'development'},'ENVIRONMENT_CONTRADICTION');denied({VERCEL_ENV:undefined},'STAGING_PREVIEW_REQUIRED');
 for(const [designation,target]of [['local','preview'],['test','production'],['production','development']])assert.throws(()=>assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:designation,VERCEL_ENV:target}),{code:'ENVIRONMENT_CONTRADICTION'});
 assert.equal(assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:'local',VERCEL_ENV:'development'}).environment,'local');
 assert.throws(()=>assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:'local',STAGING_APP_ORIGIN:site}),{code:'ENVIRONMENT_CONTRADICTION'});
 assert.equal(assertEnvironmentIsolation({APPLICATION_ENVIRONMENT:'test',STAGING_APP_ORIGIN:''}).environment,'test');
});
test('staging identifiers bind the dedicated Vercel project, provider, origin and exact callback set',()=>{
 const result=assertEnvironmentIsolation(staging());assert.equal(result.environment,'staging');assert.equal(result.origin,site);assert.ok(Object.isFrozen(result));
 for(const patch of [{STAGING_SUPABASE_PROJECT_REF:undefined},{STAGING_SUPABASE_PROJECT_REF:'bad'}])denied(patch,'STAGING_PROJECT_REQUIRED');
 for(const patch of [{SUPABASE_URL:'https://other.example.test'},{SECURITY_PROJECT_URL:'wrong'},{STAGING_SUPABASE_URL:'wrong'}])denied(patch,'STAGING_PROJECT_MISMATCH');
 assert.equal(assertEnvironmentIsolation({...staging(),SECURITY_PROJECT_URL:`https://${ref}.supabase.co`,STAGING_SUPABASE_URL:`https://${ref}.supabase.co`}).environment,'staging');
 for(const value of [undefined,'eyJlegacy','sb_secret_unsafe'])denied({SUPABASE_PUBLISHABLE_KEY:value},value?.startsWith('sb_secret_')?'ELEVATED_CREDENTIAL_FORBIDDEN':'STAGING_PUBLISHABLE_KEY_REQUIRED');
 for(const patch of [{ACCEPTANCE_VERCEL_PROJECT_ID:undefined},{ACCEPTANCE_VERCEL_PROJECT_ID:'bad'},{VERCEL_PROJECT_ID:'prj_wrong'}])denied(patch,'STAGING_VERCEL_PROJECT_MISMATCH');
 for(const value of [undefined,'bad','http://acceptance.example.test','https://u:p@acceptance.example.test','https://acceptance.example.test:444','https://acceptance.example.test/path','https://acceptance.example.test/?x=1','https://acceptance.example.test/#x'])denied({APP_ORIGIN:value},'STAGING_ORIGIN_INVALID');
 denied({STAGING_APP_ORIGIN:'bad'},'STAGING_ORIGIN_INVALID');denied({STAGING_APP_ORIGIN:'https://other.example.test'},'STAGING_ORIGIN_MISMATCH');denied({AUTH_SITE_URL:'https://other.example.test'},'STAGING_ORIGIN_MISMATCH');
 for(const value of [undefined,'invalid','{}','[7]',JSON.stringify(Array(21).fill('a')),'[]',JSON.stringify([`${site}/auth/callback`,`${site}/auth/callback`])])denied({STAGING_AUTH_REDIRECT_URLS:value},'STAGING_REDIRECTS_INVALID');
});
test('production references are rejected in arbitrary names and encoded URLs without disclosure',()=>{
 for(const id of [protectedProduction.supabaseRef,protectedProduction.vercelProject,...protectedProduction.domains]){
  for(const value of [id,id.toUpperCase(),`https://${id}/callback`,[...id].map(c=>`%${c.charCodeAt(0).toString(16)}`).join('')])denied({UNEXPECTED_ENDPOINT:value},'PRODUCTION_REFERENCE');
 }
 for(const key of ['DATABASE_URL','SUPABASE_URL','APP_ORIGIN','STAGING_AUTH_REDIRECT_URLS','STAGING_WEBHOOK_URLS','STAGING_STORAGE_BUCKETS'])denied({[key]:`https://${protectedProduction.supabaseRef}.supabase.co`},'PRODUCTION_REFERENCE');
 denied({UNEXPECTED_ENDPOINT:'x'.repeat(65537)},'ENVIRONMENT_VALUE_INVALID');
 assert.equal(assertEnvironmentIsolation({...staging(),UNRELATED_OPTION:undefined,EMPTY:''}).environment,'staging');
});
test('service credentials, public secrets and external transaction credentials cannot enter staging web environments',()=>{
 const jwt=(value:unknown)=>`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(value)).toString('base64url')}.c3ludGhldGlj`;
 for(const patch of [{SUPABASE_SERVICE_ROLE_KEY:'redacted-synthetic'},{DATABASE_MIGRATION_URL:'redacted-synthetic'},
  {PROVISIONING_DATABASE_PASSWORD:'redacted-synthetic'},{RENAMED_KEY:'sb_secret_synthetic'},
  {RENAMED_KEY:encodeURIComponent('sb_secret_synthetic').replace('s','%73')},{RENAMED_KEY:jwt({role:'service_role'})}])denied(patch,'ELEVATED_CREDENTIAL_FORBIDDEN');
 for(const value of [jwt({role:'authenticated'}),'eyJhbGciOiJIUzI1NiJ9.e30.c3ludGhldGlj','eyJhbGciOiJIUzI1NiJ9.bm90LWpzb24.c3ludGhldGlj'])assert.equal(assertEnvironmentIsolation({...staging(),SYNTHETIC_MARKER:value}).environment,'staging');
 denied({NEXT_PUBLIC_DATABASE_PASSWORD:'synthetic-secret'},'PUBLIC_SECRET_FORBIDDEN');
 for(const key of ['STRIPE_SECRET_KEY','PAYSTACK_TOKEN','MPESA_PASSWORD','BLOCKCHAIN_PRIVATE_KEY','PINTEREST_ACCESS_TOKEN'])denied({[key]:'synthetic-sandbox-credentials-are-also-disabled'},'EXTERNAL_CREDENTIAL_FORBIDDEN');
 for(const integration of disabledIntegrations)denied({[`${integration}_MODE`]:'live'},'EXTERNAL_INTEGRATION_DISABLED');
 denied({EMAIL_MODE:'live'},'STAGING_EMAIL_MODE_INVALID');assert.equal(assertEnvironmentIsolation({...staging(),EMAIL_MODE:'disabled'}).environment,'staging');
});
test('Storage and webhook declarations are staging-only with integrations disabled',()=>{
 denied({STAGING_WEBHOOK_URLS:'bad'},'STAGING_WEBHOOKS_INVALID');denied({STAGING_WEBHOOK_URLS:'["https://other.example.test"]'},'STAGING_WEBHOOKS_DISABLED');
 for(const value of [undefined,'bad','["customer-originals"]',JSON.stringify(Array(6).fill(`vi-acceptance-${ref}-quarantine`))])denied({STAGING_STORAGE_BUCKETS:value},'STAGING_BUCKETS_INVALID');
 denied({STORAGE_ENABLED:'true'},'UNBUILT_STORAGE_DISABLED');denied({S3_BUCKET:'production-bucket'},'UNBUILT_STORAGE_DISABLED');
 denied({SECURITY_ADMIN_ENABLED:'true',SECURITY_ENVIRONMENT:'local'},'SECURITY_ENVIRONMENT_MISMATCH');
 assert.equal(assertEnvironmentIsolation({...staging(),SECURITY_ADMIN_ENABLED:'true',SECURITY_ENVIRONMENT:'preview'}).environment,'staging');
});
test('database target validation rejects unrelated hosts, production credentials and owner logins',()=>{
 const direct=`postgresql://vi_security:synthetic@db.${ref}.supabase.co/postgres?sslmode=verify-full`;
 const pooled=`postgresql://vi_security.${ref}:synthetic@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=verify-full`;
 for(const value of [direct,pooled])assert.equal(assertEnvironmentIsolation({...staging(),DATABASE_URL:value,SECURITY_DATABASE_URL:value}).environment,'staging');
 for(const value of ['bad',direct.replace('postgresql:','http:'),direct.replace(`db.${ref}.supabase.co`,'unrelated.example.test'),
  direct.replace('vi_security','postgres'),direct.replace('vi_security','supabase_admin'),direct.replace('vi_security','supabase_auth_admin'),
  direct.replace('vi_security',''),direct.replace(':synthetic',''),direct.replace('/postgres?','/other?'),direct.replace('verify-full','require'),`${direct}#fragment`,
  pooled.replace(`.${ref}:`,'.unrelated:')])denied({DATABASE_URL:value},'STAGING_DATABASE_MISMATCH');
});
test('the build command fails safely without printing secret-bearing configuration',()=>{
 const result=spawnSync(process.execPath,['scripts/environment-isolation-check.mjs'],{env:{...process.env,APPLICATION_ENVIRONMENT:'staging',VERCEL_ENV:'preview',RENAMED_KEY:'sb_secret_synthetic-private-canary'},encoding:'utf8',timeout:10000,windowsHide:true});
 assert.equal(result.status,1);const output=result.stdout+result.stderr;
 assert.match(output,/ELEVATED_CREDENTIAL_FORBIDDEN/);assert.doesNotMatch(output,/synthetic-private-canary|RENAMED_KEY|postgresql:\/\//);
});
