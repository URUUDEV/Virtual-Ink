# Virtual Ink — Phase 1 role handover

## Project overview

Virtual Ink is a planned print services platform under Shadow Root Security Technologies. Future product work may cover customer print requests, vendor fulfilment and delivery coordination once discovery and approvals are complete. Business rules and launch details remain unconfirmed.

## Phase 1 goal

Provide a reviewable coordination foundation: role responsibilities, task sequence, templates, open questions, security baseline and a small runnable backend. Follow the Shadow Root standard of secure systems, digital trust, clear documentation, tenant separation, private files, server-side pricing, audit logs and professional handover.

Phase 1 does not include a full marketplace, real payments, live delivery tracking or automatic printer control. Use no invented vendors, delivery partners, prices, commissions or tax rules. Use existing repository images only; otherwise use text placeholders.

## Team roles

| Lead | Accountability | Handover output |
| --- | --- | --- |
| Uchi Chinyama — Product and Project Lead | Scope, priority, acceptance criteria, review and final product signoff | Approved work item, decision references, acceptance evidence |
| Mumba Chitonge — Technical Lead | Architecture, backend, permissions, tenant isolation, private storage and engineering evidence | Technical decision records, code, test results and setup notes |
| Taizya Nakapende — UX and Visual Design Lead | User flows, visual system, all screen states and accessibility | Completed UX template, flow and screen references, field and state specifications |
| Lubasi Monde — Partnerships and Operations Lead | Vendor and delivery discovery, verified service rules and operating procedures | Completed operations template and evidence references with confirmed/unknown status |

## Work handover process

Use [the task board](task-board.md) as the shared source of task status. One person owns each work item at a time. A role handover is complete only when the receiving person records acknowledgement; a sent message alone is not acceptance.

1. **Uchi frames the work.** Select one item, define the problem and affected users, record scope and draft acceptance criteria.
2. **Lubasi resolves operational facts when relevant.** Record vendor, service, delivery, verification and support requirements. Mark uncertain details explicitly and reference private evidence without copying sensitive records into Git.
3. **Uchi decides scope.** Approve the requirements that are ready and record open blockers. Business and policy decisions cannot be inferred by the next lead.
4. **Taizya specifies the flow.** Deliver screens, fields, permission states, empty/loading/error states, accessibility and mobile behavior. Uchi reviews product fit.
5. **Mumba receives a ready task.** Acknowledge the requirements and design references, identify security implications and implementation boundaries, then build the approved slice and supply test evidence.
6. **Uchi reviews and closes.** Evaluate each acceptance criterion, record outcomes and remaining defects, and sign off only when the definition of done is met. Return work to its named owner when changes are needed.

For the Phase 2 infrastructure slice, Uchi may mark UX and vendor handovers **not applicable**, with a reason, because infrastructure can be built before a customer flow. Unconfirmed tenant semantics or access rules remain blockers to the affected implementation. Use fake identifiers only in technical tests; they are not real vendor discovery.

Each handover records task ID, owner, receiver, date, deliverables, dependencies, decisions, unresolved questions, evidence, review status and next action. Preserve previous decisions and explain changes. Link actual artifacts; do not rely on chat history.

## How Uchi reviews work

Use [the acceptance template](acceptance-template.md). Check each criterion against supplied evidence and the original scope. Confirm affected roles, permissions, tenant boundaries, private data handling, required states and negative paths. Record **accepted**, **changes requested**, or **blocked**, with reviewer/date and a reason. Documentation delivery is separate from approval of business rules. A test pass is engineering evidence and does not replace product signoff.

## How Mumba receives backend tasks

Receive a task ID, approved acceptance record, relevant UX and operations records, data classification, permissions matrix and open decision references. Start from [the technical foundation](technical-foundation.md). State the selected stack and database decisions, define the narrow implementation scope, and specify tests for denial and tenant separation. If a rule is unknown, identify the affected part as blocked and continue independent approved foundation work. Return setup steps, changed files, tests, limitations and migration/rollback notes if applicable.

## How Taizya hands over designs

Complete [the UX handover template](ux-handover-template.md). Include flow entry/exit points, each screen and state, field validation, copy, accessibility, mobile behavior and permission-denied states. Label mock content and unresolved rules. Supply design references or text wireframes; missing branding images do not block delivery. Mumba acknowledges technical questions before implementing the flow.

## How Lubasi hands over vendor and delivery requirements

Complete [the operations handover template](operations-handover-template.md). Distinguish confirmed evidence from assumptions and unanswered questions. Include units, turnaround basis, delivery boundaries, proposed verification workflow, refunds/reprints and support escalation. Obtain Uchi's approval of product rules. Keep personal contacts, commercial agreements and payment evidence in approved private storage; the repo contains reference IDs and non-sensitive requirements.

## Definition of done

- Required Phase 1 documents exist, link correctly, and name the four confirmed leads.
- Role tasks have an owner, dependency, deliverable and reviewer; unresolved work is visible.
- All unconfirmed business rules are recorded in the open questions register.
- The backend starts with valid settings, rejects invalid settings and serves a minimal health response.
- Relevant tests pass and test evidence is recorded without claiming unimplemented security controls.
- Scope limits are preserved and no sensitive operational data or credentials enter the repo.
- Each lead acknowledges their handover and Uchi records Phase 1 approval in [the completion checklist](phase-1-completion-checklist.md).

The foundation can be delivered while team acknowledgement and product approval remain pending. Do not mark those human review steps complete on behalf of the leads.
