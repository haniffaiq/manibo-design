# T04: Bookings-to-Call-Ops Continuity

> **Milestone**: M3-clinic-console-followup
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T03

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M3 T04 - {short description}`

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

Enable bidirectional navigation between the bookings follow-up queue and call-ops history so operators can move seamlessly between follow-up triage and full call context. An operator viewing a follow-up item in bookings should be able to jump to the call history entry for full timeline/evidence context, and an operator viewing an escalated call in history should be able to jump to its follow-up item in bookings.

## Subtasks

- [x] **Add "View call" link on bookings follow-up items**: Each follow-up item has a `call_id`. Add a link/button that navigates to `/call-ops/history?call_id={call_id}`. Use Next.js `Link` component for client-side navigation.
- [x] **Handle `call_id` query param in call-ops history page**: Read the `call_id` search param on mount. If present, auto-select/highlight the corresponding call entry in the history list. Scroll to it if the list is long.
- [x] **Add "View follow-up" link on escalated call history entries**: In the call-ops history view, for calls that have escalation events, add a link that navigates to `/bookings?follow_up={call_id}`. Only show this link when the call has an associated follow-up (determined by the presence of escalation events).
- [x] **Handle `follow_up` query param in bookings page**: Read the `follow_up` search param on mount. If present, scroll to and highlight the matching follow-up item in the queue.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/(generated-solutions)/bookings/page.tsx` | Modify | Add "View call" link on follow-up items; handle `follow_up` query param for highlighting |
| `apps/web/src/app/(tenant)/call-ops/history/page.tsx` | Modify | Handle `call_id` query param for auto-selection; add "View follow-up" link on escalated entries |

## Implementation Notes

- Use Next.js `useSearchParams()` to read query params. Both pages likely already have this available.
- For highlighting, a simple approach: add a `ring-2 ring-blue-500` or similar Tailwind class to the matching item, and use `scrollIntoView()` via a `useEffect` + ref.
- The "View follow-up" link should only appear on calls with escalation events. The history page may already display escalation indicators; gate the link on the same condition.
- Keep the navigation links subtle -- a small icon or text link, not a prominent button. These are secondary actions.
- If the history page does not exist yet at `/call-ops/history/page.tsx`, check for the actual path. It might be a different route structure.

## Acceptance Criteria

- [x] Bookings follow-up items have a "View call" link navigating to `/call-ops/history?call_id={call_id}`
- [x] Call-ops history page auto-selects and scrolls to the call when `call_id` query param is present
- [x] Escalated call history entries have a "View follow-up" link navigating to `/bookings?follow_up={call_id}`
- [x] Bookings page highlights and scrolls to the follow-up when `follow_up` query param is present
- [x] Bidirectional navigation works correctly (bookings -> history -> bookings round-trip)
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M3-clinic-console-followup.md](../../milestones/M3-clinic-console-followup.md)
- Related: T01 (escalation status infrastructure in call-ops)
- Related: T03 (follow-up queue enhancements in bookings)
- Related: Next.js `useSearchParams` for query param handling
