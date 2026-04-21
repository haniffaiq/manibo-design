# T06: Split The LiveKit Voice Job Runtime Bridge

> **Milestone**: M8.2-control-plane-refactor-hardening
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Execution**: Completed on 2026-03-30 as its own task commit on milestone branch `feat/M8.2-control-plane-refactor-hardening`.
> **Checklist Rows**: `docs/requirements/checklist.md:228-233` — live call monitoring, transcripts, observe/takeover continuity, and event-contract continuity depend on the voice runtime bridge preserving current behavior.

---

## Activation Guardrails

1. **Activation satisfied** — T06 was explicitly continued by the human on 2026-03-30 and is active on the milestone branch
2. **Requirement-first** — revalidate checklist rows `228-233` before coding; runtime work must preserve the current operator-visible call surfaces
3. **After activation: One Task = One Commit** — commit message: `feat: M8.2 T06 - split LiveKit voice job runtime bridge`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8.2-control-plane-refactor-hardening`
5. Update `docs/tasks/M8.2/PROGRESS.md` after completing

---

## Description

`voice_job.py` is too large because it owns too many unrelated phases: session bootstrap, transcript signaling, LiveKit event binding, live telemetry snapshots, RTC quality sampling, and shutdown usage reporting. Split it into a small composition shell over extracted helpers so future runtime changes stop touching one 900-line function.

## Subtasks

- [x] Extract session/bootstrap wiring helpers
- [x] Extract runtime event/telemetry bridge helpers
- [x] Extract shutdown/final usage reporting helpers
- [x] Keep the existing LiveKit event surface and Temporal signaling contract unchanged
- [x] Update focused runtime tests around the new seams

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py` | Create | LiveKit session/bootstrap wiring helpers |
| `packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py` | Create | Transcript, telemetry, and runtime-event bridge helpers |
| `packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py` | Create | Final usage/session-quality/reporting helpers |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` | Modify | Reduce to composition and orchestration |
| `packages/grove-voice-livekit/tests/test_entrypoint.py` | Modify | Verify refactored runtime behavior |

## Implementation Notes

- Do not wrap everything into a god-class. Plain helper modules are enough.
- Keep the current event names and payloads stable; this is a structural refactor only.
- Extract natural lifecycle phases, not arbitrary chunks of lines.

## Outcome

1. `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` is now a `303` line composition shell that still owns room metadata parsing, config loading, object construction, and top-level orchestration.
2. Transcript forwarding, runtime-event emission, session callback registration, room reconnect handling, and RTC quality sampling now live in `packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py`.
3. Final completion reporting, shutdown cleanup ordering, and `CallCompletedSignal` retry logic now live in `packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py`.
4. Contact-context shaping, room/start kwargs, and initial greeting selection now live in `packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py`.
5. Focused runtime proof now includes a direct helper seam in `packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py` alongside the existing entrypoint suite.

## Acceptance Criteria

- [x] `voice_job.py` becomes a thin composition shell over extracted helpers
- [x] Runtime event, transcript, and shutdown behavior remain unchanged
- [x] Existing entrypoint/runtime tests stay green with targeted additions where needed
- [x] The extracted modules line up with actual lifecycle phases

## Verification Evidence

```bash
uv run ruff check packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py
uv run ruff format packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py --check
uv run pytest packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/unit/test_entrypoint_metadata_integration.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py -q --tb=short
uv run pyright -p pyrightconfig.ci.json
```

Expected results recorded on 2026-03-30:

- Ruff check: passed
- Ruff format `--check`: passed
- Pytest: `49 passed`
- Pyright: `0 errors, 0 warnings, 0 informations`

## References

- Milestone: [M8.2-control-plane-refactor-hardening.md](../../milestones/M8.2-control-plane-refactor-hardening.md)
- Related: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)

## Follow-up Notes

- 2026-04-14 hardening follow-up from the runtime-turn observability branch:
  application-turn completion must carry a stable `turn_index` captured when the
  turn starts, because `VoiceTurnLatencyCollector.current_turn_index()` can
  advance to the next active turn before an interrupted turn's completion hook
  fires
- executor-failed spoken turns must emit an explicit failed runtime event type
  rather than reusing `application.turn.completed`, otherwise downstream
  severity and operator headlines hide the failure behind an info event
