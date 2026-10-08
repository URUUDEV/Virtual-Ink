# Virtual Ink UX handover template

Owner: Taizya Nakapende. Copy into a flow-specific record. Use existing repository images only; use text placeholders or text wireframes when images are unavailable. Mark illustrative content and unknown rules clearly.

## Flow name

- Flow / task ID / phase / version / date:
- Product acceptance record / approved decision references:
- Designer / Uchi reviewer / receiving Mumba acknowledgement:
- Entry point / preconditions / success exit / cancel exit:
- In scope / exclusions / open questions:

## Target users

| User role | Goal | Tenant context | Permission and visibility limits |
| --- | --- | --- | --- |
| [Role] | [Goal] | [Scope] | [Limits] |

## Screen list

| Screen ID/name | Entry action | Main action | Next/previous screen | Design or text wireframe reference |
| --- | --- | --- | --- | --- |
| [Screen] | [Entry] | [Action] | [Navigation] | [Reference] |

Provide all steps, confirmations, cancellation and denied-access outcomes. Annotate role variations and relevant operations rules.

## Fields

| Screen / field | Label and help text | Input type | Required/default | Validation and error copy | Data source/classification | Read/write roles |
| --- | --- | --- | --- | --- | --- | --- |
| [Field] | [Copy] | [Type] | [Rule] | [Limits/copy] | [Source/private?] | [Roles] |

Record display units and formatting only from approved rules. UI validation complements server validation. A displayed price must come from the server in later quote work.

## Empty states

| Screen / condition | Message | Available action | Role restrictions |
| --- | --- | --- | --- |
| [No data/no results/first use] | [Copy] | [Next action] | [Limits] |

## Loading states

- Initial load / action progress indicators:
- Disabled actions and duplicate submission prevention:
- Timeout, retry and cancel behavior:
- Accessible status announcement and focus behavior:

## Error states

| Trigger | Message | Field/page placement | Recovery action | Data preserved | Permission-sensitive details hidden |
| --- | --- | --- | --- | --- | --- |
| [Invalid input/network/expired session/denied access] | [Copy] | [Placement] | [Recovery] | [Safe data] | [Details] |

Include unavailable/removed resources, wrong tenant, wrong role and private file failures if applicable. Avoid revealing whether another tenant's resource exists.

## Accessibility notes

- Semantic headings, labels and accessible names:
- Keyboard order, visible focus, modal focus and exit behavior:
- Contrast and information conveyed beyond color:
- Screen reader announcements for loading, errors and confirmation:
- Text scaling, reduced motion and touch target considerations:
- Agreed accessibility target / evidence / unresolved decisions:

## Mobile notes

- Viewport assumptions and responsive layout:
- Navigation, long labels and content overflow:
- Input keyboards, touch actions and upload/preview behavior if applicable:
- Slow connection, interruption and safe recovery:
- No real customer files in prototype examples:

## Handoff notes for Mumba

- Design artifact link/version or text wireframes:
- Screen-to-acceptance criterion mapping:
- API/data needs and allowed server-side state transitions:
- Field validation, permission matrix and tenant visibility:
- Operational facts / decision IDs / unresolved assumptions:
- Existing assets or explicit text placeholder references:
- Required tests and UX evidence:
- Technical questions, owner and next action:
- Uchi review decision/date/evidence:
- Mumba receiving acknowledgement/date/questions:

Do not mark this handover approved until the recorded reviews are supplied.
