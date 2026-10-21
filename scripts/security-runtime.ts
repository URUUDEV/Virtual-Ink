import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { minimumNode, runtimeIsAllowed } from '../src/backend/setup/runtime-policy.ts';
export { minimumNode, runtimeIsAllowed };
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const allowed = runtimeIsAllowed(process.versions.node);
  console.log(JSON.stringify({ service: 'Virtual Ink', check: 'runtime_patch_baseline',
    actual: process.versions.node, minimum: minimumNode, status: allowed ? 'pass' : 'blocked' }));
  process.exitCode = allowed ? 0 : 1;
}
