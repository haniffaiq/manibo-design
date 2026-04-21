# T14: Support Drawer — Migrate to Drawer Component

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T13

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T14 - migrate SupportDrawer to Drawer component`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The SupportDrawer currently builds its own fixed positioning, overlay, transform animation, and escape key handler. Replace this with the `Drawer` component from T02, keeping only the content/logic. This unifies the drawer pattern with the call history technical details drawer.

## Subtasks

- [x] **Replace custom positioning** in `support-drawer.tsx` with `<Drawer>` wrapper
  - Props: `open={open}`, `onClose={onClose}`, `width="48rem"`, `title="Support details"`, `description="..."`
- [x] **Remove manual overlay** (`<div className="fixed inset-0 z-40 bg-black/30" ...>`) — Drawer handles this
- [x] **Remove manual escape handler** (`useEffect` with keydown listener) — Drawer handles this
- [x] **Remove manual transform animation** (`translate-x-full` / `translate-x-0`) — Drawer handles this
- [x] **Keep all content and data logic** — SSE streams, derived data, all sub-components remain

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/support-drawer.tsx` | Modify | Replace custom shell with Drawer component |

## Implementation Notes

- The `SupportDrawer` component stays as the business logic wrapper. It just delegates the shell (positioning, overlay, animation) to `<Drawer>`.
- The scrollable content area (`<div className="flex-1 overflow-y-auto px-6 py-5">`) moves into Drawer's children.
- The header bar (title + close button) is handled by Drawer's `title` and `description` props.
- Check: does the Drawer component from T02 support a `footer` prop? If not, the close button in the header suffices.

## Acceptance Criteria

- [x] No manual fixed positioning in support-drawer.tsx
- [x] No manual overlay div
- [x] No manual escape key handler
- [x] Drawer opens/closes with animation
- [x] All SSE streaming works as before
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #4: Two drawer implementations
