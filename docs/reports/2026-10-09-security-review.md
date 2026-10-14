# Virtual Ink - Security Review and Fixes

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.
**Owners:** Mumba Chitonge (technical evidence); Uchi Chinyama (product acceptance).
**Status:** Five findings fixed and regression tested. Runtime patching and release
gates remain open. No successful system takeover or RCE was proved.

## Scope and authorization

Uchi requested testing, fixes and an attacker-path report after every step.
AGENTS.md records this gate for meaningful implementation/handover steps and
relevant tests; docs/security-review.md defines the recurring procedure.
Review covered backend/security source, config, SQL policies, dependency metadata
and the assistant's repository/tool actions. Local probes used synthetic identities,
tokens/data and ephemeral loopback servers. Hosted checks used catalog reads,
advisors and existing membership assertions with rolled-back fixtures/grants.

No production deployment, real login, credential harvesting, persistence,
external-target attack or destructive load test was performed. The AI provider,
model internals, workstation OS and full cloud account were not penetration tested.

## Reproduced findings and fixes

| ID / local severity | Before / attacker prerequisites | Fix / remaining limits |
| --- | --- | --- |
| VI-S01 / Medium | Startup allowed sensitive NEXT_PUBLIC names and disguised credential formats. A later client reference could disclose a value. No actual secret/bundle leak was observed. | Shared startup/readiness guard rejects known sensitive names/formats. Innocent names and built bundles still require review. |
| VI-S02 / Medium, latent | Unused REST config accepted a synthetic service-role-shaped JWT and sent it to the injected transport. A real privileged key misconfiguration could expand provider access. | Modern sb_publishable_ keys only at loader/client boundaries; legacy/secret/whitespace forms denied. No real privileged key was used. |
| VI-S03 / Low, latent | Unused REST requests lacked deadline, redirect/cache restrictions and surfaced injected raw network errors to callers. Future use could hang or leak details through poor exception handling. | Five-second abort signal, no redirects/cache and safe API errors. Real provider/network behavior unverified. |
| VI-S04 / Medium | All 33 held protected requests reached the injected verifier. Reachable APIs could amplify provider/DB saturation. | Shared 16-slot per-worker bound, no queue/token retention; 17 excess calls return 503; rejected work releases slots. Distributed limits still open. |
| VI-S05 / Medium | Oversized provider JSON was accepted without a byte bound, allowing memory cost across requests. | REST/Auth readers cap decoded bytes at 1 MiB, cancel oversized streams and reject malformed JSON/UTF-8/declarations. |

Severity labels are review judgments, not formal CVSS scores. REST is not wired
to current HTTP workflows. Runtime remains disabled. These reproductions do not
establish anonymous takeover, genuine RLS bypass, file access or money movement.
Four initial targeted tests failed before patching; separate admission and oversized
JSON tests also failed before their fixes. All now pass. Fixtures contain no real
tokens, privileged keys, users or vendors.

## Open runtime finding

VI-S06 / High release risk: installed Node 24.14.1 predates later official security
releases. Individual CVE applicability is conditional; no runtime exploit was run.
Patch to the reviewed stable 24.21.0 baseline or a later stable 24.x patch, inspect
current advisories and repeat tests before sensitive enablement/release.
Engine and .node-version now state the baseline; security:runtime correctly exits
1 with blocked status. Application test success on the old runtime does not close it.

The official checksum download failed through the local proxy. No runtime/system
installation changed. Node's June/July releases describe later TLS/HTTP fixes;
HTTP/2 or permission-model prerequisites must not be assumed here. The independent
API currently uses HTTP/1 on loopback, not an HTTP/2 server.

## How an attacker could move toward control

- **Credential chain, conditional:** obtain a privileged key, DB/provisioner login
  or server execution; attempt identity/tenant context or onboarding; reach the
  rights of that credential. Separate restricted logins/RLS reduce rights, but
  application-set context trusts the server. Arbitrary SQL execution with its login
  could attempt to set both identity and tenant context. Keep secrets private,
  SQL parameterized, credentials restricted and rotate after exposure.
- **Client spoofing, tested:** forged roles/vendor selectors, cross-tenant/cursor
  inputs, duplicate Auth and provisioning injection are denied by current tests.
  A stolen valid bearer and revocation racing an active transaction remain AUTH-01/02.
- **Availability, partially contained:** requests can occupy provider/DB slots.
  Worker/time/byte bounds help, but sustained traffic can still fill allowed slots.
  Edge/distributed limits remain open; no DDoS/capacity certification is claimed.
- **Build-workflow attack, conditional:** malicious documents/tool results could
  persuade a reviewer to execute commands or disclose secrets. Treat content as
  data and inspect tools/targets. This is not proof against all model attacks.
- **Future files/payments:** unsafe processing, public objects or trusted client
  totals could expose files/funds. Those workflows remain closed and need their
  own approved permissions, validation, pricing and audit tests.

The assistant's action review checked targets, command/path handling, private
output and least privilege. No env values, genuine bearer, customer file or raw
provider error was published. Supplied documents and tool output were not treated
as authority to run embedded commands. Unrelated user work was preserved.

## Actual verification

