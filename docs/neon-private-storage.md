# Neon private file storage

28 October 2026. Owners: Uchi and Mumba. Uchi selected Neon for the file buckets.
Phase 1 remains INCOMPLETE; application uploads and full-service acceptance remain open.

## Storage boundary

The isolated Free-plan project is `virtual-ink-files-staging`
(`weathered-wave-98734994`), in `aws-eu-central-1`. Its storage branch is
`staging-files` (`br-bitter-tooth-ba1x372f`), created without a database compute.
The empty parent branch is `main` (`br-autumn-wind-banu9azt`). The unrelated Neon
project is untouched. No plan upgrade or database/Auth migration is performed.

The reviewed binding is [ops/neon-storage.json](../ops/neon-storage.json).

| Worker purpose | Private bucket |
| --- | --- |
| Quarantine | vi-staging-quarantine |
| Customer originals | vi-staging-customer-originals |
| Proofs | vi-staging-proofs |
| Approved production files | vi-staging-approved-production |
| Production evidence | vi-staging-production-evidence |
| Dispute evidence | vi-staging-dispute-evidence |

Neon holds file bytes. Supabase remains the existing database/Auth provider and
stores the workflow, file authority, scan and audit records. Neon storage branching
does not automatically branch or synchronize that separate Supabase database.
Coordinate environment bindings and file references explicitly; never point a
production database at this staging branch.

The existing private S3 adapter uses path-style SigV4 requests, immutable UUID
keys, conditional creation/reads, bounded bytes and full SHA-256 verification.
Quarantine is separate from approved purpose buckets. Downloads remain verified,
audited server proxies; no provider URL or storage credential goes to a browser.
The scanner/worker host, authorized file ingress and application transport remain
separate work in [the workflow setup](order-storage-workflows.md).

## Private operator setup

Use the reviewed Node 24 runtime and authenticated Neon CLI. All commands below
target the isolated storage branch explicitly; there is no root environment pull
or replacement of the application's existing database configuration.

For a fresh operator setup, save storage endpoint metadata and issue named
branch-bound credentials into the ignored private directory:

```powershell
neon env pull --project-id weathered-wave-98734994 --branch br-bitter-tooth-ba1x372f --env AWS_ENDPOINT_URL_S3 --env AWS_REGION --env NEON_BRANCH --file .private/neon-storage-endpoint.env
neon credentials create --project-id weathered-wave-98734994 --branch br-bitter-tooth-ba1x372f --scope storage:read --scope storage:write --name virtual-ink-staging-file-worker-rw -o json > .private/neon-storage-writer-rw.json
neon credentials create --project-id weathered-wave-98734994 --branch br-bitter-tooth-ba1x372f --scope storage:read --name virtual-ink-staging-verification-reader -o json > .private/neon-storage-reader.json
neon credentials list --project-id weathered-wave-98734994 --branch br-bitter-tooth-ba1x372f -o json > .private/neon-storage-credential-metadata.json
npm run setup:storage:neon
```

Reuse existing private exports rather than issuing duplicate credentials. CLI
creation responses contain secrets: keep stdout redirected and never paste those
files into reports, Git, a web environment or a support message. The setup script
prints fixed status/identifiers only. It writes `.private/neon-storage-worker.json`
and `.private/neon-storage-read-only.json` after checking endpoint, branch, scopes
and the existing S3 configuration contract.

Do not use the default credential returned by a broad storage environment pull.
The provider's initial default was anchored to the parent branch and valid in its
descendants. This setup requires named credentials anchored to staging itself;
both operator setup and the acceptance probe reject inherited parent credentials.
Give the worker both explicit `storage:read` and `storage:write` scopes: the tested
write-only credential accepted uploads but returned 403 on reads.

Credentials remain branch-wide, including descendants, rather than per-vendor or
per-bucket IAM. Keep them only on the private worker. Application identity,
current-role/order checks, quarantine, scanning and durable audit remain required.
Use a separate branch and credentials for another environment.

## Repeatable verification and limits

Refresh bucket/access inventories with `neon bucket list` into
`.private/neon-storage-buckets.json` and the parent inventory into
`.private/neon-storage-parent-buckets.json`, using the explicit project/branch IDs.
Then run `npm run check:storage:neon`. The probe uses only a generated synthetic
PDF and UUID keys. It tests quarantine/readback, overwrite and stale-ETag denials,
hash-verified promotion, all five approved purposes, anonymous denial, read-only
scope and parent-branch denial. It records task-owned keys before writes and
deletes only those exact synthetic keys afterward. Private results are retained
under `.private`; interrupted cleanup requires reviewed exact-key reconciliation.

The acceptance probe needs its read-only verification credential and current
metadata snapshots. Those are operator tooling, not runtime application inputs.
No root `.env` file is loaded by either storage script. No HTTP route or sensitive
service flag is enabled, and storage credentials are not added to Vercel.

Neon does not enforce native object versioning or lifecycle expiration. UUID keys,
conditional operations and verified hashes protect this application contract;
approved retention requires an explicit audited purge process. Current documented
Free-plan object storage is 5 GB per project; approve capacity/operations before
real customer files. Provider support and plan limits can change.

See the [dated verification report](reports/2026-10-28-neon-private-storage.md)
for actual passes, failed attempts and remaining gates. A functioning bucket is
not evidence of malware scanning, current user authorization, hosted application
uploads, Vercel service acceptance, physical devices or human signoff.

Sources: [Neon storage](https://neon.com/docs/storage/overview),
[private buckets](https://neon.com/docs/storage/buckets),
[credential scopes and branch binding](https://neon.com/docs/storage/authentication),
[S3 limitations](https://neon.com/docs/storage/s3-compatibility),
[pricing](https://neon.com/pricing).
