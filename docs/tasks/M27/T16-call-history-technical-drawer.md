# T16: Call History — Technical Drawer Uses Drawer Component

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T15

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T16 - call history technical drawer uses Drawer component`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Call history's "Technical details" currently uses a Modal hacked with `className="left-auto right-0 top-0 h-full w-full max-w-3xl translate-x-0 translate-y-0 rounded-none border-l"` to look like a drawer. Replace with the proper Drawer component from T02.

## Subtasks

- [x] **Replace Modal** with `<Drawer>` for the technical details panel
  - Props: `open={technicalOpen}`, `onClose={closeTechnicalDrawer}`, `width="48rem"`, `title="Technical details"`, `description="Use this when a call felt slow or took the wrong path."`
- [x] **Remove className hack**: No more position overrides on Modal
- [x] **Keep all content**: Latency summaries, stack cards, route path, assistant path, support references
- [x] **Keep footer**: Close button at the bottom

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Replace Modal-as-drawer with Drawer |

## Implementation Notes

- The current Modal hack: `className="left-auto right-0 top-0 h-full w-full max-w-3xl translate-x-0 translate-y-0 rounded-none border-l shadow-[var(--shadow-lg)]"` — all of this goes away.
- The Drawer component handles positioning, animation, overlay, and escape.
- The content div currently has `className="grid max-h-[calc(100vh-10rem)] gap-5 overflow-y-auto pr-1"` — the Drawer's content area handles overflow, so simplify to `className="grid gap-5"`.

## Acceptance Criteria

- [x] No Modal with className hacks in call-history
- [x] Technical details opens as a proper Drawer from the right
- [x] All content renders correctly inside the Drawer
- [x] Escape closes the drawer
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #4: Two drawer implementations
