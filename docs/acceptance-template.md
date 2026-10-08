# Virtual Ink product acceptance template

Copy this template into a task-specific record. Owner: Uchi Chinyama. Use `Unknown — question ID` for unconfirmed rules and `N/A — reason` for inapplicable sections. Do not treat placeholders as approved requirements.

## Feature name

- Feature / task ID / phase:
- Product owner / implementer / reviewer:
- Status / priority / version / date:
- Related decisions and handover links:
- In scope / excluded work:

## User roles affected

| Role | Action needed | Tenant context | Restrictions |
| --- | --- | --- | --- |
| [Role] | [Action] | [Scope] | [Limits] |

## Goal

Describe the user problem, expected outcome and how completion will be assessed.

## User story

As a [user role], I want [action], so that [outcome]. Entry conditions: [conditions]. Exit outcome: [result].

## Data needed

| Field/entity | Source | Required? | Validation | Classification | Retention/deletion | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| [Field] | [Verified source] | [Yes/no] | [Rules] | [Public/internal/private] | [Decision reference] | [Owner] |

Record unresolved data rules and evidence sources. Attach no customer files, credentials or sensitive vendor details to this record.

## Permissions needed

| Action | Allowed role | Required membership | Allowed tenant/resource scope | Denied behavior | Audit event |
| --- | --- | --- | --- | --- | --- |
| [Action] | [Role] | [Condition] | [Boundary] | [Response/UX] | [Event or N/A] |

Specify unauthenticated, wrong-role, inactive-membership and cross-tenant behavior. UI visibility is not authorization. The server must enforce access. For health-only infrastructure, document public access and why tenant access is N/A.

## Happy path

1. Preconditions and user entry point:
2. User action and validation:
3. Server action and authorized data change:
4. Result, confirmation and next step:

## Error states

| Trigger | User-visible behavior | Data effect | Recovery | Safe technical evidence |
| --- | --- | --- | --- | --- |
| [Validation/network/permission/duplicate/empty result] | [Copy/state] | [No change/rollback] | [Next action] | [Request/event reference] |

## Acceptance criteria

Use observable Given/When/Then statements. Include boundary and denial behavior where relevant.

| ID | Given | When | Then | Required evidence |
| --- | --- | --- | --- | --- |
| AC-01 | [Precondition] | [Action] | [Observable result] | [Evidence] |
| AC-02 | [Permission/tenant boundary] | [Denied action] | [No disclosure or change] | [Negative test evidence] |

## Test cases

| Test ID | Criterion | Setup/role/tenant | Input or action | Expected result | Actual result/evidence |
| --- | --- | --- | --- | --- | --- |
| TC-01 | AC-01 | [Synthetic data] | [Action] | [Expected] | [Pending] |

Include success, invalid data, unauthenticated access, wrong role, cross-tenant access, sensitive log/file exposure and retry behavior as applicable. Mark N/A with a reason. Do not use real personal or payment data in tests.

## Evidence required for Uchi signoff

- Work item and implementation/design references:
- Criterion-by-criterion results:
- Automated test command, date and result:
- UX review and operations confirmation where relevant:
- Permissions and tenant isolation evidence where relevant:
- Setup, migration and rollback instructions where relevant:
- Known limitations, defects and open decision IDs:
- Receiving lead acknowledgement:

| Reviewer | Decision (accepted/changes requested/blocked) | Date | Evidence reference | Follow-up owner |
| --- | --- | --- | --- | --- |
| Uchi Chinyama | Pending | Pending | Pending | [Owner] |

Product signoff is recorded only after Uchi reviews the evidence. Changes to accepted scope require an updated record.
