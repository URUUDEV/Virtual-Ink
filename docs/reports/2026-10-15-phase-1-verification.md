# Virtual Ink — Phase 1 verification and GitHub delivery

Date: 15 October 2026. Backend/product owner: Uchi. Mumba is inactive.
Status: reviewable verification slice delivered; every product phase remains incomplete.

## Outcome and scope

Uchi authorized proceeding with the proposed Vercel service graph and requested
GitHub commits/pushes after each phase, working towards complete development with
95% testing. The standing agreement now records that instruction. The new
backend/shared coverage command enforces 95% separately for lines, branches and
functions, with a source inventory that rejects unmeasured files. All executed
required tests must pass. This is not 95% of the whole software or phase completion.

Two reproduced transport defects are fixed: rejected upstream bodies are cancelled
without reading private content, and the binding rejects application/jsonp. Tests
also cover broken streams, failed cancellation, database connection release/commit
failure, missing CA, audit authority and protected-route failures. The repository
heuristic now scans .mjs/.cjs scripts too. A new hosted smoke command records only
safe paths/statuses and distinguishes Vercel protection from application failure.

## Actual local results

Reviewed runtime: private Node 24.21.0. Commands and logs are retained privately.

| Check | Result |
| --- | --- |
| Complete root suite with coverage | 167 passed; zero failed/skipped |
| Scoped security suite | 156 passed; zero failed |
| React/3D checks | Nine passed |
| Real SDK/Next Auth integration | Nine passed with synthetic provider responses |
| TypeScript | Web and strict backend/shared/test checks passed |
| Production build | Next.js 16.4.0 webpack build passed outside the sandbox |
| Runtime baseline | 24.21.0 passed the repository minimum; not a live advisory assurance |
| Repository heuristic | Final scan: 229 text files scanned, 44 skipped, zero findings |
| Dependency audit | Same-session root production and complete web audits reported zero findings; dependencies unchanged |

Coverage covers all 32 inventoried executable backend/shared/adapter files:
1,421/1,435 lines (99.02%), 880/925 branches (95.14%) and 136/139 functions (97.84%).
The denominator excludes declarations and the interfaces-only database port;
the standalone server process lifecycle, frontend components/browser flows, SQL and
genuine hosted integrations remain separately unmeasured. Node/V8 coverage is
experimental. No coverage-ignore comments or reduced threshold were added.

The first build failed with Windows spawn EPERM; the outside-sandbox retry passed.
Known module-type and malformed-cookie negative-test warnings remain documented.
The pre-existing next-env.d.ts development-path change was preserved byte-for-byte
and was not staged. Fresh standalone HTTP/router, SQL replay, full accessibility
and native file selection were not rerun in this slice.

## GitHub and deployment evidence

Repository: https://github.com/URUUDEV/Virtual-Ink

Review branch: codex/phase-1-verification. Source commit:
1341eb359c46f2e543ba5bbb7b4f1fe4e3960c0d. Push succeeded; git ls-remote returned
that exact commit. This is a slice checkpoint, not a completed-phase commit.
The evidence/report follow-up commit is separate from this tested build.

Vercel project: shadowrootsec-5679/virtual-ink. Its root was apps/web, which ignored
the root service graph. The root is now the repository root; external source
inclusion remains enabled. Existing Production was not promoted or replaced.

Preview: https://virtual-8pfjihiax-shadowrootsec-5679.vercel.app

Preview deployment: DTziNaPeL4toN3bhzbD1CemCmSqB, source 1341eb3, Vercel Ready.
The signed-in preferred Chrome profile loaded the homepage and dynamic shop;
shop controls were present and its sampled error console was empty. Resource
labels show web functions on Node.js 24.x; the precise deployed patch is unverified.
A matching sanitized backend runtime event recorded statusCode 200 for the Preview
health request, which is narrow internal-handler evidence. Chrome blocked direct
API navigation, so response-body/headers and the full binding/denial checks remain
unverified. Thirteen unauthenticated smoke requests received Vercel SSO redirects
and are Blocked by deployment protection, not application-test passes. Protection
was neither disabled nor bypassed.

Production alias: https://virtual-ink.vercel.app

Existing deployment: Fu933Y8sUBKAjqWetMivDvkZy21M, source 3da536a, marked Ready.
Thirteen read-only requests gave two passes (homepage and vendor preparation) and
eleven HTTP 500 failures, including shop, account pages and APIs. Runtime logs
identify instrumentation aborting on the public-configuration security guard.
Production contains NEXT_PUBLIC_SUPABASE_ANON_KEY alongside the modern publishable
configuration. The legacy-key variable is a likely conflict; its value was never
revealed, so the exact offending value/type is not asserted. No hosted credential
was copied, changed or revoked. Production needs private configuration remediation
and a new tested deployment; Ready is not functional verification.

