# Virtual Ink — MFA and privileged-role security

Date: 16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Overall status: **PARTIAL. These controls are not COMPLETE.**

## 1. Overall status and inspection

The [pre-edit gap report](2026-10-16-mfa-privileged-gap-report.md) identifies
Supabase Auth, server cookies/PKCE, legacy private roles and the unapplied role
assignment foundation. No genuine MFA interface or runtime privileged writer
existed. No mfaEnabled/mfa_enabled authorization switch was found in application
source. Synthetic assurance fixtures were not accepted as genuine MFA evidence.

Provider-backed MFA and the trusted role writer now pass real local Auth and
database integration checks. Managed-cloud/browser, isolated Vercel Preview,
recovery and human acceptance remain open. The visible hosted project is unchanged;
Production enablement is rejected. No escrow, blockchain, payment execution or
additional marketplace feature was added. The user next-env edit and supplied
assets are preserved. Zero of seventeen final Phase 1 mission groups is fully
accepted; Phase 1 remains PARTIAL.

## 2. MFA implementation evidence

Primary login leads administrators to /admin/security, where the server checks
identity, current roles, provider factors and assurance. Supabase TOTP enrollment,
challenge and verification establish genuine AAL2. The QR stays in component
memory; it necessarily contains the enrollment secret. Separate secret/URI and
access/refresh tokens are never API response fields. The SSR adapter commits
HttpOnly Secure SameSite=Lax session cookies only after successful provider/audit
work. Invalid provider operations do not commit pending cookies.

Sensitive actions require online verification of the same bearer, bound
issuer/user/session, live provider account/session AAL2, a verified same-user TOTP
factor and matching password/TOTP AMR within five minutes. An additional signed
HttpOnly Secure SameSite=Strict application cookie binds that exact session and
AMR, expires within five minutes, and is issued only after application-mediated
genuine verification. Missing, tampered, transferred or expired proof denies.
It does not replace live provider MFA. Primary reauthentication and password,
factor or logout changes clear it. Administrator password updates require this
boundary; ordinary recovery gains no administrative authority.

Durable account/operation budgets precede provider work: five verification,
enrollment or reauthentication attempts per fixed five-minute bucket, ten for
other MFA operations. A private stable HMAC key fingerprints submitted codes;
five-minute reservations prevent reuse across challenges/sessions without storing
codes. Provider limits also apply. Redacted attempts/results, repeated-failure
alerts and suspicious-factor events are durable and visible in the restricted
audit interface. External alert delivery/provider-direct ingestion remain open.

Genuine local evidence uses digest-pinned Supabase Auth v2.197.0 and PostgreSQL 18,
real HTTP, the installed SDK, the actual application gateway/controller and a
restricted database login. Synthetic identities are the only accounts. All 87
checks pass, including response privacy assertions. Real primary login, AAL1
denial, QR enrollment, valid verification/AAL2, invalid and expired codes/challenges,
replay prevention, limits, alerts, logout and audits pass. The encrypted provider
secret has the expected aes-gcm-hkdf envelope; authenticated decryption with the
private generated test key matches the original synthetic secret. Provider logs
contain no generated credentials/tokens/secrets or structured six-digit code.

This provider release rejects reuse of a challenge but accepts reuse of the same
TOTP against another challenge during its time window. The application denies
that reuse before contacting the provider. Direct-provider AAL2 without the
application proof cannot use sensitive administration. A positive genuine
protected lookup passes, preventing a broken verifier from masquerading as a
successful denial. This is local evidence, not a claim about managed-cloud
configuration, physical QR scanning, email delivery, browser TLS or Vercel MFA.

Unverified enrollment cancellation requires recent primary login. Verified-factor
removal requires recent MFA and another verified factor; the final factor cannot
be disabled through the application. Recovery records require two distinct current
SUPER_ADMIN approvals plus private identity review. Actual provider operator
recovery and audit correlation remain unverified. Additional verified-factor
enrollment and recovery codes are not offered by this review flow.

## 3. Privileged-role write path

ADMIN/SUPER_ADMIN are reused; four distinct specialist roles extend the original
eight: SECURITY_ADMIN, FINANCE_ADMIN, DISPUTE_REVIEWER and PAYOUT_APPROVER. Their
names grant no unrelated order/file authority. One active assignment remains.
Changes replace it; privilege removal restores CUSTOMER. Immutable temporary
expiry is at most thirty days; SUPER_ADMIN cannot expire automatically.

