# T04: Extract ActiveCallsTable Component

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T04 - extract ActiveCallsTable component`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Extract the active calls DataTable and its action buttons from the call-ops monolith page into a self-contained component. The component encapsulates column definitions and the 6 action buttons (Support, Listen, Join, Take over, Transfer now, Transcript) without owning any SSE or data-fetching logic.

## Subtasks

- [x] **Create component**: `apps/web/src/components/call-ops/active-calls-table.tsx`
- [x] **Move DataTable columns** from call-ops page into component
- [x] **Move action buttons** (Support, Listen, Join, Take over, Transfer now) into component
- [x] **Define props interface**: calls, onSupport, onListen, onJoin, onTakeOver, onTransfer, onTranscript, disabled
- [x] **Preserve data-testid attributes** on action buttons for E2E tests

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Create | ActiveCallsTable with columns and 6 action buttons |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Remove inline table code, import ActiveCallsTable |

## Acceptance Criteria

- [x] Component renders active calls with all 6 action buttons
- [x] "Take over" is always the primary-variant button (most prominent)
- [x] All other action buttons use outline variant
- [x] `data-testid` attributes preserved on all action buttons
- [x] Component receives data and callbacks via props (no internal data fetching)
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Take over" is always the most prominent button (primary variant)
