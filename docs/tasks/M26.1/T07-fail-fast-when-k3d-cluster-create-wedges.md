# T07: Fail fast when `k3d cluster create` wedges

> **Milestone**: M26.1-bot-pr-recovery-control-plane-simplification
> **Status**: Complete
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `fix: M26.1 T07 - add k3d create watchdog`

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
   - Verify T06 is complete because this task builds on the same heavy-runner
     control-plane hardening lane.
   - Read the milestone document and `docs/tasks/M26.1/PROGRESS.md`.
   - Read `wiki/queries/2026-04-12-design-k3d-cluster-create-watchdog.md`.

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

Add a repo-owned watchdog around `k3d cluster create --wait` so the heavy-lane
bootstrap path fails fast when cluster creation wedges or the k3s server dies.
The release run must emit useful diagnostics on the first failed attempt
instead of burning the heavy runner until outer timeout or manual cancellation.

## Subtasks

- [x] **Supervise cluster create in the harness**: add an `infra/k3d_harness.py` helper
      command that runs one bounded cluster-create attempt, watches the server
      container, and exits non-zero with diagnostics on timeout or early death.
- [x] **Route `k3d-up.sh` through the watchdog**: replace the raw
      `k3d cluster create ... --wait` call with the harness command while
      keeping reclaim and bounded retries in the shell.
- [x] **Lock the contract in docs and tests**: update focused
      architecture/unit tests plus related CI wiki docs so the new watchdog
      behavior cannot drift silently.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/infra/k3d_harness.py` | Modify | Add the cluster-create watchdog command and diagnostics helpers |
| `tools/scripts/infra/k3d-up.sh` | Modify | Call the harness watchdog for cluster creation instead of raw `k3d cluster create --wait` |
| `tests/architecture/test_k3d_harness.py` | Modify | Prove timeout/server-death classification and diagnostics behavior |
| `tests/architecture/test_local_pre_pr_ci_harness.py` | Modify | Lock the shell-to-harness integration contract |
| `tests/architecture/test_k3d_bootstrap_cleanup.py` | Modify | Prove failed create attempts still reclaim cleanly before retry |
| `wiki/ops/ci-operations.md` | Modify | Document the new k3d create watchdog and failure classification |
| `wiki/ops/ci-hetzner-runner.md` | Modify | Document heavy-runner break-glass expectations now that repo-side create watchdog exists |

## Implementation Notes

Keep the watchdog logic in the Python harness so the contract is testable and
the shell stays boring. Do not move retry ownership out of `k3d-up.sh`. The
watchdog should fail fast on a dead server container, not just on elapsed time.

## Acceptance Criteria

- [x] A wedged `k3d cluster create` attempt fails within a bounded inner
      timeout rather than waiting for the outer startup monitor timeout.
- [x] If the k3s server container exits during create, the failure is reported
      on that same attempt with diagnostics.
- [x] `k3d-up.sh` still reclaims and retries cleanly after a failed create
      attempt.
- [x] Focused tests and CI wiki docs cover the new watchdog contract.

## Verification Evidence

- `uv run python -m pytest tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_k3d_bootstrap_cleanup.py -q --tb=short`
- `uv run ruff check tools/scripts/infra/k3d_harness.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_k3d_bootstrap_cleanup.py`
- `bash -n tools/scripts/infra/k3d-up.sh tools/scripts/e2e/monitor-k3d-startup.sh`

## References

- Milestone: [M26.1-bot-pr-recovery-control-plane-simplification.md](../../milestones/M26.1-bot-pr-recovery-control-plane-simplification.md)
- Design: [2026-04-12-design-k3d-cluster-create-watchdog.md](../../../wiki/queries/2026-04-12-design-k3d-cluster-create-watchdog.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
