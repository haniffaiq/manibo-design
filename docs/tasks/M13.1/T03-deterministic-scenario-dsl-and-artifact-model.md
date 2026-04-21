# T03: Deterministic scenario DSL and artifact model

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

## Description

Define the deterministic scenario format used by synthetic telephony runs: caller utterances, pauses, expected slots, expected outcomes, thresholds, and artifact retention rules.

## Subtasks

- [ ] Define scenario YAML schema and validation
- [ ] Define artifact metadata for audio, transcript, webhook timeline, and score payloads
- [ ] Add shared neutral fixtures plus one solution-owned clinic-registration scenario

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/evaluation/scenarios.py` | Create | Scenario schema and loader |
| `packages/platform-core/src/platform_core/telephony/evaluation/artifacts.py` | Create | Artifact metadata model |
| `packages/platform-core/tests/fixtures/telephony_eval/` | Create | Shared neutral scenario fixtures |
| `solutions/appointment_booking/tests/fixtures/telephony_eval/` | Create | Solution-owned clinic-registration scenarios |

## Acceptance Criteria

- [ ] Scenario definitions are typed and validated before execution
- [ ] Artifact metadata supports later retrieval without guessing from file names
- [ ] Shared platform fixtures stay solution-neutral
- [ ] At least one clinic-registration scenario is encoded as a solution-owned reusable fixture
