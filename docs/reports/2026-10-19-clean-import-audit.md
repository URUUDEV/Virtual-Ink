# Virtual Ink — clean-checkout import audit

Date: 19 October 2026; work began on 18 October. Phase 1 is INCOMPLETE; release remains NO-GO. This slice
audits imports and clean-source reproducibility. It adds no genuine hosted Auth,
private storage, order/payment service, physical-device acceptance or human signoff.

> Phase 1 remains incomplete. The application may be demonstrated in an isolated preview environment, but it must not be represented as fully production-ready.

Final locally audited source: `0373d7debad98f3e6574f1c333e8107436d5a569`, including font
repair `2be6e90dedf028386788a44d08f7d35bf37cb0af`. Deployed source:
`403fbd8a1f8e5d11977bd603dcae68427661cd19`; its only additional change is the
deployment exclusion described below. Review branch:
`codex/hosted-studio-acceptance`. No force push or production promotion.

## Reproduced defects and repairs

The initial clone at ce439da had no copied node_modules, build output, private
environment files or untracked reference directory. Both locked installs passed.
A source/CSS audit then demonstrated that Poppins 700 was offered by both design
editors but absent from their imported font faces. The existing Poppins package
was required, not unused. Its CSS import replaces the redundant route-level
Space Grotesk 700 import; the root layout still loads all brand font weights.
The supplied monogram, palette, geometry and typography specification are preserved.

The clean root suite exposed two failures hidden in the original working tree:

- The broad storage/ ignore rule excluded src/backend/storage/private-files.ts
  from Git. The backend test could not import it; this prevented its other tests
  from registering and left the job probe unmeasured. The already-existing,
  reviewed nine-line source module is now committed. Runtime storage remains
  ignored at the root and nested paths; only backend TypeScript source is allowed.
  The module still denies file access and enables no storage or signed-URL API.
- Windows core.autocrlf converted the supplied HTML on checkout, adding ninety
  bytes and breaking its original SHA-256 assertion. A file-specific -text rule
  now preserves its bytes. A newly created final clone matches the original
  feda32323943a7a6f7d7da922ac953b5680bcb9a809803302bab91982a5b958a digest.
  The asset and expected provenance hash were not edited to make the test pass.

The initial clone's coverage was blocked: 202 passed, two failures, 41/42 files
measured. Its smaller denominator is not substituted for the complete source
inventory. A focused rerun reproduced both missing-module and byte-hash failures.
Final verification uses another fresh Git clone containing the actual repairs.

Deployment upload inspection also found the development-only supplied HTML in
the proposed upload. Commit `403fbd8` excludes that exact file through
.vercelignore while preserving it in Git. The final dry-run/upload contains
416 files and excludes environments, private work, dependencies, generated
output, Word reports and unreviewed attachments. No supplied asset is deleted.

## Import and package evidence

The private audit uses the installed TypeScript parser/resolver for literal
imports/re-exports, type-only edges, local aliases, CSS imports and literal dynamic
imports. It separates legitimate import/re-export pairs and type exports from
duplicate imports. It checks resolved modules stay inside the audit checkout.
The first-party client graph starts from use client boundaries and excludes erased
type-only edges. It is not a complete third-party package or runtime dataflow audit.

