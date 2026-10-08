# Virtual Ink API standards

Owner: Mumba Chitonge, with Uchi Chinyama reviewing product behavior. Versioned APIs use `/api/v1`. The legacy `/health` retains its original response for compatibility.

## API response format

```json
{
  "data": { "service": "Virtual Ink", "status": "ok" },
  "meta": { "requestId": "server-generated-uuid" }
}
```

Return JSON with `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Request-Id`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`. Request IDs are generated on the server; never trust an incoming ID for correlation. Health is liveness only. Do not include environment values, infrastructure details or readiness claims. Current helper returns 200; future create/delete handlers must deliberately set their appropriate status and contract.

## Error response format

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed.",
    "fields": ["quantity"]
  },
  "meta": { "requestId": "server-generated-uuid" }
}
```

Use fixed safe codes/messages: 400 invalid JSON/validation, 401 unauthenticated, 403 forbidden, 404 unavailable, 405 method denied, 409 conflict, 413 body limit, 415 content type, 500 unknown exception and 503 required audit unavailable. `fields` contains only schema paths authored on the server. No raw values, attacker-selected property names, database errors or stack traces. 405 includes `Allow`; HEAD responses have no body. Native framework failures before a route (for example HTTP parsing) may use framework behavior; application handlers use the shared boundary.

## Validation rule

All request bodies, query parameters and resource IDs are untrusted. Use `readJson` with an explicit validator; validate exact permitted fields, types, bounds, strings and identifiers, and reject unknown fields. JSON bodies are capped at 16 KiB, including streamed bodies with no Content-Length. Empty/malformed JSON fails. No price or authorization can be accepted because it passes syntax validation. File/multipart validation requires its own later protected boundary.

## Auth rule

Only health is intentionally public in the current backend. Do not create private APIs before verified identity and least-privilege authorization. Derive roles and active tenant/vendor scope on the server. Never authorize from client role, vendor or tenant fields. Scope the query before reading or mutating the resource. Customer resource ownership and assigned vendor/delivery access require explicit checks. Delivery partners never access print files or proofs. Future session implementation must decide CSRF, expiry, refresh, rate limits and origin policy; no permissive CORS is enabled.

## Audit rule

Use an explicit verified actor, authorized tenant, opaque resource ID, generated request ID, fixed action and outcome. `recordAudit` requires a sink and fails closed. Record the audit with protected changes transactionally or through an approved reliable pattern; do not claim console logs are durable audit history. Sensitive access needs an approved durable event before releasing the protected content. No private file contents, full addresses, credentials, tokens or signed URLs in logs. Retention/read/export rules require policy decisions.

## Pagination rule

Future lists use a deterministic `(created_at, id)` order, default limit 20, maximum 100 and a validated opaque cursor. The current foundation parser accepts a UUID cursor; before a list implementation, resolve it within the authorized scope and encode/validate the ordering tuple or adopt a versioned opaque token. Do not use an unscoped lookup to resolve it. Reject invalid limits, duplicate pagination parameters and unapproved query fields. A list response should add `meta.pagination: { limit, nextCursor }`; `nextCursor` is null at the end. No list API or fabricated total count is implemented now.

## ID handling rule

Use server-generated UUIDs and strict boundary validation. IDs are opaque references, not secrets and not grants. Validate tenant scope on every lookup, nested relationship and file grant. Avoid reflecting IDs into filesystem paths; the private-key helper only accepts valid UUIDs. Never use customer filenames as storage keys. Do not expose another tenant's existence in error details.

## Server-side pricing rule

Client price totals, discounts, commission rates, tax formulas and delivery charges are untrusted. Later APIs accept approved product/options/quantity inputs, then calculate the authoritative quote on the server using versioned, verified rules and exact decimal/minor-unit money with currency. Reject unapproved fields and stale quotes according to an accepted contract. No pricing engine or business formula is implemented in this foundation. Illustrative values in supplied concept images are not prices for a real offering.
