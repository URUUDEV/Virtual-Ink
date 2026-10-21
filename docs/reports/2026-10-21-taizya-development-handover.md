# Virtual Ink — Taizya development handover

Date: 21 October 2026. Prepared for Uchi to share with Taizya Nakapende.
Phase 1 is **INCOMPLETE**, release **NO-GO**. This handover authorizes the
development contribution workflow requested by Uchi; it is not human acceptance,
production promotion or a GitHub permission change. No message/invitation was sent.

## Repository and availability

Repository: [URUUDEV/Virtual-Ink](https://github.com/URUUDEV/Virtual-Ink).
Current local branch: codex/hosted-studio-acceptance. Reviewed application source
is f244056c04764b8fa64ade456ff203a64241728a; the latest existing handover before
this document is eaa72a2c578ccef5ffdd1a0f22b9fd5ceca53435. This documentation is
committed separately. Recent relevant commits are f244056 (precise measurements),
fb73cd6 (build evidence) and eaa72a2 (partial hosted verification and interruptions).

Read-only GitHub head inspection on 21 October found main at
a6736376b09ba7c3242495ff86b4bb2eea62f20c. None of development, develop, dev or
codex/hosted-studio-acceptance exists remotely at this check. This does not mean
the repository has no other branches. The current review branch is local only;
a fresh clone will not contain these latest studio changes. Uchi must first make
the reviewed source available through an approved branch publication or private
Git bundle. Taizya must have permission to push her contribution branch using her
own GitHub account. Neither source availability nor her access is assumed.

The requested shared target is development. It needs to be established from the
reviewed shared base and checked against GitHub/Vercel deployment rules before
collaborative pushes. The root Vercel file describes application services but does
not establish the connected project's branch/production settings. No .github
workflow directory was found locally. That absence does not prove pushes cannot
trigger an external deployment. Follow docs/hosted-acceptance.md: do not push
through the original project's automatic deployment integration. No branch,
integration, environment, collaborator permission or deployment was changed here.

## Copy-ready prompt for Taizya

```text
You are helping Taizya Nakapende contribute development work to Virtual
Ink at Shadow Root Security Technologies. Uchi has authorized her to
commit and push Phase 1 development contributions. Use her own authorized
GitHub account. Uchi leads product; Uchi and Mumba share backend work;
Taizya leads UX/frontend implementation and accessibility.

Repository: https://github.com/URUUDEV/Virtual-Ink

Read AGENTS.md, apps/web/AGENTS.md, README.md, docs/team-report.md,
docs/phase-1-closure-checklist.md, docs/phase-1-release-gate.md,
docs/hosted-acceptance.md and the latest dated handover before editing.
Apply the current ownership above; older inactive-Mumba/Phase-2 kickoff
notes are historical. Stay within Phase 1 and work one reviewable slice
at a time. Preserve supplied assets, branding and unrelated user work.

Obtain the reviewed shared checkout first. The application baseline is
f244056c04764b8fa64ade456ff203a64241728a; the current verification
handover is eaa72a2c578ccef5ffdd1a0f22b9fd5ceca53435. As of 21 October,
codex/hosted-studio-acceptance is local only and development does not
exist on origin. Fetch and verify the actual state. If the source is
still unavailable, obtain Uchi's approved branch or private Git bundle;
do not silently start from the older main branch.

Shared target: development, once established from the reviewed base and
its GitHub/Vercel deployment mapping is checked. Do not use main as a
fallback or push through the original project's deployment integration.
Create a task branch such as taizya/studio-state-stability from that
shared base. Inspect status/diff, stage only reviewed files explicitly,
commit a clear message, then push your task branch without force:
git push -u origin taizya/studio-state-stability
Open a PR into development and include the evidence below. Follow branch
protection/review rules when merging. If access is denied, report the
missing repository permission; never use another person's credentials.

First slice: STUDIO-01D. Reproduce the unexpected homepage navigation
and later empty design/history observed in the hosted studio. Read
docs/reports/2026-10-20-hosted-measurement-verification.md. Establish
whether concurrent navigation, a reload, tooling or application code
caused it; do not invent a cause. Reproduce any application defect before
fixing it. Then finish measurement minimum-size, layout/3D preservation,
keyboard/focus and responsive checks. Use synthetic text/images only.
Browser emulation is separate from required physical-device acceptance.

Preview: https://virtual-ink-ui-test-9q6c3g2gm-shadowrootsec-5679.vercel.app
Use normal authorized Vercel access. Keep UI-only Auth/database/storage,
uploads, orders and payments disabled. Never generate a protection-bypass
credential, weaken environment guards or promote Production. Backend
security/data foundations exist; private files, order/quote pricing,
vendor proofs and production/QC are not complete. Coordinate contracts
with Uchi and Mumba; do not replace missing services with fake success.

Use the repository's supported Node runtime; check current runtime
security releases first. Install locked development dependencies at the
root and apps/web with npm ci --include=dev. Run the applicable web,
security/Auth, type, lint and build checks. Run backend/shared tests and
coverage for affected shared/backend code, keeping at least 95% measured
coverage with its exact scope/denominator. Follow documented local
environment isolation. Never copy credentials into the UI or reports.

Review security after each meaningful step. Add a dated Markdown report
and matching Word copy using scripts/generate_team_report.py, update
docs/team-report.md and the task board, and report actual passes,
failures and blocked checks. Preserve the existing application work;
on Uchi's workstation next-env.d.ts and other untracked items are
pre-existing, unrelated changes and must not be staged accidentally.

Return the task branch, commit SHA, PR into development, changed files,
tests/coverage, security findings, actual authorized Preview URL/source,
rollback notes and next actions for Uchi, Mumba, Taizya and Lubasi.
Do not mark Phase 1 complete or claim human signoff. Completion requires
local tests, successful Vercel hosting and the existing release gates.
```

## Current evidence and limits

The [latest hosted verification](2026-10-20-hosted-measurement-verification.md)
records native decimal Apply, Enter, reset, width history and required/range
denials on the exact Preview. Unexpected navigation and later unsaved-state loss
remain unresolved; no cause or uninterrupted acceptance is established.
The [build report](2026-10-20-studio-precise-measurements.md) preserves 73 passed
web checks, 218 passed root tests, 197 passed security checks and 16 Auth contracts.
All 43/43 backend/shared files were measured: 2473/2492 lines (99.24%),
1883/1950 branches (96.56%), 239/242 functions (98.76%). Missing features,
frontend/browser flows, SQL, genuine integrations and server lifecycle are not
covered by that denominator. No new application tests or coverage were run here.
Runtime HIGH resolution, full-service hosting and physical/human acceptance stay
open. No development-branch or new application deployment URL is invented.

Security review: Git inspection was read-only. Only public repository identifiers,
commit hashes and synthetic-test references are included. Remote URL output was
redacted for possible embedded credentials. No private operator environments,
customer content, browser cookies or signed URLs were accessed or shared. A
development push can trigger external integrations, so the receiving workflow
requires actual deployment mapping before publication, preserves the original
Production boundary and prohibits force pushes. Access errors during local reads
were retried with tool approval. No reproducible application flaw was tested or
fixed by this documentation step; it is not a provider/workstation pentest.

## Team actions and document checks

- Uchi: share this prompt, publish/share the reviewed source through an approved
  path, establish the development base/deployment mapping and arrange Taizya's
  push permission. Product/release acceptance remains separate.
- Mumba: help verify the shared base, backend contracts and security/runtime
  blockers; review technical changes affecting identity, files or permissions.
- Taizya: use her own authorized account, reproduce STUDIO-01D, implement only
  proven fixes and push a reviewed task branch/PR into development.
- Lubasi: supply required device/tester availability and verified supplier facts;
  do not substitute these synthetic studies for production evidence.

No human acknowledgement, permission grant, push, merge, production action or
phase completion is claimed. No GitHub permission was changed and no Git push was
performed. The scoped security heuristic passes with 441 scanned, 122 skipped
and no findings. The Word copy uses compact_reference_guide with memo_masthead;
package/XML, structural and privacy checks and affected Markdown links pass.
All 27 integration classifications and fourteen unchecked release items remain
intact. Rendering reaches conversion but LibreOffice/soffice is missing
(WinError 2), so no Word visual/page-image QA is available. This handover does
not modify historical reports.
