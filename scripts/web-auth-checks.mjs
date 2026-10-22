/** Real Supabase SSR adapter with synthetic HTTP responses. No hosted accounts are created. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
const root = fileURLToPath(new URL('../', import.meta.url));
const webRequire = createRequire(resolve(root, 'apps/web/package.json'));
const ts = webRequire('typescript');
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} }; modules.set(path, module);
  const source = ts.transpileModule(readFileSync(path, 'utf8').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(path).href)), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  function localRequire(name) {
    if (name === 'server-only') return {};
    if (name.startsWith('@backend/')) return load(resolve(root, 'src/backend', name.slice(9)));
    if (name.startsWith('@/')) return load(resolve(root, 'apps/web/src', `${name.slice(2)}.ts`));
    if (name.startsWith('.')) {const target=resolve(dirname(path),name);return load(/\.[cm]?[jt]sx?$/.test(target)?target:`${target}.ts`);}
    return webRequire(name);
  }
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: path })(localRequire, module, module.exports);
  return module.exports;
}
const { webAuthClient, webAuthGateway } = load(resolve(root, 'apps/web/src/lib/web-auth.ts'));
const {securityAuthGateway}=load(resolve(root,'apps/web/src/lib/security-admin.ts'));
const { webAuthResponse } = load(resolve(root, 'src/backend/identity/web-auth.ts'));
const authRoute = load(resolve(root, 'apps/web/src/app/api/auth/[action]/route.ts'));
const securityRoute=load(resolve(root,'apps/web/src/app/api/security/[action]/route.ts'));
const callbackRoute = load(resolve(root, 'apps/web/src/app/auth/callback/route.ts'));
const recoveryCallbackRoute = load(resolve(root, 'apps/web/src/app/auth/recovery-callback/route.ts'));
const { proxy } = load(resolve(root, 'apps/web/src/proxy.ts'));
const { NextRequest } = webRequire('next/server');
const env = { WEB_AUTH_ENABLED: 'true', APP_ORIGIN: 'https://virtual-ink.example.test',
  SUPABASE_URL: 'https://odgxcuwueessxfsoveza.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' };
const config = { origin: env.APP_ORIGIN, projectUrl: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY };
const credentials = { email: 'synthetic@example.test', password: 'a synthetic password only' };
const user = { id: '11111111-1111-4111-8111-111111111111', email: credentials.email,
  is_anonymous: false, email_confirmed_at: '2026-10-14T00:00:00Z', aud: 'authenticated',
  app_metadata: {}, user_metadata: {}, created_at: '2026-10-14T00:00:00Z' };
const session = { access_token: 'synthetic.access.token', refresh_token: 'synthetic-refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
async function syntheticFetch(responder, work) {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url ?? String(input));
    assert.equal(url.origin, env.SUPABASE_URL);
    assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store');
    return responder(url, init);
  };
  try { await work(); } finally { globalThis.fetch = original; }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
async function configured(work) {
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  try { await work(); } finally {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
}
function clientFixture(initial = []) {
  const cookies = new Map(initial.map(({ name, value }) => [name, value]));
  const writes = []; const headers = {};
  const client = webAuthClient(config, () => [...cookies].map(([name, value]) => ({ name, value })), (items, cacheHeaders) => {
    items.forEach((item) => { writes.push(item); item.value ? cookies.set(item.name, item.value) : cookies.delete(item.name); });
    Object.assign(headers, cacheHeaders);
  });
  return { client, writes, headers, cookies };
}

test('real provider SDK routes enrollment, challenge and verification through server Auth and keeps upgraded tokens in HttpOnly cookies',async()=>{
  const now=Math.floor(Date.now()/1000),factorId='33333333-3333-4333-8333-333333333333',challengeId='44444444-4444-4444-8444-444444444444';
  const issuer=`${env.SUPABASE_URL}/auth/v1`;
  const jwt=aal=>`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({
    iss:issuer,sub:user.id,session_id:challengeId,role:'authenticated',aud:'authenticated',iat:now,exp:now+3600,aal,
    amr:[{method:'password',timestamp:now},...(aal==='aal2'?[{method:'totp',timestamp:now}]:[])]})).toString('base64url')}.c3ludGhldGlj`;
  let providerUser={...user,factors:[]};
  let active={...session,user:providerUser,access_token:jwt('aal1')};
  let verificationFailure=false;
  let qrBody=`<svg xmlns="http://www.w3.org/2000/svg">${' '.repeat(400000)}</svg>`;
  let manualKey='A'.repeat(32);
  const calls=[];
  const enrollmentNames=new Set();
  const f=clientFixture();
  const gateway=securityAuthGateway(f.client,{...config,environment:'local',codeKey:'a'.repeat(64)},
    {get:name=>f.cookies.get(name),set:cookie=>{f.writes.push(cookie);cookie.value?f.cookies.set(cookie.name,cookie.value):f.cookies.delete(cookie.name);}});
  await syntheticFetch((url,init)=>{
    calls.push(`${init.method??'GET'} ${url.pathname}`);
    if(url.pathname==='/auth/v1/token')return json(active);
    if(url.pathname==='/auth/v1/user')return json(providerUser);
    if(url.pathname==='/auth/v1/factors') {
      assert.equal(JSON.parse(init.body).factor_type,'totp');
      const name=JSON.parse(init.body).friendly_name;
      assert.match(name,/^Virtual Ink administrator [a-f0-9-]{36}$/);
      assert.ok(!enrollmentNames.has(name),'each provider enrollment needs a distinct friendly name');enrollmentNames.add(name);
      return json({id:factorId,type:'totp',totp:{qr_code:qrBody,secret:manualKey,uri:'otpauth://synthetic'}});
    }
    if(url.pathname===`/auth/v1/factors/${factorId}/challenge`)return json({id:challengeId,type:'totp',expires_at:now+300});
    if(url.pathname===`/auth/v1/factors/${factorId}/verify`) {
      assert.deepEqual(JSON.parse(init.body),{challenge_id:challengeId,code:'123456'});
      if(verificationFailure)return json({code:'mfa_verification_failed',msg:'private provider diagnostic'},400);
      providerUser={...user,factors:[{id:factorId,status:'verified',factor_type:'totp',created_at:user.created_at,updated_at:user.created_at}]};
      active={...session,user:providerUser,access_token:jwt('aal2')};
      return json(active);
    }
    if(url.pathname===`/auth/v1/factors/${factorId}`&&init.method==='DELETE')return json({id:factorId});
    throw new Error('Unexpected synthetic Auth request');
  },async()=>{
    await webAuthGateway(f.client).login(credentials);
    assert.equal((await gateway.identity()).aal,'aal1');assert.deepEqual(await gateway.factors(),[]);
    assert.equal((await gateway.assurance()).currentLevel,'aal1');
    const enrollment=await gateway.enroll();assert.equal(enrollment.factorId,factorId);
    assert.match(enrollment.qr,/^data:image\/svg\+xml;base64,/);assert.equal(enrollment.manualKey,manualKey);
    assert.ok(!JSON.stringify(f.writes).includes(manualKey));assert.ok(!JSON.stringify(enrollment).includes('otpauth://'));
    assert.ok(Buffer.from(enrollment.qr.split(',')[1],'base64').length>262144);
    qrBody=' '.repeat(1048577);await assert.rejects(gateway.enroll(),{code:'IDENTITY_UNAVAILABLE'});
    qrBody='<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    for(const invalid of ['', 'A'.repeat(257), '<script>private</script>', '123456', null]){manualKey=invalid;await assert.rejects(gateway.enroll(),{code:'IDENTITY_UNAVAILABLE'});}
    assert.equal((await gateway.challenge(factorId)).challengeId,challengeId);
    assert.equal(await gateway.verify(factorId,challengeId,'123456'),undefined);
    assert.equal((await gateway.identity()).aal,'aal2');assert.equal((await gateway.identity()).mfaAt,now);
    assert.equal((await gateway.identity()).stepUpAt,now);
    assert.equal((await gateway.factors())[0].status,'verified');
    for(const code of ['invalid','expired','replayed']) {verificationFailure=true;await assert.rejects(gateway.verify(factorId,challengeId,'123456'),{code:'UNAUTHENTICATED'},`${code} provider rejection is preserved`);}
    await gateway.unenroll(factorId);
    await gateway.reauthenticate(credentials.password);
  });
  assert.ok(calls.some(call=>call.includes('/verify'))&&calls.some(call=>call.includes('/challenge')));
  assert.ok(f.writes.some(cookie=>cookie.value));
  for(const cookie of f.writes){assert.equal(cookie.options.httpOnly,true);assert.equal(cookie.options.secure,true);assert.equal(cookie.options.sameSite,cookie.name==='__Host-vi-step-up'?'strict':'lax');}
});

test('actual security routes and sensitive auth routes fail closed before contacting a shared production provider',async()=>configured(async()=>{
  const keys=['SECURITY_ADMIN_ENABLED','SECURITY_ENVIRONMENT','SECURITY_PROJECT_URL','SECURITY_CODE_HMAC_KEY','VERCEL_ENV'];
  const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{SECURITY_ADMIN_ENABLED:'true',SECURITY_ENVIRONMENT:'preview',SECURITY_PROJECT_URL:env.SUPABASE_URL,
    SECURITY_CODE_HMAC_KEY:'a'.repeat(64),VERCEL_ENV:'preview'});
  try{
    await syntheticFetch(()=>{throw new Error('A shared provider must not be contacted.');},async()=>{
      for(const action of ['status','enroll','request']){
        const request=new NextRequest(`${env.APP_ORIGIN}/api/security/${action}`,{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'});
        const response=await securityRoute.POST(request,{params:Promise.resolve({action})});
        assert.equal(response.status,503);assert.match(response.headers.get('cache-control'),/private.*no-store/);
      }
      for(const action of ['logout','password-update']) {
        const request=new NextRequest(`${env.APP_ORIGIN}/api/auth/${action}`,{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'});
        assert.equal((await authRoute.POST(request)).status,503);
      }
    });
  }finally{for(const[key,value]of Object.entries(previous))value===undefined?delete process.env[key]:process.env[key]=value;}
}));
test('real SSR login writes HttpOnly Secure SameSite cookies and disables caching', async () => {
  const f = clientFixture();
  await syntheticFetch((url, init) => {
    assert.equal(url.pathname, '/auth/v1/token'); assert.equal(url.searchParams.get('grant_type'), 'password');
    assert.deepEqual(JSON.parse(init.body), { ...credentials, gotrue_meta_security: {} });
    return json(session);
  }, () => webAuthGateway(f.client).login(credentials));
  assert.ok(f.writes.some((item) => item.value.length > 0));
  for (const item of f.writes) {
    assert.equal(item.options.httpOnly, true); assert.equal(item.options.secure, true);
    assert.equal(item.options.sameSite, 'lax'); assert.equal(item.options.path, '/');
  }
  assert.match(f.headers['Cache-Control'], /private.*no-store/);
  assert.equal(f.headers.Pragma, 'no-cache');
});
test('failed, unconfirmed and anonymous login does not produce a successful API response', async () => {
  for (const result of [json({ code: 'invalid_credentials', msg: 'Sensitive upstream detail' }, 400),
    json({ ...session, user: { ...user, email_confirmed_at: null } }),
    json({ ...session, user: { ...user, is_anonymous: true } }), json({ ...session, user: { ...user, is_anonymous: undefined } })]) {
    const f = clientFixture();
    await syntheticFetch(() => result, async () => {
      const request = new Request(`${env.APP_ORIGIN}/api/auth/login`, { method: 'POST',
        headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const response = await webAuthResponse(request, () => webAuthGateway(f.client), env);
      assert.equal(response.status, 401);
      assert.ok(!(await response.text()).includes('Sensitive upstream detail'));
    });
  }
});
test('registration uses PKCE and fixed callback without role metadata or auto-login', async () => {
  const f = clientFixture();
  await syntheticFetch((url, init) => {
    assert.equal(url.pathname, '/auth/v1/signup');
    const body = JSON.parse(init.body);
    assert.equal(body.email, credentials.email); assert.equal(body.password, credentials.password);
    assert.equal(body.code_challenge_method, 's256'); assert.ok(body.code_challenge.length > 20);
    assert.ok(!('role' in body) && !('user_metadata' in body));
    assert.equal(new Headers(init.headers).get('x-supabase-api-version'), '2024-01-01');
    assert.equal(url.searchParams.get('redirect_to'), `${env.APP_ORIGIN}/auth/callback`);
    return json({ user, session: null });
  }, () => webAuthGateway(f.client).register(credentials, `${env.APP_ORIGIN}/auth/callback`));
  assert.ok(f.writes.some((item) => item.name.endsWith('code-verifier') && item.value));
  assert.ok(!f.writes.some((item) => !item.name.endsWith('code-verifier') && item.value));
});
test('password recovery sends only the address to the fixed same-origin callback and keeps response generic', async () => {
  const f = clientFixture();
  await syntheticFetch((url, init) => {
    assert.equal(url.pathname, '/auth/v1/recover');
    assert.equal(url.searchParams.get('redirect_to'), `${env.APP_ORIGIN}/auth/recovery-callback`);
    const body = JSON.parse(init.body);
    assert.equal(body.email, credentials.email);
    assert.equal(body.gotrue_meta_security.captcha_token, undefined);
    assert.equal(typeof body.code_challenge, 'string'); assert.equal(body.code_challenge_method, 's256');
    return json({});
  }, async () => {
    await webAuthGateway(f.client).requestPasswordReset(credentials.email, `${env.APP_ORIGIN}/auth/recovery-callback`);
    const response = await webAuthResponse(new Request(`${env.APP_ORIGIN}/api/auth/password-reset`, {
      method: 'POST', headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email }),
    }), () => webAuthGateway(f.client), env);
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { state: 'if_account_exists' });
  });
});
test('password update verifies a confirmed server session and sends the password only to Auth', async () => {
  const f = clientFixture();
  await syntheticFetch((url, init) => {
    if (url.pathname === '/auth/v1/token') return json(session);
    if (url.pathname === '/auth/v1/user' && init.method === 'GET') return json(user);
    assert.equal(url.pathname, '/auth/v1/user'); assert.equal(init.method, 'PUT');
    assert.equal(new Headers(init.headers).get('authorization'), `Bearer ${session.access_token}`);
    const body = JSON.parse(init.body);
    assert.equal(body.password, credentials.password);
    assert.equal(body.code_challenge, null); assert.equal(body.code_challenge_method, null);
    return json({ user });
  }, async () => {
    await webAuthGateway(f.client).login(credentials);
    await webAuthGateway(f.client).updatePassword(credentials.password);
  });
});
test('password update rejects calls without a verified server session', async () => {
  const f = clientFixture(); let requests = 0;
  await syntheticFetch(() => { requests++; return json(user); }, async () => {
    await assert.rejects(webAuthGateway(f.client).updatePassword(credentials.password), (error) => error.code === 'UNAUTHENTICATED');
  });
  assert.equal(requests, 0);
});
test('registration clears a provider auto-confirmed session and logout removes session cookies', async () => {
  const f = clientFixture(); let logouts = 0;
  await syntheticFetch((url) => {
    if (url.pathname === '/auth/v1/signup') return json(session);
    assert.equal(url.pathname, '/auth/v1/logout'); assert.equal(url.searchParams.get('scope'), 'local');
    logouts++; return new Response(null, { status: 204 });
  }, () => webAuthGateway(f.client).register(credentials, `${env.APP_ORIGIN}/auth/callback`));
  assert.equal(logouts, 1);
  assert.ok(f.writes.some((item) => item.value === '' && item.options.maxAge === 0));
  assert.equal(f.cookies.size, 0);
});
test('provider service failures and rate limits are safely reported and do not leak credentials', async () => {
  for (const status of [429, 503]) {
    const f = clientFixture();
    await syntheticFetch(() => json({ code: 'over_request_rate_limit', msg: 'private provider detail' }, status), async () => {
      await assert.rejects(webAuthGateway(f.client).login(credentials), (error) => error.code === 'IDENTITY_UNAVAILABLE' && !error.message.includes('private'));
    });
    assert.equal(f.writes.length, 0);
  }
});
test('actual Next login route attaches cookies only after verified successful login', async () => configured(async () => {
  for (const confirmed of [true, false]) {
    await syntheticFetch(() => json({ ...session, user: { ...user, email_confirmed_at: confirmed ? user.email_confirmed_at : null } }), async () => {
      const request = new NextRequest(`${env.APP_ORIGIN}/api/auth/login`, { method: 'POST',
        headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const response = await authRoute.POST(request);
      assert.equal(response.status, confirmed ? 200 : 401);
      assert.equal(response.cookies.getAll().length > 0, confirmed);
      if (confirmed) assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    });
  }
}));
test('actual Next registration and PKCE callback establish a confirmed session with a fixed destination', async () => configured(async () => {
  await syntheticFetch((url) => {
    if (url.pathname === '/auth/v1/signup') return json({ user, session: null });
    assert.equal(url.pathname, '/auth/v1/token'); assert.equal(url.searchParams.get('grant_type'), 'pkce');
    return json(session);
  }, async () => {
    const registration = await authRoute.POST(new NextRequest(`${env.APP_ORIGIN}/api/auth/register`, { method: 'POST',
      headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }));
    assert.equal(registration.status, 200);
    const cookie = registration.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
    assert.ok(cookie.includes('code-verifier'));
    const callback = await callbackRoute.GET(new NextRequest(`${env.APP_ORIGIN}/auth/callback?code=synthetic-confirmation-code`, { headers: { cookie } }));
    assert.equal(callback.status, 303); assert.equal(callback.headers.get('location'), '/account');
    assert.ok(callback.cookies.getAll().some((item) => !item.name.endsWith('code-verifier') && item.value));
    assert.match(callback.headers.get('cache-control'), /private.*no-store/);
  });
}));
test('callback denies missing PKCE, repeated code and redirect injection without echoing secrets', async () => configured(async () => {
  let calls = 0;
  await syntheticFetch(() => { calls++; return json(session); }, async () => {
    for (const query of ['code=synthetic-no-verifier', 'code=a&code=b', 'code=a&next=https://attacker.example.test', 'code=%3Cscript%3E', '']) {
      const response = await callbackRoute.GET(new NextRequest(`${env.APP_ORIGIN}/auth/callback?${query}`));
      assert.equal(response.status, 303); assert.equal(response.headers.get('location'), '/login?confirmation=failed');
      assert.equal(response.cookies.getAll().length, 0);
    }
  });
  assert.equal(calls, 0);
}));
test('recovery callback establishes only a fixed reset destination after verified PKCE exchange', async () => configured(async () => {
  const f = clientFixture();
  await syntheticFetch((url, init) => {
    if (url.pathname === '/auth/v1/recover') return json({});
    assert.equal(url.pathname, '/auth/v1/token'); assert.equal(url.searchParams.get('grant_type'), 'pkce');
    assert.equal(JSON.parse(init.body).auth_code, 'synthetic-recovery-code');
    return json(session);
  }, async () => {
    await webAuthGateway(f.client).requestPasswordReset(credentials.email, `${env.APP_ORIGIN}/auth/recovery-callback`);
    const cookie = [...f.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    const response = await recoveryCallbackRoute.GET(new NextRequest(`${env.APP_ORIGIN}/auth/recovery-callback?code=synthetic-recovery-code`, { headers: { cookie } }));
    assert.equal(response.status, 303); assert.equal(response.headers.get('location'), '/reset-password');
    assert.ok(response.cookies.getAll().some((item) => !item.name.endsWith('code-verifier') && item.value));
  });
}));
test('recovery callback rejects missing, repeated and redirected recovery codes without provider work', async () => configured(async () => {
  let calls = 0;
  await syntheticFetch(() => { calls++; return json(session); }, async () => {
    for (const query of ['', 'code=a&code=b', 'code=a&next=https://attacker.example.test', 'code=%3Cscript%3E']) {
      const response = await recoveryCallbackRoute.GET(new NextRequest(`${env.APP_ORIGIN}/auth/recovery-callback${query ? `?${query}` : ''}`));
      assert.equal(response.status, 303); assert.equal(response.headers.get('location'), '/login?recovery=failed');
      assert.equal(response.cookies.getAll().length, 0);
    }
  });
  assert.equal(calls, 0);
}));
test('Next proxy redirects guests and tampered sessions before page rendering and admits verified users', async () => configured(async () => {
  const guest = await proxy(new NextRequest(`${env.APP_ORIGIN}/account`));
  assert.equal(guest.status, 307); assert.equal(guest.headers.get('location'), `${env.APP_ORIGIN}/login`);
  const guestRecovery = await proxy(new NextRequest(`${env.APP_ORIGIN}/reset-password`));
  assert.equal(guestRecovery.status, 307); assert.equal(guestRecovery.headers.get('location'), `${env.APP_ORIGIN}/login`);
  const forged = await proxy(new NextRequest(`${env.APP_ORIGIN}/account`, {
    headers: { cookie: 'sb-odgxcuwueessxfsoveza-auth-token=base64-tampered-synthetic', 'X-Role': 'PlatformOperator' },
  }));
  assert.equal(forged.status, 307); assert.equal(forged.headers.get('location'), `${env.APP_ORIGIN}/login`);
  const f = clientFixture();
  await syntheticFetch((url) => url.pathname === '/auth/v1/user' ? json(user) : json(session), async () => {
    await webAuthGateway(f.client).login(credentials);
    const cookie = [...f.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    const permitted = await proxy(new NextRequest(`${env.APP_ORIGIN}/account`, { headers: { cookie } }));
    assert.equal(permitted.status, 200); assert.equal(permitted.headers.get('location'), null);
    assert.match(permitted.headers.get('cache-control'), /private.*no-store/);
  });
}));
