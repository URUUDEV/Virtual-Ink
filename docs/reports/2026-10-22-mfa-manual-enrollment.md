# Manual MFA enrollment and Phase 1 release status

22 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Local review slice delivered; release remains NO-GO.** Uchi Chinyama and Mumba
Chitonge own backend engineering, Taizya design, and Lubasi operational evidence.
No phase completion, production change or human approval is inferred.

## Source, deployment and environments

Implementation commit: `f260c77df66a58ab90d4437c9d39a918ce2d2c79`, branch
`codex/phase1-order-storage-runtime`, parent `3fe973a` (the preceding dashboard
handover finalized after resumption). Eleven source/test/setup files were committed
explicitly. The final reporting commit is identified in Git history and delivery.
No Git push occurred because the safe development deployment mapping is still
unresolved; this incomplete phase does not trigger push-after-phase completion.
The user's next-env edit, extracted attachments, .agents and skills-lock.json remain
preserved and excluded. Existing branding/assets/backend architecture are retained.

The protected **UI-only** Preview is READY:
[open review deployment](https://virtual-ink-ui-test-brkmks7b1-shadowrootsec-5679.vercel.app).
Project prj_aqLrX1gsSVb1XINH5YNGkp1aYazH; deployment
`dpl_E5XvBkULD86Qb3ryUNRUSiGNebpZ`; exact implementation commit above.
Request recorded **2026-10-22 08:19:48 UTC / 10:19:48 CAT**; READY/source/target
verified **08:22:04 UTC / 10:22:04 CAT**. The reviewed Git snapshot uploaded 463
files, with private files, credentials, Word documents, generated types and user
attachments excluded. Metadata confirms preview, non-Production target, fresh build,
zero aliases/automatic aliases and no automation-bypass binding. Cold logs verify
locked install, ui_test isolation on Node 24.22.1, lint, compilation and completed
build. Protection is retained; no bypass token, domain change or Production bootstrap.

This is not hosted Auth/MFA acceptance: Auth, security, database, workflows, storage,
uploads and payments remain disabled. No accepted full-service staging URL exists;
staging.virtualink.co.zm remains unconfigured/unverified. Production URL was not
verified in this task, and production is unchanged. Development checks use disposable
local Auth/PostgreSQL with synthetic accounts, separate from managed staging.

Fresh 22 October read-only checks confirm managed staging trlhbsgxcsgvfyxezayb still
has fourteen migrations, zero Auth users/buckets, no workflow schema and disabled
security/native hook. Its organization is still Free. No hosted SQL, Auth, role,
key, bucket, payment/email provider or billing mutation occurred. Local migrations
remain sixteen; original Production remains ten. No new migration/RLS/Storage policy
or grant is added by this slice.

## Delivered behavior and changed routes

The existing authorized enrollment and replacement-enrollment responses now expose
manualKey alongside their QR image/factor ID. This is the genuine provider TOTP
key already encoded in that QR, not an application-generated secret or recovery
code. Bounded Base32 validation rejects malformed/oversized keys. The otpauth URI
is omitted. Existing native session, recent password, replacement MFA, reservation,
rate-limit, result-audit, last-factor and reconciliation boundaries remain intact.

The security panel provides a labelled read-only field, masked by default, with
explicit show/hide controls. The QR and key clear on successful verification,
confirmed discard, explicit hiding and an absolute five-minute display deadline.
Rerendering does not extend the deadline; visibility changes recheck it after a
suspended tab returns. Unmount disposes listeners/timers. This is best-effort UI
cleanup, not secure erasure of JavaScript memory, developer-tool records or user
copies, and it does not delete/revoke a provider factor. An unfinished factor
remains listed for explicit audited discard. Existing authenticators survive replacement.

No setup key enters command/audit inputs, cookies, URLs, browser storage, telemetry
or reports. The enrollment response remains private/no-store. A failed required
result audit returns no enrollment payload. Status/ordinary verification responses
do not return the key. Security requests reject redirects, and malformed JSON or
unexpected result shapes produce fixed feedback without diagnostic reflection or
automatic retries of uncertain provider actions. [Setup contract](../mfa-manual-enrollment.md).

Changed surfaces: /admin/security client panel and the response contract of existing
/api/security/enroll and /api/security/replace-enroll, the server gateway and typed
SecurityAuth adapter. No new public route, role grant, financial operation or worker
credential is introduced. The provider QR uses image rendering, never raw SVG HTML.

## Verification and security evidence

All final checks use reviewed Node 24.22.1 after root npm ci --include=dev:

| Scope | Actual result |
| --- | --- |
| Complete root suite with coverage | 250 passed; 0 failed, 0 skipped |
| Security selection | 229 passed |
| Web component/handler groups | 81 passed, including four new enrollment groups |
| Real Supabase SDK / Next contracts | 16 passed; enrollment group extended |
| Strict web types / lint / production build | Passed; zero lint warnings |
| Final build after control styling | Passed, including lint/types |
| Genuine local Supabase Auth/MFA | 229 passed; cleanupPassed=true |
| Fresh root and web npm advisories | 0 at every severity |
| Browser static artifact scan | 67 artifacts, 0 findings |
| Repository heuristic scan | 476 scanned, 128 skipped; 0 findings |

All **50/50 backend/shared files** are measured, none omitted: lines
**2,975/2,996 (99.30%)**, branches **2,242/2,316 (96.80%)**, functions
**292/299 (97.66%)**. Each aggregate exceeds 95%. The denominator excludes frontend/
browser flows, SQL, genuine hosted integrations and src/server.js process lifecycle;
those are separate acceptance scopes, not an implied coverage pass.

The genuine total is 89 baseline + 120 native-hook/factor + 20 workflow checks.
Two new genuine assertions verify that the returned manual key exactly equals
the actual provider key and is neither cached nor written to session cookies.
That same key produces a successful genuine TOTP verification. Supabase Auth
2.197.0/PostgreSQL 18 keep their pinned images; generated values remain private,
and the existing real log-privacy check passes. No human authenticator entry,
physical QR scan, managed-cloud session or email delivery is claimed.

Root negatives cover enrollment-only disclosure, caller-field injection and result
audit outages. SDK tests reject absent/invalid/oversized keys and preserve HttpOnly
tokens. Component tests exercise masking/reveal, absolute expiry across rerenders,
return from suspended tabs, explicit hide, confirmed discard, successful verify,
no key in outgoing requests and fixed malformed/failure feedback. There is no
browser-storage access. These are controlled synthetic component checks, not a
browser, screen-reader or physical-device acceptance run.

Attack-path scope: an actor needs an authorized current enrollment to receive
its key; requesting another factor/role through enrollment rejects before the
provider call. Audit failure prevents disclosure. A malformed or redirected
same-origin API/proxy response is a conditional diagnostic-disclosure/credential-
forwarding path; controlled malformed-body canaries now show only fixed feedback,
and fetch rejects redirects. No external attacker-controlled endpoint was attacked
and no exposed hosted exploit is asserted. Revealing the key on the owner's device
has the same sensitive pairing purpose as the preexisting QR; privacy depends on
the owner protecting that device/view and its authenticator app.

The Windows restricted-token run failed the existing child-process isolation probe;
the final complete run passes outside that token without weakening the guard or
nondisclosure assertions. A later local build hit spawn EPERM and passed on the
permitted rerun. These are recorded setup failures, not application bypasses.
The official release index still lists 24.22.1 as the latest stable Node 24 security
release on 22 October. This is a reviewed runtime/package baseline, not a provider,
operating-system or AI-platform pentest or a future advisory guarantee.

Sources: [TOTP setup/key flow](https://supabase.com/docs/guides/auth/auth-mfa/totp),
[native-hook plan availability](https://supabase.com/docs/guides/auth/auth-hooks),
[official Node release index](https://nodejs.org/dist/index.json).

## Full launch gate status and remaining work

The [full dashboard/release report](2026-10-21-order-dashboards-launch-gates.md)
remains the comprehensive requirement map. Customer/vendor/admin order views use
real scoped reads and controlled forms, but none is the complete required dashboard
suite. This slice adds manual enrollment only; it does not close the following:

- Auth: real managed registration/email/recovery/session acceptance, customer/vendor
  security pages, physical authenticator and hosted replacement/recovery operations.
- Private files: authenticated ingress/queue, hosted worker, buckets/IAM, current
  scan operations, retention/deletion, short-lived access and actual proof viewer.
- Commerce: approved catalogue/vendor records, server-authoritative configurable
  pricing/fees/tax/discount policy, persistent cart, checkout and receipts/invoices.
- Orders/proofs/QC: complete production UI, revision comments, all required payment/
  delivery/refund states and genuine end-to-end role journeys. Existing local
  transactions/audits do not prove the complete hosted application workflow.
- Payments: approved sandbox/live provider, signed replay-safe webhooks, total
  reconciliation, failure/abandonment/refund/payout operations. No live payment
  success or funds movement is simulated.
- Notifications/monitoring: genuine event-driven messages, approved test/production
  email delivery, security-change notifications and verified operational error monitoring.
- Imports/design: missing writing block 58163, complete runtime/fallback acceptance,
  supplier-approved models/limits and remaining public reference/demo catalogue data.
- Acceptance: physical Chrome/Edge/Android/iPhone/tablet where available, keyboard/
  touch/network/reduced-motion/no-WebGL evidence, screen-reader/accessibility and
  performance/load/CWV results. No new pass is claimed for any of these.
- Release: genuine isolated full-service Vercel staging, backup restore and rollback
  rehearsal, production secrets privately configured, human go/no-go and explicit approval.

Ordinary Supabase TOTP is available on Free. The required native verification hook
under the existing security policy is the separate Teams/Enterprise capability.
Fresh official documentation and organization reads confirm that compatibility
gap. A compatible existing managed target or authorized self-hosted HTTPS target
with a reviewed adapter is still needed. No paid upgrade, weakening of the hook or
Production bootstrap is inferred. Approved payment/email choices and the source
for writing block 58163 remain unanswered. Existing first-target staging stop holds.

Remaining mock data is limited to controlled tests and the existing public product/
model reference data; no synthetic user/order or key was seeded into hosted services.
No original artwork, supplied branding asset or customer's file was changed.

## Controlled rollout, rollback and team actions

Production stays unchanged. Before any release, capture exact production target/
URL/deployment/commit/environment fingerprints, obtain a reviewed private backup
and prove restoration on isolation. Reconcile migration history and apply only
reviewed missing forward files, verify actual hosted role/Storage/MFA/payment/
notification denials and positive journeys, and obtain explicit approval for the
exact release candidate. No production migration, backup restore or rollback
rehearsal occurred here.

On a critical rollout failure, stop sensitive intake/processing, restore the recorded
compatible application/flag configuration, preserve committed orders/payment/audit
history and reconcile unknown provider outcomes privately. Use reviewed forward
schema repair; never destructive migration reversal or data deletion. The detailed
controlled procedure in the preceding report remains pending rehearsal/approval.

- **Uchi:** supply the compatible isolated target and approved providers; confirm any
  new paid cost separately. Resolve staging routing, source 58163 and safe development
  push/deployment mapping. Coordinate devices and eventual release authorization.
- **Mumba:** review the enrollment-only DTO and seed handling, genuine provider/
  native-hook/cookie lifecycle and remaining customer/vendor/worker/commerce flows.
- **Taizya:** review key masking and keyboard/screen-reader/touch controls with
  synthetic pairing data, then obtain genuine physical manual-entry/QR evidence
  on the approved staging target. Never capture a real setup key in shared evidence.
- **Lubasi:** define operational MFA/privacy/recovery support and device availability,
  and continue supplier, QC, delivery, payment/refund policy evidence with Uchi.

Recommended Phase 2 work remains deferred until accepted Phase 1, traction and an
explicit scope decision. Measurement-led queue/reporting scalability may follow;
no escrow, blockchain or expanded marketplace implementation is introduced.

The Word counterpart uses scripts/generate_team_report.py, compact_reference_guide
and memo_masthead. Structural/link/evidence/geometry checks run before delivery.
Rendering is attempted; missing LibreOffice/soffice prevents page-image inspection.
No visual QA, security-provider certification or human approval is inferred.

Final repository heuristic scan: **476 files scanned, 128 skipped, zero findings**.
The generator's structural audit and report link/content/coverage/deployment/Word
geometry checks pass. Git whitespace checks pass. Rendered review remains blocked
by missing soffice; no visual-QA pass or human acceptance is inferred.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED
