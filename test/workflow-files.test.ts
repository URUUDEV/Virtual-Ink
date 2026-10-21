import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createWorkflowFileWorker, downloadWorkflowFile, copyApprovedProductionFile, workflowObjectKey, type PrivateObjectStore, type WorkflowFile } from '../src/backend/storage/workflow-files.ts';
import { createPrivateS3Store, type PrivateS3Config } from '../src/backend/storage/s3-private-store.ts';
import type { SqlExecutor } from '../src/backend/database/ports.ts';
import type { WorkflowCommands } from '../src/backend/orders/workflow.ts';
import type { SecurityIdentity } from '../src/backend/identity/security-admin.ts';
const id = '12345678-1234-4123-8123-123456789abc';
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const file: WorkflowFile = { fileId: id, orderId: id, purpose: 'source', mime: 'application/pdf', size: pdf.length };
const store: PrivateObjectStore = { put: async () => 'quarantine:"abc"', read: async () => pdf, promote: async () => 'approved:"abc"' };
const clean = { scan: async (bytes: Uint8Array) => ({ verdict: 'clean' as const, sha256: hash(bytes) }) };
const database = (record?: (values: unknown[]) => unknown, pending: unknown = file): SqlExecutor => ({
  async query(statement, parameters) {
    if (statement.includes('pending_file')) return { rows: [{ file: pending }] as never, rowCount: 1 };
    return { rows: [{ result: record ? record([...parameters]) : { fileId: id, status: parameters[3] } }] as never, rowCount: 1 };
  },
});
const identity: SecurityIdentity = { issuer: 'https://synthetic.invalid/auth/v1', subject: id, sessionId: id, aal: 'aal1', mfaAt: null, primaryAt: null, stepUpAt: null };
const input = { orderId: id, fileId: id, operationId: id };
const access = (patch: Record<string,unknown> = {}): WorkflowCommands => ({ run: async () => ({ ...file, objectVersion: 'approved:"abc"', sha256: hash(pdf), ...patch }) });
const config: PrivateS3Config = { environment: 'local', endpoint: 'http://127.0.0.1:9000', region: 'us-east-1', accessKeyId: 'synthetic', secretAccessKey: 'synthetic-local-secret',
  buckets: { quarantine: 'vi-quarantine', source: 'vi-source', proof: 'vi-proof', production: 'vi-production', evidence: 'vi-evidence', dispute: 'vi-dispute' } };
const response = (bytes: Uint8Array = pdf, headers: Record<string,string> = {}) => new Response(Buffer.from(bytes), {
  headers: { etag: '"abc"', 'content-type': file.mime, 'content-length': String(pdf.length), 'x-amz-meta-sha256': hash(pdf), ...headers },
});

test('private worker scans stored bytes, promotes into purpose storage and commits the actual audited outcome', async () => {
  const calls: unknown[] = [];
  const worker = createWorkflowFileWorker(database(values => { calls.push(values); return { fileId: id, status: values[3] }; }), store, clean);
  assert.deepEqual(await worker.ingest(id, pdf, id), { fileId: id, status: 'SAFE' });
  assert.equal((calls[0] as unknown[])[1], 'approved:"abc"');
  assert.equal((calls[0] as unknown[])[2], hash(pdf));
  const downgrade = createWorkflowFileWorker(database(() => ({ fileId: id, status: 'REVIEW_REQUIRED' })), store, clean);
  assert.equal((await downgrade.ingest(id, pdf, id)).status, 'REVIEW_REQUIRED');
});

test('private worker rejects unbound/oversized/shared bytes and malformed queue metadata', async () => {
  for (const pending of [null, { ...file, orderId: 'other' }, { ...file, purpose: 'public' }, { ...file, size: 0 }, { ...file, size: 26214401 }, { ...file, mime: 'text/html' }, { ...file, fileId: '12345678-1234-4123-8123-123456789abd' }]) {
    await assert.rejects(createWorkflowFileWorker(database(undefined, pending), store, clean).ingest(id, pdf, id));
  }
  for (const bytes of [Buffer.alloc(0), new Uint8Array(new SharedArrayBuffer(pdf.length)), 'bad']) {
    await assert.rejects(createWorkflowFileWorker(database(), store, clean).ingest(id, bytes as Uint8Array, id), { code: 'CONFLICT' });
  }
  const empty: SqlExecutor = { query: async () => ({ rows: [], rowCount: 0 }) };
  await assert.rejects(createWorkflowFileWorker(empty, store, clean).ingest(id, pdf, id), { code: 'NOT_FOUND' });
});

