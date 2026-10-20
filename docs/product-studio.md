# Product design studio

Status: **local design-lab slice; mandatory studio and Phase 1 incomplete**.

20 October [precise measurements](reports/2026-10-20-studio-precise-measurements.md):
selected layers expose five decimal fields for centre position, unrotated size
and angle. Apply commits them together through safe-area fitting; Reset entries
discards unsubmitted typing. Invalid and unchanged input preserves design/history;
post-fit dimensions below the existing 0.1 mm draft minimum reject. Sliders share
the same placement path. Local native checks pass and the UI-only Preview is
Ready; exact-source hosted interaction and physical-device checks remain open.

20 October [model conformance audit](reports/2026-10-20-studio-model-conformance.md)
validates all nine GLBs with the pinned Khronos tool: zero errors/warnings and
104 retained informational notices. Run npm run check:studio:assets after the
separate ignored tool installation documented in the report. Four in-memory
negative controls cover truncation, invalid position data, external resources
and missing print surfaces. This does not verify SVGs, GPU output or suppliers.

20 October [preview safety follow-up](reports/2026-10-20-studio-preview-safety.md):
stale texture failures cannot overwrite newer preview state; layout preparation,
success and failure are announced independently. Retry layout redraws the current
design. Abandoned canvases clear only after their painter settles, including
failed sibling zones; committed texture canvases remain until replacement or
disposal. Cancellation prevents application of obsolete results but does not
forcibly abort decoders, fonts or model requests. Hosted/device results retain
the source and limitations in that report.

Open `/studio` through the existing web application. Product-detail pages link
to the lab. The legacy `/customize/cotton-t-shirt` editor remains a separate
historical concept tool; its drafts are not silently migrated.

## Delivered boundary

The shared registry `src/shared/product-models.ts` contains the requested model,
commercial, verification, materials, size/colour, licence, camera, lighting, UV,
zone and restricted-zone fields. Ten draft definitions cover eight garment
studies, one ceramic mug and one flat card. Every spatial entry has its own
named GLB. No definition is approved for sale. Unknown supplier, price, stock,
fabric, size-chart and verification data remain explicitly unknown.

`src/shared/studio-design.ts` enforces versioned local designs, bounded imported
data, whole rotated artwork bounds, method/zone compatibility, physical DPI
warnings and unapproved reference revisions. PNG header inspection is shared
with the old editor, preserving its existing tests and limits. Drafts contain
no price, order, approval or tenant authority.

Text preflight estimates sRGB luminance contrast against the selected blank
colour. Ratios below 3:1 produce an actionable advisory, including near matches;
changing product/text colour recalculates it without modifying artwork. This is
a screen-preview guideline, not an approved vendor policy, WCAG certification
for printed products or a checkout decision. Image pixels, transparency,
overlapping layers, underbases, inks and fabric still require vendor preflight.
Image layers no longer receive false contrast warnings from unused text-colour
metadata. The labelled artwork-check list announces changes politely.

The browser loads only the selected model after entering 3D. It paints private
local artwork onto runtime canvases; static models contain only blank geometry.
Named front/back surfaces have independent textures. Mug artwork uses a separate
300-degree cylindrical surface, excluding its handle, rim, interior and base.
Controls include text, three bundled fonts, colour, separate surfaces, PNG/JPEG,
numeric/range positioning, scale/rotation, centring, duplicate/remove layer,
undo/redo, quantity, notes, optional device save/reopen/remove, JSON copy/import,
zoom, pointer/keyboard rotation, reset/retry and layout-reference generation.

One preparation runs at a time. Cancel preparation, a valid device-draft reopen,
product change, undo/redo or closing the editor invalidates unfinished work.
Edits cancel a pending JSON replacement or layout reference, preserving newer
changes. Artwork appends to the current design only if the twelve-layer and 6 MB
limits still pass when decoding finishes; rejected additions never claim success.
Cancelled/stale reference rendering does not download or advance a local version,
and its temporary canvases are cleared when rendering settles. Cancellation
prevents applying the result; it cannot forcibly stop an already running browser
decoder or guarantee immediate memory erasure. Deterministic handler tests control
decoder/painter timing; those are separate from real-browser race acceptance.

PNG/JPEG input is at most 2 MB, 4096 pixels/side and 16 MP; decoded content is
re-encoded to PNG at a maximum 1024-pixel side. DPI uses those actual preview
pixels, never a silently increased resolution. Retain the original for eventual
vendor preflight. Twelve layers and a 6 MB design bound limit local work. SVG/PDF
remain unavailable until secure quarantine, scanning and vendor policy exist.

