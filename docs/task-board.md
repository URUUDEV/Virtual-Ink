# Virtual Ink task board

18 October: **P1-GATE-21 — Recorded; release NO-GO**, Uchi with Mumba, Taizya
and Lubasi. [Authoritative section 2.1](phase-1-release-gate.md) and
[handover](reports/2026-10-18-phase-1-completion-gate.md) track IMPORT-01,
DEVICE-01, INTEGRATION-01 and RELEASE-01. All completion conditions stay open;
UI-only hosting/emulation does not close them. Next slice: clean import audit.

18 October: **STUDIO-01C — Review; narrow hosted repair verified**, Uchi with
Taizya, Mumba on integration dependencies and Lubasi on supplier assets.
[Canvas evidence](reports/2026-10-18-studio-canvas-fallback.md) records the blank
fallback reproduction, separate canvas identities and renewed viewer readiness.
The final protected source passes local/hosted transition checks. Synthetic draft
cleanup is now confirmed. Import, real-device and full acceptance gates stay open.

18 October: **STUDIO-QA-01 — Partial**, Uchi with Taizya, Mumba on backend
dependencies and Lubasi on real catalogue/file policy. [Hosted evidence](reports/2026-10-18-hosted-studio-verification.md)
confirms text-side separation, colour preservation, device save/reopen and an
actual downloaded layout reference at the current deployed source. File-picker
permission, keyboard/reload/mobile/races, deployed scripts and synthetic-draft
cleanup remain pending. No phase completion or human signoff is claimed.

18 October: **TOOL-01 — Review**, Uchi with Mumba/Taizya. The requested
[Modern Web Guidance installation](reports/2026-10-18-modern-web-guidance-install.md)
completed locally for two skills; Codex detection suppressed the chooser.
Review installer risk flags before use. No app source, deployment or phase gate changed.

18 October: **STUDIO-01B — Review; hosted browser pending**, Uchi with Mumba,
Taizya reviewing and Lubasi on file/vendor policy. [Preparation safety evidence](reports/2026-10-18-studio-preparation-safety.md)
records two reproduced races, cancellation, protected commits/references and
thirteen new handler tests. Local gates pass; the isolated UI-only build is
Ready. Browser file selection/recovery timed out. Next: reconnect the Shadow
browser and verify real import/reopen/cancel/download on the current source.
This slice closes no Phase 1 private-file, studio or acceptance requirement.

18 October: **STUDIO-01A — Review**, Uchi with Mumba implementing and Taizya
reviewing; Lubasi supplies vendor policy. [Contrast evidence](reports/2026-10-18-studio-artwork-contrast.md)
records text luminance warnings, removal of image false positives, 218 root
tests, exact 43-file coverage, local gates and hosted colour/history/mobile
checks. The protected UI-only deployment is Ready. Vendor preflight, physical
accuracy, private files/orders/pricing/proofs and full Phase 1 remain open.

18 October: **UI-HOST-01 — Review**, Uchi with Taizya reviewing and Mumba on
isolation. The [protected Shadow Root UI test](vercel-ui-test.md) is Ready, with
explicit user authorization for its Vercel Production label and all sensitive
services disabled. [Evidence](reports/2026-10-18-ui-test-deployment.md) records
local gates, sampled hosted browser checks and remaining full-service blockers.
The original live site, full acceptance and phase completion remain separate.

18 October: **UI-04A — Review**, Uchi implementing, Taizya reviewing, Mumba on
Auth contracts and Lubasi on support policies. [Account UX evidence](reports/2026-10-18-account-recovery-ux.md)
records logout-only retry after confirmed updates, honest uncertain/expired
states, focus/waiting feedback, duplicate/unmount controls and form-width fix.
Genuine isolated browser, accessibility and hosting acceptance remain open.

17 October: **UI-04 — In progress**, Uchi implementing with Taizya reviewing,
Mumba on preserved security/API contracts and Lubasi on operational evidence.
[Brand/shared UI evidence](reports/2026-10-17-ui-brand-upgrade.md) records the
reference port, centralized tokens, public pages and protected internal controls.
Next: full device/accessibility/performance acceptance, genuine private-file/
order/proof services and supported isolated Preview hosting. No phase closes.

