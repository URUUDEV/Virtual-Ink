# Virtual Ink Backend Phase 2 — identity and tenant access

Date: 2026-10-09. Owners: Uchi Chinyama (product), Mumba Chitonge (technical).
Status: narrow implementation and hosted SQL verification delivered; full live
sign-in-to-API verification, provisioning workflow and product signoff remain open.

## Scope and conservative decisions

Guests have no private capability. A vendor organisation is the implemented tenant
kind for this slice. Users can have independent memberships in multiple vendors;
membership roles are VendorOwner/VendorStaff. Global Customer, PlatformOperator and
DeliveryPartner roles are separate. These restrictive defaults implement a reviewable
foundation; BQ-02/BQ-04 remain proposed decisions awaiting Uchi's acknowledgement.

No user, identity, vendor or membership is automatically provisioned. Trusted
administrative provisioning is the next slice. There is no role-selection request,
auth.users trigger, demo login, service-role API client or signup UI. Subjects map
to application-owned UUIDs without a foreign key to Supabase auth.users.

## Delivered API

| Endpoint | Access | Data returned |
| --- | --- | --- |
| GET /api/v1/me | Verified permanent identity + active application mapping | Application user UUID and active global roles |
| GET /api/v1/tenants/:tenantId/access | Active own vendor membership or explicit live tenant.review operator grant | Selected tenant UUID, own membership/capability, access basis |

Other methods receive 405. Missing/malformed Bearer tokens receive 401. With auth
disabled, a syntactically valid token receives 503; there is no simulated login.
Unmapped/disabled users receive 403. Inaccessible or guessed tenants receive 404.
Query selectors are rejected; client role/vendor headers confer no authority.

Identity verification calls the selected project's `/auth/v1/user` endpoint on every
request with a modern publishable key, 5-second timeout, no caching and no redirects.
Anonymous or banned users fail closed; user/app metadata are not role sources.
Application mapping and active membership are read afresh in each transaction.
See [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser).

Auth verification does not provide immediate logout revocation: Supabase access
tokens can survive session termination until expiry. A live session_id check or
equivalent reviewed revocation adapter is required before file/support/payment
actions. Cookie sessions, refresh, CSRF/logout flows and login rate limits are not
implemented. Current requests accept only explicit Authorization bearer tokens.

## Schema and permissions

Seven tables in private `virtual_ink`: users, identities, user_roles, tenants,
memberships, operator_grants and access_audits. All have enabled and forced RLS.
The `virtual_ink_api` group is NOLOGIN/NOBYPASSRLS and has only scoped SELECT plus
INSERT on access_audits. It cannot change roles, memberships, users or tenants;
it cannot read/update/delete audits. No grants to anon/authenticated/service_role.
All helper functions are SECURITY INVOKER with fixed search_path and restricted
EXECUTE. No provider-only auth functions appear in the application policies.

Only the trusted server sets identity/user/tenant/request context with parameterized,
transaction-local set_config. Policies bind the active user to the matching identity
and tenant; changing user_id alone cannot impersonate another mapping. A compromised
server/SQL credential able to forge all settings remains inside the trust boundary.
Never expose arbitrary SQL, settings or a client-selected database role.

VendorOwner/VendorStaff can read their own active membership scope. Operators need
both an active PlatformOperator role and a tenant-bound, expiring tenant.review grant
with vendor_review purpose. The grant does not open files or proofs. DeliveryPartner
is denied tenant/file/proof access even when another vendor membership exists. Mixed
delivery/vendor roles are deliberately restrictive pending the team's role-conflict decision.

File/proof, staff administration and pricing capabilities remain closed for every
role until their resource-level assignment/policy slices are accepted. This slice
does not implement customer jobs or delivery assignments.

## Transaction and audit behavior

The pool port uses one connection for BEGIN (REPEATABLE READ), context reset,
identity lookup, scoped read, audit INSERT and COMMIT. A read result is returned only
after commit. Failure rolls back; rollback failure discards the connection. Context
uses set_config(...,true) and is cleared at transaction start, preventing pool reuse
from importing stale settings. SQL statements have a 5-second timeout.

The allowed tenant-access audit stores identifiers, action, outcome and time only.
Audit INSERT failure or zero affected rows blocks the read response. No full address,
token, private content or free-form metadata is recorded. /me returns the actor's own
ID/roles without a tenant business audit. Denied out-of-scope requests currently have
safe operational status logs; a durable denial-event design remains open. This is
not a complete audit lifecycle, retention, export or operator review feature.

