# Phase 1 order, private-file and QC backend

21 October 2026. Owners: Uchi Chinyama and Mumba Chitonge. **Local review
candidate; hosted full-service acceptance and Phase 1 remain INCOMPLETE.**

## Runtime and enablement

Use Node **24.22.1** or a later stable Node 24 patch. The official October
security advisory identifies 24.22.1 as a fixed release. The root engine,
lockfile, .node-version and runtime checks agree. Every hosted build/runtime
isolation check rejects an affected Node version. `npm run security:release`
checks this reviewed baseline; it is not a permanent advisory feed.

`WORKFLOW_ENABLED` defaults off. The `/api/workflow/[action]` server route returns
404 while disabled. Local use also needs genuine Auth/security configuration,
a restricted security-service database login and the workflow database marker.
The fifteenth forward-only migration creates that marker **disabled**. It creates
no login, seed account, provider user, bucket or production configuration.
The separate UI-only Vercel project must keep all sensitive services disabled.

The shared Auth gateway validates the actual user and the same session's claims,
then the database rechecks the current native session/account, application user
and active unexpired role. Privileged operations also require recent native MFA,
the native-hook receipt, the application's signed step-up proof and a current
order-specific grant with reason. Browser role, price, state and hash fields do
not create authority. Unsupported organization/designer/admin override journeys
remain denied pending their scoped policy and integration work.

## Command contract and states

All commands use POST JSON with the exact application Origin, no query payload,
orderId and operationId UUIDs. Mutations include expectedVersion: zero for creation,
then the current version. Unknown fields reject. Reads recheck authority rather
than replaying old access receipts. Matching mutation retries return the original
receipt; reusing an operation ID with different input conflicts.

Each command runs in one READ COMMITTED database transaction. Current authority,
resource, expected version, mutation and append-only audit share that transaction.
An audit outage rolls back the mutation. The conservative advisory lock also
serializes the existing role writer; throughput/load acceptance remains open.
An account budget permits at most 120 commands per five-minute window.

| Journey | Commands and enforced gates |
| --- | --- |
| Customer intake | order.create, file.reserve, order.submit; submission freezes the active SAFE source file and immutable print specification. |
| Assignment and quote | order.assign requires an ADMIN/SUPER_ADMIN scoped grant and recent MFA; the vendor must be verified and accepting enquiries. quote.propose/review/accept/reject preserve immutable accepted money/currency/expiry records. |
| Manual payment | payment.confirm requires an explicit grant and recent MFA; FINANCE_ADMIN has no implicit right. A private evidence UUID is recorded. No funds/provider integration executes. |
| Vendor job | Reassignment to the quoted vendor after payment, job.accept and proof.request. job.decline places the paid job into a disputed hold with a reason; it does not refund or silently move accepted pricing to another vendor. |
| Proof loop | proof.upload binds a SAFE file/hash to an immutable proof version. Only the customer can approve or request changes against the latest proof ID; the vendor cannot self-approve. |
| Production | production.queue/start require payment and the latest approved proof. Start freezes that proof reference. Printing, finishing and packing evidence must be immutable SAFE files for that run. |
| QC and handoff | production.finish requires all three stages. qc.record requires the full passing checklist; failures require correction and fresh stage evidence. Only a current MFA-backed delivery.assign grant selects the delivery account; the vendor marks readiness. |
| Completion/history | The customer confirms collection or the assigned delivery role confirms delivery. Early customer cancellation is bounded by state. Disputes freeze readiness/completed work for manual review. order.timeline has bounded cursor pagination and a minimum delivery projection. |

Order-specific grants are private operator setup, not a new web grant writer.
Tests use explicitly synthetic approval references; no human approval is inferred.
Print limits (1–10,000 units, integer millimetre dimensions up to 10,000), ZMW
quotation bounds, evidence/checklist requirements and operational exception policy
are conservative candidate rules requiring product/operations acceptance.

## Private file boundary

`createWorkflowFileWorker` is a private worker library. Its database group can
only fetch a pending file, record a scan and prepare an approved production copy.
It has no user/role administration. Do not place worker DB/S3 credentials in
Next.js, browser or Vercel web environments. The worker host, authorized binary
ingress/queue and internal transport still need an approved deployment target.
There is no public unauthenticated upload or file-signing endpoint.

