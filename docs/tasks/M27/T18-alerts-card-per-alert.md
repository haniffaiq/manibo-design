# T18: Alerts — Card-Per-Alert Layout + Relative Timestamps

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T04, T17

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T18 - alerts card-per-alert layout`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Replace the DataTable in alerts with individual alert cards. Each card has a colored left border indicating severity (red=critical, amber=warning, gray=info), uses relative timestamps ("2 min ago"), and shows status inline. This makes alerts scannable at a glance without reading table columns.

## Subtasks

- [x] **Create AlertCard component**: `apps/web/src/components/call-ops/alert-card.tsx`
  - Left border: 3px, color based on severity
  - Header row: severity badge + event_type + RelativeTime
  - Body: message text
  - Entity line: entity_type:entity_id (if present)
  - Action row: Ack button (if open), Resolve button (if not resolved)
  - Status shown inline: icon + label (not a separate column)
- [x] **Replace DataTable** in alerts page with a flex column of AlertCards
- [x] **Use RelativeTime** from T04 for timestamps
- [x] **Show event count** in the card header: "5 events" badge

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/alert-card.tsx` | Create | Individual alert card component |
| `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Replace DataTable with AlertCard list |

## Implementation Notes

- Left border colors: `border-l-[3px] border-l-[var(--color-error-500)]` (critical), `border-l-[var(--color-warning-500)]` (warning), `border-l-[var(--color-border)]` (info).
- Card: `rounded-[var(--radius-md)] border border-[var(--color-border)] p-4` with the colored left border.
- Status inline: "● Open" (amber), "◐ Acknowledged" (neutral), "✓ Resolved" (green) — use Badge variants.
- Preserve all `data-testid` attributes for Playwright.

## Acceptance Criteria

- [x] Each alert renders as a card with severity-colored left border
- [x] Timestamps show relative time ("2 min ago") with absolute on hover
- [x] Status shown inline (not in a separate column)
- [x] Ack/Resolve actions work correctly
- [x] Empty state preserved
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Wireframe: "ALERTS PAGE" sketch (2026-03-26)
