# Virtual Ink — Initial trusted identity context and merge

Date: 16 October 2026. Backend owners: Uchi Chinyama and Mumba Chitonge.
Status: **PARTIAL Phase 1; locally verified internal context foundation.**

## What changed

The initial loadPhase1Actor helper binds a verified provider identity to existing
active application identity/user/role rows inside the caller's transaction.
It clears prior user/tenant/access-mode scope. Only a single legacy Customer or
DeliveryPartner maps to CUSTOMER or DELIVERY_PARTNER. A Customer with an active
vendor membership denies through the existing self-scoped RLS discovery mode and
a LIMIT 1 read. Missing/duplicate/mixed/unsupported roles and inactive mappings
deny. PlatformOperator never becomes ADMIN. Returned arrays and actor are frozen;
there are no grants, organization IDs, resource assignments or elevated MFA.

This is an internal loader with no production business-route caller. It must run
after provider verification, before tenant selection, inside the future resource/
action/audit transaction. It does not persist an audit, load order/file scope,
prove MFA, implement the other six role lifecycles or complete route enforcement.
Existing legacy reads retain their own policy. See docs/phase-1-trusted-context.md.

The provider verifier now rejects deleted records and malformed/non-string ban
timestamps. Active bans deny; valid expired bans remain eligible. HTTP tests prove
these denials happen before querying application data. Browser role headers and
provider user_metadata remain non-authoritative.

Created source: src/backend/identity/phase1-context.ts and test/phase1-context.test.ts.
Modified source/config: src/backend/identity/supabase.ts and package.json; the five
new test groups are included in the security suite. Setup, matrix, task board,
closure/security notes, README and current report pointers are updated. Supplied
assets, historical reports and the unstaged apps/web/next-env.d.ts edit are preserved.

## Tests and measured scope

Final verification uses private Node 24.21.0 and the existing phase-readiness
helper. The coverage artifact records 16 October at 03:59 UTC.

| Check | Actual result |
| --- | --- |
| Complete root suite | 183 pass; zero failed/skipped |
| Security subset | 172 pass, including five new context groups |
| React/mesh regression checks | Nine pass |
| Synthetic Supabase SDK/Next Auth checks | Fourteen pass; no genuine mailbox/provider used |
| Web and strict backend/shared types | Pass |
| Production build | Pass; sixteen static pages generated |
| Backend/shared scope | All 34 inventoried files measured; 95% gate passes |
| Lines | 1726/1740 = 99.1954% |
| Branches | 1179/1223 = 96.4023% |
| Functions | 156/159 = 98.1132% |
| Repository heuristics / fixed runtime gate | Pass |
| Root/web npm audits | Both zero known vulnerabilities |
| Fresh PostgreSQL 18 replay | All ten reconciled migrations pass |
| Existing SQL rollback suites | Five pass |
| Actual loader with restricted API role and RLS | Customer/delivery load; vendor/mixed roles and user/identity/role revocation deny; zero fixture residue |

The actual loader probe uses an isolated password-protected cluster at
127.0.0.1:54329 and SET ROLE virtual_ink_api. Synthetic setup stays in an outer
transaction that is always rolled back; it never commits onboarding data.
Provisioning commit/audit constraints are independently covered by the five
existing suites. Provider-role stubs represent fixture names, not real sessions.
The instance stops after verification. No hosted SQL writes were performed.

The first combined type check failed because the main branch's existing Analytics
package was absent locally. Sandboxed npm ci then failed with cache/permission
errors; the approved rerun restored the exact merged lockfile with install scripts
disabled. The final combined suites/types/build all pass. No failure is counted as
a passing gate. Existing module-type and Three.js deprecation warnings are non-fatal.

Coverage excludes frontend/browser flows, SQL, server lifecycle and genuine hosted
integrations. Existing UI/Auth checks are regressions, not role acceptance. No
manual acceptance or authenticated deployed role workflow was executed. Zero of
the seventeen final mission groups is fully proven; Phase 1 remains PARTIAL.

## Security evidence and limits

CTX-01: a synthetic before-fix probe loaded the committed verifier and supplied
successful provider responses containing an invalid ban date or deleted_at.
Both were accepted. Date.parse produced NaN, and deletion was not checked. The
fix rejects invalid ban state and any non-null deletion field. Current unit/HTTP
regressions pass and make no application database calls for those records.
This requires an erroneous/trusted-adapter provider response; no genuine Supabase
suspension bypass or attacker control of provider responses was demonstrated.

