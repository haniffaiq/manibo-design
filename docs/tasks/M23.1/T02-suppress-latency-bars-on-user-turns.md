# T02: Suppress LLM/TTS/Speak Bars on User-Only Turns

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

User turns (Turn 2 "Laba diena.", Turn 4 "Noreciau uzsiregistruoti...") display full `[STT][LLM][TTS][Speak]` latency bars. This is wrong — user-only turns should show at most `[STT]` (speech recognition time). The LLM/TTS/Speak segments belong to the assistant response that follows.

**Root cause:** `mergeConversationTurns` in `domain-logic.ts` merges transcript segments with latency turns by `turn_index`. The backend assigns latency data to the turn where the user spoke, but includes the full pipeline (STT + LLM + TTS + Speak) on that same turn index because the pipeline is measured end-to-end from user speech to agent speech. The frontend doesn't distinguish "this is a user turn that only contributes STT" from "this is the full round-trip turn."

**Fix options:**
- **Option A**: Check `transcript.speaker` — if user, hide LLM/TTS/Speak segments from the inline bar (show full pipeline only on the adjacent assistant turn)
- **Option B**: Backend sends separate `is_user_turn` flag or the frontend uses transcript speaker to determine which segments to show

Option A is simpler and frontend-only.

## Subtasks

- [x] **Identify user-only turns**: In `ConversationTurnRow` or its parent, determine if the turn's transcript speaker is "user"/"caller" vs "assistant"/"agent"
- [x] **Suppress segments on user turns**: For user turns, show only the STT segment in `InlineLatencyBar`. The felt latency badge (`eot_to_agent_speak_ms`) should still show since it's the full round-trip metric.
- [x] **Verify assistant turns**: Assistant turns should continue showing the full `[STT][LLM][TTS][Speak]` bar

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/conversation-turn-row.tsx` | Modify | Add speaker-aware segment filtering in `InlineLatencyBar` |
| `apps/web/src/components/observability/domain-logic.ts` | Possibly modify | If merge logic needs adjustment to pair user/assistant turns |

## Acceptance Criteria

- [x] User turns show only `[STT]` segment (blue bar) when latency data exists
- [x] Assistant turns show full `[STT][LLM][TTS][Speak]` pipeline
- [x] Felt latency badge still appears on both turn types
- [x] Expanded pipeline breakdown on user turns only shows STT row
