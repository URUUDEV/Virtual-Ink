import { readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

// This is a backend/shared unit-test metric, never a whole-product percentage.
export const coverageScope = Object.freeze({
  includes: ['src/backend/**', 'src/shared/**', 'src/app.js', 'src/config.js', 'src/vercel.js'],
  typeOnly: ['src/backend/database/ports.ts'],
  unmeasured: ['src/server.js lifecycle', 'frontend components and browser flows', 'SQL', 'genuine hosted integrations'],
  minimum: 95,
});

export async function sourceInventory(root) {
  const files = ['src/app.js', 'src/config.js', 'src/vercel.js'];
  async function walk(folder) {
    for (const entry of await readdir(resolve(root, folder), { withFileTypes: true })) {
      const path = `${folder}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error('Coverage source inventory rejects symlinks.');
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && /\.(?:[cm]?js|jsx|tsx?)$/.test(path) && !path.endsWith('.d.ts') && !coverageScope.typeOnly.includes(path)) files.push(path);
    }
  }
  await walk('src/backend');
  await walk('src/shared');
  return files.sort();
}

export function assessCoverage(summary, inventory, root) {
  const files = summary?.files ?? [];
  const measured = new Map(files.map(file => [relative(root, file.path).replaceAll('\\', '/'), file]));
  const missing = inventory.filter(path => !measured.has(path));
  const totals = {};
  let invalid = inventory.length === 0 || missing.length > 0;
  for (const metric of ['Line', 'Branch', 'Function']) {
    let total = 0, covered = 0;
    for (const path of inventory) {
      const file = measured.get(path);
      if (!file) continue;
      const count = file[`total${metric}Count`], hits = file[`covered${metric}Count`];
      if (!Number.isSafeInteger(count) || !Number.isSafeInteger(hits) || count < 0 || hits < 0 || hits > count) invalid = true;
      else { total += count; covered += hits; }
    }
    totals[metric.toLowerCase()] = { total, covered, percent: total > 0 ? covered * 100 / total : null };
  }
  const passed = !invalid && Object.values(totals).every(metric => metric.percent !== null && metric.percent >= coverageScope.minimum);
  return { scope: 'backend_shared_unit', minimum: coverageScope.minimum, status: passed ? 'pass' : 'blocked',
    inventoryFiles: inventory.length, measuredFiles: inventory.length - missing.length, missing, totals,
    files: inventory.map(path => {
      const file = measured.get(path);
      return { path, measured: Boolean(file), line: file?.coveredLinePercent ?? null,
        branch: file?.coveredBranchPercent ?? null, function: file?.coveredFunctionPercent ?? null,
        uncoveredBranches: file?.branches?.filter(branch => branch.count === 0).map(branch => branch.line) ?? [],
        uncoveredFunctions: file?.functions?.filter(fn => fn.count === 0).map(fn => ({ name: fn.name, line: fn.line })) ?? [] };
    }),
    unmeasured: coverageScope.unmeasured };
}
