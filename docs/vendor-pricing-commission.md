# Vendor prices and direct-payment commission

28 October 2026. Owners: Uchi and Mumba. Local implementation; hosted acceptance
remains open. Phase 1 is INCOMPLETE.

31 October [manual receipt backend](manual-payment-reconciliation.md) adds exact
recipient/quote/amount reconciliation and unique immutable receipts to the existing
payment command. No commission collection or settlement is inferred. Actual
approval, private evidence, reviewer UI and hosted/device acceptance remain open.

## Commercial direction

Customers pay the individual vendor or shop directly, as Uchi confirmed on
28 October. The recommended starting commission is 5% of completed printing/design
service work, included in the vendor's quoted customer price, with no minimum or
additional customer fee. Reconcile commission weekly. This is a pilot proposal
for the real vendor agreement, not an automatically activated policy or accepted
contract. Check Hotprints' actual margins before agreeing its rate card.

For a synthetic ZMW 100 service order, the customer pays the vendor ZMW 100.
The completed order accrues ZMW 5 commission due to Virtual Ink. The vendor pays
that commission separately; the system must not call it collected merely because
the customer paid. Tax, delivery, refunds and non-service charges need approved
itemization/adjustment rules before being included in a real commercial journey.
The current quote model has one service amount; it does not implement separate
tax/delivery lines or refund adjustments.

The 5% proposal is a product recommendation rather than a market requirement.
For context, [Etsy lists a 6.5% transaction fee](https://help.etsy.com/hc/en-us/articles/360035902374-Etsy-Fee-Basics)
and [Fiverr pays sellers 80% of an order](https://help.fiverr.com/hc/en-us/articles/9234443621137-Your-earnings-page).
Those services and costs differ; neither establishes viable printing margins or
Virtual Ink's approved fee. A low, single pilot rate avoids per-order minimums
on small school-printing jobs. Review actual unit economics after pilot evidence;
never change existing accepted quote economics retroactively.

## Delivered slice

28 October follow-up: [vendor setup](vendor-setup.md) links approved owners into
this workspace and reads the current agreement and active price count through
the same audited owner-only command. It adds no commercial permission or activation.

- `/vendor/pricing` uses the existing verified server session and restricted
  database connection. Owners select their own vendor, inspect the actual approved
  agreement, accept its exact version/hash and add, revise or retire printing/design
  service prices. The assigned-order dashboard links to it.
- Price forms accept decimal ZMW; the server converts without floating-point
  currency arithmetic. A service price has a description, service, unit, amount,
  currency and immutable version. Supported units are page, copy, item, job and hour.
- Database authorization rechecks current identity/session, active VENDOR role,
  vendor ownership, active membership/tenant and current approved policy. Writes
  require recent MFA and the existing native/application step-up proof. Staff and
  platform administrators do not acquire vendor-owner price authority here.
- Agreement and price history are immutable. Changes use operation IDs, expected
  versions, durable rate limits and atomic audit. A policy rotation requires a
  new matching acceptance before future price changes/quotes. A replay of an old
  acceptance cannot restore current acceptance.
- When commercial mode is configured, quote insertion snapshots vendor, policy,
  amount/currency and server-calculated commission. Completion accrues that original
  fee once. Payment confirmation alone does not accrue or collect commission.
- Commission accrual is displayed separately from collection. No commission payment,
  weekly invoice dispatch, refund adjustment or collection enforcement is implemented
  by this slice. Existing manual receipt confirmation still needs the complete
  recipient/amount/reference/reconciliation interface and hosted acceptance.

The page fails closed when configuration or access is unavailable. It does not
invent vendor accounts, prices, an approved agreement, a zero fee or acceptance.
Terms are displayed as escaped text. Framework action metadata is ignored only
after bounded form admission; unexpected/duplicate financial fields are rejected.

## Database setup and enablement boundary

The CLI-created forward migration is
`20261028084431_vendor_commercial_terms.sql` (migration 19). Its matching portable
source is `database/vendor-commerce.sql`. Seven private tables have forced RLS,
immutable history and no direct browser/runtime table grants. Only the restricted
security-service group can execute the commercial command. Existing NOLOGIN roles
and service flags are preserved; no vendor, login or policy is seeded.

`virtual_ink_workflow.configuration.commercial_enabled` defaults false and
`commercial_policy_id` defaults null. Existing disabled legacy workflow fixtures
remain compatible. Commercial commands require workflow/security/commercial
configuration; the actual pilot must verify all three together. A legacy workflow
with commercial mode off is not acceptance of the commission pilot.

After the existing environment/identity/security gates pass, a reviewed private
operator must insert the actual approved, versioned policy text and its matching
SQL-computed SHA-256, direct_to_vendor collection and weekly settlement values.
The basis-point rate is explicit; missing policy never falls back to the source
proposal. Update the configuration pointer/enabled state under the existing
`pg_advisory_xact_lock(74016,1)` administration lock, using reviewed private
credentials. Do not grant policy/configuration DML to the web runtime or expose
these settings as vendor-editable fields. No such hosted setup has occurred.

Technical admission caps are 20 displayed owned vendors and 100 service-price
identities per vendor, each with bounded versions. These are implementation
bounds, not approved vendor capacity, commercial prices or product completion.

## Verification and remaining hosting work

Run the complete root coverage/security, web/SDK, lint and type checks on the
reviewed Node runtime. `scripts/replay-order-workflows.ps1` now replays all nineteen
migrations, six historical rollback suites, the existing security/workflow checks
and `scripts/vendor-commerce-db-check.mjs`. The new SQL journey covers two distinct
database vendor scopes, stale/forged acceptance, independent SQL input denials,
concurrency, audit outages and completed-order fee preservation. Its users, sessions,
scans and payment evidence are synthetic within a disposable loopback database.

Fresh staging reads still show fourteen applied migrations, security disabled and
unconfigured, a NOLOGIN security-service role, no scan-service role and zero storage
buckets at that inspection. The 29 October Free-plan compensation is implemented
locally but unaccepted hosted. Full-service Vercel
operation needs those prerequisites, restricted private credentials/TLS, genuine
vendor/customer accounts, private file ingress/worker/scanning, manual payment
reconciliation, approved commercial terms and real hosted/device release tests.
A protected UI-only deployment does not verify this transaction flow.
