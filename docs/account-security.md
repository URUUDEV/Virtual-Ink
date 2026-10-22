# Customer and vendor account security

22 October 2026. Local review implementation; Phase 1 remains INCOMPLETE / NO-GO.

The account page links current CUSTOMER and VENDOR assignments to /account/security
when the existing isolated security feature is enabled. The server verifies the
provider identity/session, then executes account.security before fetching factors.
Unprovisioned, inactive, expired or denied accounts return to /account. Privileged
roles continue through /admin/security; that page independently checks its role.
No role is taken from browser fields, user metadata or a client visibility check.

POST /api/security/self-status requires an empty JSON object and returns only the
caller's role, application user ID, factors, assurance and audit reference. The
existing administrative status operation remains unavailable to customers/vendors.
Unknown identity fields are rejected; malformed-request auditing may return a
permission denial rather than a validation response for nonadministrative callers.
No account data is returned on either denial path.

Migration 20261022102315_virtual_ink_self_service_mfa.sql is a forward-only explicit
replacement of the existing private command. Only account.security and mfa.reserve
gain an additional CUSTOMER/VENDOR allowance. Native session/hook receipts, recent
password, signed application step-up, per-account budgets, immutable audits,
serialized uncertain removals and administrative dual approval are retained.
CREATE OR REPLACE preserves the restricted function ACL. No tables, runtime LOGIN,
browser grants, public schema, RLS policy, storage policy or hosted flags are added.
The historical web-admin audit source labels the shared transport; it does not
mean the caller holds an administrator role. Actor identity and role remain current.

The shared panel supports genuine enrollment with private QR/manual key, challenge,
verification, factor listing, replacement, unverified-factor discard and removal
when another verified factor remains. Customers can choose initial enrollment;
the existing final-factor protection also applies to them. Turning MFA off by
removing the last factor is not supplied here. Controlled recovery execution and
real-device acceptance remain open. Vendor financial or privileged actions still
require their own server authorization and recent native/application aal2; this
page does not implement or authorize an unbuilt financial operation.

Security forms use POST even if JavaScript fails, preventing native GET submission
of passwords, TOTP codes or recovery reasons in URLs. The MFA interaction requires
JavaScript; a noscript notice explains this, and native fallback fails closed
rather than carrying out a change. Existing same-origin JSON/Origin checks remain
the mutation boundary. Password/code inputs retain accessible labels and autofill
hints; TOTP stays a text input with numeric keyboard and correction disabled.
Private setup details retain the [bounded display contract](mfa-manual-enrollment.md).

Verify using npm run test:coverage, test:security, test:web, test:auth:web,
typecheck:web, lint and build:web on the reviewed Node runtime. The disposable SQL
replay script exercises all migrations and customer/vendor allow/denial cases.
The genuine local Auth runner now includes both roles through the actual SDK,
private command account, native hook and application cookie, with synthetic users
only. It also checks administrative/payment denial after step-up, last-factor
protection, replacement/discard, cross-account factor denial and native revocation.
Synthetic component checks are separate from genuine provider and browser evidence.

Hosted services remain disabled. Apply the migration only after isolated target,
native hook, private role/connection and acceptance routing reviews pass. Never
edit historical staging migrations, enable production, bypass the native hook or
use the protected UI-only build as hosted identity acceptance. Roll back an enabled
review environment by disabling security/Auth entry points and reverting the web
commit; preserve audit/factor state and reconcile uncertain provider operations
privately. Do not drop the schema or delete customer data as rollback.
