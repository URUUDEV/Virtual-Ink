import assert from 'node:assert/strict';
import test from 'node:test';
import { loadInfrastructureConfig } from '../src/backend/config.ts';
import { createSupabaseRestClient, loadSupabaseRestConfig } from '../src/backend/database/supabase-rest.ts';
import { accessResponse } from '../src/backend/identity/routes.ts';
import { ApiError } from '../src/backend/api/errors.ts';
import { createSupabaseIdentityVerifier } from '../src/backend/identity/supabase.ts';
import { readUpstreamJson, MAX_UPSTREAM_JSON_BYTES } from '../src/backend/api/upstream-json.ts';

const env = { SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' };
const legacySecret = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'synthetic-signature'].join('.');

test('security: public environment rejects privileged names and disguised credential values', () => {
  for (const settings of [
    { NEXT_PUBLIC_PROVISIONING_DATABASE_URL: 'synthetic' },
    { NEXT_PUBLIC_CUSTOM_PASSWORD: 'synthetic' },
    { NEXT_PUBLIC_CUSTOM_KEY: 'postgresql://synthetic:synthetic@localhost/virtual_ink_dev' },
    { NEXT_PUBLIC_CUSTOM_KEY: legacySecret },
    { NEXT_PUBLIC_CUSTOM_KEY: ' sb_secret_synthetic' },
  ]) assert.throws(() => loadInfrastructureConfig(settings), /server-side/);
  assert.equal(loadInfrastructureConfig({ NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.SUPABASE_PUBLISHABLE_KEY }).nodeEnv, 'development');
});

test('security: REST config rejects legacy secret-shaped keys without decoding claims into authority', () => {
  for (const key of [legacySecret, 'sb_secret_synthetic', 'arbitrary-key', ' sb_publishable_synthetic', 'sb_publishable_synthetic\n']) {
    assert.throws(() => loadSupabaseRestConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: key }), /publishable/);
    assert.throws(() => createSupabaseRestClient({ projectUrl: env.SUPABASE_URL, publishableKey: key }), /publishable/);
  }
});

test('security: REST transport disables redirects/cache and supplies a deadline', async () => {
  const client = createSupabaseRestClient(loadSupabaseRestConfig(env), async (_url, init) => {
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.cache, 'no-store');
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json([]);
  });
  assert.deepEqual(await client.request({ path: 'rest/v1/example', method: 'GET' }), []);
});

test('security: REST network failures hide provider URLs and credentials', async () => {
  const client = createSupabaseRestClient(loadSupabaseRestConfig(env), async () => {
    throw new Error('synthetic private provider URL and credential');
  });
  await assert.rejects(client.request({ path: 'rest/v1/example', method: 'GET' }), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'INTERNAL_ERROR');
    assert.equal((error as Error).message.includes('private'), false);
    return true;
  });
});

test('security: protected work has a bounded admission ceiling before provider/database calls', async () => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  let providerCalls = 0;
  const dependencies = {
    verifier: { async verify() { providerCalls++; await hold; throw new ApiError('UNAUTHENTICATED'); } },
    database: { async query() { throw new Error('Database must not run'); },
      async transaction() { throw new Error('Database must not run'); }, async close() {} },
  };
  const requests = Array.from({ length: 33 }, () => accessResponse(new Request('http://localhost/api/v1/me',
    { headers: { authorization: 'Bearer synthetic-token' } }), dependencies));
  // Handler/verifier entry occurs synchronously until the first awaited provider call.
  const admitted = providerCalls;
  release();
  const responses = await Promise.all(requests);
  assert.equal(admitted, 16);
  assert.equal(responses.filter((response) => response.status === 503).length, 17);
  assert.equal(responses.filter((response) => response.status === 401).length, 16);
  assert.equal((await accessResponse(new Request('http://localhost/api/v1/me',
    { headers: { authorization: 'Bearer synthetic-token' } }), dependencies)).status, 401);
  assert.equal(providerCalls, 17, 'Admission slots release on rejected verification');
});

test('security: upstream JSON is bounded for REST and identity verification', async () => {
  const huge = () => Response.json({ id: '11111111-1111-4111-8111-111111111111', is_anonymous: false,
    user_metadata: { synthetic: 'x'.repeat(1024 * 1024) } });
  const config = loadSupabaseRestConfig(env);
  const client = createSupabaseRestClient(config, async () => huge());
  await assert.rejects(client.request({ path: 'rest/v1/example', method: 'GET' }), { code: 'INTERNAL_ERROR' });
  const verifier = createSupabaseIdentityVerifier(config, async () => huge());
  await assert.rejects(verifier.verify('synthetic-token'), { code: 'IDENTITY_UNAVAILABLE' });
});

test('security: upstream limit checks actual streamed bytes and cancels oversize responses', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(MAX_UPSTREAM_JSON_BYTES + 1)); },
    cancel() { cancelled = true; },
  });
  await assert.rejects(readUpstreamJson(new Response(body, { headers: { 'content-length': '1' } })));
  assert.equal(cancelled, true);
});

test('security: upstream parser rejects invalid UTF-8/JSON and oversized declarations', async () => {
  for (const response of [new Response(new Uint8Array([0xff])), new Response('{broken'),
    new Response('{}', { headers: { 'content-length': String(MAX_UPSTREAM_JSON_BYTES + 1) } })]) {
    await assert.rejects(readUpstreamJson(response));
  }
  assert.deepEqual(await readUpstreamJson(Response.json({ synthetic: true })), { synthetic: true });
});
