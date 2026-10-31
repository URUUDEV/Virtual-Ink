# Phase 1 final completion and acceptance authority

31 October 2026. Current owner instruction; applies alongside the existing
release, security, hosting and physical-device gates. Earlier dated reports
remain historical evidence, not acceptance of these requirements.

**PHASE 1 STATUS: INCOMPLETE — ACCEPTANCE GATES REMAIN OPEN**

## Vendor-neutral pilot

Virtual Ink is the platform. Hotprints is one participating testing vendor and
receives the same marketplace treatment, authorization and onboarding checks as
other approved vendors. Introduction assistance confers no ownership, parent
company status, platform control, exclusivity or payment-operator authority.
Independent school-based printers, solo vendors outside schools and approved
printing, design, art and merchandise vendors must be supported independently.
Never seed a vendor-specific administrator, hard-code preferential assignment
or replace the platform's branding with a participating vendor's identity.

## Manual payments and independent review

Approved method scope is MTN Mobile Money, Airtel Money, Zamtel Money, bank
transfer/direct bank deposit and cash on collection with a numbered vendor
receipt. This approves method support; it does not supply a recipient account,
number, receipt, operating approval or successful settlement. Keep mobile-money
numbers, bank details, transaction references and receipt evidence private.
No public page, repository, log, screenshot, group chat or client configuration
may contain those values.

Payment instructions issued, evidence submitted, awaiting independent review,
verified, rejected, additional evidence required and refunded are distinct
payment states. A customer claim, upload, vendor acknowledgement or generic
manual confirmation cannot mark an order paid. Refund recording must refer to
actual refund evidence; it cannot fabricate a bank refund or money movement.
Cash on collection needs an explicitly enforced deferred-payment fulfilment
path; a numbered receipt must not be invented to bypass the current payment gate.

Create the narrowly scoped **Shadowroot Pilot Finance and Reconciliation
Reviewer** authority. It must be independent of the assigned vendor, receipt
submitter, fulfilment actor, refund requester and final vendor payout reconciler.
The role name does not appoint a human or prove independence. Ordinary vendors
and unrelated administrators must not approve their own evidence.

The reviewer interface must show the authorized order/expected amount, method,
reference, submission time and evidence through short-lived authenticated access.
Support approve/reject/additional-evidence decisions, structured reasons,
suspected duplicate/altered receipt flags, suspicious-payment escalation, previous
decisions/audits and current reauthentication/MFA. Every decision must atomically
record actor, timestamp, order, evidence, result and reason. Existing generic
administrator payment confirmation is an implementation gap under this authority.

## Private file acceptance

Cover customer print files, artwork/designs, proofs/revisions, payment receipts,
production/QC evidence and collection/delivery evidence. Storage remains private:
no permanent public URL, short-lived signed authenticated access, current
server-owned order/role authorization, type/size/signature checks, quarantine/
malware scan and upload/access/decision/deletion audits. Define retention and
audited deletion before real files; deletion must respect disputes/legal holds.

Payment evidence has a separate access policy from print files. Vendors see
only permitted files on currently assigned orders and receive no payment-evidence
access by default. An approved policy exception must be explicit and scoped.
Test access denial, failed uploads, scan/provider outages, expired grants,
revocation, interrupted transfers and permission changes during a download.

## Mandatory evidence register

| Gate | Required evidence | Current acceptance status |
| --- | --- | --- |
| FA-01 Hosted runtime | Working isolated Vercel acceptance Preview and exact source/deployment/runtime facts | OPEN; no qualifying full-service Preview |
| FA-02 Private files | Genuine private upload, scan, authenticated expiring download and deletion evidence | OPEN; libraries/buckets do not establish application transport |
| FA-03 Independent payments | Dedicated current reviewer authority, private evidence and all decisions/states | OPEN; previous local reconciliation is insufficient |
| FA-04 Vendor acceptance | Hotprints, school-based solo vendor, outside solo vendor, admin, reviewer and customers | OPEN; no named human acceptance recorded |
| FA-05 Physical devices | Actual Windows, Android and iPhone journeys with named testers and approvals | OPEN; no emulation substitution |
| FA-06 Fulfilment | Genuine proof/revision, production, QC, delivery/collection, receipt and dispute journeys | OPEN; local synthetic SQL is separate |
| FA-07 Build advisory | Patched compatible tooling or documented time-limited Security acceptance | Local patch verified; qualifying hosted build/release evidence remains OPEN |

Run the complete eighteen hosted scenarios: registration/email verification;
customer sign-in/optional MFA; vendor sign-in/privileged MFA; admin/reviewer AAL2;
product configuration/server pricing; private upload; order placement; receipt
submission; independent review; vendor acceptance; proof/customer approval;
revision; production; QC; delivery/collection; customer receipt; review/complaint/
dispute; and expiry/access-denial/provider-failure handling. Use the isolated
Supabase staging, staging Auth/MFA, private staging storage and test email with
manual pilot payments or approved sandbox provider. Record route, role, expected
and actual result, denial evidence and limitation for each scenario.

## Human and physical-device records

Keep an evidence matrix for each actual participant: approved display name,
role/vendor scope, device model, OS/browser version, test date, tested journey,
result, defect and explicit approval. Names/credentials are not interchangeable;
never put credentials or receipt/account details in the matrix. Participant
identity, vendor facts and actual approvals are pending supplied/observed evidence.

Each vendor must manage its own storefront/services/availability, assigned order
queue/files, accept/decline, proofs/revisions, production/QC, ready handoff and
own revenue/payout view. A platform-wide empty dashboard is not that vendor's
acceptance. Test physical Windows keyboard use and 200% zoom without unintended
horizontal overflow, plus Android/iPhone touch, camera receipt upload, print
upload, proofs, MFA, dashboards, slow/interrupted links and session recovery.

## Advisory and release disposition

For GHSA-g3hv-75wg-m249 record installed/fixed version, severity, development vs
runtime scope, deployed exploitability/asset-build influence, compatibility risk,
owner, remediation deadline and compensating controls. Engineering owners are
Uchi/Mumba; remedy before any release unless Security records a time-limited
acceptance. Neither a clean production-only audit nor lack of a demonstrated
request path clears a vulnerable build chain. Preserve the original finding and
actual before/after results. No AI-generated risk acceptance or human signoff.

Close Phase 1 only after every mandatory hosted, privacy, independence, vendor,
MFA, file, fulfilment, device, security-denial, advisory and rollback requirement
passes and the owner explicitly approves release. The final completion report
must contain hosted URL, commit/deployment IDs, migration version, credential-free
accounts/roles, vendor/device matrix, security/files/payments/accessibility
results, advisory disposition, known issues, rollback and release recommendation.
Until then use the exact incomplete status at the top of this document.
