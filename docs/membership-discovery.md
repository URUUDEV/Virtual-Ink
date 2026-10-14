# Virtual Ink: caller-owned membership discovery

Date: 9 October 2026. Mumba owns technical work; Uchi reviews product acceptance.
Status: code, migrations and synthetic/hosted checks delivered for review.
Genuine Auth-to-API verification and human acceptance remain pending.
Source: supplied Backend Phase 2 Build Plan section 6, PDF viewer page 4.

## API contract

GET /api/v1/memberships accepts only limit and cursor. Default limit is 20; maximum
100. Missing/malformed bearer gives 401; disabled identity infrastructure gives
503 with a bearer. Unmapped/inactive application users give 403. Other methods give
405 with Allow: GET. Unknown/duplicate fields or invalid cursors give safe 400.
Role/user/vendor headers cannot confer authority.

```json
{
  "data": [{ "tenantId": "22222222-2222-4222-8222-222222222222", "role": "VendorOwner" }],
  "meta": { "requestId": "55555555-5555-4555-8555-555555555555", "pagination": { "limit": 20, "nextCursor": null } }
}
```

IDs above are synthetic examples. Only own active VendorOwner/VendorStaff
memberships in active vendor tenants appear. Unassigned users get an empty list.
PlatformOperator does not get a platform-wide list. ROLE-01 excludes DeliveryPartner
even with a vendor membership. Other member/contact/file/proof/payment records
are absent. Workspace discovery does not grant job/file access. Node and Next
delegate to the same handler and safe no-store envelope.

## Pagination exception

Existing memberships have a (tenant_id, user_id) key and no standalone ID or
created_at. Ascending tenant UUID order is unique within the caller's scope.
Read limit+1 eligible rows; return limit and issue a cursor if an extra row exists.
This documented exception avoids adding columns solely for pagination.

The bounded version-1 base64url cursor encodes application user and last tenant
UUID. Validate canonical encoding, exact fields and caller binding, then resolve
the last tenant through the same active caller-owned join. Other-user, inactive
and guessed positions fail without unscoped lookup. Restart without a cursor if
its last membership becomes inactive. The cursor is not encrypted, signed or an
access grant; changes cannot expand SQL/RLS scope. No secrets belong in cursors.

## Scope and durable audit

Verify permanent provider identity and active application mapping in the existing
transaction. Reset server context, then set access_mode=memberships.list with no
selected tenant. Membership/tenant SELECT policies combine two disjoint branches:
selected tenant access, or own discovery with empty tenant context. Operator
review still needs selected tenant plus live grant. Selecting a tenant disables
discovery. No mutation, role-management or audit-read grant was added.

membership_list_audits is the ninth private table. It stores generated event/time,
verified actor, fixed action/outcome, actor as resource and request ID. Enabled/
forced RLS enforces actor/resource/request/mode binding. API gets INSERT only;
provisioning and exposed provider roles get no rights. Empty pages are audited
without inventing a tenant. Scope lists, tokens, addresses and content are absent.
Missing/failed/zero-row audit or failed commit blocks data. Pool reset clears
access_mode; rollback failure discards the connection. REPEATABLE READ does not
prove immediate in-flight revocation.

## Migrations and recovery

Development target: odgxcuwueessxfsoveza. Actual hosted versions:

- 20261009115552_virtual_ink_membership_discovery.sql: discovery policies/audit table.
- 20261009115855_virtual_ink_membership_discovery_policy_merge.sql: consolidate
  equivalent predicates to remove duplicate SELECT-policy performance warnings.

Exact copies are in supabase/migrations; portable sources are
database/phase2/membership-discovery.sql and membership-discovery-policies.sql.
CLI --help fails because its Windows binary is missing; hosted tools supplied
the versions. Do not reapply committed migrations to this project. Fresh owned
PostgreSQL 17 needs all eight Phase 2 migrations in version order; replay is
unverified. No definer function, provider-specific identity FK or password was added.
Matching runtime readiness requires nine tables/exact rights; older eight-table
manifests fail closed. Coordinate schema and code updates.

For a defect, disable AUTH_ENABLED in both runtimes and restart into health-only
mode. Preserve audit records. Review a forward correction with matching code/
manifest before reactivation. No destructive automatic down migration is shipped.

## Run and evidence

```powershell
npm test
npm run typecheck:web
npm run setup:check -- --database
npm start
```

Restart an existing backend to load the new route. Missing-bearer 401 proves routing
only. Follow [live setup](live-backend-setup.md) before genuine authenticated checks;
keep tokens/passwords out of arguments/reports. Hosted assertions are in
database/tests/membership-discovery.sql and roll back fixtures/temporary grants.
npm run test:db remains the dedicated local Phase 1 command, not a hosted runner.

Observed: 90 Node tests pass (12 new); strict backend/scripts/tests and web/shared
TypeScript pass. Hosted discovery/isolation/provisioning/account regressions pass.
Actual readiness SQL passes under both disabled accounts for nine tables. Auth and
all application table counts are zero afterward; both logins remain disabled.
Security advisor has no findings. Five
[unused-index INFO notices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
remain on the empty schema; retain FK/audit indexes pending workload evidence.
Duplicate policy warnings were fixed and regressions rerun. Policies follow
[Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Next build failed with spawn EPERM. Browser/mobile and actual Next HTTP execution
remain unverified; source delegation/type checks do not replace them. Genuine
Auth/pg/TLS, concurrent pool runtime, owned replay and human review remain open.
No private files or live money movement were enabled.

Next: finish genuine setup/onboarding evidence and Uchi's permission decisions.
Then specify one audited membership-suspension workflow with explicit authority,
last-owner protection and concurrency semantics. Invites and scoped audit review
remain separate slices; marketplace/files/escrow still follow their PDF gates.
