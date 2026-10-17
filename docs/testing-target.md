# Testing and release target

Uchi requested on 15 October 2026 that work proceed towards the complete product,
with 95% testing and a GitHub commit/push after every completed phase. All required
executed tests must pass. Code coverage, feature completeness and human acceptance
are separate measurements; no single percentage substitutes for the others.

## Backend/shared coverage

Run `npm run test:coverage` on the reviewed Node runtime. The command runs every
root test file and requires at least 95% of lines, branches and functions in its
declared scope. The machine-readable result is `coverage/backend-summary.json`.
Previous success is invalidated at startup. Missing source files, missing coverage,
invalid counts, failed/skipped tests and values below 95% block the command.

Scope: executable TypeScript/JavaScript in `src/backend` and `src/shared`, plus
`src/app.js`, `src/config.js` and `src/vercel.js`. The source inventory is checked
against measured files, so an unimported new module cannot silently inflate the
result. Declaration files and the interfaces-only `database/ports.ts` are excluded;
changing that file to runtime code requires updating the inventory policy.
Percentages use exact counts, without rounding a failing result up to 95%.

This uses Node's experimental V8 test coverage. It does not measure the standalone
`src/server.js` process lifecycle, frontend components/browser interactions, SQL,
genuine Auth/database/storage or deployment configuration. Those remain explicit
verification gates. The full product has not reached 95% testing or completion.

## Other required evidence

Run `npm run lint` after root `npm ci --include=dev`. The build-enforced
[lint gate](linting.md) checks 156 scoped JS/TS files with no warnings or errors.
Its denominator is separate from measured test coverage and hosted acceptance.

Run root/security tests, React and real-SDK Auth integration tests, both type checks,
the production build, loopback HTTP/router checks and relevant SQL assertions.
Genuine hosted workflows need approved synthetic identities/data, role/tenant
denials and safe failure evidence. Keep unimplemented functionality marked pending.

`npm run check:hosted` performs thirteen read-only page, health, guest-protection and
missing-route checks plus checks of each unique rendered image (twenty requests for
the current seven-image catalogue) against `https://virtual-ink.vercel.app`. To test Preview, set
`HOSTED_CHECK_URL` to an actual deployment URL copied from this project's Vercel
record. Only the known project domain/account naming is accepted. Do not guess URLs.
The result is `coverage/hosted-smoke.json`; bounded HTML inspection ensures page
200 responses cannot hide broken image URLs. It logs paths/statuses, never response
contents, cookies, credentials or provider errors. It supplies no genuine Auth,
database, upload, dashboard, browser/mobile or phase-completion evidence.

## GitHub and phases

Work on one reviewable slice at a time. Use a review branch/Preview while a phase
is incomplete; stage only reviewed files and preserve unrelated work. After every
completed phase, commit and push to `origin`, verify the remote commit and record
the actual Preview/Production URLs with the tested commit. Never force-push or
commit private environment files. A failed push or deployment remains blocked.

The [phase completion checklist](phase-completion-checklist.md) still requires the
full feature journey, all local/testing/Vercel gates and actual human acceptance.
The [open decisions](open-questions.md) still govern Auth, files, prices and manual
payment/delivery authority. Passing scoped coverage does not authorize those rules.
