# Virtual Ink

Virtual Ink is a printing, design, custom merchandise and delivery platform being built by **Shadow Root Security Technologies**. Tagline: **Your Ideas. Our Print. Delivered.** This repository contains the role handover pack, **Backend Phase 1**, and the first branded Next.js application source foundation.

Shadow Root standard: secure systems, digital trust, clear documentation, tenant separation, private files, server-side pricing, audit logs, and professional handover.

## Start here

Current slice: [Backend Phase 2 identity and tenant access](docs/backend-phase-2.md).
Read the [latest team report](docs/team-report.md) for each lead's starting point.
Code and hosted RLS tests are delivered; genuine sign-in-to-API setup remains open.
Every completed build slice now includes a dated Markdown and Word team report.

| Document | Purpose |
| --- | --- |
| [Current build plan](docs/build-plan.md) | Starting scope, architecture and vertical slices |
| [Backend Phase 2](docs/backend-phase-2.md) | Identity, tenant access, hosted migrations, tests and remaining runtime setup |
| [Latest team report](docs/team-report.md) | Current progress, Word report and starting instructions by role |
| [Supabase and owned-database plan](docs/supabase-migration-plan.md) | Initial hosted provider, portable boundaries and later migration checklist |
| [Backend foundation](docs/backend-foundation.md) | Pre-edit inspection, delivered modules, setup and next backend order |
| [Permissions plan](docs/permissions-plan.md) | Customer/Guest, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner |
| [API standards](docs/api-standards.md) | Responses, errors, validation, authorization, audit, IDs and pricing |
| [Validation notes](docs/backend-validation.md) | Actual results and blocked checks |
| [Phase 1 handover](docs/phase-1-handover.md) | Scope, roles, work sequence, review rules, definition of done |
| [Task board](docs/task-board.md) | Tasks grouped by role, dependencies, status rules, work item template |
| [Role prompts](docs/role-prompts.md) | Copyable prompts for each lead and weekly review |
| [Technical foundation](docs/technical-foundation.md) | Mumba's architecture proposal, security baseline, build sequence |
| [Acceptance template](docs/acceptance-template.md) | Uchi's feature requirements and signoff record |
| [UX handover template](docs/ux-handover-template.md) | Taizya's flows, screens, states, accessibility and handoff |
| [Operations handover template](docs/operations-handover-template.md) | Lubasi's vendor and delivery discovery |
| [Open questions](docs/open-questions.md) | Unconfirmed business, infrastructure and policy decisions |
| [Completion checklist](docs/phase-1-completion-checklist.md) | Delivery evidence and pending team approvals |
| [Repository inspection](docs/repository-inspection.md) | Starting state and setup decisions |

## Team

| Person | Role |
| --- | --- |
| Uchi Chinyama | Product and Project Lead |
| Mumba Chitonge | Technical Lead |
| Taizya Nakapende | UX and Visual Design Lead |
| Lubasi Monde | Partnerships and Operations Lead |

## Scope and current state

Runnable now: dependency-free Node.js 24 backend with shared TypeScript helpers, `/health`, `/api/v1/health`, safe config/error handling, bounded request validation, a fail-closed audit interface and private-file contracts. Backend tests require no dependency install. Health is process liveness, not database/storage readiness.

Source delivered for the next verified steps: PostgreSQL infrastructure migration, permission assertions, a labelled no-op demo job/seed, and a Next.js/React/TypeScript shell with the approved logo, Poppins, Tailwind, Lucide, homepage and searchable category preview. Frontend installation/build/browser verification and SQL runtime checks are blocked in this session; see validation notes. No real database/storefront/auth connection or storage bucket is configured.

The build excludes full marketplace, checkout, uploads, dashboards, customer mobile account UI, 3D preview, real payments, live tracking, messaging, printer control and production deployment. Vendor/pricing/commission/tax/coverage rules remain open. Backend Phase 2 now adds narrow identity/tenant-access policies and durable allowed-read audits; live setup and expanded workflows remain pending. Operational status logs are separate from these business audits.

The repository is at `D:\Work\Projects\virtual-ink`. Preserve `asssets/` (the supplied spelling). The approved logo is used unchanged; reference boards are clearly labelled concepts, not live products, prices or functioning controls. No replacement images are generated.

Supabase-managed PostgreSQL is the initial hosted backend direction. The free-tier development project `odgxcuwueessxfsoveza` is active in `eu-west-1` at `https://odgxcuwueessxfsoveza.supabase.co`. Backend Phase 2 has added seven private application tables, scoped RLS, identity/tenant access and durable read audits. There are zero business rows after rolled-back security tests. Runtime driver/login, genuine Auth verification and private Storage setup remain open. Application tables/permissions remain standard PostgreSQL and server-owned so the database can move to owned PostgreSQL later.

## Run locally

Prerequisites for the backend: Node.js **24.x**, npm and a terminal. Root npm scripts and tests use built-in Node modules and native TypeScript execution; no install step is required. Frontend packages live separately in `apps/web`.

