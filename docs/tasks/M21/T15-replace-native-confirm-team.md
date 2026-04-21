# T15: Replace Native confirm() with Modal on Team Page

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T15 - replace native confirm() with Modal on team page`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Replace `window.confirm()` calls in the team page for deactivate and remove member actions with proper Modal confirmation dialogs. The modals use the destructive pattern: red action button, Cancel first, explicit member name in the title. This matches the pattern established in M20 T16 for admin pages.

## Subtasks

- [x] **Replace confirm() for deactivate** — Modal with "Deactivate {member name}?" title, Cancel + destructive Deactivate button
- [x] **Replace confirm() for remove** — Modal with "Remove {member name}?" title, Cancel + destructive Remove button
- [x] **Verify** no `window.confirm` calls remain in team page

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/team/page.tsx` | Modify | Replace window.confirm with Modal for deactivate and remove actions |

## Acceptance Criteria

- [x] No `window.confirm` calls in team page
- [x] Deactivate action uses Modal with destructive button
- [x] Remove action uses Modal with destructive button
- [x] Cancel button always appears first (left position)
- [x] Member name appears in modal title
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Prior art: M20 T16 (replace confirm() on admin pages)
