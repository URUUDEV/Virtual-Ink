# Vendor foundation review — Team report

Date: 14 October 2026

Prepared for Uchi Chinyama, Mumba Chitonge, Taizya Nakapende and Lubasi Monde.
Delivered for review; no human signoff or production readiness is claimed.

## Changes and result

Reviewed the unfinished vendor backend foundation newer than the local-workspace
handover. Portable schema/lifecycle commands now have isolated database replay
evidence. The provider bridge remains an unverified draft. Hosted migration,
HTTP intake and real activation remain pending.

Fixed explicit empty pagination selectors being admitted by TypeScript despite
SQL rejection. Added a reproducing regression and all five vendor tests to the
recurring security suite. Updated scope/setup, latest report, board and decisions.
Existing user work, supplied assets and historical reports are preserved.

## Actual verification

Checks ran during the resumed session, with this handover dated 14 October.
Application checks used reviewed private Node 24.21.0.

| Check | Actual result |
| --- | --- |
| Empty-selector regression | Failed before fix; five vendor tests pass afterward |
| Application / security suites | 132 / 121 passed; zero failed |
| React/3D source checks | 9 passed; zero failed |
| Web/shared and strict backend/shared TypeScript | Passed |
| Runtime gate / repository security heuristics | Passed |
| Existing production preview HTTP | 53 loopback assertions passed |
| Production dependency audit | Zero reported vulnerabilities |
| Portable SQL replay | Eight Phase 2 migrations, vendor core and commands passed on PostgreSQL 18 |
| SQL lifecycle/RLS fixture | Passed and rolled back; application/storefront counts both zero |

The isolated database used generated private credentials, SCRAM and loopback;
it stopped after verification. Initial replay failed on an empty psql service-file
setting; clearing that test-process setting fixed the runner. No production build
was rerun: the backend validator remains disconnected from HTTP and the existing
preview was not rebuilt or restarted.

## Scoped security evidence

VON-VALIDATION-01, low severity: a future caller controlling query parameters
could pass explicit empty cursor/status through TypeScript validation. A regression
reproduced missing rejection. SQL still rejects those values; no widened access
or authorization bypass was reproduced. Explicit presence now invokes validation.
Mumba owns adapter validation/error mapping verification before wiring.

Synthetic SQL asserts other-owner and reviewer/MFA denial, version/idempotency
conflicts, public contact exclusion, forbidden storefront-column changes and denied
audit deletion. Approval/owner activation is a rolled-back test transition, never
a human approval record. Provider sessions, expiry, failure injection, concurrency
and definer privileges remain unverified. A compromised trusted adapter forging
SQL context remains a conditional threat.

Tool actions used synthetic fixtures and loopback, with no real vendor/customer
data or hosted writes. Private credentials stayed out of arguments/reports.
Only the new cluster was started/stopped; existing databases and environments
were preserved. This is a scoped application review, not a whole-system pentest.

## Limits and actions by lead

In-app Browser was unavailable. Chrome inspection failed, its verification tab
became unavailable and tab listing timed out. Native file-open and fresh visual/
accessibility acceptance remain unverified. Documented browser finalization was
requested. PostgreSQL 17, genuine Supabase Auth and provider bridge remain open.
Hosted readiness still requires nine tables. HTTP intake, reviewer setup,
notifications and live activation stay disabled. Default runtime patching and
framework release review remain open.

- Uchi: review lifecycle/intake criteria, reviewers and consent/retention in VL-03/VL-05.
- Mumba: verify provider sessions/MFA and add expiry, audit-failure and concurrency
  probes before migration or HTTP wiring.
- Taizya: specify persistent draft/submission/review/error states; complete native
  file-open, visual and assistive-technology review.
- Lubasi: confirm fields, private evidence ownership, reviewer responsibility,
  duplicate handling and retention.

## Document and source review

Word uses the established compact-reference-guide preset and memo masthead.
Package/XML, geometry, content/privacy and 143 local links passed checks.
Repository security heuristics and Git whitespace checks also pass. Rendering
failed because LibreOffice/soffice is unavailable; Word pagination and visual QA
remain unverified. Word lock files and historical reports are preserved.

Consulted official [Node release](https://nodejs.org/en/blog/release/v24.21.0),
[Next.js advisories](https://github.com/vercel/next.js/security/advisories),
[Supabase changelog](https://supabase.com/changelog) and
[RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
Next cache-advisory patch text remains unresolved; zero npm findings do not close
SEC-04. Supabase legacy TLS cipher deprecation needs compatibility review before
genuine setup. See [foundation scope](../vendor-onboarding-foundation.md) and
[open decisions](../open-questions.md).
