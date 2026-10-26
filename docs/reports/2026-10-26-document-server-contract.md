# Document-printing server contract

26 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Disabled local backend slice; Phase 1 INCOMPLETE / production NO-GO.**
Production and hosted provider configuration remain unchanged. No human signoff.

## Result and boundary

Document orders can now retain pages, copies, purpose, paper size/type, colour,
sides, binding, urgency and handoff in the existing authenticated order workflow.
The previous four-field merchandise specification could not store those choices.
The new document shape has kind=document and schemaVersion=1. It does not invent
merchandise dimensions, a product code, a price, vendor availability or approval.

TypeScript rejects invalid specifications before SQL. A separate PostgreSQL
validator repeats the contract inside the audited transaction. Local forward
migration 20261026090000 adds document constraints and makes stored specifications
immutable. All seventeen previous migration files remain unchanged. Existing
merchandise rows remain untouched; new merchandise requests now require actual
JSON numeric quantities/dimensions rather than coercible strings.

Public /print-documents remains preparation with local review/download. It does
not submit to this backend. All hosted Auth/workflow/storage/payment/email flags
remain unchanged. No hosted migration, credential, login, seed user, upload,
checkout, email, DNS, promotion or production operation occurs in this slice.

## Verification

Reviewed runtime: Node 24.22.1. Root locked development install passes and reports
zero dependency vulnerabilities; a separate web npm audit also reports zero.
The official October Node advisory still identifies 24.22.1 as a fixed release.
No dependency version changes are made. Source lint, strict web/backend-import
types, optimized web build, 86 web regressions and 16 SDK/Next transport contracts
pass. Those transport contracts use synthetic HTTP dependencies, not hosted Auth.

All 257 root tests and all 233 security-subset tests pass, with zero skips.
All 52/52 backend/shared inventory files are measured, with no missing files:
lines 3,066/3,087 (99.32%); branches 2,300/2,374 (96.88%); functions 301/308
(97.73%). This denominator excludes frontend/browser flows, SQL, process lifecycle
and hosted integrations. It is not a product-completion percentage.

The first restricted coverage run failed the existing build-guard subprocess
test (256 pass, one fail). The identical suite passes outside the Windows sandbox;
no assertion or guard is weakened. Lint then caught a duplicate local variable
name in the new SQL check; that name is corrected and lint passes on retest.

Repository security heuristics pass on 496 scanned files with 135 exclusions and
zero findings after report generation. This is a heuristic check, not a claim that
all excluded binaries, provider infrastructure or the workstation were pentested.
The build preserves the user's pre-existing next-env.d.ts bytes.

All 18 migrations replay successfully as a non-superuser CREATEROLE/BYPASSRLS
administrator; temporary workflow/security-owner inheritance and SET rights are
removed. Six historical SQL rollback suites pass, alongside 123 security assertions
and 217 workflow assertions, including 104 document-specific assertions. These
prove stored option retention through submission/vendor reads/quotation acceptance,
cross-account denial, invalid-input denial with no order creation, immutable specs,
matching retries, conflicting retries and audit-outage rollback. They do not test
the full document-specific production/physical-delivery journey. The synthetic
workflow fixtures stay only in the stopped disposable cluster.

Two earlier attempts stalled on Windows process/output handling before migration
replay. Their exact task-owned clusters were stopped; subsequent bootstrap failures
after those stops are retained as failed attempts, not successful SQL checks.
The runner now redirects controller output and waits for the controller alone,
avoiding a wait for its long-lived background PostgreSQL descendant. The first
successful runner attempt then exposed a CASE-expression parse error in the new
validator. Parenthesizing the expression fixes it; the subsequent complete replay
passes and shuts down its server. The new migration is not applied to any hosted
target, and no historical migration is rewritten. SQL command start/end timestamps
were not separately persisted; no exact timing claim is reconstructed.

## Security review

An attacker would need access to an enabled authenticated workflow, a forged
internal request, or privileged SQL access to reach the changed surface. Strict
field/enumeration/version and numeric bounds reject extra financial/role fields,
unknown options, document names, prototype-property names, markup and coerced or
oversized counts. JSON is bound as a database parameter. No document bytes or
private storage locations enter this specification.

Current ownership, vendor membership, genuine-session checks, recent MFA for
privileged actions, version checks, replay handling and audit rollback are retained
from the existing workflow. The new helper is a private SECURITY INVOKER function;
it adds no direct browser, security-service or scanner grant. The existing command
keeps its private owner and permissions. No authorization bypass is reproduced.

Remaining risks include unverified genuine hosted Auth/MFA, private binary intake,
scanner/storage operations, commercial limits and vendor capability acceptance.
The SQL journey uses provider-shaped fixtures and synthetic SAFE file metadata;
it must not be reported as genuine provider acceptance or malware inspection.
Changing the immutable specification requires a separately reviewed future policy.

Tool actions use synthetic data and loopback-only databases. Browser/document/tool
content is treated as untrusted data. No secrets or customer documents are printed,
copied into reports or staged. No access-protection bypass is attempted.

## Hosting and physical-device limits

The existing UI-only Preview remains the previous source delivery:
https://virtual-ink-ui-test-a95v30h1h-shadowrootsec-5679.vercel.app/print-documents

This turn's navigation times out. The browser snapshot then fails on a browser
inspection capability; its supported DOM fallback yields no usable page evidence.
The temporary tab is cleaned up. Hosted rendering, protection behaviour and
functional acceptance remain unverified. These results do not prove an application
defect or provider outage. No new deployment or deployed backend URL is claimed.
Real Windows/Android/iPhone acceptance remains open.

## Team next actions and rollback

- Uchi: review this disabled contract; approve document limits and prioritize
  genuine isolated staging acceptance before authorizing enablement.
- Mumba: review migration 18 and SQL evidence, then connect private binary intake
  and complete identity/file/order transport without weakening the MFA boundary.
- Taizya: review terminology and the eventual full submission/error journey;
  collect named physical-device and accessibility evidence when hosting is usable.
- Lubasi: confirm supported stocks/sizes, binding capacity, commercial rates,
  turnaround and collection/delivery responsibilities with approved vendor evidence.

No schema rollback is needed on a hosted provider because none is changed. Keep
workflow disabled. Any future applied-schema rollback must use a reviewed forward
migration; preserve historical migrations and customer data. Source-only reversal
uses a reviewed revert on the review branch, preserving unrelated work. No main
merge, force push or release approval is implied.

## Evidence references

- [Document scope and setup](../document-printing.md).
- [Existing workflow boundaries](../order-storage-workflows.md).
- [Node security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
- [PostgreSQL function ownership, invoker/definer and replacement rules](https://www.postgresql.org/docs/18/sql-createfunction.html).
- [Supabase changelog](https://supabase.com/changelog): reviewed; no relevant provider feature change is used. Markdown index fetch was unsupported, so the HTML index was read.

Source commit: 5419117d79d5f6fc8c4d0e5f235e12043f4d6e1b on
feature/phase1-staging-readiness. The review-branch push exits 0; an independent
git ls-remote read confirms that exact commit on origin. The following report-only
commit carries the Markdown/Word handover without changing application bytes.
No main merge, staging PR or Vercel deployment occurs.

The Word copy uses the existing compact_reference_guide/memo_masthead report
generator and its named title/code/table overrides. Its OOXML package/style audit
passes, as do matching Markdown/Word evidence, local-link and privacy checks.
Rendered Word QA is unavailable: the renderer fails with WinError 2 because
LibreOffice/soffice is missing. No visual pagination or layout approval is claimed.
Final Git whitespace validation passes; line-ending normalization notices remain.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED
