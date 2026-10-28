# Static public UI release verification

28 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Static candidate READY; hosted application checks blocked by deployment
protection. Public promotion pending. Phase 1 is INCOMPLETE / NO-GO.**
The existing release worktree records Uchi's approval of public UI-only scope
with Auth, orders, uploads, payments and email disabled. This report consolidates
the unfinished 27 October handover without claiming human signoff.

## Deployment and source

Candidate: d881cad646299bf0c5c8c267ff08a7a5a2921220 on release/main-20261026.
Deployment: dpl_5G7FZahWN2RjFkoF9PP1VGubCxrX.
Protected URL: https://virtual-7gkqrft1d-shadowrootsec-5679.vercel.app.
The 28 October deployment uses Production with skip-domain in the original
virtual-ink project. Source metadata matches; its fresh hosted build is READY.
Logs establish passing lint, Next.js 16.4.2 compilation and a static-output audit
with zero request-time functions. No public promotion or main push occurs during
this resumed verification.

Read-only deployment listing established that the earlier interrupted upload
created no deployment before retrying. The successful retry audits 491 upload
files, excluding private configuration, local directories, Word reports and
generated development types. The root workspace's next-env.d.ts, local skills,
configuration and supplied attachments are preserved.

A successful remote-head read during resumption finds main and the review branch
at 284bcdb75c4da7705d4f1c9890960436b94c422a, the earlier dynamic source. Final
review-branch publication evidence is appended below when available.

## Previous failure and prepared repair

The earlier dynamic release built successfully but the request-time runtime
guard returned RUNTIME_SECURITY_PATCH_REQUIRED. Saved 27 October evidence records
seven private-page 500 responses and health 503; the actual hosted Node patch
is not established. The initial manual deployment was
dpl_DSNuHFDemCMNX6P8uBDvqo5oZCza; the last saved stable-alias read identified
dpl_65Rzx46DZRg121Zi3C2kNUsV2Xph. Neither is a fresh alias read for this report.
Rollback to dpl_2Y7DwP53AN71BWVRqZMjLreGz13E was rejected with HTTP 402 because
the plan allowed only the immediately previous production deployment. The older
baseline was not restored. Rollback rehearsal remains open.

The prepared repair exports public pages into Vercel's static Build Output API,
retaining full-service source and runtime/security guards. vercel.services.json
preserves the service graph. Catalogue query links use a client component under
Suspense. Preparation stays local: no order submission or private document upload.
CDN rules redirect private pages to disabled login, return workflow 404s and
explicit public-ui-only 503s for APIs/health. These are service denials.

## Verification and limits

Fresh hosted checks make 22 read-only requests; all return 302 toward Vercel
deployment protection. No application pages, private redirects, disabled-service
responses, images or bundles are verified. Zero bundles are inspected. The check
exits failed and blocks promotion. Normal authenticated browser access is needed;
Chrome previously timed out and fails to connect after the server restart before
browser control is available. No protection bypass or token extraction is used.

Fresh local checks pass all five static-release negative test groups: disabled
configuration/project binding, server-source exclusion, private/missing output
rejection, symlink denial and CDN path boundaries. The successful run has zero
failures/cancellations/skips. A preceding sandbox runner fails with spawn EPERM;
the approved rerun passes using the repository's test-isolation convention.
Intermittent Windows process-start denials are retained as tool failures.

The unchanged candidate's retained 27 October verification passes 262 root tests,
233 security-subset checks, 86 web checks, 16 synthetic SDK/Next contracts,
zero-warning lint and the final static build. The local export audits 273 files
and zero functions. Earlier failed builds remain in private evidence, superseded
by the final passing run. These full suites are dated evidence, not fresh reruns.

All 52/52 backend/shared inventory files are measured without omissions/skips:
lines 3,066/3,087 (99.32%); branches 2,300/2,374 (96.88%); functions 301/308
(97.73%). Aggregate unit coverage exceeds 95%; individual files may be lower.
Frontend/browser behavior, SQL, process lifecycle, genuine hosted services and
the static export builder are outside that denominator.

The resumed repository heuristic check passes on 427 files with 130 exclusions
and zero findings. Its limited text rules exclude history, private configuration,
binaries and complete deployed bundles. No new runtime/dependency change or
fresh advisory acceptance is claimed.

## Scoped security review

Anonymous callers could reproduce the earlier private-route availability failure;
data access or privilege escalation is not demonstrated. Static output removes
request-time application execution for public scope; functional checks stay open.
Local tests reject sensitive enablement, wrong production project, missing flags,
private output, symlinks and misleading path prefixes.

The prior handover records sixteen explicit nonsecret production settings read
back with services/integrations off, preserving sixteen inherited entries. This
is historical evidence. No provider setting, Auth user, migration, bucket, DNS,
credential or commercial service is changed during this resumption. Ten production,
fourteen staging and eighteen local migrations remain dated readiness evidence;
no fresh hosted SQL/Auth acceptance is claimed.

MFA compensating controls, private intake/scanning, approved prices, sandbox
payments/email, physical devices and release gates remain open. Tool output is
treated as data. Network errors, process denials and browser connection failures
do not establish application vulnerabilities or approval. No customer data,
live funds, destructive probes or simulated human approval are involved.

## Team next actions

- Uchi: establish normal authenticated access to the protected candidate with
  the authorized Vercel account. Review hosted results before public promotion;
  retain full-service NO-GO and resolve commercial decisions.
- Mumba: finish page/asset/CDN/bundle checks, then controlled promotion and
  stable-alias verification. Resolve isolated runtime, migration, MFA and storage
  prerequisites before sensitive service enablement.
- Taizya: check catalogue deep links, studio and document preparation on physical
  devices and with accessibility review; record actual findings and human review.
- Lubasi: confirm paper/binding capability, prices, turnaround, fulfilment,
  refund/retention and operational approvals before genuine order intake.

## Delivery and next release step

The matching Word report uses the existing compact_reference_guide generator
and memo_masthead conventions. Its OOXML/package/style/table structural audit
passes. Rendering is attempted and exits 1 with WinError 2 because LibreOffice
is unavailable; pagination and visual Word QA are not claimed. Final root
repository heuristics pass on 498 files with 137 exclusions and zero findings;
whitespace checks pass. This broader working-tree scan has a different inventory
from the 427-file isolated candidate check above. Report delivery does not close
Phase 1. Git publication evidence is recorded in the final handover below.

Next: authenticate normally, verify the candidate's public pages/assets/scripts
and private/API denials, publish reviewed source to main after required checks,
promote the verified build, read back the stable alias and repeat functional
checks. Preserve a compatible static rollback reference and record actual
rollback evidence separately.

## Git publication evidence

The non-force review push exits 0. Independent remote-head readback confirms
1842c1ba9b80bfc2c721d7102d34b3f67d69439f on feature/phase1-staging-readiness and
f6bd316b2fe4e3fed1411bd057d0c486afac2e28 on release/main-20261026. Main remains
284bcdb75c4da7705d4f1c9890960436b94c422a. The release report commit preserves
all tested application bytes from d881cad; the cherry-pick conflict in the open
questions document is resolved by retaining both the existing scoped approval
and the current verification blocker. Subsequent report-only commits carry this
publication evidence. Review pushes can trigger Git automation; no new successful
Preview, public promotion or human acceptance is inferred.
