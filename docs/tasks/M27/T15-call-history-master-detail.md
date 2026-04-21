# T15: Call History — Master-Detail Split Layout

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T15 - call history master-detail split layout`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Call history currently stacks: filters → results table → call detail card → technical drawer vertically. The call detail card renders even when nothing is selected (showing placeholder text). Redesign as a master-detail layout: compact results list on the left, call detail panel on the right. Familiar email-client pattern.

## Subtasks

- [x] **Split layout**: Below the search/filters card, create a two-column grid: `grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`
  - Left: Compact results list (reduced columns)
  - Right: Call detail panel (scrollable)
- [x] **Compact results list**: Reduce from 7 columns to 4 visible fields:
  - Row 1: Date + Outcome badge + Duration
  - Row 2 (subtitle): Phone + direction
  - "Needs review" badge when applicable
  - Click row → sets selectedCallId, highlights row
- [x] **Detail panel**: When no call selected → centered placeholder text. When selected → call metadata header, summary tiles (Transcript/Events/Recordings), SessionInsightsFeed, full transcript toggle, action links (observability, technical details, follow-up)
- [x] **Remove the full-width Call Detail card** that was a separate section below results
- [x] **Preserve deep linking**: URL params `?call_id=X&technical=1` still work

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Major layout restructure |

## Implementation Notes

- The left list should highlight the selected row with `border-[var(--color-primary-200)] bg-[var(--color-primary-50)]`.
- The right panel scrolls independently (`overflow-y-auto max-h-[calc(100vh-300px)]`).
- On mobile (`< lg`), collapse to a single column — list first, detail below when selected (or use a modal/drawer for detail).
- This is a big file (768 lines). Focus on layout structure, not logic rewrites.
- All existing hooks (`useCallDetail`, deep linking, recording actions) stay the same.

## Acceptance Criteria

- [x] Results and detail are side-by-side on desktop
- [x] Clicking a result row shows detail on the right (no page scroll needed)
- [x] No empty "Call Detail" card visible before selection — just a placeholder in the right panel
- [x] Deep linking still works (`?call_id=X`)
- [x] Mobile fallback works (single column)
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #3: No progressive disclosure
- Wireframe: "CALL HISTORY" sketch (2026-03-26)
