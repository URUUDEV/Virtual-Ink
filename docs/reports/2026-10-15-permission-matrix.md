# Virtual Ink — Phase 1 permission matrix handover

Date: 15 October 2026. Owners: Uchi Chinyama and Mumba Chitonge, backend
collaborators. Status: **proposed policy for review; no authorization capability
was added or widened**. The [matrix](../phase-1-permission-matrix.md) maps all
eight requested roles to order, file, quote, assignment, proof, production, QC,
delivery, audit and identity actions.

## Handover

Every row combines a role with resource scope. Customer and organization access is
limited to owned/permitted orders. Vendor and designer access requires active
assignment; vendors cannot self-assign or approve customer proofs. Delivery
partners receive only assigned delivery fields, never source files or proofs.
Sensitive admin actions require named, expiring server-side capabilities, purpose,
reason, audit and step-up as applicable. Suspended or unmapped identities, missing
scope, stale versions or unavailable required audit fail closed.

The matrix is a proposed target. It must be implemented in server routes and
actions, normalized application-role records, RLS and Storage policy, then tested
with two customers/organizations/vendors, designer, delivery partner and
privileged actors. Current database roles remain the narrow legacy set; the
matrix does not claim migration, RLS or API implementation.

## Open decisions

Uchi and operations need to accept organization-order scope, who can delegate
order approval, mixed-role behavior, permitted cancellation states, delivery data,
break-glass review, administrator step-up frequency, MFA recovery and audit
retention. Until these decisions are recorded, dependent access remains denied.
No reviewer acknowledgement or human approval is claimed.

## Security review

Threats described are conditional on adding the corresponding route/storage
capability: a caller may substitute another order/vendor ID (IDOR), forge a role
field, exploit a mixed role to broaden access, or receive private print files via
a delivery assignment. The design requires server-derived roles, active
resource-bound grants, scoped RLS/Storage, deny-on-stale state and tests at HTTP,
database and Storage. No new endpoint, database grant or hosted schema change was
made; none of these target paths was newly exposed by this document. Hosted policy
tests remain inaccessible until reviewed isolated fixtures and Auth/database
setup are available.

## Team actions

- Uchi: review the listed authority boundaries and resolve the business decisions;
  approve exact acceptance cases before the role migration/API slice.
- Mumba: review the proposed role storage, grant schema and enforcement/tests with
  Uchi; reconcile the existing hosted migration-history discrepancy.
- Taizya: map role/session/denied/step-up states into the responsive dashboard and
  recovery experiences while preserving approved branding.
- Lubasi: confirm vendor assignment, delivery minimum fields, cancellation and
  support/break-glass operating rules; keep private operational evidence out of Git.

The next implementation action is to add the pure server permission evaluator
and permission-matrix tests without opening routes or database/storage grants.
Phase 1 remains PARTIAL; Auth lifecycle, private files, order workflow, dashboards,
manual acceptance and deployed Vercel role workflows remain unverified.

The matching Word report uses the established generator and passes the structural
OOXML audit. Link/privacy validation is performed before commit. Visual pagination
cannot be reviewed because LibreOffice is unavailable. Phase completion is not
claimed.
