# Virtual Ink — Team Progress Report

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.

**Current slice:** Backend Phase 2 — identity, roles and tenant access.
**Status:** Code and hosted SQL security checks delivered. Genuine sign-in-to-API
verification and team signoff remain open.

## What has advanced

Phase 1 supplied the handover pack, runnable health/config backend and frontend
source shell. Phase 2 now adds a verified identity boundary, application-owned
user/role mappings, vendor tenant memberships and a narrow audited tenant-access
read. The active Supabase development project contains the new private schema.

The report is now a required handover artifact for every completed build slice.
AGENTS.md records this working agreement; historical reports are preserved.

## Delivered in this slice

- Supabase Auth-server token verification with timeout and anonymous-user denial.
- Separate Customer, PlatformOperator and DeliveryPartner roles; VendorOwner and
  VendorStaff roles belong to active vendor memberships.
- GET /api/v1/me and GET /api/v1/tenants/:tenantId/access route boundaries.
- Seven private database tables with enabled and forced row-level security.
- Explicit, expiring operator grants for a single tenant review capability.
- Durable tenant-read audits in the same transaction as permission checks.
- Restricted pool/runtime adapter, negative tests, versioned hosted migrations,
  updated handover documentation and this Word report.

## Current project status

| Area | Status | Team implication |
| --- | --- | --- |
| Role handover pack | Delivered; acknowledgements pending | Leads can use templates and board immediately |
| Backend Phase 1 | Working; tests pass | Health/config baseline preserved |
| Phase 2 access slice | Code and hosted SQL verified | Review restrictive defaults and finish live setup |
| Supabase | Active; seven tables, zero business rows | No real customer/vendor seed was introduced |
| Frontend | Source shell delivered | Install/build/browser verification still required |
| Marketplace features | Future slices | Pricing, files, orders and delivery need accepted rules |

## Supabase and migration record

Project: **Virtual Ink**. Ref: **odgxcuwueessxfsoveza**. Region: **eu-west-1**.
The confirmed plan is the $0/month free tier. No plan upgrade was requested.

Hosted migration versions are 20261008232317, 20261008232912 and 20261008232942.
Exact SQL is preserved in supabase/migrations; portable sources are in database/phase2.
The Windows CLI remains unavailable, so hosted changes used the connected migration
tool and the actual returned history versions. Existing local-only scripts retain
their safeguards.

Synthetic security fixtures and test audits were rolled back. All seven application
tables have zero rows after testing. There are no real vendors, prices, commissions,
payment integrations, courier integrations or printer integrations.

## Verification and practical limits

| Check | Result |
| --- | --- |
| Automated backend tests | 51 passed, zero failed |
| Strict backend TypeScript | Passed using read-only existing compiler |
| Hosted PostgreSQL security assertions | Passed using restricted API role and rollback fixtures |
| Two-tenant isolation | Lists, joins, guessed scope and mutations checked |
| Access denials | Guest, inactive/disabled user, wrong role, delivery and expired/ungranted operator checked |
| Audit behavior | Allowed insert verified; wrong actor/tenant and audit read/deletion denied |
| Security advisors | No findings |
| Performance advisors | No warnings; three unused-index INFO notices on empty schema |
| Real Auth + application driver/TLS | Still unverified; restricted login and driver install required |
| Frontend build and browser QA | Still blocked by registry access |
| Word report | Structural audit passed; visual rendering unavailable because LibreOffice is missing |

Node/service tests use labelled synthetic identities. Hosted SQL tests exercise real
database policies but do not prove a real user's login-to-API journey. Cookie refresh,
signup, user provisioning, immediate logout revocation and sensitive-file workflows
remain unimplemented. The report records engineering evidence; Uchi's approval is pending.

## Where each lead starts now

### Uchi Chinyama — Product and Project Lead

- Review docs/backend-phase-2.md and docs/permissions-plan.md.
- Acknowledge or revise the restrictive defaults: guests have no private access;
  vendor organisations are tenants; delivery roles deny vendor/private access.
- Approve one provisioning acceptance record and record lead acknowledgements.
- Resolve launch, retention, support and commercial questions with Lubasi.

### Mumba Chitonge — Technical Lead

- Install the pg driver from a connected machine and commit its real lockfile.
- Configure a non-owner restricted API database login, verified CA and publishable
  Auth key in ignored environment files. Keep AUTH_ENABLED=false until ready.
- Implement trusted user/identity/member provisioning without client-selected roles.
- Complete a real development login → /me → tenant access → durable audit smoke test.
- Rehearse schema replay on isolated owned PostgreSQL before claiming portability verified.

### Taizya Nakapende — UX and Visual Design Lead

- Complete the first accepted flow with signed-out, forbidden, unavailable and
  expired-session states using docs/ux-handover-template.md.
- Review approved assets and existing shell; finish mobile/keyboard checks after
  dependencies install. No new logo is required.

### Lubasi Monde — Partnerships and Operations Lead

- Verify vendor and staff responsibilities with the operations handover template.
- Specify delivery assignment and support access needs without granting delivery
  access to print files or proofs.
- Supply real pricing/turnaround/payment-verification evidence before marketplace
  rules are implemented; keep private contact evidence out of Git.

## Remaining decisions and blockers

- Uchi acknowledgement of vendor tenant, guest and mixed-role semantics.
- Trusted membership/identity provisioning and live development Auth user setup.
- Restricted runtime database login, driver installation and TLS verification.
- File retention, support exceptions, session revocation and durable denial audits.
- Frontend dependency installation, build and browser/mobile verification.
- Real vendor discovery, launch area, pricing, commission, payment and delivery rules.
- GitHub push remains subject to the environment's proxy/network access.

## Recommended next prompt

Continue Virtual Ink Backend Phase 2 with trusted identity and membership provisioning.
Read docs/backend-phase-2.md, docs/permissions-plan.md, docs/open-questions.md and this
report. Preserve the existing private schema and denial tests. Implement an approved
administrator provisioning path with no self-selected roles, audited grants and
no automatic vendor activation. Configure a restricted development login and real
pg lockfile, then prove a genuine Supabase login → /me → tenant access → committed
audit flow. Review logout/revocation behavior. Keep checkout, uploads, payments and
printer automation outside this slice. Update the team's Markdown and Word report
with actual evidence and the next action for every lead.

## Handover and report check

The Phase 1 and previous team reports remain historical records. This report is the
current starting point. Human signoff is pending for all four leads. Open decisions
stay in docs/open-questions.md; implementation details and setup are in
docs/backend-phase-2.md. Credentials are excluded from all reports.
