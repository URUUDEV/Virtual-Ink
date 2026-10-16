# Virtual Ink — MFA and privileged-role inspection

Date: 16 October 2026. Status: PARTIAL. Inspection before implementation.
Scope: MFA, privileged authorization, audit and restricted administration only.

| Surface | Inspected result / gap |
| --- | --- |
| Provider | Supabase Auth; pinned supabase-js 2.117.3 and SSR 0.12.7 in Next.js. Server cookie login, callback, recovery and logout exist; genuine deployed Auth remains unverified. |
| MFA | No enrollment/challenge/verify/factor-management UI or endpoint. Internal step-up.ts verifies Auth before claims and reads current session/account/factor/AMR facts, but has no runtime caller or credentials. No mfaEnabled/mfa_enabled authorization flag was found in application source. Synthetic AAL2 fixtures and pure policy inputs are not genuine MFA. |
| Role storage | Legacy virtual_ink.user_roles plus identity/tenant membership tables; private Phase 1 role_assignments and append-only role_assignment_audits in one unapplied migration. One active assignment per user; eight roles including ADMIN and SUPER_ADMIN. Specialist privileges need an explicit scoped representation, not duplicate aliases. |
| Browser/API/server actions | No client role-table mutation, role-changing HTTP endpoint or role-changing server action found. Registration rejects extra role fields. Existing account/API reads use legacy roles. |
| Private write paths | src/backend/provisioning/service.ts and vendor onboarding SQL create only Customer legacy roles under restricted policies and required provisioning audits. No privileged promotion command exists. |
| Database write paths | Existing assignment migration permits audited owner writes only; runtime/client roles lack new schema/write rights. SQL fixtures and migration administrators can seed assignments. Existing private provisioner/vendor INSERT policies constrain legacy roles to Customer. |
| Provider bridge | database/vendor-onboarding/supabase-bridge.sql is an unapplied vendor adapter, not an enabled MFA journey. Its server-derived freshness boolean is not evidence of genuine provider testing; new security work must use the stricter current session/AMR boundary. |
| Missing lifecycle | Trusted privileged writer, approval/execution separation, expiry, last-super-admin guard, fresh role reads, prompt session invalidation and full success/failure audit records. |
| Missing MFA controls | Genuine TOTP journey, durable limits/replay controls/events, recent reauthentication, audited logout/factor actions, controlled recovery and suspicious-change alerts. |
| Missing interface | Restricted role-management screen with reason, step-up, explicit confirmation, result and audit reference. |
| Hosted inspection | Only one active Virtual Ink project and no development branches are visible. Existing schema has ten migrations; the role foundation is not hosted. No approved isolated Preview target or genuine synthetic accounts are established. No real Auth rows/secrets were queried. |
| Release gate | Existing Node 24.x HIGH security announcement schedules fixes for 21 October. Sensitive enablement/completion remains blocked until patch review and retesting. |

Implementation will use a review branch and default-deny runtime configuration.
No production role/Auth mutation, credentials, user assets or unrelated features
will be introduced. The existing apps/web/next-env.d.ts user edit is preserved.
Hosted work depends on confirmed isolated non-production resources; the user was
asked for that target and approved synthetic identities without requesting secrets
in chat. Genuine acceptance cannot be replaced by SDK mocks or local SQL fixtures.

Next: genuine provider API adapters and TOTP UI; durable security events/limits;
server-only restricted role commands and DB enforcement; negative local tests;
then authorized isolated Preview verification. This report records gaps, not
completion or human approval.

Primary references reviewed: [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp),
[provider rate limits](https://supabase.com/docs/guides/auth/rate-limits),
[session validity](https://supabase.com/docs/guides/auth/sessions),
[changelog](https://supabase.com/changelog),
[Node security announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