The browser sends only target, expected assignment, requested role, mandatory
reason and optional expiry to a server-only route. Identity and actor authority
come from verified server state. A current SUPER_ADMIN requests; another current
SUPER_ADMIN, distinct from requester/target, approves; requester or approver
executes within fifteen minutes. All stages require recent genuine assurance and
fresh roles. Customers/vendors/self promotion and ADMIN granting SUPER_ADMIN
deny. The last active SUPER_ADMIN is guarded. No real admin/bootstrap is seeded;
synthetic fixtures and software-driven test approvals are not human approvals.

The private virtual_ink_security.command function serializes decisions with a
transaction advisory lock, requires READ COMMITTED and checks expected assignment,
current requester/approver, target activity and expiry. Execution atomically
revokes the assignment, inserts the new grant, writes mandatory transaction audits
and deletes affected provider sessions. Failure rolls those mutations back while
retaining a failure event. Every later action rereads current authority.

The genuine local integration proves separated approval, temporary ADMIN grant,
fresh-login access, expiry denial while the token remains valid, subsequent
removal and immediate stale-session rejection. Successful grant/removal records
include before/after roles, requester, approver, executor, reason, timestamp,
correlation ID, assurance, source, expiry/outcome and redacted metadata. Failed
requests are audited too. Audit events reject update/delete/truncate by ordinary
application and administrator roles.

The restricted interface shows identity/current role, requested change, risk,
reason, step-up, explicit confirmation, result and audit reference. SUPER_ADMIN is
never the default. React SSR passes; full browser/manual acceptance is pending.
Vendor verification, suspension, refund/release/payout mutations remain unbuilt.
Their shared guard denies missing assurance and returns unavailable instead of
executing an unbuilt action; no workflow acceptance is claimed for them.

## 4. Database policies and migrations

CLI-generated 20261016053031_virtual_ink_privileged_security.sql combines portable
database/phase1/security.sql with the separate security-supabase.sql adapter.
SHA-256: `249f13cbe9531049d206ec05b23071f3eb742c9a208559db5b11814b29e65cac`.
The preceding eleven migrations are unchanged. Twelve local migrations replay;
the visible hosted project remains at ten. Both Phase 1 migrations are unapplied.
Read-only hosted catalog/advisor checks found neither new schema and one existing
INFO for an intentionally closed audit table. No hosted DDL/Auth/role writes occur.

The runtime security group has command EXECUTE only: no role-table DML, Auth
access, owner membership or direct provider-broker execution. The business
function owner is NOLOGIN/NOBYPASSRLS/non-superuser with narrow business rights and
forced-RLS policies. Existing API/vendor/provisioner/anon/authenticated/service_role
groups gain no security rights, including through permissive creator defaults.

Real Auth RLS initially made non-owner column grants insufficient. Native Auth
policies are provider-owned; read-only hosted metadata confirms this task cannot
manage them. The separate fixed-search-path SECURITY DEFINER provider broker uses
the existing migration administrator's native rights, returns only a subject/session
boolean or deletes approved-target sessions, and checks the calling service
membership. Only the restricted business owner can execute it. No Auth policy or
table grant, BYPASSRLS, ownership or elevated credential is given to the runtime.
Read-only hosted metadata confirms postgres already has native read/revoke rights;
isolated hosted application verification is still required. Migration owners
remain an explicit administrative trust boundary.

Configuration starts disabled/unbound. No LOGIN/password or account is created by
the migration. Startup rejects unsafe logins, owner membership, issuer/environment
mismatch, Production and known shared-project Preview enablement. Preview needs
independent project binding and a verified CA. The synthetic SQL Auth fixture is
never applied to Supabase.

## 5. Files changed

- Core: src/backend/identity/security-admin.ts, assigned-context.ts,
  permissions/phase1.ts and api/errors.ts.
- Web: apps/web/src/lib/security-admin.ts, components/security-admin-panel.tsx,
  app/admin/security/page.tsx, app/api/security/[action]/route.ts,
  app/api/auth/[action]/route.ts, app/account/page.tsx and app/globals.css.
- Database: database/phase1/security.sql, security-supabase.sql,
  database/tests/security-auth-fixture.sql and the versioned security migration.
- Checks: test/security-admin.test.ts, phase1-permissions.test.ts,
  scripts/genuine-mfa-local-check.mjs, privileged-security-db-check.mjs,
  security-artifact-check.mjs, security-preview-check.mjs, web-auth-checks.mjs,
  web-ui-checks.mjs and package.json's opt-in local Auth command/security subset.
- Handover: AGENTS.md, README.md, current team/setup/security/task/permission/
  checklist/decision docs, phase-1-security-admin.md, disabled environment example
  and matching inspection/implementation Markdown and Word reports.

