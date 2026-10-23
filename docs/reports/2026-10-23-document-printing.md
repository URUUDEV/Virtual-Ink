# Document printing for students and everyday users

23 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Document preparation slice; Phase 1 INCOMPLETE / production NO-GO.** Production
is unchanged. This does not enable ordering, private upload or payment.

## Problem and resulting behaviour

The public preview made merchandise easy to find but had no document-printing
entry. The customer dashboard's generic enquiry form required a product code and
dimensions, and could not retain pages, colour, sides or binding. It remains
preserved; the new form never silently drops options into that generic contract.

Added /print-documents and prominent links from the homepage's primary action,
category card, primary navigation, footer, catalogue and customer dashboard,
including its unavailable-service state. Existing catalogue/studio/vendor actions
and routes remain. No supplied logo, geometry, palette or animation is replaced.

The new form supports assignments/reports, notes, dissertations/theses, business
and other documents; pages per copy; copies; A4/A3/Letter; paper preference;
monochrome/colour; single/double-sided printing; loose/stapled/spiral/soft-cover;
turnaround preference; collection/delivery preference. Availability is subject to
vendor confirmation. Review retains every choice and offers a local text download.

Printed-page/sheet quantities are material estimates, excluding covers. Each
duplex copy starts on a new sheet: five pages times three copies means fifteen
printed pages and nine sheets. They are not authoritative prices. Approved rates
are absent, so the page consistently says **Quotation required**. No vendor/date,
order ID, payable total, fake upload or successful checkout is created.

No original document or customer identity is collected. The PDF-preparation
guidance explains export from Word/Google Docs. There is no file picker while
genuine private storage, quarantine and scanning are unavailable. Choices remain
in page memory; the explicit download contains only fixed-option specifications,
not document bytes, filenames, storage paths, addresses or credentials.

## Scope, source and preservation

Repository: D:/Work/Projects/virtual-ink. Branch: feature/phase1-staging-readiness.
Initial commit: 148baf2e31341ef8ab58726ecda2fe200e6657fc. Source delivery identifiers
are recorded below after verification. No main checkout/merge or production write.

The route/functionality checklist in docs/document-printing.md was written before
implementation. Source changes comprise the new route/CSS/client form, a pure
shared specification validator/summary/export, public entry points, customer
dashboard links and relevant unit/SSR checks. No new dependency, migration, API,
RLS policy, storage bucket or provider/environment setting is added. Existing
unrelated next-env.d.ts, local skill/config and extracted assets remain unstaged.
The existing Next.js dependency is patched from 16.4.0 to 16.4.2 as described below.

The mandatory archive and required components were accessible in the preceding
authority audit; existing supplied Virtual Ink components/tokens remain in use.
No demonstration archive backend/framework/dependency is imported.

## Verification and security review

Recorded checks use reviewed Node 24.22.1, isolated local environment and disabled
Auth/workflow/storage/email. Timed command results and browser/hosting results
are recorded below. These checks do not establish hosted commerce acceptance.

The first web test failed because it expected HTML attributes in source order;
React serializes action before method. The assertion now checks both attributes
independently of order. The original failure log is preserved privately and the
86-test retest passes. No application security check was weakened.

