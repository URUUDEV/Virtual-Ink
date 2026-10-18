# Virtual Ink phase completion checklist

Updated completion rule from Uchi, 14 October 2026. Applies to every phase,
including Phase 1 and Backend Phase 2, alongside existing security and human review.

**Do not mark any phase complete unless the feature works locally, passes testing,
and is successfully hosted on Vercel with the deployed URL provided in the
completion report.** All Vercel verification items below must be satisfied.

18 October Phase 1 supplement: [section 2.1 release gate](phase-1-release-gate.md)
is authoritative. Phase 1 is **INCOMPLETE** and release is **NO-GO** until its
import, physical-device, integration and release evidence passes. Historical
checkboxes below retain their dated scope; they do not certify the current
Phase 1. The Production-labelled ui_test exception is not qualifying Preview
or production-service evidence. Production promotion needs a documented go/no-go
decision, successful critical checks and explicit authorization first.

Delivered code, documents or a local build may be recorded for review while the
phase remains incomplete. Missing features or verification remain Pending or
Blocked; they cannot be marked passed or waived as N/A to close the phase.
The custom-domain item explicitly allows documented preparation instead of a
connected domain. Open high-risk security findings still block release.

## Local operation and testing

15 October instruction: commit/push each completed phase to GitHub and pursue at
least 95% measured test coverage, with exact scope and counts recorded. All
required executed tests must pass. See [testing target](testing-target.md); the
backend/shared coverage result cannot stand in for frontend, SQL, genuine hosted
integrations, full-product completeness or human acceptance.

- [ ] The application and phase features work locally using the documented setup.
- [ ] Relevant automated, integration, security and user-flow tests pass;
  commands, dates, actual results and limitations are recorded.
- [ ] Required lead reviews and Uchi's acceptance are recorded by the humans
  responsible; no signoff is inferred from technical checks.

## Vercel hosting verification

15 October status: project/repository/root and actual URLs are observed. The
[recovery record](reports/2026-10-15-production-recovery.md) supersedes the earlier
Production failures: source 5c55364 is Ready and twenty public/image/health/guest
checks pass. Preview was visually tested before rollout. No complete phase,
genuine private integration or authenticated role workflow is verified.

- [x] VH-01 — Project is connected to Vercel. Record project/repository and
  branch/root configuration references without access tokens.
- [x] VH-02 — Production deployment completes without build errors. Record
  deployment ID, commit, time and successful build evidence.
- [ ] VH-03 — Preview deployment works for testing before production. Record
  preview URL, tested commit and results before production promotion/deployment.
- [ ] VH-04 — Environment variables are configured correctly in Vercel for
  Preview and Production. Record names/scopes and verification, never values.
- [ ] VH-05 — No secrets are exposed in frontend code. Review source and the
  deployed frontend bundles/assets; keep secret/provisioning credentials server-side
  or outside web environments according to the existing boundaries.
- [ ] VH-06 — Database connection works from the deployed Vercel environment.
  Verify the application path with synthetic data and reviewed access controls;
  a local connection or liveness response is insufficient.
- [ ] VH-07 — File upload/storage flow works from the deployed site. Verify
  an approved synthetic file through upload and authorized retrieval, including
  private-access denial. An intentionally disabled flow remains a blocker.
- [ ] VH-08 — Auth/login works on the deployed URL. Record genuine sign-in,
  session and logout behavior using approved test identities without tokens.
- [ ] VH-09 — Customer, vendor and admin dashboards work on the deployed URL.
  Record each role's workflow and account/tenant isolation evidence separately.
- [ ] VH-10 — API routes/server functions work on Vercel. Exercise deployed
  success, validation, error and authorization behavior; record safe results.
- [ ] VH-11 — Protected routes remain protected after deployment. Verify guest,
  wrong-role and other-tenant denial at the server/API as well as the UI.
- [ ] VH-12 — Public pages load correctly. Check intended public routes and
  assets on the deployed URL, including expected missing-page behavior.
- [ ] VH-13 — Mobile responsive layout works on the deployed URL. Record
  tested viewport/device sizes, navigation, controls and overflow results.
  For Phase 1, include the section 2.1 physical-device/browser/network matrix;
  responsive emulation alone cannot pass this requirement.
- [ ] VH-14 — No major browser console errors occur on the deployed URL.
  Check public and authenticated flows; document remaining minor messages.
- [ ] VH-15 — Vercel build logs are clean or documented. Retain sanitized
  evidence and explain warnings; build errors cannot be waived as warnings.
- [ ] VH-16 — Custom domain is prepared, or documented if not yet connected.
  Record intended domain, ownership/DNS next action and current status.
- [x] VH-17 — Deployment URL is included in the completion report. Provide the
  actual production URL and the tested preview URL; placeholders are not evidence.

## Completion evidence record

Copy this record into the phase's dated completion report and acceptance record.
Use Pass, Pending, Failed or Blocked for each VH item, with evidence and an owner.
Only actual verified results can be marked Pass; every unmet item prevents closure.

```text
Phase / feature IDs:
Completion status: Incomplete until every required gate passes
Implementer / receiving lead / human reviewer:
Commit / release identifier:
Local setup, test commands, dates and actual results:
Vercel project / connected repository / production branch / app root:
Preview deployment URL / ID / commit / test date and results:
Production deployment URL / ID / commit / successful build date:
VH-01 through VH-17: result / evidence / date / verifier / blocker owner
Environment variable names and Preview/Production scopes (no values):
Frontend secret-exposure review and safe evidence reference:
Deployed database / upload-storage / Auth evidence:
Customer / vendor / admin workflow and isolation results:
Deployed API and protected-route denial results:
Public pages / mobile layouts / console checks:
Sanitized Vercel build-log evidence and warning explanations:
Custom-domain connection or preparation record:
Open defects and decisions / owner / next action:
Lead acknowledgements and Uchi's actual acceptance record:
```

Never include credentials, tokens, signed storage URLs, real customer files or
private vendor evidence. Record deployment URLs without access-bypass query strings.
Historical evidence remains dated; retest the deployed commit rather than treating
earlier local results as deployment verification. See [security review](security-review.md),
[acceptance template](acceptance-template.md) and [latest report](team-report.md).
