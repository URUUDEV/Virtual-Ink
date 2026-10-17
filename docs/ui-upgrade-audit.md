# UI upgrade audit and preservation checklist — 17 October 2026

This pre-edit record follows the master UI/UX brief. The full upgrade is not
complete, and the inspected application is not yet production-ready. Preserve
the existing backend and feature gates while porting the authoritative brand.

## Reference inspection

The supplied ZIP was found in Downloads, extracted safely into an ignored private
directory and inspected without running its scripts. All 79 files (571,731
uncompressed bytes) match the existing supplied folder byte-for-byte. Archive
SHA-256: `18769dfcd6f0eeae73a24af78de6a8b20da3d0f1d46f9fccee4e29f69e48d9c8`.
ZIP entries were checked for traversal, absolute paths, symlinks and size limits.
Existing supplied assets remain unchanged and untracked.

Required files reviewed: `VirtualInkAnimatedLogo.tsx`, `VILogoSVG.tsx`,
`vi-geometry.ts`, `Hero.tsx`, `Versions.tsx`, `index.css` and `package.json`.
Remaining archive inventory includes Vite/Tailwind configuration, lockfile,
generic UI primitives, app/router entry points and documentation. The reference
is a single-page brand demonstration, not a commerce backend.

Preserve exact monogram shapes, geometry parameters, cyan/blue/purple/magenta
gradient stops, pixel layout, dark I and droplet. Preserve the six-second
formation timeline and 240-particle ceiling. Port runtime behavior to existing
Three.js; do not add Fiber/Drei solely to reproduce an existing renderer.
Do not install the archive's Vite, router, inspection plugin or unused UI stack.

Reference defects requiring integration fixes: synchronous WebGL/browser reads
during render, mutable ref updates during render, fixed duplicate SVG gradient
IDs, no document-hidden suspension and a static black wordmark on dark surfaces.
Preserve monogram paths/colours while adapting IDs, lifecycle and wordmark
contrast using the reference's existing light/dark text treatments.

## Existing stack and contracts

Next.js 16.4 App Router, React 19.2, TypeScript 5.9, Tailwind 4, Three 0.186.1,
Lucide and locally bundled fonts. The archive uses Vite/Tailwind 3; it must not
replace this stack. Next's installed client/server and lazy-loading docs were
read before editing. Current primary typeface is Poppins, whereas the reference
requires Space Grotesk. Four brand colours exist; blue/dark-panel and central
spacing/motion/layer tokens are missing. Existing components cover navigation,
footer, product cards/explorer/showcase, forms, vendor preparation, account/MFA,
error/loading and local design studios.

API surface: `/health`, `/api/v1/health`, `/api/v1/me`, caller memberships and
tenant access; server Auth actions/callbacks and restricted security commands.
Web-to-app binding and environment isolation enforce server boundaries. Genuine
hosted login/runtime DB/Storage are not enabled. Security administration has
provider-backed local TOTP and dual-approval foundations; hosted MFA, operator
recovery and native hook availability remain open. Eight-role authorization is
server/database-owned; never take role claims from browser form fields.

Product discovery currently uses six explicitly labelled visual fixtures with
illustrative prices. The studio has draft original models, not supplier-approved
SKUs. Vendor onboarding is a local preparation tool, not approved intake. No
public vendor directory/storefront API is available. Do not fabricate trusted
vendors, reviews, revenue, order counts or backend-calculated prices.

Private file upload/scan/order assignment, authoritative configuration/pricing,
cart, payment, delivery, transactional proofs and operational dashboards are
unbuilt or disabled. No persisted order/payment lifecycle is verified. Pure
permission rules and local reference versions are not working commerce flows.
No live escrow, wallet or payment language is warranted.

## Route and functionality preservation

- [ ] Retain `/`, `/shop`, all six `/shop/[slug]` detail routes and their unknown
  slug 404; preserve product filters, search, sort and honest fixture labels.
- [ ] Retain `/studio`, its GLB/SVG assets, private local artwork limits and
  drafts, plus `/customize/cotton-t-shirt` and its separate historical drafts.
- [ ] Retain `/design-services`, `/business`, `/how-it-works`, `/roadmap`,
  `/vendors/join` and functional existing links/forms/downloads.
- [ ] Retain login/register/forgot/reset, both Auth callbacks, `/account`,
  `/admin/security`, all existing Auth/security APIs and server revalidation.
- [ ] Preserve proxy protection for customer/vendor/admin/account/reset routes;
  protect any new `/brand-lab` on the server before rendering internal controls.
- [ ] Preserve health/identity/membership/tenant APIs, transport binding,
  authentication cookies, private-cache headers and guest/wrong-role denials.
- [ ] Preserve fourteen local migrations, RLS, audit, privileged writes, MFA,
  upload restrictions and all environment/provider adapters. No schema or grant
  change is required for a brand port.
- [ ] Preserve user-owned Next type changes, attachment directory, historical
  reports, supplied imagery and existing unrelated work.
- [ ] Run existing root/security/SSR/SDK/type/build/HTTP regressions and the full
  95% backend/shared inventory gate; document other surfaces separately.

## Accessibility, mobile and performance findings

Current navigation has a labelled toggle and Escape handling; retain it and
check focus/menu behavior at 320px and 200% zoom. Tiny 8–12px operational copy,
small carousel/filter targets, inconsistent form feedback and scattered colours
need review. Existing visible focus, semantic labels and status/alert regions
are foundations, not WCAG certification. Replace the typography centrally and
check contrast rather than using cyan as small text on white.

The reference's unrestricted continuous animation needs page-hidden/offscreen
suspension, lazy loading, immediate static markup, reduced-motion and WebGL
failure handling, resource cleanup and touch-safe horizontal interaction.
Public continuous motion also needs a user pause mechanism under WCAG 2.2.2;
use an accessibility pause control, keeping replay/mode/speed controls internal.
Mobile splash must be dismissible, session-scoped and never block navigation.
Dashboards should use static branding. Font and Three.js transfer/runtime costs
need measured evidence; no Lighthouse score of 90 or production performance
claim is established by this audit.

## Implementation order and release boundary

First establish tokens and isolated faithful brand components, then the shared
shell/feedback and public pages, then authenticated journeys only against genuine
available contracts. Keep unavailable actions explicitly unavailable; do not
silently simulate them. Record security evidence and a dated Markdown/Word
handover for each reviewable slice before progressing.

Preview must use isolated services and retain deployment protection. The current
dedicated project's first-deployment target classification, compatible Auth hook,
runtime HIGH advisory and private-service acceptance gates remain open. No
Production secrets, DNS, storage policy or live payment changes are authorized.
Production release requires critical checks, explicit approval and rollback.
