# Phase 1 role and resource permission matrix

Status: **target policy with a locally tested pure evaluator; route, RLS and
Storage enforcement and human approval remain pending**. Owners: Uchi
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
- Evaluate one active role and resource scope for each action. Until mixed-role
  rules are accepted, a principal with multiple active roles is denied by the
  Phase 1 evaluator. A delivery role never grants print-file access.

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
| Accept or reject quotation | OWN | — | — | — | GRANT `quote.respond` | GRANT `quote.respond` | GRANT `order.override`, reason/audit | GRANT `order.override`, step-up and audit |
| Accept or decline assigned job | — | ASSIGNED to same vendor | ASSIGNED design task only | — | — | — | GRANT `assignment.manage`, reason/audit | GRANT `assignment.manage`, step-up and audit |
| Assign vendor to order | — | **Never self-assign** | — | — | — | — | GRANT `order.assign`, select verified vendor, audit | GRANT `order.assign`, verified vendor, step-up and audit |
| Upload/version proof | — | ASSIGNED | ASSIGNED design task | — | — | — | GRANT `proof.manage`, reason/audit | GRANT `proof.manage`, step-up and audit |
| Approve latest proof / request changes | OWN; explicit response | — | — | — | GRANT `proof.approve` | GRANT `proof.approve` | GRANT `order.override`, reason/audit | GRANT `order.override`, step-up and audit |
| Start or advance production | — | ASSIGNED + payment/proof gates | — | — | — | — | GRANT `production.override`, reason/audit | GRANT `production.override`, step-up and audit |
| Upload production evidence | — | ASSIGNED; new immutable version | — | — | — | — | GRANT `production.evidence.upload` by case purpose | GRANT `production.evidence.upload`, step-up, reason and audit |
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

The [current security review](phase-1-security-admin.md) adds four distinct
specialist roles alongside ADMIN/SUPER_ADMIN. They gain no implicit order/file
rights from their names. Privileged writes use current DB authority, recent
provider MFA and distinct SUPER_ADMIN approval; the schema and genuine hosted
acceptance are not enabled. Unbuilt financial/vendor mutations remain unavailable.

The [internal session/MFA prerequisite](phase-1-session-step-up.md) now checks
Auth-validated claims against current provider session/account/factor/AMR facts.
It supplies no role/grant, has no runtime caller and does not change the assignment
loader's AAL1. Synthetic verification is not genuine MFA or route enforcement.

The [explicit assignment foundation](phase-1-role-assignments.md) now supports
all eight role names using a separate private schema and required grant/revoke
audit snapshots. Its loader has no legacy fallback and supplies no grants,
resource scope or elevated MFA. It is locally verified but unapplied on hosted
development; there is no runtime writer or business-route caller. The initial
legacy bridge below remains a separate implementation, not automatic fallback.

The [initial trusted actor bridge](phase-1-trusted-context.md) now reads active
existing identity/user/role rows inside the caller's transaction. It supports only
unambiguous Customer/DeliveryPartner and denies Customer vendor memberships,
legacy PlatformOperator and other unsupported/mixed role facts. Its immutable
actor has no grants, resource assignments or elevated MFA. The six remaining roles
still need schema/lifecycle integration; no business route calls the loader yet.

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

`OWN organization scope`, who delegates quotation/proof approval, mixed-role
enrollment, order states that permit cancellation, delivery fields, support
break-glass approval, step-up frequency, MFA recovery and audit retention require
explicit Uchi/operations review. Affected capabilities stay blocked until those
decisions are accepted.

The [pure evaluator handover](reports/2026-10-15-authorization-evaluator.md)
records local role/resource tests. All privileged evaluator actions require AAL2
and a resource-specific, unexpired grant with purpose and reason. Vendor actions
also require a verified vendor. Production files must be approved, SAFE and active;
inactive versions are denied. Vendor assignment is limited to pre-production
states. Cancellation is conservatively limited to DRAFT through AWAITING_PAYMENT;
later cancellation needs a separately reviewed workflow. Grant-only names such as
`production.override` are not standalone business actions and cannot skip gates.

Organization quote response uses `quote.respond`; proof approval uses
`proof.approve`. Each requires a separate order-scoped delegation. Organization
management must target the organization itself. Delivery order/timeline reads
still require field projection by the future repository/route layer. The evaluator
does not validate database freshness, commit a mutation/audit, filter response
fields, issue signed URLs or prove MFA enrollment. The future trusted context
loader must supply those facts from verified identity and database records.

No route integration, migration, hosted MFA enforcement or human approval is
claimed. The existing narrow role enum remains unchanged until migration and
RLS plans are reconciled with this target.
