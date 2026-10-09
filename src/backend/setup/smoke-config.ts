import { uuid } from '../api/validation.ts';

export function smokeSettings(env: Record<string, string | undefined>) {
  const url = new URL(env.SMOKE_API_URL ?? 'http://127.0.0.1:3000');
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a loopback API origin.');
  const tenantId = uuid(env.SMOKE_TENANT_ID);
  const deniedTenantId = uuid(env.SMOKE_DENIED_TENANT_ID);
  if (tenantId === deniedTenantId) throw new Error('Select a distinct inaccessible tenant.');
  return { origin: url.origin, tenantId, deniedTenantId };
}
