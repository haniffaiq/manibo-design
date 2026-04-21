# T06: Scoring and evidence correlation

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T03, T04, T05

## Description

Build the scoring layer that turns transport evidence, turn metrics, logs, transcripts, and scenario expectations into a machine-readable scorecard with explainable failure reasons.

## Subtasks

- [ ] Define transport, turn-quality, and semantic outcome score sections
- [ ] Correlate provider ids, platform `call_id`, LiveKit room, and run artifacts
- [ ] Detect empty turns, truncation, interruption churn, and excessive latency

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/evaluation/scoring.py` | Create | Score model and scoring logic |
| `packages/platform-core/tests/unit/test_telephony_eval_scoring.py` | Create | Scoring proof |
| `packages/platform-core/tests/integration/test_telephony_eval_service.py` | Modify | End-to-end correlation proof |

## Acceptance Criteria

- [ ] Scorecards expose transport, latency, interruption, and semantic sections
- [ ] Failures are explainable from persisted evidence, not just pass/fail
- [ ] Existing voice observability signals are reused rather than duplicated
