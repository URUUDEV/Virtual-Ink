# Hotprints and school printing pilot

28 October 2026. Product direction: Uchi Chinyama. Engineering: Uchi and Mumba.
Status: rollout scope recorded; commercial values and live acceptance pending.

## Confirmed direction

Start with Hotprints for printing and design. Support individual vendors serving
schools and print shops operating outside schools. Expand through reviewed vendor
onboarding after the first complete Hotprints journey works. Hotprints is supplied
by Uchi; this document does not create an account, approve its operational facts
or record acceptance of commercial terms on its behalf.

Vendors set their service prices. Virtual Ink proposes its commission schedule
and terms; a vendor must explicitly accept the applicable version before trading.
The commission amount, calculation basis and treatment remain unset. Vendors
cannot edit platform commission through their price controls. Individually agreed
exceptions need an authorized, recorded platform decision and vendor acceptance.

Payments are manual initially. An integrated payment gateway is deferred until
it works and is separately verified. This updates the immediate payment scope;
it does not waive identity, file privacy, pricing, payment reconciliation, security,
testing, hosted acceptance, rollback or explicit release authorization.

## Vendor onboarding and prices

Reuse the existing vendor identity, tenant, ownership and verification foundations.
Vendor category and operating context describe the business; they must not grant
new platform roles or access to another vendor. An individual vendor must have a
supported onboarding path without being represented as a registered print shop.
School-serving status must not imply school endorsement. The fields and screens
for those distinctions remain to be implemented and verified.

The first vendor setup records approved services and capabilities, service area,
availability, turnaround and collection/delivery options. Contact and settlement
details remain in protected configuration or approved private records. No addresses,
bank details or private verification evidence belong in Git or public reports.

Vendor price controls must identify service, unit, currency, applicable options,
effective version and whether an item requires a quotation. Printing and design
can be priced separately. Unsupported options and unapproved prices stay unavailable
or quotation-required. The system must not invent stock, prices, tax or delivery fees.

Before activation, show the vendor the platform commission calculation, who pays
it, settlement responsibility and applicable terms. Store the accepted terms and
fee-schedule versions with the verified actor and time. Price or policy changes
create a new version; required new acceptance applies to future business. Preserve
the agreed economics of already accepted orders.

The server calculates the customer total, platform commission and vendor amount
using validated currency minor units and an approved rounding rule. The browser
cannot supply authoritative totals, fee rates, acceptance or settlement status.
A missing fee policy or acceptance must block affected commercial actions rather
than silently become zero commission. Customer-visible charges need clear disclosure.

## Manual order and payment journey

1. A genuine customer supplies the print/design specification through the private
   order/file flow. Assign work only to a verified, eligible vendor.
2. Hotprints prices the work using its own permitted service prices or a scoped
   quotation. The server validates the applicable accepted commercial agreement.
3. The customer reviews the complete quote, turnaround and handoff. Acceptance
   freezes the specification, vendor, prices, fees, currency and terms versions.
4. Show approved manual-payment instructions for that order only after the actual
   recipient and method are configured. Do not publish placeholder account details.
5. A payment report remains unverified until an authorized reviewer checks actual
   receipt against the correct recipient, order, amount, currency and transaction
   reference. A customer claim, screenshot or vendor message alone cannot mark paid.
6. Record confirmation with current authorization/MFA, a private evidence reference,
   reviewer/time, idempotency and an atomic append-only audit. Prevent one transfer
   from paying unrelated orders. Handle partial, excess, duplicate, disputed and
   mismatched payments explicitly under an approved operating policy.
7. Keep customer payment, platform commission due/received and vendor settlement
   distinct. Direct vendor payment must not automatically mark commission received;
   platform collection must not automatically mark the vendor settled. The chosen
   collection/settlement model is a pending decision, not an implemented ledger.
8. Continue through accepted job, approved proof where required, production/QC,
   ready-for-collection/delivery and customer receipt. Preserve current state and
   file-access gates; manual payment does not permit production before verification.

The existing quote and payment.confirm commands are reusable local foundations.
They do not yet establish the complete price-list, commission/terms, bank-receipt
verification or reconciliation journey described here. No money moves through
the current command. Do not represent a private evidence UUID as independently
verified settlement.

## Work sequence

| Slice | Concrete result | Required evidence |
| --- | --- | --- |
| Existing hosting/security | Verify the public repair; establish isolated genuine Auth/current MFA and private-file transport | Exact deployed source, protected checks, current roles and denial cases |
| Vendor prices and agreement | Hotprints can manage its own services/prices and accept the configured platform terms/commission version | Durable ownership, policy/version, stale-acceptance and cross-vendor tests |
| Manual collection and reconciliation | Approved recipient instructions, reviewed payment records and separate commission/vendor balances | Wrong recipient/amount, duplicate reference, role/MFA, concurrent retry and audit-outage tests |
| Hotprints order journey | One synthetic customer order through quote, manual confirmation, fulfilment and receipt | Real hosted customer/vendor/admin journeys; private-file and proof denials |
| Controlled live pilot | Owner-approved operating limits and release/rollback evidence | Physical devices, no open critical/high findings and explicit release authorization |

Work on one reviewable slice at a time using forward migrations and existing
routes/roles. Reuse the accepted-order snapshot and transactional workflow;
do not replace the platform or alter unrelated studio/brand assets. Preserve
existing main/public hosting until the reviewed deployment step. Add invite-only
school-serving individuals and outside shops after Hotprints acceptance, reusing
the same scoped controls. Gateway integration remains a later payment slice.

This plan does not supply a launch date or close the full Phase 1 checklist.
The static public UI deployment is separate from a working transactional pilot.

## Decisions needed before affected implementation/enablement

- Uchi: commission percentage or fixed fee, calculation basis and rounding, and
  whether it is deducted from vendor proceeds or added to the customer total.
- Uchi: whether manual payment goes to Virtual Ink or directly to Hotprints;
  approved methods, verification owner and settlement/commission collection rules.
- Uchi/Lubasi with Hotprints: accepted services, rate card, capability/turnaround,
  handoff, refund/reprint and retention rules, plus the actual versioned terms.
- Uchi/Mumba/Taizya: pilot reviewers and operating limits, accessible workflows,
  current hosted security prerequisites and the evidence-backed release decision.

Keep the open decisions in [the register](open-questions.md). Apply the updated
manual-payment branch of [the release gate](phase-1-release-gate.md), with the
remaining [Phase 1 closure](phase-1-closure-checklist.md) and
[Vercel requirements](phase-completion-checklist.md) retained.
