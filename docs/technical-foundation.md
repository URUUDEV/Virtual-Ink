# Virtual Ink technical foundation — Mumba's baseline plan

Current engineering update: [Backend Phase 2](backend-phase-2.md) now delivers a
narrow identity/tenant-access slice and hosted RLS tests. The wider module list is
still a roadmap; read [the team report](team-report.md) for actual results and owners.

Owner: Mumba Chitonge. Status: proposed architecture; Phase 1 local health/config/test baseline implemented. Final framework, database, identity provider, hosting and tenant semantics need recorded decisions with Uchi. Refer to BQ-02 and HB-02 in [open questions](open-questions.md).

**Current build update:** This document preserves the original role-handover proposal. The latest user brief adopts the Next.js/TypeScript and PostgreSQL direction. Current implementation, test evidence and remaining runtime blockers are recorded in [Backend Phase 1](backend-foundation.md), [the build plan](build-plan.md) and [validation notes](backend-validation.md). The original stack description below is historical; it is not the current completion report.

## Recommended architecture

Start with one modular backend and clear internal service boundaries. A future frontend calls the backend API. The backend validates identity, authorization and tenant scope before accessing persistent data or private object storage. Use a relational database for memberships and transactional records, and private object storage for print files. Select actual technologies after the stack and budget review. Avoid adding distributed services before a demonstrated need.

Current implementation: Node.js 24, built-in HTTP and test modules, npm, no third-party dependencies. `src/app.js` exposes only health and controlled error responses; `src/config.js` validates named settings; `src/server.js` starts the process and emits limited JSON runtime logs. There is no frontend, database, authentication, storage service or migration framework.

The initial code is a provisional local baseline, not a selected marketplace framework. Preserve the health contract and config validation if moving to an application framework. A dependency-aware readiness endpoint can follow after database setup; public responses must still omit infrastructure details and secrets.

## Backend modules

| Module | Responsibility | Current state / intended phase |
| --- | --- | --- |
| Health/configuration | Process health, validated settings, safe startup | Implemented Phase 1 |
| Identity and membership | Verified identity, memberships, role authorization | First approved Phase 2 slice |
| Tenant context | Authorized tenant selection and scoped data access | First approved Phase 2 slice |
| Audit | Durable, authorized business/security event records | Phase 2 design, implement with protected mutations |
| Private files | Access-controlled upload/download, validation and lifecycle | Phase 2 design; implementation requires policy decisions |
| Vendor/catalogue | Verified vendor data, approved offerings and capabilities | Later accepted feature slice |
| Pricing/quotes | Server calculation using approved versioned rules | Later; commercial decisions required |
| Requests/fulfilment | Accepted job states and authorized transitions | Later; UX/operations approval required |
| Operations/support | Approved delivery coordination, disputes and support | Later; live tracking excluded from Phase 1 |

Payment integration and printer automation are outside Phase 1. Do not create pretend integrations or placeholder vendor records that appear real.

## Database entities planned

These are design candidates, not a deployed schema. Exact keys and relationships depend on the approved tenant model.

| Entity | Proposed purpose | Key isolation/data notes |
| --- | --- | --- |
| User | External identity reference and minimal profile | No home-grown credential storage; membership controls tenant access |
| Tenant | Approved organization boundary | Meaning and ownership require BQ-02 |
| Membership | User, tenant, role and active status | Unique user/tenant relationship; validate roles and status |
| AuditEvent | Actor, tenant scope, action, resource, outcome and timestamp | Append-only access; no file bodies, secrets or payment evidence |
| FileRecord | Opaque storage key, owner, tenant, validation and retention status | Private object; no public permanent URLs |
| VendorProfile | Verified organization/service references | Tenant relation follows approved model |
| Service/Product | Approved capabilities and catalogue units | Vendor/tenant scope; no invented records |
| PriceVersion / Quote | Rule version and server-generated accepted amounts | Exact decimal or approved minor units with currency; never floating-point money |
| PrintRequest / StatusEvent | Requested work and explicit transition history | Tenant boundaries, customer ownership and vendor assignments need decisions |
| DeliveryRequirement | Confirmed collection/delivery requirements | Only approved zones/rules; no live tracking |
| VerificationRecord / SupportCase | Later authorized verification/support references | Private evidence; permissions and retention needed |

## Security rules

- Deny application access by default. Verify identity on the server and authorize each action and resource.
- Validate inputs at API boundaries and database constraints; use parameterized data access. Do not infer permissions from frontend visibility.
- Keep secrets in environment or approved secret storage; validate required settings, fail closed and never print secret values.
- Keep customer files and payment evidence private. Plan permitted formats/sizes, malware screening, quarantine, opaque keys, authorized short-lived download access and retention/deletion before upload work.
- Compute prices on the server from approved catalogue and rule versions. Reject client totals as an authority; retain the accepted calculation version. No pricing formula is implemented in Phase 1.
- Use TLS for deployment, explicit origin policy if needed, auth-appropriate CSRF controls, request/body limits, rate limits and safe error responses before externally exposing application routes.
- Keep production and development separate; use synthetic test data. Add backup/restore and dependency review when infrastructure is selected.
- Production access or releases require the team's ownership and review process. The local baseline is not deployment approval.

## Tenant isolation rules

1. Define tenant semantics and platform support exceptions with Uchi before adding persistence.
2. Derive tenant context from verified identity plus active server-side membership. A client tenant selector is only a requested context, never proof of access.
3. Require tenant scope in every tenant-owned query, mutation, object lookup, background task and cache key. Do not fetch by resource ID alone and authorize later.
4. Constrain relationships so child and parent belong to the same permitted scope. Use composite keys/constraints where suitable and database isolation controls supported by the chosen stack. Account for privileged service accounts explicitly.
5. Namespace private storage by tenant with opaque object keys; enforce access independently of the key. Limit any download grant to the authorized object and short expiry.
6. Make cross-tenant sharing or support access explicit, narrowly authorized and audited. A platform admin must not receive silent universal access.
7. Test two distinct tenants, inactive membership, role denial, guessed IDs, nested resources, lists, exports, cache access and file grants. No protected data or mutations may cross the approved boundary.

No tenant isolation is claimed by the health-only service because it stores and returns no tenant data.

## Audit requirements

Design durable audit records for membership and role changes, sensitive access and file actions, pricing rule changes, job state changes, verification, privileged support actions and denials where appropriate. Proposed fields: event ID, UTC timestamp, verified actor ID/type, tenant scope, action, resource type/opaque ID, outcome, request ID and minimal permitted change metadata.

Write required mutation events transactionally with the mutation or through an approved reliable delivery pattern. Define how audit failure affects the action; protected changes must not silently proceed without required evidence. Restrict read access and prevent application users from altering history. Decide retention, export, integrity controls and authorized deletion policy with Uchi.

Exclude credentials, authorization headers, cookies, customer file contents, full payment evidence and unnecessary personal data. The Phase 1 JSON events (`server_started`, `http_request_completed`, `server_stopped`) are operational logs only. Request completion logs record a generated request ID and status; they do not constitute durable business auditing.

## Testing approach

Current tests run through `npm test` using Node's built-in runner and temporary loopback ports. Cover config defaults and invalid values, minimal health responses, HEAD, unsupported methods, unknown paths, safe headers, request IDs and sensitive-input exclusion from logs. Startup and shutdown can be checked through a local process smoke check. No external credentials are required.

For Phase 2, add meaningful integration tests against an isolated test database once selected: migrations, foreign-key constraints, unauthenticated access, role denial, inactive membership, two-tenant boundaries, scoped mutations and audit persistence. Include rollback and failure paths. Add storage contract tests before uploads, and pricing tests against approved rules before quotes. Do not equate a passing health check with verified application security.

## Build sequence

1. Review the Phase 1 pack, local baseline and open decisions. Uchi and each lead acknowledge handover.
2. Mumba records stack/database/identity choices, proposes tenant semantics and a permission matrix; Uchi approves the product access model and narrow Phase 2 acceptance record.
3. Establish reproducible development/test infrastructure, migrations, verified identity integration and tenant memberships.
4. Implement tenant-scoped authorization and meaningful denial/isolation tests for the approved slice.
5. Establish durable audit behavior with the first protected mutations. Design private file contracts and resolve retention/validation policies before file endpoints.
6. Receive Uchi-approved operations facts and Taizya's accepted flow before vendor/catalogue work.
7. Build server-side quote and request slices only after commercial rules and acceptance criteria are confirmed.

Each step produces setup instructions, evidence, known limitations and a receiving-lead acknowledgement. Database work requires migration and rollback notes. Missing logos do not block any step.
