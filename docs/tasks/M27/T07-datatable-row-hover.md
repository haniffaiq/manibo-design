# T07: Add DataTable Row Hover States

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T07 - add DataTable row hover states`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

DataTable rows and custom `<table>` rows throughout the app have no hover highlight. When operators scan 20+ rows, there's no visual cue for which row they're tracking. Add `hover:bg-[var(--color-bg-subtle)]` to all table rows.

## Subtasks

- [x] **DataTable component** (`packages/ui/src/components/data-table.tsx`): Add hover class to `<tr>` elements in the body
- [x] **Custom tables in call-ops**: `call-ops/page.tsx` hotspot table, `history/page.tsx` assistant path table — add hover to `<tr>` body rows
- [x] **Transition**: Add `transition-colors` to the hover for a smooth feel

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/data-table.tsx` | Modify | Add hover class to body `<tr>` |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Add hover to hotspot table rows |
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Add hover to assistant path table rows |

## Implementation Notes

- Note: T10 (card-per-call) and T18 (card-per-alert) will later replace some DataTable usages with card layouts. The primary target of this task is the DataTable component itself (affects all current and future DataTable consumers) plus the custom `<table>` elements in the hotspot table and assistant path table, which remain as tables.

## Acceptance Criteria

- [x] All DataTable body rows highlight on hover
- [x] All custom table body rows highlight on hover
- [x] Header rows do NOT highlight on hover
- [x] Hover uses `bg-[var(--color-bg-subtle)]` (not a new color)
- [x] `pnpm --filter @grove/ui check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #9: No table row hover
