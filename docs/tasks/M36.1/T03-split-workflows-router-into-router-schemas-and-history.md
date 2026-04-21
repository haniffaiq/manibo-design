# T03: Split workflows router into router, schemas, and history

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Description

Refactor `apps/api/src/platform_api/routes/workflows/router.py` into a thin
route module plus package-local schema and history helpers. `workflows` is not
"too many files"; it is one mixed-responsibility route file that still carries
schemas, normalization, and Temporal history parsing in one place.

## Subtasks

- [ ] **Move inline models**: extract workflow request/response models into
      `apps/api/src/platform_api/routes/workflows/schemas.py`.
- [ ] **Move history parsing**: extract Temporal history decoding, step parsing,
      and normalization helpers into
      `apps/api/src/platform_api/routes/workflows/history.py`.
- [ ] **Keep the router thin**: leave route registration and permission checks
      in `router.py`, targeting less than 500 LOC.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/workflows/router.py` | Modify | Keep only route wiring and minimal request validation helpers. |
| `apps/api/src/platform_api/routes/workflows/schemas.py` | Create | Own workflow route schemas and response models. |
| `apps/api/src/platform_api/routes/workflows/history.py` | Create | Own Temporal history decoding and workflow-step parsing. |
| `apps/api/tests/...` | Modify | Update tests that import moved workflow helpers or schemas. |

## Implementation Notes

- `_require_operator_or_admin(...)` may stay in `router.py` if it remains tiny;
  the real target is the schema and history cluster.
- Preserve the public route factory `create_workflows_router`.
- Do not change Temporal query behavior or tenant visibility filtering logic.

## Acceptance Criteria

- [ ] `workflows/router.py` is below 500 LOC.
- [ ] No `BaseModel` classes remain defined in `workflows/router.py`.
- [ ] Focused workflow route tests stay green with no API drift.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on: [T01-define-and-enforce-platform-api-route-package-contract.md](T01-define-and-enforce-platform-api-route-package-contract.md)