test('production copies require the approved proof provenance and recheck stored bytes before scanning', async () => {
  const target = { ...file, purpose: 'production' }, source = { ...file, purpose: 'proof' };
  const provenance = { file: target, source, sourceVersion: 'approved:"abc"', sha256: hash(pdf), status: 'QUARANTINED' };
  const prepare = (copy: unknown): SqlExecutor => ({ async query(sql, values) {
    if (sql.includes('prepare_production_copy')) return { rows: [{ copy }] as never, rowCount: 1 };
    return database(undefined, target).query(sql, values);
  } });
  assert.equal((await copyApprovedProductionFile(prepare(provenance), store, clean, id, id)).status, 'SAFE');
  assert.equal((await copyApprovedProductionFile(prepare({ ...provenance, status: 'SAFE' }), store, clean, id, id)).status, 'SAFE');
  for (const copy of [null, { ...provenance, file: { ...target, purpose: 'source' } }, { ...provenance, source: { ...source, purpose: 'source' } },
    { ...provenance, sourceVersion: null }, { ...provenance, sha256: 'bad' }, { ...provenance, status: 'REJECTED' }, { ...provenance, sha256: 'b'.repeat(64) }]) {
    await assert.rejects(copyApprovedProductionFile(prepare(copy), store, clean, id, id));
  }
});

test('worker refuses unsafe content, provider mutation, failed promotion and unknown external outcomes', async () => {
  const broken = async () => { throw new Error('private storage credential'); };
  for (const patch of [{ put: broken }, { put: async () => '' }, { put: async () => 'x'.repeat(257) },
    { read: async () => Buffer.alloc(pdf.length) }, { read: async () => Buffer.alloc(1) }, { promote: broken }]) {
    assert.equal((await createWorkflowFileWorker(database(), { ...store, ...patch }, clean).ingest(id, pdf, id)).status, 'REVIEW_REQUIRED');
  }
  const infected = { scan: async (bytes: Uint8Array) => ({ verdict: 'infected' as const, sha256: hash(bytes) }) };
  assert.equal((await createWorkflowFileWorker(database(), store, infected).ingest(id, pdf, id)).status, 'REJECTED');
  let reads = 0;
  assert.equal((await createWorkflowFileWorker(database(), { ...store, read: async () => ++reads === 1 ? pdf : Buffer.alloc(pdf.length) }, clean).ingest(id, pdf, id)).status, 'REVIEW_REQUIRED');
  for (const record of [undefined, {}, { fileId: id, status: 'unknown' }]) {
    await assert.rejects(createWorkflowFileWorker(database(() => record), store, clean).ingest(id, pdf, id), { code: 'AUDIT_UNAVAILABLE' });
  }
});

test('download proxies verify hash/size and recheck current authorization after provider work', async () => {
  let calls = 0;
  const commands: WorkflowCommands = { run: async () => { calls++; return access().run('file.access', input, identity, id); } };
  const result = await downloadWorkflowFile(commands, store, identity, input, id);
  assert.equal(calls, 2); assert.deepEqual(Buffer.from(await result.arrayBuffer()), pdf);
  assert.match(result.headers.get('content-disposition')!, /^attachment;/); assert.equal(result.headers.get('cache-control'), 'no-store');
  for (const mime of ['image/png','image/jpeg']) assert.match((await downloadWorkflowFile(access({ mime }), store, identity, input, id)).headers.get('content-disposition')!, mime.endsWith('png') ? /\.png/ : /\.jpg/);
  for (const patch of [{ sha256: 'b'.repeat(64) }, { objectVersion: null }, { fileId: '12345678-1234-4123-8123-123456789abd' }, { orderId: '12345678-1234-4123-8123-123456789abd' }]) {
    await assert.rejects(downloadWorkflowFile(access(patch), store, identity, input, id));
  }
  await assert.rejects(downloadWorkflowFile(access(), { ...store, read: async () => Buffer.alloc(1) }, identity, input, id), { code: 'CONFLICT' });
  await assert.rejects(downloadWorkflowFile(access(), { ...store, read: async () => { throw new Error('private'); } }, identity, input, id), { code: 'SERVICE_BUSY' });
  calls = 0;
  const revoked: WorkflowCommands = { run: async () => { if (++calls === 2) throw new Error('revoked'); return access().run('file.access', input, identity, id); } };
  await assert.rejects(downloadWorkflowFile(revoked, store, identity, input, id));
  calls = 0;
  const changed: WorkflowCommands = { run: async () => access({ objectVersion: ++calls === 2 ? 'changed' : 'approved:"abc"' }).run('file.access', input, identity, id) };
  await assert.rejects(downloadWorkflowFile(changed, store, identity, input, id), { code: 'CONFLICT' });
});

