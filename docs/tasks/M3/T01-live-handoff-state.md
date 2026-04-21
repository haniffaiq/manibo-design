# T01: Live Handoff State in Call-Ops

> **Milestone**: M3-clinic-console-followup
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M3 T01 - {short description}`

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

Show escalation/handoff state inline in the active calls table so operators see at a glance which calls need human attention. Rather than adding backend routes (milestone non-goal), compute escalation status client-side by fetching each active call's event stream and checking for `call.escalated` / `call.escalation.transfer_requested` events.

Active calls are typically fewer than 10 at any time, so a parallel `Promise.all` of per-call event fetches is acceptable and avoids N+1 concerns.

## Subtasks

- [x] **Create `call-ops-escalation.ts` helper**: New file at `apps/web/src/lib/call-ops-escalation.ts`. Exports a function that takes an array of active calls, fetches `/calls/active/{call_id}/events` for each in parallel, and returns enriched calls with `escalation_status` (`null` | `"escalated"` | `"transfer_requested"`) plus `escalation_reason` and `escalation_priority` extracted from event payloads.
- [x] **Extend `ActiveCall` TypeScript type**: Add optional `escalation_status`, `escalation_reason`, and `escalation_priority` fields to the `ActiveCall` type used by the table.
- [x] **Add escalation badge in table**: In `active-calls-table.tsx`, render a badge/pill next to the call identifier -- yellow "Needs help" when `escalation_status === "escalated"`, red "Urgent transfer" when `escalation_status === "transfer_requested"`.
- [x] **Add "Claim" action button**: In the actions column, show a "Claim" button when `escalation_status` is set. Wire it to the existing takeover flow in `escalation-modal.tsx` (no new backend endpoint).
- [x] **Enrich calls on the page**: In `call-ops/page.tsx`, after SWR fetches active calls, call the enrichment helper to merge escalation status before passing to the table component.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/call-ops-escalation.ts` | Create | Helper to fetch events per active call and compute escalation status |
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Modify | Add escalation badge and "Claim" action button |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Enrich active calls with escalation status after SWR fetch |
| `apps/web/src/components/call-ops/escalation-modal.tsx` | Modify | Extend ActiveCall type with optional escalation fields |

## Implementation Notes

- Use the existing `use-sse-stream.ts` or `use-call-detail.ts` hooks as reference for API fetching patterns.
- Presenters in `apps/web/src/lib/call-observability-presenters.ts` already translate event codes to plain language -- reuse them for `escalation_reason` display.
- The SWR refresh interval on call-ops already re-fetches active calls periodically; the enrichment should run on each SWR revalidation.
- Do NOT create a new backend endpoint for claiming -- reuse the existing takeover flow through `escalation-modal.tsx`.

## Acceptance Criteria

- [x] Active calls table shows "Needs help" (yellow) badge for calls with `call.escalated` event
- [x] Active calls table shows "Urgent transfer" (red) badge for calls with `call.escalation.transfer_requested` event
- [x] "Claim" button appears in actions column for escalated calls
- [x] Clicking "Claim" triggers the existing takeover/escalation modal flow
- [x] No new backend endpoints created
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M3-clinic-console-followup.md](../../milestones/M3-clinic-console-followup.md)
- Related: Backend `ActiveCallEvent` types in `apps/api/src/platform_api/routes/calls.py`
- Related: Presenters in `apps/web/src/lib/call-observability-presenters.ts`
- Related: Existing hooks `use-sse-stream.ts`, `use-call-detail.ts`
