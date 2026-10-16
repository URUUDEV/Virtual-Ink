# Virtual Ink open questions and decisions

- **SCOPE-P1-02 — Confirmed by Uchi, 16 October 2026:** Prioritize Phase 1 readiness
  and retain Phase 1 scope until traction. Continue the MVP closure checklist;
  future marketplace, escrow and blockchain work remains outside this task.
- **SEC-FACTOR-02 — Local implementation; hosted/operator review open:** Working
  authenticator replacement requires recent genuine MFA and preserves the old
  factor until the new one is verified. Application removals are serialized;
  uncertain provider outcomes retain a reservation for private reconciliation.
  Review the availability tradeoff and controlled reconciliation before enablement.
  See [evidence](reports/2026-10-16-authenticator-replacement.md).

Unanswered entries remain **Open**. Only entries explicitly recorded as Confirmed represent user decisions; other commercial, legal, hosting and launch facts remain unconfirmed. Uchi coordinates resolution; Uchi owns backend engineering and technical proposals, Taizya owns design proposals, and Lubasi owns operational evidence. Open questions block only the work that depends on them. The latest build brief supplies the software direction, role names, approved assets and UI palette; these do not settle business rules.

Record each answer as: `ID | status (Open / Proposed / Confirmed / Deferred) | decision | decision owner | reviewer | date | evidence reference | affected task IDs | next action`. Use approved private evidence references for sensitive records. A proposed answer is not confirmation. Preserve decision history when an answer changes.

## Business ownership

- **SEC-HOOK-PLAN-01 — Open; Uchi with Mumba:** Native MFA verification hooks are listed for managed Teams/Enterprise. Identify an isolated compatible managed project or an authorized self-hosted Auth target. A self-hosted option also needs explicit URL/key adapter work; the loopback test rewrite is not a deployed adapter. No plan change, billing or hosted mutation has occurred. The native implementation is locally verified; hosted acceptance remains open. See [follow-up](reports/2026-10-16-provider-mfa-guard.md).

- **SEC-REPLAY-01 — Open; Uchi with Mumba:** Real local Supabase Auth 2.197.0 accepts the same TOTP against different challenges in one time window. Application reservations block application-observed reuse and signed proof denies a provider token alone; provider-first code use is outside that ledger. Resolve provider-wide single-use enforcement and test it on the isolated target before COMPLETE. See [native evidence](reports/2026-10-16-mfa-privileged-security.md). Follow-up: 185 genuine checks now prove the native provider hook/receipt closes this path locally, including provider-first and concurrent attempts. Compatible hosted enablement/acceptance remains open.
- **SEC-PREVIEW-01 — Open; Uchi with Mumba:** Identify the isolated non-production Supabase project and approved synthetic identities for genuine MFA/privileged-role acceptance. Only the active shared project and no development branches are visible. Configure credentials privately; no billed branch is created or assumed approved. See [runbook](phase-1-security-admin.md).
- **SEC-RECOVERY-01 — Open; Uchi with Mumba and Lubasi:** Review the controlled bootstrap and operator recovery process, including the first two SUPER_ADMIN identities, two distinct MFA-backed recovery approvals, private identity evidence and provider audit correlation. The application cannot automatically disable the final verified factor. Genuine recovery is not accepted.
- **MFA-POLICY-02 — Implemented conservative proposal; Uchi review pending:** This review branch uses five-minute recent password/TOTP assurance, fifteen-minute change requests and at most thirty-day temporary privileges. SUPER_ADMIN does not expire automatically. These implement the requested controls, not human policy approval; MFA-POLICY-01 and ROLE-BOOT-01 remain open.

- **MFA-POLICY-01 — Open; Uchi with Mumba and Lubasi:** Approve the privileged-action freshness window, TOTP/recovery scope, effective provider inactivity/timebox policy and in-flight revocation behavior. The internal verifier requires an explicit 1–900 second technical window and has no enabled default; synthetic tests do not establish business approval or genuine provider MFA. See [prerequisite](phase-1-session-step-up.md).

- **ROLE-BOOT-01 — Open; Uchi with Mumba and Lubasi:** Confirm who approves the first SUPER_ADMIN, privileged role grant/revoke authority, reviewer evidence and recovery. The explicit role foundation seeds no account and enables no writer; approval references in synthetic tests are not real acceptance or MFA proof.

- **DEP-SVC-01 — Confirmed to proceed by Uchi, 2026-10-15:** Continue the proposed `app`/`web` service layout: public web catch-all, internal app, caller-owned web-to-app binding. The prior 14 October confirmation request is resolved by Uchi's “now proceed.” Vercel root changed from `apps/web` to the repository root; new Preview verification remains required. See [services guide](vercel-services.md).
- **DEP-URL-01 — Partially verified, 2026-10-15:** The signed-in Vercel project is `shadowrootsec-5679/virtual-ink`, linked to `URUUDEV/Virtual-Ink` main. Existing Production deployment `Fu933Y8sUBKAjqWetMivDvkZy21M` is marked Ready at commit `3da536a`; actual alias is https://virtual-ink.vercel.app. Thirteen read-only checks found two passes and eleven HTTP 500 failures. Ready does not establish a working application or genuine Supabase connection. New Preview and remaining hosting gates are pending.
- **DEP-ENV-01 — Startup conflict resolved; private application setup open, 2026-10-15:** The unused `NEXT_PUBLIC_SUPABASE_ANON_KEY` was renamed to `SUPABASE_LEGACY_ANON_KEY_UNUSED` in Production, leaving its hidden value untouched and the guard intact. After rebuilding, ordinary routes/health/guest checks pass. No genuine Auth/private database/storage enablement is established. See [recovery evidence](reports/2026-10-15-production-recovery.md).
- **QA-95-01 — Target confirmed; measurement boundaries documented, 2026-10-15:** Uchi requests complete development, 95% testing and commit/push after each phase. The [testing target](testing-target.md) defines an enforceable backend/shared line/branch/function gate and records the other unmeasured surfaces separately. This is not 95% product completion or human signoff.
- **DEP-PREVIEW-01 — Partially verified, 2026-10-15:** Source 1341eb3 is pushed and Preview DTziNaPeL4toN3bhzbD1CemCmSqB is Ready at https://virtual-8pfjihiax-shadowrootsec-5679.vercel.app. Signed-in homepage/shop checks and a safe health-handler status 200 event are observed. All thirteen unauthenticated smoke requests are blocked by Vercel protection; Chrome API navigation is blocked too. Keep protection intact and arrange an approved supported verification path; no bypass token or private cookie extraction is used.
- **DEP-RECOVERY-01 — Public recovery verified, 2026-10-15:** Source 5c55364 is pushed to main; Preview 57VJoyCk6NPAfJUGtkrE8TByekKz was visually checked before Production mtAcHg4D1fJ8teAhBRZvuhUy3M63 became Ready. At https://virtual-ink.vercel.app all twenty page/rendered-image/health/guest checks pass. Actual image failures were fixed with direct delivery of existing supplied assets. Complete Auth/database/storage/role workflows and phase acceptance remain pending; this supersedes the earlier outage, not the unbuilt gates.

- **OWN-01 — Confirmed by Uchi, 2026-10-14:** Uchi handles backend engineering and product leadership. Mumba is inactive. Build product phases one by one, starting with the full Phase 1 MVP; historical reports retain their original ownership.
- **AUTH-WEB-01 — Open; Uchi:** Configure email confirmation/mail delivery and exact callback URLs privately; provide an approved synthetic development email for genuine registration/login testing. Browser account entry exists but is disabled; provider tests use synthetic responses. Restricted application login/CA and customer mapping remain separate dependencies. See [account slice](phase-1-account-access.md).

- **PHASE-01 — Confirmed verification requirements from Uchi, 2026-10-14; acceptance details open:** Evaluate product phases as MVP foundation, Trust and operations, Marketplace growth and Differentiation with actual E2E/security/UI/database checks and Vercel hosting. Existing technical Backend Phase 1/2 names do not establish those broader completions. Uchi with Taizya/Lubasi must record the concrete MVP fields, print options, lifecycle/manual-status authority and error/notification behavior before the next build; the [QA report](reports/2026-10-14-phase-completion-audit.md) records missing criteria, not signoff.

- **BQ-01 — Uchi:** Who legally owns and operates Virtual Ink, and who is authorized to approve agreements, platform administration and release decisions?
- **BQ-02 — Uchi:** What is a tenant: vendor organization, customer organization or another boundary? Can users belong to multiple tenants? Who may administer a tenant and how is platform support access authorized and audited?
- **BQ-03 — Uchi:** Git remote is configured at `https://github.com/URUUDEV/Virtual-Ink.git`. Who has access, who may merge/release, and where will the canonical board live?
- **BQ-04 — Uchi:** What may a guest do, and how would a guest lookup/draft capability be limited and later attached to a verified customer? No guest private access is enabled.

