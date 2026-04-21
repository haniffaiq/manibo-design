# T12: Refine Observability Layout and Right-Rail Detail

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T12 - refine observability layout and right-rail detail`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

The admin observability workspace already uses `PageFrame width="full"`, a desktop queue/detail grid, and a placeholder when nothing is selected (`observability-workspace.tsx`). This task refines the existing layout — it does NOT rebuild it from scratch.

## What already exists (do not reimplement)

- `AdminObservabilityWorkspace` renders `PageFrame width="full"` (~line 1183)
- Desktop queue/detail two-column grid (~line 1234)
- Placeholder when no case is selected (~line 1680)
- Mobile single-column fallback

## Subtasks

- [x] **Verify** the right-rail section order matches the case-file structure: Case record → "What to do next" → Integrity gaps → Related records → Evidence rail
- [x] **Add sticky positioning** to detail column if not already present (`sticky top-8`)
- [x] **Ensure** the detail column has clear section headings for each block
- [x] **Verify** mobile stacking works correctly after T11 tab additions

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability-workspace.tsx` | Modify | Refine existing right-rail section order and sticky behavior |

## Acceptance Criteria

- [x] Right-rail sections appear in case-file order when a case is selected
- [x] Detail column is sticky on desktop
- [x] Section headings are clear and consistent
- [x] No regression on existing observability E2E tests
- [x] Mobile fallback still works after T11 changes

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Prior art: current `observability-workspace.tsx` already ships full-width + two-column layout
