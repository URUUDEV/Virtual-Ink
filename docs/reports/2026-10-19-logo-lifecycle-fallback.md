# Virtual Ink — logo lifecycle fallback repair

Date: 19 October 2026. Phase 1 is **INCOMPLETE**; release **NO-GO**.
This slice repairs a locally reproduced visual lifecycle defect. It does not
complete the import gate, physical-device testing or any secure integration.

## Reproduction and change

The import runtime review found that logo readiness was stored against the
animation mode/replay value. Returning from intro to idle and back to intro could
reuse the old intro readiness after its scene was disposed. Turning reduced
motion on and off could also reuse readiness from a destroyed scene. In both
cases the component labelled an unpainted canvas animated and hid its SVG.

Controlled execution of the actual component reproduced both failures before
the fix: two failed and three passed focused checks. The visible result in those
checks was animated instead of fallback. This is a local component reproduction;
no hosted or physical-device reproduction is claimed.

VirtualInkAnimatedLogo now keys its presentation child by animation mode, replay
token and reduced-motion choice. Each new scene lifetime starts with fresh
readiness, reveal and failure state. Its supplied SVG stays visible until that
scene paints. Old cleanup and cancellation still dispose the scene and ignore
late callbacks. This follows React's documented [state reset with a key](https://react.dev/learn/preserving-and-resetting-state#resetting-state-with-a-key).

Seven new controlled lifecycle checks cover returning modes, reduced-motion
transitions, offscreen/static lazy admission, unavailable WebGL, module failure,
late disposed callbacks, unmount before initialization and failure after readiness.
Some checks exercise more than one scenario. They run in the existing test:web
command. Their hooks/observers/renderer are controlled; they are not a real DOM,
browser GPU, physical device or hosted service test.

The supplied monogram, geometry fingerprint, colours, typography and animation
timing are preserved. Existing static SSR, duplicate SVG IDs, protected brand-lab
denials, scene scheduling and disposal regressions remain in the suite. There is
no new package, route, role, Auth capability, upload or commercial action.

## Verification

| Scope | Result | Limit |
| --- | --- | --- |
| Web component/scene checks | 51 passed; zero failed/skipped | Seven new lifecycle tests; controlled hooks/renderer |
| Auth SDK/Next contracts | 16 passed; zero failed/skipped | Controlled provider responses; no genuine hosted Auth |
| Root suite and coverage | 218 passed; all 43/43 inventoried files measured | Backend/shared unit denominator only |
| Security regression subset | 197 passed; zero failed/skipped | Local application tests |
| Types and lint | Pass | Web/shared types and full source lint |
| Production build | Pass | Local isolated flags; sensitive services disabled; one generation worker |
| Loopback HTTP | Homepage/studio 200; brand lab redirects guests to login; identity API 401 | Four requests; no signed-in user or genuine service |
| Local asset/client artifact audit | 64 byte matches; 68 JS/CSS artifacts; no heuristic findings | 39 public files, 25 fonts, 1,871,859 client bytes; not hosted bundles |
| Dependency advisories | Root and web report zero vulnerabilities | Does not clear runtime advisories |
| Source security heuristic | Pass; 432 scanned, 115 skipped; no findings | Not a full history/binary secret audit |
| Runtime patch baseline | Node 24.21.0 passes existing baseline | Scheduled HIGH fix remains open |
| Hosted Preview build | READY after exact-token cleanup; fresh installs/isolation/lint/build pass | UI-only profile; no hosted runtime acceptance |

Measured backend/shared coverage is **2473/2492 lines (99.24%)**,
**1883/1950 branches (96.56%)**, **239/242 functions (98.76%)**. Every one of
the 43 inventoried files is measured. Frontend/browser flows, SQL, genuine hosted
integrations and src/server.js lifecycle are outside this denominator.
The seven new frontend tests are counted separately; this is not 95% frontend or
product coverage.
The task-owned loopback server was stopped after the checks. The user's existing
next-env.d.ts bytes were restored after types/build; unrelated changes remain intact.

An initial restricted-process run had 217 root passes and one failure because
the negative-build child process returned null status. A focused rerun confirmed
that launch failure. The reviewed unsandboxed rerun passes all 218, including the
same negative test; no assertion or environment guard was weakened. The existing
typeless-package and Three CommonJS test-loader deprecation warnings remain.
The initial loopback helper expected the brand-lab page's 404 before accounting
for the existing proxy. The observed 307 to login is the intended guest boundary;
the corrected helper also verifies that no laboratory controls are returned.

## Hosting and runtime limitations

The existing UI-only Preview at source 403fbd8 was tested once through signed-in
Chrome and by a credential-free HEAD request. Both time out before application
content is received; the browser screenshot shows ERR_CONNECTION_TIMED_OUT.
No bypass credential was newly generated or used to access the site during this
slice. Browser tabs were finalized.
The earlier CLI-generated protection token was later identified and revoked with
specific tool approval, as recorded below.

