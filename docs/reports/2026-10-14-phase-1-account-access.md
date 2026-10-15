# Virtual Ink — Phase 1 account access and ownership

Date: 14 October 2026 (2026-10-14). Prepared for Uchi, Taizya and Lubasi. Mumba is inactive.
Backend and product owner: Uchi Chinyama. Engineering evidence does not record human signoff.

## Verdict and sequence

**Phase incomplete.** Implement the four product phases one by one, starting with
the full Phase 1 MVP. This delivers its first account-access slice for review;
genuine hosted login and the complete order journey have not passed. No phase is
marked complete. Every [local/testing/Vercel gate](../phase-completion-checklist.md)
and deployed URL remains mandatory. Preview and Production URLs: **unverified, not provided**.

Current ownership follows Uchi's instruction: Uchi handles backend engineering
and product leadership; Mumba has no active work. Current task/setup/role records
are updated; dated reports and the original role kickoff PDFs are preserved.

## What changed

- Registration and login pages, account navigation, error/loading/confirmation
  states and an explicitly disabled service state.
- Strict server endpoints for registration, login and logout; exact-origin CSRF
  checks, bounded JSON, credential validation, rejection of role/metadata fields
  and no credential reflection.
- Same-browser PKCE confirmation callback with fixed destinations; no arbitrary
  redirect, role selection or automatic privileged provisioning.
- Server-managed HttpOnly/SameSite cookies, Secure on HTTPS, online user checks,
  session refresh proxy and private/no-store responses. Failed login does not
  attach cookies. Registration clears a provider auto-confirmed session.
- Protected account page. Application roles come from the verified identity and
  restricted database. An Auth identity alone does not grant application access;
  a confirmed user may see pending application access.
- Root PostgreSQL driver pinned at `pg` 8.23.1 with generated lockfile. Next.js
  tracing root is explicit; the previous driver/root build warnings are resolved.
- Separate web environment template and [private setup guide](../phase-1-account-access.md).
  No credentials, hosted account, business record, grant or migration was created.

Code: [Auth contract](../../src/backend/identity/web-auth.ts),
[provider adapter](../../apps/web/src/lib/web-auth.ts),
[Next endpoints](../../apps/web/src/app/api/auth/[action]/route.ts),
[proxy](../../apps/web/src/proxy.ts),
[callback](../../apps/web/src/app/auth/callback/route.ts),
[account](../../apps/web/src/app/account/page.tsx),
[forms](../../apps/web/src/components/auth-form.tsx).

## Actual verification

| Check | Result and scope |
| --- | --- |
| Application suite | 141 passed, zero failed; includes nine new Auth contract/security tests |
| Security suite | 130 passed, zero failed; includes the new Auth negatives |
| React/3D checks | Nine passed; existing product/editor coverage |
| Real SSR/Next handler integration | Nine passed with installed Supabase SDK and synthetic HTTP responses; genuine provider accounts not used |
| TypeScript | Web and strict backend/shared/test checks passed |
| Production build | Next.js 16.4.0 webpack build passed without the previous driver/tracing-root warnings |
| Existing loopback HTTP checks | 53 assertions passed |
| Account loopback HTTP | 44 assertions across 11 requests passed with hosted Auth disabled; guest/forged-cookie redirects are actual HTTP 307 |
| Chrome responsive sampling | Login page: 1440, 900, 390 and 320 pixels; no horizontal overflow; header/main do not overlap; 320-pixel screenshot inspected |
| Chrome navigation/console | Registration link opens the correct page with new-password/12-character minimum; mobile My account returns a guest to login; sampled warning/error console is empty |
| Dependency advisories | Root production and complete web npm audits returned zero vulnerabilities |
| Runtime | Reviewed private Node 24.21.0 passes gate; default workstation runtime remains outside this evidence |
| Built frontend heuristic | 48 JS/JSON/map files, 1,590,100 bytes, zero skipped, zero matching secret patterns; no deployed/history scan |
| Repository heuristic | 207 source/document files scanned, 46 skipped, zero findings; exclusions are private/generated/binary surfaces, not a full history scan |
| Private setup checker | PG_DRIVER now passes; database configuration/logins/CA/Auth/smoke still blocked; genuineLoginVerified remains false |

