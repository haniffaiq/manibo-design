# T05: Tenant Call-Ops Alerts — Add Auto-Refresh Indicator and Bulk Actions

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T05 - add alerts auto-refresh indicator and bulk actions`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

The tenant alerts page (`/call-ops/alerts`) already auto-refreshes every 10s via SWR `refreshInterval`, but there is no visual indicator that data is live. Also, acknowledging or resolving events one-by-one is tedious when many alerts queue up. Add a visible auto-refresh indicator and bulk ack/resolve buttons.

## Subtasks

- [ ] **Auto-refresh indicator**: Add a subtle "Live — refreshes every 10s" badge or pulsing dot near the queue title
- [ ] **Bulk selection**: Add checkboxes to each event card, a "Select all" toggle, and bulk "Acknowledge selected" / "Resolve selected" buttons
- [ ] **Bulk action API calls**: Call `ackOperatorEvent` / `resolveOperatorEvent` for each selected event (sequential, with progress feedback)
- [ ] **Clear selection after bulk action**: Deselect all after successful bulk operation

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Add refresh indicator, bulk selection, bulk actions |

## Acceptance Criteria

- [ ] Live refresh indicator visible near queue header
- [ ] Checkbox on each event card for selection
- [ ] "Select all" / "Deselect all" toggle
- [ ] Bulk acknowledge and bulk resolve buttons appear when items selected
- [ ] Progress feedback during bulk operation
- [ ] `pnpm -C apps/web check-types` passes

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- Current page: `web/src/app/(tenant)/call-ops/alerts/page.tsx`
