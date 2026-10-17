# Virtual Ink — Product model studio foundation

Date: 17 October 2026. Owners: Uchi Chinyama and Mumba Chitonge, backend;
Uchi, product; Taizya Nakapende, design; Lubasi Monde, operations.

**Status: local review slice. Mandatory production studio and Phase 1 remain
incomplete. No human signoff, successful hosted studio URL or production
enablement is claimed.** Work is on `codex/product-model-studio`, based on
`37ffccc`. Existing `apps/web/next-env.d.ts` and supplied attachments are preserved.

## What changed

The new `/studio` lab uses a typed model registry with ten draft product
definitions and nine separate original GLBs. Studies include short/long sleeves,
polo collars/buttons, hoodie hood/drawstrings/pocket, corporate shirt construction,
adult/fitted/child proportions and an actual cylindrical mug with handle, rim,
interior and base. Business cards use a flat layout. Product pages link to the
lab; the older T-shirt editor remains separately labelled as a legacy concept.

The selected model is lazy-loaded; the whole library is not loaded on entry.
Artwork paints onto runtime front/back/wrap materials, not public GLBs. Rotated
artwork bounds fit within physical safe zones; method and restricted-area checks
reject invalid imports. Text uses three bundled fonts. Local tools provide PNG/
JPEG decoding/re-encoding, colour, position/size/rotation, centring, layer
duplication/removal, separate surfaces, undo/redo, notes/quantity, optional device
drafts, bounded JSON copy/import, rotation/zoom, retry and static layout mode.

Local references export configuration and side images, physical boundaries,
notes/date/version and an awaiting-vendor state. They deliberately have no order
number, customer approval or production authority. Changing configuration creates
a new unapproved reference version. The actual transactional server proof and
approval lifecycle remains unbuilt.

Registry publication checks require vendor/supplier supply, rights, asset and
measurement review, stock, ZMW price, lead time and dated verification. All
current entries remain draft, with unknown commercial data. Checkout stays
disabled. This slice adds no database migration, storage grant, login or payment.

## Zambia research and asset provenance

[Research record](../catalogue-zambia-research.md) distinguishes supplier listings,
category evidence and unconfirmed candidates. PromoBasket Zambia lists TSL170B
long-sleeve polycotton and BAS-4770 cotton crew-neck; Primedean and Simson list
relevant categories/services. Listing badges and placeholder prices do not prove
current vendor stock or a ZMW quotation. No supplier partnership, brand-display
permission or protected asset reuse is inferred.

All GLB and fallback SVG geometry was authored for this repository using
mathematical surfaces. No supplier photography/model was downloaded or reused.
These geometric studies are not supplier-certified garments: seam joins, actual
fabric thickness/drape, anatomy, measurements, sizes and exact construction need
professional review. Double-sided panels do not establish manufacturing thickness.
Compression/LOD and other product families remain production work. Nine GLBs are
roughly 110–460 KB each, self-contained with no embedded customer artwork.

## Verification

- Full root suite: **213 passed, zero failures or skips**, including seven new
  studio tests with negative input, placement, proof-revision and GLB checks.
- Backend/shared coverage includes **all 42 executable source files** and no
  missing inventory file: lines **2431/2450 (99.2245%)**, branches
  **1833/1900 (96.4737%)**, functions **233/236 (98.7288%)**. This is a unit
  coverage metric; frontend, SQL, server lifecycle and hosted integrations are
  separate and not represented by this percentage.
- Existing security subset: **195 passed**; React SSR **11 passed**; synthetic
  SDK/Next Auth checks **16 passed**. These overlap with other checks where
  applicable and are not additive claims of coverage.
- Root lint, web and strict backend/shared TypeScript, environment-isolation
  guard and optimized web build pass. Build produces seventeen static pages
  plus dynamic routes. Initial Windows sandbox spawn denials were rerun through
  permitted execution; they were not treated as application test passes.
- Khronos glTF Validator **2.0.0-dev.3.10**: all nine final GLBs have **zero errors
  and zero warnings**. Initial hoodie/mug normal errors were fixed and retested.
  There are 104 informational unused-UV messages across the assets: UVs are
  reserved for runtime texture assignment. Unit regressions also inspect unit
  normals, named meshes, finite coordinates, bounded files, distinct hashes and
  front/back/wrap UV orientation.
