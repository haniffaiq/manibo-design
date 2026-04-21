# T04: Extract call-ops dependencies and presenters and delete duplicate helpers

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02

---

## Description

Create package-local shared owners for the repeated call-ops concerns that keep
showing up in `calls_live.py`, `calls_history.py`, `calls_observability.py`,
and `browser_voice.py`: auth/access dependencies, request-state plumbing,
presenters, and shared route models. The point is to delete duplication before
the larger route-file splits happen.

## Subtasks

- [ ] **Extract auth/access dependencies**: move repeated
      `_require_operator_or_admin(...)` and related request-state helpers into
      `apps/api/src/platform_api/routes/call_ops/dependencies.py`.
- [ ] **Extract presenters/shared models**: move genuinely reused response or
      event shapes into `schemas.py` or `presenters.py` instead of keeping
      private copies in each route file.
- [ ] **Delete duplicates**: remove the duplicated private helpers from the
      route files once the shared package-local seams exist.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/call_ops/dependencies.py` | Create | Package-local auth, tenant, and request-state helpers. |
| `apps/api/src/platform_api/routes/call_ops/presenters.py` | Create | Shared response shaping helpers and presenters. |
| `apps/api/src/platform_api/routes/call_ops/schemas.py` | Create | Shared route models that are genuinely reused in call ops. |
| `apps/api/src/platform_api/routes/call_ops/calls_live.py` | Modify | Replace duplicated helpers with package-local imports. |
| `apps/api/src/platform_api/routes/call_ops/calls_history.py` | Modify | Replace duplicated helpers with package-local imports. |
| `apps/api/src/platform_api/routes/call_ops/calls_observability.py` | Modify | Replace duplicated helpers with package-local imports. |

## Implementation Notes

- Keep this package-local. Do not create a new cross-package route-helper layer.
- Only extract a schema or presenter if at least two call-ops modules genuinely
  use it.
- This task is about deleting duplication, not moving every helper just because
  it exists.

## Acceptance Criteria

- [ ] Repeated call-ops auth/access helpers are reduced to one package-local
      owner.
- [ ] Shared presenters or models that are still duplicated after M36 are moved
      out of the route files.
- [ ] Focused call-ops tests remain green after the dedupe.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on: [T02-evict-root-level-route-support-modules-into-package-local-owners.md](T02-evict-root-level-route-support-modules-into-package-local-owners.md)
