# Virtual Ink Phase 1 completion checklist

## Mandatory completion gate — updated 14 October 2026

Latest [strict product-phase audit](reports/2026-10-14-phase-completion-audit.md):
Phase incomplete. This historical foundation checklist does not cover the broader
MVP order/quote/payment/delivery requirements. Those journeys and Vercel evidence
are missing; keep phase closure unchecked regardless of foundation delivery checks.

Phase 1 remains incomplete until the application works locally, passes testing
and is successfully hosted on Vercel, with the deployed URL in the completion
report. Complete every item in the [phase completion and Vercel checklist](phase-completion-checklist.md).
Its database, storage, Auth, customer/vendor/admin dashboard and deployment checks
remain pending/blocked where unbuilt or unverified. Historical checked delivery
items below do not satisfy this gate or constitute phase completion.

- [ ] Local application operation and required testing verified for completion.
- [ ] Vercel hosting verification VH-01 through VH-17 passed with evidence.
- [ ] Actual production deployment URL and tested preview URL recorded.
- [ ] Required human acceptance and phase signoff recorded after all gates pass.

Historical Phase 1 approval checklist. [Backend Phase 2](backend-phase-2.md) now
adds a narrow identity/tenant read, hosted schema/RLS tests and durable read audits.
Live setup and human approvals still remain open. Refer to [the latest team
report](team-report.md) for current starting points.

Separate delivered artifacts from lead acknowledgements and Uchi approval. Check a delivery item only after reviewing its evidence; do not infer approval from file creation.

## Foundation delivery

- [x] Repository inspected and findings reported before changes; see [inspection record](repository-inspection.md).
- [x] README explains Virtual Ink, Phase 1 scope, team, setup and document navigation.
- [x] Role handover process and definition of done documented.
- [x] Task board grouped by Uchi, Mumba, Taizya and Lubasi, with dependencies and reviewers.
- [x] Copyable role and weekly review prompts delivered.
- [x] Mumba's technical baseline plan covers modules, planned entities, security, tenants, audit, testing and sequence.
- [x] Uchi acceptance template delivered with signoff evidence requirements.
- [x] Taizya UX template delivered with fields, states, accessibility and mobile notes.
- [x] Lubasi operations/vendor template delivered with discovery and readiness requirements.
- [x] Open questions register covers every requested business and technical category.
- [x] Minimal health endpoint, environment example, validated config and basic test setup delivered.
- [x] Supabase-first provider configuration, server-only REST boundary and owned-PostgreSQL migration plan delivered; a new free-tier development project `odgxcuwueessxfsoveza` is active and empty.
- [x] Automated tests and startup/config/shutdown checks pass; evidence recorded below.
- [x] No full marketplace, real payments, live delivery tracking or automatic printer control implemented.
- [x] No real vendor, partner, price, commission or tax rule invented.
- [x] Text placeholders supported; missing images do not block work.

## Engineering evidence

| Check | Command or method | Date | Result / evidence |
| --- | --- | --- | --- |
| Automated tests | `npm test` | 2026-10-08 | 9 passed, 0 failed; health GET/HEAD, 405/404, headers, request IDs, sensitive-input exclusion and config validation |
| Startup and shutdown | `npm start`, then Ctrl+C in local terminal | 2026-10-08 | Default loopback startup emitted `server_started`; Ctrl+C emitted `server_stopped`; terminal wrapper returned 1 after interruption |
| Invalid startup settings | Start `src/server.js` with invalid PORT | 2026-10-08 | Exit 1 before serving; generic validation error did not echo supplied value |
| Documentation references and scope | Local Markdown link check and file review | 2026-10-08 | All local links in 11 Markdown files resolve; required docs and scope exclusions reviewed |

The default subprocess-isolated test runner initially failed under the Windows sandbox (`EPERM`). The final `npm test` command uses Node's single-process mode and all assertions pass. A separate second-terminal health smoke request could not launch under the sandbox while the server terminal was active; live HTTP behavior was verified by the automated loopback tests instead. The dependency-free lockfile was written directly after npm's write was denied. No deployment or external integrations were tested.

This checklist records Phase 1 behavior only. Database, auth, tenant isolation, private file access and durable business audit controls are planned and need Phase 2 evidence.

## Lead acknowledgement and approval

- [ ] Uchi Chinyama acknowledges scope, task ownership and review procedure.
- [ ] Uchi reviews baseline, technical decisions and security obligations as the current backend owner. Mumba is inactive.
- [ ] Taizya Nakapende acknowledges UX handover and placeholder approach.
- [ ] Lubasi Monde acknowledges discovery, evidence and operations handover requirements.
- [ ] Canonical repository access and board ownership agreed.
- [ ] Initial tenant/access model and Phase 2 stack decisions recorded, or explicitly left blocked with owners.
- [ ] Active Supabase development project has hosted connection, schema migration, grants and isolation verification completed.
- [ ] Uchi reviews the delivered evidence and records Phase 1 signoff.

| Lead | Decision / acknowledgement | Date | Evidence / remaining action |
| --- | --- | --- | --- |
| Uchi Chinyama | Pending | Pending | Scope and final review required |
| Backend owner: Uchi Chinyama | Pending | Pending | Technical evidence review required; Mumba inactive from 2026-10-14 |
| Taizya Nakapende | Pending | Pending | UX template acknowledgement required |
| Lubasi Monde | Pending | Pending | Discovery template acknowledgement required |

## Phase 2 readiness

- [ ] Uchi approves one infrastructure acceptance record and its permission/tenant boundaries.
- [ ] Uchi records stack/database/identity and tenant/access decisions.
- [ ] Required blockers have owners and the next approved work item is Ready.
- [ ] Relevant UX and operations handovers are accepted, or N/A is recorded with a reason for the infrastructure slice.

Phase 1 implementation delivery does not automatically close these review and Phase 2 readiness steps.