Next.js internally resolves server-only/client-only markers; installing their npm
packages is optional. The source auditor's initial plain Node resolution misses
were reviewed against [official Next.js behavior](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
and the installed compiler aliases. The markers were retained, not bypassed.
A deliberate client route importing the existing backend-access module was
rejected by the real Next.js compiler with its server-only diagnostic and import
trace. The temporary route and generated failed-build output are removed before
the final normal build. An initial helper matcher expected different diagnostic
wording; it was corrected to the actual diagnostic and rerun.

The required asset inventory remains in [section 2.1](../phase-1-release-gate.md).
Reused reference components are VirtualInkAnimatedLogo, VILogoSVG and vi-geometry;
the brand CSS/tokens, font imports, static SVGs and existing shared UI remain in
Next.js. Hero/Versions supplied design behavior, not a replacement router/App.
The archive's full App, Vite bootstrap/configuration/package manifest, demo
showcase and inspection plugin are excluded. React Three Fiber/Drei are not added.
Existing routes, APIs, auth/storage boundaries and supplied assets are preserved.

All fifteen web runtime dependency declarations have source, CSS, configuration,
framework or peer usage. Supabase JS is a peer of the existing SSR adapter;
React DOM is required by Next/React; PostCSS's plugin is referenced in configuration.
Those are not removed merely because a literal source import is absent. No
package/version/lockfile is changed, and no unjustified unused runtime package
was identified. Development tools remain required by the existing build/lint/types.

Modern Web Guidance search/list and the font-fallback guide were consulted. Its
font-size-adjust guidance addresses DOM font metrics; this fix registers a
missing canvas font face and retains the canvas's existing measurement behavior.
No retrieved guide shaped an API/CSS metric change or justified a new dependency.

## Fresh final verification

Results are recorded after execution; pending rows are not passes.

| Scope | Final result | Limit |
| --- | --- | --- |
| Root and web npm ci --include=dev | Pass; 169 and 71 packages added | Fresh source; no copied dependencies/build |
| Dependency advisories | Both installs report zero vulnerabilities | Runtime advisories remain separate |
| Source/CSS module graph | Pass; 133 files, 21 client roots, 43 reachable local modules | No missing/outside/duplicate/unknown dynamic edges or first-party boundary findings |
| Required font declarations | Pass; all seven offered families registered or system-provided | Arial/Georgia remain platform-dependent; visual approval open |
| Negative client/server compiler test | Pass; compiler rejects deliberate client import | Expected failed build; temporary route/output removed, normal build passes |
| Root tests and complete coverage | 218 passed; zero failed/skipped; 43/43 files measured | Backend/shared unit scope only |
| Web/security/Auth contract tests | 44 / 197 / 16 passed; zero failed/skipped | No genuine hosted service acceptance or new SQL execution |
| Types, lint and production build | Web and strict backend/shared types, lint/build pass | Local profile; sensitive services disabled |
| Local assets/client artifacts | 64 HTTP byte matches; 68 JS/CSS artifacts checked | 39 public assets and 25 font files; local heuristic only |
| Actual Vercel Preview build | READY; Preview environment confirmed; cache skipped | UI-only; hosted visual/service acceptance unverified |

Exact backend/shared coverage: lines **2473/2492 (99.24%)**, branches
**1883/1950 (96.56%)**, functions **239/242 (98.76%)**. All meet the 95% target.
The inventory includes the restored storage module and all 43 scoped files.
Frontend/browser flows, SQL, hosted integrations and src/server.js lifecycle are
outside this denominator; these percentages do not cover them.

All 39 public files and 25 emitted WOFF2 files return identical SHA-256 bytes
over loopback. The 68 local client JS/CSS artifacts total 1,871,623 bytes;
the repository's secret-text heuristic reports no findings. This is a bounded
heuristic, not proof that every possible credential or runtime dataflow is safe.
The fresh clone is clean after checks. Source security heuristics pass with
355 scanned and 108 skipped files. The Node 24.21.0 baseline check passes.

Commands use reviewed Node 24.21.0 and the existing npm scripts. The build uses
one page-generation worker and a 512 MB heap to accommodate the workstation.
The user's working next-env.d.ts is outside both clones and is preserved; clone
generated types are restored after checks. The audit's first package-lock parser
needed hashtable handling for npm's empty root key; a later private switch
placement was also corrected. Neither helper failure is an application defect
or a successful install/test result.

## Hosting and release boundary

An explicit Preview request to the existing protected Shadow Root UI test
project used committed-source upload inspection, no build cache and existing
credential-free ui_test flags. It promoted no production alias and enabled no
business integration. The original live project,
the full-service acceptance project, secrets, database/storage policies, DNS and
live payment configuration are untouched.

The [protected Preview](https://virtual-ink-ui-test-68245umm7-shadowrootsec-5679.vercel.app)
is deployment `dpl_95vR5twYfciXGdNktgUHaU9JyiJM`, project
`prj_aqLrX1gsSVb1XINH5YNGkp1aYazH`, source `403fbd8a1f8e5d11977bd603dcae68427661cd19`.
Read-only metadata rechecked on 19 October confirms READY, buildSkipped=false,
Preview environment and empty alias/automaticAliases arrays. The API's raw target
is null, while its environment claim is preview; it is not relabelled Production.
The deployment helper expected the literal target string preview and stopped
after creation. This was a helper assertion mismatch, not a failed build;
direct inspection established the result without redeploying or weakening a guard.

Retrieved build logs confirm cache skipped, 416 files downloaded, both locked
installs, zero npm vulnerabilities, passing ui_test isolation and source lint,
successful Next.js 16.4.0 compilation and completed deployment. npm reports a
nonfatal unknown cache-dir configuration warning. The local clone emits an
existing typeless-package warning; neither warning is hidden as a test failure.

The in-app browser is unavailable in this session. The existing Shadow Root
Chrome profile reaches a connection-timeout page; a reload also times out.
Its DOM-snapshot method additionally reports a tooling incompatibility. No hosted
visual, lazy-logo, device, file-picker or client-bundle acceptance is claimed.
Browser tabs were finalized without retaining the failed audit tab. Section A
remains open for runtime/fallback/visual and hosted bundle evidence; the actual
fresh Preview build sub-check now has evidence. Full-service acceptance hosting
is a separate unresolved target and remains unchanged.

The CLI homepage probe also fails to connect and supplies no application response.
Its first attempt used an unsupported forwarded non-interactive flag; the corrected
attempt reaches the network step. Vercel curl automatically generated a managed
project protection-bypass token, then timed out. No token value was printed,
copied into source/report, or used to weaken the application guard. This automatic
CLI credential action is disclosed; operator review of its lifecycle remains open.
No further bypass-token or project-configuration changes were attempted.

## Scoped security review and limits

The controlled negative import tests an actual build boundary, not a hidden UI
control. Restoring the source module does not grant file access. Runtime-storage
ignore probes use nonexistent synthetic filenames; root/nested data remain ignored.
No customer artwork, token, credential, signed URL or private vendor evidence is
used or placed in Git/reports. Raw logs and temporary artifacts stay private.
Tool/page/document output is treated as untrusted; no source code is replaced by
the demonstration App and no gate is weakened to pass a test.

The [official Node notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
was rechecked on 19 October: HIGH fixes for 24.x remain scheduled on or shortly
after 21 October. A runtime baseline pass or zero npm advisories does not clear
that gate. The skill corpus remains unreviewed; source/asset heuristics are not a
history-wide secret audit or workstation/provider/system pentest. Hosted Auth,
scanner/quarantine, real tenant/file controls, server prices/orders/proofs/payments,
supplier-matched models and physical-device acceptance remain open.

## Team actions and rollback

- Uchi: review the exact-source import evidence and actual Preview result; keep
  release NO-GO until all section 2.1 evidence and explicit authorization exist;
  review the CLI-managed protection-token lifecycle privately.
- Mumba: resolve the compatible isolated Auth/MFA target and the next secure
  integration slice, retaining genuine success/denial evidence.
- Taizya: verify actual font/render/fallback behavior across the required physical
  device/network/input matrix, then continue keyboard/zoom/screen-reader checks.
- Lubasi: provide supplier model/asset rights, stock/price/measurements and vendor
  upload/retention/payment/delivery policies; identify available physical devices.

Rollback only the affected reviewed source in a follow-up review commit, preserving
the original supplied assets and user work. Do not restore the missing-module,
reference-corruption or missing-font defects without documenting the regression.
No production promotion occurred. UI Preview rollback, if needed, is another
reviewed Preview deployment without alias promotion; this is an instruction, not
the required production rollback rehearsal. No phase completion, push or human
signoff is claimed. The matching Word report uses the existing compact reference
guide preset and memo masthead. The generator's structural/table geometry audit
passes. Separate QA passes seven Markdown files, 307 local links, Word ZIP/XML,
table/numbering and scoped privacy; all 27 integration classifications and fourteen
open release conditions are preserved. The canonical renderer was attempted and
fails because its LibreOffice executable is unavailable (WinError 2). No page PNGs
or visual Word acceptance are claimed. Local handover changes are committed
separately from the deployed source; no GitHub push or production promotion occurs.
