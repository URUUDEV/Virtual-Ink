# Phase 1 status and completion gate

Authoritative user instruction: 18 October 2026, section 2.1. Phase 1 is
**INCOMPLETE**. Current release decision: **NO-GO**. No human acceptance or
production-promotion authorization is recorded by this document.

28 October scope update: Uchi directs a Hotprints-first printing/design pilot,
including school-serving individual vendors and outside print shops, vendor-set
service prices, accepted platform commission/terms and manual payments initially.
See [the pilot scope](hotprints-manual-pilot.md). A payment gateway is deferred
for this manual-only rollout. Its absence does not itself block that scope;
verified manual collection/reconciliation and all other applicable release gates
remain required. No item is marked passed and no release authorization is inferred.

22 October [customer/vendor MFA evidence](reports/2026-10-22-customer-vendor-mfa.md)
adds locally verified self-service security and a READY protected UI-only build.
All hosted-service, physical-device and approval gates remain open. Neither the
305 genuine local assertions nor UI-only hosting changes this NO-GO decision.

> Phase 1 remains incomplete. The application may be demonstrated in an isolated preview environment, but it must not be represented as fully production-ready.

This gate supplements the [mission checklist](phase-1-closure-checklist.md) and
[VH-01 through VH-17](phase-completion-checklist.md). Every requirement needs
objective evidence for the exact commit, environment and scope. Attractive UI,
coverage, a READY deployment or a Production target label cannot substitute for
working secure services, physical devices or human acceptance.

The existing protected [UI test site](vercel-ui-test.md) uses a historical
user-approved Production-labelled ui_test exception with sensitive services
disabled. It is not a successful Vercel Preview or a production-verified service.
Its earlier authorization does not authorize a new production promotion. Keep
the separate full-service acceptance project's Preview-only guard intact.

## A. Import completion — open

20 October [hosted native measurement samples](reports/2026-10-20-hosted-measurement-verification.md)
pass on the exact existing Preview. Unexplained navigation and unsaved-state reset
leave uninterrupted workflow acceptance open. Remaining fallback, physical-device,
supplier and secure-service gates are unchanged; no release item is closed.

20 October [measurement build](reports/2026-10-20-studio-precise-measurements.md)
adds local decimal editing with bounded safe fitting, atomic undo and negative
checks. Local native controls and the exact-source protected Preview build pass.
Hosted interactions, real devices, supplier approval and secure services remain
open; no import or release gate is closed by this slice.

20 October [model conformance audit](reports/2026-10-20-studio-model-conformance.md)
records nine valid GLBs and four malformed/resource/binding controls. Conformance
does not establish GPU output, fallback SVGs, supplier measurements/rights or
device acceptance. Browser and metadata refresh fail on connectivity; no import
or release gate is closed.

20 October [studio preview safety](reports/2026-10-20-studio-preview-safety.md)
adds fourteen controlled model/fallback/paint regressions, fixes stale failures
and abandoned-canvas ownership, and adds visible layout retry. Local gates pass;
the report records exact hosted evidence. Physical devices, forced runtime
failures, supplier assets and full-service integration acceptance remain open.

19 October [logo lifecycle follow-up](reports/2026-10-19-logo-lifecycle-fallback.md)
adds seven controlled readiness/failure regressions and repairs stale state after
mode/preference changes. Local checks pass. Its first Preview failed closed on an
automatically injected bypass credential; the exact task-created token was
revoked with approval and protection retained. The report records the fresh
retry result; real runtime/device and full-service gates remain open.

