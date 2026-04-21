# T08: Scheduling, docs, and rollout guardrails

> **Milestone**: M13.1-telephony-autonomous-evaluation
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T04, T05, T06, T07

## Description

Add periodic-run support, document the local/cloud evaluation recipes, and define the rollout guardrails so this framework improves confidence without becoming fake CI theater.

## Subtasks

- [ ] Define scheduled evaluation-run support
- [ ] Document self-hosted and cloud recipes
- [ ] Define non-blocking rollout rules and expected alert/report surfaces

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/temporal-worker/src/temporal_worker/workflows/telephony_eval_workflow.py` | Modify | Scheduling support |
| `wiki/ops/voice-call-local-demo.md` | Modify | Local evaluation recipe |
| `wiki/systems/observability.md` | Modify | How evaluation runs consume voice metrics |
| `docs/tasks/M13.1/PROGRESS.md` | Modify | Rollout evidence |

## Acceptance Criteria

- [ ] The framework can run on a schedule without pretending to be a merge gate
- [ ] Local self-hosted and cloud recipes are documented
- [ ] Rollout guidance explains where this framework is authoritative and where human review still matters
