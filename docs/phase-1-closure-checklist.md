# Phase 1 closure checklist

Created 15 October 2026 from the Phase 1 mission and the inspected repository.
This is the live acceptance checklist; evidence must identify the tested commit,
environment, role and denial case. A UI control or mocked provider response alone
does not pass an item. Phase 1 remains **INCOMPLETE** until every required check and
the human and Vercel gates pass.

18 October section 2.1: the [authoritative release gate](phase-1-release-gate.md)
adds clean-checkout imports, real physical devices, classified secure integrations,
rollback rehearsal and documented go/no-go plus explicit promotion authorization.
Earlier dated slice results remain historical; they cannot close these gates.

- [ ] **IMPORT-01:** full asset/package inventory, client/server boundaries,
  lazy fallbacks, clean dependency install, types/lint/build and actual clean
  Vercel Preview; imported/excluded reference and preservation evidence.
- [ ] **DEVICE-01:** physical Windows Chrome/Edge, Android Chrome, iPhone Safari,
  tablet availability and representative lower-power device; network/orientation/
  input/workflow matrix, versions, screenshots, defects and retests.
- [ ] **INTEGRATION-01:** every required service has an allowed classification
  and route/environment/expected/actual/security/limitation evidence; genuine
  services replace demonstrations and local-only authority.
- [ ] **RELEASE-01:** every section E item passes; rollback is tested; no open
  critical/high issue; human decision and explicit production authorization.

## Baseline and work order

Uchi's 16 October priority: get Phase 1 ready promptly and retain Phase 1 scope
until traction. The critical path remains isolated Auth/MFA acceptance, then the
existing private-file/order/vendor/manual-status MVP journey and deployment gates.
This direction does not close a requirement or authorize future-phase features.

- [x] **B-01 — Inspect and preserve:** Next.js 16.4 / React 19.2 strict TypeScript
  web app; Node 24 TypeScript API; PostgreSQL/Supabase adapters and migrations;
  Vercel web/app services. The existing generated `apps/web/next-env.d.ts`
  development-path edit remains user-owned and unstaged.
- [x] **B-02 — Existing verification:** 168/168 root tests pass on private Node
  24.21.0. Local `/health` and `/api/v1/health` return 200; anonymous
  `/api/v1/me` returns 401. This is a foundation baseline, not Phase 1 acceptance.
- [x] **B-03 — Gap review:** see [dated gap report](reports/2026-10-15-phase-1-gap-report.md).
- [ ] **B-04 — Preserve current code/branding:** build each package on existing
  routes, adapters, visual system and assets; report any justified schema/API
  changes before widening capability.

## Requirements mapped to the mission

- [ ] **STUDIO-01 — Mandatory product-specific design studio (17 October):**
  [Local design lab](product-studio.md) adds original garment/mug GLBs, flat-card
  layout, model registry, safe placement and local references. Supplier-matched
  production assets, catalogue onboarding, private files, server pricing/cart,
  actual vendor proofs, all eighteen acceptance tests and Vercel gates remain
  incomplete. [Current evidence](reports/2026-10-17-product-studio.md).

- [ ] **AUTH-01 — Genuine authentication (mission 1):** production and Preview
  registration, verification, login, logout/session invalidation, reset,
  restoration/expiry, suspension and deletion request; safe errors and secure
  cookies; no production bypass, hard-coded identity or browser role authority.
- [ ] **AUTH-02 — Privileged identity lifecycle:** server-owned eight-role model,
  vendor application/verification, administrator-controlled privileged account
  creation, suspended-account denial and a documented/enforced administrator
  MFA path. Include negative UI/API tests in Preview and Production.
- [ ] **AUTHZ-01 — Authorization:** approved [role/resource permission matrix](phase-1-permission-matrix.md) and
  server checks for routes/actions/admin operations; PostgreSQL RLS and private
  Storage policies; own-order, assigned-vendor, organization scope and delivery
  exclusion tests; no vendor self-assignment or self-approved customer proof.
