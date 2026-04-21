# T03: Extract use-sse-stream Hook from Call-Ops

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T03 - extract use-sse-stream hook from call-ops`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Create a reusable SSE connection hook that encapsulates the SSE streaming logic in call-ops. Call-ops has two SSE streams (transcript stream + ops/events stream) and a support drawer that also streams both. Call-history does NOT use SSE — it loads saved data via `getCallDetail`, `getCallEvents`, `getCallTrace`, `getCallLatency`. This hook is for call-ops only.

## Subtasks

- [x] **Create hook**: `apps/web/src/hooks/use-sse-stream.ts` with generic typed message parsing
- [x] **AbortController cleanup** on unmount and URL change
- [x] **Reconnect with exponential backoff** on connection loss (max 3 retries, 1s/2s/4s)
- [x] **Extract SSE logic from call-ops** — replace inline fetch SSE code with hook usage (transcript stream + ops/events stream + support drawer streams)
- [x] **Verify**: call-ops still streams transcript and events correctly
- [x] **Note**: call-history does NOT use SSE — do not add streaming to it

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-sse-stream.ts` | Create | Reusable SSE connection hook with AbortController, reconnect, typed parsing |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Replace inline SSE logic with use-sse-stream hook |

## Acceptance Criteria

- [x] `use-sse-stream` hook handles connect/disconnect/reconnect lifecycle
- [x] AbortController cleanup fires on unmount and URL change
- [x] Reconnect uses exponential backoff (max 3 retries)
- [x] Hook is used by call-ops page (transcript + ops streams + support drawer)
- [x] No inline SSE connection logic remains in call-ops page file
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
