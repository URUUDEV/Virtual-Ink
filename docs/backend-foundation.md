# Virtual Ink — Backend Phase 1

Historical foundation record. The current slice is
[Backend Phase 2 identity and tenant access](backend-phase-2.md), with seven hosted
private tables and passing RLS assertions. Earlier planned statements below describe
the Phase 1 boundary; consult Phase 2 for today's auth/audit/setup status.

Owners: **Uchi Chinyama, Product and Project Lead**, and **Mumba Chitonge, Technical Lead**. UX lead: Taizya Nakapende. Partnerships and Operations lead: Lubasi Monde.

## Backend purpose

Establish a secure, documented and testable base for later vendor storefronts, print requests, product orders, design quotations, proof approvals, delivery coordination, payment records and reporting. This phase delivers infrastructure contracts, not those marketplace workflows.

Shadow Root standard: secure systems, digital trust, tenant/vendor separation, private files, server-side pricing, audit logs and least privilege. No real payments, courier integrations, live tracking, printer automation, full catalogue/checkout, uploads, dashboards, customer mobile UI, messaging or production deployment are implemented.

## Repository inspection before edits

| Area | Observed starting state |
| --- | --- |
| Stack | Node.js 24 ESM, JavaScript, built-in HTTP server; no application framework |
| Package manager | npm; dependency-free root manifest and v3 lockfile |
| Structure | `src/`, `test/`, `docs/`, README and setup files |
| Frontend/backend | Backend only; no frontend yet |
| Database/auth | No schema, migrations, database adapter or authentication |
| API | `/health` GET/HEAD, safe metadata logs, 404/405 behavior |
| Tests | Node test runner, single process; original 9 tests |
| Environment | `.env.example`; no actual `.env` found during inspection |
| Documentation | Phase 1 handover pack, task board and templates |
| Assets | Four user-supplied PNGs in `asssets/`; logo and reference boards inspected |
| Git | Clean tracked foundation on `main`, tracking `origin/main`; assets initially untracked |
| Gaps | No role enforcement, tenant model, durable audit sink, file storage, jobs or integration tests |

Inspection was reported before editing. No competing backend framework existed. The user's Next.js/TypeScript direction is adopted as a combined web/API application with shared backend modules. The original Node adapter remains runnable independently during the transition.

## Current stack

- Node.js 24 with native TypeScript execution; no dependency needed for backend tests.
- `src/backend/`: TypeScript configuration, API helpers, health, audit, storage contracts and demo job validation.
- `src/app.js` / `src/server.js`: compatible local HTTP adapter and startup/shutdown.
- `apps/web/`: Next.js App Router, React, TypeScript, Tailwind, Poppins and Lucide starter. Its dependencies are separate from the root so backend work can proceed without installing UI packages.
- PostgreSQL 18 migration and SQL tests; dedicated local databases only. `psql` is the current infrastructure-script driver. A runtime database adapter/pool is a later choice; HTTP health does not connect to PostgreSQL.
- **Updated provider direction:** Supabase-managed PostgreSQL is the initial hosted target. `src/backend/database/` now holds provider config validation and a small SQL transaction interface, with plain PostgreSQL retained as an alternative. No live adapter/project connection is implemented. See [Supabase and owned-database plan](supabase-migration-plan.md).
- `src/backend/database/supabase-rest.ts` adds a server-only, publishable-key REST transport adapter. No route calls it yet; repositories must add identity, tenant and RLS checks before use. See [adapter notes](supabase-rest-adapter.md).
- Private S3-compatible object-storage configuration contract; no storage provider selected, bucket created or upload route enabled.
- Supabase Auth and private Supabase Storage are proposed adapters for later slices; user UUIDs, tenant memberships and file IDs remain application-owned. Migrating Auth and object bytes requires separate work from moving business tables.
- PostgreSQL no-op demo probe queue; no general tenant/customer job processor yet.

Next.js source follows the [official installation guidance](https://nextjs.org/docs/app/getting-started/installation) and [Route Handler conventions](https://nextjs.org/docs/app/api-reference/file-conventions/route). The starter is source-complete for the bounded shell, but dependency installation, Next build and browser QA are pending in this session. Do not describe it as a verified frontend.

## Backend modules planned

| Module | Delivered now | Next implementation |
| --- | --- | --- |
| Health/config | Original health plus `/api/v1/health`, named setting validation | Dependency-aware readiness after infrastructure setup |
| API boundary | Response/error helper, bounded JSON reader, strict object/UUID/text/pagination validation | Domain schemas and authenticated route adapters |
| Identity/permissions/tenants | Permissions plan only | Backend Phase 2, with two-tenant denial tests |
| Audit | Strict event builder, fail-closed sink interface, deny-by-default table | Durable transactional writes with first protected action |
| Private files | Scoped opaque-key helper and closed access placeholder | Policy, provider, scanning and authorized storage adapter |
| Jobs | Synthetic `system.probe` queue and atomic no-op completion SQL | Authorized tenant-scoped work and reliable failure recovery |
| Vendors/pricing/orders/proofs/delivery/reporting | No business implementation | Approved vertical slices after discovery and permissions |

## Environment setup

`npm start` loads root `.env` if present and defaults to local loopback. `npm run dev` watches the Node adapter. `npm test` needs no installation. See root `.env.example` for optional settings.

| Setting | Rule |
| --- | --- |
| `NODE_ENV`, `HOST`, `PORT` | Valid environment, literal IP, integer 1–65535 |
| `DATABASE_URL` | Optional valid PostgreSQL URL; application must use a least-privilege login |
| `JOBS_ENABLED` | Exact `true`/`false`; enabling requires a database URL, but does not launch a worker automatically |
| `STORAGE_ENABLED` | Exact `true`/`false`; enabling requires all five S3 settings, but does not enable file routes |
| S3 endpoint | HTTPS; loopback HTTP allowed for non-production development only |
| `MIGRATION_DATABASE_URL` / `TEST_DATABASE_URL` | Used by explicit scripts, never returned over the API |

Invalid config fails before the Node server starts. Next's instrumentation validates config at server startup. Do not use `NEXT_PUBLIC_` for database, storage, auth, audit or job settings. Infrastructure output and public health responses omit connection URLs and credentials. Root `.env` is read by the standalone adapter/scripts; Next reads `apps/web/.env.local`, not the root `.env`. No credentials are needed for the shell or health route.

## Database approach

The migration creates a dedicated `virtual_ink` schema with migration history, audit-event contracts and a no-op background queue. It contains no customers, real vendors, catalogue, prices, commissions, tax formulas or orders. Audit rows have no free-form metadata field; tenant/user identifiers are required for user events. Audit RLS is enabled and forced, with no runtime policies or grants yet.

Infrastructure groups `virtual_ink_api`, `virtual_ink_worker` and `virtual_ink_auditor` are NOLOGIN and non-privileged. API gets no queue or audit access; worker can read and update only demo job state columns. No login/password is embedded in migrations. Mumba must create separate restricted logins and grant only approved groups before connecting a runtime adapter. Migration ownership must never be used by HTTP application code. PostgreSQL ownership and role privileges are distinct; see [PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html).

`npm run db:migrate` applies the single transaction-protected, repeatable migration. `npm run db:seed` adds exactly one labelled demo no-op job and is idempotent. `npm run test:db` uses `TEST_DATABASE_URL` and rolls back its fixtures. `npm run jobs:once` atomically completes at most one due demo probe, using `FOR UPDATE SKIP LOCKED`; it has no external side effects. These scripts reject remote hosts and any database other than `virtual_ink_development` or `virtual_ink_test`; tests require the latter. URLs must not include query settings.

For a dedicated Docker development instance, set `POSTGRES_PASSWORD` privately and run `docker compose up -d postgres`; it binds host port 55432 on loopback. The container login is a migration owner only. Configure a separate runtime login; there is no automatic privileged application connection. Never reuse an unknown local database or production credentials. Stop the development container with `docker compose stop postgres` when finished; do not delete a volume that contains work you need.

After migration, the database owner can provision a demo worker login interactively in `psql`:

```sql
CREATE ROLE virtual_ink_worker_login LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
GRANT virtual_ink_worker TO virtual_ink_worker_login;
\password virtual_ink_worker_login
```

`\password` prompts privately; do not put a real password in a SQL file or command argument. Point `DATABASE_URL` at this login only when running the demo probe. Phase 2 must use a separate `virtual_ink_api` member login for HTTP application persistence, with the approved tenant policies; the worker login is not an HTTP identity. If a login already exists, inspect its grants instead of recreating or broadening it. Creating a test database and its owner is an explicit local administrator setup step; this foundation never automatically creates one on an existing server.

Rollback approach: apply to a fresh dedicated development/test database and preserve a backup before schema changes. There are no business tables in this migration. For a failed transaction, PostgreSQL rolls it back. After a committed migration, prefer restoring/recreating the dedicated development database after review; no destructive automatic down migration or role deletion is shipped.

## Auth approach

No authentication is implemented or simulated. Only liveness endpoints are public. Vendor, operator, delivery and customer private APIs do not exist. The next slice must choose verified identity/session handling, guest capability limits, active membership checks and server-derived tenant context. Client `vendor_id`, role fields, headers or totals are never authorization evidence. Operator access is purpose-bound and audited; DeliveryPartner must never access print files or design proofs. See [permissions plan](permissions-plan.md).

## Validation approach

`readJson` requires JSON content type, limits declared and streamed body size to 16 KiB, rejects malformed JSON/UTF-8, then invokes a typed validator. `strictObject` rejects unknown fields and prototype keys without echoing them. UUIDs, text and pagination are validated at boundaries. These are foundation helpers, not domain schemas or proof of authorization. Future forms can use React Hook Form/Zod; server validation remains authoritative. Add a dedicated upload boundary rather than increasing JSON limits for files.

## Error handling approach

`ApiError` uses a fixed code/status/message catalog. `handleApi` wraps success and failure, generates request IDs on the server and hides unknown exception details. Versioned API requests receive the same safe envelope in both adapters. Errors never return raw database messages, private inputs or stacks. Operational logs contain only event, request ID and status (plus startup metadata). Legacy `/health` and its original non-API error behavior remain compatible. See [API standards](api-standards.md).

## Audit logging approach

`createAuditEvent` accepts only explicit action, actor, tenant, resource, request and outcome fields; it generates event ID/time. User actions require actor and tenant UUIDs. `recordAudit` requires an explicit sink and fails with `AUDIT_UNAVAILABLE` when missing or failing. No business route uses a pretend console audit sink. The database table is a contract and is closed to runtime roles until the Phase 2 policy is approved.

Before any sensitive action, Mumba must connect authorization and a durable transactional audit sink. A helper call alone does not provide transaction consistency. No private files, full addresses, passwords, tokens, customer content or signed URLs belong in audit or operational logs. Retention, support access and read/export rules remain open.

Hosted config selection does not authorize a database connection or migration. Existing CLI database scripts are still restricted to local development/test databases. The managed deployment needs reviewed Supabase-generated migrations, verified grants and advisors before use; the locally named-database guard is intentionally preserved.

## Testing approach

Node tests cover original and versioned health, config rejection, safe error envelopes, streamed payload limits, strict field handling, bounded pagination, audit failure behavior, private key boundaries and demo-only job payloads. Tests use synthetic UUIDs and loopback, no real personal data. TypeScript backend checks can run via `npm run typecheck:web` after frontend development dependencies are installed.

SQL assertions cover migration presence, role flags, forbidden API/worker reads, RLS defaults, invalid audit/job inputs and permitted demo worker updates. They require a dedicated test database and are not counted as passing until executed. Next compilation, browser navigation/mobile checks and real storage tests must be recorded separately from backend unit tests.

## Next backend build order

1. Backend Phase 2: **roles, permissions and tenant model** for Customer or Guest, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner. Confirm guest limits and tenant semantics with Uchi.
2. Implement verified sessions, identity/membership schema, resource ownership and denial-by-default authorization; prove wrong-role, inactive-member, guessed-ID and cross-tenant cases.
3. Connect durable transaction-aware audits with the first protected action.
4. Choose private storage, retention and quarantine rules before accepting any file.
5. Receive Lubasi's verified discovery and Taizya's accepted flow before vendor/catalogue work.
6. Add server-side quotes only from approved rules; then orders, proofs and operational records, each as a tested vertical slice.

See [build plan](build-plan.md) for the frontend sequence and [validation notes](backend-validation.md) for observed results and blockers.

## Current follow-on implementation — 2026-10-09

[Backend Phase 2](backend-phase-2.md) and [trusted provisioning](trusted-provisioning.md)
now provide identity/tenant reads, hosted forced RLS, durable access audits, a private
onboarding CLI and commit audit constraints. Eight application tables have zero rows
after rollback tests. The complete root suite has 66 passing tests. Earlier local
infrastructure verification blockers remain specific to Phase 1 replay; hosted
Phase 2 isolation and provisioning assertions pass. Genuine Auth/pg/TLS, owned
PostgreSQL replay, Next build/browser QA and human approval remain pending.
