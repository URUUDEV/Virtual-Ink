# Virtual Ink public UI visualization

Updated: 12 October 2026. Owner: Taizya Nakapende; Mumba implements; Uchi reviews.
Status: production build, HTTP and sampled browser checks pass; complete
accessibility and human acceptance remain pending. See [current evidence](reports/2026-10-11-ui-build-verification.md).

The current UI slice also includes the [local T-shirt workspace](tshirt-workspace.md)
with [12 October evidence](reports/2026-10-12-tshirt-workspace.md). Text/history/device
draft/export and responsive checks pass; live raster import and full UX acceptance
remain pending. Server uploads remain closed.

The [editor accessibility follow-up](reports/2026-10-12-editor-accessibility-review.md)
fixes instruction contrast and links input help/status naming. Rebuilt checks,
sampled focus, text rejection and five responsive widths pass; artwork import,
screen-reader/actual zoom and human acceptance remain pending.

## Reference and scope

The newly supplied `virtual ink html.html` is a 49,628,546-byte visual reference.
Its original SHA-256 is recorded in `apps/web/public/images/products/provenance.json`
and verified in the catalogue tests. It is preserved unchanged. Its bundled
JavaScript, vendor dashboard and session cart are not imported or executed.

The existing Next.js 16.4.0 / React / TypeScript application, Poppins fonts, Lucide
icons, brand palette and approved `asssets/Virtual Ink Gradient Logo.png` remain
the foundation. The home page now uses individual supplied product mockups rather
than the entire concept board as a picture. Header and footer use the approved logo.
Artwork within supplied merchandise mockups contains different brand treatments;
Taizya must review those before publication. No replacement identity was designed.

## Delivered behavior

- Homepage: dark hero, manual six-product showcase, category destinations, six
  linked product cards, workflow, design services callout, business section and FAQ.
- `/shop`: search, group filtering, sorting by illustrative prices, result counts,
  and an empty state with working reset. Category links initialize the selected group.
- `/shop/[slug]`: six real detail routes, linked related products, reference finish
  and price, unconfirmed availability/vendor/delivery details and a services link.
- Product details pre-render the six known slugs; unknown slugs return HTTP 404
  before streaming. Public navigation contains
  only existing destinations. Mobile menu closes with Escape and restores toggle focus.
- Product imagery is 2D. The showcase changes products; it is not a 3D viewer and
  has no automatic advance. Reduced-motion preferences disable arrival transitions.

The six WebP delivery copies total 1,067,826 bytes (about 1.02 MiB), retaining source
dimensions and composition. Next Image provides responsive delivery. Public images
are supplied demo mockups for review, never private customer files.

All ZMW values come from the supplied reference and are labelled illustrative.
They are not a pricing engine, quotation, catalogue seed or commercial approval.
Ordering, quoting submissions, file upload, cart, checkout, customer accounts,
vendor/admin interfaces and 3D remain separate slices. No database migration is
needed for this visual collection.

## Run and verify

From the project root on a machine with dependencies installed:

```powershell
npm run typecheck:web
npm run test:web
npm test
npm run dev:web
```

Visit `http://127.0.0.1:3001`, then `/shop` and `/shop/cotton-t-shirt`.
The preview needs no Supabase keys. Before release, run `npm run build:web`, the
recurring security checks and the browser checklist below.

The production build now passes outside the managed sandbox. For live checks,
build, start `npm --prefix apps/web run start`, then run `npm run check:web:http`
in another terminal. The smoke command uses synthetic anonymous loopback requests
and currently passes 45 assertions. Select reviewed Node as described in
[setup notes](live-backend-setup.md); default Node remains 24.14.1.

`npm run test:web` runs five source-level React server-rendering checks with the
installed React/Next components. It transpiles reviewed repository TypeScript;
it does not execute the supplied HTML. It is not a Next HTTP or hydration test.
Root tests include six dependency-free catalogue/data/security checks, and the
existing 105 backend tests. A Node module-type warning for the web fixture is
non-fatal; the existing web package conventions have been preserved.

To regenerate images, use `python scripts/import-ui-reference.py` with Pillow
installed in document/tooling dependencies. The importer accepts only six named
PNG images, bounds reference/image sizes and dimensions, and does not execute scripts.

## Browser acceptance checklist — partial engineering verification

11 October: Chrome DOM measurements found no horizontal overflow on homepage,
shop and T-shirt detail at requested widths 1440/1024/768/390/320. The showcase
image overlap was reproduced and fixed. Desktop homepage/shop and mobile detail
screenshots were inspected; some responsive captures had sizing artifacts.
Carousel, search/filter/reset/sort, category history and mobile Escape/focus
return passed. These probes do not close the full checklist or human acceptance.

- [ ] Desktop widths 1440 and 1024: hero and cards align, all supplied imagery is legible.
- [ ] Tablet/mobile widths 768, 390 and 320: no horizontal overflow, readable text,
  usable search/sort and correctly stacked details.
- [ ] Keyboard: skip link, menu, Escape/focus return, showcase arrows/dots, filters,
  search clear, sort and card links work with visible focus.
- [ ] Screen reader: selected filter/dot, result count and manual slide change are announced.
- [x] Search `polo`, choose Print, reset empty results, change sorting; results remain correct.
- [ ] Category shortcut opens a filtered shop; every card opens its detail and returns.
- [x] Unknown slug produces HTTP 404; back/forward navigation updates selected groups.
- [ ] Reduced motion and 200% zoom: no animation requirement, clipping or unusable control.
- [ ] Colour contrast, image quality and artwork rights/brand treatments reviewed by Taizya.
- [x] Next build, live HTTP routes, image optimization and sampled hydrated controls verified.

Historical 10 October blocker: the managed environment denied Next subprocess creation (`spawn EPERM`) for both
dev and production build. The Browser tool cannot create its kernel assets
(`The system cannot find the path specified`). No browser screenshots or desktop/
mobile acceptance was claimed then. On 11 October approved execution outside the
sandbox restored the build, and connected Chrome enabled the probes above.

## Next UI slice

Complete the local workspace's raster-import and accessibility browser checklist,
then obtain Taizya/Uchi acceptance under UX-02. Text, bounded raster-artwork source,
placement, undo/redo, explicit device drafts and PNG concept export are now delivered;
see [workspace details](tshirt-workspace.md). Private server uploads need FILE-01/02 and authorization contracts.
Do not copy the reference's SVG upload handling or static front/back views as a
working multi-side/3D editor. Obtain genuine model assets before a 3D implementation.
