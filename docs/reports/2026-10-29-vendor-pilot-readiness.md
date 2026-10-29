# Vendor pilot readiness and Free-plan MFA

29 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Vendor activation remains BLOCKED. Phase 1 is INCOMPLETE / NO-GO.** Today's
fresh protected Vercel Preview still runs an older Node request runtime and
returns HTTP 500. The local Free-plan MFA compensation now passes genuine Auth
checks; it is not enabled or accepted on hosted services. No vendor is invited,
account activated, commercial agreement approved or production change made.

## Delivered implementation

Source commit: 1b6a9fdad5fb3c4bd69fbdaa5970bdda00a8ba48 on
feature/phase1-staging-readiness. [Setup and limits](../free-mfa-compensation.md).

The new database-owned application_receipt policy records successful application
verification after checking native Auth user/session, verified TOTP factor and
matching AMR, plus the preceding durable application reservation. Its receipt
and immutable success audit commit together. The existing native provider_hook
policy remains the default and has genuine post-migration regression checks.
No browser field or environment flag chooses the policy. No native hook receipt
is manufactured. Existing recent-password, signed step-up, five-minute lifetime,
current-role, replay/account budget, replacement/recovery and dual-approval rules
remain in place.

Protected requests need the signed proof and matching application receipt in
addition to current native facts. A provider-direct AAL2 token, cross-account
cookie or correctly signed test cookie without a receipt is denied. Later
application verification supersedes older receipts for the same factor. Forced
RLS, immutable receipts, restricted helper/renamed-command ACLs and absent direct
runtime table access preserve the boundary. A runtime role cannot select policy.

When receipt insertion fails after real native verification, the response fails
closed: no application receipt, success audit or pending step-up cookie commits;
the earlier attempt remains. The genuine gateway harness exercises this boundary;
the unchanged Next cookie transport has separate synthetic contracts. This is not
a genuine browser/hosted Next acceptance claim.

The CLI-generated forward migration is
20261029093317_virtual_ink_free_mfa_compensation.sql. Its portable source and
migration have normalized SHA-256
0396aa382582e9f1f0cab43f426e0ab5afc3add2d9d5c295147b3694217390ac.
Applied history is preserved. No hosted migration is applied during this work.

## Actual local verification

| Check | Actual result | Scope |
| --- | --- | --- |
| Genuine local Auth | 435 checks pass; cleanup passes | Native Auth v2.197.0, real SDK/gateway, restricted SQL login, synthetic accounts |
| Free-plan path | 120 checks pass within that total | Both paid MFA and custom-token hooks off; receipt, role, replay, budget, audit, session and freshness denials |
| Paid policy after migration | 9 checks pass within that total | Native hook verifies, protected read succeeds, only native receipt is used |
| Managed-shaped PostgreSQL | All 20 migrations replay | Non-superuser CREATEROLE/BYPASSRLS; temporary ownership memberships removed |
| SQL regression suites | Six rollback files; 123 security, 217 workflow and 137 commercial assertions pass | Synthetic provider-shaped sessions/storage/payment evidence; workflow output separately reports 104 document checks |
| Root unit / security subset | 265 / 241 pass | Zero failures/skips; overlapping suites |
| Auth/Next transport contracts | 16 pass | Synthetic provider/transport contracts |
| Required source gates | Locked root install, lint, runtime and repository security checks pass | Node 24.22.1; root dependency audit reports zero known vulnerabilities |

Counts are assertions/checks, including response privacy checks; subsets and suites
overlap and must not be added as unique tests. SQL workflow/document counts are
reported separately without an inflated aggregate. Existing seeded synthetic
vendor fixture counts are 3/3 in the disposable replay; no hosted rows are involved.

All 53/53 backend/shared unit inventory files are measured, with no omissions:
lines 3,154/3,175 (99.34%), branches 2,382/2,455 (97.03%), functions 310/317
(97.79%). Aggregate coverage exceeds 95%; individual files can be lower.
Frontend/browser journeys, SQL, src/server.js lifecycle and genuine hosted
integrations remain outside that denominator. Web source is unchanged; this
slice does not claim a fresh full web/device suite. Today's Vercel build below
has its own exact source and is not a deployment of this new SQL policy.

## Fresh hosted evidence and active blockers

Protected Preview:
https://virtual-ink-ui-test-mkichpnsp-shadowrootsec-5679.vercel.app

Deployment dpl_CVPD35b6kizhVwwYYr5M7UpkAikn, project
prj_aqLrX1gsSVb1XINH5YNGkp1aYazH, exact source
fa478a16da9148d0ed2fd8ada0aaea8658cb9e47. Metadata confirms actual Preview,
ui_test, READY, a fresh build and no automation-bypass binding. Preflight checks
the exact sixteen disabled-service settings, protection and no Git/integration
inheritance. The inspected 513-file upload excludes private/environment/Git/tool
data, Word reports and unreviewed attachments. Install, isolation, lint, Next.js
16.4.2 compile and build markers pass.

Normal authenticated Shadow Root Chrome access to /shop shows the generic
failure page. Exact deployment logs prove HTTP 500, RUNTIME_SECURITY_PATCH_REQUIRED,
actualNode 24.21.0 and minimumNode 24.22.1. The old Preview also fails today.
Vercel controls minor/patch rollout; selecting 24.x and a successful build do not
prove request compatibility. No guard exception, alternate runtime or unsupported
patch pin is introduced. The [runbook](../vercel-runtime-verification.md) contains
a concrete support-request draft. Sending it is pending explicit permission;
no external provider message has been sent.
[Vercel documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Read-only staging checks find fourteen migrations, 29 private application tables,
zero Auth users/sessions, zero Supabase Storage buckets and no LOGIN application
roles. The separate Neon buckets are not Supabase Storage. The advisor returns
only an informational no-policy notice for vendor_reviewer_grant_audits; its
deny-by-default boundary is preserved. The acceptance project still has 25
Preview-only, noninherited variables with Auth/security/storage disabled and
email/payments disabled. Private service database/HMAC bindings are absent.
No full-service Preview acceptance exists.

A Vercel test URL does not require buying the website domain. It still needs
working request execution, actual isolated Auth/MFA/monitoring, restricted
service bindings, private ingress/scanning and vendor/customer/admin journeys.
Verified email delivery and an approved onboarding channel are separate
requirements. Hotprints remains the recorded first candidate; other names,
capabilities, real agreement and manual receipt/commission operations remain
unconfirmed. The proposed 5% weekly vendor-paid fee is not vendor acceptance.

## Security findings, retained failures and limits

The genuine unhooked provider permits a valid TOTP across different challenges.
That is observed native behavior, not a claimed provider vulnerability. An
attacker with primary credentials and the TOTP could obtain native AAL2 directly;
the Free policy's application budget does not control provider-direct issuance.
The application still denies sensitive actions without its audited receipt and
signed proof. Native IP limits, hosted rate settings, monitoring response and
external administrator alert delivery remain unaccepted. Durable application
failure alerts are tested; an event insert does not prove notification delivery.

A separate 14-check real local Auth probe shows that rejecting a Custom Access
Token SQL Hook rolls back its SQL audit insert. It is not used as a replacement
durable native hook. Both hooks are disabled in the Free-path fixture. The shared
loopback fixture IP budget is raised solely for its many synthetic users and is
not hosted provider-limit evidence.

The first migration replay reproduces a permission failure: temporary owner
membership was removed before final ACL cleanup. Moving cleanup before membership
removal fixes it; the complete twenty-migration replay and suites pass afterward.
Initial sandbox subprocess/start failures, a hung Docker daemon and Windows
PowerShell alias access failures remain part of the run history. The approved
normal Docker restart times out; recovery stops only processes whose current
executable paths match the installed Docker directory and relaunches it hidden.
The subsequent genuine run passes 414 checks; the final expanded run passes 435.
Only labelled test containers/networks are removed, with successful cleanup.

Root advisory checks pass. The reviewed
[Node October fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
remain the native runtime baseline; the hosted older patch still blocks release.
The provider changelog was checked before SQL work, including the pending
[CBC TLS cipher deprecation](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
and [new public-table grant defaults](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
No TLS downgrade or public grant is introduced.

No customer/private vendor evidence, addresses, credentials, live funds or human
approval is used in probes or reports. Tool/document output is treated as untrusted;
no instruction injection or shell-built secret interpolation is followed. This is
a scoped application review, not a pentest of a provider, OS or workstation.

## Team actions and handover

- Uchi: retain NO-GO, resolve the supported Vercel runtime path and confirm the
  invited vendor group plus real commission/terms and operating decisions.
- Mumba with Uchi: reconcile and rehearse the six forward staging migrations,
  then verify restricted private bindings and genuine hosted Free-policy/session/
  rate/monitoring/alert denials after request execution works. Preserve production.
- Taizya: run real Windows/Android/iPhone workflows, keyboard/accessibility and
  vendor/customer/admin acceptance on the functioning isolated deployed source.
- Lubasi: privately verify Hotprints capabilities, handoff, receipt-review owner,
  weekly commission collection, refund/reprint and retention operations.

The Word copy uses scripts/generate_team_report.py with compact_reference_guide
and memo_masthead conventions. Package/XML, required evidence, Letter geometry,
one-inch margins, real headings/lists and fixed table geometry pass. All 453 local
links across ten affected Markdown files resolve. The repository security heuristic
passes with 527 scanned files, 146 excluded and zero findings; whitespace checks
pass. The initial renderer cannot create its sandboxed temporary profile. Its
authorized rerun reaches conversion and fails with WinError 2 because LibreOffice
is unavailable. No page images or visual Word acceptance are claimed. Render and
inspect the document before external circulation. Existing user edits, local skills, supplied attachments, screenshots
and historical reports are preserved. Reviewed source/report commits are pushed
to the review branch; no main merge or public promotion occurs. This local slice
and the failing UI-only Preview do not complete or accept Phase 1.
