# Virtual Ink — precise studio measurements

Date: 20 October 2026. Phase 1 is **INCOMPLETE**, release **NO-GO**.
This is one local design-studio build slice with a protected UI-only Preview.
Supplier accuracy, authenticated files/orders, physical devices and full-service
acceptance remain open. No human signoff is claimed.

## Delivered behavior

Selected artwork now has numeric horizontal/vertical centre, width, height and
rotation fields alongside the existing sliders. Values accept decimals; positions
and unrotated dimensions use mm, rotation uses degrees. Explicit labels, units,
range hints and linked help describe what will change. Apply measurements submits
all five values as one undoable edit. Reset entries restores the current design's
values without changing the artwork. Enter submits the native form.

Typing stays in the form until Apply. Empty, non-finite and out-of-range input
preserves the design and history. Native required/min/max checks focus invalid
fields on submit; the handler separately validates before applying anything.
Whole rotated bounds still pass through the existing safe-area fit. Displayed
fields refresh to the fitted result when geometry, selection or history changes.
No-op edits create no extra undo entry or cancellation. A genuine measurement
change invalidates a pending layout reference/draft preparation through the
existing generation guard.

Review found that fitting a very thin layer could reduce a dimension below the
existing 0.1 mm saved-draft minimum. Such an edit is now rejected before commit,
with an actionable message. This prevents creating that invalid local state;
it does not establish supplier-approved print dimensions. Existing typography,
artwork payloads, model assets and backend service boundaries are preserved.
No dependency or lockfile changes are made.

Reviewed source: `f244056c04764b8fa64ade456ff203a64241728a` on
codex/hosted-studio-acceptance; three source/test files. Seven initial feature
checks failed while the form was absent. All eight new checks now pass, including
the later minimum-size guard. They execute actual handlers with controlled React
hooks/form objects; they are separate from native browser checks below.

## Verification

| Executed scope | Result | Limit |
| --- | --- | --- |
| Complete web suite | 73 passed; zero failed/skipped | Eight new measurement checks; no measured frontend coverage claim |
| Root suite and coverage | 218 passed; all 43/43 files measured | Backend/shared unit scope only |
| Security regressions | 197 passed; zero failed/skipped | Local application scope |
| Auth SDK/Next contracts | 16 passed; zero failed/skipped | Controlled responses, no genuine hosted Auth enablement |
| Web/shared types, source lint, production build | Pass | Isolated local environment; sensitive services disabled |
| Root and web npm advisories | Zero reported vulnerabilities | Runtime HIGH gate remains separate |
| Runtime baseline | Node 24.21.0 passes existing minimum | Available newer LTS and scheduled security release require follow-up |
| Scoped source-security heuristic | Pass; 439 scanned, 119 skipped; no findings | Bounded text heuristic, not a complete secret/dataflow audit |
| Loopback guest boundaries/assets | Four HTTP checks; 64 byte matches | 39 public assets and 25 fonts |
| Native local Chrome checks | Decimal Apply/Enter, invalid limits/required, reset, undo/redo pass | Sampled synthetic artwork; not full accessibility/device acceptance |
| Narrow viewport check | Requested 320px; root client/scroll widths both 305px; all five fields fit | Scrollbar accounts for width; emulation is not physical-device acceptance |
| Exact-source protected Preview | READY; install/isolation/lint/compiler/build pass | Hosted measurement interactions remain pending |

Exact backend/shared coverage: **2473/2492 lines (99.24%)**,
**1883/1950 branches (96.56%)**, **239/242 functions (98.76%)**.
All 43 inventoried files are measured. Frontend/browser flows, SQL, genuine hosted
integrations and src/server.js lifecycle remain outside this denominator. New
handler checks do not prove 95% frontend or whole-product coverage. Existing
typeless-package and CommonJS Three test-loader warnings remain.

The loopback homepage/studio return 200; guest brand-lab redirects to login (307),
and identity API denies unauthenticated access (401). All public/font byte hashes
match the production build. A bounded local client-artifact heuristic checks
68 JS/CSS files, 1,874,683 bytes, with no findings; this is not hosted-bundle or
complete dataflow verification. The task-owned loopback server was stopped after
checking its PID/start time/path; the pre-existing generated-type edit is preserved.

## Native browser and hosting evidence