Automated evidence: [contract regressions](../../test/web-auth.test.ts),
[real SDK/Next tests](../../scripts/web-auth-checks.mjs),
[loopback account checks](../../scripts/web-auth-http-checks.mjs).
Provider guidance was refreshed against [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
and [password Auth](https://supabase.com/docs/guides/auth/passwords).
[Node's current vulnerability/release page](https://nodejs.org/en/blog/vulnerability)
still identifies 24.21.0 as the latest LTS. Audit results are point-in-time checks.

## Reproduced finding and fix

A guest requesting the new protected account page received a streamed page
redirect with HTTP 200. This weakened predictable route protection/error behavior;
no private account data was returned. Protection now verifies identity and redirects
before rendering. Next.js requires an absolute proxy redirect; real HTTP testing
caught and corrected an intermediate relative-URL failure. The final anonymous and
forged-cookie probes return 307 to login, with private/no-store headers. The actual
Next proxy and loopback regression tests pass. Local startup verification now waits
for health before probes, avoiding the observed startup race.

## Security evidence and limits

Attacker prerequisites tested: anonymous browser, cross-site form/request source,
forged Origin/forwarded host, extra privileged role/metadata, malformed or oversized
body, tampered cookies, repeated confirmation code, missing verifier and injected
redirect. These produce bounded denials or fixed failure destinations; no role
grant, private data response or credential disclosure was reproduced. Provider
errors are mapped to safe API messages; failed sessions are not written to the
response. No client Supabase session or browser local-storage credential is added.

The tampered-cookie SDK test emits expected server warnings about invalid cookie
encoding and treats the cookie as absent. No cookie/token value was included in
the observed warning. This is documented test output, not a clean-production-log
claim. The final disabled-Auth preview stderr was empty after HTTP verification.

The eight-request worker ceiling is resource admission, not distributed brute-force
protection. Public Auth enablement needs verified provider limits, abuse controls,
mail/confirmation setup and CAPTCHA support as applicable. Local logout revokes
this session's refresh token; already issued access tokens can last until expiry.
Global revocation, privileged-action MFA/freshness and full role dashboards remain
unfinished. Application account mapping and genuine database roles must pass
before customer/vendor/admin workflows are approved.

Tool actions used reviewed source, synthetic requests, loopback preview and official
read-only documentation/advisory checks. No hosted writes, real onboarding, customer
files, live funds or external attack probes were performed. Dependency installation
is pinned and audited. This is a scoped application review.

## Remaining Phase 1 work

1. Configure genuine Auth and restricted database connectivity privately; test an
   approved synthetic email, confirmation, login, logout and application mapping.
2. Implement server-enforced customer/vendor/admin access and private, validated
   file upload/download/storage with cross-account denial tests.
3. Persist print options and orders; implement vendor job acceptance/rejection,
   quotes, customer quote viewing and valid status transitions.
4. Add admin user/vendor/order views, audited manual escrow/payment and delivery/
   pickup statuses, notification states and the complete order-to-delivery test.
5. Connect the approved Vercel project, verify Preview before Production, configure
   environment scopes and every deployed integration/security/mobile check, document
   domain setup and publish actual URLs in the completion report.

Do not start Phase 2 trust/operations implementation as a substitute for these
Phase 1 requirements. Phases 3 and 4 follow after their preceding phase is approved.

## Team actions and open decisions

| Person | Next action |
| --- | --- |
| Uchi | Backend/product owner: provide the approved synthetic test email and Vercel team/project; configure private Auth/DB settings; resolve MVP fields/status/option rules and continue the order slice |
| Mumba | Inactive; no action or acknowledgement dependency assigned |
| Taizya | Review account entry copy/accessibility and the upcoming customer/vendor/admin order states; sampled layout checks do not record human acceptance |
| Lubasi | Supply verified print capabilities, private-file retention and manual payment/pickup/delivery evidence rules; no commercial rules are invented |

Open: AUTH-WEB-01 genuine account setup, PHASE-01 concrete MVP requirements,
HB-06 hosting account/domain details, existing file/pricing/operations decisions
and hosted vendor migration-history reconciliation. See [questions](../open-questions.md)
and [task board](../task-board.md).

## Report delivery

Matching Word report uses the repository generator and the established compact
reference guide/memo layout. Structural/link/privacy checks are required before
delivery. LibreOffice is unavailable, so rendered-page/pagination verification
cannot be claimed. Report delivery does not imply production readiness.
