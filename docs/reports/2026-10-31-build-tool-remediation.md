# Build-tool remediation and acceptance alignment

31 October 2026. Virtual Ink / Shadow Root Security Technologies.

**PHASE 1 STATUS: INCOMPLETE — ACCEPTANCE GATES REMAIN OPEN**

This is an interim engineering handover. It is not the final Phase 1 completion
report, a hosted acceptance result, human approval or release authorization.

Source commit 285afe8788b2300613581941b40c956f56de2589 on
feature/phase1-staging-readiness patches the recorded minimatch advisory. The
explicit feature-branch push succeeds and an independent remote read confirms
that source SHA. Main and Production are unchanged.

## Remediation and risk disposition

The installed minimatch 10.2.6 has
[GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249),
severity Moderate. The original full root audit reports 24 propagated entries
from this one finding. It is a development/build dependency, used by the lint
gate before production assets are compiled. No request-path minimatch import
is found; absence of a demonstrated HTTP exploit did not justify leaving a
vulnerable build chain or inventing risk acceptance.

A controlled generated pattern exhausts the affected matcher's child heap.
The child has a 64 MB old-space limit and five-second timeout; the final probe
also constrains semi-space to 2 MB and inherits no application credentials.
This is a local bounded reproduction, not a provider attack or host stress test.
No production asset modification or application compromise is demonstrated.

An exact root override pins the maintainer's patched minimatch 11.0.1.
The npm-generated lock changes that entry and adds only the dev dependency
@isaacs/nonrecursive-glob-match 1.0.3. ESLint remains 10.13.0; other locked
packages and the independent web lock are unchanged. No forced downgrade,
unchecked audit fix, dropped lint rule or omitted source file is used.

The major-version/internal matcher change is reviewed with actual consumers,
compatible Node engine metadata, a full lint/build and before/after behavior.
All 239 linted file paths and 5,082 sampled glob decisions remain identical.
Actual bad Node/web source is still rejected and valid source admitted. The
patched adversarial-pattern probe completes and respects the expansion cap.
These samples are evidence of compatibility, not a proof about every glob.

Engineering owners are Uchi/Mumba. The remediation target is 31 October 2026
and always before release; the local patch/verification meets that target.
Security risk acceptance: none. Locked installs, reviewed fixed glob settings,
restricted configuration changes and the bounded regression remain in force.
Use the reviewed lock for a new qualifying hosted build; do not silently restore
the vulnerable chain during rollback. [Full advisory register](../security-advisories.md).

## Actual verification

| Check | Result | Scope |
| --- | --- | --- |
| Fresh locked root install | Pass, includes dev; cached offline/no-audit | Audit runs separately |
| Full lint | Pass, zero errors/warnings | 239 admitted source/config/test files |
| Glob compatibility | Same 239 file paths and 5,082 sampled results | No source inventory reduction |
| Advisory/lint negative controls | 2 pass after patch; affected version fails the bounded probe | Synthetic local child and actual ESLint admission |
| Root unit / security subset | 268 / 242 pass, zero failures/skips | Overlapping suites |
| Web / Auth transport | 91 / 16 pass | Synthetic component/transport checks |
| Web strict types / full build | Pass | Local Node 24.22.1, Next.js 16.4.2; services disabled |
| Root full / production-only audits | Zero reported vulnerabilities in each | Full metadata inventories 170 dependencies, including 14 production entries |
| Independent web audit | Zero reported vulnerabilities | 125-entry independent dependency tree |
| Runtime / repository checks | Pass | Scoped local checks; not provider security acceptance |

All 53/53 backend/shared files remain measured, with no omissions: lines
3,163/3,184 (99.34%), branches 2,395/2,468 (97.04%), functions 310/317 (97.79%).
This is aggregate unit coverage. Frontend/browser, SQL, src/server.js lifecycle,
hosted integrations and human acceptance remain separate. No SQL or application
business code changes in this build-tool slice; previous SQL results are historical.

One compatibility attempt incorrectly overlaps the clean install and reads a
temporarily removed package. It is discarded; the later stable-tree comparison
passes. An initial PowerShell launcher also fails; the direct reviewed runtime
works. The local Next build regenerates two next-env type paths. The existing
user-owned bytes are restored from the private pre-build backup after comparing
those known generated changes; the original SHA-256 is preserved. Unrelated
user source, local skills, supplied assets and historical reports remain intact.

## Current acceptance authority

[The owner's final instruction](../phase-1-final-acceptance.md) is now recorded
with its exact incomplete status and an [unexecuted evidence matrix](../phase-1-acceptance-matrix.md).
Hotprints is one participating testing vendor, with no ownership, parent-company,
exclusive representation, payment-operator or special-permission implication.
The public application/source search finds no hard-coded Hotprints branding;
actual multi-vendor marketplace behavior still requires acceptance.

Required method scope is MTN, Airtel and Zamtel Money, bank transfer/deposit and
numbered-receipt cash on collection. This defines support, not real recipient
configuration or settlement. The dedicated Shadowroot Pilot Finance and
Reconciliation Reviewer must be independent of all specified actors. The current
generic administrator confirmation, missing receipt interface and absent private
application ingress do not satisfy the updated requirement. They remain work,
not accepted exceptions. No recipient, vendor or reviewer is appointed here.

The seven blockers retain distinct evidence requirements. All eighteen hosted
journeys, actual Hotprints/school-based/outside-vendor testing, named independent
reviewer/admin/customers and physical Windows/Android/iPhone results remain open.
The new matrix contains no simulated person, device result or approval.

Hosted verification cannot restart: the browser-control tool fails before any
browser access with a kernel-assets path error. No tab, protection bypass,
credential extraction or alternate browser automation is used. The last confirmed
UI-only Preview still has the previously recorded runtime rejection; no fresh
hosted status or deployment URL is invented. This patch has no new Vercel
deployment or full-service acceptance claim.

## Team actions and delivery

- Uchi: retain the exact incomplete status, provide actual acceptance participants
  and coordinate the provider runtime path; owner release approval remains pending.
- Mumba with Uchi: retain the patched lock, proceed to the independent-review/
  private-file slice and verify its genuine isolated hosted denials before enablement.
- Taizya: prepare the eighteen journeys and real-device/accessibility checks;
  record actual tester, model, OS/browser, date, defect and approval when performed.
- Lubasi: verify all vendor participants and independent finance/reconciliation
  responsibilities, private recipient instructions, cash receipt numbering,
  retention, exceptions and actual operating acceptance.

The required Word copy uses scripts/generate_team_report.py, the Documents
compact_reference_guide preset and memo_masthead pattern. ZIP/XML, Letter/one-inch
geometry, real lists and fixed table widths pass; all 571 local links across
thirteen affected Markdown files resolve. Lockfile review confirms exactly one
replaced and one added dependency entry. The post-report repository scan passes:
537 scanned, 149 excluded and zero findings. The renderer reaches conversion
but fails with WinError 2 because LibreOffice/soffice is unavailable. No page
images or visual Word acceptance are claimed; render and inspect before external
circulation. Reports contain no credentials, payment details, customer files,
receipt evidence or signed access tokens. This scoped review does not claim
the workstation, OS, provider or whole system was pentested.
