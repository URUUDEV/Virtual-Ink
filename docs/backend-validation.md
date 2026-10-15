# Virtual Ink Backend Phase 1 validation

15 October: [current verification and delivery](reports/2026-10-15-phase-1-verification.md).
167 root/156 security, nine React and nine SDK/Next Auth tests, both type checks
and the production build pass. Backend/shared inventory coverage: 99.02% lines,
95.14% branches, 97.84% functions across all 32 files. This is a scoped metric;
frontend/SQL/genuine integrations and product completeness remain separate. Source
1341eb3 is pushed; Preview is Ready with sampled page checks and a health-handler
200 runtime event. Automated Preview checks are blocked by Vercel protection;
existing Production returns dynamic 500s from its public-config startup guard.
No phase is complete; genuine Auth/private files/order/role workflows remain open.

14 October services slice: [current evidence](reports/2026-10-14-vercel-services.md).
150 application, 139 security, nine React and nine Auth integration tests, both
TypeScript checks and production build pass. Native Vercel entrypoint/binding
negatives pass; real vercel dev --local routing passes 39 assertions over 16
requests. Standalone 53 + 44 assertions pass. Uchi reports hosted deployment/
Supabase connection; URLs, graph confirmation and deployed functional checks remain open.

14 October account slice: [current evidence](reports/2026-10-14-phase-1-account-access.md).
141 application, 130 security, nine React and nine real SDK/Next handler tests,
web/strict backend TypeScript, clean production build, 53 existing and 44 new
loopback HTTP assertions pass. Root `pg` 8.23.1 is installed; PG_DRIVER passes.
Restricted login/CA/config, genuine provider signup/confirmation/application mapping
and Vercel remain blocked. Hosted Auth is disabled; no phase is complete.

## Current check — Strict product phase audit, 2026-10-14

Verdict: Phase incomplete against Uchi's four product-phase checklists and Vercel
gate. 132 application tests, 121 security tests, nine React/3D checks, both TypeScript
checks, build, 53 HTTP checks and 67 additional live denial assertions pass. Build
warns about missing pg and workspace-root inference. Genuine setup remains blocked;
role/order/financial/delivery flows are missing. Two browser-reproduced UI defects
were fixed/retested. Hosted identity/vendor rollback fixtures pass; 18 private RLS
tables, 10 migrations and zero business rows/buckets/objects are verified. The
provider bridge is absent and two hosted migration versions need reconciliation.
No genuine role-session or full order-to-delivery E2E was possible. See
[full completion audit](reports/2026-10-14-phase-completion-audit.md).

## Current check — Vendor foundation review, 2026-10-14

132 application tests, 121 security tests, nine React/3D checks, web and strict
backend/shared TypeScript, runtime/heuristics and 53 existing-preview HTTP assertions
pass. Production audit reports zero vulnerabilities. Eight Phase 2 migrations and
vendor core/commands replay on isolated PostgreSQL 18; lifecycle/RLS fixtures roll
back, with zero applications/storefronts afterward. PostgreSQL 17, provider bridge,
genuine Auth, hosted migration and intake/activation remain open. Browser inspection
failed; file-open/visual acceptance remain unverified. No fresh production build.
See [dated review](reports/2026-10-14-vendor-foundation-review.md).

## Current check — Functional local workspaces handover, 2026-10-13

Application checks on 12 October: 127 application tests, nine React/3D checks, 116 security tests, runtime/heuristics,
TypeScript, production build and 53 loopback HTTP assertions pass. Production
dependency audit reports zero vulnerabilities. Actual 3D PNG and design/vendor
JSON downloads were checked. Vendor explicit save/reload/load, step selection,
renewed confirmation, undo restore and removal preserving the open form pass in
Chrome. Both pages fit five actual viewport widths without horizontal overflow.
Native file-selection automation is denied; full live file-open round-trips and
new page screenshot review remain incomplete. The downloaded 3D PNG was visually
inspected. No backend/Auth/provider changes or genuine activation occurred.
See [functional evidence](reports/2026-10-13-functional-workspaces.md).

## Current check — Vendor preparation, 2026-10-12

125 root tests, eight React/3D checks, 114 security regressions, TypeScript,
runtime/heuristics and production build pass. Production dependency audit has zero
reported vulnerabilities; 53 rebuilt HTTP assertions pass, including unavailable
vendor intake. Chrome verifies required/negative fields, review confirmation,
Back retention, reload reset and actual synthetic JSON download. Five widths fit
without horizontal overflow; mobile screenshots confirm the Back contrast fix.
The packet grants no identity/tenant authority; no schema/provider setup changed.
Genuine Auth/activation and full accessibility/human acceptance remain open.
See [vendor evidence](reports/2026-10-12-vendor-profile-preparation.md).

## Current check — Fonts and 3D shirt, 2026-10-12

121 root tests, seven React/mesh checks, 110 security regressions, TypeScript and
runtime/repository checks pass. Dependency installation and production audit
report zero vulnerabilities. Chrome verifies selected fonts, colour, WebGL shirt,
front/back/reset/zoom and keyboard rotation. The dated report records final build,
HTTP/layout checks and limits. No backend/schema/auth setup changed.
See [font/3D evidence](reports/2026-10-12-fonts-and-3d-shirt.md).