The S3 adapter uses Signature V4, HTTPS outside explicit local loopback, six
distinct private buckets, UUID object keys, write-if-absent and conditional reads.
Buckets separate quarantine, source, proof, production, evidence and dispute.
Supabase S3 does not support native bucket versioning: objectVersion here is a
location/ETag receipt, supplemented by full-byte SHA-256 checks and immutable keys.
No native provider versioning is claimed. This adapter makes no public bucket
policy and issues no raw provider bearer URL.

Bytes enter quarantine, are read back and checked against the intake hash, then
pass MIME/signature and real scanner checks. Only clean content is copied to its
purpose bucket and verified again before the transactional scan/audit commit.
Unknown external outcomes stay REVIEW_REQUIRED; late scans cannot replace frozen
source or superseded proof context. Owner/purpose-scoped duplicate links never
reuse another actor's authority or a cached clean verdict.

Production copies derive from the latest paid, approved proof/hash; the worker
cannot select an unrelated file. The assigned vendor can download that copy and
permitted current proof/evidence, never the customer's original. Superseded proofs,
unsafe files, other customers, unassigned vendors and delivery file requests deny.
The download library audits current access before storage I/O and rechecks current
authority afterward. It verifies bytes/size/hash and returns an attachment with
nosniff, sandbox CSP and no-store. It issues no signed URL; every download requires
a fresh authenticated request. A future delegated link must still meet the
five-minute, purpose-scoped grant rule.

The worker ceiling is 25 MiB, not an approved commercial upload allowance. These
checks do not fully validate or sanitize PDF/media structure. Production scanner
updates/freshness, retention, review/retry operations, notifications and provider
IAM acceptance remain open.

## Repeat local checks

Run `npm ci --include=dev`, the complete root coverage/security suites, web/Auth
contracts, types, lint and build on the reviewed Node version. The backend/shared
inventory includes every new business file; SQL, browser and hosted evidence are
reported separately.

On Windows with PostgreSQL 18 in its normal Program Files location:

```powershell
pwsh -NoProfile -File scripts/replay-order-workflows.ps1
```

This creates a fresh loopback-only cluster on 54329, replays all migrations as a
managed-shaped non-superuser, runs six historical rollback suites, the existing
security assertions and the workflow journey. Session rows in this runner are
provider-shaped fixtures, not genuine Auth. Synthetic workflow fixtures are
committed only inside that disposable cluster; the cluster is stopped afterward
and private diagnostic files are retained. It never reads production credentials.

The opt-in `-RealStorage` mode requires preconfigured local S3 at 127.0.0.1:33320,
ClamAV at 127.0.0.1:33310 and ignored .private/workflow-s3-check.json containing
only those synthetic local bindings. It exercises actual private objects, scan,
promotion, overwrite/anonymous denials and hash-verified downloads. The integration
record identifies the exact engine digests and limits; local engines are not a
hosted provider certification.

`npm run check:security:auth:local` separately starts digest-pinned genuine local
Supabase Auth and PostgreSQL with synthetic accounts. It now includes thirteen
workflow Auth/MFA/session checks after the original 207 checks, with the exact
normalized workflow migration hash recorded. It does not deliver email, scan a
physical authenticator or prove a Vercel session.

## Hosted work still required

The existing managed acceptance project remains incompatible with the required
native MFA hook on its current plan. An existing Teams/Enterprise target or an
authorized self-hosted HTTPS target is still required. No billable upgrade is
inferred. The acceptance Vercel first-target routing stop also remains in force;
no Production bootstrap or environment relabelling is authorized.

After selecting a compatible target: reconcile/apply the forward migration, run
the provider catalog/advisor and actual-role denials, provision least-privilege
logins and six private buckets, deploy the worker/ingress, verify real Auth/email,
cookies/MFA, provider IAM and every full workflow on a genuine Preview. Recovery,
organization/designer/override flows, operational policy, real devices and human
acceptance remain separate open requirements. No phase is closed by local tests.

Sources: [Node security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases),
[Supabase hook plans](https://supabase.com/docs/guides/auth/auth-hooks),
[S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility),
[conditional S3 writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html).
