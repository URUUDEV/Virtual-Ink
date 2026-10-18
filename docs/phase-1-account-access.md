# Phase 1 — account access slice

18 October follow-up: Uchi and Mumba now collaborate on backend engineering;
the historical ownership statement below is preserved as its original snapshot.
[Account feedback/recovery UX](account-recovery-ux.md) adds safe update/logout
states and shared controls without changing the server contracts described here.

Date: 2026-10-14. Backend and product owner: Uchi Chinyama. Mumba is inactive.
Phase 1 is the full product MVP, followed by Phases 2, 3 and 4 in that order.
This slice does not close Phase 1; [all completion gates](phase-completion-checklist.md)
still apply.

## Delivered behavior

- `/register` and `/login`: responsive email/password forms with loading, error,
  service-unavailable and email-confirmation states. Registration requires a
  12–128 character password; login preserves compatibility with existing passwords.
- `POST /api/auth/register`, `/login`, `/logout`: strict JSON bodies, 16 KiB body
  ceiling, password/email bounds, exact configured Origin and cross-site denial.
  Extra authority fields and query-string redirects are rejected.
- `/auth/callback`: same-browser PKCE email-confirmation code exchange, fixed
  success/failure destinations and no code reflection. Missing/repeated/invalid
  codes and extra redirect parameters fail closed.
- `/account`: protected on the server with an online provider user check. Roles
  are read only through verified identity and the restricted application database;
  browser metadata, signup fields and headers grant no application authority.
- Supabase sessions use server-managed HttpOnly cookies, Secure on HTTPS,
  SameSite=Lax and path `/`. The Next.js proxy refreshes account sessions;
  cookie-writing responses are private and never cached. No browser Supabase
  client, local-storage session or secret/service-role key is introduced.
- PostgreSQL driver `pg` 8.23.1 is pinned at repository root with the generated
  lockfile. Next.js tracing explicitly uses the repository root.

## Private setup

Use [web environment template](../apps/web/.env.example) privately as
`apps/web/.env.local`; Next.js does not load the repository-root `.env` automatically.
Never copy the separate provisioning environment into the web application.
Set the project's modern publishable key and verified project URL privately.
Set `APP_ORIGIN` to the exact browser origin; `localhost` and `127.0.0.1` are
different origins. Only HTTPS or local loopback HTTP is accepted.

Before enabling `WEB_AUTH_ENABLED`, configure email/password Auth, email confirmation,
approved mail delivery and the exact `${APP_ORIGIN}/auth/callback` redirect URL in
Supabase. The confirmation link must open in the browser used to register because
it holds the PKCE verifier. Registration never supplies roles or logs in an
auto-confirmed session. If confirmation is disabled in the provider, the application
clears that session; this does not establish that an email was delivered.

Use an explicitly approved synthetic development email for genuine smoke testing.
No hosted user, vendor, privilege or database record was created by this slice.
An Auth identity is separate from a provisioned application account. A confirmed
login can show pending application access; it does not self-provision a customer,
vendor membership or admin role. [Restricted database setup](live-backend-setup.md)
remains required for `AUTH_ENABLED=true` and role reads.

Logout revokes this session's refresh token and removes its browser cookies.
Already issued access tokens can remain valid until expiry; global device/session
revocation and sensitive-action freshness are unfinished release requirements.
The eight-request per-worker admission ceiling bounds simultaneous work only.
Distributed abuse/rate limiting, CAPTCHA integration and provider settings must
be verified before public enablement. Do not treat it as brute-force protection.

## Verification and next steps

Run `npm test`, `npm run test:security`, `npm run test:auth:web`,
`npm run typecheck:web`, `npm run build:web` and repository security checks on
the reviewed Node runtime. Adapter tests use the real installed Supabase SSR SDK
and actual Next.js handlers with synthetic HTTP responses; they do not prove
genuine hosted Auth, mail delivery or deployed database connectivity.

Next: finish genuine account-to-application mapping and role denial tests, then
private file intake and persistent customer print orders, vendor job/quote flow,
admin manual payment/delivery recording and an audited full order journey.
Keep later product phases queued until Phase 1's tests and every Vercel gate pass.
Preview/Production URLs, private environment scopes and account ownership remain
unverified; no phase can be approved yet.

Provider references: [Supabase Next.js SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
and [password Auth](https://supabase.com/docs/guides/auth/passwords).
