# Virtual Ink permissions plan

Owners: Uchi Chinyama and Mumba Chitonge. Status: **Backend Phase 2 narrow implementation delivered**; business capability matrix below describes future access. Implemented now: verified permanent identity and active application mapping, own vendor tenant scope, explicit expiring operator tenant review grants and transaction-bound access audits. All private files/proofs, role changes and pricing capabilities remain closed. Guest/tenant defaults still need Uchi acknowledgement. See [current implementation](backend-phase-2.md).

## Role access and prohibitions

| Role | Intended allowed access, after implementation | Must never access |
| --- | --- | --- |
| Customer | Own profile, briefs, files, proofs, saved designs, quotes, orders and support cases; only authorized objects | Another customer's private content; vendor internal queue/earnings; operator controls; other tenant resources |
| Guest | Public approved storefront/catalogue discovery; any draft or lookup capability requires a separate constrained design decision | Private files, proofs, order history or sensitive lookup by predictable identifier; vendor/operator data; implicit authenticated permissions |
| VendorOwner | Own vendor profile, permitted staff memberships, approved catalogue/pricing changes, assigned jobs and their required files/proofs; own approved reports | Other vendors' private work, unrelated customer files, platform-wide finances, self-approval as verified vendor, unauthorized role escalation |
| VendorStaff | Assigned work and needed files/proofs for the active vendor membership; only specific operational transitions approved for the staff role | Other vendors; unrelated jobs; owner settings/staff grants; unrestricted earnings or payment evidence; platform controls |
| PlatformOperator | Purpose-specific vendor approval, support, authorized operational/payment/reconciliation records and audited exception workflows | Default unrestricted file access, routine impersonation, secret credentials, invisible cross-tenant reads or unaudited modifications |
| DeliveryPartner | Assigned delivery task with the minimum required handoff/contact information and permitted delivery status changes | Print files, artwork, design proofs, private digital handovers, unassigned tasks, prices/commissions/earnings, general customer or vendor data |

Operator capabilities should be separately granted (for example support vs reconciliation), not a universal administrator switch. The staff assignment model and minimal delivery contact fields need Uchi/Lubasi decisions. Addresses are private; do not log or broadly export them.

## Vendor isolation

- Propose each approved vendor organisation as a tenant boundary; confirm whether customer organisations also need tenants before creating that schema.
- Tenant selection is requested context only. Verify active server-side membership or a specifically approved customer/job assignment before a resource query.
- Never trust client-supplied `vendor_id`, `tenant_id` or `role` as proof. Reject or treat them only as untrusted selectors checked against verified scope.
- Scope lists, single resources, mutations, joins, nested objects, exports, cache keys, storage grants and background work. A UUID is not an access control.
- Restrict parent/child relationships so a child cannot reference another vendor's object. Use database constraints and RLS as defense in depth after policy design.
- Bind job assignments and delivery tasks to explicit subjects. Delivery serializers must omit all file/proof references and signed URLs.
- Use 404 for unavailable/out-of-scope resources where existence itself is sensitive. Use 401 for missing identity and 403 for a known forbidden capability without leaking other-tenant data.
- Audit membership changes, sensitive file/proof access, approved support exceptions, pricing changes and operational transitions.

## Phase 2 minimum evidence

Create synthetic fixtures for two vendors/tenants, two customers, owner, staff, operator and delivery identities. They are test fixtures, not real businesses. Prove unauthenticated denial, guest limits, wrong role, inactive membership, guessed IDs, cross-tenant lists/mutations/joins, unassigned staff work and delivery exclusion from files/proofs. Confirm missing audit persistence blocks required sensitive operations. Test storage and background scopes when those adapters are introduced.

Uchi supplies the accepted permission matrix and guest/tenant decisions. Mumba supplies schema, migrations, verified identity implementation, negative tests and setup/rollback notes. Taizya specifies permission/expired-session UX. Lubasi confirms assignments and support responsibilities.
