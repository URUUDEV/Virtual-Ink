# Virtual Ink — Migration history reconciliation

Date: 16 October 2026. Backend owners: Uchi Chinyama and Mumba Chitonge.
Status: **Reviewable reconciliation slice; Phase 1 remains PARTIAL.**

## Result and scope

DB-RECON-01 now has matching hosted/local history and fresh replay evidence.
All ten versions, names and normalized SQL SHA-256 checksums agree with the
approved development project, odgxcuwueessxfsoveza. The two previously untracked
vendor files are retained under their existing hosted versions. No hosted DDL,
migration-history repair, credential change, role activation or Auth enablement
was performed. This slice does not implement trusted eight-role context.

The existing apps/web/next-env.d.ts edit is preserved and excluded from delivery.
Historical reports and supplied assets are unchanged. Current setup, task board,
closure checklist, security notes, README and AGENTS boundary are updated.

## Reconciled history

The first eight versions remain unchanged: 20261008232317, 20261008232912,
20261008232942, 20261009101428, 20261009101653, 20261009110852,
20261009115552 and 20261009115855. Both missing versioned files now match:

- 20261013060510_virtual_ink_vendor_onboarding_core.sql
- 20261013061926_virtual_ink_vendor_onboarding_transaction_scope.sql

For comparison, SQL is joined with a newline when stored as multiple statements,
CRLF becomes LF, and surrounding ASCII space/tab/CR/LF is trimmed. No interior
SQL is rewritten. Both MD5 comparison and independent SHA-256 comparison passed
for all ten files; SHA-256 is the recorded evidence below for the vendor versions.

Core normalized SHA-256:
`ff8efd44f5e13107fbb6278eea946baf1fb2cba01be4bad8e4054ecb3a947739`

Transaction-scope normalized SHA-256:
`1ef6e3a3e90e697061184af5592e4edf237fd175818e4252015e6437ad9f8631`

The hosted comparison uses read-only schema_migrations queries. SQL fingerprints
prove the recorded source comparison, not the absence of later manual schema
drift. Fresh replay and catalog checks provide separate, bounded evidence.
Do not rerun these already-applied migrations against the hosted project.

## Executed checks and actual results

Verification ran during the resumed 15/16 October session; the coverage artifact
records 15 October 2026 at 20:17 UTC. The report follows the updated local date.

| Check | Actual result |
| --- | --- |
| Fresh PostgreSQL 18 migration replay | Ten versioned migrations pass in order |
| SQL rollback suites | Five pass: phase2, provisioning, runtime-accounts, membership-discovery, vendor-onboarding-core |
| Vendor fixture residue | Zero applications and zero profiles; server stopped |
| Root tests, private Node 24.21.0 | 178 passed, zero failed/skipped |
| Backend/shared coverage | All 33 inventoried files measured; 95% gate passes |
| Lines | 1685/1699 = 99.1760% |
| Branches | 1158/1203 = 96.2594% |
| Functions | 155/158 = 98.1013% |
| Repository security heuristics | Pass, zero matching findings |
| Fixed runtime baseline | Pass for private Node 24.21.0 |
| Root/web npm audits | Zero known vulnerabilities in both |
| Hosted catalog | 18/18 private tables have enabled and forced RLS; five application roles are NOLOGIN, non-superuser and NOBYPASSRLS; zero provider bridges |

Replay used a new password-protected cluster on 127.0.0.1:54329 and the existing
five reviewed SQL fixtures. The private replay helper applies versioned history
once; it does not separately reapply core.sql/commands.sql. Local anon,
authenticated and service_role stubs supply fixture role names, with service_role
carrying BYPASSRLS to exercise schema/ACL denial. They contain no provider users,
sessions or tokens and do not establish genuine Supabase Auth.

Initial sandbox server startup failed with Windows restricted-token errors.
The approved rerun started the isolated server. Two fixture attempts then failed
because the fresh cluster lacked provider role names; adding all three labelled
stubs resolved that setup issue. The final complete replay and all five suites
pass. No failing attempt is counted as a passing check or a production defect.

Frontend/browser, production build, strict types and genuine hosted workflows
were not rerun for this SQL-history/documentation slice. SQL, browser and genuine
integration coverage are outside the 33-file unit denominator. No phase acceptance
group is closed; the last mission mapping remains 0 of 17 fully proven groups.

## Security review and remaining risk

The changed risk is migration reproducibility: omitting hosted versions could
cause a later rollout to duplicate objects or construct the wrong baseline.
Matching immutable history and fresh replay address that defect without executing
hosted writes. The SQL continues to use private tables, forced RLS, narrow roles,
invoker functions and bounded synthetic denial tests. Cross-owner/reviewer/MFA,
stale-version, immutable audit and column-rights assertions pass. Trusted server
context is still required; arbitrary SQL access remains inside that trust boundary.

Hosted advisors report one security INFO for vendor_reviewer_grant_audits having
RLS with no policy. It remains deliberately inaccessible to ordinary roles;
do not add a permissive policy to silence it. See the
[linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
Performance findings remain six per-row context warnings, one overlapping-policy
warning and nine unused-index notices; no policy was widened or optimized here.

The [Node security announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases),
updated 14 October, schedules HIGH-severity fixes affecting 24.x for 21 October.
This blocks sensitive enablement pending release review, patching and retesting;
the fixed repository runtime gate and zero npm audit entries do not resolve it.
Application exploitability is not demonstrated. The existing
[Next cache advisory](https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p)
still lists unresolved patch text; its root catch-all precondition is absent from
the established source review. No live exploit probe was performed.

Tool actions used catalog/advisor reads, local synthetic replay and dependency
metadata. No real vendor data, customer files, private addresses, signed links,
credentials or external messages were staged. No destructive hosted test or human
approval simulation was performed. This is a scoped application review.

## GitHub, Vercel and completion boundary

Delivery uses the existing codex/phase-1-auth-recovery review branch. Source/report
commit 9adda05 was pushed successfully to origin; git ls-remote independently
confirms the remote branch. Only the thirteen reviewed files were staged, and
the next-env.d.ts edit remains unstaged. Staged diff validation passes. Production
is not promoted. This slice adds no application route or new hosted migration.

Existing Production URL: https://virtual-ink.vercel.app
Previous evaluator Preview: https://virtual-nhoy63uw4-shadowrootsec-5679.vercel.app
These are historical URLs, not newly verified deployment evidence. No new Vercel
workflow is passed by this report. Genuine Auth, restricted runtime credentials,
trusted role context, orders/files and human acceptance remain open. No phase is
complete and no secret environment variable is required by this reconciliation.

## Team actions and document checks

- Uchi: review this reconciliation, coordinate the Node advisory follow-up and
  approved synthetic Auth identity/private configuration; retain acceptance gates.
- Mumba: review versioned history with Uchi, then implement the smallest trusted
  identity-to-role context and suspended-user denial slice with SQL/HTTP/audit tests.
- Taizya: specify suspended, denied, step-up and empty role states using the
  existing Virtual Ink design direction.
- Lubasi: resolve assignment, cancellation, minimum delivery data and privileged
  operations decisions; keep real verification evidence outside Git.

The matching Word report uses the established compact_reference_guide preset,
memo_masthead pattern and existing named report-style overrides. Structural/link/
privacy checks pass, including 183 local links and ten normalized hosted SHA-256
matches after removing trailing blank lines from the two recovered files. The
renderer was attempted and failed because LibreOffice
is absent (WinError 2). Visual pagination is unverified; no human signoff is claimed.
