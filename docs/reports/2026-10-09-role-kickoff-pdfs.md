# Virtual Ink - Role Kickoff PDF Handover

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.
**Scope:** Separate starting guides for Mumba Chitonge and Taizya Nakapende.
**Status:** Two three-page PDFs delivered for team review. No human acceptance is inferred.

## Delivered guides

Mumba's backend kickoff explains the existing identity/tenant/membership foundation,
the reading order and code entry points, private runtime setup, genuine Auth/pg/TLS
verification, audit evidence and the next proposed membership-suspension slice.
It identifies the five-check smoke script's membership coverage gap and keeps
service accounts disabled until reviewed setup is complete.

Taizya's UX kickoff explains the existing branded source shell, the approved logo
and design tokens, preview instructions, responsive/accessibility review targets,
workspace-selection proposals, API field limits and a state-to-handoff checklist.
It distinguishes the unbuilt account/vendor screens from delivered public source.
Both guides include copy-ready next prompts and clear product review gates.

PDF locations:

- output/pdf/Virtual-Ink-Mumba-Backend-Kickoff-2026-10-09.pdf
- output/pdf/Virtual-Ink-Taizya-UX-Kickoff-2026-10-09.pdf

Open these files in a PDF reader or use the links in docs/team-report.md.
Editable sources are under docs/handovers/. The existing approved logo is reused
unchanged; no new images or vendor/pricing facts were invented.

## Evidence and limits

The guides use the repository's latest membership report and supplied-document
baseline. Its 90 passing backend tests, passing web TypeScript and hosted SQL
results are historical build evidence; they were not rerun for this artifact task.
Genuine provider login, pg/TLS, owned PostgreSQL replay, in-flight revocation and
product acceptance remain pending. The latest web build failed with spawn EPERM;
browser/mobile verification remains pending. There is no production readiness claim.

No application code, database schema, hosted account, credential, payment, file
upload or deployment was changed for this handover. Source PDFs, supplied assets,
previous reports and existing local work are preserved. No commit/push was requested.

## Artifact verification

| Check | Result |
| --- | --- |
| PDF generation | Both outputs generated with ReportLab and embedded document fonts |
| PDF structure/content | Three pages each; names/project text and basic secret-marker checks pass |
| Text bounds | Every page passes automated page-bound checks |
| Render and visual review | Six pages rendered with pypdfium2 and inspected; no observed clipping or overlap |
| Word report | OOXML package and fixed table geometry structurally checked |
| Word visual rendering | Unavailable: LibreOffice is missing; no Word visual QA claimed |
| Application tests / live setup | Not run; this slice creates handover artifacts only |

The PDF document font is embedded Bitstream Vera from the document runtime. The
application's mandatory Poppins typography is documented for Taizya and unchanged.
The PDF generator's marker checks are limited checks, not a comprehensive security audit.

## Files created and changed

Created: docs/handovers/2026-10-09-mumba-kickoff.md;
docs/handovers/2026-10-09-taizya-kickoff.md; scripts/generate_role_kickoffs.py;
the two PDFs; this dated Markdown report and its matching Word document.

Changed: README.md, docs/team-report.md, docs/task-board.md and
docs/open-questions.md. The index retains the latest engineering report separately
from this handover. Workspace-label and previously referenced lifecycle/security
questions are explicitly recorded for review, with no answers or authority inferred.
Private QA renders remain under .private/kickoff-pdf-qa/ and are not delivery files.

Commands use the managed document Python runtime: scripts/generate_role_kickoffs.py;
scripts/generate_team_report.py docs/reports/2026-10-09-role-kickoff-pdfs.md;
Word renderer attempt; private link/file checks; git diff --check.
Document-tool dependencies are separate from application dependencies.

## Where each lead starts

| Lead | First action | Handover evidence |
| --- | --- | --- |
| Uchi Chinyama | Review the two guides and resolve lifecycle authority, revocation and workspace labels | Recorded decisions; no inferred signoff |
| Mumba Chitonge | Follow the backend PDF; complete private readiness and genuine login verification before mutations | Own access, other-scope denial, committed audit and actual commands/results |
| Taizya Nakapende | Follow the UX PDF; review the shell and draft workspace-selection states | Flow-specific template, API field questions and actual responsive/accessibility findings |
| Lubasi Monde | Verify intended vendor owner/staff facts and support procedures privately | Approved onboarding references and verified support requirements |

Do not mark application checks complete from the PDFs' existence. The next backend
slice and connected UX remain subject to the decisions and verification above.
