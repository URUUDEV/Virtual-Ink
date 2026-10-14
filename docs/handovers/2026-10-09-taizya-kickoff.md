# Taizya Nakapende
## UX and visual design kickoff | Virtual Ink

UX and Visual Design Lead - Shadow Root Security Technologies - 9 October 2026

**Start here:** review the existing branded shell, then draft a secure workspace-selection flow using the delivered membership API. Give Uchi and Mumba explicit screen states before more marketplace UI is added.

### What exists and what remains open

The source shell includes homepage, navigation/footer, reusable button links, category search/filter, health status, loading/error/not-found pages and explanatory destination pages. Frontend TypeScript passes. The latest production build failed with spawn EPERM; browser/mobile behavior has not been verified.

Public source routes: /, /shop, /design-services, /business, /how-it-works and /roadmap. /shop is a category preview, not a working vendor catalogue. Account, cart/checkout, dashboards and customizer are not implemented. Workspace selection is a proposed next UX flow, not an existing account screen.

### Keep the approved brand

Use asssets/Virtual Ink Gradient Logo.png unchanged. Preserve the supplied folder spelling. The other supplied boards are concept references; shown prices/vendor claims are not verified business facts. Do not replace the logo or invent product/vendor imagery.

| Token | Approved value |
| --- | --- |
| Charcoal / white | #0B0F17 / #FFFFFF |
| Cyan / purple / magenta | #00C2FF / #7A3BFF / #FF2D8B |
| Surface / primary text | #F6F8FC / #111827 |
| Secondary text | #64748B |
| Typography | Poppins: regular, semibold and bold |

Use charcoal navigation, spacious white content and restrained accent gradients. Check contrast for each actual foreground/background pair; a brand color is not automatically accessible.

### Read and inspect first

Read docs/source-document-baseline.md, docs/ux-handover-template.md and docs/acceptance-phase-2-membership-read.md. Inspect apps/web/src/app/globals.css, components/brand-logo.tsx, site-header.tsx, category-explorer.tsx and ui/button-link.tsx. Review the latest membership report and Security Architecture sections 4, 5 and 9.

<!-- pagebreak -->

## First review and flow draft

### 1. Open the existing preview

Ask Mumba to confirm the latest checkout and resolve any environment blocker. With the existing frontend dependencies installed, use:

```powershell
npm run typecheck:web
npm run build:web
npm run dev:web
```

Preview address: http://127.0.0.1:3001. The backend health address on port 3000 is not the marketplace website. A prior build failure is recorded; log your actual preview/build result. If preview cannot run, continue annotated text wireframes and source review, marking browser findings as pending.

### 2. Review the shell

- Proposed review widths: 360, 390, 768 and 1440 pixels. These are review targets, not completed results.
- Check navigation, mobile menu, search/filter/reset, FAQ, health loading/failure and all visible links; verify no horizontal overflow or misleading inactive action.
- Check heading order, labels, keyboard order, visible focus, contrast, readable text, 200% zoom, touch controls, reduced motion and screen-reader status announcements.
- Log each issue with screen, viewport, reproduction steps, expected result and evidence. Keep demo labels visible; never show successful payment/order claims for mock behavior.

### 3. Draft workspace selection

The delivered GET /api/v1/memberships returns only tenantId and role for active own vendor memberships, with bounded cursor pagination. It has no vendor display name, logo, verification badge or earnings data. Request an authorized label contract from Mumba/Uchi; a text wireframe can use a neutral workspace label with a short reference. Do not invent a vendor name or approval badge.

Define entry, loading, list, next-page loading, selection, empty, expired-session, denied/unavailable and retry states. Selecting a workspace must trigger server authorization for that scope before any future vendor work. Client role or tenant selection cannot grant permission.

**Limit:** no account/login/workspace UI or invite/suspend API exists yet. Design these states as proposals; do not link customer navigation to unbuilt private screens.

<!-- pagebreak -->

## State checklist and handoff

| Condition | Design requirement |
| --- | --- |
| Loading | Announced status; stable layout; prevent repeat actions |
| Empty / no memberships | Explain no workspace is available; no auto-created vendor |
| 401 / expired session | Clear sign-in recovery; hide stale private data |
| 403 / inactive identity | Safe access message; no role-escalation control |
| Tenant 404 | Neutral unavailable message; conceal another vendor's existence |
| 503 / network failure | Honest unavailable state; safe retry; no fake success |
| Stale cursor 400 | Reset pagination safely; preserve authorized context |
| Delivery / unassigned operator | No vendor workspaces, files, proofs or payment details |

Mixed DeliveryPartner/vendor access is currently denied, pending product review. Follow the current server contract.

### Your first deliverable

Use docs/ux-handover-template.md: screen IDs, roles, entry/exit, fields, validation, states, accessibility/mobile notes and acceptance mapping. Text wireframes are acceptable. Record terminology and label decisions.

Give Uchi the scope, flow and decisions; give Mumba components, API fields, state copy, focus/retry rules and responsive evidence. Lubasi confirms support procedures; do not invent support hours.

### Review order

Uchi records the product decision; Mumba confirms API fields and permissions; Taizya reviews the implemented states. Report each completed slice and label untested checks pending.

### Copy-ready next prompt

```text
Continue Virtual Ink as UX Lead. Read the source baseline, UX template
and membership contract. Preserve the approved logo, Poppins and palette.
Review the shell; record actual findings and blockers. Draft workspace
selection with loading, empty, pagination, expiry, denial and retry states.
Use authorized API fields and neutral placeholders. Hand Uchi and Mumba
screen/state, accessibility and mobile notes. Keep unbuilt UI as future work.
```

**Next gate:** an accepted UX handover and backend readiness precede a connected private UI. There is no inferred design or product signoff.
