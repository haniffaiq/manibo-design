# T04: Inbound synthetic caller workflow

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03

## Description

Implement the workflow path that synthesizes a PSTN caller dialing the assistant DID, drives the scripted caller audio into the call, and captures enough evidence to evaluate the inbound conversation.

## Subtasks

- [ ] Add the inbound evaluation workflow/activity seam
- [ ] Drive deterministic caller prompts into the live call
- [ ] Persist inbound-specific artifacts and correlation data

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/temporal-worker/src/temporal_worker/workflows/telephony_eval_workflow.py` | Create | Orchestration for inbound eval runs |
| `apps/temporal-worker/src/temporal_worker/activities/telephony_eval.py` | Create | Inbound run activities |
| `packages/platform-core/tests/e2e/test_telephony_eval_workflow.py` | Create | Inbound workflow proof |

## Acceptance Criteria

- [ ] One inbound evaluation run can dial the assistant DID without a human handset
- [ ] Caller prompts and timestamps are persisted as run artifacts
- [ ] The run correlates provider, platform, and LiveKit identifiers
