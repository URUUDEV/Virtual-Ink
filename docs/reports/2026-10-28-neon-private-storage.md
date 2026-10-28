# Neon private staging buckets and storage verification

28 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Six private Neon buckets are provisioned, and synthetic hosted storage checks
pass. Application uploads and full-service Vercel acceptance remain open.
Phase 1 remains INCOMPLETE / NO-GO.** Uchi explicitly authorized Neon for buckets.
This work uses synthetic files only and does not enable real customer uploads.

## Delivered storage and environment boundary

The connected Neon organization is on the Free plan. Its only existing project
belonged to another application, so a separate project, virtual-ink-files-staging
(`weathered-wave-98734994`), was created in the supported aws-eu-central-1 region.
No paid upgrade was made. The new storage branch, staging-files
(`br-bitter-tooth-ba1x372f`), has no database compute. Its parent, main
(`br-autumn-wind-banu9azt`), remains without buckets. The new project includes the
provider's empty database foundation; no application schema or data is moved there.

The six buckets are private: quarantine, customer originals, proofs, approved
production files, production evidence and dispute evidence. The exact mapping
and safe project/branch identifiers are in ops/neon-storage.json. No public-read
bucket, customer evidence, browser credential or signed provider URL is created.

The storage endpoint is:
https://br-bitter-tooth-ba1x372f.storage.c-8.eu-central-1.aws.neon.tech/

This is an S3 endpoint requiring authorized requests, not an application website.
Supabase remains the existing database and Auth provider. Its workflow/authority,
scan and audit records are separate from Neon's file bytes. Neon branching does
not synchronize the separate Supabase database. Neither existing Supabase target,
the unrelated Neon project, main application branch nor production is changed.

The existing private S3 worker adapter operates against Neon without a provider
SDK, new runtime dependency or weakened file contract. It retains path-style
SigV4, UUID keys, write-if-absent, conditional reads, bounded bodies and SHA-256
verification. The new operator setup and acceptance scripts do not load the root
.env or start an HTTP service. They preserve all application service flags.
[Setup, commands and limits](../neon-private-storage.md).

## Credentials and scoped security findings

The default storage environment export initially supplied a credential anchored
to the parent branch. An operator reusing it would permit the private worker to
access that parent and its descendants. The actual parent is empty; no private
customer data exposure is reproduced. This is a configuration/isolation finding,
not a claim that Neon's documented credential inheritance is a provider flaw.

The fix uses named credentials anchored to staging itself. The worker has only
explicit storage:read and storage:write scopes; the verification reader has only
storage:read. Setup and the acceptance probe check live CLI credential metadata,
the exact branch endpoint and the six-bucket binding. Parent credentials, excess
capabilities and foreign endpoints are rejected. The endpoint export contains
metadata only, and the unused task-created write-only credential is revoked.
Credential values and creation responses remain exclusively under ignored
.private files, outside web/Vercel environments, reports and Git.

A write-only staging credential accepted PUT but returned 403 on GET. Neon's
documentation describes write as including reads; the tested worker therefore
uses both explicit scopes. No permission check was removed. Invalid signatures,
anonymous reads and a reader attempting a write remain denied. A staging worker
credential is denied on the parent branch. These are genuine hosted responses.

The remaining credential blast radius is the branch and its descendants, rather
than individual buckets or vendors. Worker isolation, controlled operator access,
rotation and environment binding remain necessary. A stolen worker credential is
not contained by the application's tenant checks. No per-bucket IAM or native
object-lock guarantee is invented.

## Verification results and exact scope

The successful hosted probe passes all 60 checks with zero failures. It includes
the binding/private-bucket catalog check; all five file purposes through private
quarantine, byte-for-byte readback, 412 overwrite and stale-ETag denials,
hash-verified promotion and approved readback; read-only credential reads;
anonymous quarantine/approved GET denials; read-only write denial; invalid
signature denial; parent-branch denial; and exact synthetic-object cleanup.

This proves storage operations with synthetic PDF bytes through the existing
adapter. It does not prove that those bytes are a valid customer document, have
passed a real malware scanner, belong to an authenticated application user or
have committed a workflow/audit transaction. No real customer/vendor file or
account is used. Private UUID fixture receipts are retained before writes and
cleanup addresses only those exact generated objects; no recursive delete runs.

Five controlled local configuration checks pass: inherited parent credential,
unneeded capability, foreign endpoint and ambient secret export are rejected,
and valid setup is restored. Each denial preserves the private worker outputs.
The operator files are restored after the checks; no foreign endpoint is called.
The first harness attempt could not start its child process under the sandbox;
the authorized rerun passes all five cases.

A fresh locked root development install passes: 169 installed packages and 170
audited dependencies, zero advisory findings. Source lint passes. All 261 root
tests pass with no failures/skips in the coverage run. All 53/53 backend/shared
inventory files are measured with no omissions: lines 3,145/3,166 (99.34%),
branches 2,381/2,455 (96.99%), functions 310/317 (97.79%). These aggregate metrics
exceed 95%; individual files may be lower. The new operator scripts, hosted S3,
SQL, process lifecycle, browser/device checks and genuine application integrations
are outside that backend/shared unit denominator.

