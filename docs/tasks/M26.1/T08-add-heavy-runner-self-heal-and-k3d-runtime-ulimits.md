# T08: Add heavy-runner self-heal and k3d runtime ulimits

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: T07

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `fix: M26.1 T08 - add heavy runner self-heal`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: use a fresh `fix/M26.1-*` branch from current `main`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify T07 is complete because this task extends the same heavy-runner
     runtime hardening path.
   - Read the milestone document and `docs/tasks/M26.1/PROGRESS.md`.
   - Read `wiki/queries/2026-04-14-design-ci-heavy-runner-self-healing.md`.

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

Add a repo-owned self-heal path for the single heavy runner so reclaimable disk
pressure and leaked k3d state do not keep taking down `merge-heavy`,
`infra-heavy`, and `regression-heavy`. Also wire an explicit high `nofile`
ulimit into the k3d node container create path so the observed
`fsnotify` / `inotify_init` failures stop depending on the container default.

## Subtasks

- [x] **Add heavy-runner self-heal**: create a repo-owned repair script that
      reuses the isolated-checkout cleaner, sweeps leaked k3d clusters, and
      optionally restores the warm floor after destructive cleanup.
- [x] **Wire self-heal into heavy validation/bootstrap**: run the repair path
      from heavy runner-health validation and from the shared k3d bootstrap
      action before cluster startup.
- [x] **Raise k3d node runtime limits**: extend the harness and `k3d-up.sh`
      contract so `k3d cluster create` passes an explicit high `nofile` limit.
- [x] **Lock docs and tests**: update focused architecture/unit tests plus CI
      runner docs so the new contract cannot drift silently.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/ci/runner/heavy-runner-self-heal.sh` | Create | Repo-owned heavy-runner repair path for disk pressure and leaked k3d state |
| `.github/workflows/ci-runner-prewarm-health.yml` | Modify | Let heavy runner-health attempt repair before failing on reclaimable pressure |
| `.github/actions/k3d-job-bootstrap/action.yml` | Modify | Run heavy-runner self-heal before stack startup |
| `tools/scripts/infra/k3d_harness.py` | Modify | Pass runtime ulimits into `k3d cluster create` |
| `tools/scripts/infra/k3d-up.sh` | Modify | Wire the runtime-ulimit contract into the harness call |
| `tests/architecture/test_ci_runner_prewarm_workflow.py` | Modify | Lock the heavy runner-health repair contract |
| `tests/architecture/test_k3d_bootstrap_cleanup.py` | Modify | Lock the bootstrap self-heal contract |
| `tests/architecture/test_k3d_harness.py` | Modify | Prove the create command includes runtime ulimits |
| `wiki/ops/ci-operations.md` | Modify | Document the real heavy-runner failure chain and self-heal path |
| `wiki/ops/ci-hetzner-runner.md` | Modify | Document heavy-host cleanup and k3d runtime-limit expectations |

## Implementation Notes

Keep the repair path boring. Reuse `clean-isolated-checkout.sh` and the existing
k3d/docker primitives instead of inventing another cleanup subsystem. The
bootstrap path should not blindly destroy the warm floor when the host is
healthy; only the validation/recovery path should restore it after destructive
cleanup.

## Acceptance Criteria

- [x] Heavy runner-health attempts repo-owned repair before reporting
      reclaimable disk pressure as a hard failure.
- [x] The shared heavy bootstrap action reclaims leaked k3d state before
      starting a new stack and only uses destructive prune when the host is
      already under disk pressure.
- [x] `k3d cluster create` passes an explicit high `nofile` runtime ulimit.
- [x] Focused tests and CI runner docs cover the new contract.

## Verification Evidence

- `uv run python -m pytest tests/architecture/test_ci_runner_heavy_self_heal.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_k3d_bootstrap_cleanup.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py -q --tb=short`
- `uv run ruff check tools/scripts/infra/k3d_harness.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_k3d_bootstrap_cleanup.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py`
- `bash -n tools/scripts/ci/runner/heavy-runner-self-heal.sh tools/scripts/infra/k3d-up.sh tools/scripts/e2e/monitor-k3d-startup.sh`

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Design: [2026-04-14-design-ci-heavy-runner-self-healing.md](../../../wiki/queries/2026-04-14-design-ci-heavy-runner-self-healing.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