- Browser samples on task-owned loopback port 3117 verify recognizable shirt,
  hoodie/polo and mug rendering, front/back layer separation, device save/reopen,
  colour preservation, model switching and layout mode. A 390 × 844 requested
  viewport had 375 CSS pixels of available width and no horizontal overflow.
  No sampled application console errors were recorded. Device draft fixture was
  removed. Real touch hardware, forced WebGL loss, low-power profiling, complete
  accessibility and every construction/cut are not accepted by this sample.
- Root and web dependency audits: **zero reported vulnerabilities**. This does
  not clear the separately announced Node HIGH runtime advisory.
- Fresh acceptance-project metadata: 25 Preview-only environment records, no
  Git connection or integration inheritance, protection unchanged. Its only
  deployment is the previous ERROR with actual target Production. No new
  deployment or environment mutation was attempted.
- Local HTTP, generated bundle scan and final document results are recorded in
  the final evidence addendum below. SQL and 207 genuine local MFA checks from
  the previous slice were **not rerun here**; no SQL/Auth change is claimed.

## Scoped security review

Attacker prerequisite: supplying a local draft or artwork to the editor. Risks
include arbitrary URL loading, oversized decode/memory consumption, forged
physical placement/DPI and misleading order/proof authority. Reproducible local
negative fixtures cover external/SVG URLs, invalid PNG data/dimensions, hidden
controls, stale model versions, unknown authority fields, duplicates, unsupported
methods and rotated out-of-bounds content. Shared header limits precede decoding;
new images are re-encoded and their actual prepared dimensions drive DPI.

Self-review found array-to-string coercion could admit forged font/size values
in an initial draft validator. Strict string checks now reject array fixtures.
Image header/declared dimension matching also prevents forged DPI metadata.
Browser inspection found reversed cylindrical text; wrap UV direction was fixed
and a binary UV regression added. These are local development findings, not
evidence of an exploited hosted application.

Only fixed registered blank-model paths load. Twelve layers, 6 MB drafts, bounded
image bytes/dimensions and thirty history entries limit local work. Body panels,
handle clearance and printable surfaces remain separate. Renderer textures and
canvas resources are released on disposal; garbage collection and retained
downloads cannot guarantee secure erasure. Explicit device storage is readable
by same-origin scripts and other users of that browser profile; it is not a
substitute for private, order-scoped server storage.

No customer artwork was uploaded, private provider credential read, authority
expanded, hosted schema changed or approval simulated. Browser/page/tool output
was treated as data. Probes used synthetic local content. This is a scoped
application review, not a provider, workstation or entire-production pentest.

## Mandatory acceptance mapping

| Test / status | Current evidence |
| --- | --- |
| 1. Recognizable T-shirt — Partial | Curved garment study, separate panels/sleeves; thickness/join review open |
| 2. Five constructions differ — Partial | Distinct GLBs and named details; sampled render only |
| 3. Four cuts appropriate — Partial | Four separate assets; physical fit review missing |
| 4. Mug cylindrical wrap — Partial | Curved wrap/handle exclusion; UV fix tested; exact vendor dimensions open |
| 5. Restricted areas — Partial | Rotated bounds and interior restrictions tested; only initial zones wired |
| 6. Front/back separate — Local pass | Unit and browser local persistence samples |
| 7. Save/reopen persists — Partial | Device and strict JSON drafts; no authenticated server draft |
| 8. Colour preserves art — Local pass | Unit and browser sample |
| 9. Size preserves placement — Pending | Reference sample only; no supplier size grading |
| 10. Customer artwork private — Partial | No network upload; complete server lifecycle absent |
| 11. Low-resolution warning — Local pass | Actual pixel/physical DPI tests |
| 12. No-WebGL fallback — Partial | Layout path tested; forced WebGL denial not yet exercised |
| 13. Mobile touch — Pending | Narrow layout sampled; physical touch acceptance missing |
| 14. Proof matches saved config — Partial | Captured local references; vendor/order proof unbuilt |
| 15. Server pricing — Blocked | Authoritative price/cart integration absent |
| 16. Vendor supply — Blocked | No approved vendor/variant supply record |
| 17. Branded rights/facts — Blocked | No branded SKU published; commercial evidence missing |
| 18. No production placeholder — Pending | No sellable model entries; production catalogue not accepted |

