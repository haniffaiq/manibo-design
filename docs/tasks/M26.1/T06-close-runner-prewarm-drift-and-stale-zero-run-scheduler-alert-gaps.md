# T06: Close runner prewarm drift and stale zero-run scheduler alert gaps

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `fix: M26.1 T06 - close scheduler and runner drift gaps`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: use the active implementation branch `feat/M26.1-control-plane-implementation` or a fresh `fix/M26.1-*` branch from current `main`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - M26.1 is active. Verify the latest implementation and progress state before changing anything else.
   - Verify T02 is complete because this task tightens the stale-zero-run rescue contract it introduced.
   - Read the milestone document and `docs/tasks/M26.1/PROGRESS.md`

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.1/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Close the two CI self-heal gaps that still leak manual operator work after M26.1. Scheduler health should stop alerting immediately after a successful suite rerequest, and runner bootstrap should stop leaving existing heavy hosts on stale prewarm host assets from first-boot `cloud-init`.

## Subtasks

- [x] **Reset scheduler stall age on rerequest activity**: teach zero-run scheduler health to age suites from their latest GitHub activity, not immutable creation time.
- [x] **Reconcile heavy-runner prewarm host assets during bootstrap**: make bootstrap and rollout refresh the current host-side prewarm scripts and units before relying on the staged checkout warm-floor flow.
- [x] **Lock the repaired contract in docs and architecture tests**: update `wiki/architecture/ci.md` and focused CI architecture tests so the new behavior cannot drift again silently.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/check_ci_scheduler_health.py` | Modify | Age stale zero-run suites from latest suite activity so rerequested suites get a real cooldown window |
| `tools/scripts/ci/runner/bootstrap-runners.sh` | Modify | Reconcile current prewarm host assets onto existing hosts during bootstrap |
| `tools/scripts/ci/runner/rollout-runners.sh` | Modify | Reconcile current prewarm host assets during heavy-host rollout warm-floor recovery |
| `tools/scripts/ci/runner/render_cloud_init_file.py` | Create | Render canonical runner host assets from the cloud-init template for bootstrap-time reconciliation |
| `tests/architecture/test_ci_scheduler_health.py` | Modify | Prove rerequest activity resets the stall clock |
| `tests/architecture/test_ci_runner_bootstrap_rollout_contract.py` | Create | Keep the bootstrap/rollout host-asset reconciliation contract under the repo file-size ceiling |
| `tests/architecture/test_ci_runner_prewarm_workflow.py` | Modify | Prove bootstrap and rollout reconcile host assets before starting prewarm |
| `tests/architecture/test_ci_runner_prewarm_service.py` | Modify | Prove the renderer matches canonical cloud-init content |
| `wiki/architecture/ci.md` | Modify | Document the repaired scheduler and runner host self-heal contracts |

## Implementation Notes

Prefer reusing the canonical cloud-init content for host asset reconciliation instead of hand-maintaining another shadow copy. For scheduler health, do not mutate human PR branches just to rescue a stale suite; use the rerequest path first and make the health monitor respect the resulting suite activity.

## Acceptance Criteria

- [x] A successful zero-run suite rerequest resets the scheduler-health stall age, so the 30-second post-repair recheck only fails when the suite still has no new activity.
- [x] `bootstrap-runners.sh` and the heavy-host rollout path refresh the current prewarm host scripts and units before starting `grove-ci-prewarm.service`.
- [x] `wiki/architecture/ci.md` distinguishes scheduler rerequest cooldown from the separate follow-up-only empty-refresh path for reviewed bot PRs.

## Verification Evidence

- `uv run python -m pytest tests/architecture/test_ci_scheduler_health.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_ci_runner_prewarm_service.py tests/architecture/test_ci_runner_warm_floor_defaults.py -q --tb=short`
- `uv run ruff check tools/scripts/check_ci_scheduler_health.py tools/scripts/ci/runner/render_cloud_init_file.py tests/architecture/test_ci_scheduler_health.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_ci_runner_prewarm_service.py tests/architecture/test_ci_runner_warm_floor_defaults.py`
- `bash -n tools/scripts/ci/runner/bootstrap-runners.sh tools/scripts/ci/runner/rollout-runners.sh`
- `uv run python tools/scripts/ci/runner/render_cloud_init_file.py --path /usr/local/bin/grove-ci-prewarm.sh >/dev/null`

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
