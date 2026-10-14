# Vendor profile preparation — Team report

Date: 12 October 2026

Prepared for Uchi Chinyama, Mumba Chitonge, Taizya Nakapende and Lubasi Monde.
Delivered for review; no human signoff or production readiness is claimed.

## Result and scope

The public `/vendors/join` route now provides three steps: business details,
declared services/operations and profile review. Business and footer links make
the flow discoverable. Back navigation retains entries; errors focus the first
invalid field and new steps focus their heading.

The user explicitly downloads a JSON profile with `prepared-not-submitted` and
`self-declared` labels. Entries remain in the current tab's component memory;
there is no persistence, network submission, approval or account creation. The
profile contains contact details and must be stored/shared privately. Users are
asked to omit street/home addresses, passwords, IDs, bank details and evidence.
No real vendor information was used during verification or recorded here.

This follows the completed [fonts and 3D shirt slice](2026-10-12-fonts-and-3d-shirt.md),
which delivers seven typefaces and a rotatable procedural concept shirt. Uchi
reports artwork working; automated artwork texture/export round-trip remains
unverified. No backend schema, identity provider or provisioning setup changed.

## Actual verification

Checks used the existing reviewed private Node 24.21.0 runtime and loopback preview.

| Check | Actual result |
| --- | --- |
| Root application suite | 125 passed; zero failed |
| React/3D source suite | 8 passed; zero failed |
| Security regression suite | 114 passed; zero failed |
| Runtime and repository heuristics | Passed; no reported findings |
| Web/shared TypeScript and final production build | Passed |
| Rebuilt loopback HTTP | 53 assertions passed |
| Frontend production dependency audit | Zero reported vulnerabilities |
| Chrome form checks | Required fields, markup rejection, capability selection, 91-day rejection, review confirmation, Back retention and reload reset passed |
| Browser download | Synthetic JSON created; structure, expected values and absence of authority fields verified |
| Responsive review | No horizontal overflow at 1440, 1024, 768, 390 and 320 pixels; 320-pixel screenshots inspected |

The build retains existing warnings about multiple lockfiles and the absent `pg`
driver in disabled backend runtime imports. Genuine Auth, restricted logins/TLS
and real onboarding remain unverified. Default Node 24.14.1 still fails the patch
gate; the private patched preview does not establish durable deployment patching.

## Scoped security review and fixes

An attacker could alter their own browser entries or fabricate a downloaded
profile. The bounded contract rejects extra role/tenant/approval/password fields,
malformed containers, duplicate/unknown services, invalid email, oversized text,
markup/control/directional characters and out-of-range turnaround. Export requires
complete fields and review confirmation. React escapes review text; a fixed-name
JSON download does not interpolate data into HTML, shell commands or URLs.

The loopback POST to `/api/v1/vendor-applications` returned 404. There is no intake
endpoint or link from this packet to private provisioning authority. Synthetic
negative tests reproduced rejection rather than an authorization bypass. No new
security bypass was reproduced. Validation in a user's browser remains a UX
check; future server intake must independently validate and authorize all input.

Visual QA reproduced white-on-white Back text inherited from a shared secondary
button style. A vendor-scoped override fixes it to `#111827` on white. The rebuilt
page's computed colours and mobile screenshot confirm the fix; checks were rerun.

Tool actions used reviewed repository source, synthetic data and loopback requests.
No credentials, private vendor evidence, destructive probes, live approvals or
privileged web provisioning were used. Remaining risks include downloaded contact
data handling and future intake/retention/verification design. This was a scoped
application review, not a workstation, provider or whole-production pentest.

## Open decisions and next action by lead

- Uchi: review the editor and vendor preparation slice; decide the first intake
  channel, required fields and activation acceptance criteria. Resolve VL-03.
- Mumba: specify independently validated authenticated intake, retention/consent,
  rate limits, duplicates and durable review audits before implementing submission.
  Complete genuine Auth, restricted driver/logins and TLS verification separately.
- Taizya: review typography, procedural model fidelity, form wording, keyboard/error
  states and assistive-technology behaviour. Full accessibility acceptance is open.
- Lubasi: confirm capabilities, turnaround interpretation, private intake ownership,
  agreements and evidence checks. Treat declarations as unverified until reviewed.

See [onboarding scope](../vendor-onboarding.md), [open questions](../open-questions.md)
and [private provisioning](../trusted-provisioning.md). Online submission, verified
vendor activation, production garment proofs and human acceptance remain next gates.

## Report delivery

The matching Word report uses the existing compact-reference-guide preset and
memo masthead. Package/XML, content, privacy and geometry checks pass, with 124
local report/setup links checked. LibreOffice is unavailable; renderer attempts cannot
complete, so Word pagination and visual rendering QA remain unverified. Historical
reports and user assets are preserved. Delivery does not imply production readiness.