The final [protected repair Preview](https://virtual-ink-ui-test-4dds4xake-shadowrootsec-5679.vercel.app)
is deployment `dpl_APsRchd1o5vVphhbkiEi6q8UStRt`, source
`9762d73ae84adde3b82f721fc86fbfeaacdc60e6`, project
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`. Metadata at 04:36:13 UTC confirms
READY, Preview environment, raw target null, buildSkipped=false, zero deployment
aliases and no automation-bypass environment binding. The committed-source
snapshot contains 417 reviewed upload files, excluding credentials/private work,
generated output, Word reports and unreviewed attachments. Logs confirm cache
skipped, both locked installs, zero npm vulnerabilities, passing ui_test isolation,
lint, Next.js compilation and completed deployment. No production alias is promoted.

At the final browser check, the signed-in Shadow Root connection changed identity.
Its refreshed connection was selected using current discovery and instructions;
the subsequent navigation attempt timed out and reset the browser session before
page state could be verified. No hosted visual or runtime pass is claimed.
Final browser-tab cleanup after that reset is unconfirmed. Hosted bundles/fonts,
lazy runtime/fallbacks, physical devices and
the separate full-service acceptance target remain open. Previous source's
visual checks are not transferred to the repair.

Reviewed source: `9762d73ae84adde3b82f721fc86fbfeaacdc60e6` on
codex/hosted-studio-acceptance. The first deployment command was rejected before
creation because skip-domain is a Production-only CLI option. That optional flag
was removed; the retry retains the explicit Preview target. No Production
deployment/promotion option was added to satisfy the CLI diagnostic.

The first created Preview, dpl_HAYBo5fH9YRZBH6RLhzLd5owo9RG, failed at the
unchanged isolation guard with UI_TEST_BINDING_FORBIDDEN. Both locked installs
had passed with zero npm vulnerabilities; the build stopped before compilation.
Read-only name inspection identified VERCEL_AUTOMATION_BYPASS_SECRET as the
sole matching binding name. Vercel's [automation protection documentation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
explains that it injects an existing automation bypass secret into deployments.
This matched the sole token created by the earlier CLI probe at 04:12:44 UTC.

After specific approval, the exact token was revoked without replacement.
The helper checked the UI-only project, sole-token count, exact creation timestamp
and automation scope before submitting the revocation through stdin. Token values
were not printed, placed in arguments or written to files. Post-read evidence at
04:34:20 UTC confirms zero remaining tokens and unchanged all-except-custom-domains
deployment protection. The first cleanup helper read mixed a CLI banner with JSON
and failed before mutation; separating the streams resolved that tooling error.
The original live and full-service acceptance projects were not targeted.

The failed build is retained as evidence. A fresh Preview of the same reviewed
source was requested after cleanup; its actual result is recorded separately.
No guard, credential allowlist, project service flag or public access exception
was changed to obtain a pass.

## Scoped security review

No attacker access is required to trigger the proven visual defect: local
animation-mode or motion-preference changes suffice. Its demonstrated impact is
premature removal of the static logo; no account, tenant, file or authority bypass
was reproduced. The fix isolates state by scene lifetime and retains delayed
readiness, cancellation and disposal. Negative checks retain the SVG on WebGL or
module failure and ignore callbacks from destroyed scenes.

Synthetic inputs only were used. No private artwork, credential, customer data,
signed URL or vendor evidence enters source or reports. Read-only hosted probes
preserve deployment protection. Review/Preview snapshots must exclude existing
user changes, tool state, private files, generated output and unreviewed assets.
Original live and acceptance projects, provider schema, service flags, domains
and payment configuration are outside this change.

The [official Node security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes for 24.x on or shortly after 21 October. Zero npm
advisories and a baseline pass do not clear this release gate. These are scoped
application checks, not a provider, workstation or production-system pentest.

Modern Web Guidance search and the motion guide were consulted. Its advice to
turn off heavy motion for reduced-motion users supports retaining the SVG while
the preference is active. No new CSS animation or browser API was introduced.
Installed Next.js 16.4.0 lazy-loading documentation was read; the existing
client-side dynamic scene import remains deferred until admission.

## Team actions and rollback

- Uchi: review the exact-source repair, approved token cleanup and fresh Preview
  evidence; keep release NO-GO and resolve hosted browser connectivity.
- Mumba: review cancellation and failure evidence, then continue compatible
  isolated Auth/MFA and secure-service acceptance. No sensitive enablement here.
- Taizya: test real reduced-motion changes, visible SVG-to-canvas transitions,
  keyboard focus and lazy/failure behavior on the required physical devices.
- Lubasi: identify physical testers/devices and provide verified supplier model,
  licence, measurements, stock, pricing and operating policy evidence.

Rollback is a reviewed revert of this component/test change followed by the same
isolated UI-only Preview process. It preserves user work and supplied assets.
No database rollback or production alias change is needed. No production rollback
rehearsal, phase completion, push or human signoff is claimed.

The matching Word handover uses the established compact reference guide preset
and memo masthead. The generator's structural/table-geometry audit passes.
Separate QA passes eight Markdown files, 316 local links, Word ZIP/XML,
table/numbering and scoped privacy; all 27 integration classifications and
fourteen open release conditions are preserved. Rendering first fails on the
restricted temporary-directory ACL; the approved retry reaches conversion but
fails with WinError 2 because LibreOffice is unavailable. No page PNGs or visual
Word acceptance are claimed. Existing reports and unrelated user work are
preserved. The handover is committed separately from the deployed source; no
GitHub push, production promotion or phase completion is claimed.