19 October [clean-checkout audit](reports/2026-10-19-clean-import-audit.md): local
locked installs, 43/43 coverage files, types/lint/build and the actual fresh
[UI-only Preview build](https://virtual-ink-ui-test-68245umm7-shadowrootsec-5679.vercel.app)
now pass at the recorded sources. Hosted browser/HTTP access times out; client
bundle, lazy/fallback/visual and physical-device evidence remain open. This
advances the installation/build sub-checks only; no secure integration is reclassified
and section A/full Phase 1 stay open.

The inventory below records source paths, earlier porting work and remaining
runtime/device gates; the local clean-install audit above does not close all
imports. See [reference fingerprints](brand-reference-manifest.json),
[brand integration](ui-brand-integration.md) and [latest build evidence](reports/2026-10-18-studio-canvas-fallback.md).

| Required asset | Existing implementation or declaration | Remaining evidence |
| --- | --- | --- |
| VirtualInkAnimatedLogo | [Next.js component](../apps/web/src/components/brand/VirtualInkAnimatedLogo.tsx) | Clean-checkout loading, lazy scene and device fallbacks |
| VILogoSVG | [Supplied SVG port](../apps/web/src/components/brand/VILogoSVG.tsx) | Fingerprint/duplicate-ID regression and device static view |
| VI geometry utilities | [Geometry module](../apps/web/src/components/brand/vi-geometry.ts) | Reference fingerprint and lazy runtime verification |
| Brand fonts | [Root font imports](../apps/web/src/app/layout.tsx), [design font registry](../apps/web/src/lib/design-fonts.ts) | Installed files, network delivery and approved font rendering |
| Design tokens | [Shared tokens](../src/shared/brand-tokens.ts), [brand CSS tokens](../apps/web/src/components/brand/brand-tokens.css) | Consumer/import and visual consistency audit |
| Required styles | [Global styles](../apps/web/src/app/globals.css), [brand styles](../apps/web/src/components/brand/brand.css), [UI foundations](../apps/web/src/components/ui-foundations.css), [studio styles](../apps/web/src/components/product-studio.css) | Entry imports, unused/duplicate rules and responsive checks |
| Product-specific 3D models | [Model registry](../src/shared/product-models.ts), original GLBs in apps/web/public/models/studio-v1 | Complete asset loading plus supplier measurements/licensing; studies are not approved SKUs |
| Static product fallbacks | Registry front/back thumbnails in apps/web/public/models/studio-v1 | Every SKU/surface, no-WebGL and failed-model acceptance |
| Icons and images | Static brand assets in apps/web/public/brand, existing supplied images and lucide-react | Full route/asset inventory, missing-image and rights checks |
| Shared UI components | [Header](../apps/web/src/components/site-header.tsx), [footer](../apps/web/src/components/site-footer.tsx), [button link](../apps/web/src/components/ui/button-link.tsx), [account controls](../apps/web/src/components/account-form-controls.tsx) | Complete consumer, accessibility and duplicate-import review |
| Frontend packages | [Web manifest](../apps/web/package.json), [root manifest](../package.json) and their lockfiles | Clean installation, usage audit and justified removal of unused packages |

Reference components reused: VirtualInkAnimatedLogo, VILogoSVG and vi-geometry;
the supplied typography, palette, timing and fallback behavior were adapted to
Next.js. Hero/Versions were design references: the existing hero and protected
brand laboratory carry their applicable behavior. The archive's complete App,
Vite bootstrap/configuration, package manifest, demo navigation/versions showcase
and inspection plugin were not installed as a replacement application. React
Three Fiber/Drei were not added by the port. Record any later exception explicitly.

Before closing imports, the reviewer must attach evidence for all of the following:

- Correct source/module/asset paths; broken and duplicate imports removed.
- Package usage reviewed and unused packages removed with regression evidence.
- No whole-demo import or production framework replacement; original routes,
  APIs, data integrations, security and functionality preserved.
- Client dependency graphs contain no server-only code or secret-bearing module;
  inspect actual client bundles as well as source. A type check alone is insufficient.
- Lazy components render and recover from loading/WebGL failure; static fallbacks
  remain usable with animation disabled and reduced motion.
- Both root and web locked dependencies install successfully in a fresh isolated
  checkout using npm ci --include=dev, with no node_modules/build output copied in.
- Type check, lint and production build succeed with no unresolved modules.
- A clean-checkout Vercel **Preview** build succeeds; capture actual target,
  deployment URL/ID, source commit, environment profile and sanitized build logs.
- Imported reference and excluded demo lists are reviewed; preservation checks
  confirm no production functionality was overwritten.

The prior local build and isolated UI snapshot are useful historical evidence.
They do not close this combined clean-install/Preview gate. Customer artwork
file import is a separate pending studio acceptance item, not this source-import
inventory; the Chrome file-selection restriction must not be bypassed.

## B. Real physical-device testing — open

No complete qualifying device record has been supplied. Earlier Chrome/browser
samples and 320px emulation remain scoped historical checks. Do not infer device
model, OS/browser version, physical touch, network or reviewer evidence from them.

| Required physical target | Current qualifying record | Owner / next action |
| --- | --- | --- |
| Windows laptop/desktop, Chrome | Not recorded | Taizya/Uchi: record hardware, versions and workflows |
| Windows laptop/desktop, Microsoft Edge | Not recorded | Taizya/Uchi: independent browser run |
| Android phone, Chrome | Not recorded | Taizya: physical phone run |
| iPhone, Safari | Not recorded | Taizya: physical iPhone run |
| Tablet where available | Availability and run not recorded | Taizya/Lubasi: identify device or document availability |
| Lower-performance mobile or representative physical device | Not recorded | Taizya/Lubasi: identify representative hardware |

Cover Wi-Fi, mobile data, slow/unstable connectivity, portrait and landscape,
touch, mouse and keyboard-only operation across the applicable devices. State
inapplicable combinations explicitly; do not label desktop emulation as a phone.
Critical/high device defects block completion until fixed and retested.

Every device run must cover or explicitly mark blocked each workflow:

1. Home loading, animated-logo fallback and navigation.
2. Registration, sign-in, email verification, MFA enrollment/challenge and recovery.
3. Search, vendor storefront, product configuration and garment/mug rendering.
4. 3D rotation/zoom, artwork upload/placement and draft saving.
5. Server price calculation, cart and checkout.
6. Proof review/approval and order tracking.
7. Vendor order handling, production verification and delivery status.
8. Logout and session expiry.

Create a separate record per device/network/orientation and identify every feature
tested. Record device model, OS version, browser/version, screen dimensions and
pixel ratio, network/conditions, input method, exact URL/deployment/commit, tester
and date, expected/actual results, redacted screenshots/recordings, defect IDs,
severity, fix commit and retest result. Unbuilt/disabled services stay blocked,
never passed. Real-device evidence may be contributed by team members; no human
test or acceptance is simulated by automation.

## C/D. Secure integration evidence register

22 October [manual-MFA follow-up](reports/2026-10-22-mfa-manual-enrollment.md)
adds the enrollment key path and reaches 229 genuine local Auth checks. Basic TOTP
availability is separate from required native-hook compatibility. No service is
promoted beyond its local scope and all release/device/hosted gates stay open.

21 October [implementation follow-up](reports/2026-10-21-order-dashboards-launch-gates.md)
adds scoped order dashboards and expands genuine local Auth to 227 checks. Private
worker/order/proof/QC libraries and SQL now exist and have local evidence; hosted
ingress, transport, provider IAM and complete application journeys stay open.
No service below is promoted to Preview/Production verified by a UI-only build.

Allowed classifications only: **Not started**, **Mocked**, **Implemented**,
**Locally verified**, **Preview verified**, **Production verified**, **Blocked**.
Classification must describe the exact tested scope. Implemented means code
exists, not that it is enabled or accepted. Local/provider fixtures cannot be
promoted to Preview verified. A Production-labelled UI shell cannot establish
Production verified. Partial foundations below do not close an integration.

The original register used existing source and dated reports; current follow-ups
are scoped in their linked reports. All services still need genuine
isolated Preview acceptance before a release decision.

| Integration | Current classification | Evidence / remaining limitation |
| --- | --- | --- |
| Genuine authentication | Locally verified | [229 genuine local checks](reports/2026-10-22-mfa-manual-enrollment.md), /api/auth/[action]; hosted identity/session/email acceptance blocked |
| Email verification | Implemented | [Account/Auth contracts](account-recovery-ux.md); genuine controlled inbox/delivery and Preview verification open |
| Password recovery | Locally verified | [Recovery UX](reports/2026-10-18-account-recovery-ux.md); contract/UI checks, genuine email/reset/session acceptance open |
| MFA enrollment/challenge | Locally verified | [Real key/QR/Auth checks](reports/2026-10-22-mfa-manual-enrollment.md), /api/security/[action]; compatible hosted hook target, physical/manual and complete launch UX acceptance open |
| Server-controlled roles | Locally verified | [Security administration](phase-1-security-admin.md); restricted local writer, real hosted lifecycle open |
| Vendor permissions | Locally verified | [Assigned workflow/dashboard scope](order-dashboards.md), current membership and SQL denials; complete genuine hosted vendor journey open |
| Administrator permissions | Locally verified | [Security administration](phase-1-security-admin.md) and recent-MFA order oversight; complete admin dashboard/hosted lifecycle open |
| Private file storage | Implemented | [Worker/access libraries](order-storage-workflows.md) have local SQL and real S3/scanner evidence; [six private Neon staging buckets](neon-private-storage.md) pass synthetic hosted S3 checks. Authenticated ingress, hosted worker/IAM, retention/deletion and private viewer acceptance remain open |
| Short-lived signed file access | Not started | [Proxy download library](order-storage-workflows.md) rechecks current authority; no raw signed-URL grant/issuance flow or hosted file transport |
| File validation | Locally verified | [Server inspection/worker](private-file-inspection.md), bounded MIME/signature/hash checks and real local engine tests; full format sanitization/hosted ingress open |
| Malware scanning/quarantine | Locally verified | [Real local S3/ClamAV and SQL](reports/2026-10-21-backend-workflows-runtime.md); production worker, IAM, freshness and hosted upload journey remain open |
| Product catalogue | Mocked | [Draft model registry](../src/shared/product-models.ts); no vendor-approved supply/stock/price integration |
| Server-authoritative pricing | Locally verified | [Owner-scoped price versions and immutable commission snapshots](vendor-pricing-commission.md); approved real policies, customer price-list binding, itemization and hosted quote/checkout acceptance remain open |
| Cart persistence | Not started | Commercial controls disabled |
| Order creation | Locally verified | [Genuine Auth draft creation and SQL idempotency](reports/2026-10-21-order-dashboards-launch-gates.md); full commercial catalogue/checkout/hosted flow open |
| Order-state transitions | Locally verified | [Transactional workflow](order-storage-workflows.md) covers local quote/proof/production/QC/handoff; required payment/refund/full delivery states and hosted acceptance remain open |
| Proof versioning/approval | Locally verified | [Immutable proof/version/hash and approval SQL](order-storage-workflows.md); private customer viewer, comments and genuine hosted journey remain open |
| Manual payment confirmation | Locally verified | Existing scoped payment.confirm command/audit foundation; actual recipient, receipt reconciliation, commission/vendor settlement and full hosted journey remain open |
| Payment provider | Not started | Deferred from the 28 October manual-only pilot; gateway remains disabled and requires separate verified enablement |
| Verified payment webhooks | Not started | Deferred while gateway is disabled; signed-event/replay/idempotency acceptance required before gateway enablement |
| Refund/dispute handling | Implemented | Narrow immutable dispute/decline holds exist locally; refund provider/state flows, communication and operational policy are not complete |
| Vendor payout records | Not started | No enabled financial service or ledger acceptance |
| Delivery/collection workflow | Locally verified | Scoped MFA assignment, ready state and receipt confirmation pass local SQL; full tracking/states/operational hosted flow remain open |
| Email/in-app notifications | Not started | No connected operational notification delivery; auth request code is separate |
| Audit logging | Locally verified | [Security/workflow/dashboard audits](reports/2026-10-21-order-dashboards-launch-gates.md), including audit-outage denial/rollback; full payment/provider/hosted operational coverage open |
| Error monitoring | Not started | No verified production error-monitoring service |
| Rate limiting | Locally verified | [Security administration](phase-1-security-admin.md); local sensitive-action limits, end-to-end deployed controls open |
| Environment-secret management | Locally verified | [Isolation runbook](hosted-acceptance.md), guard/tests; full-service Preview and hosted-bundle inspection open |

For every integration, create a reproducible evidence entry containing:

```text
Integration ID/name and classification; scope; owner/reviewer; date:
Relevant route/service and source commit:
Environment; actual deployment target; URL/ID; synthetic account roles:
Prerequisites; test/input/action; expected result; actual result:
Security control and negative cases tested; safe evidence reference:
Remaining limitation/defect; next action; fix/retest evidence:
```

Secure integration acceptance requires all of these controls:

- Browser bundles contain no service-role key, secret, provisioning or migration
  credentials; no public environment variable is treated as a secret container.
- The server owns roles, prices, totals and order transitions; validate input,
  privileges, current state/version and idempotency before protected writes.
- For the manual-only pilot, payment confirmation requires authorized receipt
  verification, correct order/recipient/amount/currency, duplicate-reference and
  retry controls, auditable reconciliation and separate commission/vendor
  settlement records. Never accept a client payment-success claim. When a gateway
  is enabled, signed server-side webhooks and replay/idempotency tests also apply.
- Enforce RLS/equivalent database policies, tenant isolation and privileged
  server operations. Administrator MFA is mandatory; privileged vendor/financial
  actions require MFA or recent re-authentication.
- Keep artwork private; validate size/type/signature, quarantine/scan, issue
  short-lived signed access only after ownership/assignment checks, and deny
  other customers and unassigned vendors. Never embed artwork in public GLBs.
- Log privileged/financial actions with safe audit metadata. Do not expose raw
  provider/database errors or secrets in UI, telemetry or logs.
- Separate Preview/Production credentials, controlled migrations and seed/test
  identities; prove development accounts cannot access Production.
- Use synthetic unauthorized/cross-account tests; preserve safe file deletion,
  retention, rate-limit and operational error-monitoring evidence.

## E. Release decision — NO-GO

Every item below remains unchecked until objective evidence is attached:

- [ ] Required imports pass clean installation, types, lint and production build.
- [ ] Actual clean-checkout Vercel Preview deploys successfully.
- [ ] Critical customer journeys pass on the required physical devices/networks.
- [ ] Genuine authentication and required MFA enforcement work.
- [ ] Private files deny public, cross-account and unassigned-vendor access.
- [ ] Server authorization protects every privileged action.
- [ ] Server pricing matches checkout totals.
- [ ] Backend validates all required order transitions.
- [ ] The deployed payment mode passes its controls: manual receipt verification,
  reconciliation, duplicate/idempotency and commission/vendor settlement for the
  manual pilot; signed webhooks and replay/idempotency additionally before gateway enablement.
- [ ] Proof approval creates an immutable actor/time/version audit record.
- [ ] No unresolved critical/high security or device defects remain.
- [ ] Rollback is actually rehearsed and verified, with data/alias safety evidence.
- [ ] Completion report contains import, device, integration and VH evidence.
- [ ] A documented go/no-go decision and explicit production authorization exist.

Uchi records the release decision after reviewing evidence with Mumba, Taizya and
Lubasi. Automation cannot supply their approval. Authorization must identify the
commit, target, rollback reference and permitted changes. General instructions
to continue or deploy are not a waiver of this gate. Do not change Production
secrets, databases, storage policies, DNS or live payment settings without their
specific authorization. Preserve the existing Shadow Root security boundaries.

Immediate sequence: audit imports in a clean isolated checkout; resolve supported
full-service Preview/native-MFA hosting; implement and verify the next approved
secure vertical slice; collect genuine device evidence; rehearse rollback; then
submit the evidence-backed decision. Do not widen into escrow/blockchain scope.
