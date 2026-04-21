# T11: Extract Shared use-call-detail Hook

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T11 - extract shared use-call-detail hook`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Create a shared hook that loads latency metrics, trace data, and events for a specific call. This hook is currently duplicated between the call-ops support drawer and the call-history detail view. Extracting it eliminates duplication and ensures consistent data loading behavior across both views.

## Subtasks

- [x] **Create hook**: `apps/web/src/hooks/use-call-detail.ts`
- [x] **Implement data loading** — fetches latency, trace, and events for a given callId
- [x] **Return interface**: `{latency, trace, events, loading, error}`
- [x] **Handle null callId** — returns empty/idle state when callId is null
- [x] **Integrate with call-ops** — support drawer uses hook instead of inline fetch logic
- [x] **Verify**: hook returns correct data shape

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-call-detail.ts` | Create | Shared hook for loading call latency, trace, and events |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Use use-call-detail in support drawer instead of inline fetch |

## Acceptance Criteria

- [x] Hook returns `{latency, trace, events, loading, error}`
- [x] Handles null callId gracefully (idle state, no fetch)
- [x] Shared between call-ops support drawer and call-history detail
- [x] No duplicated fetch logic for call detail data
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Depends on: T03 (use-sse-stream hook may be used for streaming events)
