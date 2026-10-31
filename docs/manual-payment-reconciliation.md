# Manual payment reconciliation

31 October 2026. Local backend review; hosted services and Phase 1 acceptance
remain incomplete. Customers pay the vendor directly. This implementation moves
no funds and does not collect platform commission.

## Confirmation contract

The existing `payment.confirm` command now requires an approved recipient ID,
receipt reference, exact amount in currency minor units, currency, a private
evidence reference and explicit `receiptChecked: true`. TypeScript and SQL both
validate those fields. There is no UUID-only fallback when commercial settings
are disabled. Missing configuration denies confirmation.

The database rechecks the current provider session, recent MFA/application proof,
active administrator/finance role and unexpired order-specific payment grant.
The reviewer cannot be the customer, vendor owner or anyone with a membership
record for that vendor, including an inactive membership. A receipt must match
the order's accepted quote, frozen commercial vendor/amount/currency and an
enabled approved recipient for that active vendor. Partial, excess, mismatched
and unsupported payments leave the order awaiting payment.

The reviewer must independently check actual receipt against the configured
recipient and private evidence before attesting. A customer statement, uploaded
screenshot, UUID or checkbox alone does not establish actual bank settlement.
This is a controlled manual record, not an independently verified bank feed.
Compromised or dishonest authorized reviewers remain an operational threat.

Receipt references accept ASCII letters, digits, spaces and hyphens. SQL removes
spaces/hyphens and folds case before hashing. A unique provider/reference key
prevents equivalent references paying multiple orders, even concurrently or
through different recipients. Confirm provider reference uniqueness and the
canonicalization rule before approving a real payment method; formats outside
these bounds require a reviewed extension. Store only the digest in the receipt,
not the raw transfer reference. Digests are not encryption or anonymization.

The immutable receipt binds order, accepted quote, recipient, verified amount,
currency, private evidence UUID, reviewer/session, time and the matching workflow
audit. Evidence UUIDs also cannot be reused. Its audit foreign key is deferred
until transaction commit; a missing audit cannot leave a paid order or receipt.
Exact operation retries return the original result after current authorization;
changed inputs, stale versions and conflicting retries fail. Customer payment
does not imply commission received or vendor settlement. Existing completion
accrual uses the original quote economics.

## Setup boundary

The CLI-created forward migration is
`20261030201408_manual_payment_reconciliation.sql`, matching
[portable SQL](../database/manual-payments.sql). Historical migrations are
unchanged. Both new tables have enabled/forced RLS and no browser or runtime
table grants. The reconciliation helper is callable only by its existing private
NOLOGIN workflow owner through the authorized command. It creates no alternative
HTTP route, browser RPC, login, vendor, approval or real recipient.

`manual_payments_enabled` defaults false. After genuine isolated identity/MFA,
private evidence/transport, operating and hosting acceptance, a reviewed private
operator must register the real approved recipient with its vendor, method,
provider code, canonical account digest, currency and approval reference. Account
digests must be computed privately from the agreed account representation. A
provider/account identity is unique, and recipient identity/history is immutable;
only the enable/disable marker can change. Do not store clear bank details,
addresses or private evidence in Git, reports or public environment variables.

The operator must use the existing administration transaction lock
`pg_advisory_xact_lock(74016,1)` when changing recipient enablement or workflow
configuration. Keep the actual approval/change evidence in private operations
records. Web/runtime roles cannot create recipients, change their approval or
enable either configuration flag. No hosted setup has occurred.

Confirmation requires both commercial and manual-payment settings, the current
security/workflow prerequisites and an accepted quote with frozen commercial
terms. Disabling a flag cannot restore legacy confirmation. Existing payment UUIDs
without matching receipts fail subsequent order updates; do not silently
grandfather old foundation fixtures. Preserve such records and review them
privately before any enablement. Already reconciled historical receipts remain
valid when a recipient is later disabled; disabling stops new confirmations.

## Verification and remaining work

Run the complete root coverage/security suites, lint, transport checks and
`scripts/replay-order-workflows.ps1` on the reviewed runtime. The latter replays
all migrations as a non-superuser managed-shaped administrator, preserves the
six historical rollback suites and runs security/workflow/commercial checks.
Receipt tests include direct SQL admission, wrong recipient/amount, disabled
policy, self-review, MFA/session denials, canonical duplicate/concurrent receipt
reuse, immutability, actual runtime permission denials and atomic audit outage.
All accounts, grants, agreements, receipts and scan metadata are synthetic
loopback fixtures; they are not vendor acceptance or genuine hosted banking.

The customer instruction screen, payment-report/reviewer interface, authenticated
private evidence ingress/download and genuine hosted/browser/device journeys
remain open. Commission collection/reconciliation, partial/excess handling,
refunds/reprints, actual provider/account approval and monitoring also remain
open. Do not enable the command as a substitute for those operating requirements.
The Vercel request-runtime blocker and existing release/rollback/authorization
gates remain in force. No deployed URL verifies this new SQL path yet.

References reviewed: [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html),
[transaction locking](https://www.postgresql.org/docs/current/explicit-locking.html),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [provider changelog](https://supabase.com/changelog).
