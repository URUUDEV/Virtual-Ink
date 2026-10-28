# Hotprints and vendor setup

28 October 2026. Owners: Uchi and Mumba; product review with Taizya and Lubasi.
This slice provides guided preparation and an account setup checklist. Phase 1
remains INCOMPLETE / NO-GO; real vendor activation and hosted transactions remain open.

## Vendor experience

Start at `/vendors/join`, linked from Business and the existing vendor entry points.
The four steps are:

1. **Your business:** individual vendor, print shop or design studio; school/campus,
   school-serving or wider-community setting; trading name, contact and general area.
2. **Your services:** paper printing, design, apparel or signage. Printing and design
   lead the Hotprints pilot; vendors choose their own actual capabilities.
3. **How you work:** availability, working hours, collection/delivery, typical working
   days and optional equipment notes. These are declarations for review.
4. **Review and next steps:** inspect the complete profile, confirm its self-declared
   status and download it for a private review. Back navigation preserves entries.

Required groups use native radios/checkboxes, visible labels and linked help/errors.
Invalid submission stays on the current step and focuses a linked error summary.
Nothing is saved automatically. Explicit device saving, draft download, bounded
JSON import, undo restore and removal retain the existing privacy boundary.

The version 2 draft/profile envelope adds vendor type, setting, availability and
working hours. Strict version 1 imports preserve earlier details and reopen at
the first missing setup step. They do not invent a business type or approval.
Confirmation resets on every import/restore. The existing device key is retained
so earlier saved drafts remain discoverable. The limit is 8,192 UTF-8 bytes.

## Approved owner setup

`/vendor/setup` connects preparation to account security, the current commission
agreement, service pricing and first-job operations review. It is linked from the
vendor order queue and pricing workspace.

Its dynamic server component uses the existing verified session and audited,
owner-scoped commercial read. It displays owned vendor choices, the actual current
agreement version/acceptance and active price count. Retired prices and prices
without a current accepted agreement are not counted as ready. Account security
and operations review remain explicit prerequisites; the page never declares
the vendor live or supplies an activation toggle.

An unavailable session/service or missing owner account shows a safe entry point
without private vendor details or fabricated completion. URL flags and local
profile files cannot establish owner access, acceptance or activation. Existing
agreement/price mutations retain their server-origin, current-identity, recent-MFA,
policy/version and SQL authorization/audit checks.

## Current delivery boundary

Profile preparation remains local. There is no new authenticated submission API,
backend profile persistence, approval action, vendor seed or database migration.
The older persistent [onboarding foundation](vendor-onboarding-foundation.md)
remains disconnected from public preparation. Business type, school setting and
availability do not grant a role, school endorsement, listing or order access.

Agreement acceptance and price editing use the existing
[commercial workspace](vendor-pricing-commission.md) when genuinely configured.
The protected UI-only Preview keeps those services disabled; rendering its safe
unavailable checklist does not verify hosted owner mutations.

Use synthetic contact details in previews. Store real profiles privately; never
include credentials, IDs, bank details, street/home addresses or private evidence
in these drafts or Git. Device storage is readable by other scripts on the same
origin and is not encrypted; remove it when finished on shared devices.

Next work remains isolated hosted identity/MFA/database readiness, authenticated
private intake and reviewed profile persistence, actual Hotprints capabilities and
agreement, payment receipt/commission reconciliation and genuine role/device acceptance.

## Verification handover

The [28 October report](reports/2026-10-28-vendor-setup.md) records exact test,
coverage, source and deployment evidence. The protected UI-only Preview for
4d809c0 is READY, and sampled hosted preparation/validation checks pass. Following
the review link to `/vendor/setup` reaches a browser error page. Vercel logs confirm
HTTP 500 with `RUNTIME_SECURITY_PATCH_REQUIRED`; the exact request-runtime version
is unreported. Verify a compatible patched request runtime and retest without
bypassing the guard. Local rendering tests do not close that runtime gap. No
service flag or activation permission is enabled.

The [runtime follow-up](reports/2026-10-28-vercel-runtime-diagnostic.md) now
identifies Node 24.21.0 request execution, below the unchanged 24.22.1 baseline.
A fresh exact-source diagnostic Preview reproduces the guarded HTTP 500.
Compatible provider request execution remains required before owner-checklist
acceptance; no baseline override or vendor activation is supplied.
