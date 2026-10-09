# Virtual Ink — Team Progress Report

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.

**Current slice:** Private development account, vendor and staff provisioning.
**Status:** Implementation and local/hosted checks delivered for review. Genuine
login, real onboarding and human signoff remain outstanding.

## Progress so far

Virtual Ink has a role handover pack, runnable health/config backend, branded Next.js
source shell, Supabase development project, identity/tenant API and private
provisioning tool. Work has advanced through backend infrastructure and access
controls. Marketplace commerce, files and customer journeys are still future work.

| Area | Current status | Starting point |
| --- | --- | --- |
| Team handover | Templates and board delivered | Review ownership and acceptance records |
| Backend health/config | Runnable; tests pass | Node.js 24 and npm test |
| Identity/tenant access | Code and hosted isolation tests pass | Complete genuine login setup |
| Trusted provisioning | Private CLI and commit audit constraints tested | Review approvals; configure separate login |
| Frontend | Supplied logo and source shell delivered | Install/build/browser QA still blocked |
| Commerce/files/delivery | Not implemented | Resolve requirements before new slices |

## Delivered in this slice

- Private CLI for create_account, create_vendor and add_staff commands.
- Permanent target identity verification through Supabase, before business writes.
- Strict commands with operation, approval and reviewer UUID references. References
  do not prove human approval; the administrator must check the external evidence.
- Separate restricted provisioning group; its credential never belongs in HTTP/web
  environments. Startup rejects privileged, owning or mixed-group database logins.
- Generated application user IDs, Customer-only global grants and guarded vendor
  memberships. Existing tenants cannot be taken over and disabled grants cannot be
  restored. No operator/delivery grants, owner transfers or production workflow.
- Immutable onboarding audits in the same transaction as changes. Deferred database
  constraints reject unaudited inserts at commit, including SQL outside the CLI.
- Idempotent historical receipts; changed requests cannot reuse an operation ID.
- Preview-only demo command, bounded private token input and a genuine login smoke
  script. The smoke script is delivered but genuine execution has not passed here.

## Database and provider status

Supabase project Virtual Ink remains on the confirmed free tier, in eu-west-1,
reference odgxcuwueessxfsoveza. No plan upgrade was requested. Five Phase 2 migrations
are recorded; this slice added versions 20261009101428 and 20261009101653.

Eight private application tables retain enabled/forced row-level security. After
rollback tests, all eight contain zero rows. No real vendor, customer, price,
commission, payment, courier or printer integration was created. SQL and repository
ports remain compatible with the planned owned PostgreSQL direction; replay there
has not been verified. Provider identity stays behind its adapter.

## Verification results

| Check | Result |
| --- | --- |
| npm test | 66 pass, zero failures; 15 new tests |
| Strict backend/scripts/test TypeScript | Pass with an existing compiler read only |
| Hosted provisioning SQL | Allowed writes and forbidden privileges pass |
| Deferred commit checks | Unaudited account, tenant and staff inserts rejected |
| Hosted tenant-isolation regression | Pass after both new migrations |
| Post-test data check | All eight application tables contain zero rows |
| Supabase security advisor | Zero findings |
| Performance advisor | Four unused-index informational notices |
| Demo CLI preview | Pass; demoFixture=true, writesPerformed=false |
| Apply without setup / demo apply | Rejected safely; no business writes |
| Word document | Package/table structural checks; visual QA unavailable |

SQL fixtures and temporary role SET grants were rolled back. SET CONSTRAINTS
exercised deferred commit checks without retaining fixture data. Unit tests use
synthetic identities and mocked provider/driver ports; they do not prove live login.

The pg installation was retried once with online npm enabled and failed with
ECONNREFUSED at the configured registry proxy. No dependency version or lockfile was
fabricated. Real pg/TLS, genuine login, real onboarding, pooling concurrency, owned
PostgreSQL replay, Next build/browser QA and immediate session revocation remain
unverified. LibreOffice is missing, so the Word report could not be rendered for
visual inspection. GitHub publication remains pending.

## Files delivered

**New backend/tooling:** src/backend/database/runtime.ts;
src/backend/provisioning/service.ts; scripts/provision.ts; scripts/private-token.ts;
scripts/auth-smoke.ts; test/provisioning.test.ts; and the clearly labelled preview
fixture examples/provisioning/create-account.demo.json.

**New database files:** database/phase2/provisioning.sql;
database/phase2/provisioning-commit-audit.sql; database/tests/provisioning.sql; and
the two matching versioned files under supabase/migrations.

**Changed source/setup:** src/backend/identity/runtime.ts, package.json and
.env.example. Health remains usable without installing pg.

**Documentation:** New docs/trusted-provisioning.md and this dated Markdown/Word
report. Updated README, AGENTS.md, backend-phase-2, backend-foundation,
backend-validation, permissions-plan, api-standards, open-questions, task-board and
the latest report index. Historical reports are preserved.

## Commands and how to start

Run npm test for the complete local backend suite. Run npm start for the loopback
health/API service. Preview the synthetic command safely:

```text
npm run admin:provision -- preview examples/provisioning/create-account.demo.json
```

Other executed checks: strict tsc --noEmit over backend/scripts/tests; hosted
apply_migration for both new files; both hosted SQL assertion suites; table counts;
security/performance advisors; the rejected apply checks; git diff --check; and
scripts/generate_team_report.py for this report. npm install pg was unsuccessful.

Real apply needs Mumba's separate private provisioner environment and an approved
user token piped from a hidden prompt. Follow docs/trusted-provisioning.md. Never
apply the demo file. The CLI refuses .demo.json apply. The live smoke script checks
own tenant allowance, another tenant denial, guest denial and method restrictions;
an administrator must separately inspect its committed access audit.

## Where each lead starts

| Lead | Next action | Evidence to hand over |
| --- | --- | --- |
| Uchi Chinyama | Review tenant/guest/role defaults and onboarding approval chain | Accepted criteria and real approval references |
| Mumba Chitonge | Install pg; configure separate logins/CA; run genuine smoke | Actual lockfile, private setup and audit evidence |
| Taizya Nakapende | Specify denied/expired-session and onboarding states | UX handover; build/browser findings when runnable |
| Lubasi Monde | Verify intended vendor owners/staff and support responsibilities | Private discovery evidence; verified approval references |

Open decisions include launch area, real vendors/printer capabilities, pricing,
commissions, payment verification, delivery zones, retention, support and hosting.
PROV-01/02 cover onboarding authority and privileged/revocation workflows; LIVE-01
covers the remaining live setup. Approval UUIDs alone do not close those decisions.

## Recommended next prompt for Mumba

Continue Virtual Ink Backend Phase 2 with genuine identity-to-API verification.
Inspect the trusted provisioning guide and latest report. Install and pin pg with
the actual lockfile, configure distinct non-owner API/provisioner logins and verified
TLS privately, and use only explicitly approved development identities and approval
records. Run reviewed onboarding, the five-check live smoke and administrator audit
inspection. Prove wrong-tenant denial and preserve zero file/payment capabilities.
Review immediate session revocation and plan the next audited revocation slice.
Record every blocked check honestly and generate the next Markdown/Word team report.
