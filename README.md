# Virtual Ink

Virtual Ink is a planned print services platform by **Shadow Root Security Technologies**. This repository delivers **Phase 1: Role Handover and Build Foundation** so Uchi, Mumba, Taizya, and Lubasi can work in a clear sequence before marketplace development starts.

Shadow Root standard: secure systems, digital trust, clear documentation, tenant separation, private files, server-side pricing, audit logs, and professional handover.

## Start here

| Document | Purpose |
| --- | --- |
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

Delivered: Markdown handover pack and a dependency-free Node.js HTTP service with `GET /health`, `HEAD /health`, validated environment settings, safe request metadata, and automated tests. The service does not connect to a database or external service. Health reports that the HTTP process responds; it does not assert database or deployment readiness.

Phase 1 excludes the full marketplace, real payments, live delivery tracking, and automatic printer control. Vendor identities, prices, commissions, tax rules, launch location and partners are unconfirmed. Auth, tenant persistence, private object storage, server-side pricing and durable audit events are Phase 2 requirements described in the technical plan; they are not implemented here. Runtime logs are not durable business audit records.

No existing Virtual Ink repository was identified in the inspected workspace locations. This standalone foundation was created at `D:\Work\Projects\virtual-ink`. The Node.js baseline is provisional; Mumba must record the application stack decision before adding dependencies or feature modules. No image assets were found for Virtual Ink; use text placeholders. Branding does not block work.

## Run locally

Prerequisites: Node.js **24.x**, npm bundled with Node.js, and a terminal. npm is the package manager. There are no third-party dependencies and no install step is required.

```powershell
Set-Location D:\Work\Projects\virtual-ink
Copy-Item .env.example .env
npm start
```

The default address is `http://127.0.0.1:3000`. In a second terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
```

Expected JSON: `{"service":"Virtual Ink","status":"ok"}`. Stop the service with Ctrl+C. `npm run dev` restarts the server when source files change. `.env` is optional; the same defaults apply when it is absent. Copy it only for initial setup so existing settings are preserved.

| Setting | Default | Validation |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `HOST` | `127.0.0.1` | IPv4 or IPv6 address |
| `PORT` | `3000` | Integer from 1 to 65535 |

Invalid settings fail before the service starts, without printing supplied values. A port already in use produces `server_error`; change `PORT` to another valid local port. The default loopback binding keeps development access local. An externally reachable deployment requires Mumba's hosting, TLS and access review; setting `NODE_ENV=production` alone does not make this service production ready.

## Tests and documentation

```powershell
npm test
```

Tests use Node's built-in runner in a single process (`--test-isolation=none`) and temporary loopback ports, so environments that restrict child process spawning can run them. Tests do not modify global environment settings. They cover configuration rejection, health behavior, HTTP methods, unknown routes, response headers, request IDs and exclusion of sensitive inputs from request logs. No credentials or external network services are needed. Open this README and the `docs/` files in an editor with Markdown preview to view the handover pack.

## Repository structure

```text
docs/             Handover, templates, task board, decisions and review checklist
src/config.js     Environment validation
src/app.js        HTTP health endpoint and request metadata
src/server.js     Startup, JSON runtime logs and graceful shutdown
test/             Configuration and HTTP tests
.env.example      Non-secret local defaults
```

Keep secrets, uploaded documents, real vendor contact data and payment evidence out of Git. `.private/`, `uploads/` and `storage/` are ignored as a precaution; ignoring a directory does not enforce file access. Use approved restricted storage for operational records. The handover docs contain templates and decision references only.

The Git repository uses branch `main` and remote `origin` at `https://github.com/URUUDEV/Virtual-Ink.git`, configured at Uchi's request after the foundation delivery. Repository access, review rules and board ownership still need team acknowledgement.

## Next step

Uchi assigns and reviews the tasks in [the task board](docs/task-board.md). Use Mumba's Phase 2 prompt in [the role prompts](docs/role-prompts.md) after the initial tenant model and stack decisions are recorded. Full marketplace development needs approved acceptance criteria, UX handover and verified operations requirements.
