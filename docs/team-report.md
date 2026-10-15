# Virtual Ink team report

Latest build handover: [15 October 2026 — Password recovery slice](reports/2026-10-15-auth-recovery.md) and [Word copy](reports/2026-10-15-auth-recovery.docx). Synthetic local Auth/Next tests, build, TypeScript and 95% scoped coverage pass. Genuine email delivery, provider setup and deployed password reset remain unverified; Phase 1 is PARTIAL. The [inspection/gap report](reports/2026-10-15-phase-1-gap-report.md) and [closure checklist](phase-1-closure-checklist.md) remain the requirement baseline. Uchi Chinyama and Mumba Chitonge collaborate on backend work. No human signoff is claimed.

Previous handover: [15 October 2026 — Phase 1 inspection and gap report](reports/2026-10-15-phase-1-gap-report.md) and [Word copy](reports/2026-10-15-phase-1-gap-report.docx). The matching DOCX structural audit passes; visual pagination QA needs LibreOffice, which is absent.

The prior public recovery and its evidence remain preserved below.

Latest recovery: [15 October 2026 — Production startup and image recovery](reports/2026-10-15-production-recovery.md).

Word: [Production recovery team report](reports/2026-10-15-production-recovery.docx).

[Production](https://virtual-ink.vercel.app) is recovered: source 5c55364 is pushed
to main and Vercel Ready; all twenty page/rendered-image/health/guest-denial checks
pass. The unused public legacy variable was renamed server-only with its value
untouched. Four image call sites now serve the supplied assets directly; all eight
shop image instances load. Preview desktop/mobile/menu checks pass; Production
desktop passes, full Production mobile remains open. All local suites/type/build
checks pass; backend/shared coverage remains 99.02%/95.14%/97.84%. Genuine Auth,
private database/files/order/role workflows remain blocked or unbuilt. No phase is
complete; Word visual QA is unavailable without LibreOffice.

Previous verification: [15 October 2026 — Phase 1 verification and GitHub delivery](reports/2026-10-15-phase-1-verification.md).

Word: [Phase 1 verification team report](reports/2026-10-15-phase-1-verification.docx).

167 root and 156 security tests, nine React and nine SDK/Next Auth checks, both
type checks and the production build pass. All 32 backend/shared inventoried files
reach 99.02% lines, 95.14% branches and 97.84% functions; full-product testing remains
incomplete. Source commit 1341eb3 is pushed on codex/phase-1-verification. The actual
[Preview](https://virtual-8pfjihiax-shadowrootsec-5679.vercel.app) is Ready with sampled
homepage/shop success; protected automated/API checks remain blocked. Existing
[Production](https://virtual-ink.vercel.app) has dynamic HTTP 500s from its public-config
guard. Genuine Auth/files/order/role journeys, release and human acceptance remain
open. No phase is complete. Word visual QA remains unavailable without LibreOffice.

Previous build: [14 October 2026 — Vercel services configuration](reports/2026-10-14-vercel-services.md).

Word: [Team report — Vercel services configuration](reports/2026-10-14-vercel-services.docx).

Root services configuration, native Node entrypoint and runtime web-to-app binding
are implemented and locally verified. Proposed graph: public web catch-all,
internal app, web calls app through generated APP_SERVICE_URL. 150 application,
139 security, nine React and nine Auth integration tests, both type checks and
production build pass. Real Vercel local routing/binding passes 39 assertions
across 16 requests; standalone checks pass 53 + 44 assertions. Uchi reports existing
Vercel/Supabase setup; actual URLs and new hosted checks remain unverified. Names,
public paths/internal exposure and binding await Uchi's explicit confirmation.
No phase is complete. Word structural checks apply; page rendering is unavailable.

Previous build: [14 October 2026 — Phase 1 account access and ownership](reports/2026-10-14-phase-1-account-access.md).

Word: [Team report — Phase 1 account access and ownership](reports/2026-10-14-phase-1-account-access.docx).

Uchi now owns backend engineering and product leadership; Mumba is inactive.
Registration/login/PKCE confirmation/logout, server sessions and protected account
entry are implemented with hosted Auth disabled pending genuine setup. 141 application,
130 security, nine React and nine real SDK/Next integration tests pass; both type checks,
clean production build, 53 existing and 44 account HTTP assertions pass. The protected
redirect bug is fixed and retested. Driver `pg` 8.23.1 is installed; private DB/Auth
and Vercel verification remain blocked. Phase 1 remains incomplete; build phases in order.

Previous verification: [14 October 2026 — Strict phase completion audit](reports/2026-10-14-phase-completion-audit.md).

Word: [Team report — Strict phase completion audit](reports/2026-10-14-phase-completion-audit.docx).

Verdict: Phase incomplete. Estimated coverage: MVP 17%, Trust/operations 8%,
Marketplace growth 5%, Differentiation 43%; estimates are not phase approvals.
The full order journey is missing and Vercel URLs/checks are unverified.
132 application tests, 121 security tests, nine React/3D checks, both TypeScript
checks, production build with documented warnings, 53 HTTP assertions and 67
additional denial assertions pass. Browser Undo/FAQ bugs are fixed and retested.
Hosted identity/vendor rollback tests pass; current catalog has 18 private tables,
10 migrations and zero business records/Storage objects. Genuine runtime/Auth,
native file selection, full accessibility and migration reconciliation remain open.

Previous handover: [14 October 2026 — Vercel phase completion gate](reports/2026-10-14-vercel-completion-gate.md).

Word: [Team report — Vercel phase completion gate](reports/2026-10-14-vercel-completion-gate.docx).

Every phase now requires local operation, passing tests, all 17 Vercel verification
items and the actual deployed URL in its completion report. Hosting and deployed
integration checks remain unverified; no phase is marked complete. See
[mandatory checklist](phase-completion-checklist.md). This is a documentation-only
handover; previous application verification remains dated below.

Previous build/verification: [14 October 2026 — Vendor foundation review](reports/2026-10-14-vendor-foundation-review.md).

Word: [Team report — Vendor foundation review](reports/2026-10-14-vendor-foundation-review.docx).

Empty vendor pagination selectors now fail validation. 132 application tests,
121 security tests, nine React/3D checks, both TypeScript checks and 53 loopback
HTTP assertions pass. Portable vendor SQL replay/rollback passes on PostgreSQL 18.
Provider bridge, genuine Auth, hosted migration and intake/activation remain open.
See [foundation scope](vendor-onboarding-foundation.md).

Previous build/verification: [13 October 2026 — Functional local workspaces](reports/2026-10-13-functional-workspaces.md).

Word: [Team report — Functional local workspaces](reports/2026-10-13-functional-workspaces.docx).

Editable shirt files, current-view 3D PNGs and explicit vendor device/file draft
recovery are delivered for review. 127 application tests, nine React/3D checks,
116 security tests, build/type checks and 53 HTTP assertions pass. Actual downloads
and device recovery are checked; native file-open automation and complete visual/
accessibility/human review remain open. Genuine intake/activation is still pending.

Previous build: [12 October 2026 — Vendor profile preparation](reports/2026-10-12-vendor-profile-preparation.md).

Word: [Team report — Vendor profile preparation](reports/2026-10-12-vendor-profile-preparation.docx).

Three-step vendor preparation, review and local JSON download are delivered.
125 root tests, eight React/3D checks, 114 security tests and 53 HTTP assertions
pass. Genuine submission/activation and human acceptance remain open. See
[onboarding scope](vendor-onboarding.md).

Previous build: [12 October 2026 — Fonts and 3D shirt](reports/2026-10-12-fonts-and-3d-shirt.md).

Word: [Team report — Fonts and 3D shirt](reports/2026-10-12-fonts-and-3d-shirt.docx).

Seven font choices and an interactive local 3D shirt are delivered for review.
121 root tests, seven React/mesh checks and 110 security regressions pass.
Human acceptance, artwork texture/export verification and genuine onboarding remain open.

Previous verification: [12 October 2026 — Editor accessibility review](reports/2026-10-12-editor-accessibility-review.md).

Word: [Team report — Editor accessibility review](reports/2026-10-12-editor-accessibility-review.docx).

Preview instruction contrast is fixed; input help and status naming are improved.
Build, 120 root tests, six React checks, 109 security regressions and 49 HTTP
assertions pass. Sampled focus, safe text rejection and five responsive widths
pass; artwork import, assistive-technology review and human acceptance remain open.

Previous build: [12 October 2026 — Local T-shirt workspace](reports/2026-10-12-tshirt-workspace.md).

Word: [Team report — Local T-shirt workspace](reports/2026-10-12-tshirt-workspace.docx).

Local text/artwork editor, placement, history, device drafts and PNG preview source
are delivered. Build, 120 root tests, six React checks, 109 security regressions
and 49 HTTP assertions pass. Live text/history/device/export/layout probes pass;
browser artwork import and complete accessibility/human acceptance remain open.
See [workspace scope and checklist](tshirt-workspace.md).

Previous verification: [11 October 2026 — UI build verification](reports/2026-10-11-ui-build-verification.md).

Word: [Team report — UI build verification](reports/2026-10-11-ui-build-verification.docx).

Production build, 45 HTTP assertions and sampled Chrome controls/layout checks
pass on verified private Node 24.21.0. Default Node, complete accessibility/visual
acceptance, bundle review and genuine backend setup remain open.

Previous UI/build review: [10 October 2026 — Public UI visualization](reports/2026-10-10-ui-visualization.md).

Word: [Team report — Public UI visualization](reports/2026-10-10-ui-visualization.docx).

Current UI and review checklist: [Public UI visualization](ui-visualization.md).

Previous security/build review: [9 October 2026 — Security review and fixes](reports/2026-10-09-security-review.md).

Word: [Team report — Security review and fixes](reports/2026-10-09-security-review.docx).

Recurring gate: [Security review after every step](security-review.md).

Previous handover: [9 October 2026 — Role kickoff PDFs](reports/2026-10-09-role-kickoff-pdfs.md).

Word: [Team report — Role kickoff PDFs](reports/2026-10-09-role-kickoff-pdfs.docx).

## Start with your guide

- [Mumba — Backend kickoff PDF](../output/pdf/Virtual-Ink-Mumba-Backend-Kickoff-2026-10-09.pdf)
- [Taizya — UX kickoff PDF](../output/pdf/Virtual-Ink-Taizya-UX-Kickoff-2026-10-09.pdf)

Each three-page guide covers current status, first tasks, files to read, open gates
and the next handover. Both PDFs were rendered and visually checked. These guides
record the existing build snapshot; they do not imply fresh application verification.

## Engineering reports

Latest build slice: [9 October 2026 — Caller-owned membership discovery](reports/2026-10-09-membership-discovery.md).

Word: [Team report — Membership discovery](reports/2026-10-09-membership-discovery.docx).

Previous handover: [Supplied document review](reports/2026-10-09-source-document-review.docx).

Build instructions: [Supplied-document baseline](source-document-baseline.md).

Previous preview: [Local preview report](reports/2026-10-09-local-preview.docx).

Previous build slice: [Backend readiness report](reports/2026-10-09-backend-readiness.docx).

Previous: [Phase 1 progress and starting points](Virtual-Ink-Team-Progress-Report.docx).

Previous backend slice: [Backend Phase 2 report](reports/2026-10-09-backend-phase-2.docx).

Previous setup slice: [Trusted provisioning report](reports/2026-10-09-trusted-provisioning.docx).

Every completed build slice includes a dated Markdown/Word report with verified
results, limitations, open decisions and each lead's next starting point. Uchi's
request is recorded in AGENTS.md. Reports do not mark product or lead approval.

Regenerate a report with Python and python-docx installed for document tooling:

```powershell
python scripts/generate_team_report.py docs/reports/2026-10-14-phase-completion-audit.md
```

The generator validates OOXML package and fixed table geometry, preserves the
previous Phase 1 report and excludes credentials. Visual rendering still needs
LibreOffice; it is unavailable in the current environment. Keep document-tool
dependencies separate from application/backend dependencies. Generate the kickoff
PDFs with `python scripts/generate_role_kickoffs.py` using the managed document
runtime with ReportLab, pypdf, pdfplumber, pypdfium2 and Pillow installed.