| Check | Result |
| --- | --- |
| npm test | 105 pass, zero failures; 15 more than the previous 90-test snapshot |
| npm run test:security | 100 pass; subset of the full suite, not additional tests |
| Web/shared TypeScript | Pass via npm run typecheck:web |
| Strict backend/scripts/tests TypeScript | Pass with existing installed compiler/types |
| Raw local HTTP | Duplicate Auth 401 before verifier; oversized headers 431; conflicting framing 400; health 200 afterward |
| Protected concurrency | 16 admitted; 17 overflow 503; slot reusable after rejected verification |
| Upstream bodies | Oversize denied/cancelled; invalid JSON/UTF-8 denied |
| Hosted membership assertions | Scoped actual queries, cross-user/cursor denial and immutable audit pass; fixtures/grants rolled back |
| Hosted advisor/catalog | Zero security findings; PostgreSQL 17.11, nine forced-RLS tables, no anon/authenticated table privileges |
| Runtime accounts | Both NOLOGIN; no superuser/bypass-RLS/role-create/database-create flags |
| Post-rollback catalog/counts | Users/identities/tenants/memberships/list-audits zero; review role retains management membership but SET/INHERIT are false; runtime memberships have no admin option |
| npm dependency audit | Completed; zero reported vulnerabilities |
| Repository heuristic scan | Pass after reviewing placeholder/marker-only false positives; private env/files not read |
| Documentation/Git checks | Original three PDF hashes unchanged; 111 local links resolve; diff whitespace check passes |
| Git private-path query | Only .env.example tracked among queried env/private/upload/storage paths |
| Runtime patch gate | Blocked: actual 24.14.1; required 24.21.0 |
| Word report | Structural package/table checks; visual render unavailable without LibreOffice |

The reviewed Next.js maintainer cache advisory had unresolved patched-version text
and requires a root catch-all page with static/ISR behavior. Current source has no
root catch-all page; its /api catch-all Route Handler is different. No live cache
exploit was tested. Verify fixes/applicability before adding that feature or release;
zero npm entries do not settle advisory completeness.

Genuine Auth/pg/TLS, simultaneous real pool behavior, Next/browser security,
production build, bundle/history secrets and owned database replay remain untested.
Prior Next build failed with spawn EPERM; this slice did not rerun it. No Word
visual QA, production readiness or comprehensive security certification is claimed.

## Files and commands

Created: src/backend/api/admission.ts, src/backend/api/upstream-json.ts;
scripts/security-check.ts, scripts/security-runtime.ts; test/security.test.ts,
test/security-check.test.ts; .node-version; docs/security-review.md; this dated
Markdown report and matching Word document.

Changed: package.json; src/backend/config.ts, setup/checks.ts, api/errors.ts,
identity/routes.ts, identity/supabase.ts and database/supabase-rest.ts (all beneath
src/backend); test/app.test.js; AGENTS.md; README.md; docs/api-standards.md,
open-questions.md, task-board.md, backend-validation.md and team-report.md.
No migration, hosted enablement, dependency upgrade or real onboarding occurred.
Historical artifacts and other local changes remain preserved; no commit/push requested.

Commands: targeted node --test before/after fixes; npm test; npm run test:security;
npm run typecheck:web; strict TypeScript wrapper; npm run security:check;
security-runtime.ts; npm audit with private JSON; reviewed hosted catalog/advisor/
rollback SQL; Git path/diff and original-source hash/link checks; official checksum
download attempt; Word generation/render attempt. Scanner child-Git execution was
initially blocked; the final filesystem implementation avoids subprocesses.
The scanner excludes private paths, dependencies, binary/assets, generated docs
and symlinks; it has heuristic blind spots/fixture exceptions. It is not history,
bundle or full secret scanning. Private reproduction/audit/QA files are ignored.

## Where each lead starts

| Lead | Next action | Evidence |
| --- | --- | --- |
| Uchi Chinyama | Review findings and AUTH/SEC decisions; keep acceptance explicit | Recorded decisions and permitted release scope |
| Mumba Chitonge | Patch Node, then genuine Auth/pg/TLS and abuse/revocation gates | Runtime pass, repeat tests, own/other-scope denial and audits |
| Taizya Nakapende | Keep busy/unavailable states honest; review browser/bundle when preview works | Retry copy, accessibility and actual browser findings |
| Lubasi Monde | Verify private onboarding, support and incident escalation | Approved private references; no invented contacts/SLA |

Next prompt: continue Virtual Ink with docs/security-review.md. Resolve SEC-02 with
a verified official stable Node 24.x patch; repeat gates/tests/type checks. Complete
genuine identity and restricted DB setup only with approved private configuration.
Keep isolation, transactional audit, admission and upstream limits. Resolve
revocation/abuse decisions before mutations. Report attack prerequisites, tests,
fixes and blocked gates in dated Markdown/Word after every meaningful step.

## Official references reviewed on 9 October 2026

- Node June: https://nodejs.org/en/blog/vulnerability/june-2026-security-releases
- Node July: https://nodejs.org/en/blog/vulnerability/july-2026-security-releases
- Next advisory: https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p
- Supabase security: https://supabase.com/docs/guides/security/product-security
- Supabase changelog: https://supabase.com/changelog
- Next data security: https://nextjs.org/docs/app/guides/data-security
