# Virtual Ink hosted acceptance

28 October **storage provider selected**: Uchi authorizes [Neon private file
buckets](neon-private-storage.md) on a separate storage staging branch. Supabase
remains the database/Auth provider; its historical zero-Storage-bucket catalog
does not describe the newly provisioned Neon buckets. No staging web credential,
service enablement, production mutation or Vercel deployment follows from this
storage setup. Existing identity/MFA, ingress/scanner and release gates remain open.

22 October **current authority update**: Uchi supplied the complete staging master
brief. The missing design-writing input is resolved. Flutterwave sandbox and
Resend staging are selected. The Free-plan MFA Verification Attempt Hook is
**DEFERRED_PAID_CAPABILITY**; earlier compatible-paid-target requirements below
describe the historical policy and are superseded on that point. This does not
make the existing hook-dependent code Free-compatible: the tested AAL2/session/
rate/reauthentication/logging/monitoring/administrator-alert path is still required.
No hook simulation, guard weakening, paid upgrade or production enablement is
authorized. [Current audit and preservation record](phase-1-staging-audit.md).

Fresh read-only catalog confirms fourteen migrations, 29 forced-RLS tables,
zero Auth users, buckets, objects, assignments and runtime LOGIN roles, and no
workflow schema. Vercel metadata still has 25 Preview-only variables, no Git link
or integration inheritance, and only the failed first deployment. No new deploy
or hosted mutation occurred. Stable staging Preview and provider setup remain open.

22 October [customer/vendor MFA follow-up](reports/2026-10-22-customer-vendor-mfa.md):
seventeen local migrations exist; migration 17 passes actual local native-hook
Auth and managed-shaped SQL replay but remains unapplied hosted. The protected
UI-only exact-source Preview is READY with services disabled. Full-service target/
routing stops remain in force; no hosted Auth, roles, Storage or SQL was enabled.

22 October [manual-MFA follow-up](reports/2026-10-22-mfa-manual-enrollment.md):
fresh organization/catalog reads still show Free, fourteen staging migrations,
zero Auth users/buckets, no workflow schema and disabled security/native hook.
Manual enrollment is locally verified only; no provider or SQL mutation occurred.
Ordinary TOTP is Free; the mandated native verification hook is Teams/Enterprise.
The compatible-target and dedicated Preview-routing stops remain in force.

21 October [dashboard follow-up](reports/2026-10-21-order-dashboards-launch-gates.md):
sixteen local migrations now exist; staging still has fourteen, no workflow schema,
no Auth users/buckets/runtime logins and security/native hook disabled. Fresh plan
and catalog reads confirm the same Free target boundary. Migration 16 adds only a
private scoped dashboard function. Both 15 and 16 need review/application on a
compatible target; no hosted SQL or provider mutation was made. The new UI-only
Preview is not this project's full-service acceptance.

Earlier 21 October [backend evidence](reports/2026-10-21-backend-workflows-runtime.md):
fifteen migrations existed locally at that report; acceptance still has fourteen and no workflow
schema, users, buckets or runtime LOGIN roles. Its organization remains Free and
cannot run the required native MFA hook. No hosted mutation was made. The reviewed
runtime is patched to Node 24.22.1; only the separate UI-only Preview has a fresh
hosted build on that patch. This project's deployment stop remains in force.

18 October section 2.1: [Phase 1 release gate](phase-1-release-gate.md) requires
a genuine clean-checkout Preview, secure integrations and physical-device
acceptance. Production promotion requires a documented go/no-go and explicit
authorization. This task adds no provider change or release approval.

18 October user-approved exception: a separate [protected UI test site](vercel-ui-test.md)
is Ready under Vercel's Production label and a restricted `ui_test` profile.
It has no application credentials or enabled sensitive services. This does not
alter this acceptance project's Preview-only boundary or the FAIL verdict below.

Status: **FAIL — incomplete environment, no hosted acceptance**. Production is
read-only throughout this task. See the [inventory and compatibility review](reports/2026-10-16-acceptance-environment-inventory.md).

