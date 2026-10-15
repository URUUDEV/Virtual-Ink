# Virtual Ink — live backend setup and readiness

14 October Vercel update: Uchi reports deployment and Supabase connection.
[Multi-service setup](vercel-services.md) is implemented and locally verified;
the project must read root vercel.json. Service names/ingress/binding await
confirmation; actual hosted URLs and functional Auth/database checks remain open.

14 October QA boundary: [vendor foundation](vendor-onboarding-foundation.md) core
and transaction scope are present in the hosted development catalog. There are
18 private tables and 10 migrations; original API readiness checks nine tables.
Provider bridge and HTTP intake are absent. Hosted/local rollback fixtures pass,
but credentials/CA/Auth and migration-history reconciliation remain blocked.
The application driver is now installed as pinned `pg` 8.23.1; setup reports
`PG_DRIVER=pass`. Do not reapply core SQL or enable credentials from these findings.

Original setup date: 2026-10-09. Current backend owner and product lead: Uchi Chinyama (updated 2026-10-14). Mumba is inactive.
Status: setup tooling and disabled service accounts delivered for review. Genuine
login-to-API verification has not been completed. Vercel deployment is unverified;
no Preview/Production URL was supplied for the latest QA.

The [Vercel phase completion gate](phase-completion-checklist.md) additionally
requires deployed database, storage, Auth, role dashboards, API and protected-route
evidence. Local readiness and liveness cannot substitute for these checks. Preview
and Production environment configuration and actual URLs must be recorded without
credential values; provisioning credentials remain outside HTTP/web environments.

## Current inspection

### 11 October local runtime/preview update

Official Node 24.21.0 was downloaded privately and its ZIP SHA-256 matched the
official checksum entry. The runtime gate, 111 backend/catalogue tests, five React
checks, 100 security tests, TypeScript, production build and 45 HTTP assertions
pass using it. Default Node is still 24.14.1. No service login was enabled and no
genuine Auth/database verification was performed by these public preview checks.

For this workstation's current terminal, select the reviewed private runtime:

```powershell
$reviewedNode = (Resolve-Path .private/runtime/node-v24.21.0-win-x64).Path
$env:PATH = "$reviewedNode;$env:PATH"
node --version
npm run security:runtime
npm run build:web
npm --prefix apps/web run start
```

Run `npm run check:web:http` from a second terminal using that runtime. It targets
only loopback port 3001 and passes no credentials. The private downloaded runtime
is ignored by Git; other workstations need their own reviewed installation.
This terminal selection does not patch the system default or a deployment.
See [dated verification](reports/2026-10-11-ui-build-verification.md).

The original backend setup inspection below is retained as historical context.

Node.js 24 with native TypeScript runs the backend; npm is the package manager.
The separate apps/web Next.js source shell is preserved. Hosted PostgreSQL has
nine private application tables and eight Phase 2 migrations. Identity/tenant read
and caller-owned membership discovery/private account/vendor/staff provisioning are implemented; files/payments remain
closed. The pg driver is absent and npm installation still fails through the proxy.
There were no local private environment files at inspection. setup:init created
disabled starter files safely. Supabase Auth and application users both have zero rows.

## Delivered setup tools

```powershell
npm run setup:init
npm run setup:check
npm run setup:check -- --database
```

setup:init copies public templates only when their targets do not exist. It creates
root .env for the API and .private/provisioning.env for private tooling, with auth
and provisioning disabled. It preserves existing files and adds no password/key.
Both files are ignored by Git. Do not add them to commits.

setup:check reports 15 fixed check IDs/statuses and an exit code. It checks Node,
driver availability, environment files, credential separation, public secret exposure,
database/provider config, enablement flags, CA parsing/validity, matching project,
distinct database logins and smoke settings. It never prints supplied values, URL,
username, key, certificate path or raw error text. CA format/validity is not proof of
trust or a working TLS handshake; obtain the certificate from the approved source.

The default check makes no network calls. --database opens the two restricted
connections only after configuration checks all pass. Those checks inspect catalogs
only: role flags/memberships, nine tables, exact table/column privileges, forced
RLS, audit constraints and forbidden CREATE/unexpected-table rights. It reads no
customer or Auth records and performs no application write. The JSON distinguishes
requested/performed database checks and always says genuineLoginVerified=false.
Passing readiness is not authentication, vendor approval or production readiness.

The same database checks run during API/provisioning startup. Missing migrations,
disabled RLS/audit triggers, unexpected role/column grants or reused elevated
credentials fail closed. Future schema/capability changes must update this reviewed
manifest with their migration and tests. It is a bounded application-schema check,
not an exhaustive PostgreSQL security audit.

## Restricted service accounts already created

