# Virtual Ink — studio preparation safety

Date: 18 October 2026. Phase 1 review slice; studio and MVP incomplete.
Implementer: Codex under the Shadow Root standard. Human acceptance pending.
Branch: `codex/studio-preparation-safety`. Deployed source:
`9edd01242b440c049bde9bc323aa8b352977338c`.

## Change and reproduction

A pending local artwork decode could append to a newly reopened same-product
device draft. A second race admitted thirteen layers if a customer added the
twelfth text layer while artwork was decoding. Both failures were reproduced
against the original component handlers: actual layer counts were 1 instead of
0 for the reopened draft and 13 instead of the allowed 12. Both regressions now
pass. These are local design-integrity findings, not demonstrated server access
or code execution vulnerabilities.

The studio now permits one preparation at a time and offers Cancel preparation.
A valid device-draft reopen, product change, undo/redo or unmount invalidates
unfinished work. Editing while a JSON replacement or layout reference is pending
cancels that work and preserves the newer edit. Artwork appends to the latest
configuration only if the twelve-layer and existing serialized-size limits still
pass. Rejected additions preserve the prior design/history and never claim success.

Layout references check cancellation after asynchronous painting, download only
the captured configuration and separate surfaces, and advance their local version
only after initiating a successful download. Cancelled work releases its temporary
canvas when painting settles. A stale failure cannot overwrite a newer message
or clear the newer job's busy state. A reference remains unapproved local output;
no vendor proof, customer approval or production authority is created.

Cancellation suppresses the result; it cannot forcibly stop the browser decoder,
erase all retained bytes immediately or revoke a download already initiated.
Closing the editor invalidates pending work, but garbage collection, browser
downloads and same-origin device storage remain outside guaranteed erasure.

## Changed surface and preservation

- `/studio`: `apps/web/src/components/product-studio.tsx` owns pending preparation,
  cancellation, commit-time limits, guarded feedback and reference cleanup.
- `scripts/studio-ui-checks.mjs`: thirteen deterministic handler tests with
  controlled decoder/painter timing and synthetic hooks/canvases/storage/downloads.
- `package.json`: adds those tests to `test:web`; no dependency change.
- `docs/product-studio.md`: documents operation rules and cancellation limits.

No API, database, authentication, storage, role, payment, supplier, model, logo,
font, asset licence or production configuration contract changed. No server
upload endpoint is enabled. Supplied brand assets are preserved without changes.
Unrelated generated `next-env.d.ts` and the untracked reference directory remain
unstaged. Product data stays illustrative/unverified; real prices, stock, vendor
supply and production assets remain unbuilt or unapproved. No new mocks enter the
product; decoder/painter mocks exist only in the explicit test harness.

## Verification results and exact scope

Local reviewed runtime: Node 24.21.0. No failed final required check is waived.

| Scope | Result | Practical limit |
| --- | --- | --- |
| Root tests | 218 pass, 0 fail, 0 skipped | Backend/shared unit scope |
| Coverage inventory | 43/43 executable files, none omitted | Not frontend or whole-product coverage |
| Lines | 2473/2492 = 99.23756019261637% | 95% gate passes |
| Branches | 1883/1950 = 96.56410256410257% | 95% gate passes |
| Functions | 239/242 = 98.7603305785124% | 95% gate passes |
| Security suite | 197 pass | Scoped regression tests |
| Web checks | 44 pass, including 13 new studio tests | SSR/handlers; synthetic hooks and deferred decoder/painter |
| Auth SDK/Next checks | 16 pass | Synthetic provider checks |
| Studio HTTP | 74 assertions pass | Loopback built page and blank assets |
| Local client artifacts | 63 files; no findings | Not a deployed bundle audit |
| Repository heuristics | 425 scanned, 110 skipped; no findings | Heuristic scope, not proof of no secrets |
| Types / lint / build | Strict backend/web types, source lint and optimized Next build pass | Local operation |
| Dependency audits | Root and web: zero findings | Does not settle runtime advisories |
| SQL / genuine MFA | Not rerun | No SQL/Auth changes; historical results are not fresh acceptance |

