# Customer and vendor MFA — Phase 1 handover

22 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Review slice implemented; Phase 1 remains INCOMPLETE / NO-GO.** Uchi Chinyama
and Mumba Chitonge own backend engineering, Taizya design and Lubasi operational
acceptance. No human signoff, production readiness or phase completion is claimed.

## Source and environment evidence

Implementation commit: `4b6e7e18ff74ee37f9d9a80d43dda66515c86b50`, branch
`codex/phase1-order-storage-runtime`, parent `850c271`. Sixteen explicitly reviewed
source, test, migration and setup files were committed. Final reporting commit is
recorded in Git history and delivery. No Git push occurred: the safe development
deployment mapping remains unresolved, and this incomplete phase does not trigger
push-after-phase completion. The user's next-env edit, .agents, extracted Kimi
attachments and skills-lock.json remain preserved and excluded from our commits.

The exact-source protected UI-only Preview is **READY**:
[open review deployment](https://virtual-ink-ui-test-161y08zrf-shadowrootsec-5679.vercel.app).
Deployment `dpl_5HL3gjtHXjtvAoDZGAgqYaVkWh6F`, project
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`; source matches the implementation above.
READY and cold-build evidence verified **2026-10-22 10:42:14 UTC / 12:42:14 CAT**.
Request recorded **10:39:33 UTC / 12:39:33 CAT**; hosted logs report deployment
completion at **10:40:58 UTC / 12:40:58 CAT**, all on 22 October 2026.
The reviewed Git snapshot uploaded 469 files. Actual metadata confirms Preview,
non-Production target, buildSkipped=false, zero aliases/automatic aliases and no
automation-bypass binding. Cold logs verify locked install, ui_test isolation,
Node 24.22.1, lint, compilation and completed build. This is hosted build evidence;
Auth and every backend service remain disabled and are not accepted by this URL.
No accepted full-service staging URL exists. The stable hostname
staging.virtualink.co.zm remains unconfigured/unverified. Production URL and
deployment time are not verified in this task; production remains unchanged.

| Environment | Actual boundary |
| --- | --- |
| Development verification | Disposable loopback Auth 2.197.0 and PostgreSQL 18; synthetic accounts; containers cleaned up |
| Managed staging | Last read-only evidence on 22 October: Free, fourteen migrations, zero Auth users/buckets, security/native hook disabled; no mutations in this slice |
| Local migration inventory | Seventeen files; migrations 15–17 remain unapplied hosted; original Production remains ten |
| Protected UI-only Preview | READY exact-source Preview on virtual-ink-ui-test; ui_test guard keeps Auth, database, security, workflow, storage, uploads and payments disabled |
| Full-service staging / Production | No genuine hosted identity/workflow acceptance and no production rollout |

The full-service acceptance project's existing first-target routing stop remains
in force. No Production bootstrap, copied production secrets, protection bypass,
domain change, hosted user/role/bucket creation or paid upgrade occurred.

## Implemented behavior and routes

Current CUSTOMER and VENDOR assignments now receive a Security and MFA link at
/account. The new /account/security server page re-verifies identity and executes
account.security before reading provider factors. Disabled infrastructure shows an
honest unavailable state. Denied or unassigned accounts return to /account; approved
administrative roles continue to /admin/security. The administrative page also
independently checks its trusted role before rendering.

POST /api/security/self-status accepts an empty JSON object. The database returns
the current caller's role/user ID and the provider adapter reads that caller's
factors and assurance. No target account, browser role or editable metadata is
accepted as authority. Existing /api/security/status stays administrative. The
shared panel uses self-status for every self-service refresh and omits role/audit
administration. Neutral provider factor names now say Virtual Ink authenticator.

Both roles can enroll with the actual provider QR/manual key, challenge and verify,
list factors, replace an authenticator, discard unfinished enrollment and remove
a factor when another verified factor remains. Initial setup requires a recent
password. Replacement/removal require recent native MFA plus signed application
step-up; reservation, budgets, audit-before-response and uncertain-outcome controls
remain enforced. AAL2 does not grant an administrative role or authorize an unbuilt
payment operation. Customer enrollment is optional initially; removing the final
verified factor remains prohibited under the existing policy. Recovery requests
retain controlled review; private recovery execution is still incomplete.

Passwords/codes retain labels and password-manager/one-time-code hints. TOTP uses
a text input with numeric keyboard and correction disabled, preserving leading
zeros. All shared security forms now specify POST: loss of JavaScript cannot make
native form submission put security fields in a GET URL. A noscript notice explains
that MFA interaction requires JavaScript. Native fallback fails closed; it is not
a complete no-JavaScript enrollment flow. Existing exact Origin, JSON, no-store,
redirect denial and bounded private QR/key display controls remain intact.

No new catalogue, dashboard totals, payment status, file availability or service
success is fabricated. Existing customer/vendor/admin order dashboards retain their
previous scoped reads and controlled forms, but the full required dashboard suites
are incomplete. [Setup and rollback boundary](../account-security.md).

## Migration, authorization and security review

CLI-created migration `20261022102315_virtual_ink_self_service_mfa.sql` explicitly
replaces the private security command, adding only CUSTOMER/VENDOR allowance for
account.security and mfa.reserve. Normalized LF SHA-256:
`1133bc585046d393dde464de2a5a355ab468b40c11ca949b46b3a49f26e697de`.
Comparison with migration 14 confirms the remaining command body is unchanged.
No historical migration is edited. No new table, public schema, runtime LOGIN,
browser grant, RLS policy or Storage policy is added. CREATE OR REPLACE retains
the restricted ACL; temporary owner/schema creation privileges are removed.

Attack prerequisites reviewed: an authenticated customer/vendor with a genuine
session, caller-injected identity fields, another account's factor ID, an AAL1 or
revoked session, or a valid MFA session attempting administrative/payment access.
Actual SQL and genuine local requests prove scoped positives and the required
denials, including after native/application AAL2. The final factor remains usable
after a rejected removal. Existing concurrency, rate/replay, native receipt,
audit outage and dual-approval checks also pass. No hosted exploit is asserted.

Review identified a conditional native-form GET exposure if JavaScript failed;
explicit POST closes that source-level path. Synthetic rendered-form checks assert
every form's method. No physical/browser reproduction or credential disclosure is
claimed. Malformed input denies without account data: a nonadministrative invalid
request can return 403 from its required audit authorization rather than schema
400. Genuine tests accept only these bounded denials, never 5xx as authorization
success. Cross-account factor challenge specifically returns 401. Role/account
revocation, online provider and current native session checks remain authoritative.

The historical web-admin audit source is the shared transport label, not role
authority. This slice does not change that existing constrained schema. Audits
retain actual actor identity; no setup seed, code, password or token is printed,
persisted in command input or added to reports. Display cleanup is not secure
JavaScript memory erasure or provider factor deletion. Provider-direct initial
enrollment is not declared newly constrained by this application UI.

## Actual verification

Baseline was the preceding same-tree handover: 250 root, 229 security, 81 web,
16 SDK and 229 genuine local Auth checks. Final checks for this source:

| Check | Result and exact scope |
| --- | --- |
| Clean root dependency install | npm ci --include=dev passed |
| Root backend/shared unit tests | 251 passed; zero failures/skips |
| Security selection | 230 passed; overlapping subset, not added to root total |
| Web/component checks | 85 passed; synthetic hooks/server components and boundaries, not browser/device acceptance |
| SDK/Next Auth contracts | 16 passed; real SDK with synthetic HTTP |
| Genuine local Auth/MFA | 305 passed = 89 baseline + 120 hook/factor + 76 self-service + 20 workflow/dashboard assertions |
| Managed-shaped migration replay | All seventeen applied to a fresh isolated non-superuser CREATEROLE/BYPASSRLS fixture; owner membership/CREATE cleanup passed |
| SQL authorization | 123 security and 113 order/proof/QC assertions passed; six historical rollback suites passed; synthetic provider/storage fixtures |
| Strict types / lint / build | Passed; source lint zero warnings; final local build passed |
| Coverage inventory | All 50 backend/shared files measured; zero missing |
| Line coverage | 2,975 / 2,996 = 99.30% |
| Branch coverage | 2,245 / 2,319 = 96.81% |
| Function coverage | 292 / 299 = 97.66% |
| Fresh npm dependency advisories | Root 169 and web 125 dependency totals; zero reported vulnerabilities in either audit |
| Browser artifact review | 69 files; zero findings; static artifact scope only |

Coverage is aggregate for the complete declared backend/shared source inventory.
It excludes src/server.js lifecycle, frontend/browser, SQL and genuine hosted
integrations; no per-file 95% or product-completion claim is made. Genuine tests
use the pinned actual Auth/PostgreSQL images recorded by the local runner and its
real native hook, restricted application DB connection and signed cookie. The 76
new assertions include safe-response checks, not 76 separate end-user workflows.
Disposable cleanup passed. No synthetic fixture was seeded into managed services.

Initial SDK verification failed because its expected administrator-only factor
name was stale; the expectation now matches the neutral name. The first genuine
self-service run caught the 403 malformed-request audit denial described above;
the test expectation was corrected without opening that private audit command.
All final executed gates pass. Windows access restrictions required permitted
reruns for some reads/build preparation; no security guard was bypassed.

The reviewed runtime remains Node 24.22.1. Supabase changelog review identified
the upcoming November TLS cipher retirement; this slice adds no custom/legacy
transport or SDK dependency. [Provider TOTP contracts](https://supabase.com/docs/guides/auth/auth-mfa/totp)
support enrollment/challenge/verification; the separate
[native hook availability](https://supabase.com/docs/guides/auth/auth-hooks)
remains the managed-plan blocker. No workstation OS, provider, AI platform or
entire production-system pentest is claimed.

## Remaining launch gates and release procedure

Ordinary TOTP is available on Free. The required verification-attempt hook under
the existing security policy needs a compatible target; the present staging plan
is Free. An existing compatible managed target or authorized self-hosted HTTPS
target with reviewed adapter remains missing. No cost-bearing upgrade is authorized.
The exact isolated full-service Preview routing failure must also be resolved.
These are blockers, not reasons to weaken MFA or bootstrap Production.

Hosted registration/email verification/password recovery/session refresh/expiry,
customer/vendor/admin MFA journeys and recovery remain unaccepted. Private upload
ingress/queue, deployed scan/promotion workers, private buckets/IAM, retention and
proof-viewing transport remain incomplete. Catalogue/configurable server pricing,
fees/tax/discount policy, persistent cart/checkout and receipt generation are open.
All remaining dashboard sections, advanced vendor queue filters and full proof/
production/delivery/refund journeys need implementation and hosted acceptance.

Payment integration is **blocked**: no approved sandbox/live provider, signed/replay-
safe webhook, reconciliation/refund/payout acceptance or production funds movement.
Notifications are **incomplete**: no approved staging test-email or production
transactional delivery, event-driven business/security messages or accepted error
monitoring. Public product/model references and synthetic tests remain; no real
commercial catalogue or genuine orders are invented. Writing block 58163 is still
missing; approved assets and Kimi references are preserved.

No new physical Windows Chrome/Edge, Android, iPhone, tablet, touch/network or
reduced-motion/no-WebGL acceptance was performed. Automated labels/method checks
pass; screen-reader/keyboard-only/physical accessibility and performance/CWV/load
results remain pending. Emulation is not counted. Full hosted staging acceptance,
private production secret verification, backup/restore and rollback rehearsal,
documented go/no-go and explicit release approval remain open.

Production rollout is prohibited while these gates fail. Once they pass, record
the exact target, approved commit, private environment fingerprints and reviewed
backup; rehearse restoration on isolation and reconcile migration history. Apply
only reviewed forward migrations, deploy the approved candidate, exercise actual
Auth/MFA/customer/vendor/admin/file/order/payment/notification smoke tests and
monitor errors. On a critical failure stop intake/privileged processing, restore
the recorded compatible app/flags, preserve audit/orders/payment history and
privately reconcile uncertain provider outcomes. Use forward schema repair;
never delete production data or reverse applied migrations destructively.
No production migration, restore or rollback rehearsal occurred in this slice.

## Team actions and report checks

- **Uchi:** supply the compatible isolated target, approved payment/test-email
  providers and writing block 58163; settle safe development push mapping and any
  cost separately. Coordinate physical devices and eventual release authorization.
- **Mumba:** review migration 17's narrow allowlist and genuine role/factor denials;
  complete hosted connections/worker/private transport and the next Phase 1 slice.
- **Taizya:** review both account roles' setup/step-up/replacement UX with synthetic
  pairing material; collect real keyboard/screen-reader/mobile/manual-key evidence
  after genuine staging is available. Keep actual secrets out of shared recordings.
- **Lubasi:** organize device and recovery-support evidence; settle operational
  vendor, proof/QC, collection/delivery, payment/refund policies with Uchi/Mumba.

Phase 2 expansion remains deferred pending accepted Phase 1, traction and an
explicit scope decision. Queue/reporting scalability can follow measured demand;
no escrow, blockchain or additional marketplace scope is introduced.

The matching Word report uses scripts/generate_team_report.py and the Documents
skill's compact_reference_guide/memo_masthead format. Structural, link, evidence
and geometry checks pass. The final repository scan checks 482 files, skips 129
and reports zero findings; Git whitespace checks pass. Rendering is attempted; missing
LibreOffice/soffice prevents page-image inspection. No visual QA or human signoff
is inferred. This rendering limitation is separate from the passing source gates.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED
