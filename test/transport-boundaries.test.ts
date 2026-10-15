import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdmission } from '../src/backend/api/admission.ts';
import { handleApi } from '../src/backend/api/responses.ts';
import { readUpstreamJson, MAX_UPSTREAM_JSON_BYTES } from '../src/backend/api/upstream-json.ts';
import { boundAppResponse } from '../src/backend/api/service-binding.ts';
import { createSupabaseRestClient } from '../src/backend/database/supabase-rest.ts';
import { createSupabaseIdentityVerifier } from '../src/backend/identity/supabase.ts';
import { readJson } from '../src/backend/api/validation.ts';

const config = { projectUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co', publishableKey: 'sb_publishable_synthetic' };
const binding = { APP_SERVICE_URL: 'http://127.0.0.1:3999/' };
const request = () => new Request('https://virtual-ink.example.test/api/v1/me', { headers: { Authorization: 'Bearer synthetic-token' } });

test('rejected provider bodies are cancelled without reading or disclosing private content', async () => {
  for (const transport of ['binding', 'rest', 'identity']) {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode('synthetic private provider details')); },
      cancel() { cancelled = true; },
    });
    const fetcher: typeof fetch = async () => new Response(body, { status: 500, headers: { 'Content-Type': 'application/json' } });
    if (transport === 'binding') {
      const response = await boundAppResponse(request(), binding, fetcher);
      assert.equal(response.status, 503);
      assert.ok(!(await response.text()).includes('private provider'));
    } else if (transport === 'rest') {
      await assert.rejects(createSupabaseRestClient(config, fetcher).request({ path: 'rest/v1/example', method: 'GET' }), { code: 'INTERNAL_ERROR' });
    } else {
      await assert.rejects(createSupabaseIdentityVerifier(config, fetcher).verify('synthetic-token'), { code: 'IDENTITY_UNAVAILABLE' });
    }
    assert.equal(cancelled, true, `${transport} must release an unread error stream`);
  }
});

test('binding rejects scalar, array, missing-body and non-JSON upstream responses', async () => {
  for (const upstream of [Response.json(null), Response.json([]), Response.json(1), new Response(null, { headers: { 'Content-Type': 'application/json' } }),
    new Response('{}', { headers: { 'Content-Type': 'application/jsonp' } })]) {
    const response = await boundAppResponse(request(), binding, async () => upstream);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'IDENTITY_UNAVAILABLE');
  }
});

test('health binding rejects writes and selectors, strips oversized upstream headers and releases HEAD bodies', async () => {
  const noFetch: typeof fetch = async () => { throw new Error('Unexpected provider work'); };
  const method = await boundAppResponse(new Request('http://localhost/health', { method: 'POST' }), binding, noFetch);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, HEAD');
  assert.equal((await boundAppResponse(new Request('http://localhost/health?url=synthetic'), binding, noFetch)).status, 400);
  const response = await boundAppResponse(request(), binding, async () => Response.json({ data: {} }, {
    headers: { 'X-Request-Id': 'x'.repeat(129), Allow: 'x'.repeat(129) },
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), null);
  assert.equal(response.headers.get('allow'), null);
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const head = await boundAppResponse(new Request('http://localhost/health', { method: 'HEAD' }), binding,
    async () => new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(cancelled, true);
});

test('upstream parser handles broken streams, absent bodies and failed cancellation safely', async () => {
  await assert.rejects(readUpstreamJson(new Response(null)));
  const broken = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error('synthetic read failure')); } });
  await assert.rejects(readUpstreamJson(new Response(broken)));
  for (const declared of [false, true]) {
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(MAX_UPSTREAM_JSON_BYTES + 1)); },
      cancel() { throw new Error('synthetic cancellation failure'); },
    });
    await assert.rejects(readUpstreamJson(new Response(body, { headers: declared ? { 'content-length': 'invalid' } : {} })), /size contract/);
  }
});

test('REST rejects invalid tokens, GET bodies and query selectors before dispatch; handles 204 and provider failures', async () => {
  let calls = 0;
  const client = createSupabaseRestClient(config, async () => { calls++; return new Response(null, { status: 204 }); });
  for (const input of [{ accessToken: '' }, { body: {} }, { query: { 'bad&selector': 'synthetic' } }]) {
    await assert.rejects(client.request({ path: 'rest/v1/example', method: 'GET', ...input }));
  }
  assert.equal(calls, 0);
  assert.equal(await client.request({ path: 'rest/v1/example', method: 'DELETE' }), undefined);
  for (const [status, code] of [[401, 'UNAUTHENTICATED'], [429, 'INTERNAL_ERROR']] as const) {
    await assert.rejects(createSupabaseRestClient(config, async () => new Response(null, { status })).request({ path: 'rest/v1/example', method: 'GET' }), { code });
  }
  await assert.rejects(createSupabaseRestClient(config, async () => new Response('{')).request({ path: 'rest/v1/example', method: 'GET' }), { code: 'INTERNAL_ERROR' });
});

test('identity rejects invalid direct tokens and scalar provider records without granting authority', async () => {
  let calls = 0;
  const verifier = createSupabaseIdentityVerifier(config, async () => { calls++; return Response.json({}); });
  await assert.rejects(verifier.verify('token with spaces'), { code: 'UNAUTHENTICATED' });
  assert.equal(calls, 0);
  for (const body of [null, [], 1, 'synthetic']) {
    await assert.rejects(createSupabaseIdentityVerifier(config, async () => Response.json(body)).verify('synthetic-token'), { code: 'IDENTITY_UNAVAILABLE' });
  }
});

test('invalid admission configuration fails closed and operational logger failure cannot break safe responses', async () => {
  for (const maximum of [0, -1, 257, 1.5, NaN, Infinity]) assert.throws(() => createAdmission(maximum));
  const response = await handleApi(new Request('http://localhost/'), () => ({ safe: true }), () => { throw new Error('synthetic log failure'); });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { safe: true });
  await assert.rejects(readJson(new Request('http://localhost/', { method: 'POST', headers: { 'content-type': 'application/json' } }), value => value), { code: 'INVALID_JSON' });
});
