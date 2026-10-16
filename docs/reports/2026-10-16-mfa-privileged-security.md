# Virtual Ink — MFA and privileged-role security

Date: 16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Overall status: **PARTIAL. These controls are not COMPLETE.**

## 1. Overall status and inspection

The pre-edit inspection is preserved in the matching MFA privileged gap report.
It identified Supabase Auth, existing server cookie/PKCE paths, legacy private
roles and an unapplied eight-role assignment foundation. There was no genuine
MFA enrollment/challenge interface or runtime privileged writer. Synthetic AAL2
fixtures and pure policy inputs were not accepted as provider evidence. No
mfaEnabled/mfa_enabled authorization switch was found in application source.

This review implements provider-backed MFA routes/UI and a restricted role-write
boundary with local evidence. It does not establish genuine provider acceptance,
isolated Preview verification or human approval. No hosted SQL/Auth/role mutation
or production enablement is performed. No escrow, blockchain, payment execution
or additional marketplace feature is implemented. The existing user next-env edit
and supplied assets are preserved. Zero of seventeen final Phase 1 mission groups
is fully accepted; Phase 1 remains PARTIAL.

## 2. MFA implementation evidence

Primary login leads administrators to the server-checked security screen. It
loads actual provider factors and assurance and prompts enrollment if no verified
TOTP exists. Server-only Supabase SDK calls enroll, challenge and verify the
factor. The QR is held in component memory, with no localStorage/sessionStorage
or application secret table. Only the QR data is returned for enrollment; the
separate secret/URI and access/refresh tokens are never response fields. The QR
necessarily contains the enrollment secret. Successful verification establishes
the SDK's higher-assurance session through HttpOnly Secure SameSite=Lax cookies.
Failed provider/audit operations do not commit pending cookies.

Every request verifies the user online and the same token's claims. Critical
actions also check live provider session/account/factor/AMR facts and matching
recent password/TOTP times in the database. The conservative window is five
minutes. Fresh role reads and server checks remain authoritative even if the
browser displays an old role or assurance label. Administrator password changes
use this boundary; ordinary account recovery gains no administrative authority.

Durable account/operation attempt counters precede provider work. Enrollment,
verification and reauthentication allow five attempts per fixed five-minute
bucket; other MFA operations allow ten. Provider limits remain separate. HMAC
fingerprints block code reuse across challenges/sessions for five minutes without
storing the code. Redacted attempt/result/failure records and in-app alerts cover
repeated failures and suspicious factor changes. Raw SDK/SQL errors, passwords,
codes and tokens are not logged by these paths. No external alert delivery is
configured or claimed.

Discarding an unfinished unverified factor requires recent primary login; removing
a verified factor requires recent MFA and another verified factor. The last
verified factor cannot be disabled by the application. Recovery requests require
two distinct current SUPER_ADMIN approvals and private identity review. Provider
operator execution and its audit correlation remain unverified. Recovery codes
are not offered by the application; no insecure substitute was added. Additional
verified-factor enrollment is not exposed by this review flow.

The installed real SDK is tested with synthetic HTTP, including QR/challenge/
verification, AAL1-to-AAL2 claims, cookies and provider rejection propagation.
This is not genuine enrollment or proof that the deployed provider rejects every
invalid, expired or replayed code. Provider-managed secret encryption and effective
Auth policy must be confirmed privately on the isolated target; no assertion,
boolean or secret-table inspection substitutes for that evidence.

## 3. Privileged-role write path

The original ADMIN/SUPER_ADMIN names are reused. Four distinct specialist roles
are added: SECURITY_ADMIN, FINANCE_ADMIN, DISPUTE_REVIEWER and PAYOUT_APPROVER.
They receive no unrelated order/file authority from their names.

The browser sends target, expected assignment, requested role, reason and optional
expiry to server-only routes. It never supplies actor identity or actor authority.
A current SUPER_ADMIN requests the change; a different current SUPER_ADMIN,
distinct from the target, approves it; requester or approver executes within
fifteen minutes. All stages require recent provider MFA and recheck live authority.
Customers/vendors cannot promote themselves, ADMIN cannot grant SUPER_ADMIN, and
all self changes deny. The last active SUPER_ADMIN is protected. No admin is
seeded and no approval is simulated. The separated workflow needs enough distinct
administrators for SUPER_ADMIN changes; private bootstrap/recovery remains open.

One active assignment per user remains. Granting replaces the reviewed assignment;
removal restores CUSTOMER. Optional expiry is immutable and limited to thirty
days. SUPER_ADMIN cannot expire automatically. Expired assignments cease to
authorize the next action even with an unexpired token.

The private command serializes decisions with a transaction advisory lock,
requires READ COMMITTED, checks expected assignment/current actors and performs
assignment revocation, new grant, mandatory transaction audits and deletion of
affected provider sessions atomically. Failure rolls those mutations back and
records a failure event. A fresh synthetic target session loses access immediately
after actual SQL role removal; no stale JWT role is accepted.

The restricted UI shows identity, current assignment/expiry, requested change,
reason, risk/step-up text, explicit confirmation, separated approval/execution,
result and audit references. SUPER_ADMIN is not the default selection. Sensitive
security events require fresh assurance. Browser interaction/manual acceptance
is still pending; React SSR checks are not that acceptance.

## 4. Database policies and migrations

CLI-generated migration 20261016053031_virtual_ink_privileged_security.sql combines
database/phase1/security.sql and its separate security-supabase.sql adapter.
SHA-256: `30e582457e6502c7e79bc9fab25f912e6136015bd286e4ddbb2b2795a593a78b`.
The previous eleven migration files are unchanged. There are twelve local
migrations; the visible hosted project remains at ten. Both Phase 1 migrations
remain unapplied there.

At 07:41 UTC, read-only hosted catalog checks confirm ten migrations and neither
new schema. Security advisors retain one existing RLS-without-policy INFO on an
intentionally closed audit table, not a new finding from the unapplied schema.

The private security service group has EXECUTE on the command, no table DML and
no function-owner membership. Its separate function owner is NOLOGIN/NOBYPASSRLS
and non-superuser, with narrow business/provider column rights and forced-RLS
policies. Existing API, provisioner, vendor, anon, authenticated and service_role
groups receive no new security access, including permissive creator defaults.
Events reject UPDATE/DELETE/TRUNCATE and are append-only for application/admin
roles. Migration owners remain trusted administrators.

The database marker starts disabled/unconfigured. No LOGIN, password, seed account
or elevated browser credential is created. Runtime startup rejects unsafe logins,
owner membership, mismatched issuer/environment and shared/Production enablement.
Preview requires a separate project, matching independent project binding and CA.
The provider-specific session reads/deletes stay separate from portable business
rules. The disposable Auth-shaped SQL fixture is never a hosted migration.

## 5. Files changed

- Core: src/backend/identity/security-admin.ts, assigned-context.ts,
  permissions/phase1.ts and api/errors.ts.
- Web: apps/web/src/lib/security-admin.ts, components/security-admin-panel.tsx,
  app/admin/security/page.tsx, app/api/security/[action]/route.ts,
  app/api/auth/[action]/route.ts, app/account/page.tsx and app/globals.css.
- Database: database/phase1/security.sql, security-supabase.sql,
  database/tests/security-auth-fixture.sql and the new versioned migration.
- Checks: test/security-admin.test.ts, phase1-permissions.test.ts,
  scripts/privileged-security-db-check.mjs, security-artifact-check.mjs,
  web-auth-checks.mjs, web-ui-checks.mjs and package.json's security subset.
- Handover: AGENTS.md, README.md, setup/security/permission/checklist/task-board/
  decision/current-report docs, phase-1-security-admin.md, the disabled environment
  example and matching inspection/implementation Markdown and Word reports.

The existing apps/web/next-env.d.ts edit remains unstaged. No dependency/lockfile,
supplied asset or unrelated feature was changed. Private local verification helpers
and ephemeral credentials are ignored and are not delivery artifacts.

## 6. Tests executed and actual results

Final coverage at 07:32 UTC, 16 October 2026; private reviewed Node 24.21.0.

| Check | Actual result |
| --- | --- |
| Complete root suite | 197 pass; zero failed/skipped |
| Security subset | 186 pass |
| New core/controller groups | Six pass; claim binding, environment isolation, input/authority denial, MFA/audit ordering and safe errors |
| React/mesh SSR | Ten pass; includes restricted security panel |
| Real SDK/Next with synthetic HTTP | Sixteen pass; includes TOTP and shared-provider rejection |
| Web and strict backend/shared types | Pass |
| Production-format local build | Pass; sixteen static pages, dynamic security routes included |
| Coverage inventory | All 38 backend/shared files measured; 95% line/branch/function gate passes |
| Lines | 2056/2070 = 99.3237% |
| Branches | 1469/1519 = 96.7084% |
| Functions | 187/190 = 98.4211% |
| PostgreSQL 18 replay | All twelve migrations and six existing SQL suites pass |
| Actual private command probe | 76 counted security checks plus supporting assertions pass |
| SQL lifecycle/denial evidence | Dual approval, customer/vendor/ADMIN/self denial, last-super protection, expiry, missing reason, stale assignment, removal/session invalidation, atomic failure rollback, audit append-only, replay/budgets and environment/isolation denials pass |
| Concurrency scope | Actual advisory-lock contention and non-READ-COMMITTED rejection pass; not a broad load/linearizability certification |
| Fixture cleanup | Zero users, security events and provider sessions; rollback and local instance stop pass |
| Browser artifacts | All 53 generated browser text artifacts scanned; zero server-key, privileged-key, database-URL, token or enrollment-secret pattern findings |
| Runtime baseline / repository checks | Pass |
| Root/web dependency audits | Both zero known vulnerabilities |

Unit coverage excludes SQL, frontend/browser journeys, server lifecycle and genuine
hosted integrations. SQL uses provider-shaped local tables and synthetic session
facts, not real Auth signatures. SDK tests use the installed SDK but synthetic
provider HTTP. No provider security test or human signoff is fabricated. Early
failed regression/SQL/type checks were corrected and retested; final required
local checks pass. Existing non-fatal SDK malformed-cookie/module/Three warnings
remain and do not contain real secrets.

## 7. Failed or incomplete requirements

- Genuine provider registration/sign-in, TOTP QR enrollment/challenge/AAL2 and
  invalid/expired/replayed-code acceptance remain unverified.
- A confirmed isolated non-production project, approved synthetic identities,
  restricted runtime credential/CA and reviewed bootstrap are missing. The visible
  active project has no development branches. No billed resource was created.
- Effective provider MFA secret encryption, timeout/inactivity policy, direct
  provider factor/logout audit coverage and deployed log redaction are unverified.
- Controlled recovery approval records are implemented; actual private identity
  review, provider recovery execution, audit correlation and reconciliation of
  interrupted external operations are not accepted.
- Repeated failure/factor-change alerts exist in the application audit view;
  external alert delivery and provider-direct event ingestion are not implemented.
- Additional verified-factor enrollment and application recovery codes are not
  offered. The final factor cannot be disabled through the application.
- Vendor verification, suspension, refunds, releases and payout-account mutations
  remain unbuilt/unavailable. Their shared guard denies missing assurance, but no
  claim is made that unbuilt workflows were exercised.
- Full Preview MFA/role interaction, real callback/resource isolation and browser
  acceptance are pending. Local headers/cookies and artifact checks do not prove
  hosted runtime logs or provider policy.
- The HIGH Node advisory and human/phase acceptance gates remain open.

## 8. Vercel Preview URL and delivery

Review branch: codex/phase-1-mfa-privileged-security. Source commit/push and the
actual Preview URL/state are pending initial report generation. No URL or hosted
MFA result will be invented. This branch is not promoted to main/Production while
genuine acceptance and release gates remain open. A Ready source build does not
apply either Phase 1 migration or close a security requirement.

