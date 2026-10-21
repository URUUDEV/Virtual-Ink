# Backend workflows and runtime security

21 October 2026. Shadow Root Security Technologies / Virtual Ink.

**Status: local backend review candidate; hosted backend and Phase 1 INCOMPLETE / NO-GO.**
Owners: Uchi Chinyama and Mumba Chitonge. This report records implementation,
actual verification and remaining deployment decisions. No human signoff is inferred.

## Result and source

Customer intake, immutable quotes, manual payment status, vendor proof versions,
customer approval, production evidence, QC correction and delivery handoff now
have a transactional backend. Private file quarantine, scan, promotion, production
copies and authorization-checked downloads have worker libraries and SQL gates.
The Next.js workflow route is present but defaults disabled. These capabilities
have not been enabled on a hosted backend or connected to complete product UI.

Source commit: `ab12c799ec8d6fd1c8ee9e90889d07fa26f7ee5d` on
`codex/phase1-order-storage-runtime`, parent
`ff4a2783ea22f3ef864cd422b8dba4b5132d832f`. Twenty-three reviewed source/runbook
files were committed explicitly. The user's apps/web/next-env.d.ts edit,
attachments, .agents directory and skills-lock.json were preserved and excluded.
No Git push, access grant, message to a teammate or production promotion occurred.
The original project's automatic Git deployment mapping is not a safe development
target; source sharing and development mapping still need resolution before push.
The standing push-after-phase rule is not triggered by this incomplete phase.

Implementation contract and replay instructions:
[order/storage runbook](../order-storage-workflows.md). Earlier
[inspection report](2026-10-21-private-file-inspection.md) remains historical.

## What changed

All workflow commands reject unknown fields and use current server-derived
identity, active roles, order scope, expected versions and bounded request budgets.
Mutations, idempotency and immutable audit commit together under READ COMMITTED;
audit failure rolls the mutation back. Reads recheck authority on every retry.
The conservative advisory lock also serializes existing privileged role writes;
load/throughput acceptance remains open.

Assignment, manual payment confirmation and delivery assignment require a current
order-specific grant/reason, recent native MFA, its native-hook receipt and the
application step-up proof. Vendors cannot self-assign, approve their own proof,
read customer originals or select a delivery actor. Delivery users receive a
minimal projection and cannot read files. Quotes, proofs, evidence and QC records
are immutable. Production requires payment and the latest customer-approved proof;
QC failure requires correction and fresh evidence before readiness.

Migration `20261021095139_virtual_ink_order_workflows.sql` is the fifteenth
**local, unapplied-hosted** forward migration. Normalized SQL SHA-256:
`e0332f21cb77ab4e9d66f2bee4f1e4918ada46393ff99a6f160c5df752fe0654`.
It adds ten forced-RLS tables in a private schema, a disabled configuration marker,
a NOLOGIN owner and a restricted scan group. Runtime groups receive bounded
function execution, no direct table DML or Auth-schema access. Temporary owner
membership is removed in replay. The original fourteen migration files are unchanged.

The private worker owns incoming bytes, verifies stored content and hashes,
performs real inspection/scanning, separates six private storage purposes and
records the outcome transactionally. Late scans cannot replace frozen source or
obsolete proof context. Uncertain external outcomes stay REVIEW_REQUIRED. Approved
production copies derive from the paid, latest approved proof/hash. Downloads
audit access before storage I/O, recheck authority afterward, verify full bytes
and return fixed attachment headers with no-store, nosniff and sandbox CSP.

The native Signature V4 S3 adapter uses server-owned endpoints, HTTPS except
explicit local loopback, immutable UUID keys, write-if-absent and conditional
reads; it follows no redirects or retries. Supabase S3 has no native bucket
versioning: the objectVersion field is a location/ETag receipt plus full-byte hash
verification. No raw signed URL or public bucket is created. Worker DB/S3 secrets
must stay outside Next.js and Vercel web environments.

