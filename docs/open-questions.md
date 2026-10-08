# Virtual Ink open questions and decisions

All entries start **Open**. No commercial, legal, hosting or launch facts below are confirmed. Uchi coordinates resolution; Mumba owns technical proposals, Taizya owns design proposals, and Lubasi owns operational evidence. Open questions block only the work that depends on them.

Record each answer as: `ID | status (Open / Proposed / Confirmed / Deferred) | decision | decision owner | reviewer | date | evidence reference | affected task IDs | next action`. Use approved private evidence references for sensitive records. A proposed answer is not confirmation. Preserve decision history when an answer changes.

## Business ownership

- **BQ-01 — Uchi:** Who legally owns and operates Virtual Ink, and who is authorized to approve agreements, platform administration and release decisions?
- **BQ-02 — Uchi with Mumba:** What is a tenant: vendor organization, customer organization or another boundary? Can users belong to multiple tenants? Who may administer a tenant and how is platform support access authorized and audited?
- **BQ-03 — Uchi:** Where will the canonical Git repository and board live, who has access, and who may merge or release?

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
- **HB-02 — Mumba:** Which application framework, database, identity provider, object storage and hosting meet the requirements? Node.js is currently only a local provisional baseline.
- **HB-03 — Mumba with Uchi:** What backup recovery objectives, retention, monitoring, secrets management and release controls are required?

## Printer details

- **PR-01 — Lubasi:** What verified printer capabilities, formats, sizes, finishing options, limits and turnaround constraints are needed for discovery?
- **PR-02 — Mumba with Lubasi:** What file validation and human vendor workflow will eventually be required? Automatic printer control is outside Phase 1.

## Brand assets

- **BA-01 — Taizya with Uchi:** Are there approved existing logo, type, color and copy assets, with permission to use them?
- **BA-02 — Taizya:** What text placeholder conventions and accessibility targets should the first flow use while assets are missing? Missing images do not block the foundation.

## Legal and policy requirements

- **LP-01 — Uchi:** Which jurisdictions, qualified advisers and approval owners govern terms, privacy, vendor agreements, consumer rights and tax decisions?
- **LP-02 — Uchi with Lubasi:** What refund/reprint, cancellation, dispute and support policies are approved?
- **LP-03 — Mumba with Uchi:** What data classifications, file retention/deletion, permitted access, audit retention, incident response and data location requirements apply?
- **LP-04 — Uchi with Taizya:** Which consent, policy acknowledgement and accessibility requirements affect user flows?

## Dependency guidance

Local health/config/test work and review templates can proceed while these questions are open. Tenant persistence and authorization need BQ-02 and HB-02. Vendor onboarding needs VL-01/VL-02. Quotes need PC-01 through PC-04. Delivery workflows need LA-01 and DZ-01/DZ-02. Payment workflows need PM-01 through PM-03 and policy approval. Public launch needs the applicable legal/policy decisions and hosting review.
