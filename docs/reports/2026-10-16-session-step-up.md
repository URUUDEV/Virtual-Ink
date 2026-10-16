# Virtual Ink — Server session and MFA prerequisite

Date: 16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Status: **PARTIAL Phase 1; internal disabled foundation locally verified.**

## Delivered slice

The internal step-up verifier validates the same bearer token with the existing
Auth server identity adapter before decoding any claims. It then binds subject,
trusted issuer, authenticated role/audience, AAL2, session UUID, issue/expiry/
not-before times and one TOTP AMR event. Metadata never supplies business roles,
grants or MFA. A bounded canonical payload and strict timestamps reject malformed
claims; no local JWT decoding substitutes for server verification.

Every call reads current server evidence through a separate Supabase SQL adapter.
The parameterized bounded SELECT requires a live same-user AAL2 session, an
eligible non-anonymous email-confirmed account, a verified same-user TOTP factor
that predates the MFA event, and matching token/server MFA seconds. Removed or
downgraded sessions, banned/deleted accounts and removed/mismatched factors or AMR
deny. The verifier checks expiry again after asynchronous work. Generic errors
hide provider/database details. Its immutable internal proof supplies no business
authority and must never be persisted, cached or reused across actions.

A freshness window is required explicitly, with a 1–900 second technical ceiling
and no enabled business default. The existing assignment loader retains AAL1 and
no grants. No runtime caller, writer, login, credential, Auth-schema grant, public
RPC, environment switch or migration is added. Eleven local and ten hosted
migrations remain; the assignment schema/reader are absent on hosted development.
No hosted DDL was performed. Runtime readiness still checks the original nine
tables. Supplied assets, historical reports and the user next-env edit are preserved.

## Verification and measured coverage

Private Node 24.21.0; coverage recorded at 05:07 UTC on 16 October 2026.

| Check | Actual result |
| --- | --- |
| Complete root suite | 191 pass; zero failed/skipped |
| Security subset | 180 pass |
| New prerequisite groups | Five pass: Auth ordering, claim binding, current/expired evidence, redaction/configuration and SQL result validation |
| React/mesh and synthetic SDK/Next Auth | Nine and fourteen pass |
| Web and strict backend/shared types | Pass |
| Production build | Pass; sixteen static pages generated |
| Coverage inventory | All 37 backend/shared files measured; 95% gate passes |
| Lines | 1877/1891 = 99.2597% |
| Branches | 1297/1341 = 96.7189% |
| Functions | 168/171 = 98.2456% |
| Runtime baseline / repository heuristics | Pass |
| Root and web dependency audits | Both zero known vulnerabilities |
| Fresh PostgreSQL 18 replay | All eleven existing migrations pass |
| SQL regression suites | Six pass; actual eight-role loader/RLS/audited revoke/suspension/default-privilege probes pass |
| New actual SQL adapter probe | Seventeen session/account/factor/AMR denials pass; positive current/unexpired-session and expired-ban cases pass |
| Restricted provider fixture | Column-only SELECT succeeds; DELETE denies with SQLSTATE 42501 |
| Fixture residue | Zero; synthetic Auth schema and role roll back, local instance stopped |
| Hosted catalog / security advisor | Ten migrations, assignment schema/reader absent; one existing intentionally closed RLS-without-policy INFO |
| Vercel exact source / public smoke | Source 3fae18a Ready; all twenty fresh public-page/image/health/guest-denial checks pass at 05:15 UTC |

The committed scripts/session-step-up-db-check.mjs refuses any existing Auth
schema and connects only to the disposable password-protected loopback replay
cluster. It builds minimal provider-shaped tables in a rollback transaction and
uses a NOLOGIN reader with selected column privileges. Its identity verifier is
explicitly synthetic: this tests actual PostgreSQL query semantics, not genuine
Auth signatures, enrollment, mail, MFA challenges, refresh or logout policy.

Backend/shared unit coverage excludes SQL, frontend/browser journeys, server
lifecycle and genuine hosted integrations. SQL results are separately measured
cases; existing UI/Auth tests are regressions with synthetic provider responses.
Genuine provider acceptance, PostgreSQL 17, private role workflows and human
acceptance remain unverified. Zero of seventeen final mission groups is fully
proven; Phase 1 remains PARTIAL. Existing non-fatal module/Three.js warnings remain.

## Security review and remaining limits

