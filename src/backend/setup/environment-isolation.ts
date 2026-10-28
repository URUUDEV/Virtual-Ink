import { runtimeSecurityNotice, sensitiveRuntimeApproved } from './runtime-policy.ts';
export { runtimeSecurityNotice };
// Safe identifiers only. Production credentials must never be fetched or copied
// to construct acceptance configuration. Service keys are forbidden in web envs.
export const protectedProduction = Object.freeze({
  supabaseRef: 'odgxcuwueessxfsoveza',
  vercelProject: 'prj_nmF5hplE59S6qT9hljdjGYAb8kLS',
  domains: ['virtual-ink.vercel.app'] as readonly string[],
});
type Environment = Record<string, string | undefined>;
export const uiTestProject = 'prj_aqLrX1gsSVb1XINH5YNGkp1aYazH';
export type ApplicationEnvironment = 'local' | 'test' | 'staging' | 'production' | 'ui_test';
export class IsolationError extends Error {
  readonly code: string;
  readonly runtime?: Readonly<{ actualNode: string; minimumNode: string; advisoryOpen: boolean }>;
  constructor(code: string) {
    super('Environment isolation check failed.'); this.code=code;
    // Fixed native-runtime facts for private server logs; never include environment
    // bindings, request data, credentials or caller-provided diagnostic fields.
    if (code === 'RUNTIME_SECURITY_PATCH_REQUIRED') this.runtime = Object.freeze({
      actualNode: process.versions.node, minimumNode: runtimeSecurityNotice.minimum,
      advisoryOpen: runtimeSecurityNotice.open,
    });
  }
}
const fail = (code: string): never => { throw new IsolationError(code); };
function sensitiveRuntimeGate(env: Environment) {
  if (!sensitiveRuntimeApproved() && (env.APPLICATION_ENVIRONMENT === 'production' || ['preview', 'production'].includes(env.VERCEL_ENV ?? '')) &&
    ['WEB_AUTH_ENABLED', 'AUTH_ENABLED', 'SECURITY_ADMIN_ENABLED', 'STORAGE_ENABLED', 'WORKFLOW_ENABLED'].some(key => env[key] === 'true')) {
    fail('RUNTIME_SECURITY_PATCH_REQUIRED');
  }
}
export const acceptancePurposes = ['quarantine','customer-originals','approved-production-files','proofs','production-evidence','dispute-evidence'] as const;
export const disabledIntegrations = ['PAYMENTS','MOBILE_MONEY','SMS','WHATSAPP','DELIVERY','BLOCKCHAIN','CANVA','PINTEREST'] as const;
function list(value: string | undefined, code: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? '');
    if (!Array.isArray(parsed) || parsed.length > 20 || parsed.some(v => typeof v !== 'string')) throw new Error();
    return parsed;
  } catch { return fail(code); }
}
function origin(value: string | undefined): string {
  try {
    const url = new URL(value ?? '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { return fail('STAGING_ORIGIN_INVALID'); }
}
function containsServiceKey(value: string): boolean {
  if (/sb_secret_[A-Za-z0-9_-]+/.test(value)) return true;
  for (const token of value.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
    try { if (JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role === 'service_role') return true; } catch {}
  }
  return false;
}
// User-authorized 18 October UI-only hosting exception. It cannot load an Auth,
// database, storage or internal-service binding and does not relax staging rules.
function uiTestIsolation(env:Environment) {
  if(!['production','preview'].includes(env.VERCEL_ENV??''))fail('UI_TEST_TARGET_REQUIRED');
  const project=env.UI_TEST_VERCEL_PROJECT_ID??'';
  if(project!==uiTestProject||env.VERCEL_PROJECT_ID!==project)fail('UI_TEST_PROJECT_MISMATCH');
  for(const flag of ['WEB_AUTH_ENABLED','AUTH_ENABLED','SECURITY_ADMIN_ENABLED','STORAGE_ENABLED','JOBS_ENABLED'])if(env[flag]!=='false')fail('UI_TEST_SERVICE_ENABLED');
  if (env.WORKFLOW_ENABLED !== undefined && env.WORKFLOW_ENABLED !== 'false') fail('UI_TEST_SERVICE_ENABLED');
  for(const integration of disabledIntegrations)if(env[`${integration}_MODE`]!=='disabled')fail('EXTERNAL_INTEGRATION_DISABLED');
  if(env.EMAIL_MODE!=='disabled')fail('UI_TEST_EMAIL_ENABLED');
  for(const [key,raw]of Object.entries(env)){
    if(!raw)continue;
    if(raw.length>65536)fail('ENVIRONMENT_VALUE_INVALID');
    let value=raw;try{for(let n=0;n<2;n++)value=decodeURIComponent(value);}catch{/* Inspect original or partially decoded values. */}
    if([protectedProduction.supabaseRef,protectedProduction.vercelProject,...protectedProduction.domains].some(id=>value.toLowerCase().includes(id.toLowerCase())))fail('PRODUCTION_REFERENCE');
    if(/^(?:STAGING_|ACCEPTANCE_|SUPABASE_|DATABASE_|MIGRATION_|PROVISIONING_|S3_|APP_SERVICE_URL$|SECURITY_(?!ADMIN_ENABLED$)|AUTH_(?!ENABLED$))/i.test(key)||
      /(?:SERVICE.?ROLE|PASSWORD|SECRET|PRIVATE_KEY)/i.test(key)||containsServiceKey(value)||/postgres(?:ql)?:\/\//i.test(value))fail('UI_TEST_BINDING_FORBIDDEN');
    if(/^NEXT_PUBLIC_/i.test(key)&&/(?:^|_)(?:TOKEN|KEY|AUTH|STORAGE|DATABASE)(?:_|$)/i.test(key))fail('PUBLIC_SECRET_FORBIDDEN');
    if(/^(?:PAYMENTS?|MOBILE_MONEY|STRIPE|PAYSTACK|FLUTTERWAVE|PAYPAL|MPESA|MTN|AIRTEL|TWILIO|SMTP|EMAIL|SMS|WHATSAPP|DELIVERY|COURIER|BLOCKCHAIN|WEB3|ETHEREUM|SOLANA|CANVA|PINTEREST)_.*(?:KEY|TOKEN|SECRET|PASSWORD|WEBHOOK|URL)/i.test(key))fail('EXTERNAL_CREDENTIAL_FORBIDDEN');
  }
  return Object.freeze({environment:'ui_test' as const,vercelProject:project});
}
export function assertEnvironmentIsolation(env: Environment = process.env) {
  if (['preview','production'].includes(env.VERCEL_ENV ?? '') && !sensitiveRuntimeApproved()) fail('RUNTIME_SECURITY_PATCH_REQUIRED');
  const designation = env.APPLICATION_ENVIRONMENT;
  if(designation==='ui_test')return uiTestIsolation(env);
  if(Object.keys(env).some(key=>/^UI_TEST_/i.test(key)&&env[key]))fail('ENVIRONMENT_CONTRADICTION');
  if (!['local','test','staging','production'].includes(designation ?? '')) fail('ENVIRONMENT_REQUIRED');
  const environment = designation as ApplicationEnvironment;
  if (env.VERCEL_ENV !== undefined && !['production','preview','development'].includes(env.VERCEL_ENV)) fail('VERCEL_ENVIRONMENT_INVALID');
  if (env.VERCEL_ENV === 'preview' && environment !== 'staging' || env.VERCEL_ENV === 'production' && environment !== 'production' ||
      env.VERCEL_ENV === 'development' && !['local','test'].includes(environment)) fail('ENVIRONMENT_CONTRADICTION');
  if (environment !== 'staging') {
    if (Object.keys(env).some(key => /^(STAGING_|ACCEPTANCE_)/.test(key) && env[key])) fail('ENVIRONMENT_CONTRADICTION');
    sensitiveRuntimeGate(env);
    return Object.freeze({ environment });
  }
  if (env.VERCEL_ENV !== 'preview') fail('STAGING_PREVIEW_REQUIRED');
  // Reject references regardless of their variable name, URL encoding or case.
  for (const [key, raw] of Object.entries(env)) {
    if (!raw) continue;
    if (raw.length > 65536) fail('ENVIRONMENT_VALUE_INVALID');
    let value = raw;
    try { for (let n = 0; n < 2; n++) value = decodeURIComponent(value); } catch { /* inspect the original/partially decoded value */ }
    const lower = value.toLowerCase();
    if ([protectedProduction.supabaseRef,protectedProduction.vercelProject,...protectedProduction.domains].some(id => lower.includes(id.toLowerCase()))) fail('PRODUCTION_REFERENCE');
    if (/SERVICE.?ROLE|SUPABASE_SECRET|MIGRATION.*(?:URL|PASSWORD)|PROVISIONING.*(?:URL|PASSWORD)/i.test(key) || containsServiceKey(value)) fail('ELEVATED_CREDENTIAL_FORBIDDEN');
    if (/^(?:PAYMENTS?|MOBILE_MONEY|STRIPE|PAYSTACK|FLUTTERWAVE|PAYPAL|MPESA|MTN|AIRTEL|TWILIO|SMTP|EMAIL|SMS|WHATSAPP|DELIVERY|COURIER|BLOCKCHAIN|WEB3|ETHEREUM|SOLANA|CANVA|PINTEREST)_.*(?:KEY|TOKEN|SECRET|PASSWORD|WEBHOOK)/i.test(key)) fail('EXTERNAL_CREDENTIAL_FORBIDDEN');
    if (/^NEXT_PUBLIC_/i.test(key) && /PASSWORD|TOKEN|SECRET|PRIVATE|DATABASE|SERVICE.?ROLE/i.test(key)) fail('PUBLIC_SECRET_FORBIDDEN');
  }
  const ref = env.STAGING_SUPABASE_PROJECT_REF ?? '';
  if (!/^[a-z]{20}$/.test(ref)) fail('STAGING_PROJECT_REQUIRED');
  const projectUrl = `https://${ref}.supabase.co`;
  if (env.SUPABASE_URL !== projectUrl || env.SECURITY_PROJECT_URL !== undefined && env.SECURITY_PROJECT_URL !== projectUrl ||
      env.STAGING_SUPABASE_URL !== undefined && env.STAGING_SUPABASE_URL !== projectUrl) fail('STAGING_PROJECT_MISMATCH');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.SUPABASE_PUBLISHABLE_KEY ?? '')) fail('STAGING_PUBLISHABLE_KEY_REQUIRED');
  const project = env.ACCEPTANCE_VERCEL_PROJECT_ID ?? '';
  if (!/^prj_[A-Za-z0-9]+$/.test(project) || env.VERCEL_PROJECT_ID !== project) fail('STAGING_VERCEL_PROJECT_MISMATCH');
  const site = origin(env.APP_ORIGIN);
  const expectedSite = origin(env.STAGING_APP_ORIGIN);
  if (site !== expectedSite || env.AUTH_SITE_URL !== site) fail('STAGING_ORIGIN_MISMATCH');
  const redirects = list(env.STAGING_AUTH_REDIRECT_URLS, 'STAGING_REDIRECTS_INVALID');
  if (redirects.length !== 2 || !redirects.includes(`${site}/auth/callback`) || !redirects.includes(`${site}/auth/recovery-callback`)) fail('STAGING_REDIRECTS_INVALID');
  const webhooks = list(env.STAGING_WEBHOOK_URLS, 'STAGING_WEBHOOKS_INVALID');
  if (webhooks.length !== 0) fail('STAGING_WEBHOOKS_DISABLED');
  const buckets = list(env.STAGING_STORAGE_BUCKETS, 'STAGING_BUCKETS_INVALID');
  const expected = acceptancePurposes.map(purpose => `vi-acceptance-${ref}-${purpose}`);
  if (buckets.length !== expected.length || new Set(buckets).size !== expected.length || buckets.some(bucket => !expected.includes(bucket))) fail('STAGING_BUCKETS_INVALID');
  if (env.STORAGE_ENABLED !== 'false' || Object.keys(env).some(key => /^S3_/.test(key) && env[key])) fail('UNBUILT_STORAGE_DISABLED');
  for (const integration of disabledIntegrations) if (env[`${integration}_MODE`] !== 'disabled') fail('EXTERNAL_INTEGRATION_DISABLED');
  if (!['disabled','sandbox'].includes(env.EMAIL_MODE ?? '')) fail('STAGING_EMAIL_MODE_INVALID');
  if (env.SECURITY_ADMIN_ENABLED === 'true' && env.SECURITY_ENVIRONMENT !== 'preview') fail('SECURITY_ENVIRONMENT_MISMATCH');
  for (const key of ['DATABASE_URL','SECURITY_DATABASE_URL']) {
    if (!env[key]) continue;
    try {
      const url = new URL(env[key]!);
      const username = decodeURIComponent(url.username);
      const direct = url.hostname === `db.${ref}.supabase.co`;
      const pooled = /^[a-z0-9-]+\.(?:pooler\.)?supabase\.com$/.test(url.hostname) && username.endsWith(`.${ref}`);
      if (!['postgres:','postgresql:'].includes(url.protocol) || !(direct || pooled) || !username || !url.password ||
          ['postgres','supabase_admin','supabase_auth_admin'].includes(username.split('.')[0]) || url.pathname !== '/postgres' ||
          url.searchParams.get('sslmode') !== 'verify-full' || url.hash) throw new Error();
    } catch { fail('STAGING_DATABASE_MISMATCH'); }
  }
  sensitiveRuntimeGate(env);
  return Object.freeze({ environment, projectUrl, origin: site, vercelProject: project });
}
