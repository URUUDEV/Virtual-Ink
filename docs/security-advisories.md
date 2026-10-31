# Application and build-tool advisory register

31 October 2026. Engineering owners: Uchi Chinyama and Mumba Chitonge.
This is scoped dependency evidence, not security signoff or Phase 1 acceptance.

## GHSA-g3hv-75wg-m249 / CVE-2026-118764

| Field | Recorded disposition |
| --- | --- |
| Package/tool | minimatch used by root ESLint/configuration discovery |
| Previously installed | 10.2.6; full root audit reported 24 propagated moderate entries |
| Severity | Moderate, preserved from the maintainer advisory |
| Patched candidate | Exact root override 11.0.1; npm-generated lockfile |
| New transitive dependency | @isaacs/nonrecursive-glob-match 1.0.3, dev-only, lockfile integrity recorded |
| Scope | Development/build tool; no application-runtime import found; separate web tree has no minimatch lock entry |
| Build influence | Lint is a required pre-build gate; excessive glob expansion can deny a build even without a request endpoint |
| Owner | Uchi and Mumba, engineering; Security acceptance is not inferred |
| Remediation deadline | 31 October 2026 engineering target, and always before any release; no risk-acceptance extension |
| Local outcome | Reproduced on 10.2.6; patched resource-limit regression, lint compatibility, tests, types, build and audits pass |
| Hosted outcome | New qualifying Vercel acceptance build/journey still required; no production deployment claimed |
| Risk acceptance | None created or assumed |

The maintainer describes attacker-controlled glob amplification when
optimizationLevel is at least 2. The controlled reproduction uses a generated
pattern in one child process, a 64 MB old-space budget, a 2 MB semi-space setting
and a five-second timeout. The affected child exhausts its heap. The patched
matcher completes within the bound and keeps the configured expansion limit.
No external target, persistent workload, credential-bearing child environment
or production request is used. A compromised build input/configuration is a
different prerequisite from an unauthenticated HTTP caller. No HTTP exploit or
production asset modification is demonstrated.

The upgrade crosses a major version and changes matcher internals. Compatibility
is explicitly checked: all 239 configured lint file paths and 5,082 sampled glob
results remain identical; valid Node/web source is admitted and deliberately
bad code is rejected. The full web build, root/web suites and fresh audits pass.
Only the minimatch lock entry and its one added dependency change; other locked
packages and ESLint 10.13.0 remain unchanged. Do not remove exclusions or reduce
the source inventory to obtain a pass. Remove the override only after an
upstream-compatible patched dependency graph has equivalent verification.

Until that upstream change, compensating controls remain reviewed fixed glob
configuration, restricted code/configuration changes, locked installs and a
bounded regression test. They complement the patch; they are not a substitute
for it or a Security-approved exception. Deployment must use the reviewed
lockfile. Rollback must not silently restore the vulnerable build chain; an
emergency rollback requires a documented owner/Security decision and the
existing release/rollback gates.

The full root, production-only root and independent web audits report zero
known vulnerabilities after the patch. This does not cover unrelated private
operator tooling, the workstation, provider software or every bundled component.
The hosted Node request-runtime issue and other Phase 1 gates remain separate.

[Maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249)
and [patched source](https://github.com/isaacs/minimatch/tree/v11.0.1).
