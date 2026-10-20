# Virtual Ink — studio preview failure and resource safety

Date: 20 October 2026; work began on 19 October. Phase 1 is **INCOMPLETE**;
release **NO-GO**. This is one local preview-safety slice, not private upload,
order, supplier-model or physical-device acceptance.

## Reproduced behavior and repair

Seven controlled tests failed before repair. An older texture-paint rejection
could replace the status of a newer successful 3D design, including after a
layout/3D transition. Layout rendering failures were hidden by a constant success
label. Cancelled layout staging could be resized again by a late painter, and
superseded, failed or disposed texture batches retained their temporary canvases.
These failures were reproduced through actual repository components/rendering
code with controlled hooks, loaders and painter timing; no real GPU memory-leak
measurement or remote exploit is claimed.

The component now ignores obsolete texture failures and reports layout loading,
success and failure independently. A visible Retry layout action retries the
current design without changing it. Staging canvases clear after painting settles,
so an unfinished operation cannot recreate a supposedly released buffer.

The viewer waits for all zone painters to settle before committing or cleaning
their batch. Superseded, failed and disposed work clears uncommitted canvases;
successfully committed textures retain their canvases until replacement or
disposal. Disposal is idempotent and updates after disposal allocate nothing.
Layout composition also releases its internal temporary texture on success and
failure. This preserves the existing model paths, artwork surfaces, colour,
camera, bounded inputs and supplied assets. No package dependency is added or
changed; test:web now includes the new preview suite.

Fourteen new checks cover stale/current texture failures, layout transitions and
retry, stale layout rejection, late cancellation, failed sibling painters,
texture ownership/disposal, internal layout cleanup, model-load failure fallback
and flat-only products. Controlled hooks/renderer/image responses are not real
browser, decoder, GPU, device or hosted-service acceptance.

## Local verification

| Scope | Result | Limit |
| --- | --- | --- |
| Complete web suite | 65 passed; zero failed/skipped | Includes fourteen new controlled preview tests |
| Root suite and coverage | 218 passed; all 43/43 inventoried files measured | Backend/shared unit scope only |
| Security regressions | 197 passed; zero failed/skipped | Local application scope |
| Auth SDK/Next contracts | 16 passed; zero failed/skipped | Controlled responses; no hosted Auth enablement |
| Web/shared types, source lint, production build | Pass | Local isolated flags; sensitive services disabled |
| Dependency advisories | Root and web report zero vulnerabilities | Runtime and product release gates remain separate |
| Source security heuristic | Pass; 434 scanned, 116 skipped, no findings | Not a history/binary secret audit |
| Runtime baseline | Node 24.21.0 passes existing baseline | Scheduled HIGH security release remains open |
| Loopback assets and guest boundaries | Four HTTP requests pass; 64 asset/font byte matches | Homepage/studio 200, guest lab redirects to login, identity API 401 |
| Exact-source UI-only Preview | READY; fresh install/isolation/lint/compiler/build pass | Preview environment; no production aliases or sensitive enablement |
| Hosted browser verification | Pending after connection timeouts | No exact-source visual/runtime or physical-device acceptance claimed |

Exact backend/shared coverage: **2473/2492 lines (99.24%)**,
**1883/1950 branches (96.56%)**, **239/242 functions (98.76%)**.
All 43 inventoried files are measured. Frontend/browser flows, SQL, genuine
hosted integrations and src/server.js lifecycle are outside this denominator.
The fourteen added frontend tests are reported separately; no 95% frontend or
full-product coverage claim is made. Final web/lint checks were repeated after
the last two model/fallback tests were added; all pass. Existing typeless-package
and CommonJS Three.js test-loader warnings remain.
All 39 public assets and 25 fonts match the local build bytes. The local
client-artifact heuristic checks 68 JS/CSS files, 1,872,468 bytes, with no findings.
This is a bounded text heuristic, not proof that every possible secret/dataflow is
safe. The temporary loopback server was stopped. A helper-only prefix replacement
initially changed the expected logo attribute name; restoring the actual
data-logo-state assertion resolves that failed probe without changing application
source. The user's pre-existing next-env.d.ts bytes remain preserved.

## Hosting and browser evidence

Before the new build, protected Preview 4dds4xake at source 9762d73 was reachable
again. The crew model and selected mug reached 3D ready. Its DOM snapshot method
remains incompatible; supported read-only DOM inspection and screenshots work.
An initial label-based selector timed out; the live option-based selector was
then confirmed unique before use. This is baseline evidence for that prior
source, not verification of the new repair.

