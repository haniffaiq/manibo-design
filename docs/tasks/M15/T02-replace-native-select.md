# T02: Replace Native Select with Select Component

> **Milestone**: M15-workflow-client-ux
> **Status**: Not Started
> **Estimate**: S
> **Depends on**: M20 T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M15 T02 - replace native select with Select component`
2. **One Milestone = One PR** — branch: `feat/M15-workflow-client-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M15/PROGRESS.md` after completing

---

## Description

Replace the native `<select id="workflow-status-filter">` element in the automations page with the `@grove/ui/select` component. The Select component provides consistent styling, keyboard navigation, and accessibility. Preserve the existing `data-testid` attribute and `onChange` filter behavior.

## Subtasks

- [ ] Import `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` from `@grove/ui/select`
- [ ] Replace native `<select id="workflow-status-filter">` with Select component
- [ ] Preserve `data-testid` on SelectTrigger
- [ ] Preserve existing onChange/filter behavior
- [ ] Match h-10 height to align with other inputs
- [ ] Verify keyboard navigation (Space/Enter/Arrow keys)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/automations/page.tsx` | Modify | Replace native select with Select component |

## Acceptance Criteria

- [ ] No native `<select>` elements remain on the automations page
- [ ] `data-testid` is preserved on the SelectTrigger
- [ ] Keyboard navigation works (Space/Enter to open, Arrow keys to navigate, Enter to select)
- [ ] Filter behavior is identical to the native select
- [ ] Lint passes
- [ ] Type check passes

## References

- Milestone: [M15-workflow-client-ux.md](../../milestones/M15-workflow-client-ux.md)
- Dependency: M20 T03 (Select component must exist in `@grove/ui/select`)