The user apps/web/next-env.d.ts edit and untracked supplied attachments remain
unstaged. No dependency/lockfile or supplied asset is modified. Ignored private
test credentials/logs are not delivery artifacts.

## 6. Tests executed and results

Measured at 11:18 UTC; final genuine run at 11:46 UTC; Node 24.21.0 reviewed baseline.

| Check | Actual result |
| --- | --- |
| Complete root suite | 198 pass; zero failed/skipped |
| Security subset | 187 pass |
| New core/controller groups | Seven pass, including signed-proof forgery/transfer/expiry denials |
| React/mesh SSR | Ten pass |
| SDK/Next synthetic HTTP | Sixteen pass; realistic 400 KB QR and bounded oversized rejection covered |
| Web and strict backend/shared types | Pass |
| Production-format local build | Pass; sixteen static pages and dynamic security routes |
| Coverage inventory | All 38 backend/shared files measured; 95% line/branch/function gate passes |
| Lines | 2074/2088 = 99.3295% |
| Branches | 1492/1542 = 96.7575% |
| Functions | 190/193 = 98.4456% |
| PostgreSQL 18 replay | Twelve migrations and six existing SQL suites pass |
| SQL private command | 77 counted checks plus supporting assertions pass |
| SQL negatives | Customer/vendor/ADMIN/self denial, last-super, missing reason, expiry, stale assignment/approval, atomic revocation rollback, append-only audits, replay/budgets and environment isolation pass |
| Concurrency | Advisory-lock contention and non-READ-COMMITTED denial pass; no broad load certification |
| Genuine local Auth/application | 87 checks pass against real Auth 2.197.0, including privacy assertions |
| Local lifecycle | Genuine MFA, dual approval, temporary expiry, removal, immediate native session revocation and complete audits pass |
| Native test cleanup | Only task-labelled containers/volumes/network removed; cleanup passes; no hosted identity created |
| SQL fixture cleanup | Zero residue and local instance stop pass |
| Browser artifacts | All 53 generated browser text artifacts scanned; no server key/configuration, DB URL, token or enrollment-secret patterns |
| Runtime baseline / repository heuristics | Pass |
| Root/web dependency audits | Zero known vulnerabilities in both scopes |

Coverage measures backend/shared units, excluding SQL, frontend/browser journeys,
server lifecycle and hosted integrations. The SQL suite uses provider-shaped
fixtures; the separate 87 checks use genuine provider HTTP and native Auth tables.
The native harness observes only its generated synthetic authenticator secret in
memory to supply valid test codes and verify encryption; it never prints it.

Initial build/provider runs hit Windows allocation failures and one restricted
worker-spawn denial. Only verified task-owned containers were cleaned after the
aborted process. Separate bounded-heap provider runs and a one-worker build pass.
Native RLS/QR bugs were fixed and retested. Existing synthetic malformed-cookie/
module/Three warnings contain no real secrets. No required local test remains
failing. None of these tests establishes managed-cloud or human acceptance.

## 7. Failed or incomplete requirements

- An isolated non-production Supabase target, approved synthetic identities,
  restricted runtime credential/CA and reviewed real bootstrap are missing. The
  visible active project is shared and has no development branches. No billed
  resource is created or assumed authorized.
- Managed-cloud enrollment/AAL2/code denials, effective encryption/session policy,
  provider-direct factor/logout audits and deployed log privacy remain unverified.
- Controlled recovery records/approvals exist; private identity review, provider
  operator execution/audit correlation and interrupted-operation reconciliation
  remain unaccepted. External alert delivery/direct event ingestion is absent.
- Additional verified-factor enrollment and recovery codes are not offered. The
  final verified factor has no application/support bypass.
- Vendor verification, suspension, refund/release/payout mutations remain unbuilt;
  shared guard tests do not establish those workflows.
- Actual browser/physical authenticator, exact deployed callbacks, protected-route
  session/assurance and isolated Vercel resource/cookie/header/log acceptance remain
  pending. Vercel protection is retained.
  The in-app browser connection also failed before navigation because its kernel
  assets could not be written (OS error 3); no browser check is claimed from it.
- HIGH-NODE-01 and human/phase acceptance remain open. No COMPLETE claim is made.

## 8. Vercel Preview URL and delivery

DELIVERY_PENDING_FINAL_SOURCE

