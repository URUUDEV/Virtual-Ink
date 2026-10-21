# Backend private-file inspection

Date: 21 October 2026

Status: LOCAL REVIEW SLICE. Backend and Phase 1 remain INCOMPLETE / NO-GO.

Owners: Uchi Chinyama and Mumba Chitonge; product leadership: Uchi.

## Result and source

The deny-only file foundation now has a separately callable content inspector
and real ClamAV INSTREAM adapter. They check bounded bytes, exact MIME/signature
agreement, SHA-256 and scanner outcomes. Clean content checks do not grant file
access, persist a decision or promote an object. Upload/download routes remain
unavailable; Auth, database, Storage, orders and payments are not enabled.

Implementation commit: `10c652e3b979ebcc357ef35938b5d726d859dd5a`, local branch
`codex/phase1-private-file-inspection`, based on handover commit
`e47ba20be05167a7f92b50edf5df929a91ad7391`. Seven reviewed files were committed
explicitly. User-owned next-env changes, attachments, skills and agent files
remain unstaged. No force push, collaborator access change or external message.

The [worker runbook](../private-file-inspection.md) contains setup, the pinned
scanner image/configuration, repeatable synthetic checks and integration gates.
The new npm command is `npm run check:security:files:local -- 33310`; new negative
tests also run in the normal root and security suites. No dependency was added.

## Actual verification

Root locked development install completed before lint. Final results on private
Node 24.21.0:

| Check | Actual result |
| --- | --- |
| Complete root suite through coverage runner | 231 passed; zero failed or skipped |
| Security subset | 210 passed; zero failed or skipped |
| New private-file groups | 13 passed; includes real loopback protocol sockets |
| Web regression / Auth SDK contracts | 73 / 16 passed |
| Strict web types / source lint / web build | Passed; zero lint warnings |
| Root and web dependency audits | Zero reported vulnerabilities in each |
| Runtime baseline | Passed the existing minimum; HIGH advisory gate remains open |
| Genuine ClamAV positive/negative controls | Five assertions passed |
| Genuine stopped-sidecar outage | REVIEW_REQUIRED / scanner_unavailable; passed |

All **45/45 backend/shared source files** were measured, with no missing file:
lines **2,612/2,631 (99.28%)**; branches **1,978/2,045 (96.72%)**; functions
**258/261 (98.85%)**. Each aggregate exceeds 95%. This scope excludes frontend/
browser flows, SQL, genuine hosted integrations and src/server.js lifecycle.
Coverage is not a whole-product completion percentage.

The genuine engine was ClamAV **1.5.4**, official image digest
`sha256:e19130cdebaeacc71fa46eab3ed6f69941f2f22aa5e08d55e9197f8edf43ce5e`,
with bundled signature snapshot **28157, 18 October 2026**. Clean PDF/PNG passed;
a renamed executable denied before scanning; raw 68-byte EICAR and a PDF
EmbeddedFile carrying EICAR were detected. These are harmless synthetic controls,
not live malware or evidence of fresh production signature coverage.

The disposable sidecar ran as clamav, with read-only root, dropped capabilities,
no-new-privileges, bounded CPU/memory/PIDs and temporary storage. Its only published
port was 127.0.0.1:33310. The tracked configuration matches the tested values.
The task container was stopped and removed; image cache remains. Starting the
installed Docker engine also restored unrelated existing containers; their
contents were not inspected or changed. No customer files entered the check.

The initial sandboxed test runner failed with EPERM; the authorized controlled
run passed. An initial positive-control fixture pasted EICAR text inside a PDF and
failed its expected detection assertion. That is not the standard EICAR control.
It was corrected to a proper embedded file; all five final engine assertions pass.
No production detection weakness or application exploit is inferred from that
fixture error. No new SQL migration, SQL/RLS replay, browser or physical-device
acceptance was executed. Historical Auth/SQL results are not relabelled as fresh.

## Scoped security review