- [ ] **FILES-01 — Private file lifecycle (mission 2):** purpose-separated private
  buckets, authenticated upload/download, ownership/assignment checks and short
  purpose-specific grants (at most five minutes); download audit and denial tests
  for guest, other customer, unassigned vendor and delivery partner.
- [ ] **FILES-02 — Safe upload and scan:** quarantine, size/type/signature checks,
  SHA-256 duplicate detection, MIME and safe metadata, limits, real production
  malware scanner adapter, SAFE/REJECTED/REVIEW_REQUIRED, protected promotion,
  notification and audited outcome. Development mocks must be labelled. Prove
  renamed executable, oversized and rejected-file denial cases.
- [ ] **ORDER-01 — State machine and customer journey (mission 3):** centralized
  transactional, versioned and idempotent transitions across every required
  state; validated print specifications, draft/submission, quote review, accepted
  immutable price snapshot, payment confirmation, timeline and completion/dispute.
- [ ] **ORDER-02 — Vendor journey:** verified assigned jobs only; accept/decline,
  permitted quote and proof work, customer change loop, production gates, stages,
  evidence, QC, readiness and final record. Verify unauthorized transitions fail.
- [ ] **PROOF-01 — Proof approval (mission 4):** immutable versioned proof/file
  hash, latest-active-only customer approval or change request, actor/time,
  supersession and audited reason/elevated administrator override. Production
  start denial before required approval.
- [ ] **PROD-01 — Production verification (mission 5):** production job/stages,
  approved proof/spec/hash/quantity references, immutable versioned private
  evidence, required QC checks and failure/correction trail. Payment/proof gates
  block start, QC failure blocks completion, every transition is audited.
- [ ] **DASH-01 — Role interfaces:** responsive customer, vendor and admin journeys
  with accessible loading, empty, success, error and denial states; preserve
  approved Virtual Ink design direction. Verify each workflow against APIs.
- [ ] **DATA-01 — Persistence:** normalized required entities, UUID/FK/index/
  uniqueness/check constraints, timestamps/versioning, reviewed migrations,
  transactions, RLS and isolation fixtures. Existing migration history is
  [reconciled](reports/2026-10-16-migration-history-reconciliation.md): ten matching
  normalized SQL checksums and fresh local replay; required Phase 1 business
  entities and enforcement remain unbuilt. No production customer data in tests.
- [ ] **AUDIT-01 — Durable audit:** append-only events for the mission's auth,
  role, file, quote/order, assignment, proof, production, QC and admin actions;
  actor/role/resource/time/correlation/state/redacted metadata/reason. Test
  ordinary-role mutation denial and sensitive-field redaction.
- [ ] **SEC-01 — Application security:** input validation, output safety, CSRF,
  rate limits, cookie/CSP/HSTS configuration, secrets, safe logs, IDOR/mass-
  assignment/duplicate/concurrency controls, dependency and runtime advisory
  review. Close critical/high findings; record blocked external checks.
- [ ] **TEST-01 — Automated:** unit permissions/transitions; database/RLS/storage;
  API; 15 required end-to-end scenarios and every role; deployment smoke. Report
  95% coverage by explicit measured scope/denominator and separately measure UI,
  schema/provider and lifecycle acceptance. Every required executed test passes.
- [ ] **TEST-02 — Manual acceptance:** genuine human role workflows, denials,
  mobile/desktop and accessible states, without simulated signoff. Record actual
  reviewer and evidence; none is inferred here.
- [ ] **VERCEL-01 — Environments and deployed proof:** separate local, Preview,
  Production and database targets; correct per-environment settings, no client
  secrets, migration control, correct Auth/reset origins and active headers.
  Verify Preview and Production database/Auth/storage/API/workflows, protected
  routes, assets, mobile, console and sanitized build logs. Supply tested URLs and
  commit IDs. Complete `docs/phase-completion-checklist.md` VH-01–VH-17.
