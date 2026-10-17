# Virtual Ink — Authoritative brand and shared UI upgrade

Date: 17 October 2026. Uchi Chinyama and Mumba Chitonge own backend engineering;
Uchi owns product, Taizya Nakapende design and Lubasi Monde operations.

**Status: local review slice; full UI upgrade and Phase 1 incomplete.** No
successful hosted Preview, Production release, human signoff or end-to-end
commerce acceptance is claimed. Branch: `codex/ui-brand-upgrade`, based on
`92a5ce8`. Supplied files and the user-owned Next type change are preserved.

## Audit, reference and preservation

The mandatory ZIP was located in Downloads and safely extracted privately.
All 79 files (571,731 uncompressed bytes) match the existing supplied directory.
Archive SHA-256 is recorded in [the manifest](../brand-reference-manifest.json).
The seven required reference files were reviewed before application edits.
[The pre-edit audit](../ui-upgrade-audit.md) records stack, routes, components,
API/Auth/role/file/order/payment boundaries and the preservation checklist.

The existing Next.js 16.4 / React 19.2 / Tailwind 4 / Three.js application was
retained. No archive build/install script ran. No Vite, inspection plugin,
React Router, Fiber, Drei or generic archive UI dependency was installed.
No dependency or lockfile change was needed. The only package script change
adds brand checks to the existing web test command.

## Screens, components and routes changed

- Shared header/footer, navigation, buttons, focus/feedback styles and typography
  now use Space Grotesk, the supplied four-colour direction and centralized
  brand/spacing/radius/shadow/motion/layer tokens. The legacy PNG remains present;
  the displayed monogram uses the supplied SVG and approved geometry instead.
- The homepage includes the supplied animated identity, customer/vendor actions,
  service categories, existing product imagery, studio introduction, verified-
  vendor availability, business, workflow, trust and help content. No vendor,
  review, order or revenue metric was invented. The existing product carousel
  remains functional below the hero.
- Added public `/marketplace`, `/pricing`, `/delivery`, `/about` and `/support`.
  These explain actual availability, pricing structure, collection/delivery,
  trust requirements and help. Marketplace is an explicit unavailable-directory
  state, not a fake populated vendor service. No live support channel is invented.
- Existing account content adds links to local designs, the order journey and
  password recovery, while explicitly marking order/proof services unavailable.
  The restricted security page has a wider shared layout; its genuine existing
  enrollment, re-authentication and role-command behavior is retained.
- Added `/brand-lab` with replay, pause, speed, mode, background, wordmark,
  tagline and interaction controls behind server checks. It has no public link.
  Proxy matching includes the route. Existing routes/APIs are retained.
- Route loading uses the supplied static icon, transparent and non-interactive.
  Root metadata uses a generated supplied-geometry SVG icon. Three static SVGs
  are provided for future non-WebGL/email/print consumers; actual mail/PDF/social
  raster integration is not claimed implemented.

See [integration and rollback instructions](../ui-brand-integration.md).

## Brand fidelity and motion

`VILogoSVG` retains the exact supplied paths, pixel rectangles, droplet and
gradient stops. Repeated inline instances now have unique IDs. Light/dark
wordmark treatments follow the supplied animated reference; transparent mode
inherits its surrounding text colour. The monogram is not recoloured.
The geometry body matches its supplied fingerprint after normalized line endings.

`VirtualInkAnimatedLogo` preserves size, rotation, speed, text, mode, background,
interaction, paused state, replay token and completion callback. Its existing
Three.js adapter retains the reference's six-second timing, easing, mesh layout,
physical materials, lights, particles/rings and horizontal drag inertia.
The public introduction is skippable and session-scoped, then settles to a static
mark. It never blocks navigation and has no replay/tuning panel. This provides
mobile formation without an obstructing splash overlay. Internal idle rotation
is bounded to eight–twelve seconds/revolution. Paused animation still permits
manual rotation, matching the reference.

Initial SSR/hydration displays static SVG without reading browser APIs. A visible
logo checks reduced motion and WebGL2 before requesting Three.js. Unsupported
WebGL, context loss or lazy-import failure keeps the page usable with SVG.
Rendering stops offscreen/hidden and when there is no unpaused motion. Geometry,
materials, RAF, observers and event listeners are disposed. Particles are capped
at 240; DPR is capped at 2, or 1.5 for coarse pointers, using low-power preference.

## Verification results

- Full root suite: **214 passes**, zero failures/skips. The backend/shared
  inventory includes all **43 executable source files**, with none omitted:
  lines **2434/2453 (99.2254%)**, branches **1834/1901 (96.4755%)**, functions
  **233/236 (98.7288%)**. Frontend/browser, SQL, server lifecycle and genuine
  hosted integrations are outside this metric; it is not product completion.
- Existing security subset: **195 passes**. Web SSR/brand checks: **18 passes**,
  including seven new brand checks. Synthetic real-SDK/Next checks: **16 passes**.
  These scopes overlap where applicable and must not be added as coverage.
- Genuine digest-pinned local Supabase Auth/Postgres: **207 checks pass**, with
  cleanup confirmed. This reruns the existing MFA/native-hook/security boundary;
  it is not genuine hosted or browser acceptance of the new lab route.
