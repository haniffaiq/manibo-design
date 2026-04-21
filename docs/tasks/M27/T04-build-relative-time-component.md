# T04: Build RelativeTime Utility Component

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T04 - build RelativeTime utility component`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Build a `RelativeTime` component that displays timestamps as "2 min ago", "1h ago", "yesterday" with the full datetime in a hover tooltip. Used by the redesigned alerts page (T18) and potentially other pages. Auto-updates every 30 seconds without causing re-render storms.

## Subtasks

- [x] **Create RelativeTime component**: `apps/web/src/components/relative-time.tsx`
  - Props: `timestamp: string` (ISO 8601), `className?: string`
  - Renders: `<time datetime={iso} title={fullDateTime}>{relativeLabel}</time>`
  - Auto-updates: `setInterval` every 30s, cleared on unmount
- [x] **Create `formatRelativeTime` utility**: Pure function in `apps/web/src/lib/format-relative-time.ts`
  - "just now" (< 60s), "1 min ago", "5 min ago", "1h ago", "3h ago", "yesterday", "2 days ago", then falls back to locale date
- [x] **Add unit tests** for `formatRelativeTime` — edge cases: future dates, null, invalid strings

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/relative-time.tsx` | Create | RelativeTime component |
| `apps/web/src/lib/format-relative-time.ts` | Create | Pure formatting function |
| `apps/web/src/lib/__tests__/format-relative-time.test.ts` | Create | Unit tests |

## Implementation Notes

- Use a single shared interval via `useEffect` + `useState`, NOT per-instance timers.
- The tooltip (via `title` attribute) shows `new Date(timestamp).toLocaleString()`.
- Do NOT use a third-party library (date-fns, dayjs). This is <30 lines of logic.
- Handle edge cases: null/undefined → "—", future timestamps → "just now", invalid → "—".

## Acceptance Criteria

- [x] `RelativeTime` renders "2 min ago" style text
- [x] Full datetime visible on hover (native title tooltip)
- [x] Auto-updates without re-render storm (one interval, not N)
- [x] Unit tests pass for formatting function
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Related: T18 (alerts card layout uses this)