test('S3 worker configuration requires private HTTPS or explicit local loopback and six distinct buckets', () => {
  for (const patch of [{ endpoint: 'http://attacker.test' }, { endpoint: 'https://u:p@storage.test/' }, { endpoint: 'https://storage.test/?secret=x' },
    { endpoint: 'https://storage.test/wrong' }, { endpoint: 'bad' }, { environment: 'staging', endpoint: config.endpoint }, { environment: 'unknown' },
    { region: '../' }, { accessKeyId: 'secret\n' }, { secretAccessKey: 'short' }, { buckets: {} }, { buckets: { ...config.buckets, proof: 'vi-source' } }]) {
    assert.throws(() => createPrivateS3Store({ ...config, ...patch } as PrivateS3Config));
  }
  assert(Object.isFrozen(createPrivateS3Store({ ...config, environment: 'staging', endpoint: 'https://storage.test/storage/v1/s3' })));
  assert.throws(() => workflowObjectKey({ ...file, purpose: 'public' as never }));
});

test('S3 requests are signed, immutable and conditional with no URL credentials or redirects', async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, init) => { requests.push({ url: String(url), init: init! }); return init!.method === 'PUT' ? new Response('', { headers: { etag: '"abc"' } }) : response(); };
  const s3 = createPrivateS3Store(config, fetcher, () => new Date('2026-10-21T10:00:00Z'));
  const version = await s3.put(file, pdf);
  assert.equal(version, 'quarantine:"abc"');
  const first = requests[0]; const headers = first.init.headers as Record<string,string>;
  assert.equal(headers['if-none-match'], '*'); assert.equal(headers['x-amz-content-sha256'], hash(pdf));
  assert.match(headers.authorization, /^AWS4-HMAC-SHA256 Credential=synthetic\/20261021\/us-east-1\/s3\/aws4_request,/);
  assert.equal(first.init.redirect, 'error'); assert(!first.url.includes('secret')); assert.equal(new URL(first.url).search, '');
  assert.deepEqual(await s3.read(file, version), pdf);
  assert.equal((requests[1].init.headers as Record<string,string>)['if-match'], '"abc"');
  assert.equal(await s3.promote(file, version, hash(pdf)), 'approved:"abc"');
  assert(requests.some(request => request.url.includes('/vi-source/orders/')));
});

test('S3 reads reject changed, oversized, truncated, missing and misbound provider bodies', async () => {
  for (const headers of [{ etag: '"other"' }, { 'content-type': 'text/html' }, { 'content-length': '999' }, { 'content-length': 'bad' }, { 'x-amz-meta-sha256': 'bad' }]) {
    const s3 = createPrivateS3Store(config, async () => response(pdf, headers));
    await assert.rejects(s3.read(file, 'approved:"abc"'));
  }
  for (const bytes of [Buffer.alloc(1), Buffer.alloc(pdf.length + 1)]) await assert.rejects(createPrivateS3Store(config, async () => response(bytes)).read(file, 'approved:"abc"'));
  await assert.rejects(createPrivateS3Store(config, async () => new Response(null)).read(file, 'approved:"abc"'));
  await assert.rejects(createPrivateS3Store(config).read(file, 'bad'));
  await assert.rejects(createPrivateS3Store(config).put({ ...file, size: 26214401 }, pdf));
  await assert.rejects(createPrivateS3Store(config).put(file, Buffer.alloc(1)));
  await assert.rejects(createPrivateS3Store(config).put(file, new Uint8Array(new SharedArrayBuffer(pdf.length))));
});

test('S3 transport fails closed on errors, conflicts, missing receipts and invalid promotion hashes', async () => {
  for (const status of [403, 412, 503]) {
    const s3 = createPrivateS3Store(config, async () => new Response('private diagnostic', { status }));
    await assert.rejects(s3.put(file, pdf), { code: status === 412 ? 'CONFLICT' : 'SERVICE_BUSY' });
  }
  await assert.rejects(createPrivateS3Store(config, async () => { throw new Error('secret'); }).put(file, pdf), { code: 'SERVICE_BUSY' });
  for (const headers of [{}, { etag: 'unquoted' }]) await assert.rejects(createPrivateS3Store(config, async () => new Response('', { headers })).put(file, pdf), { code: 'SERVICE_BUSY' });
  const s3 = createPrivateS3Store(config, async () => response());
  await assert.rejects(s3.promote(file, 'approved:"abc"', hash(pdf)), { code: 'CONFLICT' });
  await assert.rejects(s3.promote(file, 'quarantine:"abc"', 'bad'), { code: 'CONFLICT' });
  await assert.rejects(s3.promote(file, 'quarantine:"abc"', 'b'.repeat(64)), { code: 'CONFLICT' });
});
