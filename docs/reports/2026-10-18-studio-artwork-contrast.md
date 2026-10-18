# Virtual Ink — studio artwork contrast

Date: 18 October 2026. Phase 1 review slice; full studio and MVP incomplete.
Implementer: Codex under the Shadow Root standard. Human review and acceptance
remain pending. Source branch: `codex/studio-artwork-contrast`.

## Change and user impact

The studio previously warned only when artwork and product colours matched
exactly. It also compared image layers' unused text-colour metadata, producing
false warnings without inspecting image pixels. Text now uses an sRGB luminance
contrast estimate; ratios below 3:1 produce an advisory with the actual ratio and
the suggested remedy of choosing a lighter/darker text or product colour.
Changing colour preserves artwork. Image contrast remains explicitly unmeasured.

The 3:1 screen-preview guideline is an implementation advisory, not an approved
vendor production policy, a printed-product WCAG claim or a checkout gate.
Fabric, ink, underbases, transparency, overlapping layers and image colours need
vendor review. The artwork-check list has an accessible label and polite live
updates. Its announcement behaviour still needs screen-reader acceptance.

An initial suspicion about newline handling was disproved by byte inspection;
no newline defect or fix is claimed. Existing multiline legibility is covered
by an added regression. No supplied logo geometry, assets or animation changed.

## Files, services and preservation

- `src/shared/studio-design.ts`: screen contrast estimate and text-only warning.
- `apps/web/src/components/product-studio.tsx`: advisory wording and live list.
- `test/product-studio.test.ts`: luminance extremes, channel transfer, near-match,
  threshold, product-colour changes, image false positives and multiline checks.
- `scripts/studio-http-checks.mjs`: two extra rendered-page assertions.
- `docs/product-studio.md`: actual warning limitations and corrected hosting note.

Route modified: `/studio`. No routes, dependencies, API contracts, migrations,
permissions, provider configuration or asset formats were added or removed.
No genuine API integration is added. Products remain unverified studies; stock,
pricing, supply, size grading and model approval are unknown. No supplier rights
or commercial partnership is implied. UI-only server uploads, login, orders and
payments remain disabled. Unrelated `next-env.d.ts` and the untracked supplied
reference directory remain untouched and unstaged.

## Verification

Reviewed local runtime: Node 24.21.0. All required executed checks pass after
the local preview readiness retry described below.

| Scope | Actual result | Limit |
| --- | --- | --- |
| Root tests | 218 pass, 0 fail, 0 skipped | Backend/shared unit scope |
| Coverage inventory | 43/43 executable files; none omitted | Not product or frontend coverage |
| Lines | 2473/2492 = 99.23756019261637% | 95% gate passes |
| Branches | 1883/1950 = 96.56410256410257% | 95% gate passes |
| Functions | 239/242 = 98.7603305785124% | 95% gate passes |
| Security regressions | 197 pass | Existing scoped suites |
| Web SSR/handler/brand checks | 31 pass | Not real hosted role workflows |
| Auth SDK/Next checks | 16 pass | Synthetic providers |
| Focused studio tests | 9 pass | Included within root total |
| Studio loopback HTTP | 74 assertions pass | Built page and blank assets |
| Types, lint, build | Strict backend/web types, source lint, optimized Next build pass | Local environment |
| Client artifact scan | 63 local files, no findings | Not full hosted asset review |
| Repository heuristics | 423 scanned, 109 skipped; no findings | Heuristic scope, not proof of no secrets |
| Dependency audits | Root and web: zero advisories | Runtime bulletin tracked separately |
| SQL / genuine MFA | Not rerun | No SQL/Auth changes; historical results are not fresh evidence |

Commands: `.private/verify-phase1-readiness.ps1`, focused Node product-studio
tests, `node scripts/studio-http-checks.mjs`,
`node scripts/security-artifact-check.mjs`, root/web `npm audit --json`.
The task-owned preview initially exceeded its readiness window; logs showed
Next Ready after 10.6 seconds. A later request and all 74 assertions succeeded.
This startup timeout is recorded rather than counted as an application failure.
The root coverage module-type warning and SSR Three CommonJS deprecation remain
test-harness warnings; neither was silently counted as a failed app flow.

