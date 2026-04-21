# T02: Connector Field Mapping API

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens connector-governance scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T02 - add connector field mapping api`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: add the API contract for connector-level provider mapping only if a new checklist row or real regression explicitly reopens broader connector-governance scope. This is not part of the current M14 backlog.

## Subtasks

- [ ] Define the field-mapping shape stored in connector config
- [ ] Validate field mappings against connector config schema instead of accepting random JSON junk
- [ ] Expose create/update/read API support for field mappings through the connectors route
- [ ] Add focused API and service tests for valid/invalid field mappings
- [ ] Regenerate/check API inventory and confirm the connectors API surface still matches its consumers

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/connectors/models.py` | Modify | Typed field-mapping shape if needed |
| `packages/platform-core/src/platform_core/connectors/service.py` | Modify | Mapping validation and schema enforcement |
| `apps/api/src/platform_api/routes/connectors.py` | Modify | API support for field mappings |
| `apps/api/tests/integration/test_connectors.py` | Modify | Field-mapping API coverage |
| `packages/platform-core/tests/unit/test_connectors/` | Modify/Create | Mapping validation tests |

## Implementation Notes

- Do not turn this into a general transformation engine.
- The connector mapping consumes canonical payload fields only. Workflow/source extraction mapping belongs elsewhere.
- Keep the first slice schema-first and boring.
- If this task touches any `src/` paths, the eventual PR must satisfy the OTLP evidence gate captured in `T09`; do not stop at tests/UI proof.

## Acceptance Criteria

- [ ] Connector config can persist validated provider field mappings
- [ ] Invalid field mappings are rejected through API/service validation
- [ ] The mapping boundary is explicit in code and tests
- [ ] API inventory is regenerated/checked and any changed consumer contract is explicitly accounted for

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
