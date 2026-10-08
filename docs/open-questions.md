# Virtual Ink open questions and decisions

Unanswered entries remain **Open**. No commercial, legal, hosting or launch facts below are confirmed. Uchi coordinates resolution; Mumba owns technical proposals, Taizya owns design proposals, and Lubasi owns operational evidence. Open questions block only the work that depends on them. The latest build brief supplies the software direction, role names, approved assets and UI palette; these do not settle business rules.

Record each answer as: `ID | status (Open / Proposed / Confirmed / Deferred) | decision | decision owner | reviewer | date | evidence reference | affected task IDs | next action`. Use approved private evidence references for sensitive records. A proposed answer is not confirmation. Preserve decision history when an answer changes.

## Business ownership

- **BQ-01 — Uchi:** Who legally owns and operates Virtual Ink, and who is authorized to approve agreements, platform administration and release decisions?
- **BQ-02 — Uchi with Mumba:** What is a tenant: vendor organization, customer organization or another boundary? Can users belong to multiple tenants? Who may administer a tenant and how is platform support access authorized and audited?
- **BQ-03 — Uchi:** Git remote is configured at `https://github.com/URUUDEV/Virtual-Ink.git`. Who has access, who may merge/release, and where will the canonical board live?
- **BQ-04 — Uchi with Mumba:** What may a guest do, and how would a guest lookup/draft capability be limited and later attached to a verified customer? No guest private access is enabled.

## Launch area

- **LA-01 — Uchi with Lubasi:** Which launch country, city or area and initial user groups are approved? What constitutes a launch-ready pilot?
- **LA-02 — Lubasi:** Which currencies, languages, hours and time zones are operationally required? Confirm with evidence.

## Vendor list

- **VL-01 — Lubasi:** Which vendors have actually been identified and authorized for discovery? Where is their verified evidence stored privately?
- **VL-02 — Lubasi with Uchi:** What checks, agreements, service capabilities and account permissions are required before vendor onboarding?

## Pricing and commission

- **PC-01 — Lubasi with Uchi:** What verified catalogue, price units, currencies and effective dates apply? Who may change prices and approve revisions?
- **PC-02 — Uchi:** Are commissions, minimums, discounts or fees applicable? What approved rules govern them?
- **PC-03 — Uchi:** Which tax obligations require qualified advice, and who approves the resulting product rules? No tax formula is assumed.
- **PC-04 — Mumba with Uchi:** How should server-generated quotes expire and retain the accepted price version? Are pages, copies, paper, finishing and delivery relevant inputs?

## Delivery zones

- **DZ-01 — Lubasi:** What delivery or collection areas, boundaries, eligibility rules and service hours are verified?
- **DZ-02 — Lubasi with Uchi:** Who performs delivery, what evidence confirms an arrangement, and how are failed delivery and collection handled?
- **DZ-03 — Taizya with Lubasi:** Which address fields and customer-visible status updates are required? Live delivery tracking is outside Phase 1.

## Payment method

- **PM-01 — Uchi with Lubasi:** Which payment methods may eventually be accepted, and who confirms settlement?
- **PM-02 — Lubasi with Mumba:** What evidence, verification permissions, duplicate handling and reconciliation rules are required? Keep payment evidence private.
- **PM-03 — Uchi:** What approval process governs refunds or reversals? No real payment integration is authorized by Phase 1.

## Hosting budget

- **HB-01 — Uchi with Mumba:** What recurring budget, billing owner, region and environment count are approved?
- **HB-02 — Mumba:** The current brief specifies a Next.js/React TypeScript direction, PostgreSQL, private object storage and background jobs. The source foundation follows this direction. Which identity provider, runtime database adapter, private S3-compatible provider and hosting are approved? Frontend dependency resolution/build verification is still pending.
- **HB-03 — Mumba with Uchi:** What backup recovery objectives, retention, monitoring, secrets management and release controls are required?
- **HB-04 — Confirmed development direction by Uchi:** Supabase free tier ($0/month), new Virtual Ink project `odgxcuwueessxfsoveza` in `eu-west-1`, created in URUUDEV's Org. Hosted Phase 2 schema and rollback security tests are delivered. Restricted runtime login, genuine Auth smoke test, operating/billing owner and production budget still need review.
- **HB-05 — Uchi with Mumba:** Does a future owned-database move retain Supabase Auth/Storage, replace those adapters, or self-host the whole Supabase stack? What downtime, rollback window and operating responsibilities are acceptable? See [migration plan](supabase-migration-plan.md).

