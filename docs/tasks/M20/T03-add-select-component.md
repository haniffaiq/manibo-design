# T03: Add Select Component to packages/ui

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T03 - add Select component to packages/ui`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Add a styled Select dropdown to `packages/ui` using `@radix-ui/react-select`. Replaces native `<select>` elements across the admin console for visual consistency. Must match the Input component height (h-10) and border treatment.

## Subtasks

- [x] **Add dependency**: `pnpm -C packages/ui add @radix-ui/react-select`
- [x] **Create component**: `packages/ui/src/components/select.tsx` with `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel` exports
- [x] **Style trigger**: Match Input height (h-10), border `--color-border`, radius `--radius-md`
- [x] **Style content**: Dropdown with shadow, `--color-bg`, `--radius-md`, max-height for scroll
- [x] **Style item**: Hover with `--color-bg-subtle`, selected with `--color-primary-50` + check icon
- [x] **Export**: `@grove/ui/select`
- [x] **Verify**: Build + type check

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/select.tsx` | Create | Select components wrapping Radix primitives |
| `packages/ui/package.json` | Modify | Add `@radix-ui/react-select` dependency AND `"./select"` entry to the `exports` map |

## Implementation Notes

Must support:
- Controlled and uncontrolled modes
- Placeholder text
- Disabled state using solid colors (not opacity)
- `data-testid` pass-through on trigger
- `forwardRef` on all sub-components

The trigger must visually align with the existing Input component when side-by-side.

## Acceptance Criteria

- [x] `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` export from `@grove/ui/select`
- [x] Trigger height matches Input (h-10)
- [x] Dropdown opens with keyboard (Space/Enter/ArrowDown)
- [x] Selected item shows checkmark
- [x] Disabled state uses solid colors
- [x] `pnpm -C packages/ui build` succeeds

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Radix UI Select: https://www.radix-ui.com/primitives/docs/components/select
