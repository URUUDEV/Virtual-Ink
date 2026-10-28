# Vercel request runtime verification

28 October 2026. Owners: Uchi and Mumba. Phase 1 remains INCOMPLETE / NO-GO.

## Build and request execution are separate checks

A READY deployment and successful build-time isolation check do not establish
that its request-time Node runtime satisfies the same security baseline. Next's
instrumentation hook checks isolation when a server instance starts. Static pages
can remain available while dynamic pages and proxy requests fail at that hook.

The current reviewed baseline is stable Node 24.22.1 or a later stable 24.x
release. Older patches, prereleases, other majors and an open security notice
remain rejected. Runtime approval is based on native process facts, not a
caller header, deployment label or environment claim. No override flag is added.

## Fixed failure diagnostics

RUNTIME_SECURITY_PATCH_REQUIRED now carries a frozen diagnostic object on the
server error: actualNode, minimumNode and advisoryOpen. Those values come only
from the native process and reviewed policy. The generic error message and
rejection remain unchanged. No request data, environment binding, provider URL,
credential or customer file is attached. No diagnostic HTTP route is introduced.

Use private operator runtime logs to read these fields. Keep raw logs private;
reports need only the reviewed source/deployment, path, status, actual version and
baseline. A missing field or failed log request is not evidence of a patched runtime.

## Controlled hosted verification

Use the existing isolated virtual-ink-ui-test project
(prj_aqLrX1gsSVb1XINH5YNGkp1aYazH), protected Preview target and sixteen reviewed
plain settings. Check project identity, Node 24.x selection, protection, absent
Git/integration inheritance and exact disabled-service configuration before upload.
Upload an inspected committed-source snapshot excluding private/environment files,
credentials, local tool metadata and unreviewed attachments. Preserve the original
production project and separate acceptance rules.

Verify deployment source metadata, actual Preview classification and a fresh
install/isolation/lint/build. Then use normal authenticated Vercel browser access
for read-only /shop and /vendor/setup journeys. With Auth disabled, the protected
vendor route should lead to disabled login; this does not establish owner access.
Review that exact deployment's runtime logs for startup rejection and diagnostics.
Do not generate a protection-bypass token or weaken any guard to obtain a pass.

Vercel permits selecting the Node major and controls minor/patch rollout. Verify
request execution after any fresh deployment; a selected 24.x setting or build
version alone is insufficient. If native runtime facts remain below the reviewed
baseline, keep dynamic-service acceptance blocked pending a compatible provider
runtime. Do not claim an exact patch pin, lower the baseline, switch runtime
families or enable sensitive services as a workaround.

Current evidence belongs in the dated [runtime report](reports/2026-10-28-vercel-runtime-diagnostic.md).
The broader [release gate](phase-1-release-gate.md), genuine service/role/device
acceptance and explicit promotion authorization remain unchanged.

Sources: [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Node October security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