## Current check — Editor accessibility review, 2026-10-12

After the CSS/label/help/status changes, 120 root tests, six React checks,
109 security regressions, runtime/heuristic checks, TypeScript and production
build pass on private reviewed Node 24.21.0. Frontend audit reports zero findings;
49 loopback HTTP assertions pass. Instruction contrast is 5.79:1 after the fix.
Linked help, safe fourth-line rejection, visible sampled focus and five widths
without horizontal overflow are verified. Live artwork, actual zoom, assistive
technology and human acceptance remain open; no backend setup changed.
See [dated evidence](reports/2026-10-12-editor-accessibility-review.md).

## Current check — Local T-shirt editor, 2026-10-12

On reviewed private Node 24.21.0, 120 root tests, six source React checks and
109 security regressions pass. Web/shared TypeScript, runtime baseline, repository
heuristics and production build pass; frontend audit reports zero findings.
Forty-nine rebuilt loopback HTTP assertions pass. Live Chrome checks confirm
text/history/keyboard/pointer controls, synthetic device draft round-trip/removal,
PNG export and five responsive widths without horizontal overflow. WebP-header
admission and strict shirt-type regressions fail before fixes and pass afterward.

Live raster import is blocked by extension file-URL permission; its success/error
states and artwork draft round-trip remain unverified. Full accessibility and
human acceptance remain pending. No backend/schema/provider setup changed; prior
genuine Auth/pg/TLS and default-runtime gates remain. See [dated evidence](reports/2026-10-12-tshirt-workspace.md).

## Current check — UI build/runtime verification, 2026-10-11

Official portable Node 24.21.0 was checksum-verified in ignored private tooling.
111 backend/catalogue tests, five React rendering checks, 100 security regressions,
web/shared TypeScript, runtime gate and production build pass under that runtime.
45 loopback HTTP assertions pass, including unknown-product 404, guest/write API
denials and external-image rejection. Sampled Chrome controls and 15 route/width
DOM measurements pass. See [the dated report](reports/2026-10-11-ui-build-verification.md).

Default Node remains 24.14.1. Complete accessibility, release/history/bundle scans,
genuine Auth/pg/TLS and owned database replay remain open. Earlier results below
are historical, including sandbox build and official-download blockers.

## Latest check — Security review, 2026-10-09

105 backend tests and the 100-test security subset pass; web/shared and strict
backend/scripts/tests TypeScript pass. Hosted membership rollback assertions,
forced RLS/public-role catalog checks and security advisor pass. Dependency audit
reports zero findings. Local HTTP framing/header probes pass. See the
[dated security report](reports/2026-10-09-security-review.md) for before/after
reproductions, fixed boundaries and threat prerequisites.

The runtime gate fails on installed Node 24.14.1 (reviewed minimum 24.21.0).
Official download was blocked by the local proxy. Genuine Auth/pg/TLS, browser,
production build and release/history/bundle verification remain open. This does
not certify production security; historical results below are retained.

## Latest check — Membership discovery, 2026-10-09

90 Node tests pass (12 new). Strict backend/scripts/tests TypeScript and
npm run typecheck:web pass using installed frontend development dependencies.
GET /api/v1/memberships returns only active own vendor scopes with actor-bound
cursor pagination and durable self-scoped audits, including empty lists.

Hosted discovery, existing tenant isolation, provisioning and runtime-account
regressions pass with rolled-back fixtures. Actual runtime foundation SQL passes
under both disabled service accounts for nine tables. Eight Phase 2 migrations
are recorded. Auth and all nine application tables contain zero rows afterward.
Security advisor: no findings. Duplicate SELECT-policy performance warnings were
fixed in a follow-up migration and isolation tests rerun. Five
[unused-index INFO notices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
remain on the empty database; FK/audit indexes are retained pending workload evidence.

npm run build:web failed with spawn EPERM. Browser/mobile and actual Next HTTP
execution remain unverified; route source/type checks are separate evidence.
setup:check --database reports incomplete driver/config/CA/enablement/smoke inputs
and databaseChecksPerformed=false. Genuine Auth/pg/TLS, owned replay, concurrent
pool runtime, immediate revocation and human acceptance remain open.

See [membership implementation](membership-discovery.md) and the latest dated
Markdown/Word report. Historical sections below preserve their original results.

## Latest check — Setup and readiness, 2026-10-09

78 Node tests pass and strict backend/scripts/test TypeScript check passes. Hosted
catalog checks pass for both new service accounts; both remain NOLOGIN without
passwords. The actual startup foundation query verifies eight tables and detects
column-only audit access. Temporary SET/column grants were rolled back. Security
advisor: no findings. Auth and application user counts remain zero.

setup:init safely creates disabled missing settings and preserves existing files;
setup:check reports incomplete driver/config/CA/smoke inputs without secret values.
The pg installation retry failed through the proxy. Genuine login/pg/TLS, owned
replay, browser QA and human signoff remain unverified. See [live setup](live-backend-setup.md).

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
