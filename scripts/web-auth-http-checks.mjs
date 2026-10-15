/** Loopback checks for account entry/protection with hosted Auth disabled. */
import assert from 'node:assert/strict';
const base = new URL(process.env.WEB_CHECK_URL ?? 'http://127.0.0.1:3001');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Only loopback QA targets are allowed.');
let assertions = 0, requests = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions++; };
const check = (value) => { assert.ok(value); assertions++; };
async function get(path, options = {}) {
  requests++;
  return fetch(new URL(path, base), { ...options, redirect: 'manual', signal: AbortSignal.timeout(10000) });
}
for (const [path, heading] of [['/login', 'Welcome back'], ['/register', 'Create your account']]) {
  const response = await get(path);
  equal(response.status, 200);
  const html = await response.text();
  check(html.includes(heading)); check(html.includes('Account access is being prepared'));
  check(html.includes('type="password"')); check(html.includes('disabled=""'));
  equal(response.headers.get('set-cookie'), null);
}
for (const cookie of ['', 'sb-odgxcuwueessxfsoveza-auth-token=base64-tampered-synthetic']) {
  const response = await get('/account', { headers: { Cookie: cookie, 'X-Role': 'PlatformOperator' } });
  equal(response.status, 307); equal(new URL(response.headers.get('location'), base).pathname, '/login');
  check(response.headers.get('cache-control').includes('no-store'));
}
for (const action of ['login', 'register', 'logout']) {
  const response = await get(`/api/auth/${action}`, { method: 'POST',
    headers: { Origin: base.origin, 'Content-Type': 'application/json' },
    body: action === 'logout' ? '{}' : JSON.stringify({ email: 'synthetic@example.test', password: 'synthetic password only' }) });
  equal(response.status, 503); equal((await response.json()).error.code, 'IDENTITY_UNAVAILABLE');
  equal(response.headers.get('set-cookie'), null); check(response.headers.get('cache-control').includes('no-store'));
}
const logoutGet = await get('/api/auth/logout');
equal(logoutGet.status, 405); equal(logoutGet.headers.get('allow'), 'POST');
for (const path of ['/auth/callback?code=synthetic-code&next=https://attacker.example.test', '/auth/callback?code=a&code=b', '/auth/callback']) {
  const response = await get(path);
  equal(response.status, 303); equal(response.headers.get('location'), '/login?confirmation=failed');
  equal(response.headers.get('set-cookie'), null); check(response.headers.get('cache-control').includes('no-store'));
}
console.log(JSON.stringify({ check: 'account_loopback_http_auth_disabled', status: 'pass', requests, assertions,
  genuineHostedAuth: 'unverified' }));
