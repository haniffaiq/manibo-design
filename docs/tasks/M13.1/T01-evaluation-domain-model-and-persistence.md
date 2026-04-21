# T01: Evaluation domain model and persistence

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

## Description

Define the persisted model for telephony evaluation definitions, evaluation runs, artifact metadata, correlation identifiers, statuses, and summary score fields. This is the durable source of truth for all later workflow, adapter, and API work.

## Subtasks

- [ ] Define evaluation definition, run, artifact, and score summary models
- [ ] Add persistence/retrieval seam in Platform Core
- [ ] Define correlation identifiers for provider call ids, platform `call_id`, and LiveKit room

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/evaluation/models.py` | Create | Typed domain models and enums |
| `packages/platform-core/src/platform_core/telephony/evaluation/store.py` | Create | Persistence seam |
| `packages/platform-core/tests/integration/test_telephony_eval_service.py` | Create | Persistence/service proof |

## Acceptance Criteria

- [ ] Evaluation definitions and runs have typed persisted models
- [ ] Run state supports setup, running, completed, failed, and cancelled
- [ ] Correlation ids are explicit fields, not unstructured metadata blobs
