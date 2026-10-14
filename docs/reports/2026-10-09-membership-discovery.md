# Virtual Ink - Membership Discovery Team Report

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.
**Slice:** Backend Phase 2, caller-owned active vendor memberships.
**Status:** Code, migrations and synthetic/hosted verification delivered for review.
Genuine login and product acceptance remain pending.

## Supplied documents applied

The Backend Phase 2 Build Plan specifies GET /api/v1/memberships in section 6,
PDF viewer page 4. The Security Architecture and Flow document supplies server-owned
identity/tenant scope, least privilege, private records and durable audit gates.
The Escrow Engine Build Specification guides later simulation; no escrow was
implemented in this slice. All three source PDFs remain unchanged.

The previous source-review handover mapped these documents to code and added
named questions for membership lifecycle, immediate deactivation, scoped audit
review, abuse/MFA controls and incomplete escrow transitions. This report records
the subsequent implementation authorized by the user's instruction to continue.

## What now works

- GET /api/v1/memberships verifies the caller through the existing identity adapter
  and returns only own active VendorOwner/VendorStaff scopes in active vendor tenants.
- Only tenantId and role are returned. Client role/user/vendor headers grant no
  authority; query selectors and unknown/duplicate parameters are rejected.
- Pagination defaults to 20, caps at 100 and reads at most one extra eligible row.
  The bounded version-1 cursor is actor-bound and resolves within the same active
  caller scope. A guessed, inactive or other-user position fails safely.
- Unassigned users and operators receive empty lists. The existing restrictive
  DeliveryPartner exclusion also applies to mixed delivery/vendor memberships.
- Empty and nonempty results append a minimal durable self-scoped audit in the same
  transaction. Audit failure, zero inserted rows or failed commit cannot release data.
- Node and Next adapters delegate to the shared handler. Server context resets the
  discovery mode between transactions; rollback failure discards the connection.

Existing memberships use a composite tenant/user key without created_at or a
standalone ID. Pagination therefore uses stable tenant UUID order within the
caller. This documented exception avoids a schema rename or invented timestamp.
The cursor is not encrypted, signed or an authorization credential.

## Database and security changes

membership_list_audits is the ninth private application table. It records only
generated event/time, verified actor, fixed action/outcome, actor resource and
request ID. No returned vendor list, token, address, file content or signed URL is
stored. Enabled/forced RLS binds actor/resource/request and discovery mode.
API has INSERT only; provisioning and exposed provider roles have no access.

Membership/tenant SELECT policies preserve the selected-tenant branch and add a
disjoint own-discovery branch only with empty tenant context. No create/update,
role-management, unrestricted audit review or file permission was added.

Applied actual hosted migrations: 20261009115552_virtual_ink_membership_discovery
and 20261009115855_virtual_ink_membership_discovery_policy_merge. Exact copies
and portable SQL are saved. The second consolidates equivalent predicates after
the advisor flagged duplicate SELECT policies. Isolation was rerun after the merge.
There are now eight hosted Phase 2 migrations; owned PostgreSQL 17 replay remains open.

Runtime readiness now checks nine tables and exact privileges for both groups.
Both service accounts remain NOLOGIN. Catalog tests use rolled-back SET ROLE
grants, not password/TLS login. No real Auth/application user or vendor was created.

## Verification results

| Check | Actual result |
| --- | --- |
| npm test | 90 pass; zero failures; 12 new tests |
| Strict backend/scripts/tests TypeScript | Pass using installed web compiler/types |
| npm run typecheck:web | Pass for web/shared source |
| Hosted discovery assertions | Pass; includes actual parameterized repository queries |
| Existing tenant-isolation regression | Pass, including after policy consolidation |
| Existing provisioning/account regressions | Pass with rolled-back fixtures |
| Actual runtime foundation query | Pass for nine tables under both disabled accounts |
| Security advisor | No findings |
| Performance advisor | Duplicate policy warnings fixed; five unused-index INFO notices |
| Auth/all nine application tables | Zero rows after tests |
| setup:check --database | Blocked correctly; no database connection performed |
| npm run build:web | Failed: spawn EPERM |
| Word report | Structural checks; rendering blocked by missing LibreOffice |

