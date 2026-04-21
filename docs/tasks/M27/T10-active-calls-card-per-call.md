# T10: Active Calls — Card-Per-Call Layout

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T10 - active calls card-per-call layout`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Replace the DataTable in active calls with individual call cards. Each card is a self-contained unit showing call ID + escalation badge + workflow type label + primary actions + overflow menu. This makes each call visually distinct and easier to scan than table rows.

## Subtasks

- [x] **Create CallCard component**: `apps/web/src/components/call-ops/call-card.tsx`
  - Header: call_id (mono) + `<Badge>` for escalation status (T08 replaced the custom EscalationBadge)
  - Subtitle: human-readable workflow type label
  - Footer: action buttons (Take over/Claim + Transfer + overflow)
  - Hover state: subtle background shift
  - Selected state: primary border (when linked to transcript)
- [x] **Replace DataTable usage** in `ActiveCallsTable` with a flex column of CallCards
- [x] **Preserve empty state**: "No live calls right now." and loading state: "Loading live calls..."
- [x] **Preserve data-testid** attributes on the container and individual call elements

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/call-card.tsx` | Create | Individual call card component |
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Modify | Replace DataTable with CallCard list |

## Implementation Notes

- Each CallCard is a `<div>` with `rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-bg-subtle)] transition-colors`.
- Selected state (when transcript is watching this call): `border-[var(--color-primary-200)]`.
- The card layout is vertical: header row (call_id + badge), subtitle row (workflow type), action row (buttons).
- Keep the container as a flex column with `gap-3`.
- The overall Card wrapper that previously held the DataTable can remain as the parent.

## Acceptance Criteria

- [x] Each active call renders as an individual card, not a table row
- [x] Cards have hover state and selected state
- [x] Workflow type shows human-readable label (not raw workflow_type string)
- [x] Empty and loading states preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Wireframe: "CALL OPS — ACTIVE CALLS" sketch, card-per-call section
