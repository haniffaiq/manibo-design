# T01: Align Frontend LiveCallTurnLatency Types with Backend

> **Milestone**: M8.1-voice-turn-latency-observability
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M8.1 T01 - align frontend turn latency types with backend`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M8.1-voice-turn-latency-observability`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M8.1/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)

6. **After Completing This Task**
   - Update `docs/tasks/M8.1/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

The frontend `LiveCallTurnLatency` interface (`apps/web/src/lib/api/call-observability.ts:24-35`) has 11 fields — a subset of the backend's 29. Two field names are mismatched (`llm_started_at_ms` vs backend `llm_start_at_ms`, `llm_first_token_at_ms` vs backend `llm_ttft_at_ms`). The waterfall visualization needs fields that aren't currently exposed: user speech timing, interruption tracking, and tool executions.

## Subtasks

- [x] **Fix field name mismatches**: Rename `llm_started_at_ms` → `llm_start_at_ms` and `llm_first_token_at_ms` → `llm_ttft_at_ms` to match backend. Update all consumers.
- [x] **Add user speech fields**: `user_speech_started_at_ms`, `user_speech_ended_at_ms`, `user_final_transcript_at_ms`, `user_final_transcript_chars`
- [x] **Add duration fields**: `stt_duration_ms`, `llm_duration_ms`, `tts_duration_ms`, `first_speech_latency_ms`, `tts_pre_speech_gap_ms`
- [x] **Add interruption fields**: `user_interrupted_agent`, `interruption_started_at_ms`, `agent_stop_after_interrupt_ms`, `speech_overlap_duration_ms`
- [x] **Add tool execution type and field**: `tool_executions: Array<{ tool_name: string; duration_ms: number | null; status: string; error_detail: string | null }>`
- [x] **Verify API response mapping**: Confirm the API serializes these fields (check `CallLatencyResponse` Pydantic model in `apps/api/src/platform_api/routes/calls.py`)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/api/call-observability.ts` | Modify | Extend `LiveCallTurnLatency` interface, fix field name mismatches |
| `apps/web/src/components/call-ops/support-drawer.tsx` | Modify | Update any references to renamed fields |
| `apps/web/src/components/call-ops/call-history-detail-panel.tsx` | Modify | Update any references to renamed fields |

## Implementation Notes

- The backend `VoiceTurnLatency` has 29 fields. We don't need all 29 in the frontend. Add only what the waterfall and detail card will render.
- The API's Pydantic `LiveCallTurnLatency` model may also need updating if it doesn't serialize the new fields. Check `apps/api/src/platform_api/routes/calls.py` for the response model.
- All new fields should be `number | null` (nullable) since turns can be incomplete during live calls.

## Acceptance Criteria

- [x] `LiveCallTurnLatency` field names match backend exactly (no mismatches)
- [x] Interface includes user speech, interruption, tool execution, and duration fields
- [x] Existing consumers of renamed fields are updated
- [x] `pnpm -C apps/web check-types` passes with 0 errors
- [x] `pnpm -C apps/web lint` passes

## References

- Milestone: [M8.1-voice-turn-latency-observability.md](../../milestones/M8.1-voice-turn-latency-observability.md)
- Backend type: `packages/grove/src/grove/temporal/voice_call_models.py:67-96` (VoiceTurnLatency)
- Frontend type: `apps/web/src/lib/api/call-observability.ts:24-35` (LiveCallTurnLatency)
- API response: `apps/api/src/platform_api/routes/calls.py:320-326` (CallLatencyResponse)
