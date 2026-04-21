# T12: Call Ops — Collapse Performance Section

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T12 - collapse call-ops performance section`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The call ops page shows SlowdownSummary (3 benchmark cards + route attention card) and the full hotspot table at all times. For an operator managing live calls, the active calls table should dominate — the performance data is context that should recede. Wrap both sections in a collapsible `<details>` element, collapsed by default.

## Subtasks

- [x] **Wrap SlowdownSummary + hotspot table** in a single `<details>` element
  - Summary text: "Performance summary" with a count badge (e.g., "3 hotspots")
  - Default state: closed
- [x] **Style the details/summary**: Match the existing Card pattern — border, rounded, padding on summary
- [x] **Move hotspot table inside the same collapsible** — it's currently a separate Card after the active calls section. Move it to be adjacent to SlowdownSummary inside the details.
- [x] **Preserve data-testid** attributes on all elements inside

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Wrap performance sections in `<details>` |

## Implementation Notes

- Use native `<details>` + `<summary>` — no JS needed, works without hydration.
- The summary row should look like a card header: `cursor-pointer text-sm font-semibold` with a chevron indicator.
- Badge in the summary shows the hotspot count: `<Badge variant="neutral">{count} hotspots</Badge>`.
- The content inside includes both `SlowdownSummary` and the hotspot `<table>`.
- Re-order the page: urgent banners → active calls + transcript (two-column) → performance details (collapsed).

## Acceptance Criteria

- [x] Performance section is collapsed by default
- [x] Clicking "Performance summary" expands to show benchmarks + hotspot table
- [x] Active calls table is the visual focal point of the page
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #3: No progressive disclosure
