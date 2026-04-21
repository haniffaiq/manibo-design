# T04: Align runner-pool terminology, health checks, and docs with the real fleet

> **Milestone**: M26.2-ci-workflow-clarity-and-test-surface-truth
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02
> **Planning Note**: Activated and completed on 2026-04-02 in branch `feat/M26.2-ci-workflow-clarity`.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.2 T04 - align runner pool terminology`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.2-ci-workflow-clarity`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.2/PROGRESS.md` for historical state

5. **Definition of Done**
   - All subtasks completed
   - Runner docs match reality
   - Monitoring/health surfaces use the same terminology
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.2/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

The repo currently mixes runner labels, runner pools, and physical-host assumptions. Clean that up so docs, health checks, and policy code all describe the same fleet without inflated terminology.

## Subtasks

- [x] **Settle runner vocabulary**: define physical runner host, runner label, and runner pool terms once.
- [x] **Update health/reporting surfaces**: ensure runner inventory and health checks speak the same language.
- [x] **Remove misleading labels from docs**: stop implying a larger or more isolated fleet than actually exists.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/ci-runner-prewarm-health.yml` | Modify | Align runner-pool health naming with the settled vocabulary |
| `.github/workflows/ci-duration-health.yml` | Modify | Merge/rename control-plane health naming without overstating topology |
| `.github/workflows/ci-scheduler-health.yml` | Modify | Merge/rename control-plane health naming without overstating topology |
| `.github/workflows/ci-metrics-summary.yml` | Modify | Keep monitoring workflow naming aligned with the published control-plane surface |
| `wiki/architecture/ci.md` | Modify | Clarify runner vocabulary and ownership |
| `infrastructure/terraform/hetzner/shared/ci-runner/main.tf` | Modify | Keep static runner labels/pools documented and aligned |
| `tools/agents/ci_control_plane_policy.py` | Modify | Keep the runner-pool policy source of truth aligned with the settled vocabulary |
| `tools/scripts/github_runner_inventory.py` | Modify | Report runner truth using the settled terminology |
| `tools/scripts/check_ci_runner_pool_presence.py` | Modify | Align labels/pools with docs |
| `tests/architecture/test_ci_runner_prewarm.py` | Modify | Lock the clarified runner contract |
| `tests/architecture/test_ci_duration_health.py` | Modify | Keep duration-health naming assertions aligned with the settled control-plane surface |
| `tests/architecture/test_ci_runner_health_slack_notification.py` | Modify | Keep runner-health reporting aligned with the settled vocabulary |

## Implementation Notes

- Honest terminology beats inflated topology diagrams.
- If multiple labels land on the same physical host, document that instead of pretending each label is a machine.
- Do not break existing routing just to make the names prettier.
- If workflow or runner terms change, update the policy source of truth and every health/notification consumer in the same task. Partial vocabulary cleanup is garbage.

## Acceptance Criteria

- [x] Docs, policy, health scripts, and health/notification tests use the same runner vocabulary.
- [x] Runner inventory distinguishes physical hosts from labels/pools.
- [x] The repo no longer overstates runner fleet size in CI explanations.

## Completion Notes

1. Monitoring workflows were renamed in place instead of being merged:
   - `Monitor - Runner Pool Health`
   - `Monitor - CI Duration Health`
   - `Monitor - CI Scheduler Health`
   - `Monitor - CI Metrics Summary`
2. The repo now defines four runner terms explicitly in `wiki/architecture/ci.md`: physical runner host / execution surface, runner service, runner label, and runner pool.
3. `tools/scripts/check_ci_runner_pool_presence.py` now reports runner-pool / runner-label identity separately from backing self-hosted host groups, and `tools/scripts/github_runner_inventory.py` exposes the host-group mapping used by those health surfaces.
4. `infra/ci-runner/main.tf` now labels Hetzner servers with `host_group`, not the misleading `pool` metadata key.

## References

- Milestone: [M26.2-ci-workflow-clarity-and-test-surface-truth.md](../../milestones/M26.2-ci-workflow-clarity-and-test-surface-truth.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md), `infrastructure/terraform/hetzner/shared/ci-runner/main.tf`
