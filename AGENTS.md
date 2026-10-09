# Virtual Ink working agreement

Use the existing repository conventions and the Shadow Root standard. Work on one
reviewable vertical slice at a time. Read README.md and the current handover before
editing. Preserve existing user work and supplied assets.

## Team reporting

Uchi requested on 2026-10-09: always generate a report for the team after build work.
For every completed build slice or handover:

- Add a dated Markdown report under docs/reports/ and generate the matching Word
  document with scripts/generate_team_report.py. Preserve historical reports.
- State what changed, actual verification results, limits, open decisions, and the
  next action for Uchi, Mumba, Taizya and Lubasi. Do not claim human signoff.
- Keep docs/team-report.md pointed at the latest report and update affected setup
  docs/task-board entries. Put unresolved business questions in docs/open-questions.md.
- Keep credentials, customer files, addresses, signed URLs and real private vendor
  evidence out of reports and Git. Ignore Word lock files and never remove an open
  document's lock file.
- Perform document structural/visual checks when tooling permits and disclose any
  missing rendering capability. Report delivery does not imply production readiness.

## Current boundary

Backend Phase 2 contains a narrow identity/tenant-access read with durable audits.
Private development onboarding now uses a separate provisioning CLI/group and
matching transaction audit constraints. Keep its credentials out of HTTP/web
environments. No real onboarding or genuine login verification has been completed.
No payments, checkout, uploads, courier integration or printer automation is enabled.
Supabase development target: odgxcuwueessxfsoveza. Keep application schema portable
to owned PostgreSQL, and keep auth/storage provider adapters separate.
