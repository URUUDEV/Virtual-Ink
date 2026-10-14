import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectText, privatePath } from '../scripts/security-check.ts';
import { runtimeIsAllowed } from '../scripts/security-runtime.ts';

test('security scanner flags secret shapes using locations only', () => {
  const marker = 'sb_secret_' + 'a'.repeat(35);
  const keyFixture = ['-----BEGIN PRIVATE KEY-----', 'A'.repeat(64), '-----END PRIVATE KEY-----'].join('\n');
  const findings = inspectText('synthetic.ts', `${marker}\n${keyFixture}`).sort((a,b) => a.line-b.line);
  assert.deepEqual(findings, [{ path: 'synthetic.ts', line: 1, rule: 'SUPABASE_SECRET' },
    { path: 'synthetic.ts', line: 2, rule: 'PRIVATE_KEY' }]);
  assert.equal(JSON.stringify(findings).includes(marker), false);
});

test('security scanner allows labelled fixtures but flags an unexplained database credential', () => {
  assert.deepEqual(inspectText('demo.md', 'postgresql://demo:synthetic@localhost/virtual_ink_dev\nsb_secret_synthetic'), []);
  const url = 'postgresql://' + 'demo:' + 'x'.repeat(24) + '@localhost/virtual_ink_dev';
  assert.equal(inspectText('fixture.md', url)[0]?.rule, 'DATABASE_CREDENTIAL_REVIEW');
});

test('security scanner classifies private paths without reading them', () => {
  for (const path of ['.env', 'apps/web/.env.local', '.private/key.txt', 'uploads/design.pdf', 'storage/file.bin', 'credential.key']) {
    assert.equal(privatePath(path), true, path);
  }
  for (const path of ['.env.example', 'apps/web/.env.example', 'docs/security-review.md', 'output/pdf/guide.pdf', 'src/backend/storage/private-files.ts']) {
    assert.equal(privatePath(path), false, path);
  }
});

test('security runtime gate rejects old patches, other majors and prereleases', () => {
  for (const version of ['24.14.1', '24.18.1', '24.20.0', '24.21.0-rc.1', '22.23.2', '26.11.1', 'invalid']) {
    assert.equal(runtimeIsAllowed(version), false, version);
  }
  for (const version of ['24.21.0', '24.21.1', '24.22.0']) assert.equal(runtimeIsAllowed(version), true, version);
});
