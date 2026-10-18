# Virtual Ink — canvas fallback repair

Date: 18 October 2026. Phase 1 remains incomplete. This is a narrow studio repair
and hosted-verification slice, not a production commerce release or human signoff.
Branch: `codex/hosted-studio-acceptance`. Source commit:
`a3755a7f0de20707f97f81856d27bad874bc18eb` (includes the canvas-key fix in
`0f680b27d8fec46e17dd3a69d3285b3053260f7e`).

## Problem and change

On the previously hosted source, switching a ready 3D preview to Layout / fallback
left a blank canvas. The layout label and back-layer selection could change, but
the product and artwork did not appear. This was observed at a 320 by 740 browser
viewport; the 3D view itself rendered a recognizable garment.

Both conditional branches rendered an unkeyed canvas at the same React position.
React reused the DOM canvas, retaining its WebGL context. A canvas cannot acquire
a different context type after initialization. The fix gives the 3D and layout
canvases separate stable keys, causing a fresh canvas to be mounted at a mode
change. Existing effect cleanup, asynchronous cancellation and parent design
state remain in place. No artwork is embedded in a model or sent to a server.

Testing the reverse transition on the first repair deployment exposed a second
readiness issue: a newly created 3D viewer inherited the component's old ready
status. Setting ready to that same value did not trigger the artwork/surface
effects. The creation effect now enters Preparing selected model before loading
the new viewer, ensuring its ready transition reapplies the current design and
surface. The initial repair deployment is intermediate evidence, not the final
accepted source.

