# Vendor profile preparation

The public `/vendors/join` route prepares a local vendor profile for review. It is
linked from Business and the footer. This is the first vendor-facing onboarding
slice; online submission, review decisions, accounts and activation remain closed.
Latest [functional-workspace evidence](reports/2026-10-13-functional-workspaces.md)
adds explicit device drafts and portable draft/profile recovery. Preserve the
[original preparation evidence](reports/2026-10-12-vendor-profile-preparation.md).

## Delivered flow

1. Business details: bounded business/contact names, email and general city/area.
2. Declared capabilities: one or more listed services, collection/delivery choice,
   typical turnaround of 1–90 working days and optional short equipment notes.
3. Review: display entered details, confirm their self-declared status and download
   a JSON profile. Back navigation retains the current tab's entries.

Entries remain in component memory until explicit saving or downloading. No server
request or automatic storage write occurs. Downloads contain contact details. Use synthetic data for
testing; store and share actual downloaded profiles through an approved private
channel. Do not put them in Git, reports or customer-facing directories. The UI
asks users to omit street/home addresses, passwords, IDs, bank details and evidence.

The downloaded packet carries `schemaVersion: 1`, `prepared-not-submitted` and
`self-declared`. It contains no account IDs, tenant IDs, roles, approval references
or provisioning commands. It is not accepted as authorization by the private CLI.
It is not a production registration API or an agreement with a vendor.

## Save and resume

- Save vendor draft on this device explicitly stores one bounded draft under its
  own localStorage key, separate from shirt drafts. Nothing is loaded automatically.
  Save again after changes; the draft contains business contact details. Same-origin
  scripts can read localStorage, so use a private device. This is not encrypted storage.
- Load saved vendor draft resumes at the first incomplete step. Undo profile
  restore returns to the entries that were open before replacement. Review
  confirmation is reset on restore and must be checked again.
- Remove saved vendor draft deletes only that saved entry, retaining the open form.
- Download vendor draft works with incomplete entries. It labels the file
  `draft-not-submitted`; it is distinct from the fully validated final profile.
- Open a vendor profile or draft file accepts the current draft and the original
  prepared profile packet, up to 8192 bytes. Unsupported versions/statuses, extra
  fields, unknown capabilities and markup/control characters are rejected. Invalid
  imports leave the open form unchanged. Verification/approval are never imported.

Completed profile export still requires valid fields and explicit confirmation.
Incomplete drafts may retain an unfinished email or invalid turnaround for later
correction; their safe structure does not make them ready for final export.

## Security and acceptance

The final preparation contract rejects unsupported fields, malformed containers,
duplicate/unknown capabilities, markup, control/directional characters, oversized
text, invalid email and out-of-range turnaround. Export requires complete fields
and explicit review confirmation. React renders review values as text; JSON
downloads do not interpolate data into HTML, URLs, CSV or shell commands.

The dated report contains actual validation, browser and HTTP evidence. Keyboard
focus moves to the first invalid field or the next step heading. The Back button
contrast issue found during visual review was fixed. Full assistive-technology and
human acceptance remain open.

## Next activation slice

The newer [backend foundation](vendor-onboarding-foundation.md) has local portable
SQL replay and validation evidence. It remains disconnected from this public flow;
provider bridge, genuine Auth and hosted migration remain unverified in this review.
Public prepared packets grant no authority in the persistent contract.

Uchi and Lubasi agree required fields, a private submission channel, verification
criteria, agreements and review ownership. Mumba then defines authenticated
submission, consent/retention, rate limits, duplicate handling, audit and access
rules. Do not automatically create a tenant or grant VendorOwner from a submitted
packet. Verified identity and reviewed approval must use the separate
[trusted provisioning process](trusted-provisioning.md); its genuine Auth,
restricted driver/logins and TLS checks remain pending. No backend schema or
Supabase configuration changed in this slice.