All remaining customer zones, accurate supplier size charts, SVG/PDF quarantine,
advanced preflight, production artwork quality checks, multiple decoration
simulations, vendor product onboarding/review, private server drafts/files,
authoritative cart/pricing, audited customer approval and the other product
families remain implementation work. UI presence does not close these items.

## Hosting and delivery gates

There is **no deployed URL for this studio slice**. Existing
[Production](https://virtual-ink.vercel.app) is not evidence for the new studio.
The dedicated acceptance project still reports only
`dpl_Fmd4yCnc5rB17Xiwttj1YMDyM7uj`, ERROR/Production from the previous attempt.
The reserved acceptance domain is not a working deployed feature.

Vercel's [open upstream first-deployment issue](https://github.com/vercel/vercel/issues/17069)
still describes explicit Preview requests classified as Production. The reviewed
runbook stops further deployments until a supported Preview-only path is resolved;
no bootstrap, environment relabelling, copied Production variables or guard
weakening was used. [Node's announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes for 21 October; the static minimum runtime passes
but does not clear the release gate. Compatible genuine hosted Auth/MFA, private
runtime/Storage setup and operator acceptance also remain open.

For this source, VH-01 project identity is observed; VH-02/03/12–15/17 new build,
Preview, hosted UI/mobile/logs/URL evidence are blocked. VH-04–11 environment,
secrets-in-deployed-assets, database, storage, genuine Auth, role workspaces,
API/resource protection remain pending or blocked. VH-16 domain preparation is
documented in the hosting runbook; no studio domain acceptance is inferred.
No item is waived to close the phase. Follow the full
[completion checklist](../phase-completion-checklist.md).

Source review commit is `d0c1f38dbe627fea03ebecab7a8db058fbfbe07a` on
`codex/product-model-studio`, comprising
47 explicitly staged files. User-generated Next types and supplied attachments
are excluded. No Git
push is claimed: the existing remote integration can trigger the protected
original hosting project, while isolated acceptance is still blocked. No phase
has completed; the standing after-phase push requirement is not marked satisfied.

## Next action by lead

- **Uchi:** review this first slice and maintain the release stop; resolve the
  supported isolated Vercel path and runtime patch gate. Prioritize private
  file/order/proof integration with Mumba; record actual product decisions.
- **Mumba:** review the registry, strict draft/placement logic and API boundaries;
  implement audited authoritative pricing, order/private-file and proof workflows
  with denial/concurrency cases after the isolated runtime is available.
- **Taizya:** compare authorized physical references to all models/cuts, resolve
  garment seams/thickness/drape and approved placement measurements; test touch,
  accessibility, fallback and actual proof views. Do not approve studies as SKUs.
- **Lubasi:** obtain supplier/vendor SKU evidence, current ZMW price/stock/lead
  time, size/colour variants, artwork policy and model/photo/brand permissions;
  confirm substitution notice and production-proof operations privately.

## Final evidence addendum

Final optimized loopback checks pass: **72 studio HTTP assertions**, **53 existing
public HTTP assertions**, and **44 disabled-Auth assertions across eleven
requests**. The generated browser-artifact scan checks **56 files**, with zero
findings. Final lint passes with zero errors/warnings. Browser sampling of the
corrected mug shows readable cylindrical text; synthetic layout-reference export
reports successful generation. This does not certify production-proof images.

Word uses the repository's compact-reference-guide report generator. Package,
XML and fixed-width table geometry checks pass. The render attempt failed with
WinError 2 because LibreOffice/soffice is unavailable; visual/page QA is **not
completed**. Document structural checks do not establish clean page layout.
Final document QA passes across ten Markdown files and 254 local links, with
valid Word package/XML and the eighteen-test matrix. Final repository heuristics
are rerun after report generation. A task-owned loopback preview on port 3117 is
left available for local review; it is not Vercel hosting. No hosted acceptance
or release is implied.
