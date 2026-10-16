# Virtual Ink — Phase 1 authenticator replacement

Date: 16 October 2026. Overall status: **PARTIAL**.

## Inspection before implementation

Supabase Auth supplies genuine TOTP factors and AAL2. The private application role
assignment tables remain authoritative; browser metadata grants no role. The
existing restricted role writer and provider verification hook are preserved.

The application rejects enrollment whenever any verified factor exists, while
factor removal requires at least two verified factors. Administrators therefore
cannot replace a working authenticator through the application. The provider
adapter also reuses one friendly name, which conflicts on a second enrollment.
There is no explicit removal confirmation. These are a reproducible usability
gap and a confirmation gap; no authorization bypass has been reproduced.

The selected slice adds a separate server-authorized replacement enrollment,
requiring recent primary authentication, provider-backed AAL2, application step-up
and the native verification receipt. The existing factor remains until a second
factor is verified. Removal remains server checked and audited. No final-factor
removal, recovery bypass, additional marketplace feature or hosted write is in scope.

Read-only environment inspection still finds one relevant active project shared
with Production, an organization on Free and no development branch. A compatible
isolated target is pending. The user has reaffirmed Phase 1 scope until traction;
that direction does not resolve environment isolation or security acceptance.

## Implementation and verification

The separate `replace-enroll` action has a strong database reservation: recent
primary authentication, live provider AAL2/TOTP, signed application step-up and
the native verification receipt are required before contacting enrollment. The
original `enroll` action still denies every already-protected account. Customers
and vendors cannot use the administrative action. Provider enrollment names now
include a random UUID so a second factor does not collide with the first.

The restricted interface reviews replacement enrollment, displays the provider QR,
verifies the new factor and explicitly confirms removal of the selected old
factor. It tracks the enrollment QR's factor independently of the selection and
does not offer removal while fewer than two verified TOTP factors are shown. The
server remains authoritative. Secret/code/token values are never returned in
ordinary API data or audits; the private enrollment QR is intentionally delivered
only for the setup attempt. No local storage or recovery codes are added.

Review also identified a conditional race in the old application sequence: two
removals could read the same pre-removal count before either provider operation
finished. No pre-fix genuine two-factor deletion exploit was executed. The fix
uses a durable, subject-scoped reservation spanning provider HTTP and application
instances. It records factor/session/correlation identifiers and time, with
enabled/forced RLS and no ordinary/browser/service/native table permissions. Only
the existing non-login command owner can maintain it through the trusted command.
The existing advisory lock serializes decisions; the durable row continues to
protect the external operation after that transaction commits.

Matching success releases the reservation. A failure before provider removal was
attempted releases it. Timeout, crash, failed result audit and uncertain provider
failure leave it held without automatic expiry. This avoids a stale completion
racing a retry, at the cost of private operator intervention after uncertainty.
Another correlation cannot settle the operation. The operator runbook requires
review, stopped traffic/workers, verified final provider state, session revocation
and an append-only reconciliation event before deleting the exact reservation in
one transaction. That private operator process is documented, not executed or
human-approved. Direct-provider lifecycle auditing remains a separate open gate.

## Migration and role boundary

The pinned Supabase CLI generated
`20261016173857_virtual_ink_authenticator_replacement.sql`; its reviewed source is
`database/phase1/authenticator-replacement.sql`. SHA-256:
`a9071f93cf7f74085c2807e4a1fb947a6299798f2f970388b11e3e3c84ad2bb1`.
The preceding thirteen migrations are preserved. Fourteen migrations replay
locally; the visible hosted database still has ten and all four Phase 1 migrations
remain unapplied. There is no Auth table/policy/trigger change, new LOGIN,
privileged browser credential or hosted SQL/Auth/role write in this slice.

Privileged-role writes retain the existing SUPER_ADMIN requester, distinct
SUPER_ADMIN approval, reason, current assignment/expiry, immutable audit and atomic
session-revocation rules. No role authority is taken from browser input.

Files changed: the new SQL source/migration; src/backend/identity/security-admin.ts;
apps/web/src/lib/security-admin.ts; apps/web/src/components/security-admin-panel.tsx;
test/security-admin.test.ts; scripts/genuine-mfa-local-check.mjs,
provider-mfa-guard-check.mjs, privileged-security-db-check.mjs, web-auth-checks.mjs
and web-ui-checks.mjs; AGENTS.md, README.md, the security runbook/review, closure
checklist, task board, open questions, team-report and this Markdown/Word pair.
No dependency or lockfile change is included.

## Actual test results

Final genuine run: 2026-10-16T17:47:18.876Z. Application test runtime: reviewed Node
24.21.0. Real Auth v2.197.0/PostgreSQL 18 digests are unchanged from the prior report.

