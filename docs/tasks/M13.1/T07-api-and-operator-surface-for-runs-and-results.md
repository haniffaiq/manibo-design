# T07: API and operator surface for runs and results

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01, T06

## Description

Expose the evaluation subsystem through a narrow API surface that can create definitions, launch runs, list runs, and inspect results. This task is API-first; it does not commit the milestone to a large new UI.

## Subtasks

- [ ] Add route package for telephony evaluations
- [ ] Support create/list/get/start surfaces
- [ ] Return score summaries and artifact metadata without leaking provider internals by default

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/telephony_evaluations/router.py` | Create | Route owner |
| `apps/api/src/platform_api/routes/telephony_evaluations/schemas.py` | Create | Request/response models |
| `apps/api/src/platform_api/routes/telephony_evaluations/runtime.py` | Create | Route runtime/service calls |
| `apps/api/tests/integration/test_telephony_evaluations_api.py` | Create | API proof |

## Acceptance Criteria

- [ ] Evaluation definitions and runs are controllable through a narrow API surface
- [ ] Route files stay under 500 LOC by decomposition
- [ ] Result APIs return enough detail to debug failures without dumping raw provider payloads by default