## Launch area

- **LA-01 — Uchi with Lubasi:** Which launch country, city or area and initial user groups are approved? What constitutes a launch-ready pilot?
- **LA-02 — Lubasi:** Which currencies, languages, hours and time zones are operationally required? Confirm with evidence.

## Vendor list

- **VL-01 — Lubasi:** Which vendors have actually been identified and authorized for discovery? Where is their verified evidence stored privately?
- **VL-02 — Lubasi with Uchi:** What checks, agreements, service capabilities and account permissions are required before vendor onboarding?
- **VL-03 — Open; Uchi with Lubasi and Taizya:** Review the [vendor preparation form](vendor-onboarding.md). Which fields and consent text are required, what approved private intake/submission channel should receive profiles, who reviews them, and what retention, duplicate and capability-verification rules apply? Current downloads are self-declared and unsubmitted; they grant no vendor access.
- **VL-04 — Open; Uchi with Taizya and Lubasi:** Review explicit vendor device/file drafts and their contact-data wording. Confirm intended private-device use, supported shared-device behaviour and the eventual server retention policy. Device saving is optional and explicit; same-origin scripts can read it. See [functional update](reports/2026-10-13-functional-workspaces.md).

Vendor follow-up: **VL-05 — Open; Uchi with Lubasi:** Review the disabled
[persistent foundation](vendor-onboarding-foundation.md). Who can grant/revoke
reviewer access, what expiry/MFA freshness and recovery are required, which evidence
references prove checks, and what consent, duplicate and retention rules govern
activation? Local rollback fixtures are synthetic and establish no human approval.

## Pricing and commission

- **PC-01 — Lubasi with Uchi:** What verified catalogue, price units, currencies and effective dates apply? Who may change prices and approve revisions?
- **PC-02 — Uchi:** Are commissions, minimums, discounts or fees applicable? What approved rules govern them?
- **PC-03 — Uchi:** Which tax obligations require qualified advice, and who approves the resulting product rules? No tax formula is assumed.
- **PC-04 — Uchi:** How should server-generated quotes expire and retain the accepted price version? Are pages, copies, paper, finishing and delivery relevant inputs?

## Delivery zones

- **DZ-01 — Lubasi:** What delivery or collection areas, boundaries, eligibility rules and service hours are verified?
- **DZ-02 — Lubasi with Uchi:** Who performs delivery, what evidence confirms an arrangement, and how are failed delivery and collection handled?
- **DZ-03 — Taizya with Lubasi:** Which address fields and customer-visible status updates are required? Live delivery tracking is outside Phase 1.

## Payment method

- **PM-01 — Uchi with Lubasi:** Which payment methods may eventually be accepted, and who confirms settlement?
- **PM-02 — Lubasi with Uchi:** What evidence, verification permissions, duplicate handling and reconciliation rules are required? Keep payment evidence private.
- **PM-03 — Uchi:** What approval process governs refunds or reversals? No real payment integration is authorized by Phase 1.

## Hosting budget

- **HOST-01 — Confirmed by Uchi, 2026-10-14:** Vercel hosting verification is mandatory for every phase. Local operation, passing tests and successful deployment with the URL in the completion report are required. See [all verification items](phase-completion-checklist.md). This decision supplies no deployment evidence or completed phase signoff.
- **HB-06 — Open; Uchi:** Which Vercel team/project and billing owner should hold the Git connection, which environments/regions and production branch are approved, and who owns custom-domain/DNS setup? Record connection and deployment evidence after setup; do not include credentials. Vercel is required by HOST-01; account ownership, budget and domain details remain open.

