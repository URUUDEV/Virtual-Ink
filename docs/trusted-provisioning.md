# Virtual Ink — trusted development provisioning

Date: 2026-10-09. Owner: Mumba Chitonge; product reviewer: Uchi Chinyama.
Status: implemented and tested for review. Genuine sign-in, driver/TLS setup and
human approval remain outstanding. No account, vendor or staff member was created.

## Scope and trust boundary

This is a private development CLI, separate from the customer API and Next.js
runtime. It accepts reviewed account/vendor/staff commands and verifies the target's
permanent Supabase identity through the existing server-side verifier. User metadata,
email strings, submitted user IDs and role selectors never grant authority.

The administrator must check the external approval and reviewer records before
applying a command. Their UUID references are traceability fields, not authentication
or proof that Uchi signed off. Keep those private records outside Git. No public
admin endpoint, automatic signup role, approval UI or production workflow is added.

| Action | Requirements | Result |
| --- | --- | --- |
| create_account | Verified permanent identity; reviewed account approval | Generated application UUID, mapping and Customer role |
| create_vendor | Existing active mapping; reviewed vendor approval; new tenant UUID; target has no active DeliveryPartner role | Vendor tenant and its VendorOwner membership |
| add_staff | Existing active mapping; active approved tenant with an active owner; staff approval; no active DeliveryPartner role | VendorStaff membership |

Existing accounts can be acknowledged without recreating them. Existing active staff
can be acknowledged without adding a duplicate. Disabled identities/users/Customer
roles/memberships are denied. This tool cannot reactivate users, move mappings, take
over an existing tenant, replace an owner, promote staff, grant PlatformOperator or
DeliveryPartner, issue operator grants, update/delete rows or operate on private files.
Revocation and privileged role bootstrap need their own reviewed slice.

## Database boundary and durable audit

New NOLOGIN group `virtual_ink_provisioner` receives SELECT/INSERT only on onboarding
identifier tables and provisioning_audits. Its explicit RLS policies allow private
administrative inspection across tenants; this permission is intentionally broader
than the HTTP role. It has no access to access_audits or operator_grants, no UPDATE,
DELETE, DDL, BYPASSRLS or role administration. Its user_roles INSERT policy permits
Customer only. Audit INSERT binds db_actor to session_user and transaction_id to the
current transaction. All eight application tables retain enabled/forced RLS.

The API and provisioning credentials must be distinct. Startup checks reject owner,
superuser, replication, bypass, database/role creation, extra memberships and ADMIN
OPTION. The selected group must be inherited. Neither group is a login itself.
Do not give the HTTP login provisioning-group membership or reuse migration credentials.

The service commits mutations and their audit atomically. A deferred SECURITY INVOKER
constraint trigger on users, identities, user_roles, tenants and memberships also
requires matching actor/action/user/tenant audit evidence in the same transaction.
Unaudited inserts fail when PostgreSQL processes commit constraints. API/provisioner
roles cannot edit/delete evidence. No SECURITY DEFINER function is used.

Each audit records operation/approval/reviewer references, database actor, action,
SHA-256 request fingerprint, target identifiers, outcome, time and transaction ID.
Tokens, emails, addresses, files and arbitrary notes are excluded. An operation ID
is unique. Identical retries return the original receipt with historicalReplay=true;
changed input is rejected. A historical receipt does not restore permissions or prove
current access. Concurrent conflicts can require an explicit reviewed retry; no
automatic privilege mutation retry is performed.

A compromised provisioning credential could submit false approval references or
write other permitted onboarding rows with matching audits. Database constraints
provide traceability, not independent human approval. Restrict this credential to
Mumba's private tooling; it must never be present in web/server process environments.
Migration administrators remain a privileged trust boundary.

## Setup and safe preview

1. On a connected machine, run `npm install --save-exact pg` at root and commit the
   actual lockfile. The current registry proxy refuses connections; pg is absent.
2. Create two reviewed non-owner database logins privately: one inheriting only
   virtual_ink_api, the other only virtual_ink_provisioner, without ADMIN OPTION or
   privileged role flags. Assign passwords privately, not through Git/SQL reports.
3. Put the provisioner settings only in ignored `.private/provisioning.env`:
   NODE_ENV=development, PROVISIONING_ENABLED=true, PROVISIONING_DATABASE_URL and
   DATABASE_PROVIDER/DATABASE_CONNECTION_MODE, project ref, verified CA path,
   SUPABASE_URL and modern SUPABASE_PUBLISHABLE_KEY. Copy actual endpoints from the
   Connect panel. The normal API environment uses its separate DATABASE_URL.
