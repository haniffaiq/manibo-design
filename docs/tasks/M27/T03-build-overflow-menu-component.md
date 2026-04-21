# T03: Build OverflowMenu Component

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T03 - build OverflowMenu component`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Build an overflow menu ("...") component for call action rows. The active calls table currently shows 6 peer-level buttons. This component provides the dropdown that holds the 4 secondary actions (Support details, Listen in, Join call, Watch transcript) behind a single trigger button.

## Subtasks

- [x] **Add Radix DropdownMenu dependency**: Run `pnpm --filter @grove/ui add @radix-ui/react-dropdown-menu` (this package is NOT currently installed — only dialog, select, accordion, tabs, toggle-group, and tooltip are present)
- [x] **Create OverflowMenu component**: Using Radix `DropdownMenu`
  - Trigger: IconButton with "..." (three dots / ellipsis)
  - Menu items: `{ label: string; onClick: () => void; disabled?: boolean }[]`
  - Positioned below-right of trigger
- [x] **Style the trigger**: `h-8 w-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-subtle)]` — consistent with existing button styles
- [x] **Style the dropdown**: White background, border, shadow, `rounded-[var(--radius-md)]`, items with hover state
- [x] **Accessible**: Keyboard navigation (arrow keys, Enter/Space to select, Escape to close)
- [x] **Export**: Decide placement — `@grove/ui` if generic enough, or `apps/web/src/components/` if call-ops specific

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/overflow-menu.tsx` | Create | OverflowMenu component |
| `packages/ui/src/components/index.ts` | Modify | Add OverflowMenu to barrel export |
| `packages/ui/package.json` | Modify | Add `@radix-ui/react-dropdown-menu` to dependencies + add `"./overflow-menu"` to exports map |

## Implementation Notes

- Radix DropdownMenu handles all a11y (keyboard nav, focus management, aria attributes).
- The trigger should be a compact button that doesn't compete with primary actions.
- Menu items should be `text-sm` with `px-3 py-2` padding, matching the app's density.
- Include `data-testid` props: `overflow-menu-trigger`, `overflow-menu-item-{label}`.

## Acceptance Criteria

- [x] Click "..." opens a dropdown with labeled menu items
- [x] Keyboard navigation works (arrow keys, Enter, Escape)
- [x] Menu closes on item click or Escape
- [x] `pnpm --filter @grove/ui check-types` passes
- [x] Visual: trigger is compact (h-8 w-8), doesn't compete with primary buttons

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Related: T09 (active calls button hierarchy uses this component)
