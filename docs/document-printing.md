# Document printing entry and preservation checklist

23 October 2026. Initial source: 148baf2 on feature/phase1-staging-readiness.

Before editing: preserve /shop, /shop/[slug], /studio, /marketplace, /customer,
/vendor, /admin, /account, Auth callbacks and all existing APIs. Preserve supplied
brand assets, environment guards, server authorization and private-file controls.
No hosted service, schema, price, credential or production change is in scope.

The existing customer dashboard's enquiry draft asks for a product code and
dimensions. It does not collect document-printing options. The public catalogue
has no student document-printing entry. The current local optimized build works;
the 23 October report records 44 Auth-disabled HTTP assertions. Those baseline
results do not verify the new route.

This slice adds /print-documents, prominent public navigation, and a document
specification that can be reviewed and downloaded locally. Pages, copies, paper,
colour, sides, binding, urgency and handoff are explicit. Sheet counts are material
estimates, not backend prices. No approved document rates exist: quotation required.

This is preparation, not order submission. No document is accepted or uploaded.
The local specification excludes customer identity and file information. It must
never produce an order number, payable amount, payment link or successful upload.
The existing order.create schema cannot retain these additional options; do not
silently send a reduced specification or encode options into a product code.

Next secure slice: add a forward, validated document-specification contract to
the server workflow, then connect genuine staging Auth, quarantined file upload,
approved server pricing, order creation and sandbox checkout. Preserve every
selected option through vendor/dashboard/proof fulfilment. Phase 1 is incomplete.

26 October server follow-up: the disabled workflow now accepts a separate
document specification, validated independently in TypeScript and PostgreSQL.
Forward migration `20261026090000` is local only; no hosted schema is changed.
The public form remains local preparation and does not call the workflow API.
See [server contract and verification](reports/2026-10-26-document-server-contract.md).

The `order.create` specification uses `kind: "document"`, `schemaVersion: 1`,
numeric `pages` (1–2,000) and `copies` (1–1,000), plus every existing option:
purpose, paperSize, paperType, colour, sides, binding, urgency and handoff.
Unknown fields/versions, financial fields, document names and coerced counts deny.
Legacy merchandise retains its four-field numeric contract. Existing merchandise
rows remain unchanged; new merchandise requests require actual JSON numbers.
Stored specifications cannot be changed after creation. Choosing an option does
not confirm vendor capability, stock, price, turnaround or delivery availability.

Next: genuine isolated identity/private file intake and reviewed commercial
policy, then a separately reviewed form submission and fulfilment integration.
No document-specific payable total or operational approval is inferred here.

## Review access

Use Print documents on the homepage or navigation, or open
http://127.0.0.1:3120/print-documents on this workstation while the task-owned
local server is running. Choose the options, review the specification and download
the text summary. No original document is included and nothing reaches a vendor.

The [protected UI-only Preview](https://virtual-ink-ui-test-a95v30h1h-shadowrootsec-5679.vercel.app/print-documents)
is READY on Vercel with services disabled. Hosted browser/HTTP probes time out or
fail before an HTTP result; hosted rendering and real order acceptance are unverified.
See the [dated evidence and team report](reports/2026-10-23-document-printing.md).
