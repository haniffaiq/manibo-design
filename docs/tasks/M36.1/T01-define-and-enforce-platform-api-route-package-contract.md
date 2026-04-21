# T01: Define and enforce the platform API route package contract

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Define the route-layer contract that M36.1 will enforce. This task turns the
phase-2 cleanup from "split some big files" into a measurable rule set:
what may live at route root, which support-module names are allowed, which
temporary shims remain allowed, and how the architecture tests will fail if
future agents reintroduce flat route sprawl. It also proves the current import
surface so later shim deletions are based on caller evidence instead of guesswork.

## Subtasks

- [ ] **Define the allowlist**: document which files are allowed at route root
      and which names are allowed for package-local support modules.
- [ ] **Classify current root files**: mark each current root entry as domain
      package, approved aggregator, temporary shim, or support-module debt.
- [ ] **Inventory live imports**: search both grouped imports and flat shim
      imports such as `platform_api.routes.calls_live`,
      `platform_api.routes.browser_voice`, and `platform_api.routes.tenants`
      so later deletions do not break callers that still depend on the old
      surface.
- [ ] **Wire the guard**: add or update architecture tests so route-root support
      modules and banned names fail mechanically instead of relying on review.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_platform_api_route_topology.py` | Modify | Encode the route-root allowlist and temporary shim list. |
| `tests/architecture/test_platform_api_route_contract.py` | Create | Fail when banned support-module patterns appear in the route layer. |
| `tests/architecture/test_platform_api_route_import_surface.py` | Create | Fail when the documented shim/import surface drifts from the inventory. |
| `AGENTS.md` | Modify | Add the global platform API route contract for future agents. |
| `apps/api/AGENTS.md` | Modify | Add app-local route contract guidance where route work happens. |
| `docs/tasks/M36.1/PROGRESS.md` | Modify | Record the contract and the classified route-root surface. |

## Implementation Notes

- The contract is intentionally stricter than M36: route root is not a support
  code directory.
- Searching only grouped package imports is insufficient. This task must prove
  which flat shim imports still exist before later tasks can delete them.
- This task defines the rules; deletion and caller-proof work happen in later
  tasks once the guard exists.
- Keep the allowed root exceptions explicit. Hidden exceptions are how entropy
  regrows.

## Acceptance Criteria

- [ ] The repo contains a documented and mechanically enforced route contract.
- [ ] Route-root files are classified into approved owners vs debt to remove.
- [ ] The current flat-shim import surface is inventoried and classified into
      keep-for-now vs safe-to-delete candidates.
- [ ] `AGENTS.md` and `apps/api/AGENTS.md` reflect the same contract as the
      architecture tests.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Related: `wiki/queries/2026-04-12-design-platform-api-route-entropy-phase2.md`
