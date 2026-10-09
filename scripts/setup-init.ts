import { constants } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function initializeSettings(root = fileURLToPath(new URL('../', import.meta.url))) {
  const results: { id: string; status: 'created_disabled' | 'preserved' }[] = [];
  await mkdir(resolve(root, '.private'), { recursive: true });
  for (const [id, source, target] of [['API_ENV', '.env.example', '.env'],
    ['PROVISIONING_ENV', 'examples/provisioning/provisioning.env.example', '.private/provisioning.env']]) {
    try {
      await copyFile(resolve(root, source), resolve(root, target), constants.COPYFILE_EXCL);
      results.push({ id, status: 'created_disabled' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw new Error('Setup initialization failed.');
      results.push({ id, status: 'preserved' });
    }
  }
  return results;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.length !== 2) { console.error('Setup initialization accepts no arguments.'); process.exitCode = 1; }
  else initializeSettings().then((files) => console.log(JSON.stringify({ service: 'Virtual Ink', files })))
    .catch(() => { console.error('Setup initialization failed.'); process.exitCode = 1; });
}