17 October: **STUDIO-01 — In progress**, Uchi with Mumba, Taizya and Lubasi.
The [product design lab](product-studio.md) provides the first reviewable local
registry/model/placement slice. [Evidence](reports/2026-10-17-product-studio.md)
records tests and remaining mandatory acceptance. Next: supplier-matched model
review, private artwork/order/proof/pricing integration and isolated hosting.
No studio, Phase 1 or human acceptance is marked complete.

Current ownership, 15 October 2026: Uchi Chinyama and Mumba Chitonge collaborate on backend engineering; Uchi retains product leadership. This reflects the latest Phase 1 mission and supersedes older notes that Mumba was inactive. Existing M-prefixed IDs are retained for continuity. Build product phases sequentially; Phase 1 remains open. Track acceptance in the [Phase 1 closure checklist](phase-1-closure-checklist.md).

This Markdown board can be used directly or copied into the team's chosen task tool. Statuses: **Backlog → Ready → In progress → Review → Done**. Use **Blocked** with a named question/decision, owner and next action. One active owner per task. Uchi prioritizes the queue. Ready means dependencies and required acceptance details are available; Done requires review evidence and recorded acceptance.

## Uchi Chinyama — Product and Project Lead

Phase closure requires the [Vercel completion checklist](phase-completion-checklist.md):
local operation, passing tests, all hosting checks and the actual deployed URL.
Reviewable documentation/build slices remain separate from completed phases.

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| P1-00 | Inspect Phase 1 baseline and map requirements | Review | User mission | [Gap report](reports/2026-10-15-phase-1-gap-report.md) and [closure checklist](phase-1-closure-checklist.md); 168/168 root tests and loopback health/guest baseline pass | Uchi and Mumba |
| P1-01 | Complete genuine Auth lifecycle and server role boundary | In progress | Password-recovery slice locally verified; private test identity/setup and role matrix remain | AUTH-01/AUTH-02/AUTHZ-01 acceptance evidence | Uchi and Mumba |
| P1-08 | Verify isolated acceptance resources and Preview hosting | Blocked | Native MFA hook-compatible plan/target, supported Preview-only deployment creation and runtime HIGH resolution | [17 October evidence](reports/2026-10-17-hosted-acceptance-verification.md): fourteen staging migrations, 29 forced-RLS tables and 21 hosted denials pass; explicit Preview was misclassified and build stopped at guard; no working Preview | Uchi and Mumba |
| P1-09 | Add source lint gate and correct reviewed editor findings | Review | Existing Phase 1 source and 95% coverage boundary | [Lint evidence](reports/2026-10-17-lint-gate.md): 156 files, zero errors/warnings, build enforcement, committed refs/paint readiness, 206 root and 207 genuine MFA checks pass; hosting and human acceptance remain open | Uchi and Mumba |
| P1-06 | Review eight-role resource permission matrix and resolve blocked policy decisions | Review | Phase 1 mission | [Permission matrix](phase-1-permission-matrix.md); Uchi/operations review of organization scope, grants and break-glass | Uchi and Mumba |
| P1-07 | Test pure eight-role permission evaluator before route/RLS integration | Review | P1-06 target matrix | [Evaluator evidence](reports/2026-10-15-authorization-evaluator.md): 178 backend tests, 95% scoped coverage gate, UI/Auth regressions, strict types and build pass; trusted context, database/Storage and deployed role enforcement remain open | Uchi and Mumba |
| P1-02 | Private print-file lifecycle and scanning | Backlog | Auth/RLS, retention/limits/scanner decisions | FILES-01/FILES-02 verified with negative access tests | Uchi and Mumba |
| P1-03 | Transactional order, quote, proof and production lifecycle | Backlog | Role matrix, pricing/payment/operations decisions, migration reconciliation | ORDER/PROOF/PROD entities, APIs and state tests | Uchi and Mumba |
| P1-04 | Customer, vendor and admin dashboards | Backlog | Accepted APIs and Taizya UX handover | DASH-01 responsive, accessible workflows | Taizya with Uchi review |
| P1-05 | Full security, manual acceptance and Vercel closure | Blocked | Prior work packages and real test identities | TEST-01/02, SEC-01, VERCEL-01 and GATE-01 evidence | Uchi and Mumba |
| U-01 | Review Phase 1 scope and nominate canonical repo/board | Ready | Foundation pack | Scope acknowledgement and repository ownership record | Uchi |
| U-02 | Confirm customer/vendor/admin roles and initial tenant/access model with Uchi | Backlog | U-01, M-01 proposal | Approved role and tenant decision with denial cases | Uchi |
| U-03 | Resolve launch, commercial and policy decisions from discovery | Backlog | L-01, L-02 | Updated open questions and approved decision references | Uchi |
| U-04 | Approve one Phase 2 infrastructure acceptance record | Backlog | U-02, M-01 | Acceptance record; UX/operations N/A reason if appropriate | Uchi |
| U-05 | Review Phase 1 evidence and record signoff | Blocked | Vercel VH-01–VH-17 evidence, deployed URL and lead acknowledgements pending; HB-06 | Completed phase checklist after local/testing/hosting gates pass | Uchi |

