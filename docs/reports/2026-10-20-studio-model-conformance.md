# Virtual Ink — studio model conformance audit

Date: 20 October 2026. Phase 1 is **INCOMPLETE**, release **NO-GO**.
This is a local public-asset audit and repeatable operator command. No application
feature, supplier approval, physical-device acceptance or production release is
completed by it.

## Result and change

All nine registered GLBs pass Khronos glTF Validator 2.0.0-dev.3.10 with
**zero errors, zero warnings and 104 informational UNUSED_OBJECT notices**.
The notices refer to UV attributes in blank meshes without baked textures. The
viewer attaches customer-design canvas textures to the named printable materials
at runtime. Other geometry also carries UVs. These notices are retained in the
evidence; no validator issue is suppressed or downgraded. This is not a visual
or physical-accuracy assessment.

New command: npm run check:studio:assets. Source commit:
`a48a9d24640ff61a5964cb60627b6d3ab664ce8c`. The audit reads registered public
GLBs, validates their binary/JSON data, checks printable material names and UV
bindings, verifies the draft/model-version metadata and rejects external model
resources. All nine real models make zero external-resource callback requests.
The tenth product, business-card, is correctly flat-only with no GLB. SVG
fallback rendering is outside this new audit.

Four in-memory negative controls pass: truncated GLB, a NaN position value,
an external-buffer reference and a missing printable material. The external
fixture invokes the rejecting callback once; it performs no network/file fetch.
No real asset is modified by a negative control. This confirms these particular
failure paths, not every possible malformed input or denial-of-service condition.

The [sanitized JSON evidence](2026-10-20-studio-model-conformance.json) records
each model's byte count, full SHA-256, material surfaces and issue counts/codes.
The audit prints that schema to stdout and exits unsuccessfully on a failed
assertion, warning, error or external request in a real asset.

## Reproduction and verification

Use the reviewed Node 24.21.0 baseline and existing root development install.
Install the validator separately, with lifecycle scripts disabled:

```text
npm install --prefix .private/studio-asset-tools --ignore-scripts --save-exact gltf-validator@2.0.0-dev.3.10
npm run check:studio:assets
npm run lint
```

An optional first positional argument supplies an alternate trusted validator
installation directory. The audit asserts the exact validator version and never
installs packages itself. Root/web dependency manifests and lockfiles are
unchanged except for the root npm command; the validator is not an application
dependency or browser import. The isolated install has one package and reports
zero npm advisories at this check. The isolated package lock's SHA-512 integrity
matches the registry value; no application lockfile is changed.

| Executed scope | Actual result | Limit |
| --- | --- | --- |
| Official model validation | 9/9 GLBs; 0 errors, 0 warnings; 104 informational notices | No GPU, fallback SVG or supplier validation |
| Registry binding and resource checks | All nine pass; one flat-only product; zero real external requests | Reviewed static catalogue only |
| Negative controls | 4/4 pass using in-memory corruption | Not exhaustive fuzzing or runtime upload checks |
| Public npm command and full source lint | Pass | No new app build or deployment |
| Isolated validator npm audit | Zero advisories | Does not clear the runtime HIGH gate |
| Runtime baseline | Node 24.21.0 passes | Existing scheduled HIGH patch gate remains open |
| Scoped source-security heuristic | Pass; 438 scanned, 118 skipped; no findings | Bounded text heuristic, not a full secret/dataflow audit |
| Hosted browser/metadata refresh | Blocked by connectivity | Previous READY evidence retains its original timestamp |

No root, web, Auth, SQL or browser test suite was rerun for this operator-only
change. No new code-coverage percentage is claimed for the audit script. The
[previous repair report](2026-10-20-studio-preview-safety.md) preserves 218 root,
65 web, 197 security and 16 Auth contract checks, plus the separate measured
backend/shared denominator: all 43/43 files, 2473/2492 lines (99.24%),
1883/1950 branches (96.56%), 239/242 functions (98.76%). Those historical results
exclude frontend/browser, SQL, genuine hosted integrations and src/server.js
lifecycle; they do not establish whole-product or new-tool coverage.

## Hosted boundary and security review

Chrome navigation to the exact-source studio timed out. A supported DOM read
then showed Chrome's network error page with proxy/firewall and network-diagnostic
links, rather than the application. The review tab was released successfully.
A read-only Vercel metadata/build refresh also failed; no new hosted acceptance
is claimed. No alternate profile, protection bypass, generated credential or
browser network setting change was used.

The prior [protected UI-only Preview](https://virtual-ink-ui-test-bqgq1cn7w-shadowrootsec-5679.vercel.app)
was READY at source de616ad739e92d2eb42f2a4a08d5ab8f80a17644 and deployment
dpl_FXjE9rbrNgvyMHmZh3Q7mLS6Xb1A, inspected at 2026-10-20T08:44:03Z.
That is historical build evidence. Git comparison confirms the current web
application source, registry and public studio assets match that source exactly.
No new deployment, aliases, domains, Auth/database/storage enablement, orders or
payments are created by this audit.

An attacker would need to change the reviewed public model or operator tool
installation to affect this surface; no customer-controlled model URL or new
runtime endpoint is introduced. The genuine malformed binary and external-resource
controls demonstrate rejection by this local checker. They do not add a production
upload scanner or prove the browser loader rejects every malicious model.
Only repository demo geometry and the explicitly installed validator are read.
External resource loading is denied; no private customer/operator data is read,
and raw credentials/customer files are absent from
the JSON/report. No exploitable application flaw was reproduced; no asset repair
was necessary. Windows process-creation denials were retried with explicit tool
approval; tests and guards were not weakened. This remains a scoped review, not
a workstation/provider/production-system pentest.

The [official validator documentation](https://github.com/KhronosGroup/glTF-Validator)
describes glTF 2.0 structure, references, accessors and binary-data validation.
The [Node API example](https://github.com/KhronosGroup/glTF-Validator/blob/main/node/README.md)
documents validateBytes and the external-resource callback. The local audit uses
that API with a rejecting callback. It does not infer model appearance or vendor
approval from conformance.

## Team actions and handover

- Uchi: retain NO-GO; review the audit, restore ordinary Preview connectivity and
  coordinate exact-source hosted checks and genuine release decisions.
- Mumba: review the local audit/resource denial; continue compatible isolated
  Auth/MFA and private-service acceptance without enabling services on ui_test.
- Taizya: verify real model/layout rendering, retry/error announcements, artwork
  and physical touch/keyboard/low-memory behavior when browser access is restored.
- Lubasi: provide supplier/licence/measurements/stock/pricing evidence and the
  required physical-device/tester availability. Conformance is not supply proof.

Rollback: remove only the new audit command/script in a reviewed follow-up commit;
the isolated ignored tool directory may remain. Preserve application assets,
historical reports and unrelated user changes. No production rollback rehearsal,
human signoff, phase completion or Git push is recorded.
The Word copy uses the existing compact_reference_guide and memo_masthead preset.
Structural/table-geometry, package/XML/numbering/privacy and local-link checks
pass; model hashes, issue counts, tool-package integrity and unchanged release
classifications are checked against the evidence. Rendering reached conversion
but failed because LibreOffice/soffice is missing (WinError 2). No page images or
visual layout verification are available. Documentation is committed separately
from a48a9d2 on the review branch; unrelated user work remains unstaged.
