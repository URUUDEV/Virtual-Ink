# Virtual Ink local T-shirt workspace

17 October [lint follow-up](reports/2026-10-17-lint-gate.md): latest-design refs
update after commit, and download readiness follows the design last painted
successfully. Local text, undo/redo, four-line denial and 3D front/back/current-text
checks pass with no captured page errors. Native import, downloads and complete
accessibility/mobile/human acceptance were not repeated by this slice. Earlier
evidence below retains its original scope.

Updated: 13 October 2026. Owner: Taizya; Mumba implements; Uchi reviews.
Status: source/build and sampled browser verification delivered for review.
Human acceptance and live artwork-import verification remain pending.
Latest evidence: [Functional workspaces](reports/2026-10-13-functional-workspaces.md).
Editable JSON designs can be downloaded and reopened locally; imports are
bounded, decoded before replacement and undoable. The current 3D angle can also
be downloaded as a PNG. Its actual synthetic output was inspected and checked as
opaque, bounded and nonblank. Native file-open automation remains blocked in Chrome;
actual artwork texture/export and complete human acceptance remain open.
Previous evidence: [Fonts and 3D shirt](reports/2026-10-12-fonts-and-3d-shirt.md).
Seven bundled/system font choices now have visual samples. The interactive 3D
concept shirt shares the front design, with front/back/reset/zoom and pointer/
keyboard rotation. Download preview remains a 2D layout; existing drafts stay compatible.
Uchi reports artwork working; automated decoder/texture/export checks remain open.
Build evidence: [workspace report](reports/2026-10-12-tshirt-workspace.md).

## Scope and entry

Open `/shop/cotton-t-shirt`, then **Create a T-shirt concept**, or visit
`http://127.0.0.1:3001/customize/cotton-t-shirt` after starting the frontend.
The route needs no credentials and changes no backend or database permissions.

- Text: up to 72 characters and three lines; Poppins, Space Grotesk, Bebas Neue,
  Playfair Display, Caveat, Arial or Georgia; ink colour,
  position, size and rotation. Long/rotated text shrinks to the guide area.
- Artwork: local still PNG, JPEG or WebP; at most 2 MiB, 4096 pixels per side and
  16 million pixels. Declared dimensions are checked before browser decoding;
  decoded dimensions must agree. Canvas preparation strips source metadata and
  limits the stored PNG to 1024 pixels per side and a bounded data URL.
- Placement: drag the selected layer or use labelled keyboard sliders; centre
  controls, three illustrative shirt colours and a front-only 2D guide.
- Undo/redo: up to 30 changes, with pointer/text/focused-slider gestures grouped.
  Reset is undoable. Ctrl/Cmd+Z and redo shortcuts work outside text/form inputs.
- Draft: explicit save, load and remove for one browser/origin/device draft.
  Reload starts a fresh design; loading a draft is explicit and undoable.
- Export: a 600 by 640 PNG without placement guides, labelled a layout reference.
- Portable design: Download editable design produces a version-1 JSON file,
  including artwork. Open a design file accepts only this bounded editor contract,
  up to 3,001,000 bytes. Failed parsing or decoding keeps the current design;
  a successful restore is undoable. Local/browser drafts retain their existing key.
- 3D image: Download 3D view exports the current angle as PNG with a concept
  label and opaque background. It is an image, not an editable model or a print
  proof. Resolution follows the bounded renderer, at most 2400 by 1800 pixels.

This is a browser concept editor. The shirt outline is drawn in canvas; the
approved logo and supplied mockups are preserved. No server file transfer,
account synchronization, front/back editing, production garment model, production proof, quote,
cart, checkout or payment integration is provided.

## Privacy and trust boundary

Changes stay in memory until the user explicitly saves. The localStorage draft
includes artwork and is accessible to scripts running on the same origin; it is
not private server storage or an encrypted account vault. Use a private device
and remove saved drafts when finished. Removing the saved draft preserves the
current design and undo history in the open tab. No automatic persistence occurs.
Downloaded editable designs also contain artwork. Keep them private; no server
transfer or account synchronization is performed. Imported paths/URLs, product
types, fonts and extra authority fields are rejected by the existing draft contract.

Restored JSON accepts exact version/product/field keys, bounded finite numbers,
allowlisted fonts/shirt values and a bounded PNG data URL with matching dimensions.
Remote artwork URLs, SVG/GIF/animation, authority fields and prototype keys are
rejected. Text renders as canvas text/escaped React content. Header inspection is
an admission check, not a complete file parser or malware scan; the browser decoder
still handles approved raster data. Server uploads retain FILE-01/02 and separate
authorization/quarantine/retention prerequisites.

## Actual checks and remaining acceptance

On reviewed private Node 24.21.0: 120 root tests, six React rendering checks and
109 security regressions pass. Web/shared TypeScript, runtime baseline, repository
heuristics and production build pass. Forty-nine loopback HTTP assertions pass.
Frontend npm audit reports zero findings. Default Node remains 24.14.1.

Chrome confirms text editing, literal markup, shirt selection, undo/redo, pointer
placement, keyboard placement grouping and device save/reload/load/removal using
synthetic data on a separate port/origin. No horizontal overflow was measured at
1440, 1024, 768, 390 and 320 pixels. Desktop/mobile screenshots and the exported
600 by 640 PNG were visually inspected. Sampled application error logs were empty.

Chrome's file chooser rejected automated setFiles because extension file-URL
access is disabled. Successful raster decoding/replacement and live negative-file
checks remain pending; nine contract/security tests do not substitute for them.
The Chrome accessibility snapshot helper failed; documented visible DOM, locator,
geometry and screenshot checks were used. The download-event wait timed out, but
the generated PNG was independently found and visually inspected.

- [ ] Import/replace/remove synthetic PNG, JPEG and WebP; verify undo/redo and save/load with artwork.
- [ ] Reject disguised SVG, truncated/animated/oversized images in the live browser; show safe error and preserve current design.
- [ ] Check denied/full localStorage, malformed saved drafts and interrupted preparation in a live browser.
- [x] Fix preview instruction contrast (4.36:1 to 5.79:1), associate input help and name the design status; confirm in rebuilt DOM.
- [x] Sample keyboard focus and safe four-line text rejection; recheck five widths without horizontal overflow.
- [ ] Complete screen-reader, full focus-order/contrast, actual 200% zoom, reduced-motion preference and cross-browser review. Zoom shortcut did not measurably change zoom; source motion rules are separate evidence.
- [ ] Taizya/Uchi record concept-editor acceptance; Lubasi supplies real print-area/colour/size/proof requirements.

Run the recurring checks in [security review](security-review.md), then the
source React suite and HTTP harness. Keep browser fixtures synthetic and preserve
existing user drafts. Before further editor scope, resolve UX-02 and the relevant
file/vendor requirements in [open questions](open-questions.md).
