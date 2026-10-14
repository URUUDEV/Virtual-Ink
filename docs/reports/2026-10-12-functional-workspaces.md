# Functional local workspaces — Team report

Date: 12 October 2026

Prepared for Uchi Chinyama, Mumba Chitonge, Taizya Nakapende and Lubasi Monde.
Delivered for review; no human acceptance or production readiness is claimed.

## Result

Local designs and vendor profiles can now be kept and resumed rather than ending
at a preview or final download. The shirt editor downloads an editable version-1
JSON design, including local artwork. Open a design file validates its bounded
contract and decodes artwork before replacing the current design. Successful
restores are undoable; errors and concurrent edits preserve current work.

Download 3D view exports the current shirt angle as PNG with a concept label and
opaque background. It refreshes the selected design before rendering and copying
the frame, without keeping a persistent WebGL drawing buffer. Download preview
still exports the separate 2D layout. These remain concept images, not production
proofs or editable garment models.

Vendor preparation adds explicit device saving, loading/removal and portable
incomplete draft files. Existing completed profile packets can also be reopened.
Recovery chooses the first incomplete step, resets review confirmation and offers
Undo profile restore. Removing a saved draft retains the open form. Nothing is
saved or loaded automatically, submitted online or provisioned as a vendor account.

## Actual verification

All application checks used the reviewed private Node 24.21.0 runtime.

| Check | Actual result |
| --- | --- |
| Application suite | 127 passed; zero failed |
| React/mesh suite | 9 passed; zero failed |
| Security suite | 116 passed; zero failed |
| Runtime/heuristics, TypeScript and production build | Passed |
| Rebuilt loopback HTTP | 53 assertions passed |
| Production dependency audit | Zero reported vulnerabilities |
| Downloaded editable design and incomplete vendor draft | Actual browser files passed the recovery contracts |
| Downloaded 3D PNG | 847 by 700; opaque, bounded, nonblank and visually inspected |
| Vendor device workflow | Explicit save, reload/load, step recovery, confirmation reset, undo restore and removal preserving open entries passed |
| Responsive geometry | Both pages fit actual 1440, 1024, 768, 390 and 320 pixel viewports without horizontal overflow |

Automated file selection returned a Chrome permission denial. Native file-open
round-trips for the new widgets remain unverified; their bounded parsing contracts,
actual exported files and source rendering checks pass. New page screenshot/native
scroll commands also timed out, so complete visual UI review remains open. The
actual exported 3D PNG was opened and inspected separately. Uchi previously reports
artwork working; automated artwork texture/export verification remains open.

## Scoped security evidence

An attacker could fabricate a local design/profile file or tamper with a device
draft. Inputs are parsed as data, never evaluated. Extra authority fields,
unsupported versions/statuses, malformed/oversized input, markup/control characters
in vendor fields, unknown/duplicate services and fake verified states are rejected.
Tests demonstrate these rejections, including prototype-shaped extra keys. A
restored vendor confirmation is never trusted; final export requires valid fields
and an explicit new check. Incomplete draft structure does not imply readiness.

Project files are bounded before reading and use the existing allowlisted design
and PNG contracts. Decoding precedes replacement; asynchronous imports check for
unmount, a newer request and intervening edits. 3D exports use the existing bounded
renderer and reject stale updates or unavailable contexts. Download names are fixed
and local object URLs are revoked. No remote loader or server upload is introduced.

Device drafts contain vendor contact details and shirt artwork. Same-origin scripts
can read localStorage; this is not encrypted private storage. Persistence is an
explicit user action with private-device guidance and a removal control. Portable
files also require private handling. No new authorization bypass was reproduced.
Future server intake must validate independently and use reviewed identity/access,
retention, abuse limits and durable audits.

Tool actions used reviewed source, synthetic records, own generated files and
loopback probes. The file permission denial was respected, with no alternate upload
mechanism or privileged provisioning. Existing shirt drafts and supplied assets
were preserved; the newly created synthetic vendor device draft was removed.
No credentials, real private vendor evidence, external attacks or live approvals
were used. This is a scoped application review, not a whole-system pentest.

## Limits and next action by lead

Default Node 24.14.1 still fails the patch gate; the private runtime does not
establish durable deployment patching. Existing missing-`pg` and multiple-lockfile
build warnings remain. Genuine Auth, restricted logins/TLS, live intake/activation,
server synchronization and production garment specifications remain pending.

- Uchi: review the save/resume/export workflows and prioritize genuine vendor
  intake criteria. Resolve VL-03/VL-04; no signoff is assumed.
- Mumba: manually verify native file-open widgets, including invalid files and
  preserving current work. Complete identity/runtime setup and specify server
  intake validation, rate limits, retention, duplicates and audit before activation.
- Taizya: review the new controls and 3D image, complete mobile/desktop visual and
  assistive-technology checks, and test restore/error wording with users.
- Lubasi: confirm business fields, private-device/file handling, capability checks,
  intake ownership and agreements. Treat all declarations as unverified.

See [shirt scope](../tshirt-workspace.md), [vendor scope](../vendor-onboarding.md)
and [open questions](../open-questions.md). Historical reports are preserved.

## Report and references

The Word report uses the established compact-reference-guide preset and memo
masthead. Package/XML, privacy, preset geometry and local links are checked before
handover. LibreOffice is unavailable; rendering is attempted, but Word pagination
and visual QA remain unverified.

Renderer/export API references: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
and [MDN canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).
