# T06: Verification: channel management flow end-to-end

> **Milestone**: M31-assistant-channel-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04, T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M31 T06 - verify channel management flow`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify all T01-T05 are completed

5. **Definition of Done**
   - All verification commands pass
   - Evidence captured

6. **After Completing This Task**
   - Update `docs/tasks/M31/PROGRESS.md` to mark all tasks done

---

## Description

Run the full verification suite and capture evidence that the channel management flow works end-to-end: add a phone channel to an assistant, see it in the list, pause it, reactivate it, remove it.

## Subtasks

- [x] **Run targeted frontend tests**: Lint, typecheck, Vitest.
- [x] **Run full Playwright suite**: Verify no regressions.
- [x] **Capture evidence**: Commands and output for each verification step.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M31/PROGRESS.md` | Modify | Mark all tasks done with dates |

## Acceptance Criteria

- [x] `pnpm -C apps/web lint` passes.
- [x] `pnpm -C apps/web check-types` passes.
- [x] `pnpm -C apps/web test` passes.
- [x] Phone Routing is hidden from sidebar.
- [x] Channels tab shows on assistant detail page.
- [x] Add/pause/activate/remove phone channel works.

## References

- Milestone: [M31-assistant-channel-management.md](../../milestones/M31-assistant-channel-management.md)
