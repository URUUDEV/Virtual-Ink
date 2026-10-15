# Virtual Ink task board

Current ownership, 14 October 2026: Uchi owns backend engineering and product leadership. Mumba is inactive and has no current tasks. Existing M-prefixed IDs are retained for continuity. Build product phases sequentially; Phase 1 remains open.

This Markdown board can be used directly or copied into the team's chosen task tool. Statuses: **Backlog → Ready → In progress → Review → Done**. Use **Blocked** with a named question/decision, owner and next action. One active owner per task. Uchi prioritizes the queue. Ready means dependencies and required acceptance details are available; Done requires review evidence and recorded acceptance.

## Uchi Chinyama — Product and Project Lead

Phase closure requires the [Vercel completion checklist](phase-completion-checklist.md):
local operation, passing tests, all hosting checks and the actual deployed URL.
Reviewable documentation/build slices remain separate from completed phases.

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| U-01 | Review Phase 1 scope and nominate canonical repo/board | Ready | Foundation pack | Scope acknowledgement and repository ownership record | Uchi |
| U-02 | Confirm customer/vendor/admin roles and initial tenant/access model with Uchi | Backlog | U-01, M-01 proposal | Approved role and tenant decision with denial cases | Uchi |
| U-03 | Resolve launch, commercial and policy decisions from discovery | Backlog | L-01, L-02 | Updated open questions and approved decision references | Uchi |
| U-04 | Approve one Phase 2 infrastructure acceptance record | Backlog | U-02, M-01 | Acceptance record; UX/operations N/A reason if appropriate | Uchi |
| U-05 | Review Phase 1 evidence and record signoff | Blocked | Vercel VH-01–VH-17 evidence, deployed URL and lead acknowledgements pending; HB-06 | Completed phase checklist after local/testing/hosting gates pass | Uchi |

## Uchi Chinyama — Backend Lead

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
| DB-RECON-01 | Uchi | Reconcile hosted vendor migration history with repository | Ready | Catalog has 18 tables/10 migrations; local versioned directory lacks the two vendor versions. Review/export exact history and replay; do not reapply existing core SQL |

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
