# T14: Fix evidence rail auto-scroll

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

The auto-scroll implementation in `evidence-rail.tsx` is broken. The `containerRef` div has `onScroll` but no overflow constraint — it expands to fit all content and never scrolls internally. The page scrolls instead. This means:

- `handleScroll` never fires
- `isAtBottomRef` stays `true` forever
- `scrollIntoView` fires on every new event regardless of user position
- The "user scrolls up to pause" behavior is dead code

## Subtasks

- [x] **Choose scroll strategy**: either (a) give the timeline container `overflow-y-auto max-h-[60vh]` so it scrolls independently, or (b) attach the scroll listener to `window` and compute proximity to `bottomRef` relative to the viewport
- [x] **Fix isAtBottom detection**: ensure user scrolling up actually sets `isAtBottomRef.current = false`
- [x] **Verify user-override pause**: scroll up → new events arrive → rail does NOT jump. Scroll back to bottom → auto-scroll resumes.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/evidence-rail.tsx` | Modify | Fix container overflow + scroll detection |

## Implementation Notes

Option (a) is simpler but changes the layout — the timeline becomes a fixed-height scrollable region within the page. Option (b) preserves the current full-page scroll layout but needs `IntersectionObserver` on `bottomRef` to detect proximity. Option (a) is recommended — it matches the wireframe where the rail is a bounded region.

## Acceptance Criteria

- [x] Auto-scroll follows new live events to the bottom
- [x] User scrolling up pauses auto-scroll (new events do NOT jump the view)
- [x] Scrolling back to the bottom threshold resumes auto-scroll
- [x] Historical (non-live) mode is unaffected

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Evidence rail: `apps/web/src/components/observability/evidence-rail.tsx`
