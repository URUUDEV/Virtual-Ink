# Phase 1 staging audit and preservation checklist

22 October 2026. Initial source: `59c2d4761db258cd2d947891bb62c8244a4e733c` on
`codex/phase1-order-storage-runtime`. **Phase 1 INCOMPLETE; release NO-GO.**

This record precedes implementation under Uchi's supplied **MASTER UI/UX AND
PHASE 1 STAGING BUILD PROMPT**. That complete prompt is now available in the task
conversation; the previous missing-writing-block stop is resolved. The ZIP is
available locally and remains the visual authority. Historical reports retain
their original evidence and policy boundaries.

## Current authority

28 October update: [the Hotprints-first manual-payment pilot](hotprints-manual-pilot.md)
supersedes the immediate gateway dependency below. Flutterwave remains the
previously selected future provider; gateway work can follow verified manual
operations. This does not authorize production changes or close security,
commercial, hosted or human acceptance gates.

- Production must remain unchanged. No main merge, production configuration,
  live payment, payout, production email or production data access is authorized.
- `feature/*` PRs target `staging`; staging hosts stable acceptance on Vercel
  Preview with isolated Supabase, Flutterwave sandbox and Resend staging only.
  These mappings are required configuration, not evidence that deployment is set up.
- The Free-plan MFA Verification Attempt Hook is **DEFERRED_PAID_CAPABILITY**.
  This supersedes the earlier requirement to obtain a paid/self-hosted hook target.
  Existing receipt checks must not simply be deleted: native TOTP/AAL2, current
  sessions, reauthentication, provider rate limits, durable events, suspicious
  activity monitoring and administrator alerts need a separately tested Free-plan
  path. The current application still depends on hook receipts.
- Flutterwave and Resend are selected providers. Private test credentials,
  verified staging sender, recipient controls and actual delivery remain to verify.
- Unapproved catalogue prices stay draft or quotation-required. Tax, delivery,
  refund, fee, retention and operational decisions remain owner approval gates.

## Repository and reference baseline

Next.js 16.4 App Router, React 19.2, TypeScript 5.9.3, Tailwind 4 and Three.js
0.186.1; independent Node HTTP/TypeScript backend, PostgreSQL and `pg` 8.23.1.
Package manager: npm with separate locked root/web dependency trees. Reviewed
runtime: Node 24.22.1. Do not install the reference Vite/R3F/Drei/inspection stack.

The 79-file reference is `Kimi_Agent_Shared attachments.zip` in Downloads, with
an existing extracted workspace copy. Historical archive SHA-256 is recorded in
[the reference manifest](brand-reference-manifest.json); fresh byte comparison
is recorded in the dated audit report. Required logo, geometry, Hero, Versions,
CSS and package files are accessible. Existing faithful Next.js integration is
documented in [brand setup](ui-brand-integration.md).

All local and cached remote branches were listed; live remote heads were read.
No remote `staging` or `feature/*` head existed at that inspection. Main was not
checked out or changed. Unrelated user changes remain in next-env.d.ts, .agents,
the extracted reference and skills-lock.json.

## Source functionality inventory

| Surface | Existing implementation | Acceptance gap |
| --- | --- | --- |
| Public UI | Home, shop and fixed product details, marketplace, pricing, delivery, business, design, support, trust and process pages | Real vendor/catalogue/search data and complete approved commercial configuration |
| Brand/studio | Supplied SVG/3D geometry, shared tokens, lazy logo, session intro, protected brand lab, product models, local drafts and measured placement | Physical devices, stable hosted workflows, supplier blanks and order-bound private designs |
| Identity | SDK cookie Auth, confirmation/recovery callbacks, account security, TOTP, factor replacement, current identity/session/role checks | Hosted Auth/email and the newly authorized Free-plan compensating path |
| Roles/RLS | Eight normalized roles, scoped assignments, current-session checks and restricted command functions | Full vendor-staff/organization journeys and hosted AAL2 denials |
| Files | Private S3 adapter, immutable quarantine/promotion, scanner, approved-production copy and audited hash-verified download library | Authenticated binary ingress/download deployment, buckets/IAM, retention and signed-link acceptance |
| Pricing | Vendor quotations and immutable accepted amount/currency | Approved database catalogue rules, calculated breakdown, cart, fee/delivery/tax configuration |
| Orders | Versioned order/quote/payment-evidence/proof/production/QC/delivery commands, durable audit | Complete requested lifecycle and genuine hosted end-to-end UI/transport |
| Dashboards | Scoped customer/vendor/admin order reads and controlled server forms | Messages, addresses, invoices, storefront/pricing, earnings/refunds, analytics and other required sections |
| Payments | Manual evidence gate; no Flutterwave adapter or webhook implementation found | Checkout, verified/idempotent webhook, reconciliation, sandbox failure/refund cases |
| Email | Provider Auth integration points; no Resend application delivery implementation found | Verified sender, private SMTP/API configuration, allowlist, outbox/templates/events/bounces |
| Hosting | Multi-service Vercel config and isolated acceptance project; separate UI-only project | Stable staging branch Preview, first-target routing repair and actual secure-service journeys |

