import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Reviewed baseline on 9 October 2026. Revisit against official advisories after
// each dependency/runtime step; this minimum is not a permanent vulnerability feed.
export const minimumNode = '24.21.0';
export function runtimeIsAllowed(version: string): boolean {
  const match = /^24\.(\d+)\.(\d+)$/.exec(version);
  return Boolean(match && (Number(match[1]) > 21 || Number(match[1]) === 21 && Number(match[2]) >= 0));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const allowed = runtimeIsAllowed(process.versions.node);
  console.log(JSON.stringify({ service: 'Virtual Ink', check: 'runtime_patch_baseline',
    actual: process.versions.node, minimum: minimumNode, status: allowed ? 'pass' : 'blocked' }));
  process.exitCode = allowed ? 0 : 1;
}
