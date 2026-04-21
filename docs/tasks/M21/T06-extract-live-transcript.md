# T06: Extract LiveTranscript Component

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T06 - extract LiveTranscript component`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Extract the live transcript display panel from the call-ops page into a standalone component. The component uses the new `use-sse-stream` hook (from T03) to stream transcript segments for the selected call. When no call is selected, it shows a "No call selected" placeholder.

## Subtasks

- [x] **Create component**: `apps/web/src/components/call-ops/live-transcript.tsx`
- [x] **Move transcript display** from call-ops page into component
- [x] **Use `use-sse-stream` hook** for SSE connection (replacing inline SSE logic)
- [x] **Show placeholder** when `callId` is null ("No call selected")
- [x] **Cleanup on unmount** — SSE connection closes via hook's AbortController

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/live-transcript.tsx` | Create | LiveTranscript with SSE streaming and placeholder state |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Remove inline transcript code, import LiveTranscript |

## Acceptance Criteria

- [x] Component streams transcript segments for selected call
- [x] Shows "No call selected" when `callId` is null
- [x] SSE connection cleans up on unmount via AbortController
- [x] Uses `use-sse-stream` hook (no inline SSE logic)
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Depends on: T03 (use-sse-stream hook)