- [ ] **GATE-01 — Phase closure:** no fake production auth, server and database/
  storage enforcement proven, all journeys deployed and tested, no open critical/
  high defect, required human acknowledgements and Uchi acceptance recorded.
  Until then report **INCOMPLETE** and do not start escrow/crypto/blockchain/advanced
  Phase 2 work.

## Decisions and ownership

### Local review — FILES-02A (21 October 2026)

- [x] Bounded content signature/MIME/SHA-256 inspection and private ClamAV
  INSTREAM adapter pass 13 new test groups, five genuine synthetic engine
  assertions and stopped-sidecar denial. All 231 root/210 security tests,
  45-file measured coverage, lint/types/build pass. See
  [evidence](reports/2026-10-21-private-file-inspection.md).
- [ ] Order-bound immutable quarantine, durable duplicate decisions/audits,
  scanner operations/freshness, private storage/promotion/download and genuine
  hosted identity/role acceptance remain open. No final FILES or Phase 1
  requirement group closes, and no backend deployment is claimed.

### Verification — source lint gate (17 October 2026)

- [x] The previously absent command now checks all 156 scoped JS/TS files,
  rejects controlled bad-code fixtures and runs inside the web build. Local
  regression/type/build, 207 genuine MFA and sampled browser/HTTP checks pass.
  See [evidence](reports/2026-10-17-lint-gate.md).
- [ ] Full Next-specific/accessibility checks, hosted Vercel verification,
  runtime HIGH resolution and all unbuilt/unaccepted Phase 1 groups remain open.
  This source gate does not close SEC-01, TEST-01 or any final requirement group.

### Verification — AUTH-ISOLATED-ACCEPTANCE (17 October 2026)

- [x] Separate acceptance resources inspected: fourteen matching staging
  migrations, 29 forced-RLS tables, 21 hosted rollback denials and 25 Preview-only
  Vercel variables without Git/integration inheritance. All 206 root tests and
  39-file measured coverage gate pass; original Production fingerprints match.
- [ ] Working Preview is absent. Vercel classified the explicit Preview request
  as Production within the acceptance project; the environment guard stopped
  build. Native MFA hook plan compatibility, genuine hosted roles/Auth, runtime
  HIGH resolution and all product/human gates remain open. See
  [evidence](reports/2026-10-17-hosted-acceptance-verification.md).

### Review implementation — AUTH-FACTOR-REPLACEMENT (16 October 2026)

- [x] Separate recent-MFA replacement enrollment, distinct provider names,
  preservation of the existing factor, removal confirmation and durable
  serialization pass 207 genuine local checks and 108 SQL assertions.
- [ ] Compatible isolated hosted/browser and recovery/reconciliation acceptance
  remain open. Fourteen local migrations are not hosted enablement. See
  [evidence](reports/2026-10-16-authenticator-replacement.md).

### Review implementation — AUTH-PROVIDER-GUARD (16 October 2026)

- [x] Native verification hook, required receipt, direct-provider replay/race
  denial, cross-factor attempt budget, audit-outage denial and readable native
  alerts pass 185 genuine local checks and 82 SQL assertions. Thirteen migrations
  replay. See [evidence](reports/2026-10-16-provider-mfa-guard.md).
- [ ] A compatible isolated managed Teams/Enterprise or authorized self-hosted
  target, genuine Preview/browser, recovery/provider-direct factor auditing,
  runtime patch resolution and human acceptance remain open. No full Phase 1
  mission group closes; Production remains disabled for this security boundary.

### Review implementation — AUTH-SECURITY (16 October 2026)

- [x] Provider-backed TOTP API/UI, recent assurance, restricted role requests,
  distinct approval, audited execution, immutable expiry and session revocation
  pass scoped local checks. See [evidence](reports/2026-10-16-mfa-privileged-security.md).
- [x] Genuine local Auth/application integration passes 87 checks, including
  enrollment/AAL2, encrypted secrets, invalid/expired/application-replay denials, rate
  events, dual approval, expiry and immediate session revocation.