| Account | Inherited group | Current state |
| --- | --- | --- |
| virtual_ink_api_login | virtual_ink_api | NOLOGIN; no password |
| virtual_ink_provisioner_login | virtual_ink_provisioner | NOLOGIN; no password |

Both have no superuser, bypass, replication, role creation or database creation
flags. Each has exactly one group membership: INHERIT TRUE, ADMIN FALSE, SET FALSE.
They own no application tables. Defaults use pg_catalog search_path, 5-second
statement timeout and 10-second idle transaction timeout. No application/customer
or Supabase Auth user was created. A database service account is not a platform role.

The hosted migration version is 20261009110852, virtual_ink_disabled_runtime_accounts.
Its source is database/phase2/runtime-accounts.sql and the exact hosted copy is in
supabase/migrations. The connected migration tool supplied the actual version;
the Windows Supabase CLI binary remains unavailable. Do not reapply it to this
project. Fresh owned PostgreSQL 17 needs all eight Phase 2 migrations replayed in order
and verified; that replay has not been performed here.

## Uchi's private setup sequence

1. Restore dependencies with `npm ci` at repository root and
   `npm --prefix apps/web ci` using reviewed Node. The root driver is pinned at
   `pg` 8.23.1; retain its generated lockfile. See [account setup](phase-1-account-access.md)
   for the separate Next.js environment and Auth switch.
2. Download the correct project CA from the approved Supabase dashboard source.
   Keep it in a private local path and use actual Connect-panel endpoints. This
   slice does not create or substitute a certificate.
3. Connect privately with the reviewed migration administrator using verified TLS
   and psql -X. Configure credentials privately through the platform/psql prompt.
   In that interactive session, set each service account password with:

```text
\password virtual_ink_api_login
\password virtual_ink_provisioner_login
```

4. After reviewing credentials and endpoint settings, enable each account with
   ALTER ROLE virtual_ink_api_login LOGIN and ALTER ROLE virtual_ink_provisioner_login
   LOGIN in the private administrator session. Do not put plaintext passwords in
   SQL, shell arguments, screenshots, chat, logs or team reports. The accounts remain
   disabled until this private action is performed. Review restricted membership
   afterward; do not give either account additional roles or ownership.
5. Configure root .env with the API account only; set DATABASE_URL, project/ref,
   modern publishable key and verified CA. Configure .private/provisioning.env with
   PROVISIONING_DATABASE_URL for the different provisioner account. Bind both to the
   same database/project and approved identity provider. Do not put provisioner,
   migration, test-admin or service-role credentials in root/web environments.
6. Uchi approves the intended development identities and onboarding evidence.
   Lubasi verifies intended vendor owner/staff requirements privately. Create an
   approved development user through Supabase Auth; the project currently has none.
   This slice sends no email invitations and invents no test person's identity.
7. Complete the smoke UUID settings with the approved tenant and a distinct
   inaccessible UUID. Enable auth and private provisioning flags only after setup.
   Run setup:check, then its --database form. Fix named blockers using this guide.
8. Follow trusted-provisioning.md to apply a reviewed private onboarding command
   with a genuine token piped from a hidden prompt. Never apply demo fixtures.
9. Start the API with npm start. Run the five-check live smoke with that user's
   token through stdin. An approved administrator separately inspects the committed
   access audit. Record actual outcomes, denial evidence and human signoff.

Official references: [Supabase roles](https://supabase.com/docs/guides/database/postgres/roles),
[SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement),
[PostgreSQL role membership](https://www.postgresql.org/docs/17/sql-grant.html).

## Verification and open limits

- npm test: 90 pass; twelve new membership tests follow the setup/readiness slice. Strict TypeScript passes.
- Hosted catalog assertions pass for both disabled service accounts. Executing the
  actual startup foundation query under each role reports nine tables with matching
  privileges/RLS/constraints. A column-only audit SELECT grant is detected.
- Role-switch and column grants used in tests were rolled back. rolcanlogin remains
  false for both accounts; neither can log in.
- Security advisor: no findings. Auth/application user counts remain zero.
- setup:init preserves existing settings; setup:check correctly reports blocked
  with driver/config/CA/enablement/smoke inputs incomplete. No network is attempted.

Hosted SET ROLE/catalog checks do not prove a password login, TLS handshake,
configured pg pool or genuine Auth request. Those are still blocked by missing
private setup and the npm proxy. Owned replay, Next build/browser QA, immediate
session revocation and human acceptance remain open. The Word report has structural
checks; visual QA needs unavailable LibreOffice.

To stop use, disable auth/provisioning and stop their processes, then review
NOLOGIN/password rotation privately. NOLOGIN prevents new connections; existing
sessions need explicit termination/review. Do not delete schemas or audit evidence
without backups and an accepted plan. Immediate customer logout revocation is a
separate provider/session requirement before sensitive file/payment workflows.
