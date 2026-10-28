// Explicit synthetic storage acceptance only. No .env loading, application login,
// real document input, database operation or public upload endpoint is involved.
import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFile, writeFile, lstat } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrivateS3Store } from '../src/backend/storage/s3-private-store.ts';
import { workflowObjectKey } from '../src/backend/storage/workflow-files.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const privateRoot = resolve(root, '.private');
const checks = [], cleanup = [], events = [];
const hash = value => createHash('sha256').update(value).digest('hex');
const hmac = (key, value) => createHmac('sha256', key).update(value).digest();
async function recordFixtures(receipt) {
  const text = JSON.stringify(receipt, null, 2);
  await writeFile(resolve(privateRoot, 'neon-storage-probe-fixtures.json'), text, { mode: 0o600 });
  await writeFile(resolve(privateRoot, `neon-storage-fixtures-${receipt.orderId}.json`), text, { mode: 0o600 });
}
async function privateJson(path) {
  const absolute = resolve(root, path);
  const rel = relative(privateRoot, absolute);
  assert(rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  const info = await lstat(absolute);
  assert(info.isFile() && !info.isSymbolicLink() && info.size < 65536);
  return JSON.parse(await readFile(absolute, 'utf8'));
}
async function check(name, run) {
  const start = events.length;
  try { await run(); checks.push({ name, status: 'pass' }); }
  catch (error) { checks.push({ name, status: 'failed',
    code: ['ERR_ASSERTION','SERVICE_BUSY','CONFLICT','VALIDATION_FAILED'].includes(error.code) ? error.code : 'PROBE_FAILED',
    transport: events.slice(start) }); }
}
const observe = async (url, init) => {
  const started = Date.now();
  try {
    const response = await fetch(url, init);
    events.push({ method: init.method, status: response.status, elapsedMs: Date.now() - started,
      lengthPresent: response.headers.has('content-length'), hashPresent: response.headers.has('x-amz-meta-sha256') });
    return response;
  } catch {
    events.push({ method: init.method, status: 'transport_failed', elapsedMs: Date.now() - started });
    throw new Error('Storage transport failed');
  }
};
async function deniedRead(url) {
  const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
  await response.body?.cancel();
  assert.equal(response.status, 403);
}
// DELETE is deliberately confined to this probe's recorded synthetic keys. The
// application adapter retains no delete method or provider URL response.
async function deleteFixture(config, fixture) {
  const url = new URL(config.endpoint);
  url.pathname = `/${fixture.bucket}/${fixture.key}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''), day = date.slice(0, 8);
  const scope = `${day}/${config.region}/s3/aws4_request`, payload = hash('');
  const headers = { host: url.host, 'x-amz-content-sha256': payload, 'x-amz-date': date };
  const names = Object.keys(headers).sort(), signed = names.join(';');
  const canonical = ['DELETE', url.pathname, '', names.map(name => `${name}:${headers[name]}\n`).join(''), signed, payload].join('\n');
  const key = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, day), config.region), 's3'), 'aws4_request');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${hmac(key, `AWS4-HMAC-SHA256\n${date}\n${scope}\n${hash(canonical)}`).toString('hex')}`;
  const response = await fetch(url, { method: 'DELETE', headers, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
  await response.body?.cancel();
  assert([200, 204, 404].includes(response.status));
}

try {
  assert.equal(process.argv.length, 2, 'Use the fixed private staging binding; arguments are not accepted.');
  const manifest = JSON.parse(await readFile(resolve(root, 'ops/neon-storage.json'), 'utf8'));
  const config = await privateJson('.private/neon-storage-worker.json');
  const readerConfig = await privateJson('.private/neon-storage-read-only.json');
  const endpoint = new URL(config.endpoint);
  assert.equal(manifest.environment, 'staging'); assert.equal(manifest.access, 'private');
  assert.equal(config.environment, 'staging');
  assert.match(manifest.branchId, /^br-[a-z0-9-]+$/);
  assert.equal(endpoint.protocol, 'https:'); assert.equal(endpoint.pathname, '/');
  assert.equal(endpoint.search, ''); assert.equal(endpoint.hash, '');
  assert.equal(endpoint.username, ''); assert.equal(endpoint.password, ''); assert.equal(endpoint.port, '');
  assert.equal(manifest.regionId, 'aws-eu-central-1');
  assert.match(endpoint.hostname, new RegExp(`^${manifest.branchId}\\.storage\\.c-[0-9]+\\.eu-central-1\\.aws\\.neon\\.tech$`));
  assert.deepEqual(config.buckets, manifest.buckets);
  assert.equal(readerConfig.endpoint, config.endpoint); assert.deepEqual(readerConfig.buckets, manifest.buckets);
  assert.notEqual(config.accessKeyId, readerConfig.accessKeyId);
  const credentials = await privateJson('.private/neon-storage-credential-metadata.json');
  for (const [key, scopes] of [[config.accessKeyId, ['storage:read','storage:write']], [readerConfig.accessKeyId, ['storage:read']]]) {
    const credential = credentials.find(item => item.token_id === key);
    assert.equal(credential?.branch_id, manifest.branchId);
    assert.deepEqual([...credential.scopes].sort(), scopes);
  }
  const inventory = await privateJson('.private/neon-storage-buckets.json');
  assert.deepEqual(inventory.map(item => item.name).sort(), Object.values(manifest.buckets).sort());
  assert(inventory.every(item => item.access_level === 'private'));
  const parent = await privateJson('.private/neon-storage-parent-buckets.json');
  assert.deepEqual(parent, []);
  checks.push({ name: 'target_binding_and_six_private_buckets', status: 'pass' });
  const store = createPrivateS3Store(config, observe), readOnly = createPrivateS3Store(readerConfig, observe);
  const orderId = randomUUID();
  const bytes = Buffer.from('%PDF-1.7\n% Virtual Ink synthetic storage probe only\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
  try {
    for (const purpose of ['source','proof','production','evidence','dispute']) {
      const file = { fileId: randomUUID(), orderId, purpose, mime: 'application/pdf', size: bytes.length };
      const key = workflowObjectKey(file);
      const quarantine = { bucket: config.buckets.quarantine, key }, approved = { bucket: config.buckets[purpose], key };
      cleanup.push(quarantine, approved);
      await recordFixtures({ orderId, fixtures: cleanup, cleanupComplete: false });
      let version, promoted;
      await check(`${purpose}_quarantine_put_and_metadata`, async () => { version = await store.put(file, bytes); assert.match(version, /^quarantine:/); });
      await check(`${purpose}_quarantine_readback`, async () => { assert.deepEqual(Buffer.from(await store.read(file, version)), bytes); });
      await check(`${purpose}_overwrite_denied_412`, async () => {
        await assert.rejects(store.put(file, bytes), { code: 'CONFLICT' });
        assert.equal(events.at(-1).status, 412);
      });
      await check(`${purpose}_wrong_etag_denied_412`, async () => {
        await assert.rejects(store.read(file, 'quarantine:"synthetic-wrong-etag"'));
        assert.equal(events.at(-1).status, 412);
      });
      await check(`${purpose}_verified_promotion`, async () => { promoted = await store.promote(file, version, hash(bytes)); assert.match(promoted, /^approved:/); });
      await check(`${purpose}_approved_hash_readback`, async () => { assert.deepEqual(Buffer.from(await store.read(file, promoted)), bytes); });
      await check(`${purpose}_read_only_credential_read`, async () => { assert.deepEqual(Buffer.from(await readOnly.read(file, promoted)), bytes); });
      for (const [label, fixture] of [['quarantine', quarantine], ['approved', approved]]) {
        await check(`${purpose}_${label}_anonymous_denied_403`, () => deniedRead(new URL(`/${fixture.bucket}/${fixture.key}`, endpoint)));
      }
      if (purpose === 'source') {
        await check('read_only_credential_write_denied_403', async () => {
          const deniedFile = { ...file, fileId: randomUUID() };
          cleanup.push({ bucket: config.buckets.quarantine, key: workflowObjectKey(deniedFile) });
          await recordFixtures({ orderId, fixtures: cleanup, cleanupComplete: false });
          await assert.rejects(readOnly.put(deniedFile, bytes)); assert.equal(events.at(-1).status, 403);
        });
        await check('invalid_signature_denied_403', async () => {
          const invalid = createPrivateS3Store({ ...config, secretAccessKey: 'synthetic-invalid-secret' }, observe);
          await assert.rejects(invalid.read(file, promoted)); assert.equal(events.at(-1).status, 403);
        });
        await check('child_credential_parent_branch_denied_403', async () => {
          assert.match(manifest.parentBranchId, /^br-[a-z0-9-]+$/);
          const parentEndpoint = new URL(config.endpoint);
          parentEndpoint.hostname = parentEndpoint.hostname.replace(manifest.branchId, manifest.parentBranchId);
          const parentStore = createPrivateS3Store({ ...config, endpoint: parentEndpoint.href }, observe);
          await assert.rejects(parentStore.read(file, promoted)); assert.equal(events.at(-1).status, 403);
        });
      }
    }
  } finally {
    // Record exact task-owned keys before cleanup. Interrupted cleanup can be
    // resumed privately without listing/deleting unrelated objects or a prefix.
    await recordFixtures({ orderId, fixtures: cleanup, cleanupComplete: false });
    for (const fixture of cleanup) await check('cleanup_exact_synthetic_object', () => deleteFixture(config, fixture));
    await recordFixtures({ orderId, fixtures: cleanup,
      cleanupComplete: checks.filter(item => item.name === 'cleanup_exact_synthetic_object').every(item => item.status === 'pass') });
  }
} catch {
  checks.push({ name: 'storage_probe_admission_or_transport', status: 'failed' });
}
const report = { check: 'neon_private_storage', checkedUtc: new Date().toISOString(),
  status: checks.length && checks.every(item => item.status === 'pass') ? 'pass' : 'failed',
  passed: checks.filter(item => item.status === 'pass').length,
  failed: checks.filter(item => item.status === 'failed').length, checks,
  limits: 'Synthetic hosted storage operations only; no genuine Auth, malware scanning, database workflow, application upload, Vercel service or device acceptance.' };
await writeFile(resolve(privateRoot, 'neon-storage-probe-result.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, checks: report.checks.filter(item => item.status !== 'pass') }, null, 2));
process.exitCode = report.status === 'pass' ? 0 : 1;