The [18 October hosted record](reports/2026-10-18-hosted-studio-verification.md)
verifies separate text surfaces, colour changes, device save/reopen and a real
downloaded two-view layout reference for a controlled synthetic design. File
attachment, forced timing races, full reload/keyboard/mobile acceptance and
cleanup after a later connection reset remain open. This is partial browser
evidence for the existing source, not certification of the mandatory studio.

The subsequent [canvas repair](reports/2026-10-18-studio-canvas-fallback.md)
fixes blank 3D-to-layout transitions and reapplies current artwork, colour and
surface after viewer recreation. The final protected build passes these narrow
hosted checks. Earlier draft-cleanup uncertainty is resolved; real touch, complete
fallback/accessibility and local file-import acceptance remain open.

The size selector honestly offers only a reference sample. Supplier size grading,
additional placement zones and comprehensive decoration simulations remain open.
No renderer can certify a physically accurate print size on an unmeasured blank.

Layout mode works without loading the renderer and includes static references,
colour and physical safe-area plans. Mug plans are explicitly flattened wrap
references. The GLB view renders on change, pauses while hidden/offscreen, uses
no automatic motion, and lowers pixel ratio/anti-aliasing for coarse pointers.
Actual low-power hardware, touch and forced-context-loss acceptance remain open.

Generated JSON layout references contain the captured configuration, SKU,
method/quantity/size, layer dimensions/positions, notes, view images, creation
date, local version and awaiting-vendor status. Order number/vendor notes are
null. They are **not vendor-issued proofs or approval records**. A pure revision
helper clears approval fields on changes; audited server approvals, immutable
production files and order-scoped proof versioning are not built by this slice.

## Original assets

Run `node scripts/generate-studio-models.mjs` with the reviewed Node runtime after
installing existing web dependencies. It generates deterministic GLB/SVG files
in `apps/web/public/models/studio-v1`. Geometry and fallback vectors were authored
for this repository from mathematical shapes; no supplier assets were used.
Asset attribution is to Virtual Ink project contributors, for project review.
This is provenance for original demonstration work, not legal signoff or an
external commercial asset licence. Do not mark these assets `licensed` or
production-verified without the required review.

Distinct assets include short/long sleeves, collar leaves/buttons, hoodie hood,
drawstrings/pocket, fitted/adult/child proportions and mug lathe/handle geometry.
These are geometric studies, not tailored/manufacturing scans. Garment thickness,
seam joins, fabric drape, anatomy/cut and supplier accuracy still need professional
modelling review. Dimensions, capacity and fabric appearance are illustrative.
Double-sided panels are unsuitable evidence of production garment thickness.

Khronos glTF Validator 2.0.0-dev.3.10 checked all nine GLBs locally: zero errors
and warnings after normal fixes. UV-unused informational messages are expected
because customer textures attach at runtime. Models are approximately 110–460 KB;
there are no embedded textures or external dependencies. Draco/Meshopt, texture
compression and proper LODs remain production asset requirements, not delivered
compression claims. Source tests check unique hashes, named geometry, finite
coordinates, unit normals and front/back/wrap UV orientation.

## Privacy and release

There is no artwork network upload or public customer texture URL in this slice.
Same-origin device storage is explicit and removable; it is not order-scoped
private server storage. Downloads include customer content and must be kept
private. On close, model textures/canvases and renderer resources are disposed;
JavaScript garbage collection and copies/downloads cannot be guaranteed erased.
The route requests no search indexing, but its blank assets are public by design.

Production storage must enforce the existing Phase 1 private-file requirements:
quarantine/scanner, authenticated ownership and assigned-vendor checks, short
signed grants, audit, deletion/retention and private approved production files.
No storage, Auth, database, role, order or payment grant is added here.

Before enabling checkout, implement authoritative server pricing, real variant
stock/supply, catalogue onboarding/review, order creation, versioned vendor-issued
proof and customer approval with immutable files/audit and approval invalidation.
Implement remaining product families only with appropriate approved assets:
caps, bags, bottles/tumblers, workwear, jackets, dielines, books, signage, flags,
stickers, vehicles and gifts. Never substitute a generic box for an unavailable
spatial model. [Research](catalogue-zambia-research.md) supplies candidate evidence;
it grants no commercial authorization.

Follow [Phase 1 closure](phase-1-closure-checklist.md), [hosting gates](phase-completion-checklist.md)
and [isolated acceptance](hosted-acceptance.md). The [protected UI test site](vercel-ui-test.md)
hosts the local lab under the user's explicitly approved, disabled `ui_test`
exception. This does not close full-service Preview, genuine private-file/order
acceptance or the Node HIGH advisory. The separate acceptance project's
Preview-only restrictions remain intact.
