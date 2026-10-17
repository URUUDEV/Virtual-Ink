# Authoritative brand integration

The brand module at `apps/web/src/components/brand/` ports the supplied archive
into the existing Next.js/Three.js application. Read the pre-edit
[audit and preservation checklist](ui-upgrade-audit.md) and the
[reference fingerprints](brand-reference-manifest.json).

## Components and tokens

`VILogoSVG` preserves every supplied monogram path and colour stop. Unique IDs
prevent collisions when several SVGs render inline. Its optional light/dark
wordmark treatment uses the supplied animated component's existing text colours;
the icon is never recoloured. `BrandLogo` uses the supplied icon and wordmark
treatment in the shared header/footer. Original PNG assets remain available.

`VirtualInkAnimatedLogo` retains size, autoRotate, rotationSpeed, wordmark/tagline,
intro/idle/static, dark/transparent/light, interaction, pause, replay and completion
props. `vi-geometry.ts` retains the supplied geometry body byte-for-byte after
line-ending normalization; only the palette import is centralized. The engine
ports the supplied six-second formation, particles, rings, drag inertia, meshes,
materials, lighting, easing and reveal timing to the existing Three.js dependency.
It does not install React Three Fiber, Drei, Vite or the inspection plugin.

`src/shared/brand-tokens.ts` contains the palette/timeline. Brand CSS centralizes
colour, typography, spacing, radii, shadows, motion and layering. Existing route
styles are retained; further legacy-style normalization is separate work.
Buttons use the exact four-stop gradient as a border around a dark, accessible
label surface. This avoids low-contrast white text over bright cyan. Monogram
and large creative headings keep their supplied colours/gradient direction.

## Lifecycle and public behavior

The initial server/client render is the static supplied SVG. A visible logo
checks reduced motion and WebGL2 before lazily importing Three.js. No browser
API or random particles are used during SSR. Reduced motion, a rejected module,
unsupported WebGL or lost context leaves a static mark and usable page.
Rendering pauses offscreen/hidden and while paused without pending motion.
All RAF, visibility/context listeners, observers, materials and geometry are
disposed on close. Pixel ratio is capped at 2 (1.5 for coarse pointers), with
low-power preference and at most 240 particles. Rotation is horizontal and uses
`pan-y` touch behavior; manual rotation remains possible while animation is paused,
as in the reference. Keyboard arrows work only when interaction is enabled.

The public hero offers a skippable six-second introduction, then a static mark.
It records only a session completion flag, with an in-memory fallback when
storage is unavailable. It does not block the page or replay on navigation.
This supplies the mobile formation behavior without a blocking overlay.
Public pages have no replay, pause, speed or developer mode panel. Loading uses
the supplied static icon, transparent and non-interactive, during route waits.
Long pages and account screens have no continuously animated brand decoration.

## Internal laboratory

`/brand-lab` is excluded from public links and protected by the existing proxy.
The page independently verifies provider identity and current database assignment,
requires AAL2 plus signed step-up, then invokes the existing audited
`protected.check` for `security.read`. Only SUPER_ADMIN is admitted; no new role
or database capability is granted. Setup, provider, assignment, MFA, authorization
or audit failure produces a server denial before controls render. Client role
metadata/query parameters cannot grant access. Local lab controls change only
the current view, not platform brand settings.

The existing security configuration intentionally rejects Production enablement.
No administrator is seeded and no hosted grant, schema, secret or policy changes.
Genuine hosted laboratory acceptance still needs the isolated security target.

## Static assets, checks and rollback

`node scripts/generate-brand-assets.mjs` produces the three SVGs under
`apps/web/public/brand/` from the reviewed component: icon, light wordmark and
dark wordmark. These are available for future emails/PDFs; no mailer or print
workflow is claimed connected. The root metadata uses the static icon. Social
raster previews and print-material acceptance remain open.

`npm run test:web` includes source SSR, geometry fingerprints, contrast and
deterministic scene scheduling/resource checks. Existing Auth/API tests remain.
`node scripts/brand-http-checks.mjs` checks local routes and lab denials at the
explicit loopback origin in `WEB_CHECK_URL` (default 127.0.0.1:3117).

No release has occurred. For local rollback, stop the owned preview and switch
to the pre-upgrade source `92a5ce8` in a clean checkout, preserving user work;
install the pinned existing dependencies and rebuild. After an approved future
release, use the previously verified Vercel deployment for rollback, test the
actual alias and deny cases, and keep secrets/database policies unchanged. Do
not force-push, reset user work or promote an untested deployment.
