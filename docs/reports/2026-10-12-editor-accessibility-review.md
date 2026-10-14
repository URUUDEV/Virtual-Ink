# Virtual Ink - Editor Accessibility Review

Date: 12 October 2026

Company: Shadow Root Security Technologies

Scope: Local T-shirt editor accessibility fixes, browser checks and scoped security review.

Status: Engineering review delivered. Artwork browser checks and human acceptance remain pending.

## Changes and findings

Continued the editor acceptance work from the earlier workspace report. Existing
uncommitted work, supplied assets, historical reports and the main preview's saved
draft were preserved. No commit, push, deployment or hosted mutation occurred.

The preview instruction used normal-sized text with measured contrast of 4.36:1
against its background. This falls below the W3C 4.5:1 minimum for normal text.
Darkening its colour from #6e7269 to #596052 raises the measured ratio to 5.79:1.
The rebuilt browser confirms the new computed colour. This is one reproduced
legibility defect and fix, not a complete contrast or accessibility certification.

Text and artwork inputs now have explicit label associations and linked help
descriptions. The live browser resolves both help references. The design status
region has the accessible name Design status. Screen-reader announcements still
require assistive-technology verification; DOM attributes alone do not prove them.

No dependency, backend authorization, database schema or storage provider changed.
The editor remains a local front-only concept tool. Server uploads, checkout,
payments, courier integration and printer automation remain closed.

## Actual verification

| Check | Actual result |
| --- | --- |
| Root backend/catalogue/editor suite | 120 passed, zero failures |
| Source React rendering suite | 6 passed, zero failures |
| Security regression subset | 109 passed, zero failures |
| Runtime gate and repository heuristics | Passed on reviewed private Node 24.21.0 |
| Web/shared TypeScript and production build | Passed after these source changes |
| Frontend dependency audit | Zero reported vulnerabilities |
| Rebuilt loopback HTTP harness | 49 assertions passed |
| Preview instruction contrast | 4.36:1 before; 5.79:1 after |
| Responsive geometry | No horizontal overflow at 1440/1024/768/390/320 pixels |
| Input descriptions and status name | Linked help text and named status confirmed in rebuilt DOM |
| Four-line text rejection | Safe alert shown; previous three-line design preserved |

A sampled keyboard pass moved through 15 enabled editor controls with visible
focus, including typeface, colour, file selection, shirt buttons, canvas, layer,
placement, download and save controls. The rebuilt text input also shows a visible
focus outline. This is sampled evidence, not full focus-order acceptance. Desktop
and mobile editor screenshots were inspected. Mobile visual ordering and complete
keyboard/screen-reader behavior remain for Taizya's review.

Source inspection confirms the existing reduced-motion rule disables transitions
and animation. Preference emulation was unavailable, so the live preference test
remains open. An attempted Chrome zoom shortcut produced no measurable change;
it does not count as a 200% zoom test. Narrow viewport reflow is separate evidence.

## Security review and tool boundaries

The changed surface is local React markup and CSS. No new authority or network
write path is introduced. An attacker would still need selected malicious artwork,
forged local draft data, a same-origin script compromise or an applicable runtime/
framework flaw to reach the editor's existing trust boundaries. No takeover,
decoder exploit or new security bypass was reproduced during this step.

Existing admission/draft negative tests, protected-API denials and file-write
denials pass in the suites and loopback harness. Browser rejection of a fourth
text line retains the current design. The prior WebP-header and shirt-type fixes
remain covered by the passing regressions. These checks do not establish real
image-decoder safety or private account storage. Device drafts remain explicit,
same-origin browser storage; no real customer file was used.

Official Node security listings and the Next maintainer cache advisory were
reviewed. The advisory's root catch-all page condition is absent from this source;
its patched-version text remains unresolved. Zero audit findings do not close
release assurance. Default Node 24.14.1 still fails the reviewed runtime minimum;
the private 24.21.0 executable passed. Genuine Auth/pg/TLS, owned-PostgreSQL replay,
revocation, edge abuse controls and bundle/history review retain their gates.

Tool output and page content were treated as data. Application probes used
synthetic inputs and loopback only. Required execution approvals were used and
preview process ownership was checked before stopping/restarting servers. No
credentials, customer files, private vendor evidence or Word lock files were
read, printed or removed. No external message or extension setting change was
performed. Native Windows automation was unavailable, so it supplied no evidence.

## Blocked checks and open decisions

Chrome's synthetic file chooser returned Not allowed because extension file-URL
access is disabled. The user was given the extension setup instruction; successful
PNG/JPEG/WebP import, replacement/removal, artwork history/draft round-trip and live
disguised/truncated/animated/oversized file denials remain unverified. Native
picker automation also failed because its Windows helper pipe was unavailable.
Neither limitation was bypassed. Contract tests do not substitute for browser
decoding. Chrome's accessibility snapshot helper was also unavailable; supported
DOM, locator, focus, geometry and screenshot checks supplied the sampled evidence.

Screen-reader output, actual 200% zoom, full contrast/focus review, reduced-motion
emulation, cross-browser behavior, denied/full storage, malformed saved-draft UI
and interrupted import checks remain open. UX-02 still requires Taizya/Uchi
acceptance and Lubasi's verified garment/print/proof constraints. FILE-01/02 and
private storage/audit/authorization contracts precede any server upload work.

## Next action by lead

- Uchi: Review the editor and evidence with Taizya, record acceptance or requested changes under UX-02, and retain the server-upload gates.
- Mumba: Finish synthetic browser import/draft/error checks once Chrome file access is enabled; retain runtime, advisory and genuine backend setup gates.
- Taizya: Verify screen-reader output, mobile focus order, 200% zoom, reduced motion and full contrast; review the linked help and safe error states.
- Lubasi: Supply verified garment colours/sizes, print-area limits, artwork rights and proof requirements before production promises.

## Handover and document checks

Updated the latest team report, workspace checklist, task board, build plan,
validation, UI, security and open-decision records. The earlier 12 October
workspace report remains historical evidence. The next action is to finish the
blocked artwork checks and assistive-technology review before further editor scope.
No human signoff or production readiness is claimed.

The matching Word report uses the existing compact_reference_guide preset and
memo_masthead pattern through scripts/generate_team_report.py. OOXML package,
named styles, page/table geometry and content/privacy checks pass; all 107 checked
local handover links resolve. LibreOffice remains unavailable; Word page rendering
and visual QA cannot be completed. No page count or visual-layout approval is claimed.

## Official references reviewed

W3C contrast minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

W3C reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

W3C resize text: https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html

Node security listings: https://nodejs.org/en/blog/vulnerability

Next cache advisory: https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p