The dedicated Vercel project is `virtual-ink-acceptance`,
`prj_8IuJeoiJ4FVU3GHytBwPWp4idAEL`, in the existing Vercel team. It has no Git
connection and no inherited integration variables. Its generated domain is
`virtual-ink-acceptance.vercel.app`; it is not a working deployed site.
No production domain is attached. Default deployment protection stays enabled.
The separate Supabase project is `trlhbsgxcsgvfyxezayb`, eu-west-1, PostgreSQL
17.11, in URUUDEV's Org. The provider quoted $0/month. No paid upgrade was made.
The original fourteen migrations are applied, with canonical versions and
normalized checksums verified. All 29 application tables enforce RLS; no public
definer execution or incomplete UPDATE policy was found. Native MFA hook support
is unavailable on this Free plan. Auth and sensitive administration stay disabled.

17 October [verification](reports/2026-10-17-hosted-acceptance-verification.md)
confirms 25 Preview-only variables, fourteen matching staging SHA-256 hashes and
21 hosted permission denials. The explicit Preview attempt created deployment
`dpl_Fmd4yCnc5rB17Xiwttj1YMDyM7uj` with actual target Production inside this
dedicated acceptance project. Its build failed at `ENVIRONMENT_REQUIRED`; no
Preview-only variables were copied to Production and no guard was weakened.
The attempted URL is https://virtual-ink-acceptance-agqz2kg62-shadowrootsec-5679.vercel.app;
it is a failed deployment, not a working acceptance URL. Original Production
deployment/domain/environment fingerprints match the baseline. Staging still
has zero Auth users, zero buckets/objects and only NOLOGIN application roles.

**Deployment stop:** resolve the provider's first-deployment target routing before
another deploy. An explicit CLI target alone did not enforce Preview. Validate
the actual response target and deployment readiness separately. Vercel CLI 58.5.1
rejects `--skip-domain` for Preview because it is Production-only; this was proved
in a UI-project dry run before any deployment. Do not switch to Production to use
that flag. A later reviewed acceptance command needs supported alias safeguards
and verified first-target routing before execution. Do not bootstrap a temporary
Production deployment, relabel the environment, add Production variables or weaken
the build/runtime checks. The
private acceptance wrapper has not been tested against a second deployment; its
old skip-domain invocation must be corrected before review. No successful hosted
full-service build is claimed. [Provider issue 17069](https://github.com/vercel/vercel/issues/17069)
remains open at the 21 October check.

## Provisioning order

1. Explicitly select the Supabase organization. Obtain its project cost from the
   provider and complete the required cost confirmation before project creation.
   Do not upgrade the production organization or repurpose a production/inactive
   unrelated project. The native MFA verification hook needs eligible plan support.
2. Create a new empty Supabase project, preferably eu-west-1 for compatibility.
   Record its safe project reference and version. Never copy production data,
   credentials, Auth users, Storage objects or settings wholesale.
3. Validate the actual project reference against the protected production
   identifiers before every hosted mutation. Keep administrative setup credentials
   in a separate private operator environment, outside Vercel and Git.
4. After target compatibility and operator review, reconcile existing history and
   apply the ordered forward migrations through the reviewed migration path.
   Sixteen local files now exist; files 15 and 16 are not applied to existing staging.
   Never replay or alter already-applied files. Capture version/name and
   normalized SQL hashes. Run catalog/constraints/index/trigger/RLS/function/view
   checks, rollback fixtures and provider security advisors on staging.
5. Privately create only restricted runtime database logins/CA configuration.
   Supply no migration, provisioning, Auth-admin or service-role credential to web
   environments. Record actual controlled synthetic bootstrap authorization.
6. Configure native TOTP, the verification hook and matching `preview` DB markers
   following [the security runbook](phase-1-security-admin.md). The application
   designation is `APPLICATION_ENVIRONMENT=staging`; Vercel's deployment target and
   existing security marker are `preview`. They must agree.
7. Create the requested synthetic role accounts in staging only. Use deterministic
   fixture identifiers and controlled inboxes; generated passwords stay private.
   Include a distinct second synthetic SUPER_ADMIN for dual-approval tests.
   Clearly label all approvals as software fixtures, never human signoff. Retain
   suspended and unverified fixture states. Genuine registration/email acceptance
   needs an approved controlled inbox, not an admin-confirmed shortcut.
8. Provision six private staging buckets with names
   `vi-acceptance-<staging-ref>-<purpose>` for quarantine, customer-originals,
   approved-production-files, proofs, production-evidence and dispute-evidence.
   Keep access closed until the actual file ownership/assignment/scan/audit
   workflow and policies exist. Bucket existence alone is not file acceptance.
9. Set only Preview variables on the dedicated Vercel project, using
   examples/acceptance/staging.env.example. Blank provider bindings intentionally
   fail the build. Use exact staging Site URL and `/auth/callback` and
   `/auth/recovery-callback` redirects. Keep external integrations disabled;
   controlled email can later use a separately reviewed staging-only sandbox.
10. Run `npm run check:environment`, tests/coverage, strict types, lint and build.
    `npm run lint` is configured and enforced by the web build; install root
    development dependencies first. See [scope and exceptions](linting.md) and
    [local verification](reports/2026-10-17-lint-gate.md). This closes the missing
    local command gap, not hosted acceptance or the runtime advisory gate.
    `APPLICATION_ENVIRONMENT=local` or `test` is required for local builds/runtime.
    `NODE_ENV=production` still denotes the optimized build, not a staging target.
11. From a reviewed committed-source snapshot, deploy explicitly to project
    `prj_8IuJeoiJ4FVU3GHytBwPWp4idAEL` with `--target preview` and
    `--local-config vercel.acceptance.json`. Never use `--prod`, `promote`, import
    original project variables, or link a production custom domain. Do not push
    this branch through the original project's automatic deployment integration.
    The acceptance configuration disables Git deployments and retains the same
    public `web` to internal `app` service binding. APP_SERVICE_URL must be injected
    by that binding, never copied from another project or set manually.
12. Record the exact deployment SHA/URL and configure only the new staging alias
    if needed. Test protected routes, secure cookies, headers, no caching of Auth,
    sanitized logs, desktop/mobile flows and all required positive/negative tests.
    Do not bypass deployment protection or extract private browser cookies.

## Environment guard

The build and both runtime entrypoints require explicit local/test/staging/
production designation. Unknown and contradictory designations reject. Staging
requires the dedicated Vercel project binding, a separate managed Supabase
reference, matching origins and exact callback set, an empty webhook set, six
purpose-bound bucket names and disabled external integrations. Runtime storage
remains disabled pending worker/ingress deployment, provider IAM and genuine
file-workflow acceptance; the local worker library alone does not enable it.

Every supplied value is scanned for protected production references, including
encoded/case variants. All service-role/secret Supabase keys and migration/
provisioning credentials are rejected in web build/runtime environments. This
stronger rule rejects production service credentials without fetching them for a
fingerprint. Database URLs must bind the staging reference and use a restricted
non-owner login with verify-full TLS. Public secrets and payment/blockchain keys
are rejected. Errors expose only fixed check codes. This is a configuration guard,
not a replacement for provider IAM, RLS or current-session authorization.

The `.vercelignore` excludes private files, environment files, generated Word
reports, Git/tool state and unreviewed user attachments. A committed-source
snapshot must additionally be reviewed before upload. Do not include private
operator setup environments in a deployment archive.

## Roll forward and stop conditions

Any production identifier in a proposed staging binding stops that setup and its
deployment. Missing/unknown bindings also fail. Never repair staging by changing
production. On a migration failure, retain the failure evidence and current
staging migration history, keep Auth/business enablement off, diagnose against a
fresh disposable local database and add a reviewed forward-only migration. Do
not alter applied historical migrations, drop production objects or copy production rows.
The initial staging attempt exposed an ownership-grant ordering failure in
unreleased migration twelve. It rolled back completely. The three security
migrations had never been applied on any hosted database; they were repaired
before staging application, together with their portable source files. Explicit
temporary INHERIT/SET grants now work for a managed non-superuser administrator,
and are revoked after ACL work. The first eleven applied files were unchanged.
Fresh non-superuser replay, six rollback suites and 108 SQL assertions pass.
Provider history timestamps were aligned to repository versions only after
checksum/count checks on this new staging project. Future changes must use new
roll-forward migrations; do not rewrite any of the fourteen applied files.
Discarding/recreating a failed staging project requires a separate review of its
safe identifier; it is not an automatic recovery action.

The final verdict must remain FAIL until the isolated resources, genuine hosted
MFA/roles/RLS/private files/full order/proof/production verification and all
critical/high security gates pass. A reserved domain, local test or empty bucket
does not establish hosted acceptance.