## Uchi Chinyama and Mumba Chitonge — Backend Leads

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| M-00 | Deliver initial health/config/test foundation | Review | Local Node.js available | Source, setup instructions and test evidence | Uchi |
| M-01 | Review baseline and propose stack, hosting, database and tenant/access design | Ready | Technical foundation | Decision record, permission matrix and implementation boundaries | Uchi |
| M-02 | Implement approved Phase 2 identity, membership and tenant scope slice | Backlog | U-02, U-04, M-01 | Reviewed schema/migrations, auth boundary and isolation tests | Uchi |
| M-03 | Design private file and durable audit contracts | Backlog | M-01, data classification | Storage access, retention and audit design with test plan | Uchi |

## Taizya Nakapende — UX and Visual Design Lead

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| T-01 | Review UX template and document baseline accessibility/visual choices | Ready | UX template | Acknowledgement and text placeholder conventions | Uchi |
| T-02 | Specify the first approved user flow | Backlog | Uchi's feature acceptance; L-01/L-02 if operational rules affect flow | Completed template, screens, field rules and all states | Uchi acknowledges |
| T-03 | Review built flow against accepted handover | Backlog | Approved flow implementation in a later phase | UX findings and acceptance evidence | Uchi |

## Lubasi Monde — Partnerships and Operations Lead

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| L-01 | Collect and verify vendor/service discovery | Ready | Operations template; Uchi scope direction | Discovery record and private evidence references, unknowns labelled | Uchi |
| L-02 | Discover delivery, verification, reprint/refund and support requirements | Backlog | L-01 as applicable; launch area decision | Proposed operating rules with source and approval status | Uchi |
| L-03 | Record vendor readiness and training/support needs | Backlog | Approved operating rules | Readiness checklist and unresolved issues | Uchi |

## Foundation artifacts

| ID | Artifact | Status | Evidence |
| --- | --- | --- | --- |
| F-01 | README, handover, board and role prompts | Review | README and docs in this project |
| F-02 | Acceptance, UX and operations templates; open questions | Review | Linked from README |
| F-03 | Technical plan and completion checklist | Review | Linked from README |

These artifacts are delivered for review. Their existence does not imply the leads have acknowledged them or that business decisions are approved.

## Vendor onboarding preparation — 12 October 2026

