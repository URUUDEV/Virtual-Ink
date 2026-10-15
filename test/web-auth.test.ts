import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWebAuthConfig, validateCredentials, validateEmailInput, validateNewPassword, webAuthResponse, type WebAuthGateway } from '../src/backend/identity/web-auth.ts';
import { ApiError } from '../src/backend/api/errors.ts';

const env = { WEB_AUTH_ENABLED: 'true', APP_ORIGIN: 'http://127.0.0.1:3001',
  SUPABASE_URL: 'https://odgxcuwueessxfsoveza.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' };
const credentials = { email: 'synthetic@example.test', password: 'synthetic passphrase only' };
function request(action = 'login', body: unknown = credentials, headers: Record<string, string> = {}, method = 'POST') {
  return new Request(`http://127.0.0.1:3001/api/auth/${action}`, { method,
    headers: { 'Content-Type': 'application/json', Origin: env.APP_ORIGIN, ...headers },
    ...(method === 'GET' || method === 'HEAD' ? {} : { body: JSON.stringify(body) }) });
}
function fixture() {
  const calls: string[] = [];
  const gateway: WebAuthGateway = {
    async login(input) { assert.deepEqual(input, credentials); calls.push('login'); },
    async register(input, callback) { assert.deepEqual(input, credentials); assert.equal(callback, `${env.APP_ORIGIN}/auth/callback`); calls.push('register'); },
    async requestPasswordReset(email, callback) { assert.equal(email, credentials.email); assert.equal(callback, `${env.APP_ORIGIN}/auth/recovery-callback`); calls.push('password-reset'); },
    async updatePassword(password) { assert.equal(password, credentials.password); calls.push('password-update'); },
    async logout() { calls.push('logout'); },
  };
  return { calls, run: (input: Request, configuration = env) => webAuthResponse(input, () => gateway, configuration) };
}
test('web Auth defaults closed and rejects unsafe origin/key/config without exposing values', () => {
  assert.equal(loadWebAuthConfig({}), undefined);
  assert.equal(loadWebAuthConfig(env)?.origin, env.APP_ORIGIN);
  for (const APP_ORIGIN of ['https://user:secret@example.test', 'https://example.test/a', 'https://example.test/?a=b',
    'http://example.test', 'https://example.test/#x', 'javascript:alert(1)', '']) {
    assert.throws(() => loadWebAuthConfig({ ...env, APP_ORIGIN }));
  }
  assert.throws(() => loadWebAuthConfig({ ...env, WEB_AUTH_ENABLED: 'yes' }));
  assert.throws(() => loadWebAuthConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_synthetic' }));
});
test('credential validation rejects authority injection, malformed emails and unbounded inputs', () => {
  const invalid = [null, [], {}, { ...credentials, role: 'PlatformOperator' }, { ...credentials, user_metadata: { role: 'admin' } },
    { ...credentials, email: 'bad' }, { ...credentials, email: '<admin>@example.test' }, { ...credentials, email: ' x@example.test' },
    { ...credentials, email: 'a'.repeat(255) + '@example.test' }, { ...credentials, password: 'x'.repeat(129) },
    { ...credentials, password: 'x\npasswordhere' }, { ...credentials, password: 12345 }, { ...credentials, password: 'short' }];
  for (const value of invalid) assert.throws(() => validateCredentials(value, 'register'), ApiError);
  const spaces = { ...credentials, password: '  a long password  ' };
  assert.equal(validateCredentials(spaces, 'register').password, spaces.password);
  assert.equal(validateCredentials({ ...credentials, password: 'old' }, 'login').password, 'old');
});
test('password recovery validates email and new-password inputs without accepting authority fields', () => {
  assert.deepEqual(validateEmailInput({ email: credentials.email }), { email: credentials.email });
  assert.deepEqual(validateNewPassword({ password: credentials.password }), { password: credentials.password });
  for (const value of [{ email: credentials.email, role: 'ADMIN' }, { email: 'bad' },
    { email: `${'a'.repeat(250)}@example.test` }]) assert.throws(() => validateEmailInput(value), ApiError);
  for (const value of [{ password: 'short' }, { password: 'x'.repeat(129) },
    { password: credentials.password, role: 'SUPER_ADMIN' }, { password: 'password\nsecret' }]) {
    assert.throws(() => validateNewPassword(value), ApiError);
  }
});

test('login, registration, password recovery and logout reach the provider adapter safely', async () => {
  const f = fixture();
  for (const [action, state] of [['login', 'signed_in'], ['register', 'confirmation_required'],
    ['password-reset', 'if_account_exists'], ['password-update', 'password_updated'], ['logout', 'signed_out']]) {
    const body = action === 'logout' ? {} : action === 'password-reset' ? { email: credentials.email } :
      action === 'password-update' ? { password: credentials.password } : credentials;
    const response = await f.run(request(action, body));
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(JSON.parse(text).data.state, state);
    assert.ok(!text.includes(credentials.password) && !text.includes(credentials.email));
    assert.match(response.headers.get('cache-control')!, /private.*no-store/);
    assert.equal(response.headers.get('vary'), 'Cookie, Origin');
  }
  assert.deepEqual(f.calls, ['login', 'register', 'password-reset', 'password-update', 'logout']);
});
test('cross-site, absent/null Origin and forwarded-host spoof do not reach the provider', async () => {
  const f = fixture();
  const variants: Record<string, string>[] = [{ Origin: 'https://attacker.example.test' }, { Origin: '' }, { Origin: 'null' },
    { 'Sec-Fetch-Site': 'cross-site' }, { Origin: 'https://attacker.example.test', 'X-Forwarded-Host': '127.0.0.1:3001' }];
  for (const headers of variants) {
    assert.equal((await f.run(request('login', credentials, headers))).status, 403);
  }
  assert.deepEqual(f.calls, []);
});
test('unsupported methods, actions, query redirects and logout role fields are denied', async () => {
  const f = fixture();
  const get = await f.run(request('logout', {}, {}, 'GET'));
  assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await f.run(request('reset'))).status, 404);
  assert.equal((await f.run(request('login?next=https://attacker.example.test'))).status, 400);
  assert.equal((await f.run(request('logout', { role: 'admin' }))).status, 400);
  assert.deepEqual(f.calls, []);
});
test('invalid JSON, unsupported content type and oversized streams are denied before provider work', async () => {
  const f = fixture();
  assert.equal((await f.run(request('login', credentials, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await f.run(request('login', { ...credentials, password: 'x'.repeat(17000) }))).status, 413);
  assert.equal((await f.run(new Request('http://127.0.0.1:3001/api/auth/login', { method: 'POST',
    headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.deepEqual(f.calls, []);
});
test('disabled or malformed configuration fails closed without falling back to a demo account', async () => {
  const f = fixture();
  for (const config of [{ ...env, WEB_AUTH_ENABLED: 'false' }, { ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private_synthetic' }]) {
    const response = await f.run(request(), config);
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes('sb_secret'));
  }
  assert.deepEqual(f.calls, []);
});
test('provider failures do not expose upstream errors or report authentication success', async () => {
  const broken: WebAuthGateway = { async login() { throw new Error('postgres://private:secret@host'); },
    async register() { throw new ApiError('IDENTITY_UNAVAILABLE'); },
    async requestPasswordReset() { throw new ApiError('IDENTITY_UNAVAILABLE'); },
    async updatePassword() { throw new ApiError('IDENTITY_UNAVAILABLE'); },
    async logout() { throw new ApiError('IDENTITY_UNAVAILABLE'); } };
  for (const action of ['login', 'register', 'password-reset', 'password-update', 'logout']) {
    const body = action === 'logout' ? {} : action === 'password-reset' ? { email: credentials.email } :
      action === 'password-update' ? { password: credentials.password } : credentials;
    const response = await webAuthResponse(request(action, body), () => broken, env);
    assert.ok(response.status >= 500);
    assert.ok(!(await response.text()).includes('private:secret'));
  }
});
test('parallel Auth work has a bounded worker admission ceiling and recovers after completion', async () => {
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  let started = 0;
  const waiting: WebAuthGateway = { async login() { started++; await barrier; }, async register() {},
    async requestPasswordReset() {}, async updatePassword() {}, async logout() {} };
  const running = Array.from({ length: 8 }, () => webAuthResponse(request(), () => waiting, env));
  while (started < 8) await new Promise((resolve) => setImmediate(resolve));
  assert.equal((await webAuthResponse(request(), () => waiting, env)).status, 503);
  release();
  assert.ok((await Promise.all(running)).every((response) => response.status === 200));
  assert.equal((await webAuthResponse(request(), () => waiting, env)).status, 200);
});
