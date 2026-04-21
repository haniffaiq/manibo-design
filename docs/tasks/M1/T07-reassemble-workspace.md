# T07: Reassemble Workspace from Extracted Components

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04, T05, T06

---

## Description

Rewrite `observability-workspace.tsx` as a thin composition shell that imports and wires together all extracted components. The file should contain only state management (SWR hooks), URL param handling, and component composition.

## Subtasks

- [x] **Remove all inline JSX** that was extracted to components
- [x] **Keep state management**: SWR hooks for runs/detail/timeline/compare, URL param state
- [x] **Wire component props**: pass data and callbacks to extracted components
- [x] **Verify file size**: target < 300 lines
- [x] **Use direct imports** from each component file (no barrel export per react-best-practices.md)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability-workspace.tsx` | Modify | Thin composition shell importing directly from component files |

## Acceptance Criteria

- [x] `observability-workspace.tsx` is under 300 lines
- [x] All state management stays in the workspace (not pushed into child components)
- [x] No circular imports
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C apps/web lint` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
