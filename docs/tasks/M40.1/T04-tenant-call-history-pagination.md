# T04: Tenant Call-Ops History — Add Pagination and Date Range Presets

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T04 - add call history pagination and date range presets`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

The tenant call history page (`/call-ops/history`) fetches with `limit: 50, offset: 0` and has no pagination controls. Add "Load more" or page controls if the API returns `total > limit`. Also add quick date range presets (Today, Last 7 days, Last 30 days) to reduce manual datetime-local input friction.

## Subtasks

- [ ] **Audit API response**: Check `listHistoricalCalls` return type for `total`, `offset`, `has_more`, or cursor fields
- [ ] **Add pagination**: If `total > limit`, show a "Load more" button that fetches the next page and appends results
- [ ] **Date range presets**: Add quick-select buttons (Today, 7 days, 30 days) that populate `startedAfter` / `startedBefore`
- [ ] **Result count**: Show "Showing X of Y calls" when total is known
- [ ] **Loading state for "Load more"**: Show spinner on the button while fetching the next page

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Add pagination, date presets, result count |
| `web/src/lib/api/call-history.ts` | Read | Check response shape for pagination fields |

## Acceptance Criteria

- [ ] Pagination works when more than 50 results exist
- [ ] Date range presets populate the filter inputs correctly
- [ ] Result count displayed
- [ ] "Load more" shows loading indicator while fetching
- [ ] `pnpm -C apps/web check-types` passes

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- Current page: `web/src/app/(tenant)/call-ops/history/page.tsx`
