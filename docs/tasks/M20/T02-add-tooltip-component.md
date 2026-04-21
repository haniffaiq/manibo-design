# T02: Add Tooltip Component to packages/ui

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T02 - add Tooltip component to packages/ui`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Add a Tooltip component to `packages/ui` using `@radix-ui/react-tooltip`. Used to explain why actions are blocked, show metadata hints, and provide context for partial states.

## Subtasks

- [x] **Add dependency**: `pnpm -C packages/ui add @radix-ui/react-tooltip`
- [x] **Create component**: `packages/ui/src/components/tooltip.tsx` with `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` exports
- [x] **Style**: Dark background (`--color-neutral-900`), white text, `--radius-md`, small shadow, `text-xs`
- [x] **Export**: Add export path `@grove/ui/tooltip`
- [x] **Verify**: Build + type check

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/tooltip.tsx` | Create | Tooltip components wrapping Radix primitives |
| `packages/ui/package.json` | Modify | Add `@radix-ui/react-tooltip` dependency AND `"./tooltip"` entry to the `exports` map |

## Implementation Notes

```tsx
// TooltipContent styling
"rounded-[var(--radius-md)] bg-[var(--color-neutral-900)] px-3 py-1.5 text-xs text-white shadow-md"
```

Side defaults to `"top"`, align defaults to `"center"`. Delay of 200ms.

## Acceptance Criteria

- [x] `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` export from `@grove/ui/tooltip`
- [x] Dark tooltip appears on hover with 200ms delay
- [x] `pnpm -C packages/ui build` succeeds
- [x] `pnpm -C apps/web check-types` succeeds

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Radix UI Tooltip: https://www.radix-ui.com/primitives/docs/components/tooltip
