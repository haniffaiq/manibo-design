# T10: Replace Native alert() with Inline Notices

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T10 - replace native alert() with inline notices`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Replace all `alert()` calls in call-ops with inline success/error notices that auto-dismiss. Create a reusable `use-inline-notice` hook that manages notice state with auto-dismiss after 8 seconds. The native `alert()` calls block the UI thread and look unprofessional — inline notices are non-blocking and consistent with the platform's visual language.

## Subtasks

- [x] **Create hook**: `apps/web/src/hooks/use-inline-notice.ts` — returns `{notice, showSuccess, showError, dismiss}`
- [x] **Replace alert() in mintLiveKitToken** with inline success notice
- [x] **Replace alert() in mintOperatorToken** with inline success notice
- [x] **Replace alert() in submitEscalation** with inline success notice
- [x] **Auto-dismiss** after 8 seconds
- [x] **Verify** no `alert()` calls remain in call-ops

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-inline-notice.ts` | Create | Reusable inline notice hook with auto-dismiss |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Replace alert() calls with use-inline-notice |

## Acceptance Criteria

- [x] No `alert()` calls remain in call-ops page
- [x] Success messages display as inline notices (not browser dialogs)
- [x] Notices auto-dismiss after 8 seconds
- [x] Hook returns `{notice, showSuccess, showError, dismiss}` interface
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "All native alert() replaced with inline notices"
