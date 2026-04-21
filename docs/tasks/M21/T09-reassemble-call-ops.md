# T09: Reassemble Call-Ops from Extracted Components

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T04, T05, T06, T07, T08

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T09 - reassemble call-ops from extracted components`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Rewrite the call-ops page as a thin composition shell that imports and wires together all extracted components: ActiveCallsTable, SlowdownSummary, LiveTranscript, SupportDrawer, and EscalationModal. The page owns state management and data fetching but delegates all rendering to the extracted components. Target: under 200 lines.

## Subtasks

- [x] **Rewrite call-ops page** as composition shell using PageFrame + extracted components
- [x] **Wire state** — page owns call list state, selected call, escalation draft, support drawer open state
- [x] **Wire callbacks** — connect component event handlers to page-level actions
- [x] **Remove all inline component code** — only imports and composition remain
- [x] **Verify under 200 lines** — count lines in final page.tsx
- [x] **Run E2E tests** — all call-ops E2E tests must pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Rewrite as composition shell under 200 lines |

## Acceptance Criteria

- [x] `call-ops/page.tsx` is under 200 lines
- [x] Page imports and composes: ActiveCallsTable, SlowdownSummary, LiveTranscript, SupportDrawer, EscalationModal
- [x] All call-ops E2E tests pass with same behavior
- [x] No inline rendering logic — all UI delegated to extracted components
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Depends on: T04 (ActiveCallsTable), T05 (SlowdownSummary), T06 (LiveTranscript), T07 (SupportDrawer), T08 (EscalationModal)
