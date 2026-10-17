# Virtual Ink hosted acceptance

Status: **FAIL — incomplete environment, no hosted acceptance**. Production is
read-only throughout this task. See the [inventory and compatibility review](reports/2026-10-16-acceptance-environment-inventory.md).

The dedicated Vercel project is `virtual-ink-acceptance`,
`prj_8IuJeoiJ4FVU3GHytBwPWp4idAEL`, in the existing Vercel team. It has no Git
connection and no inherited integration variables. Its generated domain is
`virtual-ink-acceptance.vercel.app`; it is not a working deployed site.
No production domain is attached. Default deployment protection stays enabled.
The separate Supabase project is `trlhbsgxcsgvfyxezayb`, eu-west-1, PostgreSQL
17.11, in URUUDEV's Org. The provider quoted $0/month. No paid upgrade was made.
All fourteen repository migrations are applied, with canonical versions and
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
the actual response target and deployment readiness separately. Use the documented
`--skip-domain` protection in any later reviewed command; it does not repair target
classification. Do not bootstrap a temporary Production deployment, relabel the
environment, add Production variables or weaken the build/runtime checks. The
private wrapper's added response validation and skip-domain flag remain untested
against a second deployment. No successful hosted build is claimed.

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
4. Apply all fourteen reviewed ordered files in supabase/migrations to the empty
   staging database through the reviewed migration path. Capture version/name and
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
remains disabled until its implementation/policies are built.

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
