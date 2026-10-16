# Phase 1 explicit role assignments

16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Status: locally verified disabled schema/reader foundation; not hosted or enabled.

The portable database/phase1/role-assignments.sql matches CLI-generated migration
20261016043927_virtual_ink_phase1_role_assignments.sql. It adds a separate private
virtual_ink_phase1 schema with role_assignments and role_assignment_audits. The
ten previously reconciled hosted migrations are unchanged. There are eleven local
migrations and ten hosted migrations; the new version is intentionally unapplied.

Assignments use exactly the eight Phase 1 roles. A partial unique index allows one
active assignment per user. Grant fields are immutable; revocation changes active
to false and version 1 to 2 with actor, approval reference, reason code and time.
Regranting requires a new row. A deferred constraint requires the matching audit
in the same transaction. A second deferred constraint rejects an audit for a
change that never happened. Audit snapshots bind assignment, user, role, version,
action, actor, approval and reason; transaction ID and database session actor must
match. Audit updates/deletes/truncation and assignment-history deletion deny.

Both tables enable and force RLS. The new virtual_ink_phase1_reader is NOLOGIN,
NOBYPASSRLS and non-superuser, with only self-scoped SELECT on the new assignments
and no audit access. It inherits the existing API group for identity mapping and
its existing read/audit rights; no current login receives this new reader group.
Existing API, provisioner, vendor and client roles receive no new schema/table/
function rights, including when creator default grants are permissive. There is
no writer service, login, password, public RPC, seed assignment or automatic legacy
role promotion. Only a reviewed migration administrator can write this foundation.
Database-owner approval references here are not proof of human or provider MFA.

loadAssignedPhase1Actor in src/backend/identity/assigned-context.ts uses verified
identity mapping and active user checks, then reads at most two self-owned active
assignments. It requires exactly one well-formed version-1 assignment and never
falls back to legacy roles. All eight role names load, but the returned actor has
no grants, resource/organization assignments or elevated MFA. Neither this loader
nor the legacy bridge has a production business-route caller. Resource access and
privileged actions still require their separate verified facts and audits.

No runtime environment variable or readiness expansion is added. The current
nine-table readiness contract and existing HTTP behavior remain unchanged. Future
integration must explicitly select the new role source; it must not catch a
missing-schema/assignment error and substitute a legacy role. Do not apply the
new migration or enable a service credential from these instructions alone.

Local evidence includes all eleven migrations on fresh PostgreSQL 18, six rollback
SQL suites, all-eight-role actual loader/RLS checks, audited revocation, suspension,
read-only rights and zero residue. The additional default-privilege probe grants
the synthetic authenticated role schema/table/function defaults before migration;
the new explicit revokes remove them. PostgreSQL 17 and genuine provider sessions
remain unverified. Unit coverage excludes SQL and hosted workflow acceptance.

Next: review bootstrap/privileged lifecycle decisions, implement a real server
session/MFA verification boundary and scoped role-write commands with concurrency,
idempotency and atomic audit tests. Only then review hosted migration, credentials
and route enforcement. Keep the Node advisory and human acceptance gates in force.
See [dated team evidence](reports/2026-10-16-role-assignment-foundation.md).
