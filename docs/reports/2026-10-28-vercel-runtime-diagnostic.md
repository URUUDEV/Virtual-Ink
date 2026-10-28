# Vercel request runtime mismatch confirmed

28 October 2026. Virtual Ink / Shadow Root Security Technologies.

**The protected Preview builds successfully, but its request runtime is Node
24.21.0, below the reviewed 24.22.1 baseline. Dynamic-route acceptance remains
FAILED. Phase 1 remains INCOMPLETE / NO-GO.** The diagnostic is implemented and
hosted; the provider runtime mismatch is not fixed or bypassed.

## Delivered diagnostic

The previous vendor-setup handover identified RUNTIME_SECURITY_PATCH_REQUIRED
without an actual request version. IsolationError now attaches a frozen object
containing only actualNode, minimumNode and advisoryOpen for that exact error.
Native process facts and the reviewed policy supply these fields. The generic
message, rejection order, allowed runtime range and isolation rules are unchanged.
No environment override or diagnostic HTTP endpoint is added.

Two new test groups verify the diagnostic and child-process rejection of old
patches, a prerelease and another major. Synthetic credential canaries stay out
of error output. A separate controlled API probe confirms generic HTTP 500 /
INTERNAL_ERROR without diagnostic fields. Private startup logs can show the native
version; the shared API boundary does not expose it. [Runbook](../vercel-runtime-verification.md).

## Exact deployment and observed failure

Implementation commit: 29148d5f74795968a7a18d748cb364b9d5a40246 on
feature/phase1-staging-readiness.

Protected diagnostic Preview:
https://virtual-ink-ui-test-5g768sngo-shadowrootsec-5679.vercel.app

Deployment: dpl_CrvyaEWSpQgM9B5y6mvjP3k7t9US, isolated project
prj_aqLrX1gsSVb1XINH5YNGkp1aYazH. Metadata confirms the exact source, actual
Preview classification, ui_test profile, READY state and a fresh build. Logs
establish locked install, isolation, lint, Next.js 16.4.2 compilation and build
completion. No automation-bypass binding is present.

Preflight verifies Node 24.x selection, deployment protection, no Git/integration
inheritance and the exact sixteen plain disabled-service settings. The inspected
upload contains 511 files and excludes private/environment/tool/Git data, Word
reports and unreviewed attachments. No original production setting/alias,
acceptance project, Auth user, database, storage, commercial service or DNS changes.

Normal authenticated Shadow Root Chrome requests and read-only logs establish:

| Request surface | Actual result | Native diagnostic |
| --- | --- | --- |
| /vendor/setup, serverless middleware | HTTP 500; runtime gate rejects startup | actualNode 24.21.0; minimumNode 24.22.1 |
| /shop, regular serverless page | HTTP 500; runtime gate rejects startup | actualNode 24.21.0; minimumNode 24.22.1 |

The browser cannot display the vendor page and reports ERR_BLOCKED_BY_CLIENT;
Vercel independently confirms the HTTP 500 and native version. The shop shows a
generic failure page without runtime fields. A static 204 entry in the bounded
three-record sample is not counted as homepage acceptance. The verification tab
is closed; existing user tabs are preserved. No application account, real customer
data or protection bypass is used.

