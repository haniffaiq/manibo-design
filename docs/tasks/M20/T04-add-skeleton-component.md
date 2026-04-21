# T04: Add Skeleton Component to packages/ui

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T04 - add Skeleton component to packages/ui`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Add a Skeleton loading placeholder to `packages/ui`. Pure CSS — no Radix dependency. Used to replace "Loading..." text with animated placeholder shapes on admin directory pages.

## Subtasks

- [x] **Create component**: `packages/ui/src/components/skeleton.tsx` — single `Skeleton` component
- [x] **Style**: `bg-neutral-200` with pulse animation, `rounded-[var(--radius-md)]`
- [x] **Accept**: `className` for width/height overrides, `cn()` merge
- [x] **Export**: `@grove/ui/skeleton`
- [x] **Verify**: Build + type check

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/skeleton.tsx` | Create | Skeleton placeholder component |
| `packages/ui/package.json` | Modify | Add `"./skeleton"` entry to the `exports` map so `@grove/ui/skeleton` resolves |

## Implementation Notes

```tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-200)]", className)}
      {...props}
    />
  );
}
```

No Radix dependency needed. This is a pure presentational component.

## Acceptance Criteria

- [x] `Skeleton` exports from `@grove/ui/skeleton`
- [x] Renders a pulsing placeholder with configurable dimensions via className
- [x] `pnpm -C packages/ui build` succeeds

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
