# Virtual Ink — Shadow Root UI test deployment

18 October 2026. Shadow Root Security Technologies. Product: Uchi Chinyama.
Backend: Uchi and Mumba Chitonge. Design: Taizya Nakapende. Operations: Lubasi Monde.

**Hosted UI test site is Ready. Phase 1, full UI upgrade and production acceptance
remain incomplete.** This is the separate protected test deployment explicitly
approved by the user after the first-deployment target restriction was explained.
It is not a production platform release or human product signoff.

## Working URL and provenance

[Open the UI test site](https://virtual-ink-ui-test-e9cmiq0kd-shadowrootsec-5679.vercel.app)
with your Shadow Root Vercel account. A Vercel URL is sufficient for this test;
the user will consider buying a custom domain later. No DNS/domain purchase or
custom-domain change was performed.

- Team: `shadowrootsec-5679` / `team_5ugoBjme9LVSgJ33oRN7Nezs`.
- Project: `virtual-ink-ui-test` / `prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`.
- Ready deployment: `dpl_DJwWWQToGXWvwx1zCtQVmh1agBmn`.
- Deployed source: `ad55dfba993446c3089e3783e743cb170c1bd6e5`.
- Actual Vercel target: **production**. Actual application profile: **ui_test**.
- Source branch: `codex/ui-test-hosting`; local review commits, no Git push.
- Upload: 406 reviewed files from a committed snapshot. The reviewed UI config
  was copied to the web root inside that snapshot; user working files were excluded.

The new project uses `apps/web`, Node 24.x, existing outside-root imports and the
standard Next.js build. It has no Git connection or inherited integration variables.
Deployment protection remains `all_except_custom_domains`. Sixteen plain records
contain only profile/project identity and disabled-service flags, scoped to this
project's Production and Preview targets. No application credential is configured.
No deployment was promoted to a custom domain or to the existing live alias.

## Implementation and verification

The new `ui_test` environment is bound to this exact project and rejects Auth,
database, migration/provisioning, storage and internal-service bindings, protected
production identifiers and external transaction credentials. Login, admin writes,
server uploads, jobs, email, payments, delivery integrations and other external
services must remain disabled. Existing staging checks are retained. Every page
discloses the UI-test boundary and analytics is omitted. No dependency changed.

The first attempt, `dpl_5Vn16AkqspiiW4p1WFsfBg8bNyrZ`, failed closed with
`PUBLIC_SECRET_FORBIDDEN`. A credential-name check also matched the AUTHOR
substring in public Git metadata; it now matches complete name segments and has
a regression case. The first build also detected the repository root backend.
The new project's root was restricted to `apps/web`, with the reviewed profile
installed at that root in the upload snapshot. The subsequent build passes the
UI-test guard, lint, Next compilation/types and all twenty-two static pages.
Remote install audits report zero vulnerabilities. npm's cache-dir warning is
documented; no build warning was represented as successful business integration.

Local checks pass: **216 root tests**, **197 security tests**, **31 web checks**,
**16 SDK/Next adapter checks**, lint, web/backend types and optimized build. All
**43 executable backend/shared files** are measured, with none omitted:
lines **2458/2477 (99.2329%)**, branches **1877/1944 (96.5535%)**, functions
**236/239 (98.7448%)**. Frontend/browser, SQL, server lifecycle and genuine hosted
integrations are separate scopes; the percentages do not establish product completion.
After the metadata fix, the affected root coverage/lint checks were rerun; the
final remote build also runs the unchanged lint/type gates.

Browser verification used the existing signed-in **Shadow** profile:

- Homepage renders the supplied branding, animated scene, navigation and explicit
  disabled-service banner. Desktop available width and scroll width both measure
  1521px. This is a sampled UI result, not full accessibility/performance acceptance.
- The studio loads an actual original garment GLB and labelled draft controls.
  The shirt is visibly constructed with neck, sleeves and body. It remains an
  unverified model study; no supplier/production approval is inferred.
- At requested 320px width, available width and scroll width both measure 305px
  on studio and login. The studio canvas measures about 273.2 by 390px. No
  horizontal overflow was observed in those samples.
- Hosted login displays the unavailable notice with disabled email/password
  fields. A forged `role=SUPER_ADMIN` query to the brand lab redirects to `/login`;
  no lab controls render. Full authenticated role workflows are not enabled.
- The studio's sampled error-level browser log is empty. Browser-tool telemetry
  errors were separate from the application; no general clean-console claim is
  made for unbuilt workflows. A health navigation was blocked by the browser tool
  and is not counted as backend/health verification.

An owner-side CLI curl returned a Vercel SSO redirect, not application HTML.
Its HTTP success exit code was not counted as a page pass. No protection was
disabled or bypass secret published; browser checks used normal existing Vercel
sign-in. Local client-artifact scanning passes across **63 files**, no scanned
secret patterns; full deployed-bundle scanning is pending. Repository security
heuristics pass over **420 files** before this handover's documentation additions.

## Security boundary and unchanged environments

The user approved only protected UI testing under Vercel's Production label.
The original live deployment is still `dpl_7f4Kj1XeRy1Mf3MrQiSV9PEs7PWB`, source
`a6736376b09ba7c3242495ff86b4bb2eea62f20c`. The separate acceptance project still
has its 25 Preview-only records, protection and the previous failed deployment.
No live/staging database, Auth user, role, storage object, secret, payment or DNS
setting changed. The test project has no backend service or database binding.
Backend availability and genuine account/MFA/order acceptance are not claimed.

Attacker paths tested include wrong project/target, attempted service enablement,
provider/database/internal bindings, encoded production references, external and
public credential names, forged admin query and anonymous protection. Local
denials, normal authenticated browser reads and sanitized provider metadata are
scoped evidence, not a pentest of Vercel, the OS or the complete application.
An initial header diagnostic included an unauthenticated SSO nonce; it was not
copied to reports/Git or used to gain access. Future header evidence must allowlist
fields and omit cookies, nonce URLs and authorization data.

[Vercel documents first-deployment Production behavior](https://vercel.com/docs/cli/deploy).
The existing [Node HIGH release advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still blocks sensitive release/enablement. This protected, disabled-service UI
test does not clear that gate, approve business use or waive private-file and MFA
requirements. The full mandatory studio, supplier verification, orders/proofs,
server pricing, payments and operational dashboards remain incomplete.

## Phase hosting gates

| Gate | Actual result for this handover |
| --- | --- |
| VH-01 | Pass for separate CLI-connected UI test project; no Git connection |
| VH-02 | Ready under approved UI-only Production label; full platform release pending |
| VH-03 | Blocked: isolated full-service Preview acceptance still absent |
| VH-04 | Partial: sixteen UI-only entries checked; genuine app environments pending |
| VH-05 | Partial: local bundle/source scans pass; full hosted asset scan pending |
| VH-06 | Blocked: no database access in UI test |
| VH-07 | Blocked: server uploads/storage unavailable |
| VH-08 | Blocked: application login/MFA intentionally disabled |
| VH-09 | Blocked: operational role dashboards unbuilt/unaccepted |
| VH-10 | Partial: web pages work; backend service absent |
| VH-11 | Partial: protection/login/lab denial sampled; complete role isolation pending |
| VH-12 | Partial: homepage/studio/login and garment asset observed; full route suite pending |
| VH-13 | Partial: desktop/mobile samples; full device/accessibility acceptance pending |
| VH-14 | Partial: sampled studio log; full-role console checks pending |
| VH-15 | Pass for final UI build; earlier failure and npm warning documented |
| VH-16 | Prepared/deferred: user will buy a domain later; Vercel URL works |
| VH-17 | Pass: actual tested deployment URL and source recorded above |

## Handover and rollback

[UI test setup and update instructions](../vercel-ui-test.md). Keep protection
enabled and test using the Shadow Root Vercel account. No public bypass URL is
shared. Saved designs are device-local, not private cloud files or production proofs.
Do not use real customer files. No Lighthouse, screen-reader, real zoom, device
battery or all-eighteen studio acceptance result is invented.

Rollback is confined to this test project: redeploy the last verified UI-only
source and profile to a new protected URL. Do not route to the failed first
deployment, modify the original live alias, reset user work or force-push. No DB
rollback is applicable. No product phase is complete, so the standing after-phase
push/acceptance gate is not marked satisfied.

- **Uchi:** review the site through Shadow Root, collect actual UI feedback and
  coordinate the remaining runtime/compatible MFA/Preview gates before release.
- **Mumba:** review isolation and continue genuine private-file/order/proof APIs;
  do not enable them on this credential-free UI test project.
- **Taizya:** review brand/mobile/keyboard and model fidelity; complete actual
  screen-reader, zoom, touch and reduced-motion acceptance.
- **Lubasi:** supply approved product/supplier/licence/pricing and operating-policy
  evidence before enabling commerce or making production promises.

Final source/security heuristics pass across 422 scanned files after the
documentation additions. The homepage also has 305px available/scroll width in
the requested phone viewport. Temporary viewport changes were reset and the
hosted site left open in the Shadow browser profile.

Matching Word generation passes its structural/table audit. Visual rendering was
attempted but LibreOffice is unavailable (WinError 2); Word page appearance is
not visually verified. Checks pass for eight Markdown files, 234 local links,
the seventeen-gate Word table and OOXML/package/privacy integrity. No source
push, full phase closure or human product signoff is claimed.
