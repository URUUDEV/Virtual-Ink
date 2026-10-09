# Virtual Ink — Team Progress Report

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.

**Current slice:** Safe live-backend setup and runtime readiness.
**Status:** Tooling, disabled service accounts and catalog checks delivered for
review. Genuine login-to-API verification remains blocked by private setup.

## Progress so far

Virtual Ink has the Phase 1 handover pack, runnable health/config backend, branded
Next.js source shell, Supabase development database, audited identity/tenant access
and private provisioning. This slice makes the remaining setup steps executable
and adds stricter database startup checks. It does not open marketplace commerce,
customer files, payments, delivery tracking or printer control.

The previous commit 22be155 was successfully pushed, as confirmed by the user.
This new slice is a separate local delivery; do not assume it is published until
GitHub confirms its push. Human/product acceptance is still pending.

## What changed

- setup:init safely creates disabled root API and private provisioning environment
  files only when missing. Existing settings are preserved; no credential is created.
- setup:check reports 15 fixed check IDs/statuses without exposing supplied secrets.
  It checks runtime/driver, config separation, public exposure, CA parsing/validity,
  matching project, distinct database logins and live-smoke configuration.
- Default readiness is offline. Optional --database checks run only after configuration
  passes, inspect catalogs only, and explicitly do not verify genuine login.
- API/provisioning startup now checks eight tables, RLS, deferred audit constraints,
  required privileges, unexpected table access, and forbidden table/column grants.
- Two separate service accounts were created with NOLOGIN, no passwords and only
  their respective inherited group. Neither owns application tables or has admin,
  role/database creation, replication or bypass privileges.
- Shared provisioning/smoke config moved into backend modules. Existing CLI imports
  remain compatible. No customer-facing endpoint was added.

## Current project status

| Area | Status | Team implication |
| --- | --- | --- |
| Handover/templates | Delivered; review pending | Leads can use the board and templates |
| Backend unit/contracts | 78 tests pass | Baseline remains runnable without pg |
| Hosted schema/access | Eight private tables; catalog checks pass | No real users/vendors are provisioned |
| Service accounts | Created but unable to log in | Mumba sets passwords/CA privately |
| Genuine Auth-to-API | Not verified | Approved development user and runtime setup needed |
| Frontend | Source shell delivered | Dependency/build/browser verification pending |
| Commerce/files/integrations | Future accepted slices | No live capability or invented commercial rules |

Supabase project reference remains odgxcuwueessxfsoveza. The newly recorded migration
is 20261009110852, virtual_ink_disabled_runtime_accounts. There are now six Phase 2
migrations. Portable SQL and exact hosted copies are preserved. Owned PostgreSQL 17
replay remains unverified. No plan upgrade or production deployment was performed.

## Verification and limits

| Check | Observed result |
| --- | --- |
| npm test | 78 pass, zero failures; twelve new tests |
| Strict TypeScript | Pass for backend/scripts/tests |
| Hosted service-account SQL assertions | Pass; temporary grants rolled back |
| Actual startup role query | Pass under each disabled service account |
| Actual foundation query | Eight tables pass under each account |
| Column-only audit grant drift | Detected; temporary grant rolled back |
| Supabase security advisor | Zero findings |
| Auth/application/vendor/audit counts | Zero; no real onboarding performed |
| setup:init | Created disabled settings; repeat preserved them |
| setup:check --database | Blocked correctly; databaseChecksPerformed=false |
| pg installation retry | Failed with proxy ECONNREFUSED |
| Word report | Structural checks; visual rendering unavailable |

Catalog tests use temporary SET ROLE access, not a password login. They do not prove
the pg driver, TLS handshake, actual pool connection or genuine Auth request.
No private token/password was supplied. The new service accounts remain NOLOGIN;
the starter files keep auth/provisioning disabled. CA format/validity alone does not
establish trust or connectivity. Registry access, verified CA, private credentials,
approved development identity and real audit inspection are still required.

Other open checks: owned PostgreSQL replay, Next build/browser QA, immediate session
revocation and human acceptance. LibreOffice is unavailable, preventing Word visual
QA. No fake production readiness or successful login is claimed.

## Files and commands

New code: src/backend/database/readiness.ts; setup/checks.ts; setup/smoke-config.ts;
provisioning/config.ts; scripts/setup-init.ts; scripts/setup-check.ts;
test/setup.test.ts. The setup/provisioning paths above are under src/backend.

New database/setup files: database/phase2/runtime-accounts.sql;
database/tests/runtime-accounts.sql; the matching versioned Supabase migration;
examples/provisioning/provisioning.env.example; docs/live-backend-setup.md; this
dated Markdown report and matching Word document.

Changed: runtime database startup; provisioning/smoke script config exports;
package.json; .env.example; README; AGENTS; trusted-provisioning; validation;
open-questions; task-board; and team-report index. Ignored local environment files
contain disabled defaults and are excluded from commits. Historical reports remain.

Executed: npm test; strict tsc --noEmit; setup:init twice; setup:check and its database
mode; hosted migration/history; catalog SQL/actual startup queries; counts; security
advisor; git diff --check; and report generation. npm install --save-exact pg failed.

Start locally with npm start. For the setup work:

```text
npm run setup:init
npm run setup:check
```

Read docs/live-backend-setup.md before configuring private credentials. The guide
includes private psql password prompts and reviewed LOGIN activation; no password
appears in Git, a shell argument or this report. The setup checker itself never
activates accounts or creates identities.

## Where each lead starts

| Lead | Next action | Evidence required |
| --- | --- | --- |
| Uchi Chinyama | Approve development identity and onboarding authority | Accepted criteria and private approval references |
| Mumba Chitonge | Restore registry access; configure driver, passwords, CA and LOGIN | Actual lockfile, database checks and genuine smoke results |
| Taizya Nakapende | Specify denied/expired-session UX; resume shell verification when install works | UX handover and browser findings |
| Lubasi Monde | Verify intended vendor owners/staff and support responsibilities | Private discovery and approval evidence |

LIVE-01/02 track missing live setup and account activation authority. Business
questions remain in docs/open-questions.md: launch area, vendors/printers, pricing,
commission, payment verification, delivery, retention, support and hosting.

## Recommended next prompt for Mumba

Complete Virtual Ink's private live-backend setup using the readiness guide and
approved development account. Install/pin pg and commit the actual lockfile. Set
distinct service-account passwords and enable LOGIN privately after review. Use
the correct project endpoints and verified CA. Run configuration and database
readiness checks, reviewed onboarding, genuine five-check Auth smoke and committed
audit inspection. Prove another tenant is denied. Keep files/payments closed and
record unverified checks honestly. Produce the next Markdown/Word team report.
