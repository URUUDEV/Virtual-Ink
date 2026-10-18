# Account recovery and form feedback

18 October 2026. Local UI review slice; Phase 1 and hosted acceptance remain open.
Owners: Uchi Chinyama and Mumba Chitonge; UX review: Taizya Nakapende.

The existing login, registration, password recovery/update and logout APIs are
unchanged. The UI now requires their expected success state, rather than treating
any HTTP success as confirmation. It never displays raw provider error bodies.

| Password-update result | UI behavior |
| --- | --- |
| Confirmed update, logout succeeds | Navigate to login with the existing completion notice |
| Confirmed update, logout fails | Keep the password form closed; retry logout only |
| Network, invalid success body or server failure | State that the update is unconfirmed; offer logout and a new recovery link |
| Expired recovery session | Close the password form and offer a new recovery link |
| Validation, permission or rate denial | Explain the denial; retain the form without its submitted password |

Unconfirmed updates never acquire a success label. Client cancellation does not
undo server work, and leaving/reloading the page does not establish its outcome.
The server must still verify the user, session and any required recent MFA.
Logout remains session-scoped; this UI does not promise global token revocation.

Shared controls provide a labelled password visibility button, native constraints,
password-manager autocomplete, focused result/error messages and separate live
waiting messages. Passwords remain uncontrolled input values, are cleared after
capture for submission, and are not put in React state, browser storage or URLs.
Email values remain in the form after an ordinary failure. An immediate request
gate rejects duplicate submits; unmount aborts pending fetch and ignores stale UI
results. Fixed same-origin requests disable caching and redirect following.

Public account forms remain disabled when Auth configuration is unavailable.
The existing proxy still protects `/reset-password`, account/admin routes and
the brand lab. No development login, fake success endpoint or role selector is
introduced. Approved brand geometry, routes and supplied assets are preserved.

Run `npm run test:web`, `npm run test:auth:web`, `npm run typecheck:web`,
`npm run lint`, the backend coverage/security gates and the local production
build on the reviewed runtime. `scripts/account-http-checks.mjs` accepts only a
loopback `WEB_CHECK_URL` and tests unavailable-service/denial behavior. Its default
is `http://127.0.0.1:3117`. The component harness has synthetic hooks/transport;
it does not replace React DOM, genuine provider or browser accessibility tests.

See [the handover](reports/2026-10-18-account-recovery-ux.md) for actual results,
limitations, release blockers and team actions. Local rollback uses pre-slice
`529482d` in a separate clean checkout, preserving user work; rebuild with the
pinned dependencies. No database rollback is required and no hosted release
occurred. Do not reset user changes or force-push.