4. Record real approval/reviewer UUIDs in an ignored command JSON file. Required keys:
   action, operationId, approvalId, reviewerId; tenantId for vendor/staff only. A new
   command gets a new operation ID. Reuse the same ID only for an identical retry.
5. Authenticate the intended approved development user through Supabase Auth.
   Obtain their token privately; never put it in an argument, file, Git, screenshot
   or report. The tool does not create provider accounts or send email invitations.

The committed example is **synthetic and preview-only**, with no real approval:

```powershell
npm run admin:provision -- preview examples/provisioning/create-account.demo.json
```

Preview validates syntax and prints identifiers with writesPerformed=false. It does
not validate identity, external approval, eligibility or database readiness. Do not
apply the demo file; the CLI rejects apply for .demo.json files. Apply a privately
reviewed real command using a hidden prompt:

```powershell
$provisionToken = Read-Host 'Approved user access token' -AsSecureString
try {
  [System.Net.NetworkCredential]::new('', $provisionToken).Password |
    node --env-file=.private/provisioning.env scripts/provision.ts apply .private/approved-account.json
} finally { $provisionToken.Dispose(); Remove-Variable provisionToken }
```

The token is passed only through stdin; the CLI bounds input and times out after
30 seconds. Apply requires development/test mode and explicit enablement. Errors
print a generic code, without raw driver/provider messages. A success receipt means
the transaction committed; retain it privately with the actual approval evidence.

## Genuine login-to-API smoke

Start the backend with AUTH_ENABLED=true after its separate runtime setup. Configure
SMOKE_API_URL as a loopback origin, SMOKE_TENANT_ID as the approved tenant and
SMOKE_DENIED_TENANT_ID as a distinct inaccessible tenant UUID. Pipe a genuine approved
user token from a hidden prompt to `node --env-file=.env scripts/auth-smoke.ts`.

The script verifies the token with Supabase, then checks /me=200, own tenant=200,
other tenant=404, missing token=401 and POST /me=405. It rejects external origins,
redirects, selector URLs and duplicate tenant choices. Mock-fetch unit checks prove
the script's expectations; they are not evidence of genuine login. It prints no
tokens or response data. Mumba must separately inspect the committed access audit
with an approved administrator process; the API login cannot read that table.

## Migration and verification record

Hosted development project: odgxcuwueessxfsoveza. Actual migration versions:

| Version | Name |
| --- | --- |
| 20261009101428 | virtual_ink_trusted_provisioning |
| 20261009101653 | virtual_ink_provisioning_commit_audit |

SQL sources are in database/phase2; hosted copies use the returned versions in
supabase/migrations. The Windows Supabase CLI binary remains unavailable; hosted
MCP applied these forward migrations. Do not reapply them to this project. Fresh
owned PostgreSQL needs the five Phase 2 files replayed in version order and verified
there; no provider auth-table foreign key or auth.uid dependency was introduced.

- npm test: 66 pass, zero failures; 15 new provisioning/runtime/smoke tests.
- Strict TypeScript backend/scripts/tests check: passes using an existing compiler
  read only; native Node execution alone is not a semantic type check.
- Hosted database/tests/provisioning.sql: allowed onboarding, forbidden grants,
  audit actor/transaction binding, immutable evidence and deferred audit constraints
  pass. SET CONSTRAINTS exercises commit checks; test transactions then roll back.
- Hosted database/tests/phase2.sql: existing tenant-isolation regression passes.
- Post-check: all eight application tables contain zero rows; synthetic fixtures
  and temporary role SET grants were rolled back.
- Security advisor: zero findings. Performance advisor: four unused-index INFO
  notices on an empty database; retain FK/audit indexes pending workload evidence.

Not verified: real pg/TLS connection, genuine user login, committed real onboarding,
concurrency under actual pooling, owned PostgreSQL replay, Next build/browser QA,
immediate session revocation and human signoff. Keep AUTH_ENABLED=false until setup.
There is no destructive down migration. Disable/remove private provisioning access
to stop use; do not drop schemas or audit evidence without a backup/review.

Next: Uchi approves onboarding evidence and remaining role defaults; Mumba completes
driver/CA/logins and genuine smoke; Taizya defines denied/expired-session states;
Lubasi supplies private verified vendor-owner/staff approval references.