- [ ] Managed-cloud/browser acceptance, isolated Preview resources, deployed
  encryption/recovery/log evidence, provider-wide replay rejection, HIGH runtime
  resolution and human acceptance remain pending. No security completion or final
  Phase 1 requirement group is closed. Production enablement is rejected.

### Delivered sub-slice — AUTH-STEP (16 October 2026)

- [x] Internal Auth-first session/MFA prerequisite passes 191 root/180 security
  tests, the 37-file coverage gate, strict types/build and seventeen actual SQL
  denial cases. See [evidence](reports/2026-10-16-session-step-up.md).
- [ ] No runtime caller, Auth privilege or genuine MFA acceptance is added.
  Inactivity/timebox policy, per-action transaction boundaries, privileged writer,
  bootstrap/freshness decisions and hosted workflows remain open. No final
  requirement group is closed; Phase 1 remains PARTIAL.

### Delivered sub-slice — AUTH-ASSIGN (16 October 2026)

- [x] Explicit eight-role assignment/audit foundation and reader pass local replay,
  required-audit/immutable-history/RLS denials and actual loader checks. All 186
  root tests, 35-file 95% gate, strict types and build pass. See
  [evidence](reports/2026-10-16-role-assignment-foundation.md).
- [ ] Migration remains unapplied on hosted development; no writer or production
  business route uses it. Genuine MFA/session verification, bootstrap/lifecycle,
  resource scope, concurrency and deployed enforcement remain open. No final
  requirement group is closed.

### Delivered sub-slice — AUTH-CTX (16 October 2026)

- [x] Initial internal actor loader checks verified-identity mapping and active
  user/role rows; only unambiguous legacy Customer/DeliveryPartner map. Customer
  vendor memberships and unsupported/privileged roles deny. Actual local RLS,
  synthetic provider/HTTP revocation checks and all 183 root tests pass; all 34
  scoped files exceed the 95% gate. See [evidence](reports/2026-10-16-trusted-identity-context.md).
- [ ] No new production route calls the loader. Full eight-role assignments,
  resource scope, MFA, atomic action/audit and genuine deployed enforcement remain
  open. This does not close AUTH-02, AUTHZ-01 or any final requirement group.

### Delivered sub-slice — AUTHZ-POL (15 October 2026)

- [x] Pure permission evaluator and ten synthetic test groups cover all eight
  roles, assignment/organization scope, exact privileged grants, suspension,
  delivery-file denial and file/payment/proof gates. All 178 backend tests,
  95%-scoped coverage, strict types and the production build pass. See the
  [dated evaluator report](reports/2026-10-15-authorization-evaluator.md).
- [ ] Verified identity/database context, route/action integration, RLS/Storage,
  transactional audits and genuine deployed role tests remain open. AUTHZ-01 is
  not complete. Zero of the seventeen final requirement groups is fully proven.

### Delivered sub-slice — AUTH-REC (15 October 2026)

- [x] Recovery request, fixed PKCE callback and authenticated password update
  implemented and verified with 10 unit tests, 14 synthetic SDK/Next checks,
  full 168-test/95%-scoped coverage gate, strict TypeScript, production build,
  nine UI tests and local Chrome UI review. See the [dated report](reports/2026-10-15-auth-recovery.md).
- [ ] Genuine provider email/reset test, expiration/revocation configuration and
  Preview/Production verification remain open. AUTH-01 is still incomplete.

The user's 15 October mission defines the eight role names, required order states,
proof/production gates and the Phase 1 boundary. Remaining operational choices
(for example retention, approved upload limits/scanner operations, quote/payment
evidence and delivery/dispute policy) remain tracked in [open questions](open-questions.md).
Uchi Chinyama and Mumba Chitonge collaborate on backend engineering. Taizya
Nakapende owns UX review; Lubasi Monde owns vendor/delivery operations discovery.
No human acceptance has been recorded.