## Hosting gate record

Owners: Uchi for engineering/hosting, Taizya for UX/browser acceptance and Lubasi
for operational workflow evidence. No human acceptance is claimed.

| Gate | Status | Evidence or next action |
| --- | --- | --- |
| VH-01 | Pass | Project/repository/main link and repository-root setting observed |
| VH-02 | Pending | Existing Ready build has runtime failures; candidate not in Production |
| VH-03 | Pending | Preview Ready and sampled pages work; full integration checks blocked |
| VH-04 | Failed | Production public-config guard aborts startup; private scopes need review |
| VH-05 | Pending | Local/source heuristic passes; deployed frontend bundle review incomplete |
| VH-06 | Blocked | Genuine deployed application database connection unverified |
| VH-07 | Blocked | Private upload/storage workflow unbuilt |
| VH-08 | Blocked | Approved synthetic mailbox, provider setup and genuine Auth checks pending |
| VH-09 | Blocked | Customer/vendor/admin complete workflows unbuilt |
| VH-10 | Pending | Narrow health runtime status; full deployed API checks blocked |
| VH-11 | Pending | Local denials pass; deployed guest/role/tenant checks incomplete |
| VH-12 | Pending | Preview homepage/shop sampled; Production dynamic routes fail |
| VH-13 | Pending | Fresh deployed mobile/responsive acceptance not performed |
| VH-14 | Pending | Preview shop error console empty; remaining flows untested |
| VH-15 | Pending | Ready build observed; complete sanitized build-log review outstanding |
| VH-16 | Pending | Custom-domain ownership/preparation still requires Uchi |
| VH-17 | Pass | Actual existing Production and tested Preview URLs recorded above |

## Scoped security review

Transport finding 1: a caller needs a failing/misbehaving upstream service. Before
the fix, a synthetic error stream remained uncancelled in the binding, REST and
identity adapters. Possible impact is unnecessary connection/resource use; actual
denial of service was not demonstrated. All three now cancel unread rejected
bodies. Cancellation failures are contained and no provider detail is returned.

Transport finding 2: the upstream must return a JSON-like but unsupported media
type. application/jsonp with an object body previously passed the prefix check;
the reproducing test now receives safe 503. JSON parsing already prevented script
execution; no XSS, authorization bypass or private-data disclosure was reproduced.
HEAD bodies and oversized forwarded headers are also covered by denial tests.

Node's official 14 October notice announces high-severity fixes for 24.x on or
shortly after 21 October. The minimum-version gate does not resolve that notice;
runtime/advisory release review remains open and sensitive enablement stays closed.
The existing conditional Next cache advisory remains under SEC-04; no root catch-all
page was introduced. Supabase's changelog/API-key guidance was checked; its upcoming
HTTP cipher retirement does not establish a current TLS failure here.

Tool review: synthetic loopback tests, ordinary owned-site reads and signed-in
project inspection only. No private provider value, user creation, grant/schema,
customer file, payment, bypass token or simulated approval was used. Browser work
used the requested profile. This is not a provider/workstation/production pentest.

Official references: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
and https://supabase.com/docs/guides/getting-started/api-keys .

## Next action by person

- Uchi: review the slice and resolve Production's public legacy-key conflict
  privately; finish protected Preview API checks and runtime review before rollout.
  Provide an approved synthetic test mailbox, then complete genuine Auth/customer
  mapping and the accepted private-file/order/quote/manual-status journey in Phase 1.
- Mumba: inactive; no current task or signoff dependency.
- Taizya: review the actual Preview at mobile/desktop sizes, account/error states
  and accessibility; supply the remaining order-flow acceptance details.
- Lubasi: verify print options, file handling/retention, quote rules and manual
  payment/delivery responsibilities before those workflows are enabled.

The pending mailbox question is not approval to use a real customer address.
Business decisions remain in open-questions.md. Later phases remain queued.

## Report delivery

The matching Word report uses scripts/generate_team_report.py and the existing
compact-reference preset. Structural/package/table checks apply. LibreOffice is
not installed; page rendering and visual pagination QA cannot be claimed.
Report delivery and a pushed branch do not establish production readiness.

Final handover checks: 167 local links, required evidence text, OOXML/privacy and
git diff checks passed. The renderer was attempted and failed because its
LibreOffice executable is absent. A negative coverage-command invocation refused
test-filter arguments and invalidated prior success; the complete rerun then
restored the passing 167-test result and the exact coverage counts above.
