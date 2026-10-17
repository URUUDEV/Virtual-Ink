# Virtual Ink — Hosted acceptance environment inventory and isolation plan

Date: 16 October 2026. Initial verdict: **FAIL — hosted acceptance not established**.

## Read-only inventory before implementation

Production is the Vercel Virtual Ink project at https://virtual-ink.vercel.app and
the Supabase project `odgxcuwueessxfsoveza` in eu-west-1. They are protected
identifiers, never proposed staging targets. The only visible Supabase organization
is URUUDEV's Org (`djrwshrjirrkhtpjzyhf`), currently Free. No separate active
acceptance project is visible. The two inactive unrelated projects will not be
repurposed. Organization selection and the provider's mandatory cost confirmation
remain pending before creating a Supabase project.

Existing source has a Next.js web service bound to an internal Node app service,
private application role tables and fourteen ordered migrations. Genuine local
TOTP/AAL2 and role writes have evidence; managed hosted acceptance does not.
Private-file lifecycle/Storage policies, order/proof and production/QC workflows
are unbuilt. Source hosting cannot make those acceptance tests pass. No production
rows, Auth users, files or credentials will be copied.

## Compatibility review before modifying project configuration

- The current official Supabase changelog was fetched. Relevant breaking notices
  concern [HTTP TLS cipher retirement](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
  and [PostgreSQL 15.19/17.11 extension/operator changes](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).
  New empty staging will use modern TLS and replay migrations; production is not
  upgraded or reindexed. Actual staging version compatibility needs verification.
- `supabase --version` fails because the installed wrapper lacks its Windows
  binary. Pinned CLI 2.121.0 runs successfully; top-level, projects and db commands
  were discovered with `--help`. No global tool/package version is changed.
- [MFA verification hooks](https://supabase.com/docs/guides/auth/auth-hooks) are
  listed for Teams/Enterprise. A Free staging project alone cannot establish the
  implemented provider-wide guard. No organization plan upgrade is authorized or
  performed. Existing security settings call the non-production environment
  `preview`; the application designation must explicitly map staging to Preview.
- Current official guidance reviewed: [MFA/AAL](https://supabase.com/docs/guides/auth/auth-mfa),
  [server sessions](https://supabase.com/docs/guides/auth/server-side/advanced-guide),
  [redirects](https://supabase.com/docs/guides/auth/redirect-urls),
  [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
  [private Storage](https://supabase.com/docs/guides/storage/security/access-control),
  [Vercel environments](https://vercel.com/docs/deployments/environments) and
  [environment variables](https://vercel.com/docs/environment-variables).
- Vercel CLI is 58.5.1. Project/environment/deploy/API commands were discovered
  with `--help`. Deployment uses an explicit new project and Preview target;
  `NODE_ENV=production` is the optimized runtime, not the application environment.
- The provider migration API assigns its own timestamps. For this new empty
  staging project, preserve repository history by verifying each stored SQL
  payload's normalized checksum/name and expected history count, then re-keying
  only that newly applied staging history row to its original repository version.
  No production history is touched and no source migration is rewritten. This
  guarded metadata alignment avoids a future CLI attempting to reapply the same
  source under a different version.

## Isolation plan

Create a dedicated Vercel acceptance project without Git/integration connection,
copied/shared production variables, production domains or promotion. Preserve
the web/internal-app architecture. Deploy only through an explicit staging project
and Preview target. A stable staging URL supplies exact Auth confirmation/reset
callbacks. Use independent build/runtime logs and project monitoring. Every page
shows “Virtual Ink Acceptance Environment - No Real Orders or Payments.”

Create an entirely new Supabase project after organization/cost prerequisites.
Use its own database, Auth tenant, Storage, keys, logs and settings. Configure
credentials privately; a staging service credential stays out of web/runtime
build environments. Existing restricted database logins serve runtime access.
Apply the unchanged ordered migrations to the empty database, then synthetic-only
fixtures. All external integrations remain disabled or explicitly sandboxed.

Before any deployment, require an explicit application environment and exact
staging project/origin bindings. Reject production identifiers, service-role keys
in web environments, production redirects/webhooks/storage references and payment
or blockchain credentials. Check protected safe identifiers rather than printing
secret values. Unknown, missing or contradictory staging settings fail closed.
Any detected production reference stops that configuration/deployment.

## Environment-isolation matrix

| Surface | Production | Acceptance plan |
| --- | --- | --- |
| Vercel project | Existing Virtual Ink; read-only baseline | New dedicated project; Preview only |
| Git deployment | Existing configuration untouched | No Git connection or automatic promotion |
| Origin/domains | Existing aliases untouched | New staging origin; no production alias |
| Variables/secrets | Never copied, changed or decrypted | New staging-only values; no inheritance |
| Supabase | Existing project excluded | New project; organization/cost pending |
| Auth/accounts | No reads of private user rows or writes | Synthetic role fixtures; controlled inboxes |
| Database/migrations | No DDL/DML; existing history preserved | Ordered replay from empty database |
| Storage | No objects read/copied/changed | Six purpose-separated private staging buckets |
| External services | No changes | Disabled/sandbox only; no real transactions |
| Logs/monitoring | Read-only identity/config fingerprints only | Separate project logs; redaction checks |

## Acceptance status

No new staging URL/project reference, migrations, Auth accounts, MFA, RLS/Storage,
order or production-verification acceptance is claimed yet. These will be recorded
against actual resources and tested source. No failed/unbuilt requirement can be
labelled verified. Production mutations, promotion, plan changes and copied
credentials/data are excluded throughout this task.
