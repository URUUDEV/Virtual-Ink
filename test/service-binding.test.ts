import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { appServiceBase, boundAppResponse, usesAppBinding } from '../src/backend/api/service-binding.ts';

const env = { VERCEL: '1', APP_SERVICE_URL: 'http://127.0.0.1:3999/internal/app/' };
const json = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', ...headers },
});
const request = (path = '/api/v1/me', method = 'GET', extra = {}) => new Request(`https://virtual-ink.example.test${path}`, {
  method, headers: { Authorization: 'Bearer synthetic-token', ...extra },
});
test('service config exposes web only, has a caller-owned binding and explicit Node entrypoint', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.services.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(config.services).sort(), ['app', 'web']);
  assert.equal(config.services.app.entrypoint, 'src/vercel.js');
  assert.deepEqual(config.services.web.bindings, [{ type: 'service', service: 'app', format: 'url', env: 'APP_SERVICE_URL' }]);
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: { service: 'web' } }]);
  assert.ok(!['framework','functions','installCommand','buildCommand','devCommand','outputDirectory'].some((key) => key in config));
  const proxy = await readFile(new URL('../apps/web/src/proxy.ts', import.meta.url), 'utf8');
  assert.ok(!proxy.includes('APP_SERVICE_URL') && !proxy.includes('service-binding'));
});
test('binding mode is runtime-only, fails closed when deployed without a binding and validates URL', async () => {
  assert.equal(usesAppBinding({}), false); assert.equal(usesAppBinding({ VERCEL: '1' }), true);
  assert.equal(usesAppBinding({ APP_SERVICE_URL: '' }), true);
  for (const APP_SERVICE_URL of ['', 'file:///private', 'http://user:secret@host', 'https://host?x=1', 'https://host/#x']) {
    assert.throws(() => appServiceBase({ APP_SERVICE_URL }));
  }
  const response = await boundAppResponse(request(), { VERCEL: '1' }, async () => { throw new Error('must not fetch'); });
  assert.equal(response.status, 503); assert.equal((await response.json()).error.code, 'IDENTITY_UNAVAILABLE');
});
test('binding preserves base prefix, public API path, pagination and bearer while stripping browser authority/cookies', async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(String(url), `${env.APP_SERVICE_URL}api/v1/memberships?limit=2`);
    assert.deepEqual(init?.headers, { Authorization: 'Bearer synthetic-token' });
    assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    return json({ data: [], meta: { pagination: { limit: 2, nextCursor: null } } });
  };
  const response = await boundAppResponse(request('/api/v1/memberships?limit=2', 'GET', {
    Cookie: 'synthetic-browser-session', 'X-Role': 'PlatformOperator', 'X-Forwarded-Host': 'attacker.example.test',
  }), env, fetcher);
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).data, []);
});
test('unauthorized, malformed tenant, unknown path, redirect query and write requests never reach the binding', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return json({}); };
  for (const [input, status] of [
    [new Request('https://virtual-ink.example.test/api/v1/me'), 401],
    [request('/api/v1/me', 'GET', { Authorization: 'Bearer x,y' }), 401],
    [request('/api/v1/me?url=https://attacker.example.test'), 400],
    [request('/api/v1/memberships?limit=0'), 400], [request('/api/v1/tenants/not-a-uuid/access'), 400],
    [request('/api/v1/orders'), 404], [request('/api/v1/me', 'POST'), 405], [request('/api/v1/me', 'HEAD'), 405],
  ] as const) assert.equal((await boundAppResponse(input, env, fetcher)).status, status);
  assert.equal(calls, 0);
});
test('binding forwards safe status/challenge only and strips upstream cookies, redirects and CORS', async () => {
  const response = await boundAppResponse(request(), env, async () => json({ error: { code: 'UNAUTHENTICATED' } }, 401, {
    'Set-Cookie': 'synthetic=unsafe', Location: 'https://attacker.example.test', 'Access-Control-Allow-Origin': '*',
    'WWW-Authenticate': 'Bearer', 'X-Request-Id': '11111111-1111-4111-8111-111111111111',
  }));
  assert.equal(response.status, 401); assert.equal(response.headers.get('www-authenticate'), 'Bearer');
  for (const key of ['set-cookie','location','access-control-allow-origin']) assert.equal(response.headers.get(key), null);
  assert.match(response.headers.get('cache-control')!, /private.*no-store/);
});
test('upstream errors, redirects, bad JSON, wrong media and oversized data return safe 503', async () => {
  const variants: (() => Response)[] = [() => new Response(null, { status: 302, headers: { Location: 'https://attacker.example.test' } }),
    () => json({ private: 'synthetic-sensitive-detail' }, 500), () => new Response('synthetic-sensitive-detail'),
    () => new Response('{', { headers: { 'Content-Type': 'application/json' } }),
    () => json({ data: 'x'.repeat(1024 * 1024 + 1) }), () => json({ data: {} }, 200, { 'Content-Length': '9999999' })];
  for (const response of variants) {
    const result = await boundAppResponse(request(), env, async () => response());
    assert.equal(result.status, 503); assert.ok(!(await result.text()).includes('synthetic-sensitive-detail'));
  }
  const broken = await boundAppResponse(request(), env, async () => { throw new Error('synthetic connection secret'); });
  assert.equal(broken.status, 503); assert.ok(!(await broken.text()).includes('connection secret'));
});
test('versioned and legacy health binding does not transmit identity and HEAD has no body', async () => {
  for (const path of ['/health','/api/v1/health']) {
    const response = await boundAppResponse(request(path, 'HEAD'), env, async (_url, init) => {
      assert.deepEqual(init?.headers, {}); assert.equal(init?.method, 'HEAD');
      return new Response(null, { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    assert.equal(response.status, 200); assert.equal(await response.text(), '');
  }
});