Authorization uses the transaction's snapshot. Concurrent administrative revocation
may take effect on the next transaction; stronger revocation/locking semantics must
be reviewed before high-risk mutations or file grants.

## Hosted migration record

Development target: odgxcuwueessxfsoveza (Virtual Ink, eu-west-1, free tier).

| Version from hosted migration history | Name |
| --- | --- |
| 20261008232317 | virtual_ink_identity_foundation |
| 20261008232912 | virtual_ink_context_initplans |
| 20261008232942 | virtual_ink_audit_request_context |

The Windows Supabase CLI wrapper still lacks its binary. Migrations were applied via
the hosted MCP migration tool and saved under `supabase/migrations/` using the actual
returned versions. Their portable SQL sources also live in `database/phase2/`.
Do not reapply these migrations to the existing hosted project or remove the local
guards in the original Phase 1 scripts. Fresh owned PostgreSQL can replay the three
SQL files in version order inside reviewed transactions. Its test bootstrap needs
the provider-role checks adapted where anon/authenticated/service_role do not exist.

## Runtime setup still required

1. Install the real PostgreSQL driver from npm on a connected machine with
   `npm install --save-exact pg` at repository root and commit the generated lockfile.
   Installation failed here due registry proxy refusal; no package/version/lockfile
   was fabricated. Health and the unit tests still need no dependency install.
2. Provision a new restricted server login with no admin flags and only
   inherited virtual_ink_api membership. Verify pg_has_role(login,'virtual_ink_api','USAGE')
   is true; PostgreSQL 17 membership INHERIT/SET flags need explicit review. Use a
   private password prompt; no password in SQL or Git.
   The runtime rejects privileged, owning or non-API-member logins at startup.
3. Copy actual connection values from the project's Connect panel. Configure
   DATABASE_URL, provider/mode, project ref, verified CA path, SUPABASE_URL and a modern
   SUPABASE_PUBLISHABLE_KEY in ignored .env. Set AUTH_ENABLED=true only after setup.
   Next uses apps/web/.env.local for the same settings.
4. Provision a reviewed application user/identity mapping and roles/memberships via
   an approved private administrator process. Metadata, client role fields and
   automatic signup cannot create these grants.
5. Obtain a genuine development user token through approved Supabase Auth and call
   /me then the tenant-access route with Authorization: Bearer <token>. Keep tokens
   out of history, reports and screenshots. Verify the resulting committed audit.

The optional pg adapter enforces verified TLS using an explicit CA, bounded pool,
startup role checks and generic failure messages. Runtime dependencies load only
when AUTH_ENABLED=true. End-to-end driver/TLS/Auth behavior has not been tested here.

## Verification

- `npm test`: 51 tests pass after this slice, covering guest/provider failures,
  wrong roles/scopes, missing memberships, audit/commit failures and pool rollback.
- Strict backend TypeScript check passes with a pre-existing compiler read only.
- `database/tests/phase2.sql` passed against hosted PostgreSQL as the restricted
  API role: two-tenant lists/joins, mutations, role escalation, inactive/disabled
  identities, delivery dual role, operators/grants, identity-context spoof and audits.
- The role-switch test needs a temporary SET grant on Supabase's migration role;
  it and every synthetic fixture/audit were rolled back. Post-check: all seven
  tables contain zero rows. No real vendor/customer was created.
- Security advisors report no findings. RLS performance warnings were fixed with
  subsequent migrations. Three unused-index informational notices remain on the
  empty development database; keep FK/audit indexes until workload evidence exists.
  See [unused-index advisory](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Remaining: live app sign-in/driver/TLS, owned PostgreSQL replay, complete Next build
and browser QA, trusted provisioning, immediate session revocation and human signoff.

## Rollback and next work

No destructive down migration is shipped. Keep auth disabled while setup is incomplete.
For runtime rollback, disable AUTH_ENABLED and return to liveness-only setup. Do not
delete schemas, roles or data without reviewing backups and deployment consumers.
Hosted changes are in a development project with no business rows. For a fresh
isolated replay, use the versioned files; for future changes use forward migrations.

Next slice: trusted identity/membership provisioning and genuine login-to-API smoke
verification. Uchi reviews guest/vendor/role-conflict defaults; Mumba connects the
restricted driver; Taizya supplies denied/expired-session UX; Lubasi confirms staff,
delivery and support responsibilities. File/marketplace work follows those gates.
