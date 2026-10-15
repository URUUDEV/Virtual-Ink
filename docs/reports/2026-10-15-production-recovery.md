# Virtual Ink — Production startup and image recovery

Date: 15 October 2026. Owner: Uchi, backend and product lead. Mumba is inactive.
Status: public startup/image recovery verified on Vercel; Phase 1 and all later phases remain incomplete.

## Changes and reproduced failures

The earlier deployment returned HTTP 500 for dynamic pages and APIs because its
instrumentation guard rejected public configuration. The unused Production
NEXT_PUBLIC_SUPABASE_ANON_KEY entry was renamed to SUPABASE_LEGACY_ANON_KEY_UNUSED.
Its hidden value was left untouched; the name and Production scope were verified
after saving. No key value was revealed, copied, rotated or revoked. This reversible
change removes the legacy key from Next.js public-variable handling. The application
does not use the renamed variable; the startup guard remains intact.

The tested source was fast-forwarded to main and pushed. Production build 0d3830c
became Ready, then all thirteen page/health/guest checks passed. The first check
overlapped rollout and still saw the old failures; it was not counted as a pass.

Mobile visual QA then exposed broken branding/product images. The rendered
/_next/image URLs returned 404, while the original supplied static image URLs
returned 200. All seven rendered unique image URLs failed the expanded check.
The four supplied-image call sites now use Next Image's direct-delivery option.
The approved logo and six existing WebP files are unchanged. No global optimizer
disable, remote-image loader, arbitrary proxy or new image asset was introduced.

Tradeoff: responsive optimizer transformations are unavailable for these assets.
The original PNG logo is approximately 1.1 MB, and the existing product WebPs are
143–253 KB each. Performance/asset optimization needs separate review while
preserving the approved branding. Do not reuse this approach for future private
customer uploads without their own storage/access policy.

## Actual verification

| Check | Result |
| --- | --- |
| Root tests and coverage | 167 passed; all 32 scoped files measured |
| Backend/shared coverage | Lines 1,421/1,435 = 99.02%; branches 880/925 = 95.14%; functions 136/139 = 97.84% |
| Security tests | 156 passed |
| React/3D and SDK/Next Auth integration | Nine plus nine passed; provider responses are synthetic |
| TypeScript and production build | Both type checks and Next.js 16.4.0 webpack build passed after the image fix |
| Preview rendering | Eight/eight shop image instances loaded; desktop width 1135; no horizontal overflow |
| Preview mobile | 390x844 override, 375px client content; logo/images visible; no overflow; menu/Escape/focus return passed |
| Preview error console | No error entries captured in the sampled shop/menu check |
| Production smoke after startup recovery | Thirteen/thirteen passed on source 0d3830c after Ready |
| Image-fix Production verification | Twenty/twenty page, rendered-image, health and guest checks passed on Ready source 5c55364 at 08:25 UTC |
| Production rendering | Eight/eight shop image instances loaded at client width 1135; no horizontal overflow; sampled error console empty |
| Deployed script heuristic | Five Production pages, 14 observed script assets, 740,329 bytes; zero matching secret patterns on source 5c55364 |

The bundle heuristic covers observed public script assets only, not source maps,
history, arbitrary secrets or provider configuration. It printed rule IDs/counts,
never matched values. Production mobile emulation did not apply reliably, so the
fresh mobile/menu result is Preview-only; full Production mobile acceptance remains
pending. Known local module-type, Three.js CommonJS deprecation and malformed-cookie
negative-test warnings remain; they are not presented as browser errors.

The coverage percentage is backend/shared unit coverage. Frontend coverage,
standalone process lifecycle, SQL, genuine hosted Auth/database/storage and whole
product completeness remain separate. No phase has reached full 95% testing.

## GitHub and Vercel record

Repository: https://github.com/URUUDEV/Virtual-Ink

Image source: 5c55364e0f9dcfc10094ebd99d3054cb8f033bef, pushed to the review branch
codex/phase-1-verification, verified in Preview, then fast-forwarded to main.
No force push, unrelated-file staging or simulated human acceptance was used.
The existing next-env.d.ts development-path change remains unstaged and preserved.

Preview: https://virtual-fz5akalkc-shadowrootsec-5679.vercel.app

Preview deployment: 57VJoyCk6NPAfJUGtkrE8TByekKz, source 5c55364, Ready before
rollout. Vercel protection remains enabled; no bypass token/cookie extraction.
Production alias: https://virtual-ink.vercel.app

Production deployment: mtAcHg4D1fJ8teAhBRZvuhUy3M63, source 5c55364, Ready.
Immutable URL: https://virtual-3tvqeswhk-shadowrootsec-5679.vercel.app

Both main and the review branch returned the exact source commit above from
git ls-remote. The final report/documentation follow-up commit is separate from
this tested application build. The expanded twenty-request check verifies public
pages, their seven unique rendered images, GET/HEAD health, guest API denial,
the protected-account login redirect and safe unknown-API 404. It exercises no
genuine authenticated customer/vendor/operator workflow.

## Security review and remaining gates

Configuration failure prerequisite: a deployment contains a public-prefixed legacy
key value rejected by the existing conservative guard. Impact reproduced: dynamic
route startup failure. Renaming only the unused entry and rebuilding recovered
ordinary routes; no exposure of a privileged key was established. Any genuine
credential rotation requires private owner review if exposure is found later.

Image failure prerequisite: the services deployment receives the generated
optimizer route. Impact reproduced: 404 and broken public images. Serving the same
allowlisted public assets directly repairs delivery without opening private files
or external network destinations. The smoke tool now inspects bounded HTML and
checks each rendered same-origin image instead of treating a page HTTP 200 as
proof its assets work.

No app Auth, database login, storage, payment, vendor privilege or customer record
was enabled/created. The safe local setup checker remains Blocked for API/provisioning
configuration, enablement, CAs, distinct restricted logins and genuine smoke setup;
it performed no database check and reported no secret values. The approved synthetic
mailbox question remains pending. Runtime/advisory review, including the announced
21 October Node high-severity release, remains open before sensitive enablement.

Hosting gates: VH-01, VH-02 and VH-17 have project/build/URL evidence. VH-10/11 have
narrow health/guest evidence, not complete role/tenant workflows.
VH-04 still lacks complete private application configuration. VH-06/07/08/09 remain
blocked/unbuilt. VH-05/12/13/14 are sampled checks with the limits above; VH-03 full
Preview integration, VH-15 complete build-log review and VH-16 custom-domain setup
remain pending. No gate is waived to close a phase.

## Next actions

- Uchi: review the verified public recovery, then privately configure reviewed
  restricted accounts/CAs and approve a synthetic mailbox for genuine registration,
  confirmation, login, mapping and logout tests. Resolve file/order rules before
  the persistent Phase 1 journey. Commit/push each completed phase as requested.
- Mumba: inactive; no current work or acceptance dependency.
- Taizya: review the fixed deployed branding/mobile/catalogue and finish complete
  accessibility/order-flow acceptance. Sampled automation is not human signoff.
- Lubasi: verify print options, file handling/retention, quote rules and manual
  payment/delivery responsibilities before enabling operational workflows.

## Document checks

Matching Word uses the established generator. Structural, privacy/link and
repository checks passed: 173 local links, report evidence/privacy and OOXML/table
geometry checks; the repository heuristic scanned 230 files, skipped 45 and found
zero matching patterns. The renderer was attempted and could not find LibreOffice;
visual pagination QA cannot be claimed. The earlier verification report is preserved.
