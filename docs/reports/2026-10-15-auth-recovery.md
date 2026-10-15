# Virtual Ink — Password recovery slice

Date: 15 October 2026. Owner: Uchi Chinyama and Mumba Chitonge, backend
collaborators. Status: **slice verified locally with synthetic provider tests;
Phase 1 remains PARTIAL**. This extends the existing Supabase SSR Auth foundation.

## What changed

Added a generic password-recovery request screen, fixed same-origin PKCE recovery
callback, and new-password screen protected by the existing server-verifying proxy.
The server accepts only the fixed reset actions,
validates bounded email/new-password inputs, rejects client-supplied authority
fields, sends reset email through Supabase Auth, verifies the current provider
session and confirmed identity before changing the password, and gives the email
request a non-enumerating response. After password change, the browser checks the
local session logout result before returning to login; failed logout shows a clear
session warning. Recovery codes and provider errors
are not returned or logged. Auth remains disabled unless its existing explicit
server configuration is enabled.

The approved logo and branded surfaces are unchanged. The new screens use existing
Virtual Ink typography, colors, callout and form styles.

## Verification

| Check | Result |
| --- | --- |
| Auth unit tests | 10 passed; includes strict inputs, authority-field rejection, CSRF/origin and safe provider errors |
| Supabase SSR/Next integration | 14 passed with synthetic HTTP/provider responses; recovery PKCE callback, provider request, password update, no-session denial and guest reset-page redirect covered |
| Full root test/coverage gate | 168 passed, zero failed/skipped; backend/shared: 1,449/1,463 lines (99.04%), 900/945 branches (95.24%), 138/141 functions (97.87%) across 32/32 inventoried files |
| Strict Next TypeScript | Passed |
| Next production build | Passed; includes `/forgot-password`, `/reset-password` and `/auth/recovery-callback` |
| Existing UI suite | 9 passed |
| Local Chrome profile `shadow` | Forgot-password screen rendered with a fixed notice and disabled controls while Auth is off; guest reset-page navigation redirects to login; no browser console errors captured |
| Repository security heuristic | Passed; 237 files scanned, 47 skipped, zero findings |
| Git whitespace check | Passed |

Required existing settings, separately scoped for Preview/Production: `WEB_AUTH_ENABLED`,
`APP_ORIGIN`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The provider must
allow the exact recovery callback URL and send confirmation/recovery email through
reviewed SMTP settings. No environment values were recorded or exposed.

Synthetic provider checks do not establish email delivery, expiry/one-time use
configuration, genuine account restoration or password reset in hosted Supabase.
The actual customer test mailbox remains unapproved; no account was created.
Preview/Production recovery was not tested. Protected Preview keeps its access
protection. No database migration or privileged credential was added. Fresh
loopback HTTP checks returned 200 for `/forgot-password` and a guest 307 redirect
to `/login` for `/reset-password`.

## Security review

An unauthenticated requester can submit a valid email to ask the provider to send
a reset email; account existence is not disclosed in the successful response.
Supabase controls provider email throttling; this app's in-process admission bound
is not a distributed per-account/IP rate limit. A stolen, unexpired recovery link
can establish the account's recovery session; the callback accepts exactly one
provider `code`, rejects every other query key, has no caller-selected destination
and sets session cookies only on successful exchange. The password update checks
`getUser()` against the provider and requires a confirmed, permanent identity;
missing session requests are rejected before password mutation. Same-origin
`Origin` validation and JSON-only POST handling remain in force.

No bypass, open redirect, email enumeration or unauthenticated password change was
reproduced in the synthetic tests. The proxy also redirects anonymous reset-page
requests to login. Remaining conditional risks are provider SMTP,
recovery TTL/one-time settings, distributed abuse limits, session revocation
semantics, real Auth configuration and administrator MFA enforcement. These block
production Auth acceptance and are not represented as tested.

Supabase behavior was checked against its current [password recovery guidance](https://supabase.com/docs/guides/auth/passwords)
and [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod),
which recommends email confirmation, bounded OTP expiry, custom SMTP and MFA for
sensitive administration. Admin MFA enforcement is still unimplemented.

## Team next actions

- Uchi: approve the synthetic mailbox and configure reviewed Preview Auth/email
  settings, reset URL allowlist and expiry; then verify a genuine full reset and
  session/logout lifecycle without recording credentials.
- Mumba: review recovery handler/provider behavior and continue the eight-role,
  server-owned authorization and suspension work with Uchi.
- Taizya: review the recovery/reset screens and responsive/error/accessibility
  states against the approved Virtual Ink direction.
- Lubasi: confirm the account-help and deletion-request operating process; no
  recovery or deletion service promise is made here.

## GitHub and deployment status

Review branch [`codex/phase-1-auth-recovery`](https://github.com/URUUDEV/Virtual-Ink/tree/codex/phase-1-auth-recovery)
is pushed to `origin` at commit `6e141a6`. The existing user-owned
`apps/web/next-env.d.ts` edit was left unstaged. A review branch push does not
merge to `main` or close Phase 1. No Preview deployment for this commit or
authenticated Production recovery has yet been verified.

The next backend slice is the eight-role authorization matrix and trusted role
storage/capability mapping. This slice did not complete AUTH-01/AUTH-02/AUTHZ-01,
the Phase 1 closure checklist, Vercel workflow gates or human acceptance. No phase
completion or Production URL verification is claimed by this report.

## Document quality

The matching Word file uses the established team-report generator and passes its
OOXML structural audit and report link/privacy checks. Visual pagination could not
be reviewed because LibreOffice is unavailable in this environment.
