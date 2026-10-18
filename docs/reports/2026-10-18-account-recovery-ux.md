# Virtual Ink — Account recovery and accessible feedback

18 October 2026. Backend: Uchi Chinyama and Mumba Chitonge. Product: Uchi.
Design: Taizya Nakapende. Operations: Lubasi Monde.

**Status: local review slice; full UI upgrade and Phase 1 remain incomplete.**
Branch: `codex/account-recovery-ux`, based on `529482d`. No hosted URL,
Production release, human approval or genuine end-to-end account acceptance is
claimed. The supplied attachment directory and user-owned Next type file remain
untouched by the review commits.

## Change and preserved contracts

After a successful password update, the old form attempted logout. If logout
failed, it displayed an error alongside another Save new password action. The
new flow closes the password form and provides a logout-only retry. Network,
server or malformed-success responses that cannot confirm the update lead to an
explicit unconfirmed state; they do not acquire a success label. Expired recovery
sessions offer a new link. Validation, access and rate denials have fixed,
actionable messages, and raw provider errors are never displayed.

Login, registration, recovery and logout share labelled password visibility,
password-manager hints, native bounds, focused messages and live waiting status.
Submitted passwords are cleared from the input and never placed in component
state/storage/URLs. A synchronous gate rejects duplicate submits; unmount aborts
fetch and ignores stale results. Successful responses must contain the expected
existing server state. Request redirect following/caching is disabled.

The existing account pages, callbacks, APIs, proxy, cookies, provider identity,
current-role/MFA/native-receipt checks and database permissions are preserved.
The shared CSS width conflict found during browser review is corrected for
ordinary account pages, retaining the wider security-administration layout.
No dependencies, lockfile, database, Storage policies or server API changed.
The root web test script now also runs the account regression harness.

Changed screens/components: `/login`, existing register/recovery/reset/account
signout consumers, `AuthForm`, `PasswordRecoveryForm`, `SignOut`, new shared
account controls/transport and scoped account CSS. There is no new route.
The login page recognizes an unconfirmed-recovery notice without granting access.
See [setup/state behavior and rollback](../account-recovery-ux.md).

## Verification

- **214 root tests pass.** All **43 executable backend/shared files** are measured,
  none omitted: lines **2434/2453 (99.2254%)**, branches **1834/1901 (96.4755%)**,
  functions **233/236 (98.7288%)**. Frontend/browser, SQL, server lifecycle and
  genuine hosted integrations are excluded and tracked separately.
- **195 security tests**, **30 web component checks** (including twelve new
  account checks) and **16 SDK/Next adapter checks** pass. Scopes overlap; these
  are not an additive coverage denominator. The new handler harness uses
  synthetic hooks/forms/transport and is not a real-browser integration test.
- The account checks cover confirmed update plus HTTP/network logout failure,
  logout-only retry, unconfirmed outcomes, expired sessions, malformed success,
  validation/rate/access denial, non-enumerating recovery, duplicate work,
  unmount cleanup and fixed destinations. Separate SSR checks verify labels,
  hidden password defaults, native constraints and disabled unavailable actions.
- Web types, strict backend/shared types, lint and optimized build pass. The
  build produces twenty-two static pages plus existing dynamic routes. Root and
  web npm audits both report **zero vulnerabilities**. The runtime baseline
  passes on private Node **24.21.0**; this is separate from the HIGH release gate.
- Loopback: **61 new account assertions**, **44 existing account/Auth assertions**
  and **82 brand assertions** pass. The new HTTP test initially expected public
  reset access; the unchanged proxy correctly redirected. The test now asserts
  that denial instead. No guard was weakened to satisfy a test.
- The client artifact scan passes across **63 files**, with no scanned secret
  patterns. Repository security heuristics pass over **419 files**, no findings.
  These are scoped heuristics, not full source-history or provider assurance.
- Process restrictions initially blocked a child-process test; permitted execution
  passes the full suite. Type checking hit memory allocation failure with only
  about 372 MiB physical memory free. Stopping the task-owned preview and using
  a 512 MiB old-space / 2 MiB semi-space limit allowed types/build to pass. A
  build invocation without `APPLICATION_ENVIRONMENT` correctly failed; it was
  rerun with explicit `local`. Neither test nor isolation gates were relaxed.

Final browser, HTTP and document evidence follows below. The previous genuine
207-check local MFA run is historical evidence from 17 October, not rerun or
represented as new acceptance for this UI-only change. Hosted role/MFA/browser
acceptance and standalone SQL suites are not verified by this slice.

## Scoped security and privacy review

