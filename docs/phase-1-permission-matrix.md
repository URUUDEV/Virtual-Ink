# Phase 1 role and resource permission matrix

Status: **target policy; not yet implemented or human-approved**. Owners: Uchi
Chinyama and Mumba Chitonge. This translates the 15 October Phase 1 mission into
an enforceable server-side policy. A page or button never grants permission.

## Scope rules applied to every cell

- **OWN** means the authenticated customer is the order owner or an explicitly
  authorized member of the order's customer organization.
- **ASSIGNED** means the server has an active assignment to this vendor, designer,
  operator case or delivery task. Supplied IDs are selectors; the server must
  prove the assignment before reading or mutating the resource.
- **SAFE** means the file passed signature/MIME checks and production scanning,
  has not been rejected or superseded, and the action is allowed for its purpose.
- **GRANT** means a current server-side, resource-scoped permission naming actor,
  capability, purpose and expiry. A role alone is insufficient for privileged
  actions or delegated organization approval.
- Missing identity, inactive/suspended account, stale version, failed resource
  scope, unsafe file state, missing grant or audit sink means **DENY**. Denials
  must not leak whether another tenant's resource exists.
- Evaluate one active role and resource scope for each action. Additional roles
  never broaden that action. A delivery assignment never grants print-file access.

## Customer and fulfilment actions

`OWN`/`ASSIGNED` grant only the row-level scope above; `GRANT` requires a specific
delegation; `—` denies the action. Vendor/design work cannot act as customer proof
approval.

| Action | CUSTOMER | VENDOR | DESIGNER | DELIVERY_PARTNER | ORGANIZATION_MEMBER | ORGANIZATION_ADMIN | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create order | OWN | — | — | — | OWN organization scope | OWN organization scope | GRANT | GRANT |
| View order/specification | OWN | ASSIGNED | ASSIGNED design task | Assigned delivery fields only | Permitted organization order | Organization scope | GRANT by support purpose | GRANT by support purpose |
| Upload customer source | OWN order | — | — | — | Permitted organization order | Organization scope | GRANT by case purpose | GRANT by case purpose |
| Download customer source | OWN + SAFE | ASSIGNED + SAFE production copy only | ASSIGNED + SAFE design copy only | — | OWN scope + SAFE + order grant | OWN scope + SAFE + order grant | GRANT by case purpose | Explicit `file.break_glass` GRANT, reason and audit |
| Provide or change quotation | — | ASSIGNED, before customer acceptance | — | — | — | — | GRANT `quote.manage`, reason/audit | GRANT `quote.manage`, reason/audit |
| Accept or reject quotation | OWN | — | — | — | GRANT `order.approve` | GRANT `order.approve` | GRANT `order.override`, reason/audit | GRANT `order.override`, step-up and audit |
| Accept or decline assigned job | — | ASSIGNED to same vendor | ASSIGNED design task only | — | — | — | GRANT `assignment.manage`, reason/audit | GRANT `assignment.manage`, step-up and audit |
| Assign vendor to order | — | **Never self-assign** | — | — | — | — | GRANT `order.assign`, select verified vendor, audit | GRANT `order.assign`, verified vendor, step-up and audit |
| Upload/version proof | — | ASSIGNED | ASSIGNED design task | — | — | — | GRANT `proof.manage`, reason/audit | GRANT `proof.manage`, step-up and audit |
| Approve latest proof / request changes | OWN; explicit response | — | — | — | GRANT `order.approve` | GRANT `order.approve` | GRANT `order.override`, reason/audit | GRANT `order.override`, step-up and audit |
| Start or advance production | — | ASSIGNED + payment/proof gates | — | — | — | — | GRANT `production.override`, reason/audit | GRANT `production.override`, step-up and audit |
| Upload production evidence | — | ASSIGNED; new immutable version | — | — | — | — | GRANT by case purpose | Explicit `file.break_glass` GRANT, reason and audit |
| Perform QC / record result | — | ASSIGNED checklist; failure cannot complete | — | — | — | — | GRANT `qc.override`, reason/audit | GRANT `qc.override`, step-up and audit |
| Cancel order | OWN; state rule | Decline before acceptance or request cancellation | Request design-task cancellation | Cancel own assigned delivery only | OWN order scope | Organization scope | GRANT `order.cancel`, reason/audit | GRANT `order.cancel`, step-up and audit |
| Confirm delivery handoff | — | — | — | Assigned task; minimum delivery data | — | — | GRANT `delivery.resolve`, reason/audit | GRANT `delivery.resolve`, step-up and audit |
| View audit events | Own order events only | Assigned job events only | Assigned design-task events only | Own delivery events only; no file/proof metadata | Permitted org order events | Organization order events | GRANT `audit.read`, purpose and audited reviewer | GRANT `audit.read`, step-up, purpose and audit |

## Identity and administration

| Action | CUSTOMER | VENDOR | DESIGNER | DELIVERY_PARTNER | ORGANIZATION_MEMBER | ORGANIZATION_ADMIN | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manage personal profile / request deletion | Own account | Own account | Own account | Own account | Own account | Own account | Own account | Own account |
| Apply for vendor/design/delivery role | Self-submitted application only | Existing verified role | Self-submitted application only | Self-submitted application only | — | — | — | — |
| Verify vendor or assign business role | — | — | — | — | — | Manage own org membership only | GRANT `identity.manage`; cannot grant SUPER_ADMIN | GRANT `identity.super_admin`, step-up and append-only audit |
| Suspend/reactivate account | — | — | — | — | — | — | GRANT `identity.suspend`, reason and audit | GRANT `identity.suspend`, step-up, reason and audit |
| Manage organization members | — | — | — | — | — | Own organization; permitted member roles only | GRANT `organization.manage` | GRANT `organization.manage`, step-up and audit |
| Read security events | — | — | — | — | — | — | GRANT `security.read`, purpose and audited reviewer | GRANT `security.read`, step-up, purpose and audit |

## Mandatory enforcement and tests

1. Resolve identity from a verified Supabase session, map it to the active
   application user, and fetch active roles/grants from trusted database rows.
   Never authorize from `user_metadata`, browser fields, headers or a client role.
2. Check role **and** resource scope in every route/server action. One database
   transaction must cover resource/current-state/version checks, mutation and
   append-only audit. Fail if the required audit cannot commit.
3. Enable and force RLS on every business table. Grant the application service
   only necessary operations. Storage policies repeat parent-order, assignment
   and scan-state checks; signed links expire within five minutes.
4. Create explicit capability names above, scoped grants with purpose/expiry,
   administrator step-up/MFA and audited access to audit records. SUPER_ADMIN is
   not browser-selectable and cannot bypass audit.
5. Test each action as two customers, two organizations, two vendors, designer,
   delivery partner, ADMIN without/with grant and SUPER_ADMIN without/with step-up.
   Include guessed IDs, cross-scope mutations, stale versions, missing audit sink,
   suspension and mixed roles. Verify HTTP, database RLS and Storage denials.

## Decisions requiring product/operations review

`OWN organization scope`, who grants order-specific `order.approve`, mixed-role
enrollment, order states that permit cancellation, delivery fields, support
break-glass approval, step-up frequency, MFA recovery and audit retention require
explicit Uchi/operations review. Affected capabilities stay blocked until those
decisions are accepted.

No role implementation, migration, MFA enforcement or human approval is claimed
by this document. The existing narrow role enum remains unchanged until migration
and RLS plans are reviewed against this target.
