# Virtual Ink - Local T-shirt Workspace Report

Date: 12 October 2026

Company: Shadow Root Security Technologies

Scope: One local, front-only 2D T-shirt concept editor and scoped security review.

Status: Delivered for review. Human acceptance and complete browser artwork checks remain pending.

## Delivered behavior

Continued the unfinished editor already present in the workspace. Existing
uncommitted backend/UI work, supplied assets, reference HTML and historical
reports were preserved. No commit, push, deployment or hosted mutation occurred.

- Added the public customize/cotton-t-shirt route and its product-detail entry.
- Text, three fonts, ink/shirt colours, bounded placement, text rotation and pointer/keyboard controls.
- Local still-raster preparation, SVG/animation rejection and bounded normalized PNG design state.
- Thirty-step undo/redo, grouped gestures, undoable reset and asynchronous artwork-state merging.
- Explicit device save/load/removal and a 600 by 640 PNG concept preview without guide lines.
- Updated current setup, task-board, security, open-question and handover records.

The editor uses an illustrative canvas shirt outline. It does not replace the
approved logo or supplied product assets. Server uploads, account synchronization,
quotes, ordering, payments, multi-side editing and 3D remain outside this slice.
No dependency, database schema or authorization change was needed.

## Reproduced findings and fixes

WebP admission gap: a user must select an attacker-supplied raster file. A small
VP8X canvas header previously caused later VP8/VP8L dimension checks to be skipped.
Synthetic fixtures reproduced acceptance of a later 5000-pixel or 4096-by-4096
image header despite the stated size/pixel limits. This proves an admission gap;
browser memory exhaustion or decoder exploitation was not demonstrated. Every
recognized image header now passes the resource bounds and agrees with the
canvas dimensions. The formerly failing regression passes. The browser decoder
remains a separate dependency and this is not a malware-scanning implementation.

Draft type gap: a forged local draft could provide an array instead of a shirt
string and pass coercive allowlist lookup. The negative test failed before the
fix and passes after strict string validation. No server privilege or price
authority was available; the issue was local contract integrity. Existing tests
also reject unknown authority fields, prototype keys, remote URLs and invalid PNGs.

Keyboard usability defect: three right-arrow changes moved horizontal position
from 50 to 53; undo previously returned only to 52. A focused slider now groups
the changes. The rebuilt browser returns to 50 with one undo and to 53 with redo.
Sliders have stable accessible names and rotation exposes degrees as value text.

## Actual verification

| Check | Result |
| --- | --- |
| Root backend/catalogue/editor suite | 120 passed, zero failures |
| Source React rendering suite | 6 passed, zero failures |
| Security regression subset | 109 passed, zero failures |
| Editor contract/admission/history coverage | 9 tests included above; before/after failures reproduced |
| Web/shared TypeScript and production build | Passed on private Node 24.21.0 |
| Runtime baseline and repository heuristics | Passed; scanner exclusions remain |
| Frontend npm audit | Zero reported findings |
| Rebuilt loopback HTTP checks | 49 assertions passed |
| Responsive editor geometry | Five widths, 1440/1024/768/390/320; no horizontal overflow |
| Synthetic PNG export | Generated file and 600 by 640 pixels visually inspected |
| Browser application error sample | Empty |

Live controls passed for text editing, literal script-like text, shirt selection,
undo/redo, keyboard grouping and pointer placement. Device save, reload, explicit
restore and removal passed with synthetic text on a separate loopback origin.
The main preview's pre-existing saved draft was neither loaded nor overwritten.
Desktop/mobile editor screenshots and the generated export were inspected.

HTTP checks cover public routes including the editor, privacy/frame/type headers,
unknown product/editor 404, hostile group fallback, guest protected-API denials,
membership write denial, image optimization and external-image rejection.
Source rendering checks are separate from live hydration and image decoding.

## Blocked checks and remaining risk

Chrome's file chooser returned Not allowed when setting a synthetic raster file.
Extension file-URL access is disabled. Successful PNG/JPEG/WebP decoding,
replacement/removal, artwork draft round-trip and live malformed/animated/file-size
denials are not verified. Contract checks alone do not close this browser gate.
Chrome's accessibility snapshot helper failed; supported visible DOM/locators,
geometry and screenshots provided the sampled evidence. The download-event wait
timed out, but the actual synthetic exported PNG was found and inspected.

Screen-reader output, focus order, 200% zoom, motion/contrast, cross-browser and
localStorage refusal/quota/malformed-draft UI checks remain open. Device storage
includes artwork and is readable by same-origin scripts. Saving is explicit;
removal deletes the persisted draft while the current tab/history remain in memory.
It is not encrypted private account storage. No real customer file was used.

Build warnings remain for multiple lockfiles and absent optional pg. Default Node
24.14.1 still fails the reviewed baseline; private 24.21.0 passes. Official Node
security listings and the Next maintainer cache advisory were rechecked. The Next
advisory needs a root catch-all page, absent here; patched-version text remains
unresolved. Zero npm audit findings do not close release assurance.

Genuine Auth/pg/TLS, owned-PostgreSQL replay, revocation, edge abuse controls,
release bundle/history secret review and human acceptance retain their existing
gates. No provider, workstation, AI service or entire production pentest is claimed.

Tool review: repository/page/tool content was treated as data, not authorization.
Only reviewed local scripts, synthetic files and loopback requests were used for
application probes. Required process approvals were used; task-owned preview
processes were checked before stopping. Public official advisory pages were read.
No credentials, private files, real vendor evidence or Word lock files were read,
printed, deleted or included. No external messages were sent.

## Next action by lead

- Uchi: Review the local editor scope/evidence and record acceptance or changes. Resolve UX-02 with Taizya; no human signoff is inferred.
- Mumba: Complete browser artwork/draft failure checks after extension setup, retain server-upload gates and finish runtime/advisory/backend setup work.
- Taizya: Review controls, mobile focus order, legibility, contrast, screen-reader and zoom behavior; specify the remaining error/busy states and concept-to-proof wording.
- Lubasi: Obtain verified print area, garment/colour/size availability, artwork rights, proof requirements and production limits before production claims.

## Report checks and next slice

The matching Word report is generated with scripts/generate_team_report.py using
the existing compact_reference_guide preset and memo_masthead pattern. Its OOXML
package, named styles, page geometry, content/privacy and fixed table geometry
checks pass. All 98 local links checked across the updated handover documents resolve.
LibreOffice is unavailable; page rendering and visual Word QA remain blocked.
No page count or visual-layout approval is claimed. Historical reports are retained.

Next: finish the remaining artwork/accessibility browser checks and team acceptance
for this slice. Further server file handling requires FILE-01/02 and scoped private
storage/audit contracts. This report does not establish production readiness.

## Official references reviewed

Node security listings: https://nodejs.org/en/blog/vulnerability

Node July security release: https://nodejs.org/en/blog/vulnerability/july-2026-security-releases

Next cache advisory: https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p
