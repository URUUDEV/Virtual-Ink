# Hotprints-first printing rollout and manual-payment scope

28 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Product direction recorded; pilot is not live. Phase 1 remains INCOMPLETE.**
Uchi directs the initial rollout toward school-serving individual vendors and
outside print shops, starting with Hotprints for printing/design. Vendors set
service prices and agree to Virtual Ink's commission and terms. Payments start
manually while a working gateway is developed.

## What changed

[The pilot scope](../hotprints-manual-pilot.md) defines the first operational
journey, commercial controls, remaining decisions and ordered implementation
slices. Hotprints is user-supplied; no contact, price, account, acceptance or
operating evidence is invented. Individual vendors and shops reuse scoped vendor
ownership rather than acquiring new platform authority.

The current release gate now supports manual-only payment acceptance. A gateway
and signed webhooks are deferred while gateway integration stays disabled.
Manual receipt verification, reconciliation, duplicate/retry controls, separate
commission/vendor settlement, authorization and audit remain required. Gateway
webhook/signature/replay checks apply before later gateway enablement. No checklist
item is marked passed, no existing failed check is relabelled, and the security,
private-file, physical-device, Vercel, rollback and release-authorization gates
remain in force.

The closure checklist, role handover, staging authority note, order workflow
setup, task board, open questions and README point to the updated operating scope.
Historical reports remain unchanged. The existing protected static public UI
candidate is separate from a working authenticated transaction pilot; its pending
hosting verification is not resolved by this scope decision.

## Existing implementation and missing work

Source inspection finds assigned-vendor quote proposals/review/acceptance and a
restricted payment.confirm command. SQL owns the accepted amount/currency and
state transitions; manual confirmation requires current privileged authorization,
MFA and an evidence reference. These are reusable local foundations, not proof
of bank receipt, complete manual reconciliation or hosted operation.

Vendor-managed rate cards, accepted commission/terms versions, commission
calculation and separate payment/settlement balances are not supplied by those
commands. They still require implementation. The plan requires server-owned
totals, immutable accepted order economics, current scoped vendor access and
durable acceptance; missing policy must not silently become zero commission.
No pricing/payment authority is added to a browser or public static build.

The next commercial slice is durable vendor pricing and agreement acceptance,
followed by manual collection/reconciliation and one complete Hotprints order
journey. Hosted identity/current MFA and private-file prerequisites remain on the
critical path. Invitations to additional vendors follow the first accepted journey.
No launch date, live order intake or sensitive enablement is claimed.

## Open product decisions

Uchi must choose the commission amount/type, calculation basis/rounding and
whether it is deducted from vendor proceeds or added to the customer total.
The customer payment recipient must be chosen between Virtual Ink and Hotprints,
with approved methods, reviewer, commission collection and vendor settlement
rules. These questions were raised while independent scope work continued.

Uchi/Lubasi and Hotprints still confirm the actual services, rate card, capability,
turnaround, handoff, refund/reprint, retention and versioned commercial terms.
Recording the desired consent flow is not the vendor's acceptance or legal review.
Private settlement/contact/verification details must stay out of Git and reports.

## Verification and scoped security review

This is a documentation and acceptance-scope change. No application source,
dependency, database migration, service flag, Auth user, storage policy, gateway,
DNS or hosted deployment is changed. Full application, SQL/browser and genuine
hosted suites are not rerun; no new coverage percentage is claimed. The previous
52-file backend/shared unit evidence remains dated in the preceding report and
does not cover these product decisions or complete the pilot.

Review focuses on the changed payment trust boundary. A customer or vendor who
can submit a payment claim must not turn it into authoritative paid state. The
plan requires actual receipt reconciliation by a scoped current-MFA reviewer,
duplicate/idempotency controls and atomic audit. Commission cannot be silently
waived by missing settings or vendor-edited platform fees. Existing accepted
orders retain their price/fee/terms versions when future prices change. These
are required implementation/acceptance controls; new attack reproductions or
implemented fixes are not claimed by this document-only step.

Tools only read existing source and edit the relevant working-tree documents.
Their output is treated as data, with no secret output, customer files, live funds,
messages to vendors or simulated human approval. Windows process-start failures
are retried through approved read-only execution and do not establish a defect
in the application. Content/link/privacy, repository and Word checks are recorded
in the delivery evidence after execution.

## Team next actions

- Uchi: decide commission structure and payment recipient; approve the actual
  operating/terms versions and the eventual evidence-backed pilot release.
- Mumba with Uchi: implement durable vendor pricing/acceptance as the next
  reviewed slice; retain current authorization, immutable quotes and audit rules.
  Continue isolated hosted identity/MFA and private transport acceptance.
- Taizya: specify individual-vendor/shop onboarding, price controls, fee/terms
  review, complete customer quote and clear unverified/manual-payment states.
- Lubasi: agree actual Hotprints capabilities, prices, turnaround, handoff,
  receipt-review ownership, settlement, refund/reprint and retention operations.

The rollout direction is confirmed by Uchi's message. Actual vendor agreement,
commercial values, human testing, product acceptance and live release remain open.

## Delivery evidence

New document links, sensitive-data heuristics, retained unchecked release gates
and Word evidence-content checks pass. Repository heuristics pass on 500 files
with 138 exclusions and zero findings; whitespace checks pass. These are scoped
document/repository checks, not application, financial or hosted acceptance.

The matching Word document passes the existing generator's OOXML/package/style/
table structural audit. Rendering is attempted and exits 1 with WinError 2:
LibreOffice is missing. Pagination and visual Word QA are not claimed.
The existing compact_reference_guide preset and memo_masthead conventions are
preserved. This handover is prepared from source 6bc43d8 on the existing
feature/phase1-staging-readiness review branch; no deployment is performed.