Role-escalation probes deny legacy operators, invented ADMIN, multiple/duplicate
roles and Customer vendor membership. Parameterized identity/membership reads,
transaction-local scope clearing and conservative empty assignment/grant facts
prevent those facts from creating privileged evaluator authority. Resource-loader,
audit atomicity and all eight-role schema/lifecycle integration still need work.
Repeatable-read snapshots do not cancel requests already in flight at suspension;
live session revocation is not verified. Delivery obtains no assignment/file grant.

The existing [Node notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
schedules HIGH-severity 24.x fixes for 21 October. Sensitive enablement stays
blocked pending release review, patch and retest; the fixed runtime gate and npm
audits do not resolve it. Existing framework advisory, distributed abuse controls,
genuine Auth/session/MFA, private files and human acceptance remain open.

The [Supabase changelog](https://supabase.com/changelog) was reviewed: the relevant
12 October TLS notice removes obsolete HTTP cipher suites no earlier than
10 November; no provider API/cipher override was added. Server Auth guidance was
checked against the [official advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
The installed Supabase CLI help failed because its Windows binary package is
missing. No migration is required or fabricated for this existing-schema slice.

Tool actions used local synthetic probes, reviewed dependency metadata and public
guest reads. No provider credentials, real customer/vendor records, signed links
or private evidence were printed or staged. No external message, destructive
hosted probe, simulated signoff or new role activation was performed.

## Commit, merge and Vercel evidence

The previous recovery/evaluator/reconciliation branch was integrated with main's
separate Analytics change without conflicts. Merge commit a7a68f4 was pushed to
main; an independent git ls-remote confirms it on GitHub. Analytics is preserved.
The new context slice is committed as fc6f8a586738b82a3befd6645dff3705aa8a595b on
codex/phase-1-trusted-context, pushed and fast-forward merged into main. An
independent git ls-remote confirms the same source commit on both remote branches.
Only the fourteen reviewed source/test/report files were staged; staged diff
validation passes. The user next-env.d.ts edit remains unstaged.

Production URL: https://virtual-ink.vercel.app
At 04:18 UTC all twenty public-page, rendered-image, health and guest-denial smoke
checks pass. These checks do not identify the served Git commit or prove genuine
Auth/database/files. The approved CLI rerun and read-only deployment API now
confirm Production deployment dpl_7onH41KaiA46R1pEYVGKxG2av6jT is READY at
https://virtual-3wmd22583-shadowrootsec-5679.vercel.app. Inspecting the Production
alias resolves to that deployment, with exact source
fc6f8a586738b82a3befd6645dff3705aa8a595b on main. At 04:32 UTC, after that source
became Ready, a fresh run passes all twenty public-page/image/health/guest checks.
Genuine Auth remains unverified.
The initial sandbox CLI fetch/credential-access failure is resolved by that rerun.
No protection setting or authentication bypass was changed. No phase is complete.

No schema migration, new endpoint, environment variable or service permission is
introduced. The reconciled hosted ten-migration history and original nine-table
readiness contract remain unchanged; credentials/CA and genuine runtime setup
stay private and pending.

## Team next actions and report checks

- Uchi: review conservative role denials; coordinate approved synthetic Auth
  setup and the Node patch follow-up, and retain full Phase 1 acceptance gates.
- Mumba: pair with Uchi on explicit eight-role assignments, privileged lifecycle,
  MFA and resource-context/audit integration with SQL, HTTP and concurrency tests.
- Taizya: specify denied, suspended, step-up and empty role states in the existing
  Virtual Ink visual system; no human UX approval is inferred.
- Lubasi: resolve vendor assignment, cancellation, delivery minimum data and
  break-glass operations, keeping real verification evidence outside Git.

Word uses the established compact_reference_guide preset, memo_masthead pattern
and named report-style overrides. Structural checks pass. The renderer was
attempted and failed because LibreOffice is absent (WinError 2); visual pagination
remains unverified. All 176 local links, required report evidence, OOXML and privacy
checks pass. No human
signoff or phase completion is claimed.