| ID | Task | Status | Evidence / next gate |
| --- | --- | --- | --- |
| UI-04 | Public vendor profile preparation | Review | Three steps, bounded details/services, review and local JSON download at `/vendors/join`; [scope](vendor-onboarding.md). Uchi/Taizya review required fields and UX; Lubasi defines capability checks and private intake. |
| UI-05 | Resume local work and export the 3D view | Review | Editable shirt files, 3D PNGs, explicit vendor device/file drafts and undo restore. [Evidence](reports/2026-10-13-functional-workspaces.md): 127 application tests, nine React/mesh checks, 116 security tests, build/type checks and 53 HTTP assertions pass. File-picker automation, full visual/accessibility acceptance and live intake remain open. |
| VON-01 | Authenticated submission and reviewed activation | Backlog | Resolve [VL-03](open-questions.md), genuine identity/runtime setup and acceptance before submission, persistence or account enablement. Uchi owns the next contract; provisioning credentials remain separate. |
| VON-02 | Review disabled persistent vendor foundation | Review | [14 October evidence](reports/2026-10-14-vendor-foundation-review.md): five contract tests and isolated PostgreSQL 18 lifecycle/RLS rollback pass; empty selectors fixed. Uchi reviews provider bridge, expiry/failure/concurrency and genuine Auth before migration/HTTP wiring; Uchi/Lubasi resolve VL-05. |

## Vercel hosting verification — all phases

| ID | Owner | Task | Status | Evidence / next action | Reviewer |
| --- | --- | --- | --- | --- | --- |
| DEP-01 | Uchi | Verify existing project and Preview/Production on Vercel | Review | [Recovery](reports/2026-10-15-production-recovery.md): source 5c55364 pushed to main, Preview tested before Production Ready; twenty public/image/health/guest checks pass; genuine integrations/domain pending | Uchi |
| DEP-SVC-01 | Uchi | Confirm and deploy multi-service graph | Review | Approved root service layout deployed; bound health GET/HEAD and guest denials pass in Production; genuine authenticated role/tenant workflows remain unverified | Uchi |
| DEP-ENV-01 | Uchi | Remediate Production public configuration privately | Review | Unused legacy public variable renamed server-only with value untouched; startup recovered and guard retained. Restricted application credentials/CAs and genuine Auth still need private setup | Uchi |
| DEP-02 | Uchi | Verify deployed database, storage, Auth, dashboards, APIs and protection | Backlog | DEP-01 and accepted implementations; complete VH-05–VH-11 with synthetic data and denial evidence | Uchi |
| DEP-03 | Taizya | Verify deployed public pages, mobile layouts and browser console | Backlog | Working preview/production URLs; record VH-12–VH-14 results with Uchi | Uchi |
| DEP-04 | Uchi | Review hosting evidence before any phase closure | Blocked | Every VH item, local/testing results, documented domain and actual deployment URLs; Lubasi confirms operational workflows | Uchi |

## Strict phase QA — 14 October 2026

