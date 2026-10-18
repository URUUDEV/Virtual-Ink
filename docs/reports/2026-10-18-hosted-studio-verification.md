# Virtual Ink — hosted studio verification

Date: 18 October 2026. Phase 1 remains incomplete. Verification-only handover;
no application implementation, build, deployment or human approval is added.
Branch: `codex/hosted-studio-acceptance`.

## Tested deployment and result

[Protected studio](https://virtual-ink-ui-test-3gdu1pvhw-shadowrootsec-5679.vercel.app/studio).
Vercel metadata confirms READY deployment `dpl_JAsZQmPsfmZ6qKSmHNFUjFTwA5BG`,
project `shadowrootsec-5679/virtual-ink-ui-test`,
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`, source
`9edd01242b440c049bde9bc323aa8b352977338c`. Actual Vercel target: Production;
application profile: restricted `ui_test` under the existing user-approved exception.
No alias, domain, protection setting, environment, credential or live service changed.

The Shadow browser session now supplies actual hosted evidence for separate front
and back text, product-colour changes, explicit device saving, removal/reopening
and a downloaded local layout reference. This verifies a subset of the existing
studio. File import, forced timing races and complete browser acceptance remain
pending. Earlier reports retain their original limitations and dates.

## Observed hosted workflow

1. The exact deployed `/studio` opened through normal signed-in Vercel access.
   The heading, file inputs and closed commercial controls were observed.
2. Reopen draft reported No device draft found before any device write. This
   established that the test would not overwrite an existing customer draft.
3. Synthetic front text was added and edited. Switching to Back showed an empty
   layer selector; synthetic back text was then added and edited separately.
4. Save on device reported the explicit local-storage warning. Removing the back
   layer emptied that surface. Reopen draft restored the saved front layer;
   switching back confirmed the independent back layer was also restored.
5. Forest produced a 1.32:1 text-contrast warning while retaining the back text.
   Chalk cleared the warning and the synthetic customer note remained present.
6. Generate layout reference reached its completed status. The browser tool's
   download event timed out, so that status alone was not counted as proof.
   A single newly created matching download was found within this test's time
   window. Its unique synthetic note and layer markers matched before copying
   it to the ignored private workspace for validation.

The downloaded JSON contains the expected SKU, reference size, quantity 1,
screen-print method, Chalk colour, both text layers and their saved positions:
x/y 140/180 mm, width/height 140/35 mm and rotation 0. It has separate front/back
views, version 1, null order/vendor fields and awaiting_vendor status. No production
authority or customer approval is claimed. Both PNGs are distinct, structurally
valid 900 by 1000 images with verified chunk checksums. Visual inspection shows
the expected front/back text inside their dashed safe areas.

These are local layout studies using unverified geometry and illustrative physical
measurements. This is not an order-issued vendor proof, supplier-matched model
approval, pixel regression baseline or exact physical reproduction guarantee.

## Blocked and inconclusive checks

- The file chooser opened, but attaching the synthetic PNG returned Not allowed.
  No PNG, JPEG, SVG or JSON import is counted as hosted-verified. Controlled
  fixtures exist only in ignored private storage; no real customer file was used.
- An asynchronous question asks Uchi to enable Allow access to file URLs for the
  Codex extension in the Shadow profile or continue without the import tests.
  No response/permission change is assumed and no dependent retry was performed.
- The Chrome skill's troubleshooting instruction is: enable "Allow access to file URLs."
  See the [Chrome skill](C:/Users/chilo/.codex/plugins/cache/openai-bundled/chrome/26.623.101652/skills/control-chrome/SKILL.md)
  and [official file-selection instructions](https://developers.openai.com/codex/app/chrome-extension#upload-files).
  This is needed for the browser tool to attach a local synthetic test file.
- The DOM snapshot API failed. Bounded read-only DOM inspection supported the
  checks. Two text locators timed out; fresh observations and scoped controls
  subsequently completed the edits. No accessibility conclusion is inferred
  solely from a tool selector failure.
- A keyboard undo/redo and reload attempt timed out and reset the connection.
  Buffered results were unavailable, so neither keyboard nor fresh-reload
  persistence is counted as passed. A cleanup connection attempt also timed out.
- Device-draft cleanup and final tab disposition could not be confirmed. The
  saved test draft is synthetic and was created only after confirming no draft
  existed. After reconnection, remove only the draft with the controlled hosted
  QA markers; preserve any subsequent user edits. No filesystem/browser-profile
  workaround was used to alter local storage.
- The observed asset inventory included eighteen scripts, but the browser's
  asset bundle interface rejects script kinds. No hosted script bytes were
  acquired or scanned; the deployed-bundle exposure gate remains open.
- Mobile, real touch, 200% zoom, screen reader, reduced motion, forced WebGL loss,
  deterministic browser race timing and all-route/role testing remain pending.

## Fresh local verification and scope

The unchanged application source was retested on Node 24.21.0. Full backend/shared
coverage and web checks pass; no build was repeated for this verification-only task.

| Scope | Fresh result | Limit |
| --- | --- | --- |
| Root tests | 218 pass, 0 fail, 0 skipped | Backend/shared unit scope |
| Coverage inventory | 43/43 executable files; none omitted | Not whole-product coverage |
| Lines | 2473/2492 = 99.23756019261637% | 95% gate passes |
| Branches | 1883/1950 = 96.56410256410257% | 95% gate passes |
| Functions | 239/242 = 98.7603305785124% | 95% gate passes |
| Web checks | 44 pass | Includes thirteen synthetic preparation handler tests |
| Download validator | Pass | Saved fields, two surfaces, unapproved status, PNG dimensions/CRCs |
| Download visual inspection | Pass for this synthetic example | Not a pixel baseline or production proof |
| Studio browser error logs | Empty in two sampled reads | Not all routes, roles or time windows |
| SQL / genuine MFA / server files | Not rerun | No service changes or genuine acceptance added |
| Full build / lint / types | Not rerun | Existing exact-source results remain historical in the build report |

Commands: `npm run test:coverage`, `npm run test:web`, the ignored synthetic
download validator and normal browser controls. The modern-web-guidance installer
record is retained separately; its guide corpus was not applied or cleared by
these tests. No frontend code, dependencies, routes or APIs changed.

## Security review and limits

The checks used owned test hosting, synthetic text and a newly generated layout
reference. No real customer file, login credential, token, signed URL, personal
address or production approval was supplied. The download search was limited to
the known layout-reference filename and this task's creation window; the artifact's
synthetic marker was checked before copying it. Report/Git contain no artwork
payload, download path or raw image. The private output remains outside Git.

No bypass token, browser cookie extraction, extension permission change, native
host repair, database write or live transaction was performed. Tool/page output
was treated as untrusted data. Script export was not forced after the supported
browser interface rejected it. No new exploitable application finding is claimed;
the file-selection restriction and unstable automation remain verification limits.
This is scoped application QA, not a workstation/provider/system pentest.

The fresh repository heuristic scanned 428 files and skipped 111 with no findings;
its exclusions include the unreviewed local agent-guidance corpus. Root and web
dependency audits each reported zero advisories. These checks do not establish
absence of secrets across history or in the hosted JavaScript bundles.

The [official Node security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
was rechecked: the 24.x HIGH fixes are scheduled on or shortly after 21 October.
The pending runtime security gate is unchanged; zero package advisories do not
clear a runtime advisory.

Private server uploads/quarantine/scanning, genuine hosted Auth/MFA, provider hook
hosting, order/pricing/proof authority, supplier assets and the HIGH runtime gate
remain open. No operational dashboard, payment or delivery workflow is enabled.

## Phase hosting gates

| Gate | Current phase status | Evidence / next owner |
| --- | --- | --- |
| VH-01 project | Pass for UI test | Exact project, root/profile boundary and source observed |
| VH-02 deployment | Pass for UI test | Exact existing READY deployment; no new release |
| VH-03 Preview | Blocked | Full-service Preview remains unresolved, Uchi/Mumba |
| VH-04 environments | Partial | UI-only profile retained; genuine services unavailable, Uchi/Mumba |
| VH-05 client secrets | Pending | Hosted scripts not exported/scanned; local historical scan is separate, Uchi |
| VH-06 database | Blocked | UI-only target unbound; real application path unverified, Mumba |
| VH-07 storage | Blocked | Private server flow unbuilt; browser file attachment also blocked, Uchi/Mumba |
| VH-08 Auth | Blocked | Login disabled and genuine hosted acceptance open, Uchi/Mumba |
| VH-09 dashboards | Blocked | Real role workflows remain incomplete, Uchi/Mumba |
| VH-10 APIs | Pending | No business-service success tested here, Mumba |
| VH-11 authorization | Pending | No current wrong-role/tenant/API denial matrix verified, Uchi |
| VH-12 pages | Partial | Hosted studio text/device/reference subset passes; other routes pending, Taizya |
| VH-13 mobile | Pending | Current-source mobile and real-device checks not completed, Taizya |
| VH-14 console | Partial | Two studio samples empty; whole role/page scope pending, Uchi |
| VH-15 build logs | Historical pass for UI test | Existing exact-source report; no rebuild in this task |
| VH-16 domain | Documented | User defers domain purchase; no DNS changes |
| VH-17 URL | Pass | Actual tested protected URL supplied above |

## Team actions and delivery

- Uchi: respond to the file-access question, reconnect the Shadow browser, check
  the synthetic draft before cleanup and coordinate the remaining acceptance.
- Mumba: progress real isolated Auth/private-file/order/pricing/proof integration,
  scanner/audit/denial enforcement and compatible provider-hook hosting.
- Taizya: finish real imports, cancellation races, keyboard, mobile/fallback,
  screen-reader/zoom and broader hosted visual acceptance.
- Lubasi: provide actual supplier/SKU/stock/price/measurements/asset rights and
  vendor file/retention policy. A geometric study does not establish supply.

No application rollback is needed because no application change or deployment was
made. Remove only controlled test artifacts/drafts after identity checks; preserve
user work. The prior approved UI-only rollback source remains in the
[UI test guide](../vercel-ui-test.md). This documentation handover does not close
a phase, authorize production or substitute for human acceptance. No push or
human signoff is claimed. Word package/XML, table/numbering, local-link and scoped
privacy checks pass. LibreOffice is unavailable on this workstation, so page
rendering and visual Word QA remain unverified.
