# Order dashboards

[Build/release report](reports/2026-10-21-order-dashboards-launch-gates.md) and
[Word handover](reports/2026-10-21-order-dashboards-launch-gates.docx) record exact
source, test denominators, UI-only deployment and unclosed launch gates.

21 October 2026. Review candidate, not a completed Phase 1 dashboard suite.

Routes `/customer`, `/vendor` and `/admin` use the existing online cookie gateway,
current database identity/session checks and the restricted security-service group.
WORKFLOW_ENABLED and both database configuration markers must be enabled only
after target compatibility and service acceptance. They remain off on hosted UI
previews. No runtime login, seed user or provider credential is created here.

The sixteenth forward migration adds one private function, not a browser-facing
RPC or a table grant. Customer queries match owner; vendor queries match current
active tenant membership and assignment. ADMIN/SUPER_ADMIN oversight requires a
recent genuine AAL2 session, native-hook receipt and signed application step-up.
Finance/security-specific roles do not inherit general order oversight. Existing
file and privileged mutation grants remain unchanged. The dashboard does not
return raw storage paths, hashes, provider receipts, tokens or private identities.

Counts aggregate actual scoped orders independently of filters and pagination.
List pages default to 20, max 50, sorted newest first with an authorized UUID
keyset cursor and status filter. Details include a specification, current quote
and at most 50 recent immutable state changes. There are no notification, revenue
or payout totals inferred from unavailable services. Reads and denials require a
durable bounded audit; audit failure returns no data. The shared account command
budget is 120 per five minutes. This coarse lock/summary implementation still
needs production-sized query/load acceptance.

Server-rendered native forms call server functions; they do not depend on a
custom browser fetch handler. Next's server-action protections and the exact
configured Origin gate apply. Every form repeats current database authorization,
expected version and UUID operation checks. Duplicate fields, unknown properties
and unsupported actions reject. Typed fixed feedback never renders provider/SQL
diagnostics. Mutation redirects remain on the three local routes.

Implemented customer controls: enquiry draft specification, early cancellation,
current quote acceptance/rejection and collection confirmation. The draft accepts
a manually supplied enquiry product code; it is not a validated commercial
catalogue, cart, server-calculated checkout or payment request. It remains disabled
on hosted deployments. Vendor controls: assigned-job acceptance/decline with
reason, proof preparation, approved production queue/start, evidence-gated finish,
QC pass/fail/correction and collection/delivery readiness. A delivery assignment
must already be authorized. Administrator oversight is read-only, with a link to
the existing controlled security tools; financial/assignment grant writers are
not added by this dashboard.

Proof approval is deliberately not exposed here until the actual private proof
viewer/transport exists. Existing proof APIs and worker libraries do not substitute
for that customer review. Complete file upload/download, catalogue/pricing, cart,
checkout, storefront management, addresses, messages, invoices, refunds, payout,
support and operational dashboard sections remain open. Do not ship this subset
as the complete dashboard suite or turn on hosted flags to demonstrate empty data.

Verification: complete root coverage/security, web component/action and Auth SDK
checks, strict types, lint and production build. The managed-shaped SQL runner
replays sixteen migrations and tests counts, scope, cursor denial, audit outage
and membership revocation. Genuine local Auth separately tests owned detail,
other-customer denial, admin AAL1/missing-proof denial, AAL2 access and post-logout
database revocation. These are not hosted browser or physical-device acceptance.
