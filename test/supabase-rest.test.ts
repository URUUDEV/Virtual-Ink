import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupabaseRestClient, loadSupabaseRestConfig } from '../src/backend/database/supabase-rest.ts';

const ref = 'aaaaaaaaaaaaaaaaaaaa';
const env = { SUPABASE_URL: `https://${ref}.supabase.co`, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' };
test('Supabase REST config only accepts a project URL and publishable key', () => {
  assert.deepEqual(loadSupabaseRestConfig(env), { projectUrl: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY });
  assert.throws(() => loadSupabaseRestConfig({ ...env, SUPABASE_URL: `http://${ref}.supabase.co` }), /HTTPS/);
  assert.throws(() => loadSupabaseRestConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_synthetic' }), /publishable/);
  assert.throws(() => loadSupabaseRestConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'service_role_synthetic' }), /publishable/);
});
test('REST adapter sends publishable key and verified user token without logging or accepting provider paths', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const client = createSupabaseRestClient(loadSupabaseRestConfig(env), async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify([{ id: 'synthetic' }]), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const rows = await client.request<{ id: string }[]>({ path: 'rest/v1/virtual_ink_items', method: 'GET',
    accessToken: 'user-access-token', query: { select: 'id', limit: '20' } });
  assert.deepEqual(rows, [{ id: 'synthetic' }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://${ref}.supabase.co/rest/v1/virtual_ink_items?select=id&limit=20`);
  assert.deepEqual(calls[0].init?.headers, { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer user-access-token' });
  await assert.rejects(client.request({ path: 'auth/v1/admin/users', method: 'GET' } as never), /Request validation failed/);
  await assert.rejects(client.request({ path: 'rest/v1/virtual_ink_items', method: 'GET', accessToken: 'token\r\nsecret' }), /Authentication/);
});
test('REST adapter maps auth/policy failures to safe API errors and hides provider text', async () => {
  const response = async () => new Response('private table or policy detail', { status: 403 });
  const client = createSupabaseRestClient(loadSupabaseRestConfig(env), response);
  await assert.rejects(client.request({ path: 'rest/v1/virtual_ink_items', method: 'GET' }), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'FORBIDDEN');
    assert.equal((error as Error).message.includes('private'), false);
    return true;
  });
});
