# Virtual Ink - Supplied Documents and Next Build Handover

**Date:** 9 October 2026. **Company:** Shadow Root Security Technologies.
**Status:** Supplied documents reviewed and build instructions updated.
Product/technical acceptance is pending; this is a documentation handover.

## Source documents used

- Virtual_Ink_Backend_Phase_2_Build_Plan.pdf: seven pages; roles, schema, API
  contracts, denial tests and the web-first roadmap.
- Virtual_Ink_Security_Architecture_and_Flow.pdf: six pages; trust boundaries,
  private files, request flow, threat controls and security gates.
- Virtual_Ink_Escrow_Engine_Build_Specification.pdf: seven pages; later simulated
  ledger, state machine, verification, release, refund, dispute and reconciliation.

All three have revision 8 October 2026. They were supplied in the repository root
and remain unchanged. Their blank signoff records do not record team approval.
PDF references in the new baseline use viewer page numbers, including the cover.

## What changed

The build plan now uses these sources. A source-document baseline maps proposed
tables/endpoints to existing code and records the missing controls. A draft
acceptance record makes the next membership-list endpoint reviewable. README,
permissions, Phase 2 status, task board and open questions point to the new sequence.

Existing users/identities and split immutable access/provisioning audit tables are
retained. Request context remains server-set transaction context; open questions
remain in versioned documentation. Proposed table names do not require replacement
of the current schema. No database migration or application code changed.

The frontend lockfile and Next-generated configuration changes now present are
existing local work. They were not changed or verified by this handover. Supplied
PDFs and the new root image were preserved; the image was not treated as a replacement
for the approved Virtual Ink logo.

## Delivered versus still missing

| Requirement | Current evidence | Remaining gate |
| --- | --- | --- |
| Health/config/backend helpers | Prior backend evidence | Preserve contracts |
| Identity and tenant read | Code and hosted SQL assertions | Genuine Auth-to-API verification |
| Private provisioning | CLI and immutable commit audits | Approved genuine onboarding |
| Membership list | No endpoint yet | Draft acceptance, scoped list and tests |
| Membership creation/change HTTP | No endpoints yet | Invite/lifecycle authority and audited mutations |
| Audit review | No endpoint; API cannot read audits | Purpose-bound grants and redacted lists |
| Escrow | Supplied future specification | Complete state/ledger contract; simulation only |

The last completed backend build recorded 78 passing tests and eight private
application tables. Those tests were not rerun in this documentation handover.
There is no new claim of real login, money movement or production readiness.

## Ordered next work

- First: Uchi records permission/onboarding decisions; Mumba completes private
  driver, credentials, CA and service-login setup using live-backend-setup.md.
  Obtain genuine Auth smoke and committed audit evidence without reporting secrets.
- Next: implement only GET /api/v1/memberships from the draft acceptance record.
  Derive caller scope on the server; hide other/inactive memberships; preserve
  DeliveryPartner exclusion and fail-closed audit/commit behavior.
- Then: address session revocation/abuse controls, audited membership lifecycle
  and restricted audit review in separate slices. Replay owned PostgreSQL safely
  and obtain Uchi's review before declaring Backend Phase 2 complete.
- After: deliver the accepted first web marketplace flow; then private files/design
  briefs after retention, quarantine and access policy are agreed.
- Later: follow the escrow specification's simulated ledger/state/verification/
  release/refund/dispute/reconciliation sequence. Native clients use the same API
  after web/API and release gates are satisfied.

Frontend shell verification can proceed alongside backend setup. The observed
loopback check to port 3001 did not connect; no browser/mobile/build success is
claimed. Review the new lockfile, run typecheck/build and start the preview before
Taizya's UI review.

## Decisions requiring team input

The Phase 2 PDF asks for immediate membership deactivation. Current transaction
snapshot behavior does not prove immediate denial for requests already in flight.
AUTH-02 captures the required guarantee and concurrency review.

The escrow transition table names FAILED, CANCELLED, REFUNDED and DISPUTED without
complete transition definitions. Cancellation during production lacks a specified
settlement path. Partial outcomes, balancing accounts, idempotency/concurrency,
release evidence and decision authority need an accepted contract. ESC-01 through
ESC-04 capture these questions. No settlement provider, fee, tax or release rule
was invented. Audit review, membership authority and rate-limit/MFA policy also
have named questions in the updated document.

## Where each lead starts

| Lead | Starting action | Handover evidence |
| --- | --- | --- |
| Uchi Chinyama | Review Phase 2 gaps and membership-read draft | Recorded criteria/permission decisions |
| Mumba Chitonge | Complete live setup; build scoped membership read | Genuine smoke, tests, migrations/audits |
| Taizya Nakapende | Review shell and membership/session UI states | Mobile, keyboard and denied/empty UX |
| Lubasi Monde | Verify owner/staff and support procedures | Private evidence references; unresolved rules |

## Verification and limitations

All 20 PDF pages were text-extracted using the managed Python runtime. Pages were
rendered with pypdfium2, and all three overview sheets were inspected for document
structure, flow diagrams and the state table. SHA-256 checks verify the originals
are unchanged. Updated documentation links and Git whitespace checks were checked.

The Word generator validates ZIP/XML, named styles, table geometry and obvious
credential patterns. Word visual rendering was attempted but LibreOffice is absent;
visual QA remains unavailable. No backend tests, frontend build, live Auth request
or database operation was performed for this documentation-only handover.

Changed files: README.md; docs/build-plan.md; docs/backend-phase-2.md;
docs/permissions-plan.md; docs/open-questions.md; docs/task-board.md;
docs/team-report.md. Created: docs/source-document-baseline.md;
docs/acceptance-phase-2-membership-read.md; this dated Markdown report and matching
Word document. Historical reports and user-provided work remain preserved.

## Next prompt for Mumba

Use the three supplied PDFs and docs/source-document-baseline.md to continue
Virtual Ink Backend Phase 2. Inspect the current repository; preserve the existing
schema and provisioning boundary. Finish genuine login readiness where approved
private settings permit. Implement only the active membership read from its draft
acceptance record with server-derived scope, bounded pagination, delivery exclusions
and transactional audits. Verify allow/deny, inactive, cross-user, pool reuse and
audit/commit failures. Keep lifecycle mutations, broad audit reads, marketplace,
uploads and escrow outside this slice. Record actual blockers and produce the next
Markdown/Word team report; Uchi records product acceptance separately.
