# T02: Extract CaseQueue Component

> **Milestone**: M1-obs-ui-redesign
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Extract the case queue (filter panel, presets, run list, facet badges) from the left column of the Workspace component into a standalone `CaseQueue` component.

## Subtasks

- [x] **Extract CaseQueue**: filter bar, preset buttons, search input, advanced filters, run card list
- [x] **Define props contract**: `scope`, `runs`, `facets`, `selection`, `searchParams`, callbacks for filter/select/preset
- [x] **Preserve data-testid attributes**: `observability-run-*`, `observability-applied-filters`, `observability-subject-coverage`, `observability-start-date`, `observability-end-date`, `observability-include-non-production`, `observability-compare-select`
- [x] **Keep URL param management**: filter state stays URL-driven via searchParams

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/case-queue.tsx` | Create | Queue panel with filters, presets, and run list |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline queue JSX with `<CaseQueue />` |

## Acceptance Criteria

- [x] CaseQueue renders identically to the current left panel
- [x] All queue-related data-testid attributes preserved
- [x] Filter/preset/search interactions work the same way
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Source: `apps/web/src/components/observability-workspace.tsx` lines 1163-1530
