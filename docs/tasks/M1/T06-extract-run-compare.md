# T06: Extract RunCompare and ComparisonSection

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Description

Extract the comparison view (snapshots, context deltas, metric deltas, path changes) into a standalone component. This is already partially extracted (`ComparisonSection` and `ComparisonValueSet` exist inline).

## Subtasks

- [x] **Move ComparisonSection** to its own file
- [x] **Move ComparisonValueSet** alongside it
- [x] **Preserve data-testid**: `observability-compare-context`, `observability-compare-path`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/run-compare.tsx` | Create | Comparison view with snapshots and deltas |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Import ComparisonSection from new file |

## Acceptance Criteria

- [x] Comparison renders identically
- [x] Context deltas, metric deltas, and path changes display correctly
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 2089-2311
