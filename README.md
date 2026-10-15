# Virtual Ink

Virtual Ink is a printing, design, custom merchandise and delivery platform being built by **Shadow Root Security Technologies**. Tagline: **Your Ideas. Our Print. Delivered.** This repository contains the role handover pack, **Backend Phase 1**, and the first branded Next.js application source foundation.

Shadow Root standard: secure systems, digital trust, clear documentation, tenant separation, private files, server-side pricing, audit logs, and professional handover.

## Start here

Current UI slice: [Public UI visualization](docs/ui-visualization.md): the supplied
HTML translated into a product-led homepage, searchable visual collection and six
product detail routes, now with a [local T-shirt concept editor](docs/tshirt-workspace.md).
Backend remains [caller-owned membership discovery](docs/membership-discovery.md),
following private provisioning, readiness and Backend Phase 2 identity/tenant access.
Read the [latest team report](docs/team-report.md) for each lead's starting point.

15 October verification: [testing target](docs/testing-target.md) adds a 95% gate
for inventoried backend/shared lines, branches and functions. All 167 root tests
pass at 99.02%/95.14%/97.84%; this is not full-product coverage or phase completion.
Source is pushed on `codex/phase-1-verification`; the protected
[Vercel Preview](https://virtual-8pfjihiax-shadowrootsec-5679.vercel.app) is Ready with
sampled homepage/shop success. Existing Production dynamic routes fail their
public-config startup guard. See the dated report for actual limits and blockers.

14 October hosting update: Uchi reports Vercel deployment and Supabase connection.
The new [multi-service configuration](docs/vercel-services.md) is locally tested:
public Next.js `web` calls internal Node `app` through an injected binding.
Service names/ingress/binding await Uchi's requested confirmation; hosted URLs and
the new deployed integration checks remain unverified.

14 October ownership and implementation: Uchi handles backend engineering and
product leadership; Mumba is inactive. Work through product phases sequentially.
Phase 1 now has [account entry and server session handling](docs/phase-1-account-access.md)
for registration/login/email confirmation/logout and a protected account page.
Hosted Auth is disabled pending private setup and genuine testing. The remaining
MVP order journey and every Vercel gate still block phase completion.

14 October strict QA: **all four product phases remain incomplete**. The MVP
order/quote/payment/delivery journey is unbuilt and Vercel deployment is unverified.
Current [phase audit](docs/reports/2026-10-14-phase-completion-audit.md) records
fresh tests/build/browser/SQL evidence and two fixed UI defects. Hosted catalog
now has 18 private tables and 10 migrations; the API readiness contract covers
the original nine tables. Provider bridge and genuine runtime connection remain open.

14 October: [vendor backend foundation review](docs/vendor-onboarding-foundation.md)
adds isolated portable SQL replay evidence and fixes empty pagination validation.
It remains disconnected from HTTP; genuine provider verification, hosted migration
and activation are pending. The public preparation flow stays local.

Role kickoff PDFs: [Mumba — backend](output/pdf/Virtual-Ink-Mumba-Backend-Kickoff-2026-10-09.pdf)
and [Taizya — UX](output/pdf/Virtual-Ink-Taizya-UX-Kickoff-2026-10-09.pdf).
Code and hosted RLS tests are delivered; genuine sign-in-to-API setup remains open.
Every completed build slice now includes a dated Markdown and Word team report.
Every meaningful step also includes [security review and evidence](docs/security-review.md).
The runtime patch gate passes on private, official-checksum-verified Node 24.21.0
used for the current preview. Default Node remains 24.14.1 and fails the gate.
Passing local checks does not establish production readiness.

Phase completion now requires local operation, passing tests and successful
Vercel hosting with the deployed URL in the completion report. Complete every
[Vercel verification item](docs/phase-completion-checklist.md) before marking any
phase complete. Current deployment evidence remains unverified.

| Document | Purpose |
| --- | --- |
| [Current build plan](docs/build-plan.md) | Starting scope, architecture and vertical slices |
| [Supplied-document baseline](docs/source-document-baseline.md) | Three supplied PDFs mapped to delivered code, missing APIs and build gates |
| [Membership read acceptance draft](docs/acceptance-phase-2-membership-read.md) | Next narrow Phase 2 endpoint, proposed contract and denial evidence |
| [Membership discovery](docs/membership-discovery.md) | Own-only list, pagination, audits, migrations and verification |
| [Backend Phase 2](docs/backend-phase-2.md) | Identity, tenant access, hosted migrations, tests and remaining runtime setup |
| [Trusted provisioning](docs/trusted-provisioning.md) | Private onboarding CLI, approval references, commit audits and live smoke setup |
| [Live backend setup](docs/live-backend-setup.md) | Disabled service accounts, safe environment initialization and secret-free readiness checks |
| [Latest team report](docs/team-report.md) | Current progress, Word report and starting instructions by role |
| [Recurring security review](docs/security-review.md) | Attack paths, recurring checks, fixes and release gates |
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
| [Phase completion and Vercel verification](docs/phase-completion-checklist.md) | Mandatory local, testing and deployed-URL gates for every phase |
| [Phase 1 completion checklist](docs/phase-1-completion-checklist.md) | Historical delivery evidence, mandatory hosting gate and pending approvals |
| [Repository inspection](docs/repository-inspection.md) | Starting state and setup decisions |

## Team

| Person | Role |
| --- | --- |
| Uchi Chinyama | Product, Project and Backend Lead |
| Mumba Chitonge | Inactive; no current tasks assigned |
| Taizya Nakapende | UX and Visual Design Lead |
| Lubasi Monde | Partnerships and Operations Lead |

## Scope and current state

12 October functional update: editable shirt designs can be downloaded/reopened,
and the current 3D shirt view exports as PNG. Vendor preparation adds explicit
device drafts, portable incomplete drafts, step-aware recovery and undo restore.
No server submission or account activation is enabled. See
[functional-workspace evidence](docs/reports/2026-10-13-functional-workspaces.md).

12 October vendor extension: [vendor profile preparation](docs/vendor-onboarding.md)
adds a three-step local form, review and explicit JSON download. Online submission,
real account activation and approval remain pending. Business and the footer link
to `/vendors/join`; no privileged vendor dashboard is exposed.

12 October editor extension: seven typefaces with visual samples and a rotatable
3D shirt share the local 2D design. Front/back/reset/zoom and keyboard rotation
are available; Download preview remains a 2D concept. See the
[font/3D report](docs/reports/2026-10-12-fonts-and-3d-shirt.md). Uchi reports artwork
working; automated texture/export and human acceptance checks remain open.

12 October follow-up: editor instruction contrast, input help and status naming
are improved. Rebuilt suites/build and 49 HTTP assertions pass; sampled focus,
safe text rejection and five responsive widths are verified. Live artwork and
complete accessibility/human acceptance remain open. See
[the latest review](docs/reports/2026-10-12-editor-accessibility-review.md).

12 October: the local front-only T-shirt workspace adds text/artwork placement,
undo/redo, explicit device drafts and PNG concept previews. On reviewed private
Node 24.21.0, 120 root tests, six React checks, 109 security regressions, TypeScript,
production build and 49 HTTP assertions pass. Browser text/history/device/export
and responsive checks pass; live raster import and complete accessibility/human
acceptance remain pending. See [the dated report](docs/reports/2026-10-12-tshirt-workspace.md).

11 October UI verification: 111 backend/catalogue tests, five React rendering
checks, 100 security regressions, TypeScript and production build pass on reviewed
private Node 24.21.0. Forty-five HTTP assertions and sampled Chrome controls/layout
checks pass. Showcase image containment and unknown-product HTTP 404 are fixed.
Full accessibility, bundle review and human acceptance remain open; see the
[dated report](docs/reports/2026-10-11-ui-build-verification.md).
Prior security review: 105 backend tests and the 100-test security subset pass.
Web/shared and strict backend TypeScript pass; the runtime patch gate fails on
installed Node 24.14.1 and requires the reviewed 24.21.0 baseline or newer stable
24.x. See the latest security report for fixes, evidence and remaining gates.
Prior membership slice: 90 backend tests pass, web/shared and strict backend TypeScript pass, and
hosted discovery/isolation checks pass. There are nine private application tables
and eight Phase 2 migrations. Frontend dependencies/lockfile are now present;
Next build failed with spawn EPERM. Browser and genuine Auth-to-API verification
remain pending. Earlier installation failures below are historical.

Runnable now: dependency-free Node.js 24 backend with shared TypeScript helpers, `/health`, `/api/v1/health`, safe config/error handling, bounded request validation, a fail-closed audit interface and private-file contracts. Backend tests require no dependency install. Health is process liveness, not database/storage readiness.

Source delivered for the next verified steps includes PostgreSQL infrastructure, permission assertions, a labelled no-op demo job/seed and the branded Next.js application. Hosted Phase 2 isolation/provisioning evidence is retained. Frontend TypeScript, production build and sampled live UI checks now pass. Full accessibility and the original local Phase 1 database replay remain open; see validation notes. No genuine application database/Auth connection or storage bucket is verified.

The build excludes full marketplace, checkout, server uploads, dashboards, customer mobile account UI, real payments, live tracking, messaging, printer control and production deployment. Vendor/pricing/commission/tax/coverage rules remain open. Backend Phase 2 now adds narrow identity/tenant-access policies and durable allowed-read audits; live setup and expanded workflows remain pending. Operational status logs are separate from these business audits.

The repository is at `D:\Work\Projects\virtual-ink`. Preserve `asssets/` (the supplied spelling). The approved logo is used unchanged; reference boards are clearly labelled concepts, not live products, prices or functioning controls. No replacement images are generated.

Supabase-managed PostgreSQL is the initial hosted backend direction. The free-tier development project `odgxcuwueessxfsoveza` is active in `eu-west-1` at `https://odgxcuwueessxfsoveza.supabase.co`. The 14 October catalog verifies 18 private application tables with enabled/forced RLS and 10 migrations, including vendor core/commands. All 18 table counts are zero after rollback tests. The original API readiness contract still checks nine foundation tables. Root pg 8.23.1 is installed. Vendor provider bridge, HTTP intake, restricted runtime logins/CA, genuine Auth and private Storage remain unverified/disabled. The two hosted vendor migration versions need repository reconciliation. Application tables/permissions remain standard PostgreSQL and server-owned so the database can move to owned PostgreSQL later.

## Run locally

Prerequisites for the backend: Node.js **24.21.0 or a later stable 24.x patch**, npm and a terminal. Root scripts/tests use built-in Node modules and native TypeScript execution; no install step is required. Frontend packages live separately in `apps/web`. Default Node 24.14.1 fails the gate; use the verified private 24.21.0 runtime following [setup notes](docs/live-backend-setup.md). Durable default/deployment runtime patching remains open.

`npm run setup:init` safely creates disabled .env and .private/provisioning.env
templates only when missing. `npm run setup:check` reports setup blockers without
network access or secret values. Add `-- --database` for explicit read-only database
checks after configuration passes. Follow [the private setup guide](docs/live-backend-setup.md)
to configure the created NOLOGIN service accounts; genuine login remains unverified.

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
`/api/v1/tenants/:tenantId/access` and `/api/v1/memberships` return 401 without a bearer token and 503 for a
token when identity infrastructure is disabled. To activate the development slice,
follow [Phase 2 setup](docs/backend-phase-2.md): install `pg` with an actual lockfile,
configure a restricted non-owner API login and verified CA, then provision an
approved application identity/membership. No role or vendor context is accepted
from client headers. Health remains process liveness only.

Private provisioning is separate from the API process. Safe preview:

```powershell
npm run admin:provision -- preview examples/provisioning/create-account.demo.json
```

The demo file is preview-only and cannot be applied. Real apply needs reviewed
external approval references, a separate restricted login and a genuine token
passed through stdin. See [provisioning setup](docs/trusted-provisioning.md).
`npm run test:auth:live` is an explicitly configured genuine login smoke script;
it has not passed here. Keep provisioning credentials out of web/server environments.

## Next.js frontend setup

On a machine with npm registry access:

```powershell
npm install --prefix apps/web
npm run typecheck:web
npm run test:web
npm run build:web
npm run dev:web
```

Visit `http://127.0.0.1:3001`. An `apps/web/package-lock.json` and Next-generated
TypeScript setup changes are present from local work. Build, type check and sampled
Chrome checks now pass; complete accessibility/human review remains open. The earlier
agent installation failed through the registry proxy. Next uses
`apps/web/.env.local` for optional server settings, not root `.env`. Keep all
secrets server-side; the preview needs none.

The visible routes are `/`, `/shop`, six pre-rendered `/shop/[slug]` details, `/design-services`, `/business`, `/vendors/join`, `/how-it-works` and `/roadmap`. Unknown product slugs return HTTP 404. The homepage and shop use six supplied mockups. Search/filter/reset, illustrative-price sorting, manual showcase navigation and mobile Escape/focus return pass sampled live checks. Prices remain demo references. Privileged vendor/admin routes are not exposed in customer navigation. See [UI visualization](docs/ui-visualization.md) for evidence and the remaining acceptance checklist.

The T-shirt detail also links to `/customize/cotton-t-shirt`. This local concept
editor saves explicitly in the browser and exports an illustrative PNG preview.
It sends no artwork to a server. See [workspace scope and review checklist](docs/tshirt-workspace.md).

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

After each meaningful step, follow [the security review procedure](docs/security-review.md):
`npm run security:check`, `npm run security:runtime` and `npm run test:security`.
These are scoped checks; genuine Auth/pg/TLS, browser/bundle verification and release
review remain separate gates. Record blocked checks honestly in the team report.

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

Uchi and Mumba review the implemented identity/tenant and private provisioning
slices, resolve restrictive defaults, configure reviewed onboarding and complete
real login-to-API verification.
Use the [supplied-document baseline](docs/source-document-baseline.md) and its next
prompt for the remaining membership read/lifecycle and scoped audit-review slices.
The supplied escrow specification applies later to simulation behind its build
gates. Full marketplace
development needs accepted criteria, UX handover and verified operations facts.
