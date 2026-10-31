# Source lint gate

Run from the repository root with the reviewed Node runtime:

```text
npm ci --include=dev
npm run lint
npm run lint:web
```

`npm --prefix apps/web run lint` delegates to the web-only command. The full gate
is also part of the web build, after the environment-isolation check and before
Next.js compilation. Both Vercel configurations explicitly install development
dependencies for the web build. These are source changes; hosted verification
remains blocked as recorded in [the acceptance runbook](hosted-acceptance.md).

## Scope and rules

`eslint.config.mjs` applies recommended JavaScript and TypeScript rules to `src`,
JavaScript/TypeScript in `scripts` and `test`, the web application/configuration,
and the root ESLint configuration. React/JSX/DOM and official Hook rules apply to
web files. The command fails on any error or warning. The initial clean inventory
is 156 files; this is a lint denominator, not test coverage or product completion.

Private operator files, supplied attachments, dependencies, generated Next output,
generated `next-env.d.ts` and coverage artifacts are excluded. SQL, Python,
PowerShell, CSS, image assets and human workflows are not linted by this command.
Existing strict TypeScript checks remain separate; this is not type-aware lint.

The tooling is pinned in the root development dependencies and lockfile: ESLint
10.13.0, @eslint/js 10.0.1, typescript-eslint 8.71.2, TypeScript 5.9.3, globals
17.13.0, @eslint-react/eslint-plugin 5.28.0 and eslint-plugin-react-hooks 7.1.1.
No lint tool is an application runtime import.

31 October: [GHSA-g3hv-75wg-m249](security-advisories.md) is remediated locally
with an exact minimatch 11.0.1 root override. The npm-generated lock adds only
its nonrecursive matcher dependency and changes that matcher entry. All 239
linted paths and 5,082 sampled glob results match the old toolchain; actual bad
Node/web code still fails. Keep the override until compatible upstream adoption
is verified. The full build and fresh root/web audits pass; this does not close
hosted runtime, reviewer, private-file or human acceptance gates.

The Next-specific preset was excluded after its glob chain introduced the
unpatched [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
No forced dependency downgrade or peer override is used. ESLint 9 is
[out of maintenance](https://eslint.org/version-support/). The final root/web
audits report zero known vulnerabilities; the existing Node HIGH advisory and
hosted release gates remain open. Full Next-specific rules and accessibility
acceptance are not claimed by the current rule set.

## Deliberate exceptions

Empty catch blocks remain permitted for fixed-denial/provider and fixture paths.
Side-effect ternaries remain permitted in Node fixtures. Unused names must carry
the `_` prefix. Existing ref names are preserved; the ref naming convention is
disabled. Duplicate React-package dependency/effect rules are disabled in favor
of the official Hook implementations, which remain active.

Inline exceptions identify eleven existing ASCII-control rejection filters, two
browser-storage hydration reads, two request-generation counter cleanups and one
filesystem-error redaction boundary. Each explains why that exact operation must
remain. Do not remove security validation or capture raw private errors to satisfy
a generic rule. New exceptions need a reviewed reason and relevant verification.

## Editor correction

The two latest-design refs update in layout effects after commit, rather than
during render. Preview readiness compares the current design with the last
successfully painted design, immediately disabling download readiness for a new
unpainted design. Existing cancellation prevents superseded paint results from
becoming ready. Local text/undo/redo, line-limit denial and genuine 3D front/back
rendering pass sampled browser checks; concurrency/interrupted-render scheduling,
native file import and full accessibility/human acceptance remain separate gates.

See [17 October lint evidence](reports/2026-10-17-lint-gate.md) for exact tests,
coverage, dependency findings, limits and team actions.
