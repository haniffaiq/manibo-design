# T05: E2E Tests

> **Milestone**: M3-clinic-console-followup
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M3 T05 - {short description}`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M3-clinic-console-followup`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M3/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M3/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Playwright E2E tests proving the clinic handoff flow works end-to-end in the browser. Tests mock backend APIs and verify that all UI behaviors from T01-T04 render and function correctly: escalation badges, priority sorting, follow-up queue context, and bidirectional navigation between bookings and call-ops.

## Subtasks

- [x] **Create test file**: Create `apps/web/e2e/clinic-handoff.spec.ts` following the existing E2E test patterns in the project.
- [x] **Mock API responses**: Set up Playwright route interception for `/calls/active`, `/calls/active/{id}/events`, and `/clinic/follow-ups`. Provide fixture data covering: a normal call, a standard escalated call (`call.escalated` event), and an urgent transfer call (`transfer_immediately=true`, `priority=URGENT`).
- [x] **Test escalation badge rendering**: Verify the active calls table shows "Needs help" yellow badge for standard escalation and "Urgent transfer" red badge for urgent calls. Normal calls should have no badge.
- [x] **Test urgent priority sorting**: Verify urgent calls appear first in the table, followed by standard escalations, then normal calls.
- [x] **Test urgent banner**: Verify the persistent banner appears at the top of call-ops when urgent calls exist, displaying the call ID and reason.
- [x] **Test follow-up queue rendering**: Verify the bookings follow-up queue shows handoff reason and priority indicator on follow-up items.
- [x] **Test bookings-to-callops navigation**: Click "View call" on a follow-up item and verify navigation to `/call-ops/history?call_id={id}`. Verify the target page highlights the correct call.
- [x] **Test callops-to-bookings navigation**: Click "View follow-up" on an escalated history entry and verify navigation to `/bookings?follow_up={id}`. Verify the target page highlights the correct follow-up.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/e2e/clinic-handoff.spec.ts` | Create | Playwright E2E tests for the full clinic handoff flow |

## Implementation Notes

- Look at existing E2E tests in `apps/web/e2e/` for patterns: how routes are mocked, how navigation is tested, how assertions are structured.
- Use `page.route()` for API mocking. Intercept both the list endpoints and per-call event endpoints.
- Fixture data should be realistic but minimal. Three active calls is enough: one normal, one with standard escalation, one urgent.
- For navigation tests, mock both the source and destination pages' API calls so navigation completes without errors.
- Use descriptive test names that map clearly to acceptance criteria, e.g., `test('shows yellow Needs help badge for standard escalation')`.
- Run with: `NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium apps/web/e2e/clinic-handoff.spec.ts`

## Acceptance Criteria

- [x] Test file creates and runs without syntax errors
- [x] Tests cover escalation badge rendering (yellow for standard, red for urgent)
- [x] Tests cover priority sorting (urgent first)
- [x] Tests cover urgent banner display
- [x] Tests cover follow-up queue reason and priority display
- [x] Tests cover bidirectional navigation (bookings <-> call-ops history)
- [x] All tests pass in Playwright chromium project
- [x] `pnpm -C apps/web lint` passes (test file included)

## References

- Milestone: [completed/M3-clinic-console-followup.md](../../milestones/M3-clinic-console-followup.md)
- Related: T01 (escalation badges), T02 (urgent transfer UX), T03 (follow-up queue), T04 (bidirectional navigation)
- Related: Existing E2E tests in `apps/web/e2e/` for patterns
- Related: Playwright route interception docs for API mocking
