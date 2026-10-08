# Virtual Ink task board

This Markdown board can be used directly or copied into the team's chosen task tool. Statuses: **Backlog → Ready → In progress → Review → Done**. Use **Blocked** with a named question/decision, owner and next action. One active owner per task. Uchi prioritizes the queue. Ready means dependencies and required acceptance details are available; Done requires review evidence and recorded acceptance.

## Uchi Chinyama — Product and Project Lead

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| U-01 | Review Phase 1 scope and nominate canonical repo/board | Ready | Foundation pack | Scope acknowledgement and repository ownership record | Uchi |
| U-02 | Confirm customer/vendor/admin roles and initial tenant/access model with Mumba | Backlog | U-01, M-01 proposal | Approved role and tenant decision with denial cases | Uchi |
| U-03 | Resolve launch, commercial and policy decisions from discovery | Backlog | L-01, L-02 | Updated open questions and approved decision references | Uchi |
| U-04 | Approve one Phase 2 infrastructure acceptance record | Backlog | U-02, M-01 | Acceptance record; UX/operations N/A reason if appropriate | Uchi |
| U-05 | Review Phase 1 evidence and record signoff | Ready | Delivered docs and backend; lead acknowledgements needed for closure | Completed phase checklist | Uchi |

## Mumba Chitonge — Technical Lead

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| M-00 | Deliver initial health/config/test foundation | Review | Local Node.js available | Source, setup instructions and test evidence | Mumba then Uchi |
| M-01 | Review baseline and propose stack, hosting, database and tenant/access design | Ready | Technical foundation | Decision record, permission matrix and implementation boundaries | Uchi; Mumba owns technical review |
| M-02 | Implement approved Phase 2 identity, membership and tenant scope slice | Backlog | U-02, U-04, M-01 | Reviewed schema/migrations, auth boundary and isolation tests | Mumba then Uchi |
| M-03 | Design private file and durable audit contracts | Backlog | M-01, data classification | Storage access, retention and audit design with test plan | Uchi; Mumba owns technical review |

## Taizya Nakapende — UX and Visual Design Lead

| ID | Task | Status | Dependency | Deliverable | Reviewer |
| --- | --- | --- | --- | --- | --- |
| T-01 | Review UX template and document baseline accessibility/visual choices | Ready | UX template | Acknowledgement and text placeholder conventions | Uchi |
| T-02 | Specify the first approved user flow | Backlog | Uchi's feature acceptance; L-01/L-02 if operational rules affect flow | Completed template, screens, field rules and all states | Uchi then Mumba acknowledges |
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
Open blockers / owner / next action:
Handover date / receiving acknowledgement:
Review decision / reviewer / date / evidence:
```

Weekly review: Uchi checks ownership, missing acknowledgements, blocked decisions and scope changes; each lead supplies evidence for their own tasks. Do not add dates, commitments or external partner names until agreed.

## Current backend/application build update

| ID | Owner | Task | Status | Evidence / next action |
| --- | --- | --- | --- | --- |
| BF-01 | Mumba | Backend Phase 1 health/config/error/validation/audit foundation | Review | Backend tests and strict TypeScript checks; see backend-validation.md |
| BF-02 | Mumba | PostgreSQL migration, demo queue/seed and SQL assertions | Blocked | Files delivered; isolated server could not start; run against dedicated test DB |
| BF-02A | Mumba | Supabase-first provider boundary and owned-PostgreSQL exit plan | Review | Provider config, SQL port, server-only REST adapter and migration plan delivered; active empty project `odgxcuwueessxfsoveza` created; hosted schema verification pending |
| UI-01 | Taizya with Mumba implementing | Supplied logo, tokens, homepage and responsive shell | Blocked | Source delivered; npm install/build/browser verification needs registry access |
| BF-03 | Uchi with Mumba | Backend Phase 2 roles, permissions and tenant model | Review | Narrow identity/tenant read, durable audit and hosted isolation tests delivered; review conservative defaults and finish live setup |
| BF-04 | Mumba | Trusted provisioning and genuine login-to-API verification | Ready | Install pg/lockfile, configure restricted login/CA and implement approved identity/membership provisioning |
| R-01 | Build owner with Uchi reviewing | Dated team progress report after every slice | Ongoing | Markdown + Word report; see team-report.md and AGENTS.md |

These entries supersede the original provisional-stack tasks where applicable. They do not close lead acknowledgement or signoff on anyone's behalf. Follow [the build plan](build-plan.md) one slice at a time.
