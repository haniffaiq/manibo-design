# T09: Adopt LiveKit 1.5 Turn Handling and Recording Options

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: none
> **Checklist Rows**: `docs/requirements/checklist.md:228-229` — live call behavior and observability metadata for the existing voice runtime surfaces

---

## Description

Stop fighting the LiveKit media plane. Grove should not hardcode VAD-only interruption behavior or ad-hoc session knobs when LiveKit 1.5.1 already ships adaptive interruption handling, dynamic endpointing, and selective recording controls. This task maps Grove voice config into the LiveKit `TurnHandlingOptions` and `RecordingOptions` APIs and carries the LiveKit SDK version into post-call metadata.

## Subtasks

- [x] Map Grove voice turn-detection config onto LiveKit `TurnHandlingOptions`
- [x] Default interruption handling to LiveKit adaptive mode instead of forcing `vad`
- [x] Default endpointing to LiveKit dynamic mode unless config overrides it
- [x] Map optional tenant voice recording policy onto LiveKit `RecordingOptions`
- [x] Carry the LiveKit SDK version into the voice stack metadata persisted post-call
- [x] Update runtime tests for the new session-construction contract

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/config/schema.py` | Modify | Extend voice config schema with LiveKit 1.5 turn-handling and recording fields |
| `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` | Modify | Map Grove config into `TurnHandlingOptions` and `RecordingOptions` |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` | Modify | Use the new LiveKit options during `AgentSession` startup |
| `packages/grove-voice-livekit/tests/test_config_mapper.py` | Modify | Verify config-to-LiveKit mapping |
| `packages/grove-voice-livekit/tests/test_entrypoint.py` | Modify | Verify session construction and recording options |

## Acceptance Criteria

- [x] Voice runtime no longer forces interruption mode to `vad` by default
- [x] Voice runtime exposes LiveKit dynamic endpointing through mapped config
- [x] Voice runtime can pass selective recording policy into `session.start(...)`
- [x] Post-call voice stack metadata includes the LiveKit SDK version
- [x] Focused runtime tests pass

## Verification

```bash
uv run python -m pytest --import-mode=importlib \
  packages/grove-voice-livekit/tests/test_config_mapper.py \
  packages/grove-voice-livekit/tests/test_entrypoint.py \
  -q --tb=short
```

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
