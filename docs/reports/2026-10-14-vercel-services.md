# Virtual Ink — Vercel services configuration

Date: 14 October 2026 (2026-10-14). Backend/product owner: Uchi. Mumba is inactive.
Prepared for Uchi, Taizya and Lubasi. Human confirmation remains pending.

## Outcome

Root [vercel.json](../../vercel.json) and application routing are implemented and
tested as two services in one project. Proposed names: `app` and `web`. Public
catch-all traffic enters `web`; `app` stays internal. The caller-owned `web -> app`
binding generates APP_SERVICE_URL. This is ready for Uchi's requested confirmation
of names, public paths/internal exposure and call direction.

Uchi reports an existing Vercel deployment connected to Supabase. No URL was supplied
and no cloud configuration or deployment was changed in this slice. The new service
configuration, genuine deployed connections and [phase hosting gates](../phase-completion-checklist.md)
remain unverified on that site. **Phase incomplete; no phase is approved.**

## Changes

- Added per-service roots, Node entrypoint, install/build/dev commands and binding.
  Top-level configuration contains only schema/services/public rewrites.
- Extracted the existing Node request handler for a native Vercel entrypoint;
  infrastructure initializes lazily during requests. Vercel owns listening/lifecycle.
  Startup failure gives safe 503 rather than exiting or reflecting configuration.
- Routed Next health and protected identity/membership/tenant reads to app through
  the binding. Account role reads use this same server adapter. Auth/callback/cookies
  stay with web; public paths and existing permission checks remain unchanged.
- Added bounded, allowlisted internal requests/responses, bearer-only forwarding,
  no redirects/cache, and safe unavailable responses when the binding is missing.
- Added the web service dev command that respects Vercel's assigned PORT; standalone
  local previews keep their existing port. Environment templates document that the
  bound variable is generated and must never be set manually.
- Updated tests, [setup guide](../vercel-services.md), ownership/task/open-decision
  records and current team-report pointer. Earlier work/reports/assets are preserved.

Code: [native entrypoint](../../src/vercel.js),
[shared Node handler](../../src/app.js),
[binding boundary](../../src/backend/api/service-binding.ts),
[web adapter](../../apps/web/src/lib/backend-access.ts),
[account](../../apps/web/src/app/account/page.tsx),
[negative tests](../../test/service-binding.test.ts),
[native tests](../../test/vercel-runtime.test.js),
[real router checks](../../scripts/vercel-services-http-checks.mjs).

## Actual checks

| Check | Result |
| --- | --- |
| Application suite | 150 passed, zero failed |
| Security suite | 139 passed, zero failed |
| React/3D checks | Nine passed |
| Real Supabase SDK/Next Auth tests | Nine passed with synthetic responses; documented malformed-cookie warnings remain expected |
| TypeScript | Web and strict backend/shared/test checks passed |
| Production web build | Next.js 16.4.0 webpack build passed |
| Existing loopback checks | 53 assertions passed |
| Standalone account checks | 44 assertions over 11 requests passed after the production rebuild |
| Real Vercel local services | CLI 58.5.1 detected Node app and Next.js web; 39 assertions across 16 requests passed on loopback with injected binding |
| Dependency advisories | Root production and complete web npm audits returned zero vulnerabilities |
| Runtime gate | Reviewed private Node 24.21.0 passed; default workstation/deployed patch levels are separate checks |
| Repository heuristic | 215 files scanned, 49 skipped, zero findings; private/generated/binary exclusions and no history claim |
| Local frontend heuristic | 48 static JS/JSON/map files, 1,590,100 bytes, zero skipped, zero matching secret patterns; deployed bundles unverified |

Real services checks prove that pages and Auth reach web, that health travels through
the bound app (private response headers/request IDs), that role-header spoofing is
denied, that synthetic bearer requests fail closed without genuine Auth setup, and
that unsupported writes remain closed. This is not genuine login/DB/Storage evidence.

The initial local services launch exposed the existing web script's fixed port
conflict. The new service dev command respects injected PORT and the real router
checks then passed. An older source-wiring assertion was updated to follow the
new adapter while still requiring delegation to existing business authorization.
No product or permission failure was hidden by removing denial tests.

## Security review

Tested attacker prerequisites: anonymous caller, forged role/forwarded-host/cookie
headers, malformed bearer, invalid tenant ID, arbitrary path/query/redirect, write
method, malicious upstream headers/body, oversized JSON and unavailable service.
No arbitrary proxy target, cookie forwarding, role grant, unsafe redirect/header,
credential disclosure or private-data access was reproduced.

Binding reachability is not authorization. Internal calls bypass Vercel's public
pipeline; app therefore retains provider verification, transaction context, RLS,
permission/admission and durable audit checks. Only implemented read routes are
reachable through the bridge. Missing deployed bindings fail closed. The 1 MiB
upstream bound and 10-second fetch timeout constrain proxy work; distributed abuse
controls and the prior Auth/financial/file release gates remain open.

Only synthetic loopback requests, repository tests and official documentation/advisory
reads were used. Local mode pulled no hosted environment settings. No provider user,
grant, schema, payment, customer file or cloud deployment was created. Test process
cleanup targeted the exact local CLI and its children; unrelated previews remained.
This is a scoped application review, not a workstation/provider pentest.

Official references: [service bindings](https://vercel.com/docs/services/bindings),
[routing](https://vercel.com/docs/services/routing),
[configuration](https://vercel.com/docs/services/config-reference).
The current [Node security/release page](https://nodejs.org/en/blog/vulnerability)
still identifies 24.21.0 as the latest LTS; dependency audit results are point-in-time.

## Confirmation and next actions

| Person | Next action |
| --- | --- |
| Uchi | Confirm names app/web, public web catch-all/internal app and web-to-app binding; provide existing project name and deployed URL; verify root settings and Preview before Production |
| Mumba | Inactive; no task or acknowledgement dependency assigned |
| Taizya | Check public/mobile/account navigation on the approved deployed Preview; this slice changes routing rather than layout |
| Lubasi | Continue verified print/manual fulfilment rules for the remaining Phase 1 order flow |

After confirmation: apply the service layout to the existing project's repository-root
deployment, record successful builds/URLs and verify genuine Auth/database/private
storage/role dashboards/API protection. Continue the missing Phase 1 order workflow;
keep phases sequential and open until all local/testing/Vercel criteria pass.

## Report delivery

Matching Word report uses the established generator/preset. Structural, link/privacy
and repository checks apply. LibreOffice is unavailable, so Word page rendering and
visual pagination QA cannot be claimed. Report delivery does not imply phase completion.