The Supabase client uses publishable configuration and HttpOnly cookies;
server/database authority does not use user-editable metadata. Seventeen local
migrations exist. A fresh hosted migration listing returns fourteen; no new
migration has been applied during this audit. Existing migrations must be
preserved; future hosted changes must move forward.

The `ui_test` profile intentionally disables services and cannot pass staging
acceptance. Current staging guards reject payment/email credentials and require
all payment integrations disabled. Supporting sandbox credentials therefore needs
an explicit tested guard change; no environment guard has been weakened here.

## Route and functionality preservation checklist

These are requirements for subsequent implementation, not completed acceptance.

- [ ] Preserve `/`, `/shop`, `/shop/[slug]`, its unknown-slug 404, `/marketplace`,
  `/studio`, `/customize/cotton-t-shirt`, all supplied assets and local draft formats.
- [ ] Preserve `/about`, `/business`, `/delivery`, `/design-services`,
  `/how-it-works`, `/pricing`, `/roadmap`, `/support` and `/vendors/join`.
- [ ] Preserve `/login`, `/register`, `/forgot-password`, `/reset-password`,
  `/auth/callback`, `/auth/recovery-callback`, `/account` and `/account/security`.
- [ ] Preserve `/customer`, `/vendor`, `/admin`, `/admin/security`, `/brand-lab`,
  their independent server checks and the authentication proxy.
- [ ] Preserve `/health`, `/api/v1/health`, `/api/v1/me`, `/api/v1/memberships`,
  `/api/v1/tenants/[tenantId]/access` and the catch-all API forwarding contract.
- [ ] Preserve `/api/auth/[action]`, `/api/security/[action]`,
  `/api/workflow/[action]`, exact Origin/body limits, safe errors and no-store responses.
- [ ] Preserve current-role/resource checks, audit-before-release, rate/replay
  budgets, dual-controlled writes, final-factor protections and uncertain outcomes.
- [ ] Preserve every historical migration, RLS/ACL boundary and production target.
- [ ] Preserve the user's working files and historical Markdown/Word reports.
- [ ] Compare route inventory and source diff after each reviewable slice; run
  required checks without treating coverage as product or hosted acceptance.

## Tests, review and initial rollback point

Fresh command results, timestamps and actual exit codes are recorded in the
dated report. Until those runs finish, prior test counts are historical only.
No new physical-device, screen-reader, browser-console, Lighthouse, load or
rollback-rehearsal result is asserted. Existing tiny-copy/touch-target/contrast
and animation-performance concerns require actual checks, not visual assumptions.
Unused dependencies are not established by an automated removal tool; retain
them until usage/build/regression evidence supports a removal.

Rollback point is the initial commit above plus separately preserved uncommitted
user work. No deployment, hosted migration, email or payment mutation has occurred;
there is no task-created hosted change to roll back. Restoring a local review
branch must never discard the user's files. A production backup/restore and
release rollback rehearsal is still required before release.

## Owner approval record

All entries below are **PENDING**; a planning instruction or software fixture is
not an approval. Uchi owns product decisions, Lubasi operations, and Mumba the
configuration/security implementation. Record the named approver, date, exact
version, effective date and evidence before changing an entry to approved.

| Decision | Required evidence / interim boundary |
| --- | --- |
| Launch catalogue and high-value controls | Approved products/vendor capabilities; unsupported configurations quotation-required |
| Vendor commission and platform fee | Approved configurable rules; earlier provisional fee is not production approval |
| Delivery zones and fees | Approved coverage/rates or explicit quotation; no national-rate guess |
| Tax treatment | Owner/accounting decision, effective dates and invoice disclosure; do not select a rate |
| Cancellation and refunds | Approved windows, permitted reviewer, refund rules; automation restricted |
| Vendor response, proof turnaround and production SLA | Accepted operating times, urgency/exception handling; no invented promises |
| QC requirements | Accepted checklist, responsible staff, timestamps and photographic-evidence criteria |
| Delivery responsibility and dispute evidence | Authorized handoff, proof-of-delivery, customer receipt and dispute process |
| Payout schedule | Approved earnings/reconciliation policy; no live payout authorized |
| File retention and deletion | Approved durations, legal holds, deletion states and auditable lifecycle |
| Support hours | Approved staffing, contact route and lost-factor escalation |

## Hosted and physical acceptance coordination

The hosted journey must use actual staging records from registration/email,
configuration/private file/server price/sandbox checkout through signed verified
webhook, vendor acceptance, proof revision and correct-version approval,
production/QC, delivery/receipt, review and earnings. Live payouts remain off.
Every step needs exact source/URL, role, expected/actual result, evidence and
retest; no current row is accepted. Cross-customer/vendor access, AAL1 privileged
denial, revoked sessions/assignments, price tampering, invalid/duplicate webhooks,
expired links, quarantine and staging recipient denials must be tested separately.

Physical Windows Chrome, Windows Edge, Android Chrome and iPhone Safari are all
**NOT TESTED in this audit**. Reviewer availability is unconfirmed. Taizya and
Lubasi must record device/OS/browser/version, viewport, role/workflow, evidence,
defect/retest and the reviewer's actual decision. Keyboard-only, reduced motion,
slow network, no-WebGL, 320px and 200% zoom need actual evidence. A Chrome
connector-repair session is not an application/device acceptance test.