- **HB-01 — Uchi:** What recurring budget, billing owner, region and environment count are approved?
- **HB-02 — Uchi:** The current brief specifies a Next.js/React TypeScript direction, PostgreSQL, private object storage and background jobs. The source foundation follows this direction. Which identity provider, runtime database adapter, private S3-compatible provider and hosting are approved? Frontend dependency resolution/build verification is still pending.
- **HB-03 — Uchi:** What backup recovery objectives, retention, monitoring, secrets management and release controls are required?
- **HB-04 — Confirmed development direction by Uchi:** Supabase free tier ($0/month), new Virtual Ink project `odgxcuwueessxfsoveza` in `eu-west-1`, created in URUUDEV's Org. Hosted Phase 2 schema and rollback security tests are delivered. Restricted runtime login, genuine Auth smoke test, operating/billing owner and production budget still need review.
- **HB-05 — Uchi:** Does a future owned-database move retain Supabase Auth/Storage, replace those adapters, or self-host the whole Supabase stack? What downtime, rollback window and operating responsibilities are acceptable? See [migration plan](supabase-migration-plan.md).

## Printer details

- **PR-01 — Lubasi:** What verified printer capabilities, formats, sizes, finishing options, limits and turnaround constraints are needed for discovery?
- **PR-02 — Uchi with Lubasi:** What file validation and human vendor workflow will eventually be required? Automatic printer control is outside Phase 1.

## Brand assets

- **BA-01 — Confirmed by supplied brief:** Use `asssets/Virtual Ink Gradient Logo.png` unchanged, Poppins and the specified palette. The supplied reference boards are design concepts; depicted prices/vendor claims are not commercial approval. Are separate brand-use rights or production-specific assets needed before launch?
- **BA-02 — Taizya:** What accessibility target and component review evidence are agreed? The supplied HTML now provides six individual 2D product mockups, used as visual fixtures. Review their differing embedded brand treatments, quality and rights before publication. Actual 3D models are still absent.
- **BA-03 — Taizya with Uchi:** Review the implemented HTML visual direction at desktop/mobile widths and confirm product imagery and hierarchy. See [UI visualization and pending browser checklist](ui-visualization.md); no design signoff is inferred from the supplied HTML.

## Workspace UX and API labels

- **UX-03 — Open; Taizya with Uchi and Lubasi:** Review the bundled font choices and interactive procedural 3D shirt. Agree required garment/model fidelity, accessible controls and concept-to-proof expectations. No production garment dimensions or print-area approval is inferred from the model. See [font/3D evidence](reports/2026-10-12-fonts-and-3d-shirt.md).

- **UX-02 — Open; Taizya with Uchi and Lubasi:** Review the delivered local front-only T-shirt concept editor and agree control/error states, accessibility, device-draft privacy wording and concept-to-print-proof handoff. Confirm real print-area/garment/colour constraints with operations before production promises. Contrast/help/status fixes and sampled focus/error checks are verified; live raster-import, screen-reader/actual zoom/full accessibility and human acceptance remain pending. See [workspace scope](tshirt-workspace.md) and [latest review](reports/2026-10-12-editor-accessibility-review.md).

- **UX-01 — Open; Taizya with Uchi and Uchi:** What authorized display label may the workspace-selection flow show? The current membership API returns only tenantId and role. Agree the label source, disclosure permissions and neutral fallback before adding vendor names, logos or approval badges. Start with text wireframes; see the [Taizya kickoff](handovers/2026-10-09-taizya-kickoff.md).

## Backend lifecycle and security gates

These IDs are referenced in the current build baseline and kickoff. All remain
open; recording them grants no runtime authority.

- **MEMBER-01 — Uchi:** Who may invite, create, suspend, reactivate or change vendor memberships, and what resource-scoped approval is needed for each action?
- **MEMBER-02 — Uchi:** How must last-owner protection, simultaneous ownership changes and recovery work? Define concurrency and audit evidence before mutations.
- **MEMBER-03 — Uchi:** Which stable identifier and update contract should a membership mutation use? Existing memberships have a composite tenant/user key; do not invent an existing standalone membership ID.
- **AUTH-02 — Uchi:** Must deactivation cancel requests already in flight or only deny new transactions? Current transaction snapshots do not prove immediate in-flight revocation. Specify the required guarantee and concurrency tests.
- **SEC-01 — Uchi:** What login/API abuse limits and operator MFA controls must precede sensitive workflows, and who owns recovery and enforcement?
- **SEC-02 — Open; Uchi:** Arrange durable reviewed default/deployment runtimes. Private Node 24.21.0 passes the fixed repository gate; default Node remains 24.14.1. On 16 October the [official Node notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) announces HIGH-severity fixes affecting 24.x scheduled for 21 October. Recheck the release and patch/retest before sensitive enablement; the fixed gate does not clear this new advisory. Application exploitability is unproven and no advisory bypass is accepted.
- **SEC-03 — Open; Uchi:** What deployment rate limits, edge controls and worker capacity are approved? The new 16-slot per-worker protected-work ceiling is a local resource bound, not distributed or per-user abuse protection.
- **SEC-04 — Open; Uchi with Taizya:** Finish exact framework patch/advisory, release-bundle/history secret and full accessibility review. Production build, 45 HTTP assertions and sampled Chrome controls/layout pass on 11 October. The rechecked cache advisory requires a root catch-all page (absent); patched-version text remains unresolved. Zero npm audit findings do not close release assurance.
- **AUDIT-02 — Uchi:** Who may review which audit fields for which purpose and duration? Define redaction, bounded pagination, retention and auditing of reviewer access; ordinary API accounts must not gain unrestricted audit reads.

