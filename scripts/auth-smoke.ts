import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uuid } from '../src/backend/api/validation.ts';
import { createSupabaseIdentityVerifier } from '../src/backend/identity/supabase.ts';
import { loadSupabaseRestConfig } from '../src/backend/database/supabase-rest.ts';
import { readPrivateToken } from './private-token.ts';

export function smokeSettings(env: Record<string, string | undefined>) {
  const url = new URL(env.SMOKE_API_URL ?? 'http://127.0.0.1:3000');
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a loopback API origin.');
  const tenantId = uuid(env.SMOKE_TENANT_ID);
  const deniedTenantId = uuid(env.SMOKE_DENIED_TENANT_ID);
  if (tenantId === deniedTenantId) throw new Error('Select a distinct inaccessible tenant.');
  return { origin: url.origin, tenantId, deniedTenantId };
}

// Explicit smoke: live provider verification, own tenant allow, different tenant
// deny, guest deny, and forbidden method. No production actions or token output.
export async function runAuthSmoke(settings: ReturnType<typeof smokeSettings>, token: string,
  fetcher: typeof fetch = fetch): Promise<void> {
  async function request(path: string, status: number, authorized = true, method = 'GET') {
    const response = await fetcher(`${settings.origin}${path}`, { method,
      headers: authorized ? { Authorization: `Bearer ${token}` } : {},
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (response.status !== status) throw new Error('API smoke expectation failed.');
    return response;
  }
  const me = await (await request('/api/v1/me', 200)).json();
  uuid(me?.data?.userId);
  if (!Array.isArray(me?.data?.roles)) throw new Error('API smoke expectation failed.');
  const access = await (await request(`/api/v1/tenants/${settings.tenantId}/access`, 200)).json();
  if (access?.data?.tenantId !== settings.tenantId || access?.data?.capability !== 'tenant.read') throw new Error('API smoke expectation failed.');
  await request(`/api/v1/tenants/${settings.deniedTenantId}/access`, 404);
  await request('/api/v1/me', 401, false);
  await request('/api/v1/me', 405, true, 'POST');
}

async function main() {
  if (process.argv.length !== 2) throw new Error('Smoke configuration uses private environment settings and stdin only.');
  const settings = smokeSettings(process.env);
  const verifier = createSupabaseIdentityVerifier(loadSupabaseRestConfig(process.env));
  const token = await readPrivateToken();
  await verifier.verify(token);
  await runAuthSmoke(settings, token);
  console.log(JSON.stringify({ service: 'Virtual Ink', smoke: 'identity_tenant', status: 'passed',
    checks: 5, databaseAuditInspectionRequired: true }));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => { console.error(JSON.stringify({ service: 'Virtual Ink', smoke: 'identity_tenant', status: 'not_verified' })); process.exitCode = 1; });
}