Local Chrome applied x=110.25, y=150.75, width=88.5, height=29.5 and rotation=-12.5
to synthetic text. Undo returned width/rotation to 140/0 and redo restored
88.5/-12.5. Enter applied width 92.25; resetting an unsubmitted 101.3 restored
92.25. Width 0 was natively range-invalid and blocked; genuine keyboard clearing
produced a required-field failure without altering committed slider values.
The automation fill-empty helper did not clear the field; Control+A/Backspace
did, so no success is inferred from that helper attempt. Native display localized
the decimal separator while DOM values and stored geometry remained numeric.
The form was visually inspected at the ordinary desktop viewport. The requested
320px viewport kept all five fields inside the content width; it was reset after
the check. In-app browser discovery exposed only Chrome profiles, so existing
Chrome controlled this loopback check. The review tab was closed; no device draft,
download, real artwork or customer content was created.

The [protected UI-only Preview](https://virtual-ink-ui-test-9q6c3g2gm-shadowrootsec-5679.vercel.app)
is READY, deployment `dpl_2KERHs2cuxBMRupxNh99djXT1nwg`, at source f244056.
Metadata at 2026-10-20T10:32:38Z confirms environment preview, raw target null,
buildSkipped false, zero aliases/automatic aliases, 423 reviewed source files and
ui_test without an automation-bypass binding. Fresh build logs show locked
installation, environment isolation, source lint, successful compilation and
Build Completed. Preflight preserves the sixteen reviewed disabled configuration
records, no Git/integration inheritance, deployment protection and zero bypass
tokens. Private files, environments, generated output, Word reports and unrelated
attachments are excluded from the committed-source upload. No guard is weakened,
credential generated or production target/bootstrap used. Original Production
and full-service acceptance resources remain unchanged.

These are local interaction checks plus exact-source hosted build evidence.
Hosted native measurement interactions, full keyboard/screen-reader coverage,
real touch/physical devices and secure-service journeys remain pending. A Ready
build does not establish those checks or Phase 1 completion.

## Scoped security review and guidance

The changed surface is a local editor form, not a network endpoint or authority
record. A malformed measurement requires local entry or controlled handler input;
its demonstrated impact is rejection with the existing design/history preserved.
Bounds and finiteness are checked before fitting; the post-fit minimum guard
prevents the thin-layer invalid-state path. Changed references are cancelled;
invalid/no-op submissions preserve in-flight work. No cross-user/tenant/file
access, pricing authority or remote exploit is introduced or demonstrated.
Client validation remains a usability boundary; genuine server file/order
validation, quarantine/scanning, private storage and audited proofs stay unbuilt.

Modern Web Guidance search/retrieve supplied forms and validate-input-after-interaction.
The forms guide shaped explicit labels/linked help, native constraints and submit
semantics, decimal keyboard hints, 16px number inputs and 48px input targets.
Validation occurs at Apply rather than each keystroke; no user-invalid CSS or
polyfill was added. The installed skill-version check reported a newer skill;
the local skill file was preserved. [React input documentation](https://react.dev/reference/react-dom/components/input)
and the [HTML number-input standard](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number))
were reviewed. No form action sends measurements to a service; its handler
prevents navigation and updates the local design only.

The [Node security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes for 24.x on or shortly after 21 October. The
[24.22.0 LTS release](https://nodejs.org/en/blog/release/v24.22.0) is available
dated 14 October; the local reviewed runtime remains 24.21.0. Its compatibility
and the forthcoming security fixes need a separate reviewed runtime update;
the baseline pass and npm audits do not clear this release gate. This is a scoped
application/tool-action review, not a provider/workstation/production pentest.

## Team actions and rollback

- Uchi: review this Preview and local evidence, retain NO-GO, and coordinate
  physical-device/service acceptance and explicit release decisions.
- Mumba: review the numeric/safe-fit/cancellation denials; prioritize the runtime
  update and compatible isolated Auth/MFA/private-service acceptance.
- Taizya: verify native measurements, Enter/reset/undo, decimal locale and
  screen-reader/touch behavior on the exact Preview and required physical devices.
- Lubasi: provide supplier-approved zones/measurements/licence/stock/pricing and
  device/tester availability. Decimal precision does not certify a study's accuracy.

Rollback only the three reviewed source/test files in a follow-up commit and
rebuild the same protected UI-only Preview; preserve supplied assets and unrelated
user work. This is not a production rollback rehearsal. Source is committed as
f244056; the Markdown/Word handover is committed separately. No Git push or human
signoff is performed, and no phase is marked complete.
The Word copy uses the existing compact_reference_guide/memo_masthead preset.
Structural/table-geometry, package/XML/numbering/privacy and all affected local
Markdown links pass. All 27 integration classifications and fourteen unchecked
release-decision items remain intact. Rendering reached conversion but failed
because LibreOffice/soffice is missing (WinError 2); no Word page images or visual
layout verification are available. The native application form screenshot was
inspected separately and is not Word rendering evidence.
