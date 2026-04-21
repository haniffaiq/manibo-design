# T05: Extract SlowdownSummary Component

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T05 - extract SlowdownSummary component`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Extract the slowdown summary section from the call-ops page into a standalone component. This includes the 3 component comparison cards (AI/Speech/Voice latency) and the route hotspot card showing the route needing attention.

## Subtasks

- [x] **Create component**: `apps/web/src/components/call-ops/slowdown-summary.tsx`
- [x] **Move 3 comparison cards** (AI, Speech, Voice latency) from call-ops page
- [x] **Move route hotspot card** from call-ops page
- [x] **Define props**: `summary: CallObservabilitySummaryResponse | null`
- [x] **Handle null gracefully** — show empty/placeholder state when summary is null

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/slowdown-summary.tsx` | Create | SlowdownSummary with 3 latency cards + route hotspot |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Remove inline summary code, import SlowdownSummary |

## Acceptance Criteria

- [x] Component renders 3 latency comparison cards (AI, Speech, Voice)
- [x] Component renders route hotspot card
- [x] Handles `null` summary gracefully (no crash, shows placeholder)
- [x] Component receives data via props (no internal data fetching)
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