A future caller controlling file bytes could attempt MIME spoofing, renamed
executables, oversize input, malformed protocol responses or resource exhaustion.
The tests reproduce those conditional attack inputs and verify denial, bounded
worker concurrency, absolute timeout, bounded reply/stream chunks and fixed error
metadata. Byte ownership and SHA-256 binding prevent caller changes during the
scan or mismatched receipts from marking different bytes clean. Scanner outage,
bad/partial/extra/early replies and malformed receipts require review. Provider
paths, signatures and exception messages are omitted from inspection responses.
No currently exposed file endpoint was available to exploit.

Remaining risks are explicit: signature sniffing is not complete document/media
validation or sanitization; malware scanning cannot prove harmlessness. Clamd TCP
is unauthenticated, so the adapter accepts literal loopback endpoints only. A
trusted worker host/sidecar and operational signature/configuration checks are
required. Per-instance limits do not replace durable tenant/account budgets.
Immutable quarantine storage, duplicate policy, transactional audit, approval,
promotion and signed download authorization remain unbuilt and inaccessible.

Repository heuristics pass: **447 files scanned, 124 skipped, zero findings**.
Tool outputs were treated as untrusted data;
no secrets, signed links, external scans, persistence probes or simulated approvals
were used. This is a scoped application review, not a provider/OS/platform pentest.

Official sources still list Node 24.22.0 as latest LTS and preannounce a HIGH
24.x security release on or shortly after 21 October. The tested 24.21.0 satisfies
the repository baseline but is not current. No fixed security release or resolved
HIGH finding is claimed. Sensitive enablement remains blocked pending runtime
review, patching/retest and all other release gates.

## Hosting and remaining backend work

**No backend Vercel deployment or backend deployed URL exists for this slice.**
The earlier protected UI-only Preview is historical UI evidence, not hosted file
scanning or secure-service acceptance. No Vercel configuration, production
promotion, hosted SQL, Auth user, service role, Storage bucket or credential changed.

The current acceptance Supabase project was read as ACTIVE_HEALTHY, PostgreSQL
17.11. Official Auth documentation still limits the required native MFA hook to
Teams/Enterprise; no compatible replacement target or paid plan was configured.
The existing acceptance Vercel first-target/environment failure was not resolved
or redeployed. Original Production and historical migrations remain untouched.

The requested full backend remains open: genuine hosted Auth/session/MFA,
order-bound private storage/scan/audit/download, transactional versioned and
idempotent orders/quotes/manual payment confirmation, vendor assignments,
immutable proofs/customer approval, production evidence/QC, role journeys and
genuine deployed integration/physical-device/human acceptance. No escrow,
blockchain, automated payments or additional marketplace scope was added.

Push remains pending the documented development base, repository access and safe
deployment mapping. This local branch was not published through an unreviewed
original-project integration. No phase, human signoff or release gate is closed.

## Team next actions

| Owner | Next action |
| --- | --- |
| Uchi | Identify a compatible isolated Auth target; resolve safe deployment mapping; decide upload limits, worker hosting and scanner freshness policy. |
| Mumba | Review the adapter; next build order-bound immutable quarantine with transactional metadata/audit, durable limits and provider denials after identity acceptance. |
| Taizya | Review future quarantine/rejection/review feedback without presenting uploads, orders or scan approval as enabled. Continue the separate studio handover. |
| Lubasi | Supply accepted print formats/size evidence and proposed rejection notification, review and retention operations. |

Markdown and Word are generated with the repository compact-reference report
preset and memo masthead; structural checks accompany generation. Word visual
rendering remains unavailable without LibreOffice/soffice and is not represented
as passed. No human acceptance is recorded.

## Source references

- [ClamD protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html)
- [Official scanner image guidance](https://docs.clamav.net/manual/Installing/Docker.html)
- [EICAR standard positive control](https://www.eicar.org/download-anti-malware-testfile/)
- [Supabase Auth hook plan availability](https://supabase.com/docs/guides/auth/auth-hooks)
- [Node October HIGH announcement](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Node 24.22.0 release](https://nodejs.org/en/blog/release/v24.22.0)