## 9. Security findings and review

SEC-PASSWORD-01: the existing password-update path checked a confirmed primary
session only. A compromised primary session could attempt an administrator's
security-setting change without app-level step-up. Synthetic inspection/tests
show that existing behavior; no real account compromise is claimed. With the new
boundary enabled, administrator password updates require current password/TOTP
assurance and audited outcomes; actual SQL negative tests pass. Provider-direct
policy still needs genuine acceptance. Ordinary recovery remains separate.

SEC-ROLE-01: caller-supplied authority, stale role/session facts, self promotion,
unaudited writes and stale approvals are prevented by strict inputs, verified
identity, fresh DB authority, separate approval, immutable expiry, serialized
execution, required transaction audits and immediate session deletion. Actual
SQL negative and rollback tests pass. A compromised migration owner or trusted
server credential is outside ordinary-user isolation; no browser receives it.

SEC-MFA-01: local counters and HMAC replay reservations prevent repeated provider
work and code reuse; provider rejection is propagated without secrets. No local
boolean substitutes for MFA. External provider changes and app audit commits are
not one transaction: intent/result records support reconciliation, but a crash
can leave a pending intent. Provider audit ingestion/recovery acceptance remains
open, so this is not complete control coverage.

HIGH-NODE-01 remains open: the [Node security announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
identifies HIGH-severity fixes for 24.x scheduled for 21 October. A passing fixed
baseline or zero npm audit result does not resolve it. Existing security rules
block completion/promotion until patch review and retesting. No production
sensitive enablement is performed.

Tool review: repository/tool output was treated as untrusted. Only synthetic
loopback probes, dependency metadata and reviewed hosted catalog/project reads
were used. No real Auth rows/secrets, customer/vendor evidence, private addresses,
codes, signed URLs or elevated keys were printed or staged. No external-target
scan, live funds, destructive hosted action or simulated human approval occurred.
The SQL query's initial UUID type error and a readonly UI type mismatch were
corrected; final local replay/type checks pass. These are implementation failures
caught locally, not reproduced hosted exploits.

Primary sources reviewed: [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp),
[rate limits](https://supabase.com/docs/guides/auth/rate-limits),
[sessions](https://supabase.com/docs/guides/auth/sessions),
[changelog](https://supabase.com/changelog),
[Auth AMR generation](https://github.com/supabase/auth/blob/master/internal/models/sessions.go)
and [provider encryption implementation](https://github.com/supabase/auth/blob/master/internal/crypto/crypto.go).
Source capability is not evidence of the hosted encryption configuration.

## 10. Exact next action and team handover

Uchi and Mumba must identify the isolated non-production project and approved
synthetic identities, configure credentials privately and review the first two
SUPER_ADMIN bootstrap records. Then follow docs/phase-1-security-admin.md to apply
the reviewed migrations on that isolated target, bind the actual Preview origin/
callbacks, and execute genuine TOTP/role/negative/log acceptance. The resource
question is pending; elapsed time is not authorization to reuse the shared target.
Resolve HIGH-NODE-01 before completion/promotion.

- Uchi: confirm isolated resources, synthetic identity approval, bootstrap and
  conservative policy choices; retain security and human acceptance gates.
- Mumba: pair on restricted credential/CA setup, genuine provider/Preview tests,
  audit/recovery reconciliation and runtime patch retesting.
- Taizya: review authenticator, denial, confirmation, removal and recovery states
  with actual browser interaction; no UX signoff is claimed.
- Lubasi: review identity evidence, separated reviewer/recovery operations and
  in-app alert response; keep actual evidence outside Git.

Word uses compact_reference_guide with memo_masthead and the existing named report
overrides. Both report documents pass structural checks. Rendering was attempted
for both and failed because LibreOffice is absent (WinError 2); visual pagination
remains unverified. Local links, composed SQL/checksum, required evidence, OOXML
and privacy checks are performed separately. Report delivery does not mean human
acceptance or production readiness.
