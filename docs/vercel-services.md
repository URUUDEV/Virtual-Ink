# Virtual Ink — Vercel services

Date: 14 October 2026. Owner: Uchi, backend and product lead. Mumba is inactive.
Status: implemented and locally verified; service names/ingress/binding await
Uchi's explicitly requested confirmation. Uchi reports an existing Vercel deployment
connected to Supabase; its URL, service deployment and functional connection have
not been independently verified in this slice.

## Service ownership

The root [vercel.json](../vercel.json) defines:

| Service | Root | Runtime/entry | Public traffic | Calls |
| --- | --- | --- | --- | --- |
| app | Repository root | Node; `src/vercel.js` native request handler | Internal only; no public rewrite | Auth provider and restricted database through existing adapters |
| web | apps/web | Next.js | Catch-all `/(.*)` including public APIs | app through generated APP_SERVICE_URL |

`web` owns pages, assets, account/Auth cookies, `/api/auth/*` and `/auth/callback`.
Its existing `/health`, `/api/v1/health`, `/api/v1/me`, `/api/v1/memberships` and
`/api/v1/tenants/:tenantId/access` Node handlers call `app` through the binding.
The public paths stay unchanged; no prefix is stripped. Account role reads use
the same server adapter. Unknown APIs remain closed with 404.

The single binding is declared on the caller `web`: type `service`, target `app`,
format `url`, environment `APP_SERVICE_URL`. Vercel generates this variable; do
not enter a manual value in project environments or `.env` files. The binding is
read only inside runtime Node functions/server-rendered requests. Build code and
the Auth proxy/middleware never consume it. The proxy continues to verify Auth
through its provider adapter; binding reachability is not application authorization.

Calls forward only validated read paths/query parameters and the bearer token.
Browser cookies, role/identity headers and forwarded host are excluded. Responses
are bounded to 1 MiB, uncached and limited to safe response headers; redirects,
unexpected status/media, malformed JSON and transport errors return safe 503.
The app still verifies identity and enforces existing RLS/permission/audit rules.

Standalone local Next previews retain the existing in-process adapter. A deployed
web service with a missing binding fails closed instead of silently using local
database access. No development host/port is used as a production fallback.

## Project setup

Set the Vercel project's Root Directory to the repository root (`.`), so it reads
the root services configuration. Each service owns its build/runtime commands;
there is no top-level install/build/framework/functions configuration.
Keep external-root source inclusion available for `web`, which imports shared
backend code. Its install command restores the root and web lockfiles; its
production command is the existing Next.js build. Select the supported Node 24
runtime and verify its deployed patch level against the repository security gate.

Keep existing private provider/database settings private and separately scoped
for Preview/Production. Supabase integration/linking alone does not set up the
restricted application database login/verified CA or prove genuine Auth/Storage.
Do not copy the provisioning CLI environment into either HTTP service. See
[account setup](phase-1-account-access.md) and [restricted backend setup](live-backend-setup.md).
The exact HTTPS APP_ORIGIN and confirmation redirect must match each environment.

Confirm the graph before changing the existing hosted project's configuration or
redeploying this slice. Record actual Preview/Production URLs and results against
[all 17 hosting gates](phase-completion-checklist.md); no phase is complete here.

## Local services testing

With reviewed Node on PATH and Vercel CLI installed, run from repository root:

```text
npm run dev:services
npm run check:services:http
```

The first command runs `vercel dev --local --listen 127.0.0.1:3100`. Local mode
does not pull hosted secrets/project settings. Vercel injects the binding and
assigns each service its port. The dedicated web service dev script respects PORT;
the standalone `dev:web` command keeps port 3001. Keep hosted Auth disabled for
the synthetic HTTP fixture, which checks pages, health, guest denials, unsupported
writes, Auth ownership and account protection. Genuine hosted checks are separate.

Verification: CLI 58.5.1 recognized both services; 39 assertions across 16 real
Vercel-router requests passed. Root/security/type/build and native handler/binding
negative results are in [the report](reports/2026-10-14-vercel-services.md).
The temporary services server was stopped after testing; existing unrelated
previews were preserved.

References: [services](https://vercel.com/docs/services),
[binding availability/security](https://vercel.com/docs/services/bindings),
[service routing](https://vercel.com/docs/services/routing),
[service configuration](https://vercel.com/docs/services/config-reference).