The platform behavior is documented by [MDN getContext](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext)
and [React identity/reset guidance](https://react.dev/learn/preserving-and-resetting-state).
Modern Web Guidance search/list checked canvas lifecycle and fallback topics;
the returned HTML-in-canvas/experimental integration topics did not fit this
ordinary WebGL/2D canvas transition. No retrieved guide shaped the code and no
experimental API or new dependency was introduced.

Changed screen/component: `/studio`, `ProductStudioPreview`. No route, API,
schema, authentication, pricing or vendor integration changed. The supplied
brand assets and their geometry are preserved; none was modified or replaced.
Unverified product studies remain labelled and checkout stays disabled.

## Fresh checks

| Scope | Result | Limit |
| --- | --- | --- |
| Backend/shared tests | 218 pass, 0 fail, 0 skipped | Unit scope, not product completion |
| Coverage inventory | 43/43 executable files, none omitted | Frontend, SQL and hosted integrations separate |
| Lines | 2473/2492 = 99.23756019261637% | 95% target passes |
| Branches | 1883/1950 = 96.56410256410257% | 95% target passes |
| Functions | 239/242 = 98.7603305785124% | 95% target passes |
| Security tests | 197 pass | Overlaps the root suite; do not add to its count |
| Web checks | 44 pass | Existing handler/contract checks, not browser pixel tests |
| Web Auth checks | 16 pass | Local contract checks, not genuine hosted login |
| Web and strict backend/shared types | Pass | No provider acceptance implied |
| Lint | Pass, zero warnings/errors | Enforced by build |
| Production build | Pass, 22 static pages | Explicit local profile, services disabled |
| Runtime baseline | Pass on Node 24.21.0 | Does not clear the pending HIGH advisory |
| Repository heuristic | Pass: 429 scanned, 112 skipped | No finding; excludes unreviewed skill corpus |
| Local browser transition | Pass visually in both directions and repeated | One synthetic text example |
| Local sampled console errors | Empty | Studio sample only |
| SQL / genuine hosted MFA / private storage | Not rerun | No changes to those services |

Commands: `npm run test:coverage`, `test:security`, `test:web`, `test:auth:web`,
`typecheck:web`, `security:runtime`, `security:check`, `build:web` and strict
backend/shared TypeScript compilation via the existing verification helper.
The first build was stopped by ENVIRONMENT_REQUIRED because the shell had no
application designation. Retrying with APPLICATION_ENVIRONMENT=local and disabled
services passed the unchanged isolation guard. The user's next-env.d.ts bytes
were preserved by the helper.

After the readiness follow-up, the build compiled and passed lint/types but ran
out of memory during eleven-worker page generation. A constrained local retry
uses the installed Next.js CIRCLE_NODE_TOTAL setting (2, producing one worker)
and a 512 MB Node heap. No application config or safety check was weakened.
That final build passed, generated all 22 pages and passed strict backend/shared
types. The 44 web checks and web types were rerun after the readiness correction.

## Additional hosted observations before repair

The original protected deployment reopened the controlled synthetic draft in a
fresh tab, confirming persistence beyond the original tab. Keyboard Enter on
Undo removed an added unsaved layer; Enter on Redo restored it. At 320 by 740,
the document client/scroll widths were both 305 CSS pixels (scrollbar excluded),
with no observed controls extending outside the viewport. The header, heading,
toolbar and 3D controls were visually inspected. This is responsive desktop
emulation, not genuine touch-device acceptance or 200% zoom testing.

Before cleanup, the customer note matched the prior task's unique synthetic QA
marker. Remove device draft reported success; Reopen draft then reported No
device draft found. No existing customer draft was overwritten or removed.

The snapshot API still fails; bounded read-only DOM inspection and visible
controls were used. Two role locators timed out after the mode changed its controls;
fresh visible DOM controls then selected Back and confirmed the separate saved
back text. A scroll command timed out, although the subsequent screenshot showed
the intended scroll. These tool failures are not counted as successful checks.
File attachment was not retried without confirmation of the extension setting.

## Hosting and acceptance

The reviewed committed-source snapshot is restricted to the user-approved
`shadowrootsec-5679/virtual-ink-ui-test` project, ID
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`. Project/root/protection/disabled environment
entries are checked before deployment. No original live-site alias, domain,
secret, database or payment setting is changed. The deployment uses the existing
Production-labelled UI-only exception; it is not the full-service Preview gate.

[Final protected studio](https://virtual-ink-ui-test-otzxni541-shadowrootsec-5679.vercel.app/studio).
Deployment `dpl_9GyrDYAju7KBFhPxqPLkgKzQM9ed` is READY, has no metadata error
code and matches the project/source above. Actual target: Production; application
profile: restricted ui_test. Snapshot inspection approved 413 upload files and
excluded private data, environments, supplied unreviewed attachments, local tool
metadata and Word reports. No alias was promoted and no service was enabled.

Normal signed-in Shadow access opened the exact final URL. After observing 3D
ready, synthetic front text and Forest colour were applied. Layout drew the
garment, safe area and text; returning to 3D visibly retained both text and colour.
A repeated switch worked. Back initially had no layer, then accepted independent
synthetic back text. Returning to 3D showed the back-facing garment with that text
and the selected colour. The sampled studio error log was empty. Browser-tool
telemetry/network errors occurred separately; they were not application console
entries. No whole-site console or accessibility pass is inferred.

The final source at 320 by 740 again had equal 305-pixel client/scroll widths,
with the Back surface selectable through visible controls. Final narrow-screen
visual acceptance remains partial: an immediate screenshot during asynchronous
painting did not establish completion, and genuine touch/zoom/screen-reader tests
were not performed. Desktop visual checks establish the two repaired transitions.
This does not replace forced no-WebGL or reduced-motion acceptance.

The viewport override was reset. Reloading the final tab cleared its transient
synthetic design (empty layer selector/notes); nothing was saved on that origin.
Browser finalization kept only the final test site as a deliverable and closed
the task's intermediate/local tabs. The previously saved synthetic draft was
confirmed removed as described above. No application dependency or asset was
added; Lighthouse/CWV/GPU measurements were not run, so performance score targets
remain pending.

| Gate | Phase status | Current evidence or remaining work |
| --- | --- | --- |
| VH-01 project | Pass for UI test | Explicit project, root and disabled profile verified |
| VH-02 deployment | Pass for UI test | Final exact-source READY deployment |
| VH-03 Preview | Blocked | Genuine full-service Preview unresolved |
| VH-04 environments | Partial | Approved UI-only flags; genuine services unavailable |
| VH-05 client secrets | Pending | Hosted bundle contents still unscanned |
| VH-06 database | Blocked | UI-only target deliberately unbound |
| VH-07 storage | Blocked | Private server flow unbuilt; local import permission unconfirmed |
| VH-08 Auth | Blocked | Genuine hosted login/MFA acceptance open |
| VH-09 dashboards | Blocked | Real role workflows incomplete |
| VH-10 APIs | Pending | No business-service success tested |
| VH-11 authorization | Pending | Current hosted role/tenant denial matrix unverified |
| VH-12 pages | Partial | Final studio transitions verified; broader routes pending |
| VH-13 mobile | Partial | 320px overflow/control sample; real devices and full visuals pending |
| VH-14 console | Partial | Final studio sample empty; all-role/page scope pending |
| VH-15 build logs | Partial | Local final build passes; hosted READY, full log review pending |
| VH-16 domain | Documented | User defers purchase; no DNS changes |
| VH-17 URL | Pass | Actual final tested URL above |

## Security review

The demonstrated issue affects availability and truthful fallback presentation:
a normal visitor can switch preview modes and lose the visible layout. No
credential, authorization bypass or cross-customer disclosure was reproduced.
Separating canvas identities fixes the context collision while retaining the
same parent design. Existing render cleanup remains unchanged. Tests use only
synthetic text and approved owned hosting; no file picker, browser permission,
token extraction, storage workaround, live transaction or real customer file
was used. Tool/page output was treated as untrusted data.

Private upload scanning/quarantine, real assigned-order access, supplier-approved
assets, server pricing, vendor proofs, genuine hosted Auth/MFA and the pending
runtime HIGH gate remain open. The earlier zero-dependency-advisory checks are
historical; dependencies did not change here. This is a scoped application
review, not a workstation/provider/system pentest. No product-security release
or human approval is claimed.

## Team actions and rollback

- Uchi: review the narrow repair and coordinate isolated Phase 1 acceptance;
  confirm file-selection readiness before the outstanding import tests.
- Mumba: continue genuine isolated Auth/private-file/order/pricing/proof
  integration and the compatible provider-hook hosting decision.
- Taizya: finish real touch, keyboard-wide, reduced-motion/no-WebGL, screen-reader,
  zoom, import/race and broader hosted visual checks.
- Lubasi: supply verified supplier/SKU/stock/price/measurements/asset permission
  and vendor upload/retention policy; model studies do not establish supply.

Rollback only in the isolated UI test project by redeploying the prior source
`9edd01242b440c049bde9bc323aa8b352977338c` under the same disabled profile. It has
the demonstrated fallback bug, so use only if the new build has a worse regression.
No database rollback is required. Original live hosting remains outside this slice.
Do not push through its automatic deployment integration. No push is claimed.

The matching Word report uses the repository's compact reference preset and
passes its structural audit. Seven Markdown files and 261 local links pass,
along with Word ZIP/XML, numbering, two tables including all seventeen hosting
gates and scoped privacy checks. Rendering first hit sandbox temporary-directory
permissions; the approved retry reached the missing LibreOffice executable
(WinError 2). Word page rendering/visual QA remains unverified. No phase
completion or full mandatory studio certification is claimed.
