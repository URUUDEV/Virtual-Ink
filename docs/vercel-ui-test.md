# Shadow Root Vercel UI test site

20 October [studio preview safety](reports/2026-10-20-studio-preview-safety.md)
repairs obsolete paint failures, layout status/retry and temporary-canvas cleanup.
The [protected repair Preview](https://virtual-ink-ui-test-bqgq1cn7w-shadowrootsec-5679.vercel.app)
is READY at `de616ad739e92d2eb42f2a4a08d5ab8f80a17644`, deployment
`dpl_FXjE9rbrNgvyMHmZh3Q7mLS6Xb1A`. Fresh installation, isolation, source lint
and build pass; metadata confirms Preview, no production aliases and no bypass
binding. Exact-source browser checks timed out and remain pending, along with
physical-device and full-service acceptance. Sensitive services remain disabled;
Phase 1 is INCOMPLETE and release NO-GO.

19 October [logo lifecycle follow-up](reports/2026-10-19-logo-lifecycle-fallback.md)
repairs readiness after mode/reduced-motion changes. Its first Preview build was
correctly blocked by the automatically injected automation-bypass secret from
the earlier CLI probe. The exact task-created token was revoked with approval;
zero tokens remain and deployment protection is unchanged. The fresh
[repair Preview](https://virtual-ink-ui-test-4dds4xake-shadowrootsec-5679.vercel.app)
is READY at `9762d73ae84adde3b82f721fc86fbfeaacdc60e6`, deployment
`dpl_APsRchd1o5vVphhbkiEi6q8UStRt`; no production alias is promoted.
Hosted browser/runtime acceptance remains pending. Do not use vercel curl to generate another
credential for this restricted UI-only project; use ordinary signed-in browser
access and credential-free connection checks. The isolation guard remains intact.

19 October update: [clean import evidence](reports/2026-10-19-clean-import-audit.md)
confirms an actual [protected Preview build](https://virtual-ink-ui-test-68245umm7-shadowrootsec-5679.vercel.app),
deployment `dpl_95vR5twYfciXGdNktgUHaU9JyiJM`, source
`403fbd8a1f8e5d11977bd603dcae68427661cd19`. It uses the same restricted ui_test
profile and a fresh locked installation. Metadata reports raw target null,
environment preview and no production aliases; build logs show READY. Current
browser/HTTP connection failures leave hosted visual/client-bundle acceptance
open. This establishes no full-service acceptance or phase completion. The
Production-labelled historical record below retains its own source/date scope.

18 October 2026. User-authorized isolated UI hosting, not a platform release.

The [section 2.1 gate](phase-1-release-gate.md) leaves Phase 1 INCOMPLETE. This
historical Production-labelled UI-only deployment does not satisfy the required
Vercel Preview, physical-device or secure-service verification. Future production
promotion requires the documented go/no-go decision and explicit authorization.

Open [the protected UI test build](https://virtual-ink-ui-test-otzxni541-shadowrootsec-5679.vercel.app)
using your Shadow Root Vercel account. A custom domain is deferred at the user's
request. The existing live site and the separate acceptance project are unchanged.

Project: `virtual-ink-ui-test`, `prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`.
Team: `shadowrootsec-5679`. Deployment: `dpl_9GyrDYAju7KBFhPxqPLkgKzQM9ed`.
Deployed source: `a3755a7f0de20707f97f81856d27bad874bc18eb`.
Latest repair: [canvas fallback handover](reports/2026-10-18-studio-canvas-fallback.md).
The final source is READY and hosted transition checks preserve both artwork
and colour, including the selected front/back camera after recreation. Earlier
synthetic-draft cleanup uncertainty is resolved. Current 320px overflow/control
checks are partial; imports, real devices and broader acceptance remain open.
Historical [preparation safety](reports/2026-10-18-studio-preparation-safety.md)
and [hosted verification](reports/2026-10-18-hosted-studio-verification.md) record
the earlier source's device saving and layout-reference download checks. Their
results retain their own source/date limitations; they do not verify the new source.
The [previous contrast handover](reports/2026-10-18-studio-artwork-contrast.md)
preserves its verified UI URL/source for rollback. Those browser results do not
verify the new source; the latest repair handover supplies its own scoped evidence.
The [initial deployment report](reports/2026-10-18-ui-test-deployment.md) preserves
the previous verified URL/source for rollback.

Vercel labels this deployment Production. The application explicitly identifies
it as `ui_test`. The user approved this narrow exception after being told that a
new project's first deployment uses that target. It does not authorize changing
the original live site, copying staging variables, enabling sensitive services,
weakening staging checks or declaring Phase 1 complete.

The project has no Git connection or integration-variable inheritance. Its sixteen
plain configuration records contain only the profile/project identity and
disabled flags. Auth, database access, security administration, storage, jobs,
email and external transaction integrations are disabled. No database/provider
credential or internal service binding is supplied. The guard rejects those
bindings and protects the existing production identifiers. Analytics is omitted.

You can review the branding, public pages, local product studio and mobile UI.
Local artwork imports/device drafts remain browser features, not private server
uploads or approved production files. Products/models/prices are still labelled
concepts or unverified studies. Login, server uploads, orders, proofs, payments
and operational dashboards are unavailable. Do not enter real customer data.

The new project builds `apps/web` with Node 24.x and includes repository sources
outside that root for its existing imports/lint. Its reviewed deployment profile
is `vercel.ui-test.json`. A committed-source snapshot copies this exact file to
`apps/web/vercel.json` before upload; the normal root multi-service configuration
is preserved. Snapshot inspection excludes private files, environments, tool/Git
metadata, Word reports and unreviewed attachments. Deployment used explicit
project/team targeting and `--skip-domain`; no production alias was promoted.

Keep deployment protection enabled. Authenticate normally through Vercel; the
CLI HTTP probe received an SSO redirect and did not verify application content.
Never publish bypass secrets/cookies or copy them into scripts/reports. The
successful hosted UI checks used the signed-in Shadow browser profile.

For updates, validate a reviewed commit, regenerate/inspect its isolated snapshot,
confirm project identity, root, protection and all sixteen disabled entries, and
deploy only to this project. Do not push through the original project's automatic
deployment integration. Rollback by redeploying the last verified UI-only source
to this same isolated project; no database rollback or live-site alias change is
needed. See [the deployment report](reports/2026-10-18-ui-test-deployment.md).
