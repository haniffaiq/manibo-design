# T19: Deployment Dashboard — Health Hero Card

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T19 - deployment dashboard health hero card`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The deployment dashboard is three horizontal bands of equal weight (KPI strip, attention block, quick links). Nothing dominates. Restructure: promote platform health + error rate to a hero card at the top. Demote tenant count and worker badges into the quick links grid.

## Subtasks

- [x] **Create hero section**: Two-column grid at top: `grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]`
  - Left card: "Platform Health" — worker status indicators (API + Temporal as dot + label), active calls count, overall status badge ("All green" / "Needs attention")
  - Right card: "Error Rate" — large percentage, detail line (e.g., "3 errors / 1,482 calls last 24h")
- [x] **Health card dynamic border**: When all healthy → default border. When degraded → `border-[var(--color-warning-500)]`. The card itself is the attention grabber.
- [x] **Remove old KPI strip**: Delete the 4-column grid of Tenants/Active Calls/Workers/Error Rate cards
- [x] **Keep quick links grid**: Move tenant count hint into the quick links (already there as "5 active")
- [x] **Keep attention block**: The "Attention: ... degraded" warning block can stay as-is below the hero (it doubles as a link to /admin/health)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/page.tsx` | Modify | Restructure dashboard layout |

## Implementation Notes

- The hero cards should use the same Card component from `@grove/ui`.
- Worker status: `● Healthy` (green dot), `● Degraded` (amber dot) — use a small inline colored circle, not Badge.
- "All green" vs "Needs attention" as a Badge in the card header.
- Active calls count is a secondary metric inside the health card, not its own card.
- Keep all existing SWR data fetching and loading states.

## Acceptance Criteria

- [x] Health is the visual focal point of the deployment dashboard
- [x] Error rate has its own card (right side of hero)
- [x] No more 4-column KPI strip
- [x] Health card border changes color when workers are degraded
- [x] Quick links still show hints
- [x] All data-testid attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #10: Flat deployment dashboard
- Wireframe: "DEPLOYMENT CONSOLE — DASHBOARD" sketch (2026-03-26)
