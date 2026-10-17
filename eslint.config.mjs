import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

const unusedVariables = ['error', {
  argsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
}];

export default defineConfig([
  globalIgnores([
    '**/node_modules/**', '**/.next/**', '**/out/**', '**/next-env.d.ts',
    '.private/**', 'coverage/**', 'Kimi_Agent_Shared attachments/**',
  ]),
  {
    name: 'virtual-ink/node',
    files: ['src/**/*.{js,mjs,ts}', 'scripts/**/*.{js,mjs,ts}', 'test/**/*.{js,mjs,ts}', '*.mjs'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      // Provider/fixture failure paths deliberately return fixed errors or denials.
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': unusedVariables,
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
  {
    name: 'virtual-ink/web',
    files: ['apps/web/**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended,
      react.configs['recommended-typescript'], reactHooks.configs.flat.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': unusedVariables,
      // Keep the established ref names; this convention does not check behavior.
      '@eslint-react/naming-convention-ref-name': 'off',
      // Use the official Hook rules instead of running duplicate implementations.
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/set-state-in-effect': 'off',
    },
  },
]);