## Security review

Reproduction used synthetic text/image layers. A near-matching text colour
previously emitted no contrast warning; an image whose irrelevant metadata
matched the blank previously emitted a false warning. These are preflight
correctness findings, not demonstrated authorization bypasses. The tests now
cover both cases and confirm product-colour changes preserve layers.

Attacker prerequisites for imported-draft abuse remain local file selection or
same-origin script access. Existing exact keys, validated hexadecimal colours,
bounded layers/image dimensions, restricted zones and disabled server uploads
remain enforced. The new calculation does no network, HTML injection, file read,
storage write or privileged operation. React escapes warning strings. Device
drafts remain accessible to same-origin scripts and users of the browser profile.
No real customer artwork, credentials, bypass tokens or approvals were used.

Tool output was treated as data. Only reviewed committed source enters the
deployment snapshot; attachments, private directories, environments and Word
documents remain excluded. No protection downgrade, original-site promotion,
database mutation, paid upgrade or credential extraction was authorized or done.
This is a scoped application review, not a workstation/provider/system pentest.

The [official Node notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
was rechecked: fixes for HIGH issues in 24.x are scheduled on or shortly after
21 October. The high-risk gate still blocks sensitive release; disabled UI
foundation work does not resolve it. npm audit alone cannot close that gate.

## Hosted evidence and phase gates

Protected test URL:
https://virtual-ink-ui-test-e1y5xk380-shadowrootsec-5679.vercel.app/studio

Project: `shadowrootsec-5679/virtual-ink-ui-test`,
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`. Deployment:
`dpl_HpMtV9yYkxLfQez1BMD2iQJ1QoJm`, READY. Deployed source:
`7471bfe9d9c710ed0bdd5ea8e68cd891063a986e`; 408 reviewed upload files.
Actual Vercel target: Production; application profile: `ui_test`, under the
existing explicit user-approved exception. This is not a full-service Preview
or promotion of the original live project. All sixteen disabled-only entries,
project identity, root, no Git/integration inheritance and deployment protection
were checked before upload. No credential or service binding was supplied.

The Shadow browser profile opened the protected deployment normally. Hosted
checks verified the studio heading, disabled-services banner, default text,
Forest's 1.32:1 warning, Chalk clearing it and undo/redo restoring the appropriate
state. Layer options still contain the original text after history changes.
The warning list exposes its polite live attribute and limitation wording.
Hosted `/brand-lab?role=SUPER_ADMIN` redirects the guest to `/login`, whose
email/password inputs are disabled; no replay/lab controls are exposed. A caller
query parameter does not confer a role. Full other-role/tenant checks remain open.
Desktop available/scroll widths are both 1521 pixels. At the requested 320-pixel
mobile viewport, available/scroll widths are both 305 pixels (scrollbar included
in the requested outer width). The 44 by 44 pixel Forest control works and the
full warning wraps within its card. A mobile screenshot was visually inspected.
The scroll command timed out, but a fresh DOM read and screenshot confirmed it
had scrolled correctly; no repeated blind action was taken. Sampled studio
application error logs returned an empty list. This is not all-route/role QA.

Remote build passed `ui_test` environment isolation, source lint, Next compile
(5.2 seconds) and 22-page generation (2.2 seconds). Both remote installs reported
zero dependency advisories. Vercel's npm cache-dir deprecation warning remains;
these build timings are not user-perceived performance or Lighthouse scores.
The browser snapshot API failed; bounded read-only DOM checks were used instead.
Browser-tool telemetry errors are separate from application console evidence.

Original live deployment was read before and after this update; both matched:
`dpl_7f4Kj1XeRy1Mf3MrQiSV9PEs7PWB`, source
`a6736376b09ba7c3242495ff86b4bb2eea62f20c`, READY on main. It was not deployed,
promoted or reconfigured by this slice.

| Gate | Phase status | Current evidence / remaining owner |
| --- | --- | --- |
| VH-01 project | Pass for UI test | Shadow Root project/root observed; original Git integration preserved |
| VH-02 deployment | Pass for UI test | Exact READY deployment and source above; full release unapproved |
| VH-03 Preview | Blocked | Actual UI target is Production; full-service Preview unresolved, Uchi/Mumba |
| VH-04 environments | Partial | Restricted UI-only profile passes; genuine services unavailable, Uchi/Mumba |
| VH-05 client secrets | Pending | 63 local artifacts clean; full deployed bundle review outstanding, Uchi |
| VH-06 database | Blocked | Deliberately unbound UI test; genuine app acceptance pending, Uchi/Mumba |
| VH-07 storage | Blocked | Server uploads/scanning/private retrieval unbuilt, Uchi/Mumba |
| VH-08 Auth | Blocked | Login disabled; genuine hosted Auth/MFA acceptance pending, Uchi/Mumba |
| VH-09 dashboards | Blocked | Real customer/vendor/admin operations incomplete, Uchi/Mumba |
| VH-10 APIs | Pending | This slice exercises local studio; deployed service success unverified, Mumba |
| VH-11 authorization | Partial | Hosted guest lab/query-role denial passes; complete wrong-role/tenant tests outstanding, Uchi |
| VH-12 pages | Partial | Hosted studio checked; full current-commit route/404 matrix pending, Taizya |
| VH-13 mobile | Partial | Current-commit 320-pixel studio DOM/visual/control checks pass; real devices and full routes pending, Taizya |
| VH-14 console | Partial | Sampled studio error logs empty; genuine role flows unavailable, Uchi |
| VH-15 build logs | Pass for UI test | Reviewed successful build plus documented cache-dir warning |
| VH-16 domain | Documented | User will buy a domain later; none connected or changed |
| VH-17 URL | Pass | Actual protected tested deployment supplied above |

## Remaining work and next actions

- Uchi: review this slice, retain disabled UI-only scope, coordinate actual
  Phase 1 acceptance and runtime patch review. No human signoff is inferred.
- Mumba: progress genuine isolated Auth/private-file/order/pricing/proof
  contracts and audit/denial evidence; resolve compatible MFA-hook hosting.
- Taizya: review warning readability and polite announcements with a screen
  reader, keyboard, 200% zoom and real mobile devices; review physical models.
- Lubasi: obtain real SKU supply, measurements, stock/current ZMW price,
  asset/trademark permission and vendor preflight limits, including contrast.

Vendor policy remains open under STUDIO-PROOF-01. Full pixel/colour-mode/font/
thin-line/bleed preflight, secure uploads/quarantine, real server pricing, cart,
orders, vendor-issued proofs, production/delivery and role dashboards are unbuilt
or unaccepted. Comprehensive accessibility, Lighthouse and performance metrics,
true no-WebGL/reduced-motion/device acceptance and all hosted integrations remain
open. A local coverage result or attractive hosted page does not close Phase 1.

## Rollback and delivery

Revert source commit `7471bfe9d9c710ed0bdd5ea8e68cd891063a986e` on a review branch
and validate, or redeploy prior verified UI-only source
`ad55dfba993446c3089e3783e743cb170c1bd6e5` to the same isolated project using the
[UI test guide](../vercel-ui-test.md). Keep protection and disabled flags intact.
No database rollback or live-site alias change is needed. Do not force-push or
push through the original project's automatic production deployment integration.

Matching Word output passes generator structural checks. Visual Word QA is
unavailable without LibreOffice; the rendering attempt and final structural/link
checks are recorded at handover. Rendering failed with WinError 2 because the
conversion executable is unavailable. Seven changed Markdown files and 239 local
links pass validation; Word ZIP/XML, real numbering, privacy and both tables
(including all seventeen phase gates) pass. Source and handover are local review
commits; no push, phase closure or human acceptance is claimed. Report delivery
is not production readiness.
