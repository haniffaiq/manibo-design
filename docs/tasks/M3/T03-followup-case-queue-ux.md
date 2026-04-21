# T03: Follow-Up Case Queue UX

> **Milestone**: M3-clinic-console-followup
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M3 T03 - {short description}`

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

Ensure the existing follow-up queue in the bookings page clearly shows handoff context -- reason, priority, and claim status -- so clinic operators can triage follow-up work effectively. The bookings page already has a follow-up queue with claim/assign/resolve actions (`GET /clinic/follow-ups`, `POST /clinic/follow-ups/{call_id}/claim|assign|resolve`). This task adds handoff reason display, priority indicators, and uses the existing call-observability presenters for human-readable reason translation.

## Subtasks

- [x] **Verify follow-up API response shape**: Read the follow-up API response to confirm it includes `reason`, `reason_code`, and `priority` fields. If it does not, document the gap and propose a minimal approach (client-side enrichment from call events, similar to T01).
- [x] **Add handoff reason display**: Show the translated handoff reason on each follow-up list item. Use presenters from `apps/web/src/lib/call-observability-presenters.ts` to convert reason codes to plain language.
- [x] **Add priority indicator**: Display a priority badge on follow-up items -- "Standard" (neutral) or "Urgent" (red) -- matching the visual language from T02's call-ops badges.
- [x] **Verify claim/assign/resolve actions render**: Confirm the existing claim/assign/resolve buttons work with the updated display. No functional changes expected, just visual verification.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/(generated-solutions)/bookings/page.tsx` | Modify | Add handoff reason display and priority indicator to follow-up items |
| `apps/web/src/lib/call-observability-presenters.ts` | Possibly modify | May need new presenter entries if follow-up reason codes differ from call event codes |

## Implementation Notes

- The bookings page already fetches `/clinic/follow-ups` and renders a follow-up queue. This task enriches the rendering, not the data fetching.
- Reuse the same badge/pill component patterns from the call-ops table. If call-ops uses Tailwind classes for yellow/red badges, use identical classes here for visual consistency.
- The presenters in `call-observability-presenters.ts` translate event codes like `call.escalated` to plain language. Follow-up items may use the same or similar codes. Check at implementation time.
- If the follow-up API response does NOT include reason/priority fields, fall back to fetching the call's events client-side (same pattern as T01). Document this in the completion log.

## Acceptance Criteria

- [x] Follow-up items in the bookings page show handoff reason in human-readable form
- [x] Follow-up items show priority level (Standard/Urgent) with appropriate visual styling
- [x] Claim/assign/resolve actions continue to function correctly
- [x] Visual styling is consistent with call-ops escalation badges
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M3-clinic-console-followup.md](../../milestones/M3-clinic-console-followup.md)
- Related: Follow-up API at `GET /clinic/follow-ups`, `POST /clinic/follow-ups/{call_id}/claim|assign|resolve`
- Related: Presenters in `apps/web/src/lib/call-observability-presenters.ts`
- Related: T01 (client-side event enrichment pattern, if needed here)
