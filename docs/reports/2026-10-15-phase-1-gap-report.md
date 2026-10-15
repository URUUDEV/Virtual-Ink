# Virtual Ink — Phase 1 inspection and gap report

Date: 15 October 2026. Status: **PARTIAL — implementation not started from this
inspection**. This is the requested pre-implementation baseline for the Phase 1
mission, not a completion report. The linked [closure checklist](../phase-1-closure-checklist.md)
maps each capability to an evidence gate.

## Repository and baseline

The existing product combines a Next.js 16.4 / React 19.2 strict TypeScript app,
a Node 24 TypeScript API, Supabase Auth/PostgreSQL adapters and a portable
PostgreSQL schema, with a Vercel `web` frontend and internal `app` service.
Supabase project `odgxcuwueessxfsoveza` is the development target. The app runtime
DB login/CA, real hosted Auth and Storage are disabled or unverified. The existing
handover says the original API readiness check covers nine tables while an older
hosted catalog recorded 18; vendor migration versions require reconciliation
before rollout. There is no verified production database connection.

The web source contains registration, login, PKCE confirmation, logout and a
protected account page backed by Supabase SSR. The server checks configuration
and fails closed, but Auth is not enabled for the deployed workflows. The API
contains narrow verified-identity, membership and tenant-access reads with audits;
its existing role/tenant foundation is not the eight-role Phase 1 permission
matrix. Vendor onboarding is local preparation/export only. Storefront items and
prices are labelled illustrative.

The repository inventory contains no order, quote, upload, file-scan, proof,
production, QC, notification or business-role dashboard routes/tables. Therefore
the mission's customer/vendor/admin journeys, private Storage policies, workflow
state machine and required evidence are not implemented or verified. Existing
durable audit coverage is limited to the narrow identity/tenant reads and private
provisioning foundation; it does not satisfy the requested event set.

## Existing behavior actually checked

On the reviewed private Node 24.21.0 runtime, the existing root suite passed
**168/168 tests**, with zero failures, skips or todos. The local Node service
started on loopback. `/health` and `/api/v1/health` returned 200; anonymous
`/api/v1/me` returned 401. These checks confirm the present foundation and do not
exercise real Supabase Auth, business tables, Storage, customer/vendor roles or
any order workflow. The latest recorded backend/shared coverage is from the
source-5c review: lines 99.02%, branches 95.14%, functions 97.84%; it is scoped
coverage, not 95% product verification.

The working tree has one pre-existing user change, `apps/web/next-env.d.ts`,
switching generated type references to `.next/dev/types`. It remains unchanged
and unstaged. No credentials or supplied assets were read into this report.

## Prioritized gaps

1. **Identity and authorization:** complete the current Auth lifecycle, enable
   genuine Preview/Production configuration, establish trusted eight-role and
   resource permissions, suspension/admin controls, MFA path, API/RLS coverage
   and genuine identity tests.
2. **Private files:** choose approved limits/retention/scanner operation; build
   quarantine and private purpose-specific storage, validation/scan/promotion,
   authorized short-lived access, and denial/audit tests.
3. **Order and fulfillment:** reconcile schema history, add normalized entities,
   centralized transactional state changes, quotes/snapshots/payment evidence,
   vendor assignment, proofs, production evidence, QC and disputes.
4. **Interfaces and proof:** expose verified role dashboards and responsive
   journeys while preserving supplied branding; verify them with server/API and
   database policies rather than UI visibility.
5. **Release evidence:** measure UI/schema/hosted workflows independently, perform
   real human role review, and complete all Preview/Production Vercel gates. The
   prior tested Production source is `5c55364`; the later docs-only `e13dfb8`
   deployment has not been reverified. Existing Production public smoke evidence
   is not authenticated workflow acceptance.

## Scope, team and next work

The mission excludes escrow, cryptocurrency custody, smart contracts and advanced
Phase 2 work until Phase 1 passes. Uchi Chinyama and Mumba Chitonge collaborate
on backend work; this updates older repository notes that described Mumba as
inactive. Taizya Nakapende retains UX ownership and Lubasi Monde retains vendor
and delivery operations ownership. Human review and acceptance remain pending.

The next implementation slice is **AUTH-01: inspect and complete the existing
Supabase-backed authentication lifecycle and server authorization boundary**.
First resolve only the setup/access facts needed for a real Preview test identity;
keep Auth disabled in Production until the genuine setup and negative tests pass.
Each slice must update the checklist, include a scoped security review, produce a
dated Markdown/Word report and commit/push reviewed files without staging the
preserved `next-env.d.ts` edit. This gap report itself does not claim a phase or
build slice complete.
