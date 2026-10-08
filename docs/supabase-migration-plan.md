# Virtual Ink — Supabase first, owned PostgreSQL later

Decision requested by Uchi: use Supabase as the initial managed backend provider while preserving an exit path to PostgreSQL under Shadow Root Security Technologies' control. Mumba owns implementation and migration evidence. Current status: the development project has seven private Phase 2 tables, scoped RLS and passing rollback security tests. Identity/access code is delivered; live runtime driver/Auth setup and Storage remain open. See [Backend Phase 2](backend-phase-2.md). Sections below preserve the portability plan and initial config preparation.

The connected account also lists two inactive projects: `shadowroot` (`mddzmeukciacvugixwnr`) and `URUUDEV's Project` (`rxbbibzyyhyksqzlcnll`). Virtual Ink uses the new project `odgxcuwueessxfsoveza`, named `Virtual Ink`, in `eu-west-1`, with status `ACTIVE_HEALTHY`. The project URL is `https://odgxcuwueessxfsoveza.supabase.co`. No API keys or database passwords are stored in this repository.

## Starting architecture

```text
React / Next.js interface
         |
Virtual Ink server API
         |
Business services, verified identity, permissions and tenant scope
         |
PostgreSQL repositories / transaction boundary
         |
Supabase-managed PostgreSQL initially
Owned PostgreSQL can replace this connection later
```

