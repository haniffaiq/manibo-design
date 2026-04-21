# T04: Add Modal Confirmation for Retry

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T04 - add modal confirmation for retry`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Currently the retry button calls the API directly on click. Add a Modal confirmation dialog before executing the retry. Retry is a recoverable action (it starts a new run, the failed run stays in history), so use the primary button variant — not destructive.

## Subtasks

- [ ] Add state for controlling Modal open/close (e.g., `retryTarget` storing the execution to retry)
- [ ] On retry button click: open Modal instead of calling API directly
- [ ] Modal title: `"Try again: {workflow label}"`
- [ ] Modal body: `"This will start a new run. The failed run stays in history."`
- [ ] Modal footer: [Cancel] button (closes modal) + [Start new run] button (primary variant, calls API)
- [ ] On successful retry: close modal + show success notice
- [ ] On error: close modal + show error notice

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Add Modal confirmation for retry action |

## Acceptance Criteria

- [ ] Retry button opens Modal instead of calling API directly
- [ ] Modal shows correct title with workflow label
- [ ] Modal body explains the action is non-destructive
- [ ] Cancel closes Modal without calling API
- [ ] "Start new run" calls the retry API
- [ ] Success notice shows after successful retry
- [ ] "Start new run" button uses primary variant (not destructive)
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
