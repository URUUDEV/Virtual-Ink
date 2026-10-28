// Local operator setup only. Read ignored Neon exports, validate the staging
// binding, and write private worker files. Never load the application's .env.
import assert from 'node:assert/strict';
import { readFile, writeFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createPrivateS3Store } from '../src/backend/storage/s3-private-store.ts';

const root = new URL('../', import.meta.url);
async function load(name, json = true) {
  const path = new URL(`.private/${name}`, root);
  const info = await lstat(path);
  assert(info.isFile() && !info.isSymbolicLink() && info.size < 65536);
  const value = await readFile(path, 'utf8');
  return json ? JSON.parse(value) : value;
}
try {
  assert.equal(process.argv.length, 2);
  const manifest = JSON.parse(await readFile(new URL('ops/neon-storage.json', root), 'utf8'));
  assert.equal(manifest.environment, 'staging'); assert.equal(manifest.access, 'private');
  assert.equal(manifest.regionId, 'aws-eu-central-1'); assert.match(manifest.branchId, /^br-[a-z0-9-]+$/);
  const env = parseEnv(await load('neon-storage-endpoint.env', false));
  assert(Object.keys(env).every(key => ['AWS_ENDPOINT_URL_S3','AWS_REGION','NEON_BRANCH'].includes(key)));
  assert([manifest.branchId, manifest.branchName].includes(env.NEON_BRANCH));
  const endpoint = new URL(env.AWS_ENDPOINT_URL_S3);
  assert.match(endpoint.hostname, new RegExp(`^${manifest.branchId}\\.storage\\.c-[0-9]+\\.eu-central-1\\.aws\\.neon\\.tech$`));
  assert.equal(endpoint.pathname, '/'); assert.equal(endpoint.port, '');
  const metadata = await load('neon-storage-credential-metadata.json');
  for (const [source, output, expectedScopes] of [
    ['neon-storage-writer-rw.json', 'neon-storage-worker.json', ['storage:read','storage:write']],
    ['neon-storage-reader.json', 'neon-storage-read-only.json', ['storage:read']],
  ]) {
    const raw = await load(source), credential = raw.credential ?? raw;
    const record = metadata.find(item => item.token_id === credential.token_id);
    assert.equal(record?.branch_id, manifest.branchId);
    assert.deepEqual([...record.scopes].sort(), expectedScopes);
    const config = { environment: 'staging', endpoint: endpoint.href, region: env.AWS_REGION,
      accessKeyId: credential.token_id, secretAccessKey: credential.s3_secret_access_key, buckets: manifest.buckets };
    createPrivateS3Store(config);
    await writeFile(new URL(`.private/${output}`, root), JSON.stringify(config, null, 2), { mode: 0o600 });
  }
  console.log(JSON.stringify({ check: 'neon_storage_private_binding', status: 'pass',
    projectId: manifest.projectId, branchId: manifest.branchId, credentialValuesPrinted: false,
    outputDirectory: fileURLToPath(new URL('.private/', root)) }));
} catch {
  console.error(JSON.stringify({ check: 'neon_storage_private_binding', status: 'failed', code: 'NEON_STORAGE_CONFIGURATION_FAILED' }));
  process.exitCode = 1;
}
