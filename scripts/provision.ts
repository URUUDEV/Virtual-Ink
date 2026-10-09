import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRestrictedDatabase } from '../src/backend/database/runtime.ts';
import { loadSupabaseRestConfig } from '../src/backend/database/supabase-rest.ts';
import { createSupabaseIdentityVerifier } from '../src/backend/identity/supabase.ts';
import { createProvisioningService, parseProvisioningCommand, ProvisioningError } from '../src/backend/provisioning/service.ts';
import { readPrivateToken } from './private-token.ts';
import { provisioningEnvironment } from '../src/backend/provisioning/config.ts';
export { provisioningEnvironment } from '../src/backend/provisioning/config.ts';

export function validateProvisioningMode(mode: string, file: string, extra: readonly string[]) {
  if (!['preview', 'apply'].includes(mode) || !file || extra.length ||
    mode === 'apply' && basename(file).toLowerCase().endsWith('.demo.json')) {
    throw new Error('Use preview or apply with one reviewed non-demo command file.');
  }
}

async function main() {
  const [mode, file, ...extra] = process.argv.slice(2);
  validateProvisioningMode(mode, file, extra);
  const info = await readFile(resolve(file));
  if (info.byteLength > 4096) throw new Error('Command file exceeds the size limit.');
  const command = parseProvisioningCommand(JSON.parse(info.toString('utf8')));
  if (mode === 'preview') {
    console.log(JSON.stringify({ service: 'Virtual Ink', mode, command,
      demoFixture: basename(file).toLowerCase().endsWith('.demo.json'), writesPerformed: false }));
    return;
  }
  const env = provisioningEnvironment(process.env);
  const verifier = createSupabaseIdentityVerifier(loadSupabaseRestConfig(env));
  const token = await readPrivateToken();
  const database = await openRestrictedDatabase(env, 'virtual_ink_provisioner');
  try {
    const receipt = await createProvisioningService(database, verifier).execute(command, token);
    console.log(JSON.stringify({ service: 'Virtual Ink', status: 'committed', ...receipt }));
  } finally { await database.close(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(JSON.stringify({ service: 'Virtual Ink', status: 'not_completed',
      code: error instanceof ProvisioningError ? error.code : 'SETUP_OR_EXECUTION_FAILED' }));
    process.exitCode = 1;
  });
}