Unused-index notices occur on the empty development schema. Retain FK/audit
indexes until workload evidence supports a change. Remediation reference:
https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

The API tests use synthetic verified identities/database ports and real temporary
Node HTTP sockets. Hosted SQL proves policies/joins/audit constraints, including
another user/vendor, inactive scopes, delivery exclusion, selected-tenant behavior
and identity-context spoof denial. This does not prove a genuine provider login,
configured pg pool, TLS handshake or simultaneous pool operation.

Private setup remains blocked by missing pg, credentials/CA, enablement and approved
development identity/smoke references. The five-check genuine smoke did not run.
Next production build failed on process spawning; actual Next HTTP/browser/mobile
checks remain pending. Immediate in-flight revocation, owned database replay and
human acceptance remain open. The Word render attempt cannot run without LibreOffice;
visual QA is not claimed. No payments, uploads, marketplace or deployment was enabled.

## Files created and changed

Created code: src/backend/identity/memberships.ts; src/app.d.ts;
apps/web/src/app/api/v1/memberships/route.ts; test/memberships.test.ts.
Created SQL: two database/phase2 sources, their matching versioned Supabase
migrations and database/tests/membership-discovery.sql.

Changed code: src/app.js; src/backend/identity/service.ts and routes.ts;
api/responses.ts; audit/events.ts; database/pool.ts and readiness.ts;
test/setup.test.ts. Paths after identity are under src/backend.

Created docs: source-document-baseline.md, acceptance-phase-2-membership-read.md,
membership-discovery.md, the source-review Markdown/Word handover and this report.
Changed docs: README; AGENTS; build plan; backend foundation/Phase 2/validation;
live setup; API standards; permissions; open questions; task board; team-report index.
Historical reports and supplied assets are preserved. Existing frontend lockfile/
generated setup changes were not manually edited in this backend slice.

Commands: npm test; npm run typecheck:web; strict tsc --noEmit over backend/scripts/
tests; npm run setup:check -- --database; npm run build:web; Supabase --help;
hosted migration/history, SQL assertions, actual foundation queries, advisors and
counts; Git diff --check; source hash/link checks; Word generation/render attempt.
CLI --help still fails because the installed wrapper lacks its Windows binary;
hosted tools supplied actual migration versions. No fictitious lockfile was added.

## Where each lead starts

| Lead | Next action | Evidence |
| --- | --- | --- |
| Uchi Chinyama | Review membership contract and lifecycle authority | MEMBER-01/02/03 and AUTH-02 decisions |
| Mumba Chitonge | Complete private setup and genuine smoke | Readiness, own/other-tenant denial and committed audits |
| Taizya Nakapende | Review workspace list and expired/denied/empty UX | Flow handover; browser/mobile findings when preview works |
| Lubasi Monde | Verify intended vendor owners/staff and support rules | Private discovery and approval references |

## How to run and next prompt

Run npm test and npm run typecheck:web. Follow docs/live-backend-setup.md privately,
then npm start; restart an existing process to load the new route. Without a bearer,
GET /api/v1/memberships returns 401. This proves routing only, not live Auth.

Next prompt for Mumba: complete Virtual Ink's genuine Auth/pg/TLS setup using the
private readiness guide and approved development accounts. Verify existing me,
tenant access and membership discovery with committed audit inspection and
other-tenant denial; keep secrets out of arguments/logs/reports. Review Uchi's
membership lifecycle and immediate-deactivation decisions, then prepare one
audited suspension slice with explicit authority and last-owner/concurrency rules.
Keep invitations, broad audit review, files, marketplace and escrow outside that
slice. Produce dated Markdown/Word evidence; human acceptance stays explicit.
