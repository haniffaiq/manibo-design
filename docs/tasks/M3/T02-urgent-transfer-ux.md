# T02: Urgent Transfer UX

> **Milestone**: M3-clinic-console-followup
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M3 T02 - {short description}`

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

When `transfer_immediately=true` or `priority=URGENT` appears in escalation events, the operator console must surface immediate visual escalation: a red badge (distinct from the standard yellow), priority-based sorting so urgent calls float to the top, and a persistent notification banner at the top of the call-ops page summarizing the urgent call and its reason.

This builds on the escalation status infrastructure from T01.

## Subtasks

- [x] **Extract priority and transfer_immediately from events**: Update `call-ops-escalation.ts` to parse `priority` (STANDARD/URGENT) and `transfer_immediately` fields from escalation event payloads. Expose these on the enriched call object.
- [x] **Priority-based table sorting**: Sort the active calls list so urgent calls appear first, then standard escalations, then normal calls. Sorting should be stable (preserve existing order within each tier).
- [x] **Differentiate urgent badge styling**: In `active-calls-table.tsx`, use red styling for urgent/transfer_immediately calls vs yellow for standard escalations. The badge text should read "Urgent transfer" (red) vs "Needs help" (yellow).
- [x] **Add urgent notification banner**: Create a banner component at the top of the call-ops page that appears when any active call has `priority=URGENT` or `transfer_immediately=true`. Banner text: "{call_id} needs immediate transfer -- {reason_summary}". Multiple urgent calls show multiple banners or a stacked summary.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/call-ops-escalation.ts` | Modify | Parse priority and transfer_immediately from event payloads |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Add sorting logic and urgent banner component |
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Modify | Differentiate red vs yellow badge styling based on priority |

## Implementation Notes

- The escalation enrichment from T01 already fetches events and computes `escalation_status`. This task extends that to also extract `priority` and `transfer_immediately`.
- Sorting should happen after enrichment but before rendering. Implement it in the page component, not inside the table.
- The banner should be a simple conditional render -- no separate component file needed unless it grows complex. Inline it in the page layout above the table.
- Event payload fields per the backend: `reason`, `reason_summary`, `priority` (STANDARD/URGENT), `transfer_immediately` (boolean).
- No notification sound for STTCPW. If needed later, it can be added as a separate task.

## Acceptance Criteria

- [x] Urgent calls (`priority=URGENT` or `transfer_immediately=true`) show red "Urgent transfer" badge
- [x] Standard escalated calls show yellow "Needs help" badge
- [x] Urgent calls sort to the top of the active calls table
- [x] A persistent banner appears at the top of call-ops when urgent calls exist
- [x] Banner displays the call identifier and reason summary
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M3-clinic-console-followup.md](../../milestones/M3-clinic-console-followup.md)
- Related: T01 (live handoff state -- provides enrichment infrastructure)
- Related: Event payload fields documented in `apps/api/src/platform_api/routes/calls.py`