The previous source 63d969d was Ready at
https://virtual-r618zjaoz-shadowrootsec-5679.vercel.app,
deployment dpl_33vs5fHmCkGSmGH3rFE6Up5FTzt4. Its four credential-free guest probes
were BLOCKED by Vercel protection, not application passes. This prior deployment
does not include the native RLS/QR/signed-proof corrections. Production/main stays
a6736376b09ba7c3242495ff86b4bb2eea62f20c, deployment
dpl_7f4Kj1XeRy1Mf3MrQiSV9PEs7PWB. No merge/promotion or hosted migration is performed.

## 9. Security findings

SEC-PASSWORD-01: the primary-only administrator password-update path lacked
application step-up. The enabled boundary now requires recent genuine MFA,
signed proof and audited results. Ordinary recovery remains separate; direct
provider settings still need managed acceptance.

SEC-ROLE-01: direct/self writes, client authority, stale grants/sessions and
unaudited changes are denied by strict server inputs, current DB authority,
distinct approval, immutable expiry and atomic audit/session revocation. Genuine
grant/removal plus negative SQL checks pass. A compromised migration owner or
trusted server credential remains outside ordinary-user isolation.

SEC-MFA-01: native Auth permits cross-challenge reuse within a TOTP window.
An attacker already holding a valid factor code and primary session could try to
bypass application reservations through the public provider API. Durable HMAC
reservations and the session/AMR-bound signed application proof deny that route;
genuine positive and negative tests pass. No claim of a hosted exploit or provider
CVE is made. External Auth HTTP work and application audit commits are not one
transaction; pending intent reconciliation/provider audit ingestion remain open.

SEC-NATIVE-RLS-01: native Auth RLS initially denied all restricted verifier reads;
a denial-only fixture could hide the broken journey. The narrow native broker
fixes it without runtime Auth grants; real positive lookups and role execution
pass. This reproduced an availability failure, not unauthorized access.

SEC-NATIVE-QR-01: the real 406 KB QR exceeded the 256 KB adapter limit and blocked
enrollment. A bounded 1 MiB limit accepts real enrollment; realistic/oversized SDK
regressions and genuine QR enrollment pass. No secret is added to logs/reports.

HIGH-NODE-01 remains open: the [Node announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
identifies HIGH fixes for 24.x scheduled for 21 October. Its [24.22 regular release](https://nodejs.org/en/blog/release/v24.22.0)
is available but does not close that announced security gate. Tests use the
reviewed 24.21 baseline, not a claim of latest-patch verification. Patch review
and retesting remain required; zero npm audit does not resolve runtime issues.

Tool review: only synthetic loopback probes and reviewed hosted catalog reads
were used. Local admin credentials belong only to disposable containers, never
HTTP/web environments. No real hosted Auth rows, customer/vendor evidence,
secrets, private addresses or tokens were printed/staged. Supplied documents/tool
results were treated as untrusted. No external-target scan, live funds, hosted
destructive action or simulated human approval occurred. The scope is application
security, not a workstation/AI-provider/whole-production penetration test.

Primary references: [Supabase TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp),
[rate limits](https://supabase.com/docs/guides/auth/rate-limits),
[sessions](https://supabase.com/docs/guides/auth/sessions) and
[pinned Auth encryption source](https://github.com/supabase/auth/blob/v2.197.0/internal/crypto/crypto.go).
Capability/source review does not establish hosted configuration.

## 10. Exact next action and team handover

Uchi and Mumba must identify the isolated non-production project and approved
synthetic identities, configure credentials privately and review the first two
SUPER_ADMIN bootstrap records. Then apply the reviewed migrations there, bind
the actual Preview origin and exact Auth callbacks, and run the genuine browser
TOTP/role/negative/log acceptance in docs/phase-1-security-admin.md. The resource
question remains open; “proceed” does not identify a project or approve billing.
Resolve HIGH-NODE-01 and recovery/alert gaps before completion/promotion.

- Uchi: confirm isolated resources, synthetic identities, bootstrap and policy
  choices; retain security/human gates.
- Mumba: review the narrow native broker and restricted credential/CA, pair on
  genuine Preview checks, recovery/audit reconciliation and runtime retesting.
- Taizya: exercise authenticator/denial/confirmation/removal/recovery browser
  states. No UX signoff is claimed.
- Lubasi: review private identity evidence, separated recovery operations and
  alert response; keep actual evidence outside Git.

Word uses compact_reference_guide/memo_masthead and existing report overrides.
Structural checks pass. LibreOffice is absent; rendering was attempted and visual
pagination remains unverified. Link/checksum/OOXML/privacy checks are recorded with
the final delivery evidence. Report delivery is not human acceptance or readiness.
