# Explicit Free-plan MFA compensation

29 October 2026. Uchi and Mumba. Phase 1 remains INCOMPLETE / NO-GO.

This is the application compensation permitted by the 22 October staging
instruction. It does not emulate the paid native MFA Verification Attempt Hook.
The database policy defaults to `provider_hook`; the new `application_receipt`
policy is an explicit private operator choice. No environment or client field
selects it. Hosted services and this policy remain disabled/unselected.

## Verification boundary

The existing gateway first commits a subject-bound attempt and code-fingerprint
reservation. The actual provider verifies TOTP; the server checks the resulting
identity and prepares its signed session-bound step-up cookie. The new command
wrapper commits an application receipt with the successful immutable audit only
after checking native Auth user/session, verified factor and matching current
TOTP AMR, plus the preceding matching attempt. An insert failure rolls back the
success and receipt. The separately committed attempt remains for reconciliation.
The Next handler releases pending session/step-up cookies only after success.

Protected decisions require the existing current role, signed application proof,
native AAL2/session/factor/AMR, recent primary password authentication and the
matching application receipt. Proof lifetime remains at most five minutes.
A later successful verification of the same factor supersedes older application
receipts, including receipts from other sessions. Identity, session, factor,
timestamps, correlation and successful audit must agree. A provider-direct AAL2
token or correctly signed cookie without its receipt is insufficient.

The existing account budget, durable HMAC replay reservations, immutable events,
failure alerts, last-factor protection, replacement/recovery rules and restricted
dual-approved role writes remain in the original command. The wrapper is the
sole runtime entrypoint. The renamed implementation and native-facts helper have
no browser/runtime EXECUTE permission. The receipt table has forced RLS and no
runtime access; its owner has only SELECT/INSERT, with update/delete/truncate
triggers rejecting mutation. Runtime roles cannot change the policy.

## Distinct guarantees and remaining risks

The paid policy retains native-hook enforcement before token issuance, including
provider-direct account cooldown/rate controls. The Free policy protects application
actions using application reservations and receipts. It does not claim that a
provider-direct request cannot obtain an AAL2 token or bypass the application's
attempt budget at the provider. Native IP controls, provider logs and operational
monitoring therefore remain separate requirements. The local multi-user fixture
raises only its shared-loopback IP budget; it does not verify hosted provider limits.

Existing durable alert events can be reviewed through restricted administrative
reads. External alert delivery, monitoring response and staffing are not established
by an event insert. Hosted rate settings and end-to-end monitoring/administrator
alert acceptance must pass before selecting this policy for a real pilot.

A separate real local Auth probe found that a rejecting Custom Access Token SQL
Hook rolls back its SQL audit insert. That hook is not used as a replacement
durable receipt or configured here. Native-hook receipts are never manufactured
by the application.

## Forward migration and validation

Portable source: database/phase1/free-mfa-compensation.sql.
The official CLI generated migration
20261029093317_virtual_ink_free_mfa_compensation.sql; its SQL matches the source.
Existing applied migration files are unchanged. A fresh non-superuser
CREATEROLE/BYPASSRLS replay of all twenty migrations and the existing SQL suites
passes. Hosted staging still has fourteen migrations; nothing is applied there.

Run `npm run check:security:auth:local` for the digest-pinned genuine local Auth
suite. It checks the paid policy after this migration, then restarts only its
labelled disposable Auth container with both native and custom-token hooks off
to exercise the explicit application policy. Accounts, factors and credentials
are synthetic and local. Source unit coverage does not measure SQL or provider
journeys. The [dated report](reports/2026-10-29-vendor-pilot-readiness.md) records
actual results, failures, exact coverage and hosted limitations.

## Hosted enablement and rollback

Keep the original production project untouched. Before any isolated enablement,
reconcile the fourteen hosted and twenty local migrations, rehearse their forward
application, verify private restricted logins/CA and service bindings, and obtain
working patched Vercel Preview request execution. Then test genuine hosted login,
TOTP, cookie/audit failure, direct-provider and cross-account denials, monitoring,
replacement/recovery and workflow access. Do not enable commerce or uploads from
this SQL result alone. No human acceptance is inferred from fixtures.

The database-owned policy can be returned to provider_hook by an authorized
private operator; Free receipts then cease to authorize protected actions. Without
the paid hook that deliberately denies those actions. Disable affected service
flags and use the documented deployment rollback alongside that private change.
Preserve audit/receipt history; do not delete rows, undo applied migrations or
lower the native runtime guard. No hosted rollback rehearsal is claimed.
