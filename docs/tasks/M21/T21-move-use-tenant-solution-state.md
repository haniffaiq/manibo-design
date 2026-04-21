# T21: Move useTenantSolutionState to Props Pattern

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T21 - move useTenantSolutionState to props pattern`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Solutions import `@/lib/solutions` via tsconfig paths for `useTenantSolutionState()`. This pulls in the entire solutions.ts file which imports `@/solutions/registry` — creating a circular path that breaks standalone typecheck.

Fix: Solution pages receive `solutionState` as a prop from the generated route wrapper, instead of calling the hook internally. The generated wrapper calls the hook and passes the result. This eliminates the circular import path without moving hook internals to web-shared.

## Subtasks

- [x] **Update generated route wrappers** — call `useTenantSolutionState()` in the wrapper and pass solutionState as a prop to the solution page component
- [x] **Update appointment-booking page components** — accept solutionState as a prop, remove internal `useTenantSolutionState()` calls
- [x] **Update driver-verification page components** — accept solutionState as a prop, remove internal `useTenantSolutionState()` calls
- [x] **Verify no solution package imports `@/lib/solutions`** — grep all solution packages, confirm zero imports

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/solutions/route-wrapper.tsx` (or equivalent generated wrapper) | Modify | Call useTenantSolutionState(), pass as prop to page component |
| `solutions/appointment_booking/ui/src/bookings-page.tsx` | Modify | Accept solutionState as prop, remove useTenantSolutionState() call |
| `solutions/driver_verification/ui/src/drivers-page.tsx` | Modify | Accept solutionState as prop, remove useTenantSolutionState() call |

## Acceptance Criteria

- [x] Solution packages don't import `@/lib/solutions`
- [x] Solution page components receive solutionState as a prop
- [x] Generated route wrappers call useTenantSolutionState() and pass it down
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C solutions/appointment_booking/ui check-types` passes
- [x] `pnpm -C solutions/driver_verification/ui check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Break circular import path between solutions and @/lib/solutions registry"
