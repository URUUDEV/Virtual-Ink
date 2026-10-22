# Phase 1 MFA and privileged-role administration

21 October [order-dashboard enforcement](reports/2026-10-21-order-dashboards-launch-gates.md)
passes 227 genuine local checks: the prior 220 plus seven dashboard ownership,
admin AAL1/AAL2/app-proof and native revocation checks. The exact migration 16 hash
is recorded. General oversight is ADMIN/SUPER_ADMIN only; narrower financial/security
roles gain no implicit access. Managed-cloud/browser/email/manual-secret/customer
MFA UX, recovery and full-service acceptance are still unaccepted or incomplete.

21 October [workflow/runtime follow-up](reports/2026-10-21-backend-workflows-runtime.md):
genuine local Auth now passes 220 checks, including 13 workflow identity/MFA/session
checks against the exact fifteenth local migration. The original factor/hook tests
remain included. Node 24.22.1 resolves the reviewed local runtime baseline.
Managed acceptance remains Free, hook/security disabled and at fourteen migrations;
no users, runtime logins or hosted Auth changes were created. Compatible hosted
target, browser/email/physical MFA, recovery and full-service Preview stay open.

16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge. Status: PARTIAL.
This review branch implements the provider-backed paths. Genuine local Auth
engine checks pass; managed-cloud/browser and isolated Preview acceptance remain
pending. Production enablement is rejected.

The [provider MFA guard follow-up](reports/2026-10-16-provider-mfa-guard.md) adds
the thirteenth migration: a native verification hook, required provider receipt,
provider-direct rate/alert controls and repaired administrative read queries.
Managed Supabase currently offers this verification hook on Teams/Enterprise;
an isolated compatible managed or authorized self-hosted target is required.
The current web adapter restricts managed project URLs and publishable keys.
Self-hosted deployment also needs an explicit URL/key adapter review; the local
test transport rewrite is not a hosted adapter.

## Trusted paths

After primary login, the account page checks current server-owned assignments.
Administrators enter /admin/security, which verifies Auth again and loads current
factors and assurance. The screen prompts enrollment when no verified TOTP exists.
The server uses Supabase mfa.enroll, challenge and verify; QR data is shown only
in memory and never persisted in browser storage or application tables. The SDK's
upgraded session is committed through HttpOnly Secure SameSite=Lax cookies only
after the required audit succeeds. Browser responses contain fixed states and
audit references, never access/refresh tokens or the separate enrollment secret.
The QR itself necessarily carries the enrollment secret and must remain private.

Every API request verifies the user online, verifies the same token's claims,
binds issuer/subject/session and calls the database's current provider-session
guard. Sensitive actions require token and live session AAL2, a verified same-user
TOTP factor, matching server AMR and password/TOTP verification within five minutes.
The live provider guard also requires an enabled matching-environment native hook
and a reservation for the same user/factor within ten seconds before the native
MFA AMR. Old AAL2 sessions without this evidence deny sensitive access. The native
reservation is an intent, not a substitute for the verified native session.
A later verification of the same factor supersedes earlier receipts; older
privileged sessions can therefore need another step-up.
It also requires a server-signed application step-up cookie issued only after this
application verifies a genuine challenge. The HttpOnly Secure SameSite=Strict
cookie binds issuer, user, session and password/TOTP times; it expires within five
minutes. It denies a direct provider token alone without application verification.
The live provider checks remain mandatory; the cookie alone cannot
authorize an action. Reauthentication and factor/password/logout changes clear it.
This is a conservative implementation window, not human policy signoff. Existing
administrator password-update and logout routes use the new boundary when enabled.
Ordinary account recovery does not acquire administrative authority.

MFA operations reserve a durable account/operation budget before provider work:
five enrollment/verification/reauthentication attempts per fixed five-minute
bucket; ten challenge/factor-management attempts. Provider limits apply separately.
Verification reserves an HMAC fingerprint for five minutes, blocking reuse across
new challenges and sessions without storing codes. The 32-byte private key must
remain stable across instances. Provider failures and repeated failures create
redacted security events; repeated failures and factor changes generate in-app
alerts. No external notification delivery is configured or claimed.

The native provider hook covers direct provider calls too. It accepts only the
provider database identity, runs with invoker rights and serializes attempts by
account. Five consumed attempts are permitted within a sliding five-minute window;
rate-blocked retries do not extend it. After native success it rejects every valid
verification for that factor for ninety seconds. This covers the provider's full
30-second TOTP period plus one period of skew in each direction without receiving
codes or secrets. A new valid code during the cooldown is also rejected. Existing
native challenge history covers successes before hook activation. Native intent,
invalid, cooldown and rate events appear in the existing restricted audit view.
Missing configuration or failed native audit writes fail closed. Recovery and
provider-direct factor-change audit ingestion remain separate pending gates.

An unfinished unverified TOTP factor can be discarded after recent primary login.
Verified-factor removal requires recent MFA and another verified factor. There
is no support-staff MFA bypass or HTTP administrator factor-reset credential.
Additional verified-factor enrollment is deliberately not exposed by this review
flow. Recovery requests require two distinct current SUPER_ADMIN approvals and
private identity review. Actual provider-side recovery execution is an operator
process still awaiting acceptance; an approval never automatically removes MFA.
The application does not offer recovery codes.

## Privileged role changes

The eight original roles remain, with four distinct specialist roles added:
SECURITY_ADMIN, FINANCE_ADMIN, DISPUTE_REVIEWER and PAYOUT_APPROVER. Their names do
not grant unrelated order/file rights. ADMIN and SUPER_ADMIN are reused.
There is still one active assignment per user. Changes replace the assignment;
removal restores CUSTOMER. A grant's optional expiry is immutable and at most
30 days; SUPER_ADMIN cannot expire automatically. Expiry removes authority at
the next action even if a browser still displays an old screen.

POST /api/security/request accepts only target, expected assignment, requested
role, reason and optional expiry. Actor identity and authority come from verified
server state. A current SUPER_ADMIN creates the request; another current
SUPER_ADMIN, distinct from target/requester, approves it; requester or approver
executes it within fifteen minutes. All stages recheck current authority. Self
changes and ADMIN promotion are denied. Removing a SUPER_ADMIN through this
separated workflow requires enough distinct administrators; the last active
SUPER_ADMIN is guarded. No bootstrap account is seeded.

The private virtual_ink_security.command function is the only runtime write
boundary. The service group receives EXECUTE, not table DML or owner membership.
Its separate NOLOGIN/NOBYPASSRLS function owner has narrow table/column rights and
explicit forced-RLS policies. anon, authenticated, service_role and existing API,
provisioner and vendor groups receive no new security rights. A global transaction
advisory lock serializes decisions; non-READ-COMMITTED transactions are rejected.
Expected-assignment checks prevent stale overwrites. Failed mutations roll back
inside a subtransaction and leave a separate failure event.

Execution revokes the old assignment, inserts the new grant and matching required
transaction audits, and deletes affected provider sessions in the same database
transaction. Any failure rolls the whole change back. Every later protected
action reads current roles and session evidence; no JWT role cache is trusted.
Events record target, before/after roles, requester/approver/executor, reason,
timestamp, correlation ID, assurance, fixed source, expiry, outcome and redacted
metadata. Events are append-only, including against ordinary administrator roles.
Migration owners remain an administrative trust boundary.

Native provider Auth tables have RLS without application policies. A private,
fixed-search-path SECURITY DEFINER broker owned by the existing migration
administrator returns only a subject/session-bound verification boolean or
deletes one approved target's sessions. Only the restricted business function
owner can execute it; the runtime service cannot call the broker directly. It
checks the calling session's service membership. No Auth table grant, policy
change, ownership, BYPASSRLS or elevated credential is given to the runtime.
Read-only hosted metadata confirms the migration administrator's existing native
rights; applying and verifying this adapter on isolated Preview remains pending.

Vendor verification, suspension, refunds, releases and payout-account mutations
are not implemented by this task. The shared guard rejects them without fresh
assurance; its HTTP check returns unavailable/not-found rather than executing an
unbuilt operation. No escrow, blockchain or additional marketplace work is added.

## Isolated Preview setup and recovery process

1. Use the separate acceptance inventory in [hosted acceptance](hosted-acceptance.md).
   Staging `trlhbsgxcsgvfyxezayb` has fourteen applied migrations, but its Free
   plan lacks the native MFA hook; runtime logins and Auth/admin remain disabled.
   The original project remains excluded. Approved synthetic identities and
   compatible hook hosting are still prerequisites; do not infer billing approval.
2. Review all fourteen migrations on that isolated target. Versions 20261016043927,
   20261016053031, 20261016122143 and 20261016173857 remain unapplied on original
   Production; all fourteen are already applied to the isolated staging project.
   Do not reapply or edit applied files. The thirteenth combines provider-mfa-guard.sql,
   security-audit-reads.sql and provider-mfa-session.sql; the fourteenth is
   authenticator-replacement.sql. Earlier migrations are unchanged.
   Never apply the disposable database/tests/security-auth-fixture.sql to Supabase.
3. Privately configure a restricted non-owner login with only membership in
   virtual_ink_security_service, verified CA and timeouts. Do not give the web app
   a migration, postgres, service-role or Auth-admin credential. Source migration
   creates no LOGIN/password and grants no service group to existing logins.
4. Independently review the first two SUPER_ADMIN identities and bootstrap/audit
   records through the controlled migration-owner process. Neither arbitrary UUIDs
   nor synthetic fixtures establish human approval. Keep that evidence private.
5. Set the DB-owned configuration marker to the isolated issuer, environment
   preview and enabled=true only for reviewed synthetic acceptance. The runtime
   independently requires matching SECURITY_PROJECT_URL and rejects Production
   VERCEL_ENV, the known shared project and environment/issuer mismatches.
6. Use the disabled example at examples/security-admin/security.env.example.
   Configure APP_ORIGIN to the actual Preview origin and allow exactly its
   /auth/callback and /auth/recovery-callback URLs in the isolated provider.
   Keep every credential server-only and out of chat/Git/reports. Confirm provider
   TOTP enrollment/verification, effective limits, encryption and session policy
   privately; code cannot establish those hosted settings by assertion.
7. Run the real primary-login, enrollment/QR/challenge/verification/AAL2 journey
   and all requested negative tests with synthetic accounts. Verify invalid,
   expired and replayed codes against the actual provider, cookie/header controls,
   role grant/removal, immediate denial, provider audit events and redacted logs.
   Test browser behavior and the Preview resource boundary without bypassing
   deployment protection or modifying production roles.
   First configure the native MFA Verification Attempt hook to
   pg-functions://postgres/virtual_ink_auth_guard/mfa_verification_attempt. Use
   examples/security-admin/provider-auth-hook.env.example only for a dedicated
   Auth service, never web environments. Privately set the new DB settings row
   to enabled=true and the matching preview environment. Confirm managed plan
   availability or the authorized self-hosted target; no billing is approved by
   this template. Existing AAL2 administrators must wait for the ninety-second
   interval and perform a fresh application challenge. Verify a successful
   protected lookup and missing-receipt/disabled-hook denials before enablement.
8. For lost-factor recovery, record the authenticated recovery request and two
   distinct recent-MFA SUPER_ADMIN approvals. Complete private identity review;
   an authorized provider operator performs recovery using the provider's genuine
   administration process. Correlate its provider audit with the application
   request; revoke affected sessions and require fresh enrollment. Support staff
   cannot execute this through the application. This operator step is unverified.
9. Reconcile any provider operation with an attempt event but no result. External
   Auth HTTP changes cannot be rolled back with the application's audit database.
   Pending operations must not be treated as successful acceptance.
10. Resolve the HIGH Node advisory, patch/retest and complete the Vercel/human
    gates before promotion. A Ready source build is not MFA or phase completion.

## Verification scope

Working-device replacement uses the separate `replace-enroll` action. Sign in
with the primary factor, complete a recent native/application MFA challenge,
review replacement enrollment, scan and verify the new QR, then explicitly review
removal of the old factor. Enrollment never removes the existing verified factor.
Only then can removal proceed; a single verified factor cannot be removed through
the application. Distinct provider friendly names avoid collisions. This is not
lost-device recovery, which retains the private dual-approval process above.

Factor removal obtains a durable subject-scoped reservation before checking the
provider and issuing a removal. The reservation spans application instances and
does not expire automatically. A matching successful provider completion releases
it; a failure before any provider removal was attempted also releases it. A
timeout, crash, uncertain provider outcome or failed result audit leaves it held.
Repeated requests cannot release a different operation. Such a conflict requires
private reconciliation, not repeated retries or an ordinary administrator override.
The restricted table records subject, factor/session/correlation identifiers and
time. The audit carries factor ID and whether a failed removal contacted the
provider; no code or secret is retained.

For an abandoned reservation, an authorized database/provider operator must use
the existing controlled recovery review: record the private authorization and
reason; stop affected removal traffic/workers; verify the provider's final state
and that no operation can still finish; revoke affected sessions; append a
redacted `mfa.removal.reconcile` event with the original correlation, operator
reference and reason; and remove only that exact reservation in the same
transaction. No HTTP command, automatic expiry or support-staff bypass is added.
This manual process remains unexecuted in hosted acceptance. Direct-provider
factor changes still require provider audit ingestion/reconciliation; application
serialization does not control an independent provider administration API.

Baseline evidence includes complete root/security suites, the 38-file 95% coverage
gate, real SDK requests with synthetic HTTP, React SSR checks, strict types/build,
twelve fresh PostgreSQL migrations, six legacy SQL suites and the actual restricted
security command probes. The browser-artifact scan prints finding categories only.
It does not prove deployed logs or managed-cloud encryption settings. The opt-in
`npm run check:security:auth:local` starts digest-pinned real Supabase Auth 2.197.0
and PostgreSQL 18 containers on loopback, uses synthetic identities and the actual
application gateway/private command, and removes only its labelled containers,
volumes and network. Docker must already be available; ports 55391/55392 must be
free. Private generated credentials stay in ignored .private files. No hosted
project is contacted. All 87 baseline checks pass, including encryption envelope/decryption,
primary login, QR enrollment, valid/invalid/expired/replayed codes, rate limits,
separated role approval, expiry, removal/session revocation, audits and log scan.
The unhooked provider accepts cross-challenge code reuse. The new native hook
rejects provider-direct reuse and concurrency; deployment and managed acceptance
of that hook remain incomplete. Both native receipt and signed application proof
are required for sensitive actions. See the follow-up for final measured counts.
This test does not scan a QR with a physical authenticator, exercise browser/TLS,
deliver email, simulate human approval or establish Vercel acceptance. See the
[inspection](reports/2026-10-16-mfa-privileged-gap-report.md) and
[implementation evidence](reports/2026-10-16-mfa-privileged-security.md).
