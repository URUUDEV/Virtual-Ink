# Vendor onboarding foundation — verification boundary

Updated: 16 October 2026. Status: private core hosted; application intake disabled.
Current [migration reconciliation](reports/2026-10-16-migration-history-reconciliation.md)
matches all ten versions/names and normalized SQL SHA-256 checksums. Fresh local
PostgreSQL 18 replay and all five existing rollback suites pass. The two vendor
migration files are retained under their original hosted versions; no hosted DDL
was executed. Genuine Auth and the provider bridge remain unverified.
See [current QA evidence](reports/2026-10-14-phase-completion-audit.md).
The [previous local review](reports/2026-10-14-vendor-foundation-review.md) is preserved.

The public [vendor preparation flow](vendor-onboarding.md) remains local. Newer
backend source defines a separate proposed persistent contract; public JSON
packets are not API payloads or authorization evidence for that contract.

## Source and boundary

- `src/shared/vendor-onboarding.ts`: profile, lifecycle and receipt types.
- `src/backend/vendors/validation.ts`: bounded fields, operation IDs, versions,
  decision checks, storefront slugs and pagination.
- `database/vendor-onboarding/core.sql`: private applications/snapshots,
  reviewer/audits, storefront/services, outbox and request-limit tables with RLS.
- `database/vendor-onboarding/commands.sql`: proposed lifecycle commands.
- `database/vendor-onboarding/supabase-bridge.sql`: unverified provider adapter
  draft, excluded from portable SQL replay and not applied by this review.

No HTTP intake, genuine login or notification dispatch is enabled. Current catalog
has 18 private tables and 10 migrations, including hosted vendor core/transaction
scope. The provider bridge is absent. The API readiness contract still covers the
original nine tables and restricted group rights. The two vendor versions are now
in local supabase/migrations and match hosted history. Do not reapply existing SQL
to the hosted target; future schema changes require a new reviewed migration.

The proposed lifecycle includes draft, submitted, changes requested, approved and
rejected. Local approval fixtures exercise identity creation when needed, vendor
tenant/owner membership, paused storefront and transaction evidence. They roll
back and represent no real approval or replacement for the private CLI.

Reviewer expiry/MFA freshness, consent, duplicates, role conflicts, storefront
disclosures and retention remain proposed defaults pending acceptance. The
service assumes a trusted adapter derives context. Arbitrary SQL/context access
remains inside that trust boundary.

## Local verification

Fresh QA also ran the existing identity/tenant and vendor rollback fixtures on
the hosted development database; both passed and all 18 table counts returned
to zero. All 18 tables have enabled/forced RLS; service groups remain NOLOGIN.
This verifies domain SQL and denial controls, not genuine provider/application Auth.

Eight existing Phase 2 migrations, core and commands replayed on isolated,
password-protected PostgreSQL 18 bound to loopback. The existing synthetic
`database/tests/vendor-onboarding-core.sql` passed and rolled back: creation,
replay/conflict, submission, stale versions, other-owner denial, reviewer/MFA
denial, changes requested, approval/activation, availability, public contact-field
exclusion and immutable/column rights. Application/storefront counts returned
to zero and the instance stopped. PostgreSQL 17 and genuine Auth remain unverified.

The new regression failed before the fix: explicit empty pagination selectors
passed TypeScript admission. `cursor=` and reviewer `status=` now fail validation;
omitted selectors retain defaults. All five vendor tests run in the security suite.

## Next gate

Mumba reviews the provider adapter against genuine session/MFA revocation, pooled
context reset and privilege behavior. Add expiry, audit-failure, direct-mutation
and concurrency probes before reviewed migration or HTTP wiring. Uchi/Lubasi
resolve VL-03/VL-05; Taizya specifies persistent draft/review/error states.
Keep live activation disabled.