Prerequisite for the recovery issue: a genuine permitted update followed by a
logout/network failure. Impact: misleading retry state and possible unnecessary
repeat updates. The regression harness exercises that boundary and proves that
the corrected page sends a single update then logout-only retries. This is a
workflow correction; no new authentication or authorization bypass is proven.

Negative checks include forged role/cookie headers, direct protected route reads,
malformed success, untrusted provider error text, duplicate submits and abandoned
requests. Server authority remains mandatory. Canceling a request does not undo
provider work, prove logout or erase an issued token. The UI cannot guarantee
memory erasure of network payloads, password-manager data or browser internals.

No credential, real account/email, customer file, signed asset URL or private
vendor evidence is written to reports or Git. Synthetic tests use example.test
values and fixed responses. No hosted user, grant, role, schema, bucket, secret,
DNS, payment, scan target or external communication was changed. The review
covers this application surface, not the workstation, provider or whole system.

[React effect cleanup guidance](https://react.dev/reference/react/useEffect) and
[W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
inform the implementation. Screen-reader behavior and complete WCAG 2.2 AA
acceptance are not established by the synthetic focus/status checks.
[Supabase password Auth](https://supabase.com/docs/guides/auth/passwords) and the
[changelog](https://supabase.com/changelog) were reviewed; no SDK/provider change
is introduced. The announced TLS change remains an integration-review item.

## Hosting, limitations and next work

**No working Vercel Preview URL exists for this slice.** The recorded isolated
Preview classification problem, native MFA-hook-compatible target and runtime
release gates remain open. No new deployment attempt or push through the
original Production integration bypasses those boundaries. Original Production
does not contain this work. No release approval is inferred from local tests.

[Node's HIGH advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
still schedules fixes on or shortly after 21 October. A passing fixed baseline
and zero npm audit findings do not clear that release gate.

No mock production integration was added. Existing catalogue prices/images and
studio blank studies remain labelled concepts. Private upload/scanning, server
pricing, cart/order/proof/production/payment/delivery and operational dashboards
remain incomplete. Account unavailable states are intentionally retained.
Performance: build and local response checks only; no Lighthouse score, LCP,
frame/battery measurement or improvement is claimed. This slice adds no Three.js
import. Genuine email delivery, session expiry, MFA and provider updates still
need the isolated browser acceptance target. Recovery codes are not offered.

Rollback: use pre-slice `529482d` in a clean checkout and rebuild pinned
dependencies, preserving user work. No database rollback applies. Future approved
releases must retain the previous verified Vercel deployment and repeat security
denials after rollback; do not force-push or change Production settings here.

- **Uchi:** review the recovery correction and support the isolated Preview,
  compatible MFA target and patched runtime before approving release.
- **Mumba:** review the unchanged Auth contracts and genuine provider acceptance;
  continue the private-file/order/proof backend critical path.
- **Taizya:** test actual screen readers, keyboard/mobile/password-manager behavior,
  real zoom and genuine recovery/session/MFA flows on the isolated target.
- **Lubasi:** finalize private-file retention/scan/support and production policies;
  supply verified vendor/product evidence before live order promises.

Recommended next work remains Phase 1 private files and the genuine order/proof
journey, followed by real role workspaces and hosted acceptance. No phase closes.

## Final evidence

The final rebuild passes after the width correction; all 61/44/82 HTTP
assertions and the 63-file artifact scan pass against that build. Browser DOM
checks confirm a 620px desktop account section. At requested 320px width, available
width and scroll width both measure 305px, with no horizontal overflow; the
account section measures 268.8px. The visibility and submit buttons measure at
least 52.8px high; password/email text is 16px. Unavailable controls remain
disabled. Keyboard Tab moves from Create an account to Forgot your password;
Enter opens the recovery page, also without narrow-layout overflow. Final
sampled error-level browser logs are empty and the temporary viewport is reset.

The browser snapshot API failed in the tool; bounded read-only DOM checks and
screenshots were used. The tool's mobile screenshot includes excess window area,
so dimensions above come from the rendered DOM, not assumed screenshot pixels.
Real-device touch, password-manager interoperability, actual 200% zoom,
screen-reader announcements and genuine enabled Auth/recovery/MFA are still
pending. No screen-reader/complete WCAG acceptance is claimed.

Source review commit: `91a45b1ed41d84df4e88133d68a788d1d1c226e0` on
`codex/account-recovery-ux`. No push/deployment occurred. The handover is committed
separately. Matching Word generation passes its structural audit. Eight Markdown
files and 251 local links, real Word numbering, OOXML/package integrity and
scoped credential/privacy checks pass. Word visual rendering was attempted but
LibreOffice is unavailable (WinError 2); visual page QA remains unverified.
