# Virtual Ink starting build plan

Vercel services addition, 14 October: [setup](vercel-services.md) defines public
web and internal app with a runtime caller-owned binding. Local code/build/router
checks pass; confirm service graph and verify actual Preview/Production before
using the change as phase completion evidence.

Uchi Chinyama owns backend engineering and product leadership as of 14 October 2026; Mumba is inactive. Taizya Nakapende supplies UX evidence; Lubasi Monde supplies verified operations facts. Work through the full product phases in order, starting with the Phase 1 MVP. Each slice has verification and a report; phase closure additionally requires the full user flow and Vercel evidence.

First MVP slice: [account access](phase-1-account-access.md) adds real provider
integration code with local synthetic verification, while genuine hosted Auth remains
disabled. Next: application role mapping, private file/order persistence, vendor quotes,
admin manual status workflow and Vercel Preview/Production E2E verification.

## Current slice boundaries

2026-10-14 strict QA: Uchi's product MVP/Trust/Marketplace/Differentiation checklists
are broader than existing Backend Phase 1/2 slice names. All product phases are
incomplete; full order-to-delivery and Vercel verification are missing. Use the
[criterion-by-criterion audit](reports/2026-10-14-phase-completion-audit.md) to
prioritize Auth/private files/order/quote/manual-status work. Public/local editor
delivery and synthetic SQL success do not replace those flows or human acceptance.

2026-10-14: the unfinished vendor backend foundation has isolated PostgreSQL 18
replay/rollback evidence and corrected empty pagination validation. Provider bridge,
HTTP intake and hosted migration remain pending. See
[foundation scope](vendor-onboarding-foundation.md) and
[review evidence](reports/2026-10-14-vendor-foundation-review.md).

2026-10-12 functional update: local work can be exported and resumed. Shirt JSON
imports preserve undo and decode before replacement; current 3D angles export as
PNG. Vendor drafts support explicit device/file saving, safe recovery and undo
restore. Final review confirmation is renewed. No new backend authority is added.
See [functional evidence](reports/2026-10-13-functional-workspaces.md).

2026-10-12 vendor extension: public profile preparation, bounded declared
capabilities, review and JSON download are delivered. The form does not submit or
provision accounts. Genuine Auth, approved vendor checks and private activation
remain separate gates. See [onboarding scope](vendor-onboarding.md).

2026-10-12 editor extension: bundled font samples and a rotatable procedural 3D
concept shirt share local design placement. Version-1 drafts remain compatible;
PNG export stays 2D. See [font/3D evidence](reports/2026-10-12-fonts-and-3d-shirt.md).
Human acceptance and production garment specifications remain open.

2026-10-12 follow-up: editor instruction contrast, input help and status naming
are improved. Rebuilt tests/build/HTTP and sampled focus/error/responsive checks
pass. Browser artwork import and complete assistive-technology/human review
remain open. See [accessibility review](reports/2026-10-12-editor-accessibility-review.md).

2026-10-12: continued the local front-only T-shirt editor already in the workspace.
Text/artwork placement, undo/redo, explicit device drafts and PNG preview source
are delivered for review. Build/type checks, 120 root tests, six React checks,
109 security regressions and 49 HTTP assertions pass. Sampled browser text,
history, device, export and layout checks pass; browser artwork import and full
accessibility/human acceptance remain open. See [workspace scope](tshirt-workspace.md)
and [dated evidence](reports/2026-10-12-tshirt-workspace.md). Server uploads remain closed.

2026-10-11: production UI build and 45 HTTP assertions pass on verified private
Node 24.21.0. Chrome controls/layout probes pass; complete accessibility and human
acceptance remain open. Image-stage containment and unknown-product status were
fixed. See [current verification](reports/2026-10-11-ui-build-verification.md).

2026-10-09: The three supplied PDFs now guide the sequence through
[the supplied-document baseline](source-document-baseline.md). Backend Phase 2
implements narrow identity/tenant access and private audited provisioning.
Caller-owned membership discovery is now delivered with hosted isolation/audit
checks. Complete genuine login verification, reviewed lifecycle controls and
scoped audit review before closing Phase 2.
[The team report](team-report.md) contains each lead's starting point. Every
completed slice includes Word/Markdown reports; human signoff remains pending.

**Backend Phase 1:** health, config, standard errors, validation, audit helper, private-file contracts, demo-only queue/migration/seed, tests and documentation. **UI foundation:** approved logo, tokens, Poppins, reusable navigation/buttons, homepage and responsive shell, a searchable category taxonomy and explanatory destination pages. No account/cart/vendor/admin controls are exposed before their approved slice exists.