The [protected UI-only Preview](https://virtual-ink-ui-test-bqgq1cn7w-shadowrootsec-5679.vercel.app)
is READY, deployment `dpl_FXjE9rbrNgvyMHmZh3Q7mLS6Xb1A`. Read-only metadata
at 2026-10-20T08:44:03Z confirms environment preview, raw target null,
buildSkipped false, zero aliases/automatic aliases, 419 uploaded files and
application environment ui_test without an automation-bypass binding. Build logs
confirm fresh locked installation, environment isolation, source lint, compilation
and Build Completed. Existing UI-only project
isolation, deployment protection and zero automation-bypass tokens are retained.
No vercel curl credential is generated, no guard is weakened and no production
target/bootstrap is used. Original live and full-service acceptance projects,
Auth/database/storage, domains and payments remain outside the change.

Reviewed source is `de616ad739e92d2eb42f2a4a08d5ab8f80a17644` on
codex/hosted-studio-acceptance. The first upload stopped with fetch failed before
returning a deployment record. The retry checks project history for an existing
deployment of the exact source/purpose before uploading again. Both attempts
inspect 419 committed-source files and exclude private data, environments, local
tool state, generated output, Word files and unreviewed attachments.

Exact-source Chrome navigation/inspection timed out, including a retry after
rediscovering the same Shadow profile and reading the documented recovery flow.
No new-source browser interaction or screenshot completed. Hosted model/layout,
forced-failure and client-bundle verification remain pending. The earlier crew
and mug result above belongs only to the previous source. The supported browser
tab finalizer completed successfully after reconnection. No alternative profile,
protection bypass, artificial human approval or new credential was used.

## Scoped security review

The proven paths require ordinary editing, retrying or leaving a local preview
while asynchronous painting is unfinished. The measured impact is stale error
state and nonzero dimensions on abandoned temporary canvases. Repeated retained
buffers could increase local memory pressure; browser/process exhaustion was
not demonstrated. No cross-account, tenant, role or file-authority bypass was
reproduced. Current failures retain fixed messages rather than untrusted decoder
or loader details.

Cancellation prevents obsolete results from being applied. Cleanup occurs once
the underlying painting settles; this does not forcibly abort an image decoder,
font load or GLB fetch, guarantee immediate garbage collection, erase prior
copies/downloads, or bound a permanently hung provider/browser operation.
Customer artwork remains local and is never placed in public models or reports.
Tests use synthetic content only. The loopback server, if used, is task-owned;
unrelated processes and the user's generated-type changes are preserved.

The [Three.js cleanup guide](https://threejs.org/manual/pages/cleanup.html)
documents explicit resource disposal; [React's effect guidance](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
supports ignoring stale async results. Installed Next.js lazy-loading guidance
was read. Modern Web Guidance search/list and efficient-background-processing
were reviewed; that guide addresses visibility scheduling, so no new visibility
API or CSS optimization was applied to this ownership/cleanup repair.

The [Node security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes for 24.x on or shortly after 21 October. A baseline
pass and zero npm vulnerabilities do not clear that release gate. These are
scoped application checks, not a provider/workstation/production-system pentest.

## Team actions and rollback

- Uchi: review exact-source local/hosted evidence; retain NO-GO and coordinate
  actual physical-device, integration and release decisions.
- Mumba: review async ownership and negative checks; continue compatible isolated
  Auth/MFA/private-service acceptance without enabling sensitive services here.
- Taizya: verify layout retry/error announcements, model changes, artwork and
  real touch/keyboard/low-memory behavior on the required physical devices.
- Lubasi: supply verified model/licence/measurements/stock/pricing and artwork
  policy evidence, and identify physical devices/testers.

Rollback only the reviewed preview changes in a follow-up commit and rebuild the
same protected UI-only Preview. Preserve supplied assets and unrelated user work.
This is not a production rollback rehearsal, human signoff or phase completion.
Source is committed as de616ad; the matching documentation is committed separately.
No Git push or production promotion was performed; this review slice does not
complete a phase. The Word copy uses compact_reference_guide with memo_masthead.
Word package/XML, table geometry, numbering and privacy checks pass, along with
local links in all eight affected Markdown documents. All 27 integration
classifications and fourteen unchecked release-decision items remain intact.
The first render attempt hit the Windows temporary-profile sandbox restriction;
the approved retry reached conversion but LibreOffice/soffice is missing
(WinError 2). No page images or visual layout verification are available.