STEP-01: a future privileged caller could otherwise trust user metadata, decoded
claims or an unexpired AAL2 token after server state changed. An attacker would
need an accepted account/token and a missing server enforcement path. This new
boundary verifies Auth first and binds identity, issuer, session and server MFA.
Negative unit tests deny forged/malformed/mismatched claims before the evidence
read. The real SQL fixture denies revoked sessions, downgraded assurance,
cross-user sessions/factors, missing factors/AMR, anonymous/unconfirmed/deleted/
banned accounts and replaced or unverified factors. These are scoped preventive
tests, not a reproduced hosted exploit or proof of genuine provider acceptance.

STEP-02: evidence can expire while a read is in flight, or stale proof can be
reused. Tests advance the clock during the awaited evidence read and deny token,
freshness and session expiry. Repeated verification reads fresh server state;
revocation on the second call denies. No proof is persisted or exposed as an HTTP
credential. A revocation after the read cannot retroactively cancel work: future
writers still need per-action verification, an explicit transaction/locking
boundary, concurrency/idempotency, scoped grants and atomic business audit.

The adapter reads only specific session/account/factor/AMR columns; it never reads
tokens, TOTP secrets, emails, IPs or refresh material. Future runtime credentials
need separate minimal-privilege/CA/timeout review and must target the issuer's
project. No existing login receives Auth privileges here. Effective provider
inactivity/timebox settings, other factors/recovery and genuine MFA remain open.
The technical freshness ceiling is not a product decision; MFA-POLICY-01 and
ROLE-BOOT-01 remain unresolved. Disabled writer implementation may continue.

The [Node announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules HIGH-severity 24.x fixes for 21 October. Sensitive enablement
remains blocked pending patch review/retest despite the baseline and npm audits
passing. Hosted advisor INFO concerns an existing intentionally closed audit
table; see [linter guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
This does not inspect the unapplied assignment schema.

Current primary references reviewed: [Supabase changelog](https://supabase.com/changelog),
[JWT fields](https://supabase.com/docs/guides/auth/jwt-fields),
[MFA](https://supabase.com/docs/guides/auth/auth-mfa),
[session AMR generation](https://github.com/supabase/auth/blob/master/internal/models/sessions.go)
and [AMR persistence](https://github.com/supabase/auth/blob/master/internal/models/amr.go).
Auth generates AMR seconds from updated_at; the adapter checks that timestamp.
Hosted inspection queried catalog columns only, never real Auth user/session rows.

Tool outputs were treated as untrusted data. Work used repository reads, synthetic
loopback fixtures, dependency metadata and reviewed hosted catalog/advisor reads.
No secrets, signed links, real customer/vendor evidence or private addresses were
printed/staged. No external message, real user creation, destructive hosted probe,
simulated human approval or unjustified privilege expansion occurred.

## GitHub and Vercel

Source commit 3fae18a6e0457a242e70466269930f30963e8330 is committed and pushed on
codex/phase-1-session-step-up, then fast-forward merged and pushed to main.
Independent git ls-remote confirms the same source on both remote branches.
Eighteen reviewed source/test/report files were staged explicitly; staged diff
validation passes and the user next-env edit remains unstaged. A transient Git
sandbox denial was resolved through the approved command path; no force push or
unrelated work removal occurred.

Vercel's read-only deployment API confirms that exact source on main READY in
Production, deployment dpl_Druki4V3afe5cx9Vs2GD96cZN9jZ:
https://virtual-bfa5iqvsx-shadowrootsec-5679.vercel.app. The alias
https://virtual-ink.vercel.app resolves to that deployment. At
2026-10-16T05:15:34.461Z, after that source became Ready, all twenty fresh
public-page/image/health/guest-denial smoke checks pass. These are regressions,
not genuine MFA or privileged-role acceptance. A post-deployment hosted catalog
read still shows ten migrations and no assignment schema/reader. A hosted source
build does not apply SQL or establish genuine Auth/MFA. No phase is complete.
This handover's final delivery evidence is recorded in a separate report commit.

## Team actions and document checks

- Uchi: review MFA-POLICY-01 and ROLE-BOOT-01, coordinate approved synthetic genuine
  Auth setup, and retain Node/release/human acceptance gates.
- Mumba: pair on disabled scoped role-write commands with concurrency,
  idempotency, trusted actor attribution and atomic audits; then genuine provider
  session/MFA acceptance and minimal-privilege integration review.
- Taizya: specify step-up, expired, denied, revoked and recovery states within the
  existing design; human UX signoff remains pending.
- Lubasi: confirm privileged reviewer/recovery operations and freshness needs;
  keep real approval and operational evidence outside Git.

Word uses the established compact_reference_guide preset, memo_masthead and named
report-style overrides. Structural document checks pass. Rendering was attempted
and failed because LibreOffice is absent (WinError 2); visual pagination remains
unverified. All 211 local links, report evidence, OOXML and privacy checks pass.
Report delivery is not human signoff.
