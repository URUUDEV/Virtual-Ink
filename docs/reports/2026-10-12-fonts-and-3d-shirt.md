# Virtual Ink - Fonts and 3D Shirt Preview

Date: 12 October 2026

Company: Shadow Root Security Technologies

Scope: Bundled font selection and an interactive local 3D T-shirt concept preview.

Status: Engineering delivery for review. Human acceptance and genuine onboarding remain open.

## What changed

The editor now offers Poppins, Space Grotesk, Bebas Neue, Playfair Display,
Caveat, Arial and Georgia with visible type samples and accessible radio controls.
Four additional font families are bundled with the application. The canvas waits
for the selected font before rendering text, including PNG export. Bebas Neue
uses its supplied regular weight. Existing version-1 drafts remain compatible.

The 3D shirt uses a fixed procedural mesh with front/back surfaces, curved torso,
approximate folds and edge depth. Its front texture shares the 2D text/artwork
coordinates. Front, back, reset, zoom, pointer rotation and keyboard arrows are
provided. The back is unprinted; viewing does not change design history. PNG
downloads remain 2D concept layouts. This is an illustrative model, not a vendor
garment, measurement, cloth simulation or production proof.

Three.js 0.186.1, TypeScript definitions and four font packages use exact versions
with the web lockfile updated. The renderer loads only when 3D is selected and
renders on demand. Closing it disposes GPU resources, observers and pending frames.
WebGL failure provides a return-to-2D control. The initial taller font list pushed
the preview down; bounded font scrolling and preview alignment correct that defect.

Existing source, supplied assets, historical reports and saved drafts were preserved.
No database, authorization, credential, hosted service or deployment changed.
Uchi reports artwork working; this is user-reported evidence, not an automated
raster-decoder acceptance result.

## Actual verification

| Check | Actual result |
| --- | --- |
| Root suite | 121 passed, zero failures |
| React rendering and mesh checks | 7 passed, zero failures |
| Security regression subset | 110 passed, zero failures |
| Web/shared TypeScript | Passed |
| Runtime and repository heuristics | Passed on reviewed private Node 24.21.0 |
| Installation and production dependency audit | Zero reported vulnerabilities |
| Font draft/history regression | New choices round-trip; URL, prototype, array and object values rejected |
| Mesh checks | Finite bounded front/back geometry and texture coordinates pass |
| Chrome controls | Font selection, colour, 3D initialization, front/back, zoom, reset and keyboard rotation pass |
| Final production build | Passed after the layout fix, on private Node 24.21.0 |
| Rebuilt loopback HTTP harness | 49 assertions passed |
| Responsive geometry | No horizontal overflow at 1440, 1024, 768, 390 and 320 pixels |

Desktop shirt and full mobile screenshots were visually inspected. The rebuilt
DOM confirms the corrected preview alignment. The initial build-worker spawn EPERM required an approved retry.
Build warnings retain the existing missing-pg module for disabled backend routes
and multiple-lockfile root selection. Source tests emit module/CJS notices.
These warnings do not establish genuine backend readiness.

## Scoped security evidence

An attacker needs malicious selected artwork, forged same-origin draft storage,
a dependency flaw or same-origin script compromise to reach this surface.
Existing admission, authority, placement and closed-upload negative tests pass.
Font selection remains a strict string allowlist. No remote font/model loader,
arbitrary CSS or privileged API is introduced. Fixed geometry, bounded canvas
resolution, pixel ratio capped at two and stale-texture cancellation limit local
resources. No new security bypass, decoder exploit or takeover was reproduced.

Same-origin scripts can still read explicitly saved drafts. Decoder/GPU failures
and dependency vulnerabilities remain conditional risks. Default Node 24.14.1
fails the reviewed minimum; private Node 24.21.0 passes. Official Node listings
and the Next cache advisory were checked. The root catch-all condition is absent;
unresolved release/advisory and bundle/history gates remain open.

Tool/page output was treated as data. Probes used synthetic inputs and loopback.
Required execution approvals were used; preview ownership is checked before
restart. No credential, customer artwork, private vendor evidence or Word lock
file was disclosed or removed. No external message, hosted write or human
approval occurred. This is a scoped application review.

## Limits and next actions

- Uchi: Review fonts/3D with Taizya and record acceptance under UX-02/UX-03; review the next vendor registration slice.
- Mumba: Verify artwork texture/draft/export and WebGL failure/context loss; retain genuine Auth/pg/TLS and release gates.
- Taizya: Review fonts, model appearance, keyboard focus, mobile layout, screen-reader output and actual zoom.
- Lubasi: Supply verified garment/print/proof constraints and private vendor discovery/approval evidence.

Automated artwork import remains limited by Chrome file permissions. Live
artwork texture/export round-trip, context loss, assistive technology, 200% zoom,
cross-browser and full accessibility checks remain open. The next slice prepares
a vendor profile for review. Genuine activation still requires private provisioning
and reviewed approval evidence. Server uploads and payments remain closed.

## Report checks and references

The Word report uses the existing compact_reference_guide preset and memo_masthead
pattern, with the generator's named title/code/table overrides. The generator
checks XML/package integrity and explicit table geometry; a separate content,
privacy, preset and local-link audit accompanies delivery. LibreOffice is absent; Word
rendering and visual QA cannot be completed.

Official references: https://threejs.org/docs/pages/CanvasTexture.html,
https://threejs.org/docs/pages/WebGLRenderer.html,
https://nodejs.org/en/blog/vulnerability and
https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p.