The architecture is a combined Next.js web/API application in `apps/web`, with shared TypeScript backend code in `src/backend`. A dependency-free Node adapter remains available for local backend development. PostgreSQL is the persistent-data direction; private S3-compatible storage is a contract pending provider choice. Background jobs currently support only a clearly labelled synthetic no-op probe.

**Provider update:** Supabase-managed PostgreSQL hosts the new private identity/tenant schema in development project `odgxcuwueessxfsoveza` (eu-west-1), with zero business rows after rollback tests. Standard application SQL, server-owned permissions and repository interfaces preserve the owned PostgreSQL direction. Auth/Storage remain separate adapters. See [Supabase migration plan](supabase-migration-plan.md). Genuine Auth-to-runtime connection verification still requires setup.

The supplied `asssets/` spelling is preserved. `Virtual Ink Gradient Logo.png` is used unchanged, via a shared component. On 10 October the supplied HTML was translated into native homepage/catalogue/detail components using six extracted product mockups. The full showcase board is no longer used as the homepage UI. Illustrative prices are labelled; there is no live catalogue, vendor assertion or quote authority. No new image or replacement logo is generated. The remaining boards guide later customizer/vendor slices. See [UI visualization](ui-visualization.md) for rendering evidence and pending browser checks.

## Build sequence and gates

Every phase also requires [local operation, passing tests and Vercel verification](phase-completion-checklist.md),
with the actual deployed URL included in its completion report. Successful local
slices can remain delivered for review; they do not close a phase. Missing hosted
Auth, storage or customer/vendor/admin dashboard checks remain blockers.

| Slice | Deliverable | Required verification / gate | Current status |
| --- | --- | --- | --- |
| 1 — Backend Phase 1 | Shared health, config, validation, errors, audit/storage contracts; infrastructure SQL and demo seed | Node tests, type checks, dedicated SQL assertions | Backend tests/type check pass; SQL runtime blocked locally |
| 2 — Brand/application shell | Supplied logo, tokens, responsive shell, homepage and six-product preview | TypeScript, Next build, HTTP and keyboard/mobile/browser checks; human UX review | Build/TypeScript, 45 HTTP assertions and sampled Chrome probes pass on private Node 24.21.0; full accessibility/human acceptance pending |
| 3 — Backend Phase 2 | Identity/tenant access, membership list/lifecycle and restricted audit review | Permission review; genuine login; cross-tenant read/write, revocation and audit evidence | Access/provisioning/membership list verified; lifecycle/audit-review APIs and live setup remain |
| 4 — Marketplace discovery | Verified storefronts, bounded catalogue/search and product details; server quote contracts | Lubasi evidence; Uchi criteria; Taizya UX; authorized API integration | Planned |
| 5 — Private design/customization | Private validated/quarantined files, briefs/proofs and T-shirt editor | Retention/access policy; file isolation/audit tests; editor persistence; true model or labelled 2D fallback | Local 2D editor plus interactive procedural 3D concept and bundled font choices delivered for review; artwork/UX acceptance pending; private server files/briefs/proofs remain planned |
| 6 — Escrow simulation | Append-only ledger, state machine, manual verification, dispute/refund/release and reconciliation | Approved quote/order contracts; complete transitions; balancing, idempotency/concurrency and denial tests; no live funds | Planned from supplied escrow specification; unresolved policy/state decisions |
| 7 — Customer journey | Approved account, cart/order and payment-record UI; clear simulated/live boundaries | Real server price authority; no fake payment success; accepted collection/delivery rules | Planned |
| 8 — Vendor portal | Approved queue, assignment, production and earnings views | Vendor isolation, staff permissions, proof/file access tests | Planned |
| 9 — Operator tools | Vendor review, support, reconciliation, audit and delivery coordination | Purpose-bound operator permissions; delivery file/proof exclusion; sensitive audit evidence | Planned |
| 10 — Native clients | Android/iOS using the same server API | Stable web/API; secure sessions; account deletion; internal testing and release review | Later; no native implementation |

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

## Next prompt — Remaining Backend Phase 2

```text
Continue Virtual Ink Backend Phase 2 from docs/source-document-baseline.md and the
three supplied PDFs. Inspect current code/evidence; preserve existing schema and
private provisioning. Finish genuine Auth-to-API setup where approved private
configuration permits, and review delivered GET /api/v1/memberships against its
acceptance draft and actual evidence. Obtain permission/lifecycle decisions from
Uchi, then prepare one audited membership-suspension slice with explicit authority,
last-owner protection and in-flight revocation semantics. Keep marketplace, uploads
and escrow outside this work. Report actual checks/blockers and produce the dated
Markdown/Word handover; Uchi's product review remains explicit.
```
