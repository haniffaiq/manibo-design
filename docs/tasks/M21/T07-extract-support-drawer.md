# T07: Extract SupportDrawer as Proper Slide-Over

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T07 - extract SupportDrawer as proper slide-over`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Replace the current Modal-with-className-hack pattern used for the support panel with a proper slide-over drawer component. The current implementation uses `Modal` with class overrides to simulate a right-panel, which is fragile and breaks accessibility expectations. The new SupportDrawer slides from the right edge, uses `position: fixed`, has a width of `w-[min(48rem,90vw)]`, goes full-screen on mobile, and closes on route navigation.

## Subtasks

- [x] **Create component**: `apps/web/src/components/call-ops/support-drawer.tsx`
- [x] **Implement slide-over pattern** — position fixed, right: 0, slides in/out with transition, `w-[min(48rem,90vw)]`, full-screen on mobile
- [x] **Move content sections** — call context banner, live guidance, latency metrics, stack identity, SessionInsightsFeed, assistant path, support references
- [x] **Close on route navigation** — `usePathname` effect that closes drawer when path changes
- [x] **Backdrop overlay** — semi-transparent backdrop, click to close
- [x] **Remove Modal className hacks** from call-ops page

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/support-drawer.tsx` | Create | Proper slide-over drawer replacing Modal hack |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Remove Modal-based support panel, import SupportDrawer |

## Acceptance Criteria

- [x] Support panel slides from right on desktop with `w-[min(48rem,90vw)]`
- [x] Full-screen on mobile breakpoints
- [x] No Modal className hacks remain in call-ops
- [x] Closes on route navigation (usePathname effect)
- [x] Backdrop overlay closes drawer on click
- [x] Contains all support content sections (context banner, live guidance, latency metrics, stack identity, SessionInsightsFeed, assistant path, support references)
- [x] Slide transition animation (enter/exit)
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Design decision: "Support drawer replaces Modal abuse"
- Depends on: T03 (use-sse-stream hook for live guidance streaming)
