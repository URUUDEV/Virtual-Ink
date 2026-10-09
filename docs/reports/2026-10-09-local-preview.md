# Virtual Ink — Local Preview Report

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.
**Status:** Backend running locally; visual Next.js preview blocked.

## What is running

The existing Node.js 24 backend was started on http://127.0.0.1:3000 with the
disabled development environment. GET /health and GET /api/v1/health both returned
the expected Virtual Ink status payloads. This is a backend health preview; the
root address does not serve the marketplace homepage. Health proves process
liveness, not Supabase/Auth/storage readiness. No business data was created.

The service is running in the current local work session. It may need restarting
after that session closes. Use npm start from the repository to restart it.

## Website preview blocker

The frontend source exists in apps/web, but Next.js dependencies and its lockfile
are missing. An npm installation was attempted with online mode enabled. It failed
while resolving Poppins because the configured registry proxy refused connections.
No dependency versions, lockfile, replacement UI or generated image were fabricated.

After legitimate registry access is available, run:

```text
npm install --prefix apps/web
npm run dev:web
```

The intended visual preview address is http://127.0.0.1:3001. It is not running yet.
Commit the actual generated lockfile after a successful install. Build, mobile
layout, navigation and browser interaction verification remain pending.

## Verification and handover

| Check | Result |
| --- | --- |
| Backend process startup | Listening on loopback port 3000 |
| Original health route | Expected service/status JSON |
| Versioned health route | Expected data/meta envelope |
| Frontend dependency installation | Failed through registry proxy |
| Website/browser preview | Not available; no visual verification claimed |

The full test suite was not rerun for this process-start task. The previous slice
recorded 78 passing tests. No application code changed. This dated report and the
latest report index document the local handover. Word structural checks are
available; visual rendering remains blocked by missing LibreOffice.

Mumba resolves registry access and starts the existing frontend. Taizya reviews
the supplied branding and responsive shell once it runs. Uchi reviews the visible
scope and acceptance states. Lubasi continues verified operational discovery;
there is no functioning vendor/order/payment workflow in this preview.

Next prompt: install the existing frontend dependencies on a connected machine,
start the Next.js preview on loopback port 3001, verify its public navigation and
mobile layouts, and generate the next team report with actual results.
