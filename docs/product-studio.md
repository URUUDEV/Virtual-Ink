# Product design studio

Status: **local design-lab slice; mandatory studio and Phase 1 incomplete**.
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

The browser loads only the selected model after entering 3D. It paints private
local artwork onto runtime canvases; static models contain only blank geometry.
Named front/back surfaces have independent textures. Mug artwork uses a separate
300-degree cylindrical surface, excluding its handle, rim, interior and base.
Controls include text, three bundled fonts, colour, separate surfaces, PNG/JPEG,
numeric/range positioning, scale/rotation, centring, duplicate/remove layer,
undo/redo, quantity, notes, optional device save/reopen/remove, JSON copy/import,
zoom, pointer/keyboard rotation, reset/retry and layout-reference generation.

PNG/JPEG input is at most 2 MB, 4096 pixels/side and 16 MP; decoded content is
re-encoded to PNG at a maximum 1024-pixel side. DPI uses those actual preview
pixels, never a silently increased resolution. Retain the original for eventual
vendor preflight. Twelve layers and a 6 MB design bound limit local work. SVG/PDF
remain unavailable until secure quarantine, scanning and vendor policy exist.

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
and [isolated acceptance](hosted-acceptance.md). No successful hosted studio URL
exists. The dedicated project's first-deployment classification and Node HIGH
advisory remain blockers; no guard weakening or Production bootstrap is allowed.