## Pricing rules

- **PRICE-01 — Uchi with Lubasi:** Resolve PC-01/PC-03/PC-04 before a quote engine: units, rounding, option/quantity rules, currency, effective date and expiry. ZMW is requested as the UI display default; real vendor currency and prices still require verification. No live price formula or sample commercial seed is created.

## Commission model

- **COM-01 — Uchi:** Resolve PC-02 with approved rate/basis, responsibility, adjustments, effective dates and reconciliation rules. No commission default is assumed.

## Payment verification method

- **VERIFY-01 — Uchi with Lubasi:** Resolve PM-01/PM-02/PM-03: authorized verifier, private evidence, duplicates, settlement/reconciliation and refunds. UI method names do not imply an integration or successful payment.

## File retention policy

- **FILE-01 — Uchi:** How long are source files, proofs, final digital work, quarantine objects and backups retained? What initiates deletion, and who may request or delay it?
- **FILE-02 — Uchi:** Which formats/sizes are allowed, who operates scanning/quarantine, what storage region/bucket protections are required, and how short-lived grants and access audits work? No upload endpoint can open before these rules and permissions exist.

## Support responsibilities

- **SUP-01 — Uchi with Lubasi:** Who owns intake, vendor disputes, reprint/refund escalation, delivery exceptions and operating hours? No response-time promises are assumed.
- **SUP-02 — Uchi:** Which operators may access private files/proofs for a specific case, what approval is required and what durable audit evidence must be recorded? DeliveryPartner must never receive file/proof access.

## Legal and policy requirements

- **LP-01 — Uchi:** Which jurisdictions, qualified advisers and approval owners govern terms, privacy, vendor agreements, consumer rights and tax decisions?
- **LP-02 — Uchi with Lubasi:** What refund/reprint, cancellation, dispute and support policies are approved?
- **LP-03 — Uchi:** What data classifications, file retention/deletion, permitted access, audit retention, incident response and data location requirements apply?
- **LP-04 — Uchi with Taizya:** Which consent, policy acknowledgement and accessibility requirements affect user flows?

## Dependency guidance

### 2026-10-09 implementation defaults — Proposed

| ID | Restrictive default implemented | Owner / review |
| --- | --- | --- |
| BQ-02 | Vendor organisations are tenants; memberships can span vendors; only own selected active scope is visible | Uchi; acknowledgement pending |
| BQ-04 | Guests and anonymous Auth users receive no private capability | Uchi; expanded guest flow remains open |
| ROLE-01 | DeliveryPartner denies vendor/file/proof access even with other memberships | Uchi with Lubasi; mixed-role semantics pending |
| AUDIT-01 | Durable allowed tenant-read events exist; denial-event storage and retention still open | Uchi |
| AUTH-01 | Auth-server verification is delivered; immediate logout/session revocation needs a separate adapter before sensitive workflows | Uchi |
| REPORT-01 | Every completed build slice includes dated Markdown and Word reports | Confirmed user instruction, 2026-10-09; all leads |

These defaults grant no commercial capability and no user is automatically
provisioned. They are a reviewable engineering slice, not business signoff.

Local health/config/test work and review templates can proceed while these questions are open. Tenant persistence and authorization need BQ-02 and HB-02. Vendor onboarding needs VL-01/VL-02. Quotes need PC-01 through PC-04. Delivery workflows need LA-01 and DZ-01/DZ-02. Payment workflows need PM-01 through PM-03 and policy approval. Public launch needs the applicable legal/policy decisions and hosting review.