Supabase provides a full PostgreSQL database, so ordinary SQL tables, indexes, constraints, transactions and policies can remain standard PostgreSQL. See [the database overview](https://supabase.com/docs/guides/database/overview). This is a portability strategy, not a promise that every future integration moves by changing one URL.

Use the existing `virtual_ink` application schema and a server API boundary. Keep it out of exposed Data API schemas. Do not grant `anon`, `authenticated` or `service_role` routine access to business tables. Browser code may use a publishable key for the future auth client; it must not query private business tables directly. The selected development project is `odgxcuwueessxfsoveza`; hosted setup still requires explicit schema, grants, RLS, auth, storage and migration review before application data is introduced.

The current code adds `loadDatabaseConfig`, a small `SqlDatabase`/`SqlExecutor` interface and a server-only Supabase REST transport adapter. These validate the selected provider and define driver boundaries. They do **not** connect to a database or expose a business repository yet. The existing PostgreSQL scripts/migration remain local-only until the hosted migration workflow is prepared and verified.

## Portability rules

| Area | Initial Supabase direction | Exit to owned infrastructure |
| --- | --- | --- |
| Business database | Standard SQL in `virtual_ink`, accessed by backend repositories | Export/replay reviewed application schema, data, indexes and policies in owned PostgreSQL |
| Identity | Proposed Supabase Auth adapter in Backend Phase 2 | Preserve application user UUIDs; keep external issuer/subject mapping separate; retain or replace auth adapter explicitly |
| Permissions | Application memberships, resource ownership and transaction-scoped authorization | Move the same application model and portable RLS; do not depend on editable user metadata or provider role claims |
| Files | Proposed private Supabase Storage adapter/S3-compatible access, once upload policy is approved | Copy object bytes plus metadata; preserve opaque file IDs and keys; replace the storage adapter |
| Jobs | Backend worker and standard PostgreSQL job contracts | Move worker configuration and portable queue; no core dependency on Edge Functions or provider-only queues |
| Pricing/audits | Server-owned calculations and durable application audit data | Preserve rules, versions, transaction behavior and audit history in the owned database |

Adapters should remain thin. Add domain-specific repositories when the actual domain exists; do not build a universal query abstraction or mirror the entire Supabase SDK. The current SQL port only defines parameterized execution and a transaction callback.

## Identity and tenant design for Phase 2

- Give each Virtual Ink user an application-owned UUID. Business tables reference that ID, not a direct foreign key to `auth.users`.
- Map verified `(provider, issuer, subject)` to that user in a separate identity relation. Only the auth adapter verifies Supabase tokens and claims; never accept an unverified client subject.
- Store vendor/tenant membership and active status in application tables. Do not authorize from `user_metadata`, client `vendor_id`, or a client-selected role. Provider claims alone cannot replace membership checks.
- Put tenant/user context into the same database transaction as scoped queries and required audit writes. If portable RLS uses transaction-local settings, only the trusted backend sets them after identity and membership validation. No pooled session state may leak into the next request.
- Keep the application DB login separate from migrations/administrative credentials. Do not use `postgres`, a secret/service-role client or bypass-RLS credentials for routine business requests.
- DeliveryPartner receives only assigned delivery fields and must never receive print files, proofs or file grants. Operator exceptions are purpose-bound and audited.

This is a plan, not implemented auth or tenant enforcement. The initial public health endpoint continues to store no tenant data.

## Configuration and connections

`.env.example` selects `DATABASE_PROVIDER=supabase` for the initial hosted direction. With URLs unset, health/tests still run locally. `DATABASE_PROVIDER=postgres` preserves the alternative owned/local PostgreSQL configuration. A process with no `.env` continues to use the previous local defaults.

| Setting | Purpose |
| --- | --- |
| `SUPABASE_PROJECT_REF` | Exact selected project reference; no credentials |
| `SUPABASE_URL` | Optional project API URL for future identity/storage adapters |
| `SUPABASE_PUBLISHABLE_KEY` | Future auth client configuration; not an authorization grant |
| `DATABASE_URL` | Restricted application or worker PostgreSQL login; server-only |
| `DATABASE_CONNECTION_MODE` | Direct, session or transaction mode, matched to the endpoint |
| `MIGRATION_DATABASE_URL` | Separate migration-owner connection; server-only |
| `MIGRATION_CONNECTION_MODE` | Direct preferred, session fallback; transaction mode denied |
| `DATABASE_SSL_ROOT_CERT` | Local trusted certificate path for verified hosted TLS |

Copy actual connection strings from the project's Dashboard **Connect** panel. Do not derive a pooler hostname from an assumed region. Current validation covers standard `db.<ref>.supabase.co` direct endpoints and shared `*.pooler.supabase.com` endpoints, with the matching pooler username/project reference and ports. Custom domains and dedicated poolers need an explicit extension to this contract before use.

Persistent servers use direct connections when reachable, or session pooling on IPv4-only networks. Serverless deployments may use transaction pooling with compatible prepared-statement behavior and transaction-local tenant context. Migrations/dumps prefer direct connections; session fallback must be reviewed for the selected network/tool. See [connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).

Hosted config requires `sslmode=verify-full` plus a CA certificate path. This validates the **requested settings**, not the certificate contents or a live TLS handshake; the eventual driver must load the CA and verify the connection. Get the certificate from the project's database settings. See [SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement).

Secret/service-role API keys stay server-side and are unnecessary for the current health foundation. The config loader rejects public Supabase secret/service-role settings and `sb_secret_` values under public aliases. Publishable keys remain distinct. Database credentials, CA files and dumps belong in restricted storage, never Git or chat.

## Hosted migration workflow still to complete

The existing `database/migrations/001_foundation.sql` deliberately rejects databases other than the two named local development/test databases. Supabase commonly uses database name `postgres`; do not remove the guard or run that file blindly in a hosted project. The existing `npm run db:migrate`, seed/test/probe commands remain local-only.

With the correct **development** project now selected:

1. Repair/install the Supabase CLI and inspect its actual `--help`. The installed wrapper currently lacks its Windows binary. No Supabase migration filename is invented in this change.
2. Generate a migration using the CLI's migration creation command, review the existing schema against managed role ownership/version constraints, and keep provider-specific provisioning separate from portable application SQL.
3. Explicitly review schema grants/default privileges and Data API exposure. Enable RLS on any exposed table, and use denial by default for private tables. Do not assume dashboard defaults provide isolation.
4. Apply only the approved foundation to the development target. Verify queries, security advisors, role grants, migration history and negative access tests before business data or files are introduced.
5. Keep the SQL source of truth in Git and rehearse it on plain PostgreSQL too. Pin actual installed SDK versions and commit real lockfiles when auth/storage adapters are added.

The relevant current changelog change is [Data API auto-exposure](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically); reviewed defaults are still required. No SDK, API key, new migration or live policy is needed for the config-only preparation delivered here.

## Later migration to owned PostgreSQL

1. Inventory database version, extensions, role grants, policies, schema, jobs, data size, auth dependencies and object storage. Define acceptable downtime and rollback with Uchi.
2. Provision the owned database, TLS, restricted roles, backups, restore drills, monitoring and patching responsibilities. Match compatible PostgreSQL versions; schema export does not guarantee downgrade compatibility.
3. Rehearse export/restore of the **application schema**, data and grants. Review all policies/functions for references to Supabase-managed `auth` or `storage` objects. Plain PostgreSQL will not provide those services automatically.
4. Verify row counts, relationships, audit history, server pricing, role denials, two-tenant isolation and worker behavior against the owned test database.
5. Migrate storage separately: copy object bytes and metadata, verify hashes/counts and permissions, and issue new short-lived grants. Database backups do not contain storage object bytes.
6. Decide auth separately. Keeping Supabase Auth requires keeping its project/services even after business data moves. Replacing it or self-hosting Supabase requires identity/session, provider, SMTP and secret configuration work; users may need to sign in again. Preserve application UUIDs and reviewed subject mappings.
7. Pause writes/jobs during the agreed cutover, take a final consistent export or use reviewed replication, update the database/storage/auth adapters, and run smoke plus isolation checks before reopening writes.
8. Keep the source protected until acceptance. After destination writes begin, switching back to the old snapshot loses those writes unless an explicit reconciliation/replication plan exists. Retire source credentials/data only after an agreed rollback window.

For a move of the whole Supabase service stack, see [managed-to-self-hosted guidance](https://supabase.com/docs/guides/self-hosting/restore-from-platform). This differs from exporting business tables to plain PostgreSQL; auth settings, storage objects and service configuration need separate handling. Supabase's [S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility) helps define an adapter, but does not imply full S3 feature parity or that private-access policies transfer automatically.

Migrate when actual cost, control, recovery, compliance or workload requirements justify it. Moving to owned hardware brings operational work; scaling alone does not force an immediate move.

## Verification delivered

Config-only unit tests cover provider selection, project binding, modes/ports, hosted TLS requirements, restricted application usernames, owned PostgreSQL fallback and public-secret rejection. Live queries, hosted migrations, identity and bucket checks remain pending hosted configuration and migration review. See [validation notes](backend-validation.md).