## Printer details

- **PR-01 — Lubasi:** What verified printer capabilities, formats, sizes, finishing options, limits and turnaround constraints are needed for discovery?
- **PR-02 — Mumba with Lubasi:** What file validation and human vendor workflow will eventually be required? Automatic printer control is outside Phase 1.

## Brand assets

- **BA-01 — Confirmed by supplied brief:** Use `asssets/Virtual Ink Gradient Logo.png` unchanged, Poppins and the specified palette. The supplied reference boards are design concepts; depicted prices/vendor claims are not commercial approval. Are separate brand-use rights or production-specific assets needed before launch?
- **BA-02 — Taizya:** What accessibility target and component review evidence are agreed? Actual 3D models and individual approved product mockups are not supplied; use labelled 2D/text fallbacks for future work.

## Pricing rules

- **PRICE-01 — Uchi with Lubasi:** Resolve PC-01/PC-03/PC-04 before a quote engine: units, rounding, option/quantity rules, currency, effective date and expiry. ZMW is requested as the UI display default; real vendor currency and prices still require verification. No live price formula or sample commercial seed is created.

## Commission model

- **COM-01 — Uchi:** Resolve PC-02 with approved rate/basis, responsibility, adjustments, effective dates and reconciliation rules. No commission default is assumed.

## Payment verification method

- **VERIFY-01 — Uchi with Lubasi and Mumba:** Resolve PM-01/PM-02/PM-03: authorized verifier, private evidence, duplicates, settlement/reconciliation and refunds. UI method names do not imply an integration or successful payment.

## File retention policy

- **FILE-01 — Uchi with Mumba:** How long are source files, proofs, final digital work, quarantine objects and backups retained? What initiates deletion, and who may request or delay it?
- **FILE-02 — Mumba with Uchi:** Which formats/sizes are allowed, who operates scanning/quarantine, what storage region/bucket protections are required, and how short-lived grants and access audits work? No upload endpoint can open before these rules and permissions exist.

## Support responsibilities

- **SUP-01 — Uchi with Lubasi:** Who owns intake, vendor disputes, reprint/refund escalation, delivery exceptions and operating hours? No response-time promises are assumed.
- **SUP-02 — Uchi with Mumba:** Which operators may access private files/proofs for a specific case, what approval is required and what durable audit evidence must be recorded? DeliveryPartner must never receive file/proof access.

## Legal and policy requirements

- **LP-01 — Uchi:** Which jurisdictions, qualified advisers and approval owners govern terms, privacy, vendor agreements, consumer rights and tax decisions?
- **LP-02 — Uchi with Lubasi:** What refund/reprint, cancellation, dispute and support policies are approved?
- **LP-03 — Mumba with Uchi:** What data classifications, file retention/deletion, permitted access, audit retention, incident response and data location requirements apply?
- **LP-04 — Uchi with Taizya:** Which consent, policy acknowledgement and accessibility requirements affect user flows?

## Dependency guidance

### 2026-10-09 implementation defaults — Proposed

| ID | Restrictive default implemented | Owner / review |
| --- | --- | --- |
| BQ-02 | Vendor organisations are tenants; memberships can span vendors; only own selected active scope is visible | Uchi with Mumba; acknowledgement pending |
| BQ-04 | Guests and anonymous Auth users receive no private capability | Uchi; expanded guest flow remains open |
| ROLE-01 | DeliveryPartner denies vendor/file/proof access even with other memberships | Uchi with Lubasi; mixed-role semantics pending |
| AUDIT-01 | Durable allowed tenant-read events exist; denial-event storage and retention still open | Uchi with Mumba |
| AUTH-01 | Auth-server verification is delivered; immediate logout/session revocation needs a separate adapter before sensitive workflows | Mumba with Uchi |
| REPORT-01 | Every completed build slice includes dated Markdown and Word reports | Confirmed user instruction, 2026-10-09; all leads |

These defaults grant no commercial capability and no user is automatically
provisioned. They are a reviewable engineering slice, not business signoff.

Local health/config/test work and review templates can proceed while these questions are open. Tenant persistence and authorization need BQ-02 and HB-02. Vendor onboarding needs VL-01/VL-02. Quotes need PC-01 through PC-04. Delivery workflows need LA-01 and DZ-01/DZ-02. Payment workflows need PM-01 through PM-03 and policy approval. Public launch needs the applicable legal/policy decisions and hosting review.
