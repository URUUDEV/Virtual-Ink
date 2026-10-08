import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateDatabaseUrl } from '../src/backend/config.ts';

const commands = {
  migrate: ['MIGRATION_DATABASE_URL', '../database/migrations/001_foundation.sql'],
  seed: ['MIGRATION_DATABASE_URL', '../database/seeds/demo.sql'],
  test: ['TEST_DATABASE_URL', '../database/tests/foundation.sql'],
  probe: ['DATABASE_URL', '../database/jobs/probe.sql'],
} as const;

export function connectionEnvironment(value: string, testOnly = false) {
  const url = validateDatabaseUrl(value);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !['virtual_ink_development', 'virtual_ink_test'].includes(database) ||
    (testOnly && database !== 'virtual_ink_test') || url.search) {
    throw new Error('Foundation scripts require a dedicated local development/test database.');
  }
  // Credentials stay in child environment, not command arguments or output.
  return { ...process.env, PGHOST: url.hostname.replace(/^\[|\]$/g, ''), PGPORT: url.port || '5432',
    PGDATABASE: database, PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: '5', PGSERVICE: '', PGSERVICEFILE: '', PGOPTIONS: '' };
}

async function main() {
  const command = process.argv[2] as keyof typeof commands;
  if (!Object.hasOwn(commands, command)) throw new Error('Use migrate, seed, test or probe.');
  const [setting, relativeFile] = commands[command];
  const value = process.env[setting];
  if (!value) throw new Error(`${setting} is required.`);
  const env = connectionEnvironment(value, command === 'test');
  const file = fileURLToPath(new URL(relativeFile, import.meta.url));
  const child = spawn('psql', ['-X', '--no-password', '--set', 'ON_ERROR_STOP=1', '--file', file], {
    env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Raw database errors can contain sensitive connection context. Suppress them.
  child.stdout.resume(); child.stderr.resume();
  await new Promise<void>((resolve, reject) => {
    child.once('error', () => reject(new Error('Could not start psql; install the PostgreSQL client.')));
    child.once('exit', (status) => status === 0 ? resolve() : reject(new Error('Database command failed; inspect the dedicated database locally.')));
  });
  console.log(JSON.stringify({ service: 'Virtual Ink', command, status: 'completed' }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
