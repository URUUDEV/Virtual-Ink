# Virtual Ink — Phase 1 authorization evaluator

Date: 15 October 2026. Backend owners: Uchi Chinyama and Mumba Chitonge.
Status: **PARTIAL — locally verified policy foundation; production authorization
is not implemented by this slice.**

## Overall status and completion measure

Phase 1 remains PARTIAL. Acceptance completion is **0 of 17 requirement groups
fully proven (0%)** in the closure checklist, excluding the three completed
inspection/baseline items and delivered sub-slices. This measures final acceptance,
not estimated source-code effort. Existing UI/backend foundations, account-access
and recovery code, and this policy evaluator are partial implementations. Backend
unit-test coverage above 95% does not mean the product is 95% complete or tested.

## Implemented and partial requirements

The new pure server policy evaluator covers all eight requested roles and named
actions for orders, files, quotations, assignment, proofs, production, QC, delivery,
audit and identity administration. It requires trusted identity/resource facts;
browser metadata supplies no authority. Unknown capabilities, malformed IDs,
inactive identities, unknown/multiple roles, missing scope and invalid grants deny.

Customers are scoped to their orders. Organization membership and order-specific
grants restrict delegated actions. Vendors require verified status and active
assignment; designers and delivery partners require their own assignments.
Delivery roles receive no file permission. File access requires a SAFE active
version; production-file access additionally requires approval. Payment and latest
proof approval gates apply even to administrator production overrides. Privileged
actions need exact resource/actor/capability grants, purpose, reason, expiry and
AAL2. SUPER_ADMIN file reads need explicit break-glass authority.

This is a pure decision function, not live authorization enforcement. It has no
route callers, trusted database context loader, RLS or Storage integration. It
cannot verify freshness, perform field projection, mutate records, persist an audit
or prove actual MFA enrollment. The narrower existing application roles and
database schema remain in use. AUTHZ-01, AUTH-02 and TEST-01 remain incomplete.

## Missing requirements

Genuine registration/mail/reset verification, account mapping, suspension/deletion,
vendor activation, privileged lifecycle and MFA enforcement remain open. Private
upload buckets, signature/metadata checks, production malware scanning and signed
download audits are unbuilt. Persistent orders, transactional state transitions,
quotations/pricing snapshots, payment confirmation, proof versions, production
jobs/evidence, QC corrections and role dashboards remain unbuilt. Full lifecycle
audits, database/Storage isolation tests, API and fifteen required end-to-end
scenarios, manual acceptance and deployed Phase 1 verification remain open.
Escrow, cryptocurrency custody and blockchain work remain outside the phase.

## Files created and modified

- Created: `src/backend/permissions/phase1.ts` and
  `test/phase1-permissions.test.ts`.
- Created: this dated Markdown report and matching Word report.
- Modified: `package.json`, `docs/phase-1-permission-matrix.md`,
  `docs/phase-1-closure-checklist.md`, `docs/task-board.md`,
  `docs/team-report.md`, `docs/security-review.md` and `README.md`.
- Preserved: the existing user-owned `apps/web/next-env.d.ts` edit. The verifier
  restores its original bytes after Next.js generation; it is excluded from staging.

## Database migrations, RLS and Storage policies

None created, applied or changed. This slice opens no route or data grant.
The existing hosted vendor-migration-history discrepancy still needs
reconciliation before further database rollout. Database RLS and private Storage
acceptance for the requested workflows have not passed.

## Tests executed and actual results

The final run uses the repository's reviewed private Node 24.21.0 runtime and
`.private/verify-phase1-readiness.ps1` on 15 October 2026.

| Check | Result |
| --- | --- |
| Complete root suite through coverage runner | 178 passed; zero failed or skipped |
| New policy tests | Ten groups pass; all eight roles, cross-scope denials, grants, files and production gates |
| Backend/shared lines | 1685/1699 = 99.1760% |
| Backend/shared branches | 1158/1203 = 96.2594% |
| Backend/shared functions | 155/158 = 98.1013% |
| Coverage inventory | All 33 in-scope files measured; 95% gate passes |
| Security regression subset | 167 passed, including the ten new policy groups |
| React/mesh UI checks | Nine passed |
| Supabase SDK/Next Auth synthetic checks | Fourteen passed; genuine provider not used |
| Web and strict backend/shared TypeScript | Pass |
| Next.js production build | Pass; sixteen static pages generated |
| Runtime patch baseline | Pass for private Node 24.21.0; default runtime remains below the gate |
| Repository security heuristics | Pass; no matching findings; generated/private files excluded |
| Root and web npm audits | Both report zero known vulnerabilities |

An initial ordinary `npm test` invocation reported all 175 discovered tests passing
but exited with failure because default discovery included the coverage runner and
the unreviewed default runtime. A pinned-runtime default-discovery invocation also
exited unsuccessfully because that runner rejects CLI test arguments. The supported
coverage entry point selects root tests explicitly and passed 178/178 after the
final fixes. Root `npm test` now explicitly selects `test/*.test.*`, avoiding the
utility-discovery defect; that exact pinned-runtime test command passes 178/178.
The ten policy groups are also included in `test:security`. No failing command is
counted as a successful gate. An earlier
93.84% branch result was fixed by adding meaningful negative and privileged-action
cases; the 95% threshold was retained.

Coverage excludes frontend/browser flows, SQL, the server lifecycle and genuine
hosted integrations. No manual role acceptance or deployed authorization journey
was executed. Existing UI checks are regression evidence only. The Three.js CJS
deprecation warning and root test module-type warning remain non-fatal.

## Security findings and fixes

These findings concern the new unconnected evaluator and synthetic facts, not a
reproduced production exploit. They would become relevant if a future caller
trusted incomplete context or used a broad grant as a business-action check.

- P1-POL-01: an organization admin could supply an order-shaped resource carrying
  its organization ID to the organization-management decision. Management now
  requires the resource ID to equal the organization ID. Own organization permits;
  order and other-organization IDs deny in tests.
- P1-POL-02: active vendor assignment alone previously permitted vendor access.
  Verified vendor status is now also required. Unverified assigned vendors fail
  order and production-file reads.
- P1-POL-03: privileged job acceptance/assignment could omit valid lifecycle state.
  Job acceptance now requires VENDOR_ASSIGNED; assignment requires an explicit
  pre-production state and rejects an actor affiliated with the selected vendor.
  Missing/terminal/production states and self-assignment fail. Cancellation is
  also restricted before payment, including privileged attempts.
- P1-POL-04: generic override names could be evaluated independently of workflow
  gates. Grant-only names now deny as standalone actions. Named production start
  still fails without required payment/latest approved proof, even with a grant.
- P1-POL-05: SAFE alone did not distinguish inactive or unapproved production
  versions. Inactive files deny all roles; unapproved production files deny.
  Missing file purpose denies even privileged reads. Malformed object/symbol IDs
  also deny without coercing caller code.

No critical/high defect is proven in the enabled changed surface. This does not
close the existing release blockers: default/deployed runtime patch verification,
framework advisory applicability, distributed abuse controls, genuine revocation,
trusted context, transaction/audit atomicity and SQL/Storage enforcement.
Dependency audits are a point-in-time advisory lookup, not complete assurance.

Tool actions used repository reads, synthetic local tests and dependency metadata
audits. No customer files, private storage links, tokens or credentials were read
into the report or staged. Existing branding/assets and unrelated user changes
were preserved. External/tool text was treated as data; no destructive scan,
simulated human approval or external message was performed.

## Environment variables required

No new environment variable or secret is required by this evaluator. Future genuine
Auth testing still needs privately scoped `WEB_AUTH_ENABLED`, `APP_ORIGIN`,
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; application role reads need the
restricted `AUTH_ENABLED`, `DATABASE_URL`, `DATABASE_SSL_ROOT_CERT`,
`DATABASE_PROVIDER` and connection-mode settings. Never use provisioning or
service-role credentials in a browser or HTTP/web process. Keep Preview on an
isolated non-production database/storage target and register exact environment
callback and recovery URLs. See the existing account and private setup guides.

## GitHub and Vercel evidence

Branch: `codex/phase-1-auth-recovery`. This slice's source/report commit and push
are pending the final document/diff checks; delivery evidence will be appended
after push. No merge or production promotion has been performed.

Last tested Auth recovery Preview:
https://virtual-mbe2i0pjp-shadowrootsec-5679.vercel.app
Deployment `FL46saDJnCuvFqj44pPLLiVUkvfg`, source `07af4b1`, Ready and sampled
on 15 October 2026 at 14:15 UTC. Auth is disabled there. Forgot-password shows the
disabled state; guest reset redirects to login. This is earlier evidence and does
not verify the current evaluator on a deployed route. Current-slice Preview
build/public regression verification remains pending after push.

Existing Production: https://virtual-ink.vercel.app
The latest previously tested application source is `5c55364`; it predates this
slice. Its public/health/guest checks passed. No production role/file/order
workflow is verified, and this slice has not been promoted to Production.

## Known limitations and exact next action

The policy is deliberately disconnected until trusted role/resource loading,
controlled migration/RLS and transaction/audit integration are implemented and
verified. Organization delegation, mixed-role operation, later cancellation,
minimum delivery fields, break-glass operations and MFA recovery/retention still
need product/operations decisions. Conservative deny rules remain in place.

Next engineering action: reconcile the two hosted vendor migration versions with
the repository using catalog reads, then add the smallest trusted identity-to-role
context and suspended-user denial slice with synthetic database/HTTP tests and
controlled development migration verification. Genuine Auth acceptance also needs
an approved synthetic mailbox and private environment setup; no test mail has been
sent. Keep all final Phase 1 gates open until UI/API/database/authorization and
deployed evidence agree.

## Team actions and document checks

- Uchi: review the policy denials and final Phase 1 acceptance cases; coordinate
  genuine development Auth/application mapping and record product decisions.
- Mumba: review role/resource loading, schema/RLS and migration-history
  reconciliation with Uchi, then pair on the next enforcement slice.
- Taizya: specify role, denied, suspended, step-up and empty dashboard states using
  the existing Virtual Ink visual direction; human UI acceptance remains pending.
- Lubasi: resolve vendor assignment, cancellation, delivery minimum data and
  break-glass operations, keeping private operational evidence outside Git.

The Word report uses the existing compact_reference_guide preset and memo_masthead
generator with its named report-style overrides. Structural OOXML, 153 local links,
required evidence and report privacy checks pass. The renderer was attempted and
failed when launching the missing LibreOffice executable. Visual pagination is
unverified; no human signoff or phase completion is claimed.
