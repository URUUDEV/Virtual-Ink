# Virtual Ink supplied-document build baseline

Reviewed: 9 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
The user asked the team to use the supplied PDFs for the next build steps.
The PDFs remain unchanged. Their blank review records are not completed signoff.

## Sources and reading order

Page references below are PDF viewer pages, including the cover; printed footer
numbers are one lower. All three sources have revision 8 October 2026.

| Source | Sections to use | Purpose |
| --- | --- | --- |
| [Backend Phase 2 Build Plan](../Virtual_Ink_Backend_Phase_2_Build_Plan.pdf) | Sections 2-6 and 8-11; PDF pages 2-7 | Roles, proposed schema, endpoints, denial tests and acceptance |
| [Security Architecture and Flow](../Virtual_Ink_Security_Architecture_and_Flow.pdf) | Sections 1-9; PDF pages 2-6 | Trust boundaries, request flow, privacy, threat controls and gates |
| [Escrow Engine Build Specification](../Virtual_Ink_Escrow_Engine_Build_Specification.pdf) | Sections 1-12; PDF pages 2-7 | Later ledger, state machine, verification, release and reconciliation |

Read the repository working agreement, [current evidence](backend-validation.md)
and [live setup guide](live-backend-setup.md) alongside these sources. The PDF
baseline predates the latest code: do not rebuild existing identity tables or
reapply migrations to the configured hosted project.

## Phase 2 requirements mapped to the repository

| PDF requirement | Repository evidence / current state | Remaining work |
| --- | --- | --- |
| Application-owned users and identity | virtual_ink.users and identities; provider adapter | Genuine provider-to-runtime verification |
| Tenants, roles and memberships | tenants, user_roles, memberships and operator_grants; hosted isolation assertions | Product review; lifecycle and assignment workflows |
| Durable audit_events | Immutable access_audits, provisioning_audits and membership_list_audits | Scoped review API; durable denial policy and retention |
| request_context | Transaction-local server context and request IDs | No extra persistent table needed for present slice |
| open_questions | Versioned docs/open-questions.md | Keep decisions here until a product workflow needs database storage |
| GET /health and GET /api/v1/me | Implemented; health verified previously | Genuine authenticated /me smoke pending |
| GET /api/v1/memberships | Implemented with caller-only pagination and self-scoped audit | Genuine login verification and product review |
| POST /api/v1/memberships | Missing HTTP endpoint; private add_staff CLI exists | Reviewed invite/create authority and constrained mutation grants |
| PATCH /api/v1/memberships/:id | Missing; runtime cannot update memberships | Audited suspension/change workflow and concurrency semantics |
| GET /api/v1/audit-events | Missing; API login cannot read audits | Separate purpose-bound permission and redacted, bounded results |

Existing GET /api/v1/tenants/:tenantId/access is an extra narrow access probe;
membership discovery is a separate read. Administrative endpoints remain missing.
Keep the current table names and split audit records unless a reviewed migration
is necessary. There is no reason to rename users to app_users only to match a
proposed name in the PDF.

The latest membership slice records 90 passing tests. Its live Auth/pg/TLS checks
remain blocked; this does not establish full Phase 2 completion. See the dated reports
for what was actually verified.

## Security controls: current evidence and gaps

- Implemented: server-verified bearer identity, active application mapping,
  server-set tenant scope, scoped RLS, private non-owner service groups, bounded
  validation, safe errors/request IDs and fail-closed transactional read/provisioning audits.
- Pending: genuine login, session revocation, login/API abuse limits, operator MFA,
  lifecycle mutations, restricted audit review, durable denial events and owned
  PostgreSQL replay. Runtime accounts were last verified as NOLOGIN with no passwords.
- Future: resource assignment for orders/files, private quarantine/scanning,
  expiry/deletion, server quote snapshots, operational exports and scoped workers.
  Existing contracts do not constitute working integrations.
- DeliveryPartner must not receive print files, proofs or payment details.
  Technical administration is a maintenance trust boundary, not a new selectable
  business role or automatic authority to approve vendors/payments.
- The PDF's immediate membership-deactivation requirement is not yet proved.
  Current reads use a transaction snapshot; overlapping revocation can affect
  the next transaction. Resolve AUTH-02 before claiming stronger guarantees.

## Ordered next slices and exit evidence

