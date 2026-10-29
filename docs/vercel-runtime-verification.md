# Vercel request runtime verification

29 October 2026. Owners: Uchi and Mumba. Phase 1 remains INCOMPLETE / NO-GO.

29 October fresh Preview repeats the mismatch: source
fa478a16da9148d0ed2fd8ada0aaea8658cb9e47, deployment
dpl_CVPD35b6kizhVwwYYr5M7UpkAikn,
https://virtual-ink-ui-test-mkichpnsp-shadowrootsec-5679.vercel.app.
The fresh build is READY; authenticated /shop returns HTTP 500 and its native
log reports actualNode 24.21.0 / minimumNode 24.22.1. Services stay off.
See [today's pilot readiness report](reports/2026-10-29-vendor-pilot-readiness.md).

## Provider escalation submitted

Uchi authorized sending on 29 October. The following exact message was submitted
once through the signed-in Vercel Share feedback form under CI/CD (Builds,
Deployments, Environment Variables). The form showed Loading and closed by
10:44:07 UTC without a visible error. No case number, delivery receipt or provider
response was displayed. This is not a confirmed support case or runtime fix.
[Submission record](reports/2026-10-29-vercel-feedback-submission.md).

Our protected Preview project virtual-ink-ui-test selects Node 24.x. Deployment
dpl_CVPD35b6kizhVwwYYr5M7UpkAikn builds successfully, but GET /shop executes
native process.versions.node 24.21.0. Our unchanged security baseline requires
stable Node 24.22.1 or later 24.x, so Next instrumentation rejects startup with
RUNTIME_SECURITY_PATCH_REQUIRED and HTTP 500. The previous day's deployment
dpl_CrvyaEWSpQgM9B5y6mvjP3k7t9US shows the same version on middleware and
ordinary functions. Please confirm a supported way to obtain patched request
execution on this project and the rollout status. We need request-time verification;
build-time success or an exact patch pin that is not supported will not resolve it.

Keep raw logs and credentials private. This submission does not authorize a paid
upgrade, production change, protection bypass or guard exception.

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
