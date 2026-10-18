# Shadow Root Vercel UI test site

18 October 2026. User-authorized isolated UI hosting, not a platform release.

Open [the protected UI test build](https://virtual-ink-ui-test-3gdu1pvhw-shadowrootsec-5679.vercel.app)
using your Shadow Root Vercel account. A custom domain is deferred at the user's
request. The existing live site and the separate acceptance project are unchanged.

Project: `virtual-ink-ui-test`, `prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`.
Team: `shadowrootsec-5679`. Deployment: `dpl_JAsZQmPsfmZ6qKSmHNFUjFTwA5BG`.
Deployed source: `9edd01242b440c049bde9bc323aa8b352977338c`.
Latest checks: [preparation safety handover](reports/2026-10-18-studio-preparation-safety.md).
This build is Ready. [Hosted checks](reports/2026-10-18-hosted-studio-verification.md)
now verify separate text surfaces, colour preservation, device save/reopen and
an actual downloaded layout reference. Local file attachment, timing races,
mobile and complete browser acceptance remain pending; a later connection
reset also leaves synthetic-draft cleanup unconfirmed.
The [previous contrast handover](reports/2026-10-18-studio-artwork-contrast.md)
preserves its verified UI URL/source for rollback. Those browser results do not
verify the new source; the fresh hosted record above supplies its own scoped evidence.
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
