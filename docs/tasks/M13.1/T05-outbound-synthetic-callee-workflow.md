# T05: Outbound synthetic callee workflow

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03

## Description

Implement the workflow path that reuses the existing product-owned outbound call trigger, answers as a synthetic callee, and scores the assistant’s side of the outbound call.

## Subtasks

- [ ] Reuse `POST /calls/test-call` as the product outbound trigger
- [ ] Attach the evaluator as the callee side of the call
- [ ] Persist outbound-specific artifacts and correlation data

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/evaluation/service.py` | Modify | Outbound run orchestration seam |
| `apps/temporal-worker/src/temporal_worker/activities/telephony_eval.py` | Modify | Outbound run activities |
| `packages/platform-core/tests/e2e/test_telephony_eval_workflow.py` | Modify | Outbound workflow proof |

## Acceptance Criteria

- [ ] One outbound evaluation run can be launched without a human callee
- [ ] The existing outbound product trigger remains the source of truth
- [ ] Outbound runs produce the same artifact and scoring surfaces as inbound runs
