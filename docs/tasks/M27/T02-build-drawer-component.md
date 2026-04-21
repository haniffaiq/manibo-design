# T02: Build Drawer Component in @grove/ui

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T02 - build Drawer component in @grove/ui`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The codebase has two patterns for "right-side panel": `SupportDrawer` (custom fixed positioning, manual escape, manual overlay) and call history technical details (Modal hacked with className overrides). Build a proper `Drawer` component in `@grove/ui` that replaces both. The existing `Sheet` component is exported but not used for this pattern — check if it can be the base.

## Subtasks

- [x] **Audit existing Sheet component**: Check `packages/ui/src/components/sheet.tsx` — if it exists and fits, extend it rather than creating from scratch
- [x] **Create Drawer component**: `packages/ui/src/components/drawer.tsx`
  - Props: `open`, `onClose`, `side` ("right" default), `width` (string, e.g. "48rem"), `title`, `description`, `children`, `footer`
  - Features: overlay backdrop, focus trap, Escape key close, slide animation, aria-modal
  - Uses Radix Dialog primitive (already a dependency via Modal) or the existing Sheet
- [x] **Export from package**: Add export to `packages/ui/src/components/index.ts` barrel AND add `"./drawer": "./src/components/drawer.tsx"` entry to `packages/ui/package.json` exports map (follow the pattern of existing component exports like `./modal`, `./card`, etc.)
- [x] **Mobile behavior**: Full-width on `max-sm`, slides from right on desktop
- [x] **Animation**: `translate-x-full` → `translate-x-0` with `duration-300` transition

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/drawer.tsx` | Create | Drawer component |
| `packages/ui/src/components/index.ts` | Modify | Add Drawer to barrel export |
| `packages/ui/package.json` | Modify | Add `"./drawer"` to exports map |

## Implementation Notes

- Check if `packages/ui/src/components/sheet.tsx` already implements a Radix-based sheet. If so, build Drawer as a thin wrapper with the right defaults (side=right, overlay, focus trap).
- The overlay should use `bg-black/30` (matches SupportDrawer's current overlay).
- The panel should use `border-l border-[var(--color-border)]` and `bg-[var(--color-bg)]`.
- Include `data-testid="drawer-panel"` and `data-testid="drawer-overlay"` for Playwright.
- Use `"use client"` directive at the top of the file.
- The existing `Sheet` component (exported from `packages/ui/src/components/sheet.tsx`) is Radix Dialog-based and supports side positioning. Evaluate whether Drawer should wrap Sheet with opinionated defaults (side=right, width prop, title/description header) rather than building from scratch.

## Acceptance Criteria

- [x] `Drawer` component renders a right-side panel with overlay
- [x] Escape key closes the drawer
- [x] Click on overlay closes the drawer
- [x] Accessible: `role="dialog"`, `aria-modal="true"`, `aria-label` from title
- [x] Slide animation works (open: translate-x-0, closed: translate-x-full)
- [x] Full-width on mobile (max-sm)
- [x] `pnpm --filter @grove/ui check-types` passes
- [x] Component is exported from `@grove/ui/drawer`

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Related: T14 (SupportDrawer migration), T16 (call history technical drawer migration)
- Current implementations: `apps/web/src/components/call-ops/support-drawer.tsx:147-198`, `apps/web/src/app/(tenant)/call-ops/history/page.tsx:563-568`