| Check | Result |
| --- | --- |
| Root suite | 199 pass; zero failed/skipped |
| Security subset | 188 pass |
| React/mesh SSR | Ten pass, including first/replacement controls and disabled final removal |
| Real SDK/Next adapter with synthetic HTTP | Sixteen pass; distinct provider names and server cookie handling checked |
| Genuine local Auth/application | 207 pass: 87 baseline plus 120 post-cutover assertions |
| Genuine replacement journey | Primary-only denial, original-route denial, distinct replacement, original factor preserved while new one is unverified, old removal denied before verification, native verification, exactly one concurrent removal success, one remaining verified factor, final-factor denial and durable alerts pass |
| SQL replay | Fourteen migrations, six existing suites and actual original role loader pass |
| Restricted SQL assertions | 108 pass, including stale/absent MFA, wrong roles, replacement budget, in-flight removal conflict, safe pre-provider release, retained uncertainty, wrong-correlation rejection and ordinary-role table denial |
| Web and strict backend/shared types | Pass |
| Production-format local build | Pass; sixteen static pages and dynamic routes |
| Measured backend/shared unit files | All 38 inventoried files measured; none omitted/missing |
| Lines | 2079/2093 = 99.3311% |
| Branches | 1498/1548 = 96.7700% |
| Functions | 191/194 = 98.4536% |
| Browser artifact scan | All 53 generated text artifacts scanned; zero credential/token/enrollment-secret patterns |
| Repository security heuristics | Pass |
| Dependency advisories | Root production and full web audits both zero known vulnerabilities |
| Cleanup | Genuine task-labelled containers/volumes/network removed; SQL rollback/zero residue and instance stop pass |

Coverage scope is backend/shared unit source, excluding frontend/browser, SQL,
server lifecycle and hosted integrations. SSR and synthetic Next adapter checks
are not browser acceptance. The genuine run uses actual native Auth HTTP, source
gateway/controller and private database commands, with a strict local transport
rewrite. It is not a running deployed Next server or physical QR scan. The guarded
fixture's shared-IP budget remains 60 to distinguish account limits from IP
throttling; no deployed provider limit is changed. Generated secrets/tokens and
structured code fields were checked against local logs without printing them.

Initial process/Docker/Postgres sandbox failures were retried with authorization.
The first genuine replacement fixture wrongly inspected the SDK's verified-only
`totp` list for an unverified factor. It was corrected to inspect `all`, and the
final genuine run passed. The SQL and complete regression runs also passed after
the final removal-reservation changes. These earlier failures are not hidden.

## Security findings and limits

AUTH-REPLACE-01 is closed locally: working-device replacement is usable through
the recent-MFA boundary; the first-factor path cannot add an additional factor.
The old name-collision and missing confirmation are addressed. The removal race
was conditional from source inspection; durable SQL reservation and genuine
concurrent-request tests now prove the application rejects overlap and preserves
a verified factor. Uncertain-provider lockout is deliberate and remains subject
to operator/policy review. This does not prove an independent native admin API
enforces the application's factor-management rules.

No new locally reproduced critical/high application issue remains in this slice.
The existing HIGH-NODE-01 gate remains: [Node's security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes on/after 21 October. A passing static runtime check and
zero npm advisories do not close it. Managed [MFA hook availability](https://supabase.com/docs/guides/auth/auth-hooks)
still needs an eligible Teams/Enterprise project or an authorized self-hosted
target. The current web adapter needs a separate review before self-hosted use.

Hosted/browser callbacks, cookies/headers, log privacy, isolated resource binding,
controlled lost-device recovery, provider-direct factor-change audit ingestion,
external alert delivery, real bootstrap and human acceptance remain open. Unbuilt
Phase 1 vendor/suspension/financial mutations remain unavailable. No final Phase 1
mission group is accepted by these local checks. Sensitive Production enablement
remains blocked.

At 18:02 UTC the read-only hosted security advisor reports the same single INFO
for the intentionally closed vendor-reviewer audit table with no RLS policy;
[advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
This existing hosted check does not assess the four unapplied Phase 1 migrations.

Tool outputs were treated as untrusted. No private provider user rows, credentials,
codes, tokens, raw logs or recovery evidence were disclosed or staged. Fixtures
were synthetic and loopback only. The security review is application scoped;
it does not claim a workstation/provider/production penetration test. User
next-env changes and supplied attachments remain unstaged.

## Git, Vercel and delivery

The reviewed code/report will be committed and pushed on
`codex/phase-1-mfa-privileged-security`; exact source and Preview evidence will be
recorded after delivery. No merge or Production promotion is authorized by this
report's local passes. Main/Production remains `a6736376b09ba7c3242495ff86b4bb2eea62f20c`.
The preceding [provider-guard Preview](https://virtual-f2xm5ktgv-shadowrootsec-5679.vercel.app)
does not contain this slice. Hosted application acceptance remains pending.

The matching Word report uses the existing compact_reference_guide/memo_masthead
generator and named overrides. Structural, link and privacy checks accompany
delivery. LibreOffice is absent; rendering/visual pagination is unavailable.
Neither report delivery nor source hosting establishes phase completion.

## Exact next action and team handover

Select the isolated eligible managed project and synthetic identities, or an
authorized self-hosted target with URL/key adapter review. Configure credentials
privately, review/apply the fourteen migrations there, configure the native hook
and matching markers, then execute genuine Preview Auth/MFA/role/replacement,
negative tests, callbacks, browser, cookies/headers and sanitized log acceptance.
Resolve controlled recovery/provider audits and the runtime gate before promotion.
Continue the existing private-file/order/vendor/manual-status Phase 1 journey;
retain Phase 1 scope until traction and an explicit user decision.

- Uchi: choose the isolated eligible target and approved synthetic identities;
  review the uncertainty/reconciliation availability policy and actual bootstrap.
- Mumba: review migration ownership/RLS and execute hosted MFA, role, replacement,
  recovery and runtime acceptance with Uchi.
- Taizya: verify replacement/removal confirmations, QR/code and error states on
  mobile/desktop once the isolated deployed journey is available.
- Lubasi: review private identity/recovery and abandoned-operation evidence,
  authorization, audit correlation and alert response. No signoff is inferred.
