# Virtual Ink — UI Build Verification Report

Date: 11 October 2026

Company: Shadow Root Security Technologies

Scope: Reviewed local runtime, public production build, HTTP and browser verification.

Status: Delivered for review. Human acceptance and production readiness remain pending.

## Changes and reproduced defects

Existing uncommitted backend/UI work, approved logo, supplied HTML, PDFs and product
images were preserved. No commit, push, deployment or hosted mutation occurred.

- Constrained the showcase image to its grid stage in globals.css. A 300px stage
  previously contained a 323px image; desktop imagery covered its caption. After
  the fix, measured image/stage heights agree at all five breakpoints.
- Restricted product details to six fixture slugs using generateStaticParams and
  dynamicParams=false. An unknown synthetic product previously returned HTTP 200
  with the missing-product view; the rebuilt server returns HTTP 404.
- Added scripts/web-http-checks.mjs and npm run check:web:http: fixed loopback
  targets, synthetic inputs, deadlines, no bearer tokens and secret-free results.
- Downloaded official portable Node 24.21.0 into ignored private tooling, verified
  the archive against its official SHA-256 entry and reran checks/build there.
  The workstation default remains Node 24.14.1 and still fails the runtime gate.
- Updated handover, setup, validation, task-board and open-security-question records.

Production builds succeed with approved execution outside the sandbox; previous
spawn EPERM results are historical. Multiple-lockfile and absent optional pg
warnings remain. Genuine database/Auth/pg/TLS setup is a separate gate. No ordering,
payments, uploads or genuine onboarding was enabled.

## Actual verification

| Check | Result |
| --- | --- |
| Backend/catalogue suite on Node 24.21.0 | 111 passed, zero failures |
| Source React rendering suite | 5 passed, zero failures |
| Security regression subset | 100 passed, zero failures |
| Web/shared TypeScript and production build | Passed on Node 24.21.0 |
| Runtime patch gate | Private 24.21.0 passes; default 24.14.1 fails |
| Repository security heuristics | No findings; exclusions still apply |
| Frontend npm audit | Zero reported findings; dependencies unchanged |
| Reviewed-runtime loopback HTTP smoke | 45 assertions passed |
| Browser DOM layout measurements | 15 route/width combinations; no horizontal overflow |
| Git whitespace and current handover links | Passed |

HTTP evidence covers twelve public routes, frame/type/privacy headers, demo labels,
unknown-product 404, script-like group fallback, three guest API denials with
no-store, membership write denial, unknown API 404, supplied image optimization
and external-image rejection. The smoke harness was corrected to tolerate React
streaming comment separators, then rerun successfully.

Chrome covered homepage, shop and T-shirt detail at requested widths 1440, 1024,
768, 390 and 320. Scrollbars reduce content width by 15px where present. Desktop
homepage/shop and mobile detail screenshots were inspected. Live controls passed:
carousel advance, polo search, Print empty state, clear filters, descending demo
price sort, category/history navigation and mobile Escape/menu-focus return.
The sampled browser error log was empty.

In-app Browser was unavailable; Chrome's accessibility-snapshot helper failed.
Documented visible-DOM, locator, geometry and screenshot alternatives were used.
Some responsive captures had sizing artifacts. Screen-reader output, 200% zoom,
reduced-motion emulation, complete keyboard coverage, contrast and cross-browser
visual acceptance remain pending. Engineering probes are not human UX signoff.

## Security evidence and limits

The route-status issue is low severity: an anonymous requester could receive a
success status for a nonexistent product, confusing clients/crawlers. It exposed
no private data and demonstrated no code execution. The build allowlist fixes
the reproduced status; live regression passes. Image overlap was a usability flaw.

Script-like group input does not create injected script elements in the tested
response. Guests and membership writes remain denied; external image requests
return 400 without an external-target probe. Demo prices have no financial write
path. Existing synthetic tenant, audit-failure and file-denial tests remain green.

Official Node June/July notices were rechecked. The private runtime meets the
reviewed baseline without patching the default installation or deployments. The
Next maintainer cache advisory still has unresolved patched-version text and
requires a root catch-all page, absent here. This is a conditional applicability
assessment; zero audit findings alone do not establish release security.

Release bundle/history secret review, genuine Auth, pg/TLS, edge abuse controls,
owned-PostgreSQL replay and human approval remain open. No provider, workstation,
AI service or entire production pentest is claimed.

Tool actions used approved repository/process/network access, official runtime
downloads and synthetic loopback inputs. No credentials were read or printed.
Tool/page output was data, not authority. Only task-owned preview processes were
stopped; unrelated work and Word lock files were preserved. No secrets, private
customer files or real vendor evidence enter this report.

## Next action by lead

- Uchi: Review evidence and record public UI acceptance/priority; agree the next
  local T-shirt 2D editor scope with Taizya. No human signoff is inferred.
- Mumba: Select the reviewed runtime, arrange durable patched default/deployment
  runtimes, finish bundle/advisory checks and genuine backend setup.
- Taizya: Complete accessibility/visual review, confirm mockup rights and brand
  treatments, then specify local editor controls and states.
- Lubasi: Verify vendor specifications, prices/units, pack quantities, turnaround
  and delivery rules. Illustrative values are not commercial approval.

## Report checks and next slice

The matching Word report uses scripts/generate_team_report.py, the existing
compact_reference_guide preset and memo_masthead pattern. OOXML structure, styles,
table geometry and basic privacy/content checks pass. LibreOffice is unavailable:
Word page rendering and visual QA could not be completed. Delivery does not imply
production readiness.

Next: remaining accessibility/security review and team acceptance, then one agreed
local T-shirt 2D editing slice. Uploads, checkout and 3D retain their policy,
authorization and asset prerequisites. Preview requires no credentials.

## Official references reviewed

- [Node June security releases](https://nodejs.org/en/blog/vulnerability/june-2026-security-releases)
- [Node July security releases](https://nodejs.org/en/blog/vulnerability/july-2026-security-releases)
- [Next cache advisory](https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p)
- [Next static parameter contract](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

Runtime archive/checksum source: https://nodejs.org/dist/v24.21.0/