Vercel supports major-version selection and controls minor/patch rollout. An exact
patch pin is not a documented project option. Its selected 24.x setting and a
successful build do not correct the proven request mismatch. A compatible stable
Node 24.22.1-or-later 24.x request runtime is required before retesting. No other
runtime family, bundled executable, lowered baseline or notice override is introduced.
[Provider documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Actual verification and coverage

Fresh locked root and isolated root/web installs pass. Final source lint, strict
web/shared TypeScript and isolated production build pass. The built application
source matches the implementation commit. A later fixture-label correction changes
only test text; the corrected test is copied into the private candidate and both
reviewed file hashes are compared after retesting.

All 265 root tests, 241 security checks, 91 web checks and 16 synthetic Auth/Next
transport contracts pass with zero failures/skips in their final runs. The 21
focused checks and separate API redaction probe also pass. These suites overlap;
their counts are not an additive unique-test total. No SQL, genuine hosted Auth/
MFA/database/storage-worker, physical-device or human acceptance is claimed.

All 53/53 backend/shared inventory files are measured without omissions: lines
3,154/3,175 (99.34%), branches 2,382/2,455 (97.03%), functions 310/317 (97.79%).
These aggregate metrics exceed 95%; individual files may be lower. Frontend/browser
journeys, process lifecycle, SQL and genuine hosted integrations are outside this
unit denominator. Fresh root/web audits report zero known advisories across
169/125 dependency entries. Local testing uses Node 24.22.1; Next.js remains
16.4.2 and no dependency is added. The official
[Node October fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
were rechecked. Audit success does not override the hosted runtime failure.

## Retained failures and scoped security review

The initial focused run passes 19/20 checks; the sandbox cannot start the existing
child-process denial test. Its authorized rerun, with both new groups present,
passes 21/21. Windows PowerShell then stops the full runner on a harmless Node
module-type warning before coverage completion. PowerShell 7 completes it without
relaxing application assertions.

The repository scanner flags the new synthetic credential-shaped canary because
its spelling lacks a fixture label. The value is corrected to include synthetic;
scanner rules remain unchanged. Final lint, full unit coverage, security subset,
repository scanner and runtime checks pass after that correction.

The first Preview attempt rejects the Production-only --skip-domain CLI option.
Readback confirms zero matching exact-source deployments before retrying with
explicit Preview. The retry succeeds. An earlier standalone metadata read fails
with fetch failed; subsequent preflight and deployment readback supply verification.

Any visitor can encounter the availability failure. No authorization bypass or
private-data exposure is demonstrated: startup stops before protected service work.
The old request runtime fails the reviewed security baseline; exploitability of
individual upstream issues is not tested or invented. The guard correctly blocks
it. Sensitive enablement and release remain rejected. This scoped application
review is not a provider, OS or workstation pentest.

Diagnostics contain no request/configuration values. Page/tool output remains
untrusted. No credential transfer, destructive probe, privilege expansion, live
funds or simulated approval is used. Unrelated generated next-env changes, local
skills, screenshots and supplied attachments are preserved.

## Team next actions and delivery

- Uchi: retain NO-GO and coordinate a supported Vercel runtime patch resolution.
  No provider contact, paid upgrade or human signoff is implied by this report.
- Mumba with Uchi: verify stable Node 24.22.1-or-later 24.x request execution on
  the isolated target, then retest vendor redirect/login and shop behavior with
  all guards and disabled-service settings intact.
- Taizya: resume hosted checklist and real-device/accessibility journeys after
  request execution passes; local rendering and READY builds do not close them.
- Lubasi: continue private Hotprints capability, handoff, receipt/commission and
  retention review. A prepared profile does not establish an active vendor.

The Word copy uses scripts/generate_team_report.py with compact_reference_guide
and memo_masthead conventions. Package/XML, required evidence, Letter geometry,
one-inch margins, real headings/lists and table geometry pass. All 433 local links
across eight affected Markdown files resolve. The final repository heuristic
passes with 522 files scanned, 145 excluded and zero findings; whitespace checks
pass. These heuristic counts are separate from the 53-file unit denominator.

The authorized renderer reaches conversion and fails with WinError 2 because
LibreOffice/soffice is absent from PATH and the standard installation location.
No page images or visual Word acceptance are claimed. Render and inspect the
document with LibreOffice before external circulation. No document lock file is
removed. The report and runbook are reviewed explicitly on the existing review
branch; source/handover commit and push receipts accompany delivery. No main
merge or public promotion occurs. This diagnostic slice does not close Phase 1
or its hosting/service acceptance.