Commands: `.private/verify-phase1-readiness.ps1`, focused Node studio handler
tests, `node scripts/studio-http-checks.mjs`,
`node scripts/security-artifact-check.mjs`, root/web `npm audit --json`.
The first full run had 217 passes and one failed environment-guard subprocess
assertion: child creation returned no exit status in the sandbox. The complete
suite was rerun outside that restriction and all 218 tests passed. No guard or
assertion was weakened. Initial new race tests failed as expected before the fix.
Four early painter-test failures were harness scheduling errors: the JSX handler
intentionally returns void, so the tests needed to wait for deferred work to
settle. Final thirteen tests pass with the real handler return behaviour.

Local browser DOM inspection confirmed the studio heading, labelled file inputs,
closed cart, normal controls and initial private-tab notice. The snapshot API
failed; bounded DOM reads were used. The synthetic PNG chooser flow timed out
and the connection reset. A later connection retry also timed out. No completed
browser PNG/JSON import, race or download is claimed; handler tests do not replace
that acceptance. The existing browser file-selection flow was not bypassed.

The Chrome troubleshooting guidance is to enable Allow access to file URLs in
the Codex extension's Details page at chrome://extensions; see the
[official upload instructions](https://developers.openai.com/codex/app/chrome-extension#upload-files).
This guidance was delivered to Uchi. No extension, native host or permissions were
changed. Final tab cleanup could not be confirmed after the connection resets.

## Security review

An affected customer needs only ordinary local editing/reopen actions while a
decode is pending; no attacker account is required to trigger the two integrity
failures. Untrusted artwork/imported JSON still requires explicit local selection.
Existing type/signature, PNG re-encoding, dimension/size, exact-key and safe-zone
checks remain. The late commit guard now closes the layer-count bypass. Captured
configuration, generation checks and guarded errors suppress stale downloads and
prevent one job from mutating another job's UI state.

Tests cover cancellation, duplicate jobs, old success/failure during a new job,
same-product reopen, missing/invalid drafts, product/history changes, unmount,
invalid/oversized JSON, serialized-size rejection, snapshot surfaces, local
revision numbering and fixed error messages. The size-boundary case uses synthetic
prepared output; it is not real image-decoder acceptance. Paint tests simulate
canvas output and prove control flow/configuration binding, not pixel correctness.

No real customer artwork, credentials or simulated human approvals were used.
Tool/document output was treated as untrusted data. Only reviewed committed source
entered the deployment snapshot; private fixtures, environments, supplied untracked
assets, Word reports and tool/Git metadata were excluded. No live service, paid
plan, security policy, browser permission or secret changed. This is scoped
application review, not a provider/workstation/system pentest.

The [Node HIGH security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
was rechecked. Fixes for 24.x are scheduled on or shortly after 21 October; the
sensitive release gate stays open. Disabled UI foundation work is allowed by the
working agreement. Passing the local minimum-runtime check and dependency audits
does not resolve that advisory.

## Hosting evidence and phase gates

Protected build URL:
https://virtual-ink-ui-test-3gdu1pvhw-shadowrootsec-5679.vercel.app/studio

Project: `shadowrootsec-5679/virtual-ink-ui-test`,
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`. Deployment:
`dpl_JAsZQmPsfmZ6qKSmHNFUjFTwA5BG`, READY, source above, 410 reviewed upload
files. Actual Vercel target: Production; application designation: `ui_test` under
the existing user-approved isolated exception. This is not a full-service Preview
or a release of the original application. Protection, project/root identity,
sixteen disabled-only configuration records and no Git/integration inheritance
were checked before deployment. No database/provider credential or service binding
was supplied; no domain or live alias was promoted.

Remote logs pass UI-test environment isolation, source lint, compilation (5.4 s)
and 22-page generation (1.144 s); both installs report zero advisories. npm's
cache-dir deprecation warning is recorded. These are build timings, not Lighthouse
or customer performance measurements. Hosted browser acceptance of this source
is blocked by the browser connection; earlier deployment checks remain historical.

Read-only checks before and after the update confirm the original live deployment
is still `dpl_7f4Kj1XeRy1Mf3MrQiSV9PEs7PWB`, source
`a6736376b09ba7c3242495ff86b4bb2eea62f20c`, READY on main. It was not deployed,
promoted or reconfigured. The separate acceptance target was not changed.

| Gate | Current phase status | Evidence / owner |
| --- | --- | --- |
| VH-01 project | Pass for UI test | Exact Shadow Root project/root observed; no Git deployment triggered |
| VH-02 deployment | Pass for UI test | Exact READY source/deployment above; platform release not approved |
| VH-03 Preview | Blocked | Full-service Preview remains unresolved, Uchi/Mumba |
| VH-04 environment | Partial | Restricted UI-only guard passes; genuine service setup pending, Uchi/Mumba |
| VH-05 client secrets | Pending | 63 local files clean; deployed bundle review outstanding, Uchi |
| VH-06 database | Blocked | UI-only target deliberately unbound; genuine app connection pending, Mumba |
| VH-07 storage | Blocked | Private server upload/quarantine/scanning unbuilt; local picker acceptance also pending, Uchi/Mumba |
| VH-08 Auth | Blocked | Login disabled; genuine hosted MFA/Auth acceptance open, Uchi/Mumba |
| VH-09 dashboards | Blocked | Real customer/vendor/admin operations incomplete, Uchi/Mumba |
| VH-10 APIs | Pending | No API changes; genuine deployed business success unverified, Mumba |
| VH-11 authorization | Pending | No privilege changes; current hosted role/tenant denials unverified, Uchi |
| VH-12 pages | Blocked for current source | Browser connection failed; READY is not page acceptance, Taizya/Uchi |
| VH-13 mobile | Pending | No current-source mobile visual acceptance, Taizya |
| VH-14 console | Pending | Current hosted application logs not inspected in browser, Uchi |
| VH-15 build logs | Pass for UI test | Successful build and documented cache-dir warning |
| VH-16 domain | Documented | User will buy a domain later; no DNS/domain changes |
| VH-17 URL | Pass | Actual protected build URL supplied; browser verification clearly pending |

## Team actions, limits and rollback

- Uchi: review the fix and reconnect the Shadow browser/extension for current
  hosted acceptance. Retain disabled service boundaries and coordinate Phase 1.
- Mumba: continue genuine isolated Auth and private-file/order/pricing/proof
  contracts, scanner/audit/denial enforcement and compatible MFA-hook hosting.
- Taizya: verify real file import, reopen, cancel, history, download and route-exit
  cases on mobile/desktop; complete keyboard, screen-reader, 200% zoom and motion QA.
- Lubasi: obtain actual supplier SKU/stock/price/measurement/licence evidence and
  vendor preflight policy; help settle FILE-01/FILE-02 retention/scan requirements.

Real supplier-matched production models, server pricing/cart/orders, private
storage/scanning, vendor-issued proofs/approval/audit, operational dashboards and
production/delivery remain unbuilt or unaccepted. Phase 1 is incomplete. No new
API or commercial mock integration is represented as finished. Human signoff,
Lighthouse and broad runtime/browser acceptance remain absent.

Rollback by reverting source `9edd01242b440c049bde9bc323aa8b352977338c` on a review
branch and validating, or redeploying prior verified UI-only source
`7471bfe9d9c710ed0bdd5ea8e68cd891063a986e` to the same isolated project using the
[UI test guide](../vercel-ui-test.md). Do not force-push, change disabled flags or
push through the original project's automatic production integration. No database
rollback is needed. Source and handover are local review commits; no push, phase
completion or human approval is claimed.

Matching Word output passes generator structure checks. Seven changed Markdown
files and 244 local links pass validation; Word ZIP/XML, real numbering, privacy
and both tables (including all seventeen gates) pass. Visual rendering was
attempted and failed with WinError 2 because LibreOffice is unavailable; no Word
visual acceptance is claimed. Report delivery is not readiness.
