# T12: Refactor Call-History to Use Shared Hooks

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T12 - refactor call-history to use shared hooks`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Refactor the call-history page to use the shared `use-call-detail` hook for loading latency, trace, and events. Call-history does NOT use SSE — it loads saved data via `getCallDetail`, `getCallEvents`, `getCallTrace`, and `getCallLatency`. This task only consolidates the data-loading pattern, not streaming.

## Subtasks

- [x] **Replace inline trace/latency/events loading** with `use-call-detail` hook
- [x] **Remove duplicated data-fetching code** — delete inline `getCallLatency`, `getCallTrace`, `getCallEvents` calls
- [x] **Verify behavior** — call-history detail view works identically with shared hook
- [x] **Run E2E tests** — all call-history E2E tests pass

Note: do NOT add SSE streaming to call-history. It loads saved data, not live streams. The `use-sse-stream` hook is for call-ops only.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Use use-call-detail hook for data loading |

## Acceptance Criteria

- [x] Call-history uses `use-call-detail` hook for latency/trace/events loading
- [x] No duplicated data-fetching logic remains in call-history page
- [x] No SSE streaming code added to call-history (it doesn't use SSE)
- [x] All call-history E2E tests pass
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Depends on: T11 (use-call-detail hook)
