/** Exercise the real Vercel dev router and its injected binding on loopback. */
import assert from 'node:assert/strict';
const base = new URL(process.env.SERVICES_CHECK_URL ?? 'http://127.0.0.1:3100');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(base.hostname), 'Only loopback service QA is allowed.');
let assertions = 0, requests = 0;
const equal = (a,b) => { assert.equal(a,b); assertions++; };
const check = (value) => { assert.ok(value); assertions++; };
async function probe(path, options = {}) {
  requests++;
  return fetch(new URL(path, base), { ...options, redirect: 'manual', signal: AbortSignal.timeout(30000) });
}
for (const path of ['/','/shop','/login','/register']) {
  const response = await probe(path);
  equal(response.status, 200); check(response.headers.get('content-type').includes('text/html'));
  check((await response.text()).includes('Virtual Ink'));
}
for (const path of ['/health','/api/v1/health']) {
  const response = await probe(path);
  equal(response.status, 200); check(response.headers.get('cache-control').includes('private'));
  const body = await response.json(); equal((body.data ?? body).service, 'Virtual Ink');
  if (body.meta) equal(body.meta.requestId, response.headers.get('x-request-id'));
  const head = await probe(path, { method: 'HEAD' });
  equal(head.status, 200); equal(await head.text(), '');
}
for (const path of ['/api/v1/me','/api/v1/memberships','/api/v1/tenants/11111111-1111-4111-8111-111111111111/access']) {
  const denied = await probe(path, { headers: { 'X-Role': 'PlatformOperator' } });
  equal(denied.status, 401); equal((await denied.json()).error.code, 'UNAUTHENTICATED');
}
const pending = await probe('/api/v1/me', { headers: { Authorization: 'Bearer synthetic-token' } });
equal(pending.status, 503); equal((await pending.json()).error.code, 'IDENTITY_UNAVAILABLE');
const method = await probe('/api/v1/me', { method: 'POST' });
equal(method.status, 405); equal(method.headers.get('allow'), 'GET');
const auth = await probe('/api/auth/login', { method: 'POST', headers: { Origin: base.origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'synthetic@example.test', password: 'synthetic password only' }) });
equal(auth.status, 503); equal((await auth.json()).error.code, 'IDENTITY_UNAVAILABLE');
const account = await probe('/account');
equal(account.status, 307); equal(new URL(account.headers.get('location'), base).pathname, '/login');
const unknown = await probe('/api/v1/orders', { method: 'POST' });
equal(unknown.status, 404); equal((await unknown.json()).error.code, 'NOT_FOUND');
console.log(JSON.stringify({ check: 'vercel_local_services_and_binding', status: 'pass', requests, assertions,
  fixture: 'hosted Auth disabled; synthetic inputs', hostedDeployment: 'unverified' }));
