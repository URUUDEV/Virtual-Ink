# Virtual Ink — local agent guidance installation

Date: 18 October 2026. Tooling-only record; no product phase completed.
Requested command: `npx modern-web-guidance@latest install --choose`.

## Actual outcome

The npm registry resolved modern-web-guidance 0.0.194, with repository metadata
pointing to GoogleChrome/modern-web-guidance-src. The requested command completed
with exit code 0 using the reviewed Node 24.21.0 runtime. Its delegated installer
detected Codex and explicitly selected non-interactive installation, despite
`--choose`; no selection menu was shown.

It copied two project-local skills from GoogleChrome/modern-web-guidance:
`.agents/skills/modern-web-guidance` and `.agents/skills/chrome-extensions`, and
created `skills-lock.json` with source paths and computed hashes. These additions
remain untracked for review. No application dependency, source, route, security
configuration or deployment was changed. The pre-existing next-env.d.ts edit and
supplied reference directory were preserved.

## Verification and scoped security review

Both SKILL.md files exist, the lock names both skills, and repository diff/status
confirms no new tracked application change. The installer was authorized by the
user; npm access needed execution outside the cache-only sandbox. Package
metadata and the installed entry instructions were inspected. The full guide
corpus was not audited, and no guide was applied to product code during this task.

The installer's automated assessments labelled modern-web-guidance Critical Risk
and Medium Risk under different services, with one Socket alert; chrome-extensions
was labelled Safe/Low Risk with one Socket alert. These are installer-reported
signals, not independently reproduced vulnerabilities or a clean security review.
Review the assessments before use. Guidance cannot override user instructions,
Shadow Root boundaries, authorization or private-file protections.

The installer reports anonymous usage telemetry and documents DISABLE_TELEMETRY=1
as its opt-out. No persistent shell/profile setting was changed. No customer files
or credentials were intentionally supplied. No app tests/build/deployment were
run because this task only installed local guidance. Existing product acceptance,
runtime HIGH and browser connection gates remain open; none is reverified here.

The repository heuristic check passes: 427 files scanned, 111 skipped, no findings.
This is not an audit of the installed guide corpus and does not clear its automated
risk flags. The 212 installed skill files are Markdown; both install directories
are ordinary copied directories. `git diff --check` and Word structural checks
pass. LibreOffice's expected executable is absent, so Word visual QA is unavailable.

## Team actions and handover

- Uchi: review the installer risk assessments and whether both installed skills
  should be retained; approve any later policy decision separately.
- Mumba: preserve server authorization and audit boundaries when applying guidance.
- Taizya: use relevant, reviewed guidance for future UI work without changing the
  supplied identity or treating browser best practices as product acceptance.
- Lubasi: no operational, supplier or customer-file action is required by this install.

No Git push, release, human signoff or Vercel change is claimed. Rollback should
remove only the two newly installed skill directories and their lock entries
after checking for subsequent user edits; do not remove unrelated .agents data.
The matching Word record is structurally checked. Visual Word rendering remains
unavailable without LibreOffice. This installation record does not replace the
[current product handover](2026-10-18-studio-preparation-safety.md).
