import assert from 'node:assert/strict';
import test from 'node:test';
import { loadInfrastructureConfig } from '../src/backend/config.ts';
import { ApiError } from '../src/backend/api/errors.ts';
import { handleApi } from '../src/backend/api/responses.ts';
import { boundedText, parsePagination, readJson, strictObject, uuid } from '../src/backend/api/validation.ts';
import { healthResponse } from '../src/backend/health.ts';
import { createAuditEvent, recordAudit } from '../src/backend/audit/events.ts';
import type { AuditInput, AuditEvent } from '../src/backend/audit/events.ts';
import { privateObjectKey, requireFileAccessFoundation } from '../src/backend/storage/private-files.ts';
import { executeDemoProbe } from '../src/backend/jobs/demo-probe.ts';

const id = '11111111-1111-4111-8111-111111111111';
const input: AuditInput = { action: 'file.accessed', actorType: 'user', actorId: id, tenantId: id,
  requestId: id, resourceId: id, outcome: 'allowed' };
const code = (expected: string) => (error: unknown) => error instanceof ApiError && error.code === expected;
const request = (body: string, headers: Record<string, string> = { 'content-type': 'application/json' }) =>
  new Request('http://localhost/test', { method: 'POST', body, headers });

test('versioned health has safe envelope, generated ID and no integration claims', async () => {
  const response = await healthResponse(new Request('http://localhost/api/v1/health', { headers: { 'x-request-id': 'client-secret' } }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, { service: 'Virtual Ink', status: 'ok' });
  assert.equal(body.meta.requestId, response.headers.get('x-request-id'));
  assert.notEqual(body.meta.requestId, 'client-secret');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
test('versioned health rejects mutations and supports body-free HEAD', async () => {
  const response = await healthResponse(request('{}'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
  assert.equal((await response.json()).error.code, 'METHOD_NOT_ALLOWED');
  assert.equal(await (await healthResponse(new Request('http://localhost/health', { method: 'HEAD' }))).text(), '');
});
test('unknown exceptions return generic errors and logs omit private inputs', async () => {
  const events: unknown[] = [];
  const response = await handleApi(request('{"address":"private-address"}', {
    'content-type': 'application/json', authorization: 'secret', cookie: 'private-cookie',
  }), () => { throw new Error('postgresql://secret-address?signature=signed-secret'); }, (event) => events.push(event));
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.error.code, 'INTERNAL_ERROR');
  assert.equal(/secret|address|cookie|postgres/.test(JSON.stringify({ body, events })), false);
  assert.equal((events[0] as { statusCode: number }).statusCode, 500);
});
test('known errors retain stable status without returning input', async () => {
  const response = await handleApi(request('{}'), () => { throw new ApiError('VALIDATION_FAILED', ['quantity']); });
  assert.equal(response.status, 400);
  assert.deepEqual((await response.json()).error.fields, ['quantity']);
});
test('JSON parsing validates content type, encoding and malformed bodies', async () => {
  const validate = (value: unknown) => strictObject(value, ['label']);
  assert.deepEqual(await readJson(request('{"label":"demo"}'), validate), { label: 'demo' });
  await assert.rejects(readJson(request('{}', {}), validate), code('UNSUPPORTED_MEDIA_TYPE'));
  await assert.rejects(readJson(request('{broken'), validate), code('INVALID_JSON'));
  await assert.rejects(readJson(request('null'), validate), code('VALIDATION_FAILED'));
  await assert.rejects(readJson(request('{"price_total":1}'), validate), code('VALIDATION_FAILED'));
});
test('body limit rejects both declared and actually streamed oversized data', async () => {
  const validate = (value: unknown) => value;
  await assert.rejects(readJson(request('{}', { 'content-type': 'application/json', 'content-length': '20000' }), validate), code('PAYLOAD_TOO_LARGE'));
  await assert.rejects(readJson(request(JSON.stringify({ text: 'x'.repeat(17000) })), validate), code('PAYLOAD_TOO_LARGE'));
});
test('strict validation rejects prototype injection, invalid IDs and control characters', () => {
  assert.throws(() => strictObject(JSON.parse('{"__proto__":{}}'), []), code('VALIDATION_FAILED'));
  assert.throws(() => uuid('../../private-file'), code('VALIDATION_FAILED'));
  assert.throws(() => boundedText('line\nsecret', 'label'), code('VALIDATION_FAILED'));
  assert.equal(boundedText(' Demo ', 'label'), 'Demo');
});
test('pagination is bounded, strict and rejects repeated parameters', () => {
  assert.deepEqual(parsePagination(new URLSearchParams()), { limit: 20, cursor: null });
  assert.deepEqual(parsePagination(new URLSearchParams(`limit=100&cursor=${id}`)), { limit: 100, cursor: id });
  for (const query of ['limit=0', 'limit=101', 'limit=2.5', 'limit=20&limit=100', 'cursor=bad', 'vendor_id=untrusted']) {
    assert.throws(() => parsePagination(new URLSearchParams(query)), code('VALIDATION_FAILED'));
  }
});
test('infrastructure remains optional but enabled services require safe configuration', () => {
  assert.equal(loadInfrastructureConfig({}).databaseConfigured, false);
  assert.throws(() => loadInfrastructureConfig({ JOBS_ENABLED: 'true' }), /requires DATABASE_URL/);
  assert.throws(() => loadInfrastructureConfig({ STORAGE_ENABLED: 'true' }), /requires all S3/);
  assert.throws(() => loadInfrastructureConfig({ DATABASE_URL: 'secret-invalid-url' }), { message: 'Database connection URL is invalid.' });
  assert.throws(() => loadInfrastructureConfig({ NEXT_PUBLIC_DATABASE_URL: 'secret' }), /server-side/);
  assert.throws(() => loadInfrastructureConfig({ JOBS_ENABLED: '1' }), /true or false/);
});
test('storage configuration refuses external plaintext and production loopback plaintext', () => {
  const settings = { STORAGE_ENABLED: 'true', S3_ENDPOINT: 'https://storage.example.invalid',
    S3_REGION: 'demo', S3_BUCKET: 'demo-private', S3_ACCESS_KEY_ID: 'demo', S3_SECRET_ACCESS_KEY: 'demo' };
  assert.equal(loadInfrastructureConfig(settings).storageEnabled, true);
  assert.throws(() => loadInfrastructureConfig({ ...settings, S3_ENDPOINT: 'http://storage.example.invalid' }), /HTTPS/);
  assert.throws(() => loadInfrastructureConfig({ ...settings, NODE_ENV: 'production', S3_ENDPOINT: 'http://127.0.0.1:9000' }), /HTTPS/);
  assert.equal(loadInfrastructureConfig({ ...settings, S3_ENDPOINT: 'http://127.0.0.1:9000' }).storageEnabled, true);
});
test('audit events require tenant context and reject private metadata', () => {
  const event = createAuditEvent(input);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(event.tenantId, id);
  assert.notEqual(event.id, id);
  assert.throws(() => createAuditEvent({ ...input, tenantId: null }), code('VALIDATION_FAILED'));
  assert.throws(() => createAuditEvent({ ...input, actorId: null }), code('VALIDATION_FAILED'));
  assert.throws(() => createAuditEvent({ ...input, address: 'private' } as AuditInput), code('VALIDATION_FAILED'));
});
test('required audit fails closed without a durable sink or on sink failure', async () => {
  await assert.rejects(recordAudit(input), code('AUDIT_UNAVAILABLE'));
  await assert.rejects(recordAudit(input, { append: async () => { throw new Error('private sink failure'); } }), code('AUDIT_UNAVAILABLE'));
  const recorded: AuditEvent[] = [];
  const event = await recordAudit(input, { append: async (value) => { recorded.push(value); } });
  assert.deepEqual(recorded, [event]);
});
test('private object locations reject traversal and grant no access', () => {
  assert.equal(privateObjectKey({ tenantId: id, fileId: id }), `tenants/${id}/files/${id}`);
  assert.throws(() => privateObjectKey({ tenantId: '../other', fileId: id }), code('VALIDATION_FAILED'));
  assert.throws(() => requireFileAccessFoundation(), code('FORBIDDEN'));
});
test('demo jobs accept no customer data or implicit production payload', () => {
  assert.deepEqual(executeDemoProbe({ demo: true }), { kind: 'system.probe', status: 'completed', demo: true });
  assert.throws(() => executeDemoProbe({ demo: false }), code('VALIDATION_FAILED'));
  assert.throws(() => executeDemoProbe({ demo: true, file: 'private' }), code('VALIDATION_FAILED'));
});