| ID | Owner | Task | Status | Evidence / next action |
| --- | --- | --- | --- | --- |
| QA-01 | Uchi | Review four-phase completion audit | Review | [Audit](reports/2026-10-14-phase-completion-audit.md): all phases incomplete; no full order or Vercel evidence; human review pending |
| QA-95-01 | Uchi | Enforce measured 95% coverage and phase GitHub delivery | Review | [Testing target](testing-target.md): 167 root tests; all 32 scoped files; lines 99.02%, branches 95.14%, functions 97.84%; source pushed and exact remote commit verified; full-product tests remain incomplete |
| MVP-01 | Uchi | Define accepted persistent print-order journey | Ready | Resolve PHASE-01, PC/FILE/AUTH/operations rules; Taizya supplies actual role/order states and Lubasi verified options/manual statuses |
| MVP-02 | Uchi | Implement Auth/files/order/vendor quote/admin manual-status E2E | In progress | MVP-01 and genuine runtime setup; inspect records at every stage, add denial/concurrency/audit tests and verify Vercel before phase approval |
| MVP-AUTH-01 | Uchi | Review account entry/server session slice and finish genuine Auth | Review | [Account slice](phase-1-account-access.md): handlers/UI, role-field denial, PKCE, cookie and protected redirect checks pass; hosted setup/test email/application mapping still pending |
| DB-RECON-01 | Uchi with Mumba | Reconcile hosted vendor migration history with repository | Review | [16 October evidence](reports/2026-10-16-migration-history-reconciliation.md): ten versions/names and normalized SQL SHA-256 checksums match; fresh PostgreSQL 18 replay and five rollback suites pass. No hosted DDL; human review pending |
| P1-08 | Uchi with Mumba | Add initial trusted identity-to-role context and suspended-user denial | Review | [16 October context evidence](reports/2026-10-16-trusted-identity-context.md): conservative Customer/DeliveryPartner bridge, unsupported/ambiguous-role denials, actual local RLS and synthetic HTTP checks; full eight-role lifecycle, resource loading and audited route integration remain open |
| P1-09 | Uchi with Mumba | Design explicit eight-role assignments and privileged lifecycle | In progress | [Assignment foundation](phase-1-role-assignments.md): local schema/reader/audited grant-revoke constraints verified; genuine MFA, privileged writer, bootstrap decisions and hosted rollout remain open |
| P1-09A | Uchi with Mumba | Review disabled assignment/audit schema and explicit reader | Review | [16 October evidence](reports/2026-10-16-role-assignment-foundation.md): 186 root tests, 35-file coverage gate, six SQL suites and actual loader/RLS/default-privilege probes pass; no hosted migration applied |
| P1-09B | Uchi with Mumba | Review internal Auth-first session/MFA prerequisite | Review | [Step-up evidence](reports/2026-10-16-session-step-up.md): 191 root/180 security tests, 37-file coverage gate and seventeen actual SQL denials pass; no caller/Auth grant/genuine MFA enabled; provider policy and privileged writer remain open |
| P1-10 | Uchi with Mumba | Genuine TOTP and trusted privileged-role administration | Partial | [Implementation](phase-1-security-admin.md): 87 real local Auth/application checks verify TOTP/encryption, replay/rate controls, dual-approved grants, expiry/removal/session revocation and audits; isolated Preview/browser, recovery, hosted logs and HIGH runtime gate remain open; no production or hosted DB changes |
| P1-10A | Uchi with Mumba | Review native provider MFA verification guard | Partial | [Follow-up](reports/2026-10-16-provider-mfa-guard.md): 185 genuine checks and 82 SQL assertions pass; native replay/race/budget/receipt/audit controls verified locally. Compatible managed Teams/Enterprise or authorized self-hosted isolation, Preview, recovery and HIGH runtime gates remain open |
| P1-10B | Uchi with Mumba | Replace a working authenticator safely | Partial | [Evidence](reports/2026-10-16-authenticator-replacement.md): 207 genuine checks, 108 SQL assertions and fourteen local migrations pass; recent-MFA replacement, confirmed removal and durable serialization are local only. Isolated hosted/browser and controlled reconciliation remain pending |

## Work item template

```text
Task ID / title:
Phase / scope:
Owner / receiving lead / reviewer:
Status / priority:
Goal / affected users:
Acceptance record link:
Dependencies / decision IDs:
UX and operations handover links (or N/A with reason):
Data classification / permissions / tenant impact:
Deliverables:
Tests / evidence required:
Phase closure: local operation / test results / Vercel VH-01–VH-17 evidence:
Preview and production deployment URLs / IDs / tested commits:
Open blockers / owner / next action:
Handover date / receiving acknowledgement:
Review decision / reviewer / date / evidence:
```

Weekly review: Uchi checks ownership, missing acknowledgements, blocked decisions and scope changes; each lead supplies evidence for their own tasks. Do not add dates, commitments or external partner names until agreed.

## Current backend/application build update

