import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { certificateIsUsable, checkSetup } from '../src/backend/setup/checks.ts';
import { openRestrictedDatabase } from '../src/backend/database/runtime.ts';
import { provisioningEnvironment } from './provision.ts';

type Environment = Record<string, string | undefined>;
export async function privateSettings(file: string): Promise<{ env: Environment; present: boolean }> {
  try {
    const contents = await readFile(file, 'utf8');
    if (contents.length > 65536) throw new Error();
    return { env: { ...parseEnv(contents), ...process.env }, present: true };
  } catch { return { env: { ...process.env }, present: false }; }
}
async function usableCertificate(env: Environment, setting: 'DATABASE_URL' | 'PROVISIONING_DATABASE_URL') {
  try {
    const url = new URL(env[setting]!);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (env.DATABASE_PROVIDER !== 'supabase' && local && !env.DATABASE_SSL_ROOT_CERT) return true;
    return certificateIsUsable(await readFile(env.DATABASE_SSL_ROOT_CERT!, 'utf8'));
  } catch { return false; }
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length > 1 || arguments_.length === 1 && arguments_[0] !== '--database') throw new Error();
  const api = await privateSettings('.env');
  const provisioning = await privateSettings('.private/provisioning.env');
  let driverInstalled = false;
  try { createRequire(import.meta.url).resolve('pg'); driverInstalled = true; } catch { /* No fabricated dependency. */ }
  const checks = [...checkSetup(api.env, provisioning.env, {
    nodeMajor: Number(process.versions.node.split('.')[0]), driverInstalled,
    apiFilePresent: api.present, provisioningFilePresent: provisioning.present,
    apiCertificateUsable: await usableCertificate(api.env, 'DATABASE_URL'),
    provisioningCertificateUsable: await usableCertificate(provisioning.env, 'PROVISIONING_DATABASE_URL'),
  })];
  let complete = checks.every((check) => check.status === 'pass');
  const databaseChecksPerformed = arguments_.includes('--database') && complete;
  if (arguments_.includes('--database') && complete) {
    for (const [id, env, group] of [['API_DATABASE', api.env, 'virtual_ink_api'],
      ['PROVISIONING_DATABASE', provisioningEnvironment(provisioning.env), 'virtual_ink_provisioner']] as const) {
      let connected = false;
      try { const database = await openRestrictedDatabase(env, group); await database.close(); connected = true; }
      catch { /* Do not print driver errors, certificates or connection URLs. */ }
      checks.push({ id, status: connected ? 'pass' : 'blocked' });
      if (!connected) complete = false;
    }
  }
  console.log(JSON.stringify({ service: 'Virtual Ink', setup: complete ?
    (databaseChecksPerformed ? 'database_checks_passed' : 'configuration_ready') : 'blocked',
    databaseChecksRequested: arguments_.includes('--database'), databaseChecksPerformed, checks, genuineLoginVerified: false }));
  if (!complete) process.exitCode = 1;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => { console.error(JSON.stringify({ service: 'Virtual Ink', setup: 'blocked', code: 'SETUP_CHECK_FAILED' })); process.exitCode = 1; });
}
