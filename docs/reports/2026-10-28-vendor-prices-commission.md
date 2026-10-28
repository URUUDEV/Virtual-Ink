# Vendor prices, direct payments and commission

28 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Pricing/agreement/accrual slice locally verified; protected UI-only Vercel
Preview READY. The transactional pilot is not fully working on Vercel.
Phase 1 remains INCOMPLETE / NO-GO.** Customers pay the individual vendor/shop
directly, as Uchi confirmed. No live funds or actual Hotprints account are used.

## Delivered behavior and commission recommendation

The recommended starting policy is 5% of completed printing/design service work,
included in the vendor's quoted price, with no minimum or added customer fee and
weekly reconciliation. A synthetic ZMW 100 service order is paid ZMW 100 directly
to the vendor and accrues ZMW 5 due to Virtual Ink after completion. Receipt of
the customer's money never automatically marks that commission collected.

This is a pilot recommendation to validate against actual margins and agreement,
not an activated or accepted commercial policy. For comparison,
[Etsy lists a 6.5% transaction fee](https://help.etsy.com/hc/en-us/articles/360035902374-Etsy-Fee-Basics)
and [Fiverr credits sellers 80%](https://help.fiverr.com/hc/en-us/articles/9234443621137-Your-earnings-page).
Those different businesses do not establish viable local printing margins.
No vendor price, terms acceptance, tax/delivery policy or legal signoff is invented.

The protected /vendor/pricing page lets the current verified owner select their
own vendor account, read the actual approved agreement and accept its exact
version/hash, then add/revise/retire printing/design service prices. Forms accept
decimal ZMW, labelled service/unit choices and explicit consent. Server parsing
rejects coercive money, duplicate or unknown financial fields, file entries and
forged authority. Terms render as escaped text. The vendor order view links here.

Private database commands recheck current identity/session, active VENDOR role,
vendor ownership and active tenant/membership. Mutations retain recent MFA and
native/application step-up prerequisites. New price/agreement versions are
immutable, version checked, idempotent, rate bounded and atomically audited.
Policy rotation requires new acceptance for future price changes/quotations.
An old acceptance retry cannot establish acceptance of the new policy.

When commercial mode is configured, quote insertion freezes the vendor/policy,
amount/currency and server-calculated commission using half-up integer rounding
once per quote. Order completion accrues that original fee once, including after
later policy changes. The page distinguishes accrued commission from collection.
No automatic invoice dispatch, commission-payment ledger, refund adjustment or
bank-receipt reconciliation interface is supplied by this slice. The existing
manual payment.confirm foundation remains separate from actual funds verification.

Source: ebf3d5461421f9d21b3fc1457299d13e4e3f1c0d on the existing review branch.
The CLI-created nineteenth migration, 20261028084431_vendor_commercial_terms.sql,
matches database/vendor-commerce.sql. Seven private tables enforce forced RLS,
immutable history and no direct browser/runtime table privileges. Only the
restricted service group may execute commercial commands. Configuration starts
disabled with no policy pointer; no policy, vendor, login or hosted data is seeded.
[Setup and limits](../vendor-pricing-commission.md).

## Verification results and denominators

All 261 root tests and 237 security-subset tests pass, with zero failures/skips
in the final successful runs. All 53/53 backend/shared inventory files are measured
without omissions: lines 3,145/3,166 (99.34%), branches 2,381/2,455 (96.99%),
functions 310/317 (97.79%). These aggregate unit metrics exceed 95%; individual
files may be lower. Frontend/browser behavior, SQL, process lifecycle and genuine
hosted integrations remain outside that denominator.

All 89 web component/action checks, 16 synthetic SDK/Next contracts, web types,
strict backend/shared/script/test types, source lint and runtime gates pass.
The broader strict type check exposed existing fixture type errors; narrow
annotations/header typing and a missing synthetic audit receipt were corrected.
No production storage behavior was changed by those fixture corrections.

Fresh locked root/web development installs and an optimized Next.js build pass
in an isolated checkout of the exact source. It generates 23 static pages,
compiles /vendor/pricing as a dynamic protected route and finishes tracing.
The root install audit reports zero vulnerabilities across 170 dependencies;
the web audit reports zero across 125. Original generated development types and
unrelated local skills/configuration/supplied assets are preserved.

Fresh PostgreSQL 18 replay passes all nineteen migrations under a managed-shaped
non-superuser CREATEROLE/BYPASSRLS migrator, with temporary function-owner access
removed. Six historical rollback suites, 123 security SQL assertions, 217 workflow
assertions (including 104 document assertions) and 137 commercial checks pass.
Two synthetic vendor scopes exercise cross-vendor denial even after both accept
terms, stale/forged acceptance, raw SQL validation independent of TypeScript,
current MFA/membership denial, concurrent edits, immutable fees, rate limits,
audit-outage rollback and completion accrual. Sessions/scans/payment receipts
are provider-shaped fixtures and synthetic metadata, not genuine hosted services.

Four actual loopback HTTP checks pass on the isolated production build: public
home 200, disabled login 200, private pricing redirect 307 with no-store and the
disabled workflow POST 404. The task-owned loopback server is stopped afterward.
No real vendor browser transaction, physical device or human acceptance is claimed.

## Actual Vercel and staging evidence

Protected UI-only Preview:
https://virtual-ink-ui-test-jef2guxz7-shadowrootsec-5679.vercel.app

Deployment dpl_DCP8gRNfPeMJv7kd6tu8b8jcyo3A is READY, source metadata matches
ebf3d54, buildSkipped=false and OIDC metadata confirms environment=preview.
The raw target is null; the actual Preview classification comes from the OIDC
claim rather than that null field. Hosted logs confirm fresh locked install,
ui_test isolation, lint/compilation, patched Next.js 16.4.2, /vendor/pricing and
build completion. No automation-bypass binding is present.

The existing sixteen-variable UI profile is read back without mutation: five
explicit service flags false, email/eight external modes disabled, exact ui_test
project binding and workflow absent/default-disabled. The first preflight assumed
six explicit flags and stopped before upload. It was corrected to the documented
profile and binding, retaining the source's disabled-default checks. All 499
uploaded source files pass the private/env/generated-artifact exclusion audit.

A normal unauthenticated hosted read returns 302 to Vercel protection. Browser
control also remains unavailable after a clean connection reset: its kernel
assets cannot be initialized. Protection is retained. Hosted form interactions,
assets/bundles, current Auth, database transactions and devices are unverified.
This UI-only deployment deliberately has no sensitive-service credentials or
enabled Auth/orders/storage. READY is not full-service success.

Fresh read-only staging checks show fourteen migrations, no workflow schema,
security enabled=false/environment=unconfigured, the security-service role
NOLOGIN, no scan-service role, zero Auth users and zero storage buckets.
Migration 19 and its four prerequisite pending migrations are not applied hosted.
The current MFA code still needs the separately tested Free-plan compensating
path; no paid upgrade, native-hook simulation or receipt-check deletion occurs.

Full Vercel pilot acceptance requires those hosted identity/current-MFA and
database prerequisites, restricted private credentials/TLS, private file ingress/
worker/scanner, actual vendor/account/terms setup, manual receipt/commission
reconciliation and the documented genuine hosted/device/release checks. Gateway
integration remains deferred for the direct manual-payment scope.

## Security findings, fixes and tool review

No unauthorized commercial write or data access is reproduced in the final
tests. The review specifically checks forged fee/role fields, another accepted
vendor's price ID, stale membership/session/terms, simultaneous edits and audit
outages. Audit outages roll back both price mutation and completion accrual;
immutable quote history prevents retroactive fee changes. A trusted server and
restricted credentials remain prerequisites; this is not a sandbox for a stolen
database service login or a pentest of the provider/workstation.

The first migration attempt failed because PostgreSQL rejects the proposed
generated hash expression as non-immutable. A database-checked explicit SHA-256
replaced it. A later replay exposed an unnecessary row lock requiring broader
configuration rights; the lock was removed while retaining the existing shared
administration lock and read-only configuration privileges. No extra privilege
was granted. Both the legacy journeys and commercial tests pass after the fixes.
A UI assertion initially confused React's own form replay script with injected
terms; the corrected assertion verifies that the untrusted terms remain escaped.
These failed attempts are retained as failures, not counted as passing evidence.

The unchanged staging security advisor reports one informational notice for a
deliberately closed legacy reviewer-audit table with RLS and no policies. It does
not inspect the unapplied commercial tables. [Provider explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
Official [Node October fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
and [Next.js October fixes](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
were rechecked; reviewed Node 24.22.1 and Next.js 16.4.2 remain in use. Request-time
hosted runtime acceptance remains open.

Modern Web Guidance forms was retrieved before UI implementation. Native labelled
forms, grouped radio choices, explicit consent and independent server validation
follow its rule, "Server-side validation is for Security". Installed Next.js
Server Action/form guidance informed origin/auth checks and bounded framework
action metadata handling. Supabase/Postgres guidance informed private definer
boundaries, search paths, least privilege and forced RLS. The changelog Markdown
fetch was rejected by the web tool; no successful changelog scan is invented.

Tool actions use synthetic loopback probes and reviewed hosted catalog reads.
No production configuration, main push, database/Auth/storage mutation, real
customer data, live funds, vendor message, public promotion or simulated human
signoff occurs. Repository and document checks are recorded in delivery evidence.

## Team next actions

- Uchi: review the 5% pilot recommendation with Hotprints' actual margins and
  record the real commercial terms/vendor acceptance and operating approvals.
  Keep the full-service release decision pending actual evidence.
- Mumba with Uchi: resolve the Free-plan MFA path, reviewed forward migration/
  runtime credentials and private transport; then complete direct manual receipt
  and commission reconciliation and genuine hosted role journeys.
- Taizya: test the actual authenticated price/agreement states and service units,
  accessibility, keyboard/error behavior and required physical devices.
- Lubasi: verify Hotprints' services/rate card, direct-payment instructions,
  receipt reviewer, weekly commission collection, refund/reprint and retention.

The report supplies a reviewed slice and its hosting limits. It does not accept
Hotprints, activate a fee or complete Phase 1.

## Resumed handover and delivery checks

The interrupted handover was resumed on 28 October. The preceding application,
SQL, HTTP and deployment results above were checked against their retained local
logs and safe metadata; they are not newly repeated hosted acceptance tests.
Source remains ebf3d5461421f9d21b3fc1457299d13e4e3f1c0d on
feature/phase1-staging-readiness. The handover adds the matching setup guide,
Markdown/Word report and current README, task-board, security, decision and
phase-gate references. Unrelated generated development types, local agent/skill
configuration and supplied attachments are preserved.

A fresh repository heuristic scan passes: 511 files scanned, 139 skipped,
zero findings. The Word package/XML, required evidence, real heading/list styles,
Letter page geometry and one-inch margins pass structural checks. All local
Markdown links checked for this handover resolve, and the portable commercial SQL
matches migration 19 byte for byte. Git whitespace checks pass. These checks do
not extend the backend coverage denominator or establish browser/service acceptance.

The documents skill renderer was attempted but could not start LibreOffice:
soffice is absent from PATH and its standard installation path. No page images
were produced; visual layout, pagination and clipping remain unchecked. The
Word document is structurally verified only. No open Word lock file was removed.

Git source delivery is confirmed on origin/feature/phase1-staging-readiness:
the successful network-enabled push retry reports Everything up-to-date for
ebf3d5461421f9d21b3fc1457299d13e4e3f1c0d. The preceding sandboxed push stalled
without a receipt and was stopped; its outcome was not assumed. The handover
documents are delivered on this same review branch. No force push, main merge,
public promotion or phase-completion claim is part of this delivery.
