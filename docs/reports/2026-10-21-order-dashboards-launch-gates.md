# Phase 1 order dashboards and launch gates

21 October 2026. Virtual Ink / Shadow Root Security Technologies.

Handover finalized on 22 October after resumption. Implementation, tests and
deployment evidence below were collected on 21 October; no overnight revalidation
or hosted enablement is inferred.

**Release decision: NO-GO. Production is unchanged.** This is an implementation
handover and blocked release report, not completion or human approval. Owners:
Uchi Chinyama and Mumba Chitonge; design Taizya; operations Lubasi.

## Source and environments

Implementation commit: `ef0c9673153fafb7226e17a03c5fbb47345bf4bc` on
`codex/phase1-order-storage-runtime`, parent
`da42c69` (the preceding backend build/report). Twenty reviewed source, migration,
test and setup files were committed explicitly. The final reporting commit is
identified in Git history and the delivery response. No Git push occurred: safe
development source sharing and the original automatic deployment mapping remain
unresolved. No force push, destructive Git/database command or production change.

Preserved unrelated work: apps/web/next-env.d.ts, .agents, supplied extracted
attachments and skills-lock.json. Existing Auth, storage/workflow architecture,
animated logo, fonts, models and branding assets were retained. The supplied
design application was not substituted for the working application.

The extracted Kimi reference and its existing 79-file archive manifest are present.
Writing block 58163 was not found in repository searches; its text/path was
requested. Full conformance to that unavailable reference is unverified. The
existing Next.js documentation and retrieved Modern Web Guidance forms guide
were read before frontend implementation. The skill reported a newer catalog
version; no user skill directory was overwritten. Supabase changelog and relevant
MFA/RLS documentation were checked. TLS CBC retirement on 10 November and unrelated
server-adapter deprecations do not require weakening this application's adapters.

Development verification uses Node 24.22.1, disposable PostgreSQL 18 and genuine
local Supabase Auth with synthetic accounts. Managed staging remains separate:
Supabase `trlhbsgxcsgvfyxezayb`, PostgreSQL 17.11, in the existing Free organization.
The dedicated full-service Vercel project remains `virtual-ink-acceptance`,
`prj_8IuJeoiJ4FVU3GHytBwPWp4idAEL`; it has no working accepted Preview URL.
The requested staging.virtualink.co.zm hostname was not configured or verified.
Production URL was not verified in this task; no production release or smoke test
was performed. No production secret, customer record, DNS record or resource changed.

## Actual deployment evidence

