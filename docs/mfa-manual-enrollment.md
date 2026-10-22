# Manual authenticator enrollment

22 October 2026. Local review candidate; hosted Auth/MFA and Phase 1 remain incomplete.

The existing authorized enrollment and replacement-enrollment responses now return
manualKey alongside factorId and the private QR image. This is the same provider
TOTP key already encoded in the QR, not a recovery code or application-generated
secret. The gateway accepts bounded Base32 provider data and omits the otpauth URI.
Do not print response bodies or persist the key in logs, audit rows, cookies,
browser storage, URLs, telemetry or reports. The preexisting durable reservation,
result audit and provider/session/MFA restrictions remain unchanged.

The security panel masks the manual key by default and provides a labelled,
read-only field with an explicit show/hide button. It lives only in the active
enrollment component state. Successful enrollment verification, confirmed discard,
explicit hiding and the absolute five-minute display deadline clear the setup
details. Returning from a suspended tab rechecks that deadline; rerenders do not
extend it. Navigation/unmount disposes the component/timer. No secure erasure of
JavaScript memory, developer-tool history or user copies is claimed.

Hiding/expiry is UI cleanup, not provider factor deletion or session revocation.
An unfinished factor remains listed and must be explicitly discarded through the
existing audited action before restarting. Native factor removal, replacement,
last-factor protection and controlled recovery policy are unchanged. The old
verified authenticator remains active during replacement.

Enrollment response caching remains private/no-store. Only the enrollment response
contains the manual key; status and ordinary verification results do not. A failed
result audit returns no enrollment payload. Security transport now rejects
redirects and uses fixed feedback for invalid JSON or unexpected response shapes,
so upstream diagnostics are not rendered. No automatic retry is introduced for
an uncertain provider outcome.

Root negative tests cover ownership-field injection, audit denial, enrollment-only
disclosure and safe command inputs. Real SDK contracts cover malformed, oversized
and invalid keys, token/cookie protection and the QR boundary. Component checks
cover masking, controls, deadlines/visibility, cleanup and diagnostic nonreflection.
The genuine local engine verifies the exact provider key and absence from cookies,
then uses that same key for successful TOTP verification; generated keys stay private.

No hosted user, factor, bucket, credential, role, migration or service is created
or enabled. The managed acceptance target's native verification hook remains a
separate plan requirement; ordinary TOTP itself is available on Free. A compatible
existing managed target or authorized self-hosted HTTPS target is still required
under the existing security policy. Customer/vendor MFA pages, real email/browser/
physical-authenticator and hosted recovery acceptance remain open.

Source: [Supabase TOTP enrollment](https://supabase.com/docs/guides/auth/auth-mfa/totp).
