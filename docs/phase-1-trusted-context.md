# Phase 1 initial trusted actor context

Later 16 October update: the separate [explicit assignment foundation](phase-1-role-assignments.md)
now supplies a locally tested eight-role schema/reader with no legacy fallback.
It remains unapplied on hosted development. This page describes the earlier
legacy bridge; genuine MFA, privileged writers and resource routes remain open.

16 October 2026. Owners: Uchi Chinyama and Mumba Chitonge.
Status: locally tested internal foundation; full eight-role enforcement remains open.

`loadPhase1Actor(tx, verifiedIdentity)` in src/backend/identity/phase1-context.ts
uses the existing application identity, active-user and active-role rows. A caller
must first run the real identity verifier, then call the loader inside the same
transaction as future resource checks, action and required audit. It must run
before selecting a tenant; prior user, tenant and access-mode context is cleared.
There is no browser-supplied role, role selector or decoded-token authority.

Only a single legacy Customer or DeliveryPartner maps to CUSTOMER or
DELIVERY_PARTNER. Missing/mixed/duplicate roles, unmapped identities and inactive
users deny. A Customer with an active vendor membership also denies, using the
existing own-membership discovery policy and a LIMIT 1 read. PlatformOperator
does not map to ADMIN. Six other Phase 1 roles require a new reviewed lifecycle
and schema; no privileged role or vendor is created automatically.

The returned immutable actor has no organization IDs, vendor/design/delivery
assignments, grants or elevated assurance. AAL1 is a conservative floor, not an
assertion about enrolled MFA. Resource facts still need their own trusted loader;
the helper does not authorize an order/file endpoint or persist an audit. It has
no production route caller yet. Existing legacy reads retain their current policy.

The enabled provider verifier also rejects deleted records and malformed ban
timestamps, including non-string values; active bans deny. Expired, valid bans
remain eligible. No metadata field supplies business authority. Application
user/identity/role revocation is read on each transaction, without caching. The
existing repeatable-read snapshot does not guarantee cancellation of requests
already in flight when an administrator suspends an account.

No schema migration, role-assignment write, HTTP endpoint, environment variable
or sensitive enablement is added. The reconciled ten hosted migrations and
original nine-table API readiness contract remain unchanged. The local RLS probe
uses synthetic rollback fixtures, not genuine Auth sessions.

See [dated evidence](reports/2026-10-16-trusted-identity-context.md). Next: design
and test explicit server-owned assignments for all eight roles, audited privileged
account lifecycle and real MFA/session revocation, then load resource scope and
wire named business actions with transactional audits. Keep the Node advisory,
genuine Auth, private-file and full Vercel/human acceptance gates open.