The first optimized build compiled but exited 1 on Next.js's security gate.
Independent npm audit reports two critical and one high advisory affecting
16.4.0. The [official 14 October advisory](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
identifies cache typed-array RCE, Linux SVG image-optimization RCE and Server Action
denial of service, with fixes in 16.4.1. The registry's current patched release
and audit fix recommendation are 16.4.2. This slice applies that exact patch,
preserves the lockfile, performs a clean locked web install and reruns checks.
No retry/bypass of the vulnerable build is used. Tool output is diagnostic data;
its suggested separate upgrade-agent workflow is not treated as authorization.
No exploit is run against any deployment, and vulnerable-package presence does
not prove application-specific exploitation. Original production deployments
remain outside this patch and need separate authorized remediation/verification.

Attack paths reviewed: forged price/role/order fields, unsupported enums, prototype
property names, coercible/fractional/oversized counts and markup/URL injection into
the download. Strict allowlists and bounded integers reject these in local unit
tests. The download validates again and uses text/plain with a fixed filename.
There is no HTML injection, remote URL, server mutation or document transmission.
Client validation is a UX boundary; future server submission must independently
authorize/revalidate the complete specification. No financial authorization or
private-file security is claimed from this local form.

Semantic fieldsets/legends, native radio groups, visible labels, associated help,
integer constraints, focus outlines, a focusable review heading and status/error
announcements are present. Controls use at least 48px targets and 1rem text inputs.
The review action is disabled until hydration; a noscript explanation avoids
pretending the local review works without JavaScript. Native constraints remain
active after hydration. The form's fallback method is POST, not a URL query.

The modern web forms guide informed native controls, labels, grouping, mobile
targets and error handling. Existing reduced-motion styles remain, and the new
form has no animation, WebGL, 3D import or external service dependency. No Lighthouse
score, load test, complete WCAG certification or physical-device approval is claimed.

Supabase/Auth/MFA/RLS/private upload/malware scanning/backend pricing/Flutterwave/
Resend/proofs/production/QC/delivery integrations are unchanged and not verified
by this slice. The MFA hook remains DEFERRED_PAID_CAPABILITY; genuine compensating
controls and full hosted acceptance remain open. Human approvals: none received.

## Remaining gates and next actions

- **Uchi:** review the document workflow and prioritize the full secure order
  journey; approve launch sizes/stocks, prices, binding capacity and operating rules.
- **Mumba:** add a forward document-specification server contract and persist every
  option; connect genuine staging identity, quarantined private upload, approved
  server pricing and sandbox checkout. Keep provider credentials private.
- **Taizya:** review the form's terminology, accessibility, keyboard/mobile journey,
  and collect named Windows/Android/iPhone acceptance evidence after hosted setup.
- **Lubasi:** confirm practical document-print vendor capabilities, turnaround,
  collection/delivery responsibilities and owner-approved commercial policies.

The current catalogue still contains illustrative merchandise fixtures. There is
no real vendor listing, customer order, price or file generated by this form.
No phase or complete MVP is accepted. Continue Phase 1; production remains blocked.

## Rollback

Changes are isolated to the feature branch. Restore source through a reviewed
revert of this slice, preserving unrelated work; never reset/force-push/main-merge.
The preceding immutable UI-only Preview can remain the review fallback. Do not
promote either UI-only deployment or alter the original/acceptance projects.
There are no schema/provider/data changes to reverse. Stop only the task-owned
loopback server through its PID/start-time ownership check. Full service rollback
and production release approval remain open; no rollback drill is invented.

## Execution evidence

Local checks pass: 254 root tests; 86 web rendering/control regressions; 16 real
SDK/Next integration contracts using synthetic HTTP dependencies; strict types;
zero-warning lint; environment isolation; optimized build; root/web dependency
audits with zero reported vulnerabilities; and repository scanning (492 files,
133 exclusions, zero findings). This is not genuine hosted Auth or commerce.

All 51/51 inventoried backend/shared source files are measured, with no omissions:
lines 3,040/3,061 (99.31%); branches 2,277/2,351 (96.85%); functions 299/306 (97.71%).
Frontend/browser, SQL, lifecycle and hosted integrations remain outside that unit
denominator. These numbers are not a product completion percentage.

The patched build first encountered a workstation System.OutOfMemoryException.
A one-worker/256 MiB retry compiled but exhausted the type-checker's JS heap.
The final one-worker/384 MiB build passes compilation, built-in TypeScript,
static-page generation and tracing with no checks skipped. The changed memory
settings are private execution settings, not weakened application/build gates.
The user's existing next-env.d.ts bytes are restored after every build attempt.

Seven loopback printing HTTP requests pass for the new route, homepage/catalogue/
customer links, injected query content and the disabled workflow API. An initial
assertion wrongly expected the public static page to return 405 for POST: Next
serves its unchanged HTML with 200 and has no mutation handler. The corrected
check verifies the static preparation/no-order notice and no forged-field echo.
The actual workflow POST remains 404. No order or authorization is created.
Existing Auth-disabled HTTP regressions pass 44 assertions over 11 requests.

Chrome verifies actual five-page/three-copy A4 study-note configuration with duplex
and spiral binding, review of all options and the correct fifteen-page/nine-sheet
calculation. Edit returns focus to the page input. Changing to zero clears the
review/download and native validation focuses that input. Keyboard Enter after
correction to seven pages produces twenty-one printed pages/twelve sheets and
focuses the review heading. The sampled application error log is empty.

The download event listener timed out, but Chrome actually saved the 781-byte
synthetic text file; filesystem/content inspection confirms the selected five-
page/three-copy, duplex/spiral choices and explicit NOT SUBMITTED/quotation-required
disclosures. A UI status alone was not used as proof of a completed download.
The file contains no source document or private identity information.

At a 320px viewport, the page has no horizontal overflow (305px content width
after the browser scrollbar). Intro/form/review screenshots were inspected.
The mobile menu exposes Print documents, Escape closes it and restores menu
button focus. The temporary viewport override is reset. This is browser viewport
testing, not physical Android/iPhone or named Windows reviewer acceptance.
Browser-tool telemetry connection warnings are distinguished from the empty
sampled application console; no application change is based on tool telemetry.

The task-owned optimized local server is available at
http://127.0.0.1:3120/print-documents with sensitive services disabled. It is not
an external sharing address. Protected UI-only Vercel delivery remains pending
at this source checkpoint; no new hosted URL is invented.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED
