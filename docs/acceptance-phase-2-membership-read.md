# Virtual Ink acceptance draft: active membership read

Status: implementation delivered; acceptance remains a draft for Uchi review.
See [actual implementation/evidence](membership-discovery.md); no product signoff recorded.
Source: Backend Phase 2 Build Plan, section 6, PDF page 4.

## Feature name

Caller-owned active memberships: GET /api/v1/memberships.

## User roles affected

Customer, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner.
Guests/anonymous identities have no private capability. The restrictive mixed
DeliveryPartner role decision remains subject to ROLE-01 review.

## Goal and user story

As a verified vendor member, I can discover my active vendor workspaces without
seeing another user's membership, so I can choose a workspace for a later flow.

## Data and permissions needed

- Verified permanent identity and active application-owned user mapping.
- Own active membership, active vendor tenant and constrained VendorOwner/VendorStaff role.
- Minimal proposed fields: tenantId and membership role; no other member IDs,
  contacts, files, proofs, financial records or approval evidence.
- Server-derived user and role. An explicit bounded list policy must preserve the
  current selected-tenant access policy and restricted service credentials.
- Pagination uses default 20, maximum 100. Existing memberships have no created_at
  or standalone ID; the documented exception orders by tenant UUID within the
  caller's scope. Resolve the actor-bound version-1 cursor through the same active
  own-membership/tenant join. This remains subject to Uchi contract review.
- No operator-wide list; PlatformOperator alone conveys no vendor membership.

## Happy path

Verify identity, begin transaction, reset/set server context, read own active
memberships and active tenants, write minimal durable list-access audit, commit,
then return the standard data/meta envelope. This is a new policy/service slice;
the current tenant-access probe is not a shortcut for a cross-tenant list query.

## Error and empty states

- No/malformed bearer: 401. Disabled/unavailable identity/database infrastructure:
  safe 503. Valid but unmapped/inactive application identity: 403.
- No eligible memberships: successful empty list; no invented default vendor.
- Inactive membership or inactive tenant: absent from results.
- DeliveryPartner, including mixed roles: no vendor scopes disclosed under the
  existing exclusion; proposed successful empty list awaits Uchi review.
- Unexpected selectors, unknown fields or invalid pagination: safe 400.
- Unsupported methods: 405. Audit/commit failure: safe failure and no data response.

## Acceptance criteria and test cases

- Identity supplies user context; client user_id, vendor_id and role cannot select
  another principal. Reject unauthorized selectors and ignore authority headers.
- Two users/two tenants, multiple own memberships, no memberships and inactive
  user/membership/tenant cases are covered in service, HTTP and SQL assertions.
- Operator-only and mixed delivery/vendor callers cannot enumerate vendor data.
- Pagination is bounded/deterministic and cursors cannot switch authorization scope.
- Response fields are allowlisted and errors do not expose resource details.
- Audit and result use the same transaction; insert/zero-row/commit failures deny
  response. Pool reuse and rollback failure cannot retain another user's context.
- Node and Next adapters share behavior. Health/config/error contracts still pass.
- Migration and grants are portable, restricted and tested against the approved
  development target; rollback/forward correction notes accompany the change.

These proposed cases do not claim assignment-based job/file permissions or price
tamper tests are complete; those resources do not exist in the current slice.

## Evidence required for Uchi signoff

Record the reviewed fields, empty/denied semantics, pagination and permission
matrix. Attach actual unit/HTTP/SQL results, genuine login evidence where available,
redacted audit inspection, migration/rollback notes, security review and remaining
limitations. Taizya supplies workspace-selection empty/error states; Lubasi verifies
owner/staff discovery facts privately. Use dated Markdown/Word team reports.

Reviewer / decision / date / evidence reference: pending.