Worker hosting, authorized binary ingress/queue/internal transport, production
scanner operations and provider IAM are still unbuilt or unaccepted deployment
work. Library tests do not establish an accessible hosted upload/download journey.
Organization/designer/override and recovery/reconciliation journeys remain open.
Commercial print limits, quotation caps, QC rules and decline/dispute operations
are candidate policy, not business approval. No funds, refunds, courier automation,
escrow or blockchain integration executes.

## Runtime security repair

During this work the official October advisory changed from preannouncement to
published fixes. The reviewed minimum is now stable Node **24.22.1**, released
20 October, with the advisory updated 21 October. Root engines, lockfile,
.node-version and shared runtime/isolation policy agree. Old Node 24.22.0 is
rejected with RUNTIME_SECURITY_PATCH_REQUIRED in the production isolation probe;
24.22.1 passes the same probe and the reviewed security-release gate. This fixes
the known October HIGH baseline for the tested local runtime; it does not certify
all installed runtimes, future advisories or the original production project.

The official Windows x64 ZIP SHA-256 is
`d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5`;
the downloaded archive matches official SHASUMS and node.exe has a Valid OpenJS
Foundation Authenticode signature. No application dependency was added.
Both locked root and web npm audits report zero advisories at every severity.

Sources: [Node advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases),
[official release index](https://nodejs.org/dist/index.json) and
[official checksums](https://nodejs.org/dist/v24.22.1/SHASUMS256.txt).

## Verification evidence

Final local gates ran on Node 24.22.1 after root npm ci --include=dev. Counts
below describe different scopes and must not be summed into a product pass rate.

| Check | Actual result |
| --- | --- |
| Complete root suite with coverage | 246 passed; 0 failed, 0 skipped |
| Security selection | 225 passed |
| Web unit/contract checks | 73 passed |
| Auth SDK / Next contracts | 16 passed, including final gateway-cookie changes |
| Source lint / strict web types / local web build | All passed; lint zero warnings |
| Genuine local Auth/MFA | 220 passed: 87 baseline, 120 guard/factor, 13 workflow Auth |
| Managed-shaped PostgreSQL 18 replay | All 15 migrations; six historical rollback suites; 108 security assertions passed |
| Workflow with actual local S3 and ClamAV | 105 checks passed |
| Checked-in standalone SQL replay runner | 95 workflow checks passed in synthetic metadata mode, plus the 108 and six suites |
| Root and web dependency audits | 0 vulnerabilities, all severities |
| Browser artifact security scan | 64 artifacts; 0 findings |
| Repository heuristic security scan | 460 files scanned, 126 skipped; 0 findings |

Coverage inventories **all 49/49 backend/shared files**, with no missing source:

| Metric | Exact covered / measured | Percentage |
| --- | --- | --- |
| Executable lines | 2,919/2,940 | 99.29% |
| Branches | 2,195/2,269 | 96.74% |
| Functions | 288/295 | 97.63% |

All exceed the 95% scoped target. This denominator excludes frontend/browser,
SQL, hosted services and src/server.js process lifecycle. Those checks are
reported separately; coverage is not product completion. Local built-web smoke
returned / and /studio 200, anonymous /api/v1/me 401, and both workflow probes
404 while disabled, with nosniff headers. No new hosted browser/device or visual
UI acceptance was performed. The task-owned local server is stopped.

The 105-check workflow run uses provider-shaped session fixtures, actual private
S3 objects and the actual ClamAV engine. It covers the order/proof-change/approval/
production/QC-failure/correction/delivery/dispute journey, derived production copy,
anonymous S3 403, overwrite and wrong-ETag 412, full-hash downloads, real harmless
EICAR-in-PDF quarantine, late-scan downgrade, superseded-proof retry denial,
cross-tenant denials, true concurrent transitions and transactional audit outage.
Direct runtime private table reads/writes deny with 42501; immutable edits deny
with 23514. Fixture mutations are confined to disposable stopped local clusters;
workflow fixture data remains in ignored private diagnostic directories.

Local storage engine: MinIO RELEASE.2026-09-22T19-25-18Z, digest
`sha256:32c504bea4574d8f29d719b37bc0dad920ecf3e22b81dc5cea0bb105af2ce10f`.
Scanner: ClamAV 1.5.4, digest
`sha256:e19130cdebaeacc71fa46eab3ed6f69941f2f22aa5e08d55e9197f8edf43ce5e`,
signature snapshot 28157 dated 18 October. Both used loopback-only ports,
nonroot users, read-only roots, bounded tmpfs/resources and dropped capabilities.
The exact task-labelled containers were stopped/removed. This bundled signature
snapshot is evidence for the check, not a production freshness process.

The separate genuine Auth run uses Supabase Auth 2.197.0 and PostgreSQL 18 with
synthetic accounts, not mocked provider success. Thirteen new checks verify real
primary-session order creation, other-customer denial, role-injection rejection,
AAL1 privileged denial, native TOTP plus application step-up, missing-proof denial
and logout/current-native-session rejection. The privileged AAL2 test reaches the
state guard on a draft order; it does not claim a successful real vendor assignment.
It records the exact migration hash above and cleanupPassed=true. All 220 passed.
It does not prove email delivery, physical QR scanning, a Vercel browser session
or the entire commerce journey with genuine identities and storage on one host.

Reproducibility: scripts/replay-order-workflows.ps1 runs the checked-in replay
without private helper dependencies; its RealStorage mode requires privately
configured synthetic loopback engines. scripts/genuine-mfa-local-check.mjs is
the separate genuine provider runner. coverage/backend-summary.json and
coverage/genuine-mfa-local.json record exact local results.

## Scoped security review

An authenticated actor could try reusing a previously authorized file-access
operation after a proof becomes obsolete. This conditional attack path is covered
by a reproducible denial: read retries now recheck current authority instead of
replaying a cached access receipt. A scan finishing after submission could replace
the frozen source; the controlled race now records REVIEW_REQUIRED. A revocation
during storage I/O is checked again before returning the verified content.
No exposed hosted business route was exploited in these local tests.

An assigned vendor attempting to select a delivery actor is denied; only a scoped,
fresh-MFA privileged operation can assign delivery. Mass-assigned role/state/price,
another customer's order, stale proof, unsafe content and direct private-table
access deny. An unavailable audit sink rolls back state, and two concurrent
versioned writes cannot both transition the order. These tests address unauthorized
disclosure, actor substitution, stale authority and unaudited state changes.

The raw-HTTP duplicate-Authorization fixture initially failed under full coverage
because the helper half-closed TCP before an asynchronous denial. It now writes
the request and waits for server closure; the unchanged 401, provider-zero-call,
nonreflection and health assertions pass in the complete suite. Initial local
storage readiness and redirected pg_ctl output setup failures were corrected
before the successful replays. They are not application vulnerability findings.

Tool output was treated as untrusted; no credential disclosure, destructive scan,
privilege expansion or production mutation was used. This is a scoped application
review, not an AI-provider, operating-system or hosting-platform pentest. Media
sanitization, fresh scanner operations, provider IAM, recovery and hosted security
acceptance remain separate risks/checks.

## Actual hosted evidence and blockers

The protected **UI-only** Preview is READY:
[open deployment](https://virtual-ink-ui-test-68jidagxn-shadowrootsec-5679.vercel.app).
Project prj_aqLrX1gsSVb1XINH5YNGkp1aYazH; deployment
`dpl_EaqbxoLcjZWWW3h2x9ThphEuz3bX`; exact source ab12c799ec8d6fd1c8ee9e90889d07fa26f7ee5d.
Read-only metadata at 20:28 UTC confirms environment preview, non-Production
target, buildSkipped=false, zero aliases/automatic aliases and no automation-bypass
binding. The clean committed snapshot uploaded 446 reviewed files. Logs confirm
skipped build cache, locked development install, ui_test isolation with node
24.22.1, source lint, successful compilation and Build Completed. Project protection
remains enabled. No bypass token was minted or used.

This proves a fresh UI-only build on the patched runtime. Auth, database,
security administration, storage, uploads, orders and payments remain disabled;
WORKFLOW_ENABLED is absent/off. No hosted business-session or full backend runtime
acceptance follows from this result. Original production is unchanged.

Vercel CLI 58.5.1 rejected --skip-domain during the initial Preview dry run because
that flag is Production-only; no deployment was created by that failed dry run.
The separate UI-only Preview used explicit preview without that flag. The dedicated
full-service acceptance project's first-target deployment stop remains intact:
[provider issue 17069](https://github.com/vercel/vercel/issues/17069) was still open.
No temporary Production bootstrap, variable copy, target relabelling or guard
weakening was attempted. See [acceptance runbook](../hosted-acceptance.md).

Fresh read-only Supabase checks confirm acceptance project trlhbsgxcsgvfyxezayb
is healthy on PostgreSQL 17.11 and its organization is **Free**. It retains fourteen
migrations, 29 forced-RLS tables, zero Auth users, zero buckets and no runtime LOGIN
roles. Security and native hook remain disabled; workflow schema is absent.
The security advisor reports one INFO for an RLS-enabled audit table without a
policy, consistent with its intentional denial boundary; no read grant was added.
No hosted SQL, role, Auth, bucket or credential change was made. Original production
remains at ten migrations. The fifteenth local migration is not deployed there.

The required native MFA verification-attempt hook remains Teams/Enterprise-only
on managed Supabase. A compatible existing isolated target or authorized
self-hosted HTTPS target is still missing. No billable upgrade or project creation
is inferred from the request. A self-hosted target also needs a reviewed URL/key
adapter, not the local transport rewrite. Current plan evidence:
[official Auth hook availability](https://supabase.com/docs/guides/auth/auth-hooks).
Storage versioning limit:
[official S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility).

## Next actions and decisions

- **Uchi:** supply a compatible isolated Auth target and resolve acceptance Preview
  routing; confirm cost separately if a new paid resource is chosen. Establish safe
  development source sharing/deployment mapping. Review candidate commercial and
  exception policies; coordinate real devices and the eventual human go/no-go.
- **Mumba:** review migration 15/private owner grants, worker/ingress/queue hosting,
  six-purpose IAM and fresh scanner operations. After target selection, reconcile
  forward migrations and verify actual-role denials, real Auth/email/cookies/MFA,
  recovery and full customer/vendor/operator journeys on one genuine Preview.
- **Taizya:** map the implemented states and typed denials into accessible customer,
  vendor and operator screens; retain unimplemented-flow labels. Resume physical
  device and interrupted studio-state investigation with exact evidence. Use the
  development handover only after Uchi establishes the safe contribution target.
- **Lubasi:** validate print/size/price limits, proof/QC checklist, production-stage
  evidence, manual payment references, delivery handoff and decline/dispute/review
  operations using approved synthetic or redacted private evidence.

Open decisions are recorded in [open questions](../open-questions.md). Required
integration classifications, physical devices, complete lifecycle/recovery,
rollback rehearsal and explicit release authorization remain open. No phase or
business acceptance checkbox is closed by this report.

## Report quality and final verification addendum

The matching Word document is generated with scripts/generate_team_report.py,
compact_reference_guide and memo_masthead. Structural checks verify links, exact
coverage denominators, content and Word table/style geometry. Visual rendering
is attempted separately; missing LibreOffice/soffice prevents page-image review
on this workstation. No visual-QA pass is claimed.

Final repository heuristic scan: **460 files scanned, 126 skipped, zero findings**.
The generator's structural document audit passed. Report link/content/coverage and
Word geometry checks pass; rendered page inspection remains blocked by missing
soffice. Git whitespace review passes; unrelated user work remains unstaged.