### 1. Complete setup and genuine identity verification

Mumba follows the existing setup guide, installs/pins the actual pg dependency,
configures separate credentials and trusted CA privately, and obtains reviewed
development account/tenant references. Run offline readiness, explicit database
readiness, genuine Auth smoke, and administrative inspection of committed audits.
Uchi records the permission/tenant decisions and onboarding approval authority.
No password, token, full address or signed URL belongs in the evidence report.

Frontend dependencies now have a supplied lockfile and Next-generated setup
changes. Verify them before marking installation/build complete. Shell checks may
proceed alongside backend setup; the verified marketplace flow follows the Phase 2 gate.

### 2. Read the caller's active memberships

Review the delivered GET /api/v1/memberships against [the draft acceptance record](acceptance-phase-2-membership-read.md) and [implementation evidence](membership-discovery.md).
Derive the caller from verified identity; never take user/role/vendor authority
from request fields. Keep the result and audit in one transaction and preserve
the existing narrow selected-tenant policies by designing a separate scoped read.
Prove another user's memberships, inactive memberships and mixed delivery roles
are hidden; test adapter parity, pagination, audit/commit failure and pool context reset.

### 3. Add the remaining Phase 2 security workflows one at a time

Review secure session revocation, abuse controls and operator MFA requirements.
Then implement audited membership suspension/change and controlled creation or
invitation with resource ownership checks. Resolve the operator/owner invite
authority and last-owner rules before exposing mutations. Add scoped audit review
with purpose, expiry, field allowlist and pagination; ordinary API access must not
gain unrestricted audit visibility. Replay portable migrations in an isolated
owned PostgreSQL 17 database. Uchi reviews all evidence before Phase 2 closes.

### 4. Deliver the first accepted web marketplace flow

Follow Backend Phase 2 section 10: accepted UX, operations and API requirements
come first. Implement one discovery/list/detail flow. Keep illustrative fixtures
labelled and unverified vendors/prices out of commercial claims. Taizya verifies
mobile, keyboard, empty/loading/error/denied states and navigation.

### 5. Deliver private files and design briefs

Uchi approves retention/deletion and access policy; Lubasi supplies human review
requirements. Mumba implements private quarantine, validation, scoped assignment,
audited access and worker identities. Prove delivery exclusion and cross-tenant
denial before uploads or processing are enabled.

### 6. Build escrow in simulation after its prerequisites

Use the escrow PDF sequence: append-only ledger/schema; state machine; manual
verification adapter; release/refund/dispute; reconciliation; approved sandbox
adapter. Use integer minor units, explicit currency, balanced counterparts,
idempotency and version checks. Settlement inputs come from approved server quote
snapshots, never client totals. Correct posted entries with new entries.

Simulation records and UI must say simulated; FUNDS_HELD/RELEASED in a fixture
does not mean Virtual Ink holds or transfers money. Live providers and money
movement need separately approved business/provider/policy decisions. No fee,
tax, currency conversion or release trigger is inferred from this specification.

Before implementing the state table, resolve ESC-01 through ESC-04: it references
FAILED, CANCELLED, REFUNDED and DISPUTED without defining their outgoing or terminal
behavior, allows cancellation in production without a settlement path, and leaves
partial/concurrent outcomes and account balancing details unspecified.

### 7. Expand clients after stable web/API gates

Android/iOS remain later clients of the same API. Secure session storage, account
deletion, internal Android/TestFlight testing and release policy evidence precede
store publishing. Responsive web work does not imply native clients exist.

## Next prompt for Mumba

```text
Continue Virtual Ink Backend Phase 2 using docs/source-document-baseline.md and
the three supplied PDFs. Inspect current code and evidence first. Finish genuine
Auth-to-API readiness where private approved configuration is available; document
any remaining blocker without printing secrets. Review the delivered caller's
active membership read from docs/membership-discovery.md, keeping
server-derived scope, DeliveryPartner exclusions, restricted database grants and
transactional audit/commit failure behavior. Do not add membership mutations,
unrestricted audit reads, marketplace, uploads or escrow in this slice. Run the
relevant tests and hosted isolation assertions for changes; update setup/rollback
notes and open questions. Produce dated Markdown and Word team reports with
actual results and each lead's next action. Keep product signoff pending until Uchi
records a decision.
```
