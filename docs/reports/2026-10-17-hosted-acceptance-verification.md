# Virtual Ink — Isolated acceptance verification

Date: 17 October 2026. Phase 1: **PARTIAL**. Hosted acceptance: **FAIL**.

## Scope and current result

Resumed source `075973ae702a1c14fa925cbae572ad49ba3a48ef` on
`codex/phase-1-hosted-acceptance`. This handover verifies its isolation guards,
managed migration compatibility and existing isolated resources. No product phase,
genuine hosted Auth journey or human signoff is complete. The existing
`apps/web/next-env.d.ts` edit and supplied attachment directory are preserved.

The dedicated Vercel project is `virtual-ink-acceptance`,
`prj_8IuJeoiJ4FVU3GHytBwPWp4idAEL`. Read-only verification finds 25 variables,
all Preview-only, no inherited integration variables, no Git connection and no
Production application domain. Default deployment protection remains enabled.
The staging provider is `trlhbsgxcsgvfyxezayb`, PostgreSQL 17.11. All fourteen
canonical migration versions, names and normalized SQL SHA-256 hashes match the
repository. All 29 application tables have enabled and forced RLS. All eight
application roles remain NOLOGIN, NOSUPERUSER and NOBYPASSRLS. There are zero Auth
users, zero Storage buckets and zero Storage objects. Bucket declarations in
configuration do not create buckets or establish file acceptance.