```powershell
Set-Location D:\Work\Projects\virtual-ink
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

The default address is `http://127.0.0.1:3000`. In a second terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/api/v1/health
```

Expected JSON: `{"service":"Virtual Ink","status":"ok"}`. Stop the service with Ctrl+C. `npm run dev` restarts the server when source files change. `.env` is optional; the same defaults apply when it is absent. Copy it only for initial setup so existing settings are preserved.

The versioned endpoint wraps this payload in `{ data, meta: { requestId } }`; errors under `/api/` use the shared safe envelope. The original `/health` stays compatible.

| Setting | Default | Validation |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `HOST` | `127.0.0.1` | IPv4 or IPv6 address |
| `PORT` | `3000` | Integer from 1 to 65535 |

Invalid settings fail before the service starts, without printing supplied values. A port already in use produces `server_error`; change `PORT` to another valid local port. The default loopback binding keeps development access local. An externally reachable deployment requires Mumba's hosting, TLS and access review; setting `NODE_ENV=production` alone does not make this service production ready.

Optional jobs/storage settings are disabled by default. See `.env.example` and the backend documentation. File access remains closed regardless of the config flag until authorization and a provider adapter are implemented.

`AUTH_ENABLED=false` is the default. `/api/v1/me` and
`/api/v1/tenants/:tenantId/access` return 401 without a bearer token and 503 for a
token when identity infrastructure is disabled. To activate the development slice,
follow [Phase 2 setup](docs/backend-phase-2.md): install `pg` with an actual lockfile,
configure a restricted non-owner API login and verified CA, then provision an
approved application identity/membership. No role or vendor context is accepted
from client headers. Health remains process liveness only.

## Next.js frontend setup

On a machine with npm registry access:

```powershell
npm install --prefix apps/web
npm run typecheck:web
npm run build:web
npm run dev:web
```

Visit `http://127.0.0.1:3001`. These steps still need successful execution: this session could not install the selected dependencies. Commit the real `apps/web/package-lock.json` generated by installation; no fabricated frontend lockfile is provided. Next uses `apps/web/.env.local` for optional server settings, not root `.env`. Keep all secrets server-side; the preview needs none.

The visible routes are `/`, `/shop`, `/design-services`, `/business`, `/how-it-works` and `/roadmap`. They label preview functionality, and provide search/filter/reset, mobile navigation and a real health-status check. There are no simulated payment or order completion messages. Protected vendor/admin routes are not created or exposed in customer navigation.

## PostgreSQL infrastructure

For Supabase, follow [the managed-provider plan](docs/supabase-migration-plan.md). `.env.example` selects Supabase but leaves hosted URLs unset, so local health/tests still work. Hosted URLs require the selected project, matching connection mode and verified TLS settings. No Supabase key is needed for health. The existing database CLI commands below remain **local-only**; they must not be pointed at a Supabase project until the hosted migration workflow is reviewed.

Install the PostgreSQL client and use a dedicated local development/test database. Docker users can set `POSTGRES_PASSWORD` privately and start `docker compose up -d postgres`, which binds loopback port 55432. The container account owns migrations; it is not the application login.

```powershell
# Configure the named private URLs in .env first; examples are commented there.
npm run db:migrate
npm run db:seed
npm run test:db
npm run jobs:once
```

Migration/seed need `MIGRATION_DATABASE_URL`, tests need `TEST_DATABASE_URL` pointing to `virtual_ink_test`, and the probe needs a restricted worker `DATABASE_URL`. Scripts reject non-local hosts and databases outside the two named development/test databases. Seed data contains only a synthetic no-op probe. Database runtime verification is pending because Docker was stopped and the isolated Windows PostgreSQL test server could not start. No existing database was modified.

## Tests and documentation

```powershell
npm test
```

Tests use Node's built-in runner in a single process (`--test-isolation=none`) and temporary loopback ports. They cover health, config, error privacy, bounded validation, audit failure, closed file access and demo-only job contracts. No credentials or external services are needed. Native TypeScript execution strips types; it is not a semantic type check. After frontend dependencies install, `npm run typecheck:web` checks UI and shared backend types. Open the `docs/` files in Markdown preview for the handover pack.

## Repository structure

```text
docs/             Handover, templates, task board, decisions and review checklist
apps/web/         Next.js/React application and API Route Handlers
asssets/          Supplied approved logo and concept reference boards
src/backend/      Shared TypeScript API/config/audit/storage/job contracts
src/config.js     Compatibility export for shared config
src/app.js        Independent Node HTTP adapter
src/server.js     Startup, JSON runtime logs and graceful shutdown
database/         Infrastructure migration, SQL assertions, demo seed/probe
scripts/          Safe dedicated-database commands
test/             Backend JS/TypeScript contract and HTTP tests
.env.example      Non-secret local defaults
```

Keep secrets, uploaded documents, real vendor contact data and payment evidence out of Git. `.private/`, `uploads/` and `storage/` are ignored as a precaution; ignoring a directory does not enforce file access. Use approved restricted storage for operational records. The handover docs contain templates and decision references only.

The Git repository uses branch `main` and remote `origin` at `https://github.com/URUUDEV/Virtual-Ink.git`, configured at Uchi's request after the foundation delivery. Repository access, review rules and board ownership still need team acknowledgement.

## Next step

Uchi and Mumba review the implemented identity/tenant slice, resolve restrictive
defaults and complete trusted provisioning plus real login-to-API verification.
Use the next prompt in [the team report](docs/team-report.md). Full marketplace
development needs accepted criteria, UX handover and verified operations facts.
