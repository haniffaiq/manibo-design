# T01: Add Tabs Component to packages/ui

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T01 - add Tabs component to packages/ui`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Add a Tabs component to `packages/ui` using `@radix-ui/react-tabs` as the accessibility primitive. The component must support horizontal tab lists with pills/segments styling, keyboard navigation, and brand token integration.

## Subtasks

- [x] **Add dependency**: `pnpm -C packages/ui add @radix-ui/react-tabs`
- [x] **Create component**: `packages/ui/src/components/tabs.tsx` with `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` exports
- [x] **Style with brand tokens**: Active tab uses `--color-primary-600` border/text, inactive uses `--color-neutral-500`
- [x] **Export**: Add to `packages/ui/src/index.ts` or per-component export path
- [x] **Verify**: `pnpm -C packages/ui build` and `pnpm -C apps/web check-types`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/tabs.tsx` | Create | Tabs, TabsList, TabsTrigger, TabsContent components |
| `packages/ui/package.json` | Modify | Add `@radix-ui/react-tabs` dependency AND `"./tabs"` entry to the `exports` map |

## Implementation Notes

Follow shadcn/ui Tabs pattern but use project CSS custom properties instead of tailwind `theme()`:

```tsx
// TabsTrigger active state
"data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary-600)]"
"data-[state=active]:text-[var(--color-primary-700)]"

// TabsTrigger inactive state
"text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"
```

Use `forwardRef` for all sub-components. Accept `className` prop and merge with `cn()`.

## Acceptance Criteria

- [x] `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` export from `@grove/ui/tabs`
- [x] Keyboard navigation works (arrow keys switch tabs)
- [x] Active tab has purple bottom border + purple text
- [x] `pnpm -C packages/ui build` succeeds
- [x] `pnpm -C apps/web check-types` succeeds

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- shadcn/ui Tabs: https://ui.shadcn.com/docs/components/tabs
- Radix UI Tabs: https://www.radix-ui.com/primitives/docs/components/tabs