- Strict backend/shared types, web types, source lint and optimized build pass.
  The app builds twenty-two static pages plus dynamic routes. Later refinements
  rerun the affected brand/build checks. Windows sandbox process/network denials
  were rerun through permitted execution and not counted as application passes.
- Brand checks cover supplied SVG/geometry fingerprints, duplicate IDs, SSR
  without browser/WebGL, public/control separation, wrong-role/AAL1/missing
  step-up/provider/SQL/audit denials, exact timing, pause, hidden/offscreen
  suspension, drag, eight-second rotation and disposal of all scene resources.
  The scheduling harness uses a synthetic renderer; it is not GPU profiling.
- Selected text/action colours meet 4.5:1 contrast; large gradient-heading stops
  meet 3:1 on charcoal. This is sampled numerical contrast, not a whole-site
  WCAG audit. The primary button uses a dark label surface and exact-gradient
  border to avoid white text over bright cyan. [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Browser samples show the faithful logo, a completed session introduction,
  shared navigation and new availability pages. At requested 320px width,
  available CSS width and scroll width both measured 305px; no horizontal
  overflow. Mobile navigation opens/closes, and Escape restores toggle focus.
  Further final browser/HTTP results are recorded in the addendum.
- Native browser zoom shortcuts did not change the viewport through the browser
  tool, so actual 200% zoom remains **unverified**. Reflow samples do not replace
  that acceptance case. Screen-reader, complete keyboard/form audit, true reduced-
  motion/WebGL-disabled devices and real touch/low-power hardware remain open.
- Root and web dependency audits each report zero vulnerabilities. Source SSR
  harnesses emit Three's CommonJS deprecation warning; application Three imports
  are ESM. Synthetic invalid-cookie fixtures emit expected SDK decoding warnings;
  they are not browser console errors or provider-secret evidence.

## Performance evidence and limits

The existing optimized homepage was measured before rebuilding. HTML-declared
initial scripts: **10 files, 601,795 raw bytes, 189,321 gzip bytes**. The first
upgraded measurement was **11 files, 616,857 raw bytes, 194,396 gzip bytes**:
about **5,075 additional gzip bytes (2.68%)**. HTML grew from 54,816 to 69,283
bytes, including immediate inline SVGs and new content. Final payload figures
are recorded after the last build in the addendum.

This measurement excludes later lazy chunks, fonts, actual connection scheduling,
LCP, CLS, battery use and frame timings. Three.js is deferred in source and
has no initial static logo import; no measured Lighthouse score of 90, improved
LCP or real-device frame budget is claimed. Accessibility/SEO/best-practices
scores remain unmeasured. Indexing remains disabled for the preview.

## APIs, real data and unfinished workflows

The existing health, identity, membership, tenant, Auth and security APIs remain.
The internal lab reuses online identity verification and current database role
status, followed by the existing audited `protected.check` for `security.read`.
Only SUPER_ADMIN with recent genuine MFA is eligible; no browser role or query
parameter grants access. SQL rechecks provider session/native receipt and current
assignment. An unavailable audit or infrastructure denies rendering. No new
role, capability, table, migration, login, Storage permission or payment setting
was added. Production security enablement remains rejected by existing config.

The six catalogue products/prices remain labelled visual fixtures. Studio models
remain unverified draft studies, and device drafts remain local. The vendor
preparation tool remains self-declared and unsubmitted. There is no mock working
vendor directory, booking, order queue, account balance or support-ticket API.

Private uploads/quarantine/scanning/retention, real product options and server
pricing, cart, booking, payments, vendor storefront/verification, proof revision/
approval, production/QC, delivery/tracking and customer/vendor/admin operational
dashboards remain implementation dependencies. Their absence is not hidden by
attractive layouts or fabricated empty history. Customer recovery codes/session
management, genuine hosted MFA and operator recovery also remain unaccepted.

## Scoped security review

Attacker paths reviewed: direct/prefetch/RSC/HEAD lab access, forged role query,
stale or missing MFA, wrong role, provider or audit outage, duplicate SVG IDs,
untrusted archive paths/scripts and deferred rendering failure. Server denial
occurs before controls render, independently of client navigation. Lab controls
only change a local view; they grant no platform write authority. Auth proxy
retains private/no-store behavior and verified provider checks.

Archive extraction rejected path traversal, symlinks, absolute paths and oversized
payloads. Files were treated as reference data, not executable instructions.
The inspection plugin/dependency tree was excluded. No customer artwork, private
vendor record, credential or signed URL was copied into brand assets/reports.
Only a session completion boolean is saved for animation. Existing customer
draft limits and private-file gates are unchanged.

Source/model/SVG lifecycle checks, repository heuristics and browser-bundle scans
are scoped application evidence, not a pentest of the OS, provider or whole
Production system. No destructive scan, live fund flow, human approval simulation
or hosted Auth/SQL/role mutation was performed.

Supabase's [October changelog](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
announces removal of outdated CBC TLS suites from 10 November at the earliest;
no legacy cipher exception or client package change was introduced. Genuine
hosted compatibility remains open. [Node's HIGH advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules fixes for 21 October. Passing the static 24.21.0 baseline and npm
audit does not clear that release gate.

## Hosting, definition of done and rollback

**No successful Vercel Preview URL exists for this upgrade.** The dedicated
acceptance project still has 25 Preview-only environment records, no Git or
integration inheritance, existing protection and only the earlier ERROR deployment
`dpl_Fmd4yCnc5rB17Xiwttj1YMDyM7uj` with actual target Production. Its reserved domain
is not a working preview. The [upstream issue](https://github.com/vercel/vercel/issues/17069)
remains open. Existing runbook forbids a temporary Production bootstrap or
environment-guard weakening. No additional failed attempt or original-project
deployment was used to bypass that boundary.

Production [virtual-ink.vercel.app](https://virtual-ink.vercel.app) does not contain
this upgrade and is not acceptance evidence for it. No push/merge/promotion,
Production secret, database, Storage, DNS or payment change was made. The
standing after-phase Git push gate remains unmet because no phase has completed;
the original remote integration must not substitute for isolated acceptance.

| Definition of done group | Actual state |
| --- | --- |
| Supplied brand fidelity and reusable modes | Implemented locally; remaining real-device/fallback acceptance |
| Existing secure routes and functionality | Source preserved; local regressions pass; hosted acceptance pending |
| Separated customer/vendor/admin operations | Existing gates retained; full operational dashboards unbuilt |
| Commerce/proof/production/payment/delivery journeys | Public information improved; genuine workflows incomplete |
| No-WebGL/reduced-motion/mobile/accessibility | SSR/scheduling/contrast/narrow-layout samples; full acceptance pending |
| Real APIs and honest dependencies | Existing contracts reused; unavailable services disclosed |
| Tested isolated Vercel Preview | Blocked |
| Approved Production release and rollback | Not authorized or performed; rollback instructions prepared |

Local rollback: use pre-upgrade `92a5ce8` in a clean checkout, install pinned
dependencies and rebuild; preserve user work and do not reset or force-push.
For a future approved release, retain the previous verified Vercel deployment,
revert its alias only through the reviewed release plan, and repeat public/auth/
resource denials. No database rollback is required by this source-only UI slice.

## Next action for each lead

- **Uchi:** review the supplied-brand port and remaining acceptance; resolve the
  supported isolated Preview path and patched runtime before release. Keep the
  full upgrade and Phase 1 open; coordinate the next private-file/order slice.
- **Mumba:** review lab gate/audit behavior and preserved API contracts; implement
  genuine private upload, pricing, order/proof and role-workspace endpoints with
  assignment/expiry/concurrency denials rather than UI-only authorization.
- **Taizya:** visually compare against the supplied reference on real devices;
  test reduced motion, WebGL failure, touch, 200% zoom, screen reader, forms and
  full-role workflows. Measure Lighthouse and real animation performance.
- **Lubasi:** supply verified vendor/product/price/coverage evidence, approved
  support/contact and operations policies, proof/QC/handoff workflows and rights
  before any real listing, quote or production promise.

Recommended next work stays in Phase 1: private files and the actual
configure/quote/order/proof/production journey, then operational dashboards and
hosted acceptance. No escrow/blockchain or growth-phase expansion is introduced.

## Final evidence addendum

The final optimized build passes after the inertia, transparent foreground and
information-page typography refinements. Loopback checks pass **82 brand**, **53
public**, **44 disabled-Auth** and **72 studio** assertions. The browser artifact
scan passes across **63 files**, with no scanned secret patterns. Final initial
scripts total **617,224 raw / 194,512 gzip bytes** across eleven files: **5,191
gzip bytes (2.74%)** above baseline. HTML remains 69,283 bytes.

The final browser sample confirms the pricing page's 860px content width,
60.8px desktop heading and restored list markers. A fresh-origin homepage
progressed from immediate SVG/skip control to its completed static session state.
An actual animated GPU frame was not captured, so positive WebGL animation
acceptance remains open. Sampled browser logs contain the expected unavailable
local Vercel Analytics notice and no application error. Browser tooling emitted
its own network telemetry errors; these are not application results. A final
320px override did not take effect (DOM remained 1466px wide); it is not a new
mobile pass. The earlier 305px available-width sample remains the narrow-layout
evidence. Final sampled error-level browser logs were empty.

Matching Word generation passes the repository's structural/table audit. Visual
rendering was attempted; after retrying the sandbox restriction with permitted
execution, conversion stopped because LibreOffice is unavailable (WinError 2).
Word layout is therefore not visually verified. Final link/package/privacy
checks and the review commit are recorded below. No Vercel URL or successful
deployment is invented.

Source review commit: `5ac905c953c318c18d1dab5a6548ce1f99c4e603` on
`codex/ui-brand-upgrade`. Document QA passes for eight Markdown files and 244
local links, the Word definition-of-done matrix and OOXML/package/privacy checks.
Final repository security heuristics pass over 413 scanned files with no
findings. These are scoped checks. The handover follows in a separate local
commit; no push/deployment or phase completion is claimed.