The final separate security run passes all 237 checks with zero failures/skips;
the runtime gate passes on Node 24.22.1. An earlier separate security run failed
four loopback HTTP tests with Node Fetch's bad-port error before HTTP. The full
coverage run had passed; a separate security rerun passes. The original allocated
ports were not recorded, so their precise cause is not established and no
application code fix or fabricated reproduction is claimed. Both outcomes remain
part of the verification evidence. No test assertion or security rule is relaxed.

Earlier storage attempts are also retained: the first had 35/60 passing checks,
with incomplete transport/configuration outcomes; the explicit write-only worker
run had 35/60 passing checks and read denials; the corrected read/write run passed
59/60, with the remaining parent denial interrupted by a ten-second transport
timeout. A subsequent complete run passes 60/60. The timeout was not counted as
a successful denial. Provider connectivity remains an operational consideration,
not evidence that an unavailable response released file data. After adding durable
per-run fixture journals, a final repeat passed 59/60: the source overwrite check
timed out after ten seconds instead of receiving an HTTP response. All eleven
cleanup checks passed in that repeat. This failed attempt is retained separately;
no timeout is classified as a 412 rejection.

One 78-byte synthetic production-evidence object remained from an early interrupted
run. Its original fixture journal had been overwritten before per-run journaling
was added. Reconciliation read that exact UUID key, verified its expected ETag,
stored hash and byte-for-byte synthetic payload, recorded a private receipt and
deleted only that object. It did not authorize deletion from a prefix or an
unverified inventory. Future runs retain a journal per generated order as well as
the latest receipt, recording cleanup completion separately from test success.

The final complete run at 13:36:09 UTC passes all 60 checks with zero failures,
including eleven exact-object cleanup checks. A subsequent fresh, non-truncated
inventory shows zero objects in all six buckets and zero parent buckets.
The unused write-only credential remains in provider history with a revocation
timestamp; it is not an active worker credential. The repository security
heuristics pass with 516 files scanned, 139 skipped and zero findings. That
heuristic count is separate from the complete 53-file unit coverage inventory.

The official [Node October security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
and [Next.js October fixes](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
were reviewed. The tested runtime remains 24.22.1; the application remains on
the existing patched Next.js 16.4.2. No app dependency is added or updated.
This scoped application/storage review is not a provider, OS or workstation pentest.

## Hosting and acceptance limits

Neon itself hosts these private buckets. No new Vercel deployment, credential
binding, public promotion or sensitive-service enablement is performed. The prior
protected UI-only Preview remains the historical application reference:
https://virtual-ink-ui-test-jef2guxz7-shadowrootsec-5679.vercel.app

Its previously recorded source is ebf3d5461421f9d21b3fc1457299d13e4e3f1c0d;
that deployment has disabled services and does not run this storage integration.
Its earlier READY result is not transferred to the new operator scripts or a
full-service pilot. No new Vercel build, browser, physical-device, SQL migration,
genuine Auth/MFA or human acceptance is claimed by this slice.

Application enablement still requires the reviewed pending database migrations,
the accepted Free-plan MFA compensating path, restricted private runtime/TLS,
authorized ingress and queue, deployed private worker/scanner, current-role/order
file checks, audit/outage acceptance and genuine hosted customer/vendor journeys.
Commercial agreement, manual receipt/commission reconciliation and release/device
gates remain open. Buckets alone do not close any of those requirements.

Neon stores versioning/lifecycle configuration without enforcing those features.
The application retains its own immutable keys and verified hashes; automatic
retention is not supplied. Uchi/Lubasi must approve retention and capacity, with
an audited purge process before real files. The documented Free allowance is
5 GB of object storage per project; future consumption and plan choices need
review. [Provider limits](https://neon.com/docs/storage/overview),
[S3 limitations](https://neon.com/docs/storage/s3-compatibility),
[credential scope/inheritance](https://neon.com/docs/storage/authentication),
[pricing](https://neon.com/pricing).

## Team next actions

- Uchi: retain Phase 1 NO-GO; approve pilot file retention, capacity thresholds,
  private worker operating ownership and the actual commercial agreement.
- Mumba with Uchi: deploy authorized ingress/worker/scanning with these staging
  bindings, complete identity/MFA/database prerequisites and real audited file
  journeys, then record the secure full-service Vercel acceptance evidence.
- Taizya: verify actual upload progress, quarantine/rejection/retry and private
  download feedback with current role changes, keyboard access and physical devices.
- Lubasi: confirm allowed document formats, retention/deletion and reprint/dispute
  handling, alongside direct-payment receipt review and commission reconciliation.

No team member's approval, vendor acceptance or phase completion is inferred.

## Report delivery and review evidence

The matching Word document is generated with scripts/generate_team_report.py
using the existing compact_reference_guide preset and memo_masthead pattern.
The package/XML, real headings/lists, evidence text, Letter page geometry and
one-inch margins pass structural checks. All 515 local links across eleven
affected Markdown documents resolve. Bucket/credential readback also confirms
six empty private buckets, an empty parent and the unused writer's revocation.

Visual rendering was attempted with the document renderer and failed with
WinError 2 because LibreOffice/soffice is absent from PATH and the standard
installation location. No page images or visual acceptance are claimed. Render
and inspect the Word report on a workstation with LibreOffice before external
document circulation. Git whitespace checks pass; unrelated user files and
attachments are preserved and excluded from this storage slice.
