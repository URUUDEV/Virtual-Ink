# Virtual Ink starting build plan

Uchi Chinyama and Mumba Chitonge coordinate each accepted vertical slice. Taizya Nakapende supplies UX evidence; Lubasi Monde supplies verified operations facts. This sequence combines the backend foundation brief with the master UI direction without treating all future modules as completed work.

## Current slice boundaries

**Backend Phase 1:** health, config, standard errors, validation, audit helper, private-file contracts, demo-only queue/migration/seed, tests and documentation. **UI foundation:** approved logo, tokens, Poppins, reusable navigation/buttons, homepage and responsive shell, a searchable category taxonomy and explanatory destination pages. No account/cart/vendor/admin controls are exposed before their approved slice exists.

The architecture is a combined Next.js web/API application in `apps/web`, with shared TypeScript backend code in `src/backend`. A dependency-free Node adapter remains available for local backend development. PostgreSQL is the persistent-data direction; private S3-compatible storage is a contract pending provider choice. Background jobs currently support only a clearly labelled synthetic no-op probe.

**Provider update:** Start hosted backend work with Supabase-managed PostgreSQL. The free-tier development project `odgxcuwueessxfsoveza` is active in `eu-west-1`, but it is intentionally empty. Keep standard application SQL, server-owned permissions and repository interfaces so the database can move to owned PostgreSQL later. Supabase Auth/Storage stay behind adapters; their exit paths require separate preparation. See [Supabase migration plan](supabase-migration-plan.md). Hosted schema migration and application connection verification are not yet performed.

The supplied `asssets/` spelling is preserved. `Virtual Ink Gradient Logo.png` is used unchanged, via a shared component. The showcase board is displayed only as a labelled concept reference; its screens, product mockups and illustrative prices are not live controls or commercial facts. No new image or replacement logo is generated. The two remaining boards guide later customizer/vendor slices.

## Build sequence and gates

| Slice | Deliverable | Required verification / gate | Current status |
| --- | --- | --- | --- |
| 1 — Backend Phase 1 | Shared health, config, validation, errors, audit/storage contracts; infrastructure SQL and demo seed | Node tests, type checks, dedicated SQL assertions | Backend tests/type check pass; SQL runtime blocked locally |
| 2 — Brand/application shell | Supplied logo, tokens, responsive shell and homepage; honest taxonomy preview | Install dependencies, TypeScript, Next build, keyboard/mobile/browser checks, every visible link | Source created; install/build/browser checks blocked |
| 3 — Backend Phase 2 | Customer/Guest, VendorOwner, VendorStaff, PlatformOperator, DeliveryPartner identity and tenant model | Uchi-approved permission matrix; denial, inactive membership and two-tenant tests; durable audit integration | Planned, not implemented |
| 4 — Marketplace discovery | Verified storefronts, bounded catalogue/search and product details; server quote contracts | Lubasi evidence; Uchi criteria; Taizya UX; authorized API integration | Planned |
| 5 — Private design/customization | Private validated/quarantined files, briefs/proofs and T-shirt editor | Retention/access policy; file isolation/audit tests; editor persistence; true model or labelled 2D fallback | Planned |
| 6 — Customer journey | Approved account, cart/order and payment-record UI; clear simulated/live boundaries | Real server price authority; no fake payment success; accepted collection/delivery rules | Planned |
| 7 — Vendor portal | Approved queue, assignment, production and earnings views | Vendor isolation, staff permissions, proof/file access tests | Planned |
| 8 — Operator tools | Vendor review, support, reconciliation, audit and delivery coordination | Purpose-bound operator permissions; delivery file/proof exclusion; sensitive audit evidence | Planned |

Do not implement subsequent slices until their prerequisites and verification are ready. The current frontend source can be prepared while environment dependencies are blocked, but its visual behavior is not signed off. shadcn/ui primitives, React Hook Form/Zod, Motion, Zustand, React Three Fiber and Three.js will be introduced when actual interactive components/forms/editor work require them; installing them all before those slices adds no completed behavior.

## Acceptance for the starting build

- Original health contract preserved, versioned responses safe and consistent, invalid configuration rejected.
- Request parsing has actual streamed size limits and rejects unknown fields without reflecting private input.
- Audit helper cannot silently succeed without an explicit sink. No sensitive-data route is open.
- Migrations and fixtures contain no real vendor, customer, payment, delivery, tax or pricing data.
- Frontend uses approved assets and exact brand palette. Public navigation connects to existing source routes; unknown pages have a clear fallback.
- UI clearly labels its preview status; no ordering, quote, payment, verification or fulfilment success is fabricated.
- Desktop/mobile, keyboard focus, screen-reader status, contrast and overflow are checked after the frontend can run.
- Evidence and limitations are recorded in [validation notes](backend-validation.md); Uchi approval remains a separate human review.

## Next prompt — Backend Phase 2

```text
Help Uchi Chinyama and Mumba Chitonge build Virtual Ink Backend Phase 2: roles, permissions and tenant model for Customer or Guest, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner. Inspect the current repo, then read docs/backend-foundation.md, docs/permissions-plan.md, docs/api-standards.md and docs/open-questions.md. Confirm the unresolved guest and tenant decisions with Uchi and record the accepted permission matrix. Implement verified identity/session handling, user/tenant/membership schema and least-privilege resource authorization in one narrow slice, with reproducible migrations and clearly labelled synthetic fixtures. Derive vendor/tenant scope server-side; never trust vendor_id, role fields or client totals. Prove unauthenticated denial, inactive membership, wrong role, guessed IDs, cross-tenant lists and mutations, and delivery exclusion from all print files and proofs. Connect durable transactional audit recording for the first protected action. Preserve health/config contracts. Do not add catalogue, checkout, uploads, payments, courier integration, messaging or printer automation. Run the relevant tests and report actual evidence, remaining decisions, setup/rollback notes and the handover for Uchi.
```
