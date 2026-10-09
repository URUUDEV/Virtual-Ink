# Virtual Ink Backend Phase 1 validation

## Latest check — Trusted provisioning, 2026-10-09

66 Node tests pass, including 15 new provisioning/runtime/smoke tests. Strict
backend/scripts/test TypeScript check passes. Hosted provisioning SQL and the
existing tenant-isolation regression pass with rollback fixtures. Deferred commit
checks reject unaudited account, tenant and staff inserts. All eight application
tables contain zero rows. Security advisor: no findings; performance advisor: four
unused-index informational notices. Demo preview works; apply without setup and
demo apply fail safely. See [provisioning evidence](trusted-provisioning.md).

pg install was retried once and failed through the registry proxy. Genuine
Auth/driver/TLS, real onboarding, owned PostgreSQL replay, pooling concurrency,
Next build/browser QA, immediate session revocation and human signoff remain open.
The dated Word report passes structural checks; LibreOffice is missing, preventing
visual rendering. Earlier sections preserve the previous slices' evidence.

## Latest check — Backend Phase 2, 2026-10-09

51 Node tests pass and strict backend TypeScript checks pass. Hosted Phase 2 SQL
tests passed as virtual_ink_api with rollback fixtures: tenant scope/lists/joins,
forbidden mutations/escalation, inactive/disabled identity, delivery restriction,
operator grant expiry and scoped audits. All seven new tables contain zero rows
after rollback. Security advisors: no findings; performance advisors: only three
unused-index INFO notices after RLS context warnings were fixed. See
[Phase 2 evidence](backend-phase-2.md). Live Auth-to-driver/TLS, frontend builds and
owned PostgreSQL replay remain unverified. Earlier sections preserve Phase 1 evidence.

Date: 2026-10-08. Scope: starting backend slice and UI source foundation. This records engineering evidence, not Uchi's product approval.

## Observed checks

| Check | Result |
| --- | --- |
| Final `npm test` | 27 passed, 0 failed, including original health, standardized API 404s, closed file/proof routes, TRACE rejection, validation/audit/storage/job contracts and database connection guards |
| Backend strict TypeScript check | Passed using the existing local TypeScript compiler and Node type definitions from an unrelated project, read only; no files in that project changed |
| Frontend dependency install | Blocked: npm offline cache lacks Poppins; online registry access failed through the configured proxy |
| Next build / frontend semantic type check | Not run successfully: required selected-stack dependencies unavailable |
| Browser/mobile/navigation interactions | Not verified: Next server cannot start before installation |
| Dedicated PostgreSQL test cluster initialization | Succeeded under ignored `.private/` on a separate data directory |
| Dedicated PostgreSQL server start | Blocked: `pg_ctl` could not create a Windows restricted token (error 87), then failed to start (error 3) |
| Migration, seed, SQL permission assertions and queue runtime | Not executed against a database because the isolated server could not start |
| Docker development database | Not started: Docker engine unavailable |
| Private object storage | Contract tests only; no provider/bucket/network integration configured |
| Frontend syntax/assets/navigation source check | 23 TypeScript/TSX files parsed; 6 public navigation destinations and both imported PNG references resolve; 0 syntax/reference errors. This is not a semantic Next build or browser test. |
| Documentation links | All local links in 16 Markdown documents resolve |
| Git whitespace and private-path ignores | `git diff --check` passed; root `.env`, web `.env.local` and private test-cluster data are ignored |

The existing local PostgreSQL service on port 5432 was not used or modified. The isolated cluster was prepared for port 55439 but did not start. No real database credentials were used. No deployment, auth integration, tenant runtime policy, customer upload or real commercial integration was tested.

## Commands and review trail

Inspected Git state, source, tests, config, docs and assets before edits. Read local framework/package context, checked Node/npm cache and local database tooling, and verified current framework conventions from official sources. Ran `npm test`, a strict `tsc --noEmit` check over backend/scripts/tests, `npm install --prefix apps/web --offline --ignore-scripts`, `initdb`, `pg_isready`, and an isolated `pg_ctl` start attempt. Dependency network checks returned cache/proxy errors rather than a successful installation.

The final strict backend TypeScript check also passed after the new database guards and HTTP denial tests were added. The UI source parser used the same existing local compiler read only. Do not count either source inspection or syntax parsing as a passing Next build or browser test. The original isolated test directory remains ignored for diagnostics; no test database service is left running.

## Remaining verification

On a machine with npm registry access, run `npm install --prefix apps/web`, generate and commit its real lockfile, then `npm run typecheck:web`, `npm run build:web` and `npm run dev:web`. Check all visible routes at desktop and narrow mobile widths, search/filter/reset states, mobile menu, focus order, FAQ, and actual health status success/failure.

Start an isolated PostgreSQL test server or a dedicated Docker test database, apply the migration twice, seed twice, run SQL assertions, and run the demo probe as a least-privilege worker. Verify no unexpected role grants. Keep this separate from any existing personal or production database.

Next backend implementation must not assume these runtime checks passed. Resolve environment blockers and obtain Uchi's required guest/tenant decisions before sensitive persistence or file handling.

## Supabase portability update

Supabase is selected as the initial managed PostgreSQL direction. Added provider config/endpoint validation, a SQL transaction interface, a server-only REST transport, public-secret checks and an owned-database migration plan. A new free-tier development project `odgxcuwueessxfsoveza` is active in `eu-west-1`; it currently has no application tables, and security/performance advisors report no findings. The Supabase CLI version/help checks failed because the installed npm wrapper lacks its Windows binary package. Hosted schema, grants, auth and storage checks remain pending; existing migration scripts and SQL guards stay local-only.

`npm test`: **38 passed, 0 failed**, including Supabase config and REST transport tests. These verify standard Supabase direct/session/transaction endpoints, project binding, requested TLS/CA settings, restricted runtime database usernames, owned PostgreSQL fallback, public-secret rejection, provider-path rejection, auth-header composition and safe provider-error mapping. They do not verify live TLS, actual role grants or a database connection. The final strict backend TypeScript check passed using the existing local compiler read only; all local links in 17 docs resolve, and `git diff --check` passed.

The latest local test run includes the Supabase REST transport checks: synthetic URL/key validation, provider-path rejection, auth-header composition, safe provider-error mapping and no response-body disclosure. No remote request was made.
