# Phase 1 acceptance evidence matrix

31 October 2026. This is an unexecuted acceptance register, not a completed test
report. Store private evidence separately. Never copy credentials, payment
details, customer files, transaction references, receipt images or signed access
tokens into this matrix or screenshots attached to it.

**PHASE 1 STATUS: INCOMPLETE — ACCEPTANCE GATES REMAIN OPEN**

## Participants

| Required participant | Actual participant | Genuine execution / approval |
| --- | --- | --- |
| Participating testing vendor | Hotprints; actual tester pending | NOT RUN / NOT APPROVED |
| School-based solo vendor | Pending actual participant | NOT RUN / NOT APPROVED |
| Independent solo vendor outside school | Pending actual participant | NOT RUN / NOT APPROVED |
| Authorized administrator | Pending actual participant | NOT RUN / NOT APPROVED |
| Independent finance/reconciliation reviewer | Pending actual appointment and independence check | NOT RUN / NOT APPROVED |
| Representative customers | Pending actual participants | NOT RUN / NOT APPROVED |

For each vendor separately record storefront/services/availability, assigned-only
orders/files, accept/decline, proofs/revisions, production/QC evidence, ready
handoff and own revenue/payout results. One vendor's result cannot stand in for
another vendor, organization or role. Introduction of Hotprints is not vendor,
operating-policy or commercial acceptance.

## Hosted scenarios

Record the actual protected acceptance Preview URL, source/deployment, database
migration history, environment bindings and credential-free test account IDs in
the execution report. Each row additionally needs tester/role, date, device,
expected/actual result, private evidence locator, defect and explicit approval.

| ID | Scenario | Current result |
| --- | --- | --- |
| H-01 | Customer registration and real email verification | NOT RUN |
| H-02 | Customer sign-in and optional MFA | NOT RUN |
| H-03 | Vendor sign-in and privileged-action MFA | NOT RUN |
| H-04 | Administrator/reviewer AAL2 and reauthentication denials | NOT RUN |
| H-05 | Product configuration and server-calculated pricing | NOT RUN |
| H-06 | Genuine private printing/artwork upload and scan | NOT RUN |
| H-07 | Order placement and tenant isolation | NOT RUN |
| H-08 | Manual receipt upload/submission remains unpaid | NOT RUN |
| H-09 | Independent receipt approve/reject/additional-evidence/escalation | NOT RUN |
| H-10 | Assigned vendor accepts/declines | NOT RUN |
| H-11 | Private proof and current-version customer approval | NOT RUN |
| H-12 | Revision request, supersession and unauthorized proof denial | NOT RUN |
| H-13 | Production state/evidence and payment/proof gates | NOT RUN |
| H-14 | QC pass/failure/correction and genuine evidence | NOT RUN |
| H-15 | Collection/delivery, cash receipt where applicable | NOT RUN |
| H-16 | Customer receipt confirmation and reconciliation separation | NOT RUN |
| H-17 | Review, complaint, refund and dispute paths | NOT RUN |
| H-18 | Expiry, revocation, access denial and provider interruption | NOT RUN |

## Physical devices

| Device class | Model / OS / browser / test date / named tester | Result / approval |
| --- | --- | --- |
| Physical Windows computer | Pending actual evidence | NOT RUN / NOT APPROVED |
| Physical Android phone | Pending actual evidence | NOT RUN / NOT APPROVED |
| Physical iPhone | Pending actual evidence | NOT RUN / NOT APPROVED |

On all three, record responsive layout, touch targets where relevant, receipt
camera/file selection, printing upload, proof view, MFA enrollment/challenge,
dashboard navigation, slow/interrupted connection and session recovery. Record
Windows keyboard navigation and 200% zoom without unintended horizontal overflow.
Automation/emulation is a separate engineering check and cannot fill these rows.

## Release evidence still required

Private-file expiry/deletion and policy isolation; reviewer conflict denials;
current MFA/session and server/database checks; genuine production/QC/handoff
evidence; build advisory disposition; known issues; documented and tested rollback;
and explicit owner release approval all remain mandatory. This matrix contains
no simulated participant, physical-device result or approval.
