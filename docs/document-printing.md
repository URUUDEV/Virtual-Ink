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
