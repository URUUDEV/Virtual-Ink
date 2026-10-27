# Vercel public UI deployment

27 October 2026. The user's approved main release is public UI only. Phase 1
remains INCOMPLETE / NO-GO for full services and commercial launch.

The default `vercel.json` uses `npm run build:public-ui` and the Vercel Build
Output API. The builder creates an isolated temporary Next.js static export,
audits its public files, then writes `.vercel/output` with zero server functions.
The original backend, private routes, runtime guard and full-service graph remain
in source. `vercel.services.json` preserves that graph; `npm run dev:services`
selects it explicitly for local development. Do not deploy the service graph as
an approved full-service release.

Use Node 24.22.1 or a later runtime accepted by the retained runtime policy.
Install locked root and web development dependencies. The static build requires
an explicit local/test/production environment, all six service flags set to
`false`, and email plus every external integration mode set to `disabled`.
Production is restricted to the original virtual-ink project. An enabled or
missing service flag fails the static build; the runtime gate is not relaxed.

The static CDN serves the homepage, catalogue, studio, document configuration,
vendor preparation and disabled account forms. Catalogue query deep links use
a client component under Suspense. No public configuration submits orders or
uploads files. Private pages redirect to login without caching. Workflow API
paths return 404. Other APIs and `/health` return 503 with
`mode: public-ui-only` and `X-Virtual-Ink-Mode: public-ui-only`. This is an
explicit unavailable response, not backend readiness. Public writes return 405.
The existing response security headers are carried into the CDN routes.

Verify the exact deployed source, zero-function output, public pages/assets,
private redirects, unavailable API responses, and sampled client bundles after
each deployment. Vercel READY alone is insufficient: the initial dynamic release
built successfully but its request-time security guard rejected the runtime.
The actual hosted Node patch was not available from that failure evidence.

Rollback must be to a verified compatible public UI deployment. The attempted
rollback to the old baseline was rejected with HTTP 402 because it was older
than the immediately previous production deployment. No paid upgrade or guard
bypass is authorized. Do not claim a rollback happened without alias readback
and functional checks. Preserve the previous static deployment once available.

Full service enablement requires the existing Phase 1 release, identity/MFA,
hosted migration, storage/worker, pricing, provider and human/device gates.
Changing build configuration or flags does not satisfy them. See the dated
27 October release report for actual final deployment and test evidence.