The separate protected **UI-only** Preview is READY:
[open review deployment](https://virtual-ink-ui-test-eqbcdskjv-shadowrootsec-5679.vercel.app).
Project `prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`; deployment
`dpl_8CTGz5hMRJXUDHT1wELqDujAP6yF`; source ef0c9673153fafb7226e17a03c5fbb47345bf4bc.
Deployment request recorded **2026-10-21 21:26:11 UTC / 23:26:11 CAT**;
READY/source/target verification: **2026-10-21 21:27:38 UTC / 23:27:38 CAT**.

A committed Git snapshot uploaded 459 reviewed files, excluding credentials,
private tooling, user attachments, Word documents, generated next-env and builds.
Metadata confirms actual environment preview, a non-Production target,
buildSkipped=false, zero aliases/automatic aliases and no automation-bypass binding.
Logs verify a fresh cache-free locked install, ui_test isolation on Node 24.22.1,
lint, compilation and completed build. Project protection stays enabled; no bypass
token was minted or used. This is a UI build, not hosted dashboard/session acceptance.

Auth, database, security administration, storage, uploads, workflows and payment
stay disabled there. It is not the requested full-service staging deployment and
cannot close a secure-integration, physical-device or launch gate. The dedicated
acceptance project's first-target Preview routing stop remains in force; no
Production bootstrap, copied Production variables or environment relabelling was
used. The unrelated original project is unchanged.

## Dashboard functions and routes

Added `/customer`, `/vendor`, `/admin`, shared order dashboard rendering and
server functions. Updated account navigation and the existing `/admin/security`
entry. Existing `/api/workflow/[action]`, Auth and security APIs remain intact.
No public RPC, file URL, new privileged browser credential or new REST mutation
endpoint was introduced. [Setup and exact limits](../order-dashboards.md).

| Dashboard | Implemented and locally checked | Completion |
| --- | --- | --- |
| Customer | Owned counts/list/detail/status filter/pagination/timeline; enquiry draft, early cancellation, quote acceptance/rejection and collection confirmation | Partial; full launch dashboard not complete |
| Vendor | Current assigned queue/detail/counts; accept/decline reason, proof preparation, approved production queue/start, evidence-gated finish, QC/correction and readiness forms | Partial; complete operations workspace not complete |
| Administrator | Recent-MFA platform order counts/list/detail/timeline, link to existing controlled role/security administration | Read-only order oversight; full administrative dashboard not complete |

Counts come from scoped stored orders, not constants, mock totals or inferred
empty states. The queue sorts newest first and filters status; urgency, promised
date, payment/file readiness, proof and delivery sorting/filtering are still open.
Unavailable/denied reads render fixed feedback without data or fabricated zeros.

Native server-rendered forms use Next server actions plus exact configured Origin
checks. Fields and action names are allowlisted, duplicate fields reject, and
every mutation repeats current DB authority, expected version and UUID operation
checks. The selected URL/view never grants a role. Feedback and redirects are
fixed and local, without provider or SQL diagnostics. Labels, fieldsets/legends,
native required controls, status feedback and mobile-sized controls are provided.

The enquiry draft accepts a manually supplied product code and specification;
it is not a validated commercial catalogue, cart, automatic price or checkout.
Proof approval is not exposed in this dashboard before a genuine private proof
viewer exists. Existing proof APIs cannot justify blind approval. Vendor production
finish still requires stored printing/finishing/packing evidence. QC passing still
requires every checklist item, and delivery readiness requires a current authorized
partner assignment. No dashboard button releases funds or bypasses those checks.

Still missing: full storefront/product/service/pricing management, customer
addresses/saved cloud designs/private files, messages/notifications, receipts,
invoices, financial/refund/payout tools, support/disputes and operational/admin
content/category/settings/analytics/flag interfaces. Do not label these three
order views as the completed dashboard suite.

## Database, RLS, storage and MFA

New sixteenth local forward migration:
`20261021204416_virtual_ink_order_dashboards.sql`. Normalized SHA-256:
`2c54693e49e8f5fc1916ac3e1e7206246b864b20856eec5e9bb6cf293e577abb`.
The genuine Auth runner records that exact hash. It creates one private dashboard
function and no table, login, user, bucket, enablement marker or hosted resource.
The original fifteen files remain unchanged. Both migrations 15 and 16 are
unapplied hosted; staging retains fourteen and original Production remains ten.

The function has a fixed pg_catalog search path and a NOLOGIN/NOBYPASSRLS owner.
It reuses forced-RLS private tables and grants execution only to the restricted
security service, with explicit browser/provider-role execution denial. Temporary
schema CREATE and owner membership are removed after ownership/grant setup.
There are no new permissive public RLS or Storage policies.

Current online user/claims verification is repeated at the gateway. SQL rechecks
the native session/account and active application identity/role after the shared
revocation lock. Customer reads match ownership; vendor reads match current active
tenant membership and assignment. Only ADMIN/SUPER_ADMIN may use general order
oversight, with recent genuine AAL2, required native-hook receipt and signed app
step-up. AAL1, missing proof, another role, revoked membership and logged-out native
sessions deny. Finance/security-specific roles gain no implicit general oversight.
Existing privileged order-specific mutation grants are unchanged.

Private storage work is unchanged from the preceding implementation: quarantine,
signature/scanner checks, purpose-separated promotion, derived production copy and
authorization-checked proxy download libraries exist. This slice adds no hosted
worker, authenticated binary ingress/queue, bucket/IAM, signed-link service,
retention/deletion or private proof-viewer acceptance. The prior 105 real-local-S3/
ClamAV checks remain historical evidence for that source. This run's 113 SQL
workflow checks use synthetic storage metadata; do not conflate these scopes.

Hosted registration, real email verification/recovery, cookie/session lifecycle,
TOTP QR/manual-secret/customer MFA UX, real privileged vendor/financial flows and
private recovery/reconciliation remain unaccepted or incomplete. No recovery-code
scheme was invented. Local actual-engine results below do not certify those flows.

## Verification and measured coverage

Baseline before edits: clean root npm ci --include=dev, 246 root/225 security,
73 web/16 Auth contracts, types/lint/build all passed. Final checks ran on the
reviewed Node 24.22.1 after another clean root install:

| Verification scope | Final actual result |
| --- | --- |
| Complete root suite / coverage | 249 passed, 0 failed, 0 skipped |
| Security test selection | 228 passed |
| Web component/handler checks | 77 passed, including four new dashboard groups |
| Supabase SDK / Next Auth contracts | 16 passed |
| Strict types / source lint / production web build | Passed; zero lint warnings |
| Native PostgreSQL 18 replay | 16 managed-shaped non-superuser migrations, six rollback suites, 108 security assertions passed |
| Workflow/dashboard SQL journey | 113 passed; synthetic provider-shaped session/storage fixtures |
| Genuine local Supabase Auth/MFA | 227 passed; cleanupPassed=true |
| Fresh root and web npm audits | 0 vulnerabilities at every severity |
| Browser artifact security inspection | 67 artifacts, 0 findings |
| Repository heuristic scan | 472 scanned, 128 skipped; 0 findings |

Backend/shared coverage includes **all 50/50 files**, none omitted/unmeasured:
lines **2,975/2,996 (99.30%)**; branches **2,241/2,315 (96.80%)**;
functions **292/299 (97.66%)**. This exceeds the scoped 95% target. Frontend/browser,
SQL, hosted integrations and src/server.js lifecycle are outside that denominator
and are reported separately. Coverage does not establish product completion.

The genuine engine total is 87 baseline + 120 native-hook/factor + 20 workflow
checks. Seven added dashboard checks prove actual customer ownership, another
customer's denial, admin AAL1 denial, customer inability to select admin access,
genuine native/app AAL2 oversight, missing app-proof denial and post-logout DB
revocation. Auth 2.197.0 and PostgreSQL 18 use the preceding digest pins and only
synthetic accounts; no managed users are created. Logs exclude generated secrets.
This is not a full hosted customer/vendor/admin checkout journey or email test.

Local built HTTP: / and /studio return 200; anonymous /customer, /vendor and /admin
return 307 to /login with private no-store; disabled workflow returns 404/no-store.
All sampled responses include nosniff. The task-owned server is stopped; genuine
Auth containers/network and disposable database processes are cleaned/stopped.
Private workflow fixture clusters/logs remain ignored for diagnostics.

The initial Windows restricted-token SQL start failed before migration work.
Managed-shaped replay then caught two migration ownership/grant sequencing errors;
temporary schema CREATE and final membership removal now match the existing
reviewed pattern and cleanup assertions pass. A fixture variable collision and
two UI assertion expectations were corrected. A complete coverage run initially
failed one child-process isolation probe under the restricted token; the isolated
negative test and final complete gate run pass without weakening its guard or
secret-nondisclosure assertions. Failed runs were not treated as acceptance.

## Security findings and hosted read-only checks

An authenticated actor could select another dashboard view, another order/cursor,
or replay a request after membership/session revocation. SQL repeats current
role/resource checks; real controlled negative tests deny those paths. Missing
native/app MFA prevents administrator oversight. Data exposure is limited to a
small explicit order projection; no file path/token/hash/native receipt is rendered.
An audit outage prevents a dashboard response, including otherwise authorized
reads. Forged/duplicate form fields and cross-origin actions do not execute a
workflow command. These are scoped local application controls, not evidence of
an exposed hosted exploit or a provider/OS/AI-platform pentest.

Fresh read-only staging catalog at 21:28 UTC confirms **14 migrations, 29 private
tables with forced RLS, zero Auth users/buckets/runtime LOGIN roles, no workflow
schema, security disabled and native hook disabled**. Organization plan remains
Free. Its security advisor reports one INFO: the intentionally inaccessible
virtual_ink.vendor_reviewer_grant_audits table has RLS and no policy. No new read
policy was added just to suppress that notice. See the
[provider lint explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
No hosted SQL, Auth, role, credential, bucket, IAM, email or billing mutation occurred.

The native MFA hook still needs eligible managed Teams/Enterprise support or an
authorized self-hosted HTTPS target with an adapter review. Existing provider
policies require that receipt; ordinary Free TOTP is not a reason to remove it.
No compatible target or approved test payment/email provider was supplied in
response to the pending clarification. No billable upgrade is inferred.
[Official MFA/hooks](https://supabase.com/docs/guides/auth/auth-hooks) and
[MFA enforcement](https://supabase.com/docs/guides/auth/auth-mfa) support this distinction.

## Remaining launch gates

No integration is classified as Staging verified or Production verified by this
task. Auth/MFA, roles, order reads and workflow foundations are Locally verified
only within the reported scopes. Email-verification request code is Implemented;
actual delivery is unverified. Catalogue remains Mocked/reference data. Server
catalogue pricing, cart/checkout, payment provider/webhook verification, operational
notifications and external error monitoring remain Not started or incomplete.
Local manual quote/payment-status commands do not satisfy those integrations.

Exact production blockers:

- Compatible isolated native-MFA target, actual email provider/controlled inboxes,
  private runtime credentials/CA and real hosted Auth/MFA/recovery acceptance.
- Dedicated Vercel staging first-target routing, verified stable staging hostname
  where available, and genuine full-service Preview with migrations 15/16 applied
  only after compatibility review. Preserve the stop in hosted-acceptance.md.
- Complete all dashboard sections, role workflows and current proof viewer;
  connect worker/ingress/queue, six private buckets/IAM and scan/retention/deletion.
- Approved vendor/product records, authoritative server prices/options/fees/tax/
  discounts, persistent cart, checkout, idempotent payments and receipts. The
  current enquiry code/manual quote is not this commercial flow.
- Approved sandbox/live payment provider, signed/replay-safe webhook ingestion,
  amount reconciliation, failure/abandonment/refund/payout policy and evidence.
  No production payment success is simulated.
- Genuine backend-event notifications, test/production email delivery, security
  changes and operational error monitoring with redacted logs and audited retries.
- Complete required order states, revision comments, delivery lifecycle and
  refund/dispute operations. Existing uppercase local workflow is a foundation;
  payment-pending/out-for-delivery/delivered/refund states are not all implemented.
- Physical Windows Chrome/Edge, Android Chrome, iPhone Safari and tablet where
  available; keyboard/touch, Wi-Fi/mobile data, reduced motion/no-WebGL evidence.
  No new physical-device, keyboard/screen-reader or hosted end-to-end pass is claimed.
- Clean-checkout import/runtime/fallback acceptance, real supplier-approved model
  assets/limits, accessibility audit, performance/load/CWV results, backup restore,
  rollback rehearsal, final human go/no-go and explicit production approval.

Accessibility evidence is component semantics/labels/native constraints and fixed
feedback only. Performance evidence is successful compilation/build, not a CWV,
concurrent vendor load or low-power GPU benchmark. Remaining synthetic data is
restricted to test fixtures; existing public reference/demo catalogue data is not
promoted to live supplier stock. Master prompt 58163 fidelity remains unverified.

## Controlled release and rollback preparation

Keep production unchanged. After resolving the target decisions, capture exact
project/deployment IDs, current production URL/commit/environment fingerprints and
approved change owner. Review private encrypted backup/export and provider backup
capability, restore into an isolated target and record restoration evidence before
any production migration. No backup/restore or rollback rehearsal is claimed here.

Reconcile the target's applied versions/checksums; apply only missing forward
migrations through the reviewed path. Do not replay/alter the fourteen staging
files or ten historical production files. Verify RLS/grants/native-hook receipts,
least-privilege logins and actual service integrations with synthetic staging
accounts, including negative tests. The two new migration hashes are in this and
the preceding report. Do not turn on flags merely to pass deployment guards.

Once every gate passes, prepare a concrete production diff, exact reviewed commit,
credentials configured privately and tested release/rollback evidence for explicit
approval. Only then apply reviewed missing migrations/deploy to the confirmed
production target and run actual customer/vendor/admin MFA, files, order, payment,
notification and monitoring smoke tests.

If a critical defect appears, stop new sensitive intake/worker processing, restore
the previously recorded application deployment/compatible flags, preserve committed
orders/payment/audit history and reconcile unknown provider outcomes privately.
Schema repair uses reviewed forward fixes; never destructive migration reversal
or order/audit deletion. Restoration of a database is a separately reviewed incident
decision because it can discard valid transactions. These are prepared controls;
they are not a rehearsed or approved production rollout.

## Team actions, future scope and report quality

- **Uchi:** supply the compatible isolated target and approved payment/email choices;
  confirm cost separately for any new paid resource. Provide writing block 58163,
  resolve staging routing and safe development contribution/deployment mapping.
  Coordinate real-device testers, policy decisions and eventual release approval.
- **Mumba:** review migration 16/current-session/MFA scopes, actual worker/ingress/
  storage IAM operations, catalogue/pricing/checkout and provider integrations.
  Repeat genuine full role journeys and recovery on one isolated hosted target.
- **Taizya:** review the new order views against the missing master prompt, finish
  dashboard/product/private-proof screens against real contracts, and collect
  keyboard/screen-reader/physical-device evidence. Do not add decorative actions.
- **Lubasi:** validate real products, supplier assets/limits, quote/payment/QC/
  evidence, delivery and refund/dispute/review procedures using approved private
  or synthetic evidence. Identify available physical devices and operational testers.

Recommended Phase 2 work is deferred until Phase 1 acceptance, traction and an
explicit scope decision. Future candidates are measured queue/reporting scalability
and operational analytics after the launch workflows work; no escrow, blockchain
or expanded marketplace implementation is authorized by this report.

The matching Word report uses the repository generator, compact_reference_guide
and memo_masthead. Structural/link/coverage/deployment checks are run before
delivery. Visual rendering is attempted; this workstation lacks LibreOffice/
soffice, so no rendered page-image QA is claimed. No customer files, addresses,
credentials, signed URLs or private vendor evidence enter the report or Git.

Final repository heuristic scan: **472 files scanned, 128 skipped, zero findings**.
The generator's structural audit passes; link/content/coverage/deployment/Word
geometry checks pass. Git whitespace checks pass. Rendering remains blocked by
missing soffice; no visual-QA or human acceptance is inferred.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED
