# Virtual Ink — Native provider MFA guard

Date: 16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Overall status: **PARTIAL. These controls are not COMPLETE.**

## 1. Overall status and inspection

The [prior inspection](2026-10-16-mfa-privileged-gap-report.md) and
[implementation evidence](2026-10-16-mfa-privileged-security.md) are preserved.
The remaining reproducible replay gap was provider-direct verification: unhooked
Auth 2.197.0 accepted the same TOTP against another challenge, outside the
application's code ledger. Existing AAL2 and application proof did not establish
that every provider attempt passed the application's limits.

This follow-up adds a genuine provider verification hook and requires its
reservation alongside the live native session for sensitive actions. All 185
genuine local checks pass; isolated hosted/browser acceptance, recovery, native
factor-change audit ingestion and the HIGH Node gate remain open. No hosted
SQL/Auth/role or billing change occurred. No escrow, blockchain, payment execution
or additional marketplace feature was added. User next-env changes and supplied
attachments remain untouched. No human approval or full Phase 1 completion is
claimed.

## 2. MFA implementation evidence

The native MFA Verification Attempt hook runs after the provider validates a TOTP
and before native token issuance. Only the native Auth database identity can
execute it. It runs with invoker rights, a fixed search path, strict input types
and READ COMMITTED. It receives the provider validation result, not a code,
TOTP secret, password or session token. A caller boolean cannot establish MFA:
ordinary roles cannot invoke the hook, and native session/factor/AMR plus signed
application proof remain mandatory.

An account-scoped transaction advisory lock serializes native attempts. Five
consumed attempts are permitted in a sliding five-minute window across factors.
Rate-blocked retries do not extend that window. After one accepted verification,
the factor cannot be verified again for ninety seconds. The provider accepts a
30-second TOTP period and one period of skew each way; this conservative interval
covers that full acceptance window without reading codes or secrets. A fresh
valid code during the interval is also denied. This availability tradeoff is shown
in the interface and remains a policy proposal for Uchi's review.

Native challenge history covers provider-first successes before activation.
Cooldown, invalid, rate and disabled-hook events are appended with redacted
metadata and appear in the existing restricted security audit view. No raw hook
payload, IP address, code, secret or token is stored. A native valid-code event is
an intent, not a claim that the subsequent session succeeded. Audit-write failure
rolls its reservation back and prevents AAL2 issuance. Hook errors return controlled
errors without using the provider rejection mode that signs every session out.

Sensitive actions now also require the enabled, matching-environment hook marker
and a reservation for the same provider user/factor within ten seconds before the
native MFA AMR timestamp. Old AAL2 sessions without it deny. A later verification
of the same factor supersedes its earlier receipt, so older privileged sessions
can need another step-up. Disabling the marker
denies protected actions even if the token and application proof remain valid.
The provider's actual configuration must still be verified on the isolated target;
the marker alone is not proof of a correctly configured managed service.

Genuine local evidence uses digest-pinned Auth v2.197.0 and PostgreSQL 18,
synthetic identities, real HTTP/SDK requests to Auth, the source application
gateway/controller and private SQL calls. The twelve-migration baseline is run before the thirteenth migration,
then Auth is restarted with its genuine hook configured. Native replay and race
denials, real ninety-second expiry, fresh application step-up, readable native
alerts and post-cutover role changes pass. Native logs pass scoped secret/token/
structured-code checks. The shared-loopback-IP limit is set to 60 only in the
guarded test fixture, to distinguish the hook's account limit from provider IP
throttling. Production/provider IP limits are not changed or certified.

Managed [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
currently lists MFA verification hooks for Teams and Enterprise. Local self-hosted
support does not establish availability on the existing managed project. A
compatible isolated managed project or authorized self-hosted service is required;
no paid upgrade/resource creation is performed or presumed authorized.

## 3. Privileged-role write path

The existing trusted command remains the runtime writer: current SUPER_ADMIN
request, distinct current SUPER_ADMIN approval, requester/approver execution,
mandatory reason, no self change, expected assignment, expiry and last-super
guard. Assignment changes, mandatory audits and native session deletion stay
atomic. The additional native receipt applies to all strong actions, including
role changes, recovery approval, factor removal and administrator password changes.

The post-cutover genuine integration performs enrollment/step-up for a fresh
synthetic requester, separated approval, ADMIN grant, immediate session rejection,
fresh target sign-in, subsequent removal and immediate rejection again. Both
changes have current AAL2 requester/approver/executor audits. These are software
fixtures, not human bootstrap or approval evidence. Native Auth cannot directly
write roles, change the guard settings, forge web-admin audit records, read
administrative reasons or delete audit records.

Vendor verification, suspension and financial/payout mutations remain unbuilt.
Their shared strong guard is hardened; no new marketplace workflow is executed.
Recovery records and the controlled operator runbook remain as before; actual
private recovery execution/identity review is not accepted by this slice.

## 4. Database policies and migration

CLI-generated 20261016122143_virtual_ink_provider_mfa_guard.sql composes
provider-mfa-guard.sql, security-audit-reads.sql and provider-mfa-session.sql.
SHA-256: `71829efa3527e1279e2bbdd8cc0c6ffec00b7b2bdfb65b57db5202a1534caf42`.
All preceding twelve migration files are unchanged. Thirteen migrations replay
locally; hosted remains at ten, with all three Phase 1 migrations unapplied.

The new private settings/factor-state tables have enabled and forced RLS. Settings
start disabled/unconfigured. Native Auth gets only the necessary invoker rights:
read settings, maintain factor reservations and insert/read provider-scoped audit
columns under RLS. Its event policy fixes source/action/unknown assurance and
forbids actor, role-change, approval, reason and before/after role fields. Existing
event immutability triggers remain. No native table/policy modification, elevated
web credential, new LOGIN/password or administrator account is introduced.

Browsers, ordinary authenticated/service roles and API/vendor/provisioning/security
service groups get no new guard rights, including through permissive creator
defaults. The native broker retains its existing narrow private definer boundary;
only the business function owner can execute it. The migration briefly assumes
that existing non-login owner to replace its command, then revokes membership and
schema CREATE. Application logins never receive those privileges.

Read-only hosted role metadata confirms native Auth is non-superuser/NOBYPASSRLS;
its existing provider CREATEROLE capability is unchanged. The existing migration
administrator has BYPASSRLS/native session rights. Neither is a web runtime identity.

## 5. Files changed

- SQL: database/phase1/provider-mfa-guard.sql, provider-mfa-session.sql,
  security-audit-reads.sql and the generated thirteenth migration.
- Checks: scripts/provider-mfa-guard-check.mjs, genuine-mfa-local-check.mjs and
  privileged-security-db-check.mjs.
- UI: apps/web/src/components/security-admin-panel.tsx explains the interval and
  rate response; security decisions remain server/database enforced.
- Setup: examples/security-admin/provider-auth-hook.env.example and the existing
  phase-1-security-admin.md runbook.
- Handover: AGENTS.md, README.md, team-report, live-backend-setup, task-board,
  security-review, open-questions, closure checklist and this Markdown/Word pair.

No dependencies/lockfiles, user next-env edits or supplied assets are staged.

## 6. Tests executed and results

Final genuine run: 2026-10-16T14:22:31.487Z. Reviewed application test runtime: Node 24.21.0.

| Check | Actual result |
| --- | --- |
| Complete root suite | 198 pass, zero failed/skipped |
| Security subset | 187 pass |
| React/mesh SSR and SDK/Next synthetic HTTP | Ten and sixteen pass |
| Web and strict backend/shared types | Pass |
| Production-format local build | Pass; sixteen static pages and dynamic routes |
| Backend/shared unit scope | All 38 inventoried files measured; 95% gate passes |
| Lines | 2074/2088 = 99.3295% |
| Branches | 1492/1542 = 96.7575% |
| Functions | 190/193 = 98.4456% |
| Fresh PostgreSQL 18 replay | Thirteen migrations, six legacy SQL suites and original role loader pass |
| Restricted SQL security assertions | 82 pass, including native receipt absence/staleness/disable and both read regressions |
| Genuine Auth/application checks | 185 pass: 87 baseline plus 98 post-cutover checks, including privacy/response assertions |
| Native global controls | Direct-provider replay, cross-factor account limits, concurrency with exactly one acceptance, provider-first cold start and real cooldown expiry pass |
| Native permission/audit failure | Seven database roles cannot call hook, disable guard or forge receipts; native identity cannot forge role audits; audit outage prevents AAL2 and rolls reservation back |
| Post-cutover role lifecycle | Genuine requester/approver MFA, grant/removal, immediate native session revocation, fresh target login and complete audits pass |
| Cleanup | Task-labelled containers/volumes/network removed; no hosted identity; SQL rollback/zero residue and instance stop pass |
| Browser artifacts | All 53 generated browser text artifacts scanned; no server configuration/credential/token/enrollment-secret patterns |
| Runtime baseline/repository checks | Pass; runtime security advisory remains separate |
| Root/web dependency audits | Both zero known vulnerabilities |

Unit coverage excludes SQL, browser journeys, server lifecycle and hosted
integrations. SQL uses synthetic native receipts; the separate genuine run uses
the actual Auth hook and native state. Physically scanning QR, browser/TLS,
managed hook configuration, callbacks, deployed logs and human acceptance remain
unverified. Initial SQL ambiguity, fixture-name collision and exhausted-account
fixture failures were corrected and retested; final enumerated checks pass.

## 7. Failed or incomplete requirements

- No isolated compatible managed project or authorized self-hosted target and
  approved synthetic identity set has been supplied. The visible shared project
  has no development branch. Managed hook plan availability is a material blocker.
- Genuine Preview/provider/browser callbacks, resource isolation, secure cookies/
  headers and deployed log privacy remain unverified. Source hosting does not
  apply migrations or configure the provider hook.
- Recovery identity review/operator execution, provider-direct factor-change
  audit ingestion/reconciliation and external alert delivery remain open. No
  final-factor support bypass or recovery-code feature was added.
- Unbuilt vendor/suspension/financial workflows remain unavailable; their shared
  guard is not evidence that the complete workflows were exercised.
- HIGH-NODE-01, human acceptance and the rest of Phase 1 remain open. The native
  replay gap is fixed locally, not declared accepted in managed Preview.

## 8. Vercel Preview and Git delivery

DELIVERY_PENDING_FINAL_SOURCE

The prior runtime source ef44a90 was Ready at
https://virtual-dp8mb6t8m-shadowrootsec-5679.vercel.app. That earlier deployment does
not include this thirteenth migration or the interval UI copy. Main/Production
remains a6736376b09ba7c3242495ff86b4bb2eea62f20c; no merge or promotion occurs.

## 9. Security findings and tool review

SEC-REPLAY-01: an actor with primary access and a still-valid TOTP could verify it
directly with the unhooked provider and avoid application-observed reuse limits.
The native hook now blocks all valid re-verification during its full acceptance
interval; native account serialization prevents concurrent double verification.
The mandatory native receipt denies old/unhooked AAL2 sessions. Genuine positive,
replay, race, cold-start, disabled and permission tests pass locally. Hosted
activation/plan acceptance remains open.

SEC-AUDIT-READ-01: the existing command's unqualified reason columns conflicted
with its PL/pgSQL variable, reproducing a 409 on the audit UI. Both audit and
role-request reads now qualify columns; actual positive SQL and source-controller
reads pass. This was an availability defect, not a reproduced data disclosure.

The hook uses invoker rights and role/RLS checks, never a client role or local MFA
boolean. Native intent commits precede token issuance; audit failure denies.
An interrupted native operation can consume its interval without issuing a token,
which is a conservative availability outcome requiring reconciliation. Migration
owners and the provider's own Auth credentials remain administrative trust boundaries.

HIGH-NODE-01 remains: the [Node security announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH fixes for 24.x on/after 21 October. A passing 24.21 baseline
or zero npm audit result does not resolve it. The [regular 24.22 release](https://nodejs.org/en/blog/release/v24.22.0)
does not close that announced gate. No sensitive Production enablement occurs.

Reviewed [Supabase changelog](https://supabase.com/changelog), relevant TLS/Postgres
notices and [MFA hook contract](https://supabase.com/docs/guides/auth/auth-hooks/mfa-verification-hook).
Pinned [native verification](https://github.com/supabase/auth/blob/v2.197.0/internal/api/mfa.go)
and [Postgres hook dispatch](https://github.com/supabase/auth/blob/v2.197.0/internal/hooks/hookspgfunc/hookspgfunc.go)
support the validation-before-hook and separate-transaction design.

Tool outputs were treated as untrusted. Only task-owned loopback fixtures and
reviewed hosted catalog/project reads were used. No private real Auth rows,
credentials, codes, tokens, IP addresses or raw hook payloads were printed or
staged. No external attack, live funds, billed resource or simulated human signoff
occurred. The scoped application review is not a whole-system penetration test.

## 10. Exact next action and team handover

Identify a compatible isolated managed Teams/Enterprise project or authorized
self-hosted Supabase Auth target and approved synthetic identities. Configure
credentials privately, review/apply all thirteen migrations there, configure the
native hook and matching DB markers, then run genuine Preview MFA/role/negative/
callback/log/browser acceptance. Complete controlled recovery and runtime patch
review before promotion. Resource identifiers, privately configured credentials
and any billing decision remain pending.

- Uchi: choose the compatible isolated target and review the ninety-second policy
  and real bootstrap evidence; retain phase/human gates.
- Mumba: review native hook grants/receipt timing and execute hosted acceptance,
  recovery/audit reconciliation and runtime retesting with Uchi.
- Taizya: review interval/rate, authenticator, confirmation and recovery browser
  states on the accepted target; no UX signoff is claimed.
- Lubasi: review private recovery identity evidence, separated approval operations
  and alert response; keep evidence outside Git.

The Word report uses compact_reference_guide/memo_masthead and the existing named
report overrides. Structural/link/OOXML/privacy checks are recorded with delivery.
LibreOffice is absent; rendering/visual pagination cannot be verified. Report
delivery does not imply security completion, human acceptance or readiness.