| ID | Owner | Task | Status | Evidence / next action |
| --- | --- | --- | --- | --- |
| BF-01 | Uchi | Backend Phase 1 health/config/error/validation/audit foundation | Review | Backend tests and strict TypeScript checks; see backend-validation.md |
| BF-02 | Uchi | PostgreSQL migration, demo queue/seed and SQL assertions | Blocked | Files delivered; isolated server could not start; run against dedicated test DB |
| BF-02A | Uchi | Supabase-first provider boundary and owned-PostgreSQL exit plan | Review | Hosted development schema and rollback isolation/provisioning checks pass; owned PostgreSQL replay remains open |
| UI-01 | Taizya with Uchi implementing | Supplied logo, tokens, homepage and responsive shell | Review | Build/TypeScript and sampled Chrome probes pass on private reviewed Node; full accessibility and human acceptance pending |
| UI-02 | Taizya with Uchi implementing; Uchi reviews | Supplied HTML translated into public visual collection | Review | 11 October report: build, 45 HTTP assertions, responsive DOM probes and hydrated controls pass; image containment and HTTP 404 fixed |
| UI-03 | Taizya with Uchi; Uchi reviews | Local T-shirt 2D/3D workspace, fonts and acceptance | Review | 12 October font/3D report: seven font choices and procedural 3D preview; 121 root tests, seven React/mesh checks, 110 security regressions pass; Chrome font/view/zoom/keyboard controls verified; Uchi reports artwork working; automated texture/export and UX-02/03/full accessibility acceptance remain open; FILE-01/02 precede server uploads |
| BF-03 | Uchi | Backend Phase 2 roles, permissions and tenant model | Review | Narrow identity/tenant read, durable audit and hosted isolation tests delivered; review conservative defaults and finish live setup |
| BF-04 | Uchi | Trusted development account/vendor/staff provisioning | Review | Private CLI, separate group, immutable audit and deferred commit constraints verified; see trusted-provisioning.md |
| BF-05 | Uchi | Genuine login-to-API and real onboarding verification | Blocked | pg 8.23.1 installed; separate restricted logins/CA and approved development identity/evidence still needed; account UI/handlers delivered, genuine smoke pending |
| BF-06 | Uchi | Safe setup and runtime database readiness checks | Review | Disabled service accounts, preserved environment initialization, catalog/column checks and 78-test evidence; see live-backend-setup.md |
| BF-07 | Uchi | Caller-owned active membership list | Review | Endpoint, pagination, private audit, nine-table readiness and 90-test/hosted isolation evidence; genuine setup/product acceptance pending |
| BF-08 | Uchi | Membership lifecycle, revocation and abuse controls | Backlog | AUTH-01/02, MEMBER-01/02 and SEC-01 decisions; audited mutations, concurrency and denial evidence |
| BF-09 | Uchi | Restricted audit review and denial-event policy | Backlog | AUDIT-01/02; separate purpose-bound authority, redaction, pagination and access audits |
| ESC-01 | Uchi with Lubasi | Escrow simulation readiness and complete transition/ledger contract | Backlog | Source PDF; approved quote/order prerequisites; resolve ESC-01 through ESC-04 in open questions; no live funds |
| DOC-01 | All leads; Uchi coordinates | Supplied PDF baseline and gap review | Review | source-document-baseline.md and dated source-review report; no signoff inferred from PDF wording |
| DOC-02 | Uchi and Taizya | Role kickoff PDFs and first-session handoff | Review | Two three-page PDFs linked in team-report.md; Uchi verifies genuine runtime, Taizya reviews shell and drafts workspace states; acknowledgement pending |
| SEC-05 | Uchi; each build owner executes | Security review after every meaningful step | Ongoing | AGENTS.md and security-review.md; regression tests, safe scan, runtime gate and dated evidence |
| SEC-06 | Uchi | Patch runtime and reverify release gates | Blocked | Verified private Node 24.21.0 passes runtime/tests/build; default 24.14.1 still fails; durable default/deployment patch and SEC-03/04 remain open |
| R-01 | Build owner with Uchi reviewing | Dated team progress report after every slice | Ongoing | Markdown + Word report; see team-report.md and AGENTS.md |

These entries supersede the original provisional-stack tasks where applicable. They do not close lead acknowledgement or signoff on anyone's behalf. Follow [the build plan](build-plan.md) one slice at a time.
