# Private-file inspection worker

21 October 2026. Owners: Uchi Chinyama and Mumba Chitonge. **Local review slice;
FILES-01/FILES-02 and Phase 1 remain INCOMPLETE / NO-GO.** No route, bucket,
credential, upload, signed download, migration or hosted service is enabled.

## Implemented boundary

`src/backend/storage/file-inspection.ts` owns a copy of bounded input, computes
SHA-256 and checks exact declared MIME against PDF, PNG or JPEG signatures.
Empty and oversized content, renamed executables, archives, SVG, mismatched MIME
and incomplete signatures deny before scanner work. The configurable limit must
be positive and at most 25 MiB; that ceiling is not an approved customer allowance.
No filename, EXIF, path, signed URL or provider diagnostic enters returned metadata.
Identical bytes produce identical hashes, but durable duplicate detection is not
implemented and hashes never establish ownership or permission.

`src/backend/storage/clamav.ts` sends bytes using ClamAV's NUL-framed INSTREAM
protocol, with bounded chunks, write backpressure, an absolute deadline, a bounded
reply and one to four concurrent scans per scanner instance. Endpoint configuration
is server-owned and accepts only literal loopback IPv4/IPv6. Clamd TCP is neither
authenticated nor encrypted; use a protected worker sidecar, never a public port.
The implementation makes no path commands, shell calls, network retries or cached
clean decisions. Errors, early/partial/extra replies, unknown verdicts, saturation,
changed bytes or mismatched hash receipts fail closed.

Results have fixed meanings:

| Status | Meaning | Required handling |
| --- | --- | --- |
| REJECTED | Invalid size/type or positive scanner detection | Keep unavailable; record the outcome privately. |
| REVIEW_REQUIRED | Scanner unavailable or receipt invalid | Keep quarantined; controlled retry/review only. |
| SAFE | These signature and scanner checks passed for this hash | Persist against the immutable object version; separately enforce every access and promotion gate. |

SAFE is a content check, not full document validation, sanitization, a guarantee
that a file is harmless, production approval or a download grant. PDF scripting,
attachments and malformed/polyglot media need additional format/preview controls.
Serve any future original download as an attachment with safe fixed MIME, a safe
server filename and nosniff, after current authorization and required audit.

## Repeat the genuine local scanner check

Use the reviewed Node runtime and locked root development dependencies. Start only
the named disposable sidecar below. The image is ClamAV 1.5.4, pinned by digest;
its bundled signature snapshot is 28157, 18 October 2026. This records actual
engine detection with a fixed test database, not fresh hosted production coverage.
The test never opens a customer file or writes EICAR to disk.

```powershell
$scanCheckConfig = (Resolve-Path ops/clamav/scan-check.conf).Path
docker run --detach --rm --name virtual-ink-file-scan-check --user clamav --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --memory 4g --cpus 2 --pids-limit 64 --cap-drop ALL --security-opt no-new-privileges --publish 127.0.0.1:33310:3310 --mount "type=bind,src=$scanCheckConfig,dst=/etc/clamav/worker.conf,readonly" --entrypoint clamd clamav/clamav@sha256:e19130cdebaeacc71fa46eab3ed6f69941f2f22aa5e08d55e9197f8edf43ce5e --config-file=/etc/clamav/worker.conf
docker logs --tail 30 virtual-ink-file-scan-check
npm run check:security:files:local -- 33310
docker stop virtual-ink-file-scan-check
```

Wait for engine initialization before the npm check; a connection failure must
fail the check. Inspect logs only for this synthetic test container. The five
assertions cover clean PDF, clean PNG, a renamed executable, a PDF EmbeddedFile
containing EICAR, and direct raw EICAR detection. EICAR is a harmless standard
positive control, not a real malware sample. Merely pasting its text into a PDF
is not the standard EICAR test and must not be presented as a scanner failure.
The root/security suites separately test the adapter against controlled loopback
protocol servers; these are labelled synthetic, not genuine engine checks.

## Remaining integration and acceptance

1. Resolve the compatible isolated Auth/MFA target and genuine identity/session
   acceptance first. The current managed acceptance plan still cannot provide
   the required native hook; no paid upgrade or replacement target was created.
2. Approve purpose-separated private storage, allowed formats/limits, scanner
   worker hosting, update/freshness policy, retention and reviewer operations.
   Vercel functions do not have this loopback sidecar; no hosted scanner exists.
3. Bind intake to a current server-authorized order and immutable quarantine
   object version. Persist hash/size/MIME, duplicate policy, scan attempt/version,
   state transition and required append-only audit transactionally. Add durable
   account/tenant budgets, idempotent jobs, notifications and outage retries.
4. Enforce scanner configuration and current signatures operationally. Keep PDF
   and archive scanning enabled and limit/encryption alerts enabled; limits must
   not silently turn incomplete scans into clean decisions. The local fixture
   demonstrates these settings but is not provider attestation or a health feed.
5. Recheck identity, suspension, order/file purpose, ownership/current assignment,
   latest-active state and approvals before promotion or each signed download.
   Bind promotion to the scanned object version/hash; never rescan one object
   and sign another. Links must be purpose-scoped, expire within five minutes,
   and commit required access audit before issue. Delivery roles get no file access.
6. Prove SQL/RLS, provider policies, duplicate/race/outage handling and genuine
   hosted role denials with physical-device and human acceptance evidence. No
   migration or Storage policy is added by this content-worker slice.

Source references: [ClamD protocol](https://docs.clamav.net/manual/Usage/ClamdProtocol.html),
[official Docker guidance](https://docs.clamav.net/manual/Installing/Docker.html),
[ClamAV releases](https://www.clamav.net/downloads),
[standard EICAR test](https://www.eicar.org/download-anti-malware-testfile/),
[Supabase Auth hook availability](https://supabase.com/docs/guides/auth/auth-hooks).
