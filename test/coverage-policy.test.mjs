import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { assessCoverage } from '../scripts/coverage-policy.mjs';

const root = resolve('.');
const file = (name, covered = 95) => ({ path: resolve(root, name), totalLineCount: 100, coveredLineCount: covered,
  totalBranchCount: 100, coveredBranchCount: covered, totalFunctionCount: 100, coveredFunctionCount: covered });

test('coverage cannot pass by omitting an unimported source file or using unrelated high coverage', () => {
  const result = assessCoverage({ files: [file('src/app.js'), file('test/fixture.js', 100)] }, ['src/app.js','src/new.ts'], root);
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.missing, ['src/new.ts']);
  assert.equal(result.measuredFiles, 1);
});

test('coverage fails closed on missing, empty, invalid and just-below-target results', () => {
  for (const files of [[], [file('src/app.js', 94)], [{ ...file('src/app.js'), coveredBranchCount: NaN }],
    [{ ...file('src/app.js'), coveredLineCount: 101 }], [{ ...file('src/app.js'), totalFunctionCount: 0, coveredFunctionCount: 0 }]]) {
    assert.equal(assessCoverage({ files }, ['src/app.js'], root).status, 'blocked');
  }
  assert.equal(assessCoverage(undefined, ['src/app.js'], root).status, 'blocked');
  assert.equal(assessCoverage({ files: [] }, [], root).status, 'blocked');
  const rounded = { ...file('src/app.js'), totalBranchCount: 10000, coveredBranchCount: 9499 };
  assert.equal(assessCoverage({ files: [rounded] }, ['src/app.js'], root).status, 'blocked');
});

test('coverage uses exact counts, states its limited scope and requires all three metrics', () => {
  const result = assessCoverage({ files: [file('src/app.js')] }, ['src/app.js'], root);
  assert.equal(result.status, 'pass');
  assert.equal(result.totals.branch.percent, 95);
  assert.equal(result.scope, 'backend_shared_unit');
  assert.ok(result.unmeasured.includes('genuine hosted integrations'));
});