The resumed task made no hosted database, Auth, Storage, role or provider-plan
change. The fourteen staging migrations were already present at inspection.
Application Auth, privileged administration and storage remain disabled. The
staging Free plan cannot supply the required native MFA Verification Attempt hook;
official [hook availability](https://supabase.com/docs/guides/auth/auth-hooks)
still lists Teams/Enterprise. No paid upgrade or recovery/bootstrap approval is
inferred from resuming this work.

## Deployment failure and containment

A committed-source snapshot excluded private directories, environment files,
Word reports, user attachments and the existing generated type edit. The fresh
CLI manifest contains 320 upload files and zero forbidden paths. The snapshot
uses the dedicated project ID, explicit `--target preview`, acceptance-specific
configuration and the exact source SHA; it does not use `--prod` or promotion.

Vercel nevertheless created `dpl_Fmd4yCnc5rB17Xiwttj1YMDyM7uj` with actual
target `production` inside the acceptance project. Its attempted URL is
https://virtual-ink-acceptance-agqz2kg62-shadowrootsec-5679.vercel.app.
This is a failed deployment URL, not a working Preview or acceptance result.
The provider reports ERROR / BUILD_UTILS_SPAWN_1. Build events confirm
`ENVIRONMENT_REQUIRED`: Preview-only application configuration was unavailable
in the incorrectly selected environment, so the environment guard stopped build.
Alias assignment is false. No successful source hosting is claimed.

This resembles the first-deployment target behavior reported in the upstream
[Vercel issue](https://github.com/vercel/vercel/issues/17069); that similarity is
an inference. Actual target, error state and guard code above are directly
observed. The private deployment wrapper now parses the nested deployment object,
records requested and actual targets separately, rejects an unexpected target,
and adds the documented [skip-domain option](https://vercel.com/docs/cli/deploy#skip-domain).
These wrapper changes were reviewed but not exercised in another deployment.
No further deploy, temporary Production bootstrap, environment relabelling or
guard removal was attempted. A supported Preview-only creation path remains open.

The original Production project is separately protected. Fresh read-only Vercel
comparison confirms the same deployment, source SHA, project fingerprint,
domain fingerprint and encrypted-environment fingerprint as the saved baseline.
Production remains `a6736376b09ba7c3242495ff86b4bb2eea62f20c`, deployment
`dpl_7f4Kj1XeRy1Mf3MrQiSV9PEs7PWB`, at https://virtual-ink.vercel.app.
Its catalog still has ten migrations, eighteen forced-RLS application tables and
no Phase 1 assignment or security schema. No Production mutation was performed.
These checks establish configuration preservation, not fresh product acceptance.

## Actual verification

Application tests use the reviewed private Node 24.21.0 runtime. Vercel CLI 58.5.1
used the default Node 24.14.1 for operator commands; it does not pass the application
runtime minimum and is not evidence of a patched hosted runtime. All executed final
local regression suites below pass; blocked hosted gates remain separate.

| Check | Actual result |
| --- | --- |
| Complete root suite under measured coverage | 206 passed; zero failed/skipped |
| Explicit security subset | 195 passed |
| React/mesh rendering | 11 passed; includes acceptance banner |
| SDK/Next adapter with synthetic HTTP | 16 passed |
| Backend/shared unit inventory | 39/39 files measured; none missing |
| Lines | 2178/2192 = 99.3613% |
| Branches | 1630/1682 = 96.9084% |
| Functions | 204/207 = 98.5507% |
| Web and strict backend/shared types | Passed |
| Optimized local build | Passed; sixteen static pages and dynamic routes |
| Runtime static minimum and repository heuristics | Passed; advisory gate remains open |
| Root and full web npm audits | Zero known vulnerabilities in each |
| Generated browser text artifacts | 53 scanned; zero matching credential/token/enrollment-secret patterns |
| Managed-shaped local SQL replay | Fourteen migrations as non-superuser CREATEROLE/BYPASSRLS administrator; temporary owner INHERIT/SET rights removed |
| Existing SQL rollback suites | Six passed |
| Local restricted security SQL | 108 assertions passed; zero checked business-row residue; instance stopped |
| Genuine local Auth/MFA rerun | 207 passed: 87 baseline plus 120 provider-guard/replacement checks; labelled container/volume/network cleanup passed |
| Staging migration fingerprints | All fourteen canonical versions/names/normalized SHA-256 hashes match |
| Staging direct permission denials | 21/21 passed using the reviewed rollback fixture; no persistent grant/data change |
| Staging security advisor | One INFO, no higher-severity notice |
| Vercel acceptance source build | FAILED after unexpected Production classification; guard stopped build |
| Hosted browser, cookies, workflows and logs | Not accepted; no working Preview |
| Lint | Not configured; remains an explicit gate |

Coverage measures backend/shared unit source. Frontend/browser, server lifecycle,
SQL, genuine Auth integration and hosted product acceptance have separate scopes.
SSR and synthetic SDK checks do not establish browser or email acceptance.

The first genuine rerun stopped during preparation because Docker was unavailable,
with cleanup passing. Docker Desktop was found in its per-user installation and
started in the background before retrying. The final genuine run, started at
2026-10-17T09:40:40.097Z, passed all 207 checks and cleanup. It uses digest-pinned
real Auth/PostgreSQL engines, synthetic identities, the source gateway/controller
and private commands with a loopback transport rewrite. It does not run a deployed
Next server, deliver email or scan a physical QR. Provider replay, concurrency,
cooldown, missing-receipt, disabled-hook and log-redaction checks pass.
An initial migration comparison used
space-only SQL trimming against Python whitespace trimming and falsely reported
mismatches. Matching newline and whitespace normalization resolves all fourteen
SHA-256 comparisons; no source or hosted migration was edited to obtain that result.

## Security review and remaining gates

An operator misbinding staging to Production is a configuration threat with
potential cross-environment data access. Synthetic isolation tests cover protected
identifiers, encoded references, privileged credentials, contradictory targets,
callbacks, database ownership/TLS and disabled integrations. The observed provider
target mismatch stopped build before the application could run. No credential
disclosure, unauthorized role grant or cross-tenant exploit was reproduced here.
The reviewed 21 staging probes reject ordinary-role role mutation, audit deletion,
security command execution and service-role direct configuration/table writes.

The single advisor INFO is the intentionally closed
`virtual_ink.vendor_reviewer_grant_audits` table with RLS and no ordinary policy.
Keep it closed; review the [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
before implementing a separate authorized reader. This is not a reason to grant
browser access. Current [Node security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still announces HIGH fixes for 24.x on or shortly after 21 October. Passing the
static minimum and clean npm audits do not clear that release gate.

Tool outputs and upstream issue text were treated as data. No suggested promotion
command was executed. No credentials, tokens, QR secrets, private inboxes or signed
URLs are included in this report. Only reviewed catalog reads and the existing
rollback fixture reached hosted databases. This is a scoped application review;
it does not establish provider, operating-system or whole-production security.

Open gates include the native hook-compatible isolated target, supported Preview
creation, restricted runtime database login/CA, controlled inboxes, genuine hosted
registration/MFA/role and recovery acceptance, private Storage implementation,
order/proof/production/QC workflows, configured lint, runtime security resolution
and the remaining Vercel/manual acceptance checks. No final Phase 1 group closes.

## Team actions and delivery

- Uchi: resolve the compatible isolated Auth hosting choice and Preview-only
  deployment path; retain Phase 1 scope and record actual human acceptance later.
- Mumba with Uchi: review the managed replay and guard evidence; resolve Vercel
  target routing without Production bootstrap, then complete restricted connection,
  controlled identity setup and genuine hosted denials. Use forward migrations
  for any later database change; preserve all fourteen applied staging files.
- Taizya: review the acceptance banner and Auth/admin states once a working
  protected Preview exists; full browser/accessibility acceptance remains pending.
- Lubasi: supply the controlled operations/recovery review and synthetic acceptance
  criteria; retain real vendor files and private identity evidence outside Git.

The tested source remains the existing local commit `075973a`. This handover is
documentation only after verification. No Git push, merge or promotion is made:
the original repository still has automatic deployment integration, and the
acceptance runbook prohibits using it for this branch. The phase-completion
commit/push rule has not been triggered because Phase 1 remains incomplete.

The matching Word report uses the existing generator and compact-reference preset.
Its OOXML/package and fixed table geometry audits pass. The packaged renderer
was attempted with the managed Python runtime and failed to launch LibreOffice
(WinError 2; executable absent). Visual pagination was not verified. Privacy and
OOXML checks pass for the final report; all 235 local links across the ten reviewed
Markdown files resolve. Historical reports are preserved.
