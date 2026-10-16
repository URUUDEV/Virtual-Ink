# Phase 1 MFA and privileged-role administration

16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge. Status: PARTIAL.
This review branch implements the provider-backed paths; genuine provider and
isolated Preview acceptance are pending. Production enablement is rejected.

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

Vendor verification, suspension, refunds, releases and payout-account mutations
are not implemented by this task. The shared guard rejects them without fresh
assurance; its HTTP check returns unavailable/not-found rather than executing an
unbuilt operation. No escrow, blockchain or additional marketplace work is added.

## Isolated Preview setup and recovery process

1. Confirm a separate non-production Supabase target and approved synthetic
   identities. The visible active project is shared and has no development branch;
   this task does not create a billed resource or guess that it is isolated.
2. Review all twelve migrations on that isolated target. Versions 20261016043927
   and 20261016053031 remain unapplied on the visible hosted project. Portable
   security.sql and provider security-supabase.sql compose the latter migration.
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

Local evidence includes complete root/security suites, the 38-file 95% coverage
gate, real SDK requests with synthetic HTTP, React SSR checks, strict types/build,
twelve fresh PostgreSQL migrations, six legacy SQL suites and the actual restricted
security command probes. The browser-artifact scan prints finding categories only.
It does not prove deployed logs, genuine Auth or encryption settings. See the
[inspection](reports/2026-10-16-mfa-privileged-gap-report.md) and
[implementation evidence](reports/2026-10-16-mfa-privileged-security.md).
