import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

test('the build glob matcher bounds adversarial pattern expansion in an isolated child', () => {
  const code = `import {Minimatch} from 'minimatch';
    const pattern=Array(20).fill('**/../a/b').join('/')+'/file.ts';
    const matcher=new Minimatch(pattern,{optimizationLevel:2,braceExpandMax:64});
    console.log(JSON.stringify({patterns:matcher.set.length}));`;
  // Bound only this synthetic child. No external target, host stress scan or
  // unbounded reproduction is used if an affected matcher is reintroduced.
  const output = execFileSync(process.execPath, ['--max-old-space-size=64', '--max-semi-space-size=2', '--input-type=module', '-e', code], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), timeout: 5000, maxBuffer: 4096,
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { NODE_OPTIONS: '', SystemRoot: process.env.SystemRoot ?? process.env.SYSTEMROOT ?? '' },
  });
  const result = JSON.parse(output.toString('utf8'));
  assert(Number.isSafeInteger(result.patterns) && result.patterns >= 1 && result.patterns <= 64);
});

test('patched lint discovery still admits node and web source and rejects actual bad code', async () => {
  const eslint = new ESLint();
  for (const filePath of ['src/__lint_probe__.ts', 'apps/web/src/__lint_probe__.tsx']) {
    const [result] = await eslint.lintText('const unusedProbe = 1;\n', { filePath });
    assert(result.errorCount > 0 && result.messages.some(message => message.ruleId === '@typescript-eslint/no-unused-vars'));
    const [valid] = await eslint.lintText('export const admittedProbe = 1;\n', { filePath });
    assert.equal(valid.errorCount, 0);
    assert.equal(valid.warningCount, 0);
  }
  assert.equal(await eslint.isPathIgnored('.private/secret-probe.ts'), true);
  assert.equal(await eslint.isPathIgnored('apps/web/.next/generated-probe.ts'), true);
});
