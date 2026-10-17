import { run } from 'node:test';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runtimeIsAllowed } from './security-runtime.ts';
import { assessCoverage, coverageScope, sourceInventory } from './coverage-policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'coverage/backend-summary.json');
await mkdir(resolve(root, 'coverage'), { recursive: true });
// Invalidate previous success before starting, including startup/interruption errors.
await writeFile(output, `${JSON.stringify({ date: new Date().toISOString(), status: 'blocked', reason: 'run_not_finished' })}\n`);
if (!runtimeIsAllowed(process.versions.node)) {
  console.error('Coverage requires the reviewed Node runtime; run security:runtime.');
  process.exitCode = 1;
} else if (process.argv.length !== 2) {
  console.error('Coverage always runs the complete root test suite; arguments are not accepted.');
  process.exitCode = 1;
} else {
  const inventory = await sourceInventory(root);
  const files = (await readdir(resolve(root, 'test'))).filter(name => /\.test\.(?:js|ts|mjs)$/.test(name)).sort().map(name => resolve(root, 'test', name));
  let coverage, failed = 0, passed = 0, skipped = 0;
  const stream = run({ cwd: root, files, isolation: 'none', coverage: true,
    coverageIncludeGlobs: coverageScope.includes, coverageExcludeGlobs: coverageScope.typeOnly,
    lineCoverage: 95, branchCoverage: 95, functionCoverage: 95 });
  for await (const event of stream) {
    if (event.type === 'test:fail') { failed++; console.error(`Failed: ${event.data.name}`); }
    if (event.type === 'test:pass') { if (event.data.skip || event.data.todo) skipped++; else passed++; }
    if (event.type === 'test:coverage') coverage = event.data.summary;
  }
  const report = { date: new Date().toISOString(), node: process.versions.node, tests: { passed, failed, skipped },
    ...assessCoverage(coverage, inventory, root) };
  if (failed || skipped) report.status = 'blocked';
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  const { files: _details, ...summary } = report;
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = report.status === 'pass' ? 0 : 1;
}
