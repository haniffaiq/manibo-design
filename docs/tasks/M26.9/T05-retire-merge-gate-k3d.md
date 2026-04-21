# T05: Retire merge-gate's `Run Full K8s Runtime Proof` k3d job

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T04 (release-pin PR auto-merge gate wired + 10 consecutive green staging E2E runs)

---

## Description

Once staging is taking E2E reliably, remove the `merge-runtime-full`
job from `.github/workflows/merge-gate.yml`. PR-scope merge-gate
becomes fast-only: unit + integration + contract + architecture
tests. No in-process k3d.

This is also what unblocks M26.10 T03 (CI runner cx43 → cx32 apply).

## Subtasks

- [ ] **Remove the `merge-runtime-full` job** block from
  `.github/workflows/merge-gate.yml`.
- [ ] **Delete `tools/scripts/ci/merge-gate/run-full-runtime.sh`**
  if nothing else calls it. Otherwise trim to the sub-phases that
  still belong pre-merge.
- [ ] **Remove `E2E_PYTEST_WORKERS` env** from the merge-gate job
  (introduced by M26.8; no longer relevant once k3d-in-CI is gone).
- [ ] **Update architecture tests** in
  `tests/architecture/test_ci_runtime_smoke_workflow.py` — remove
  tests that pin the merge-runtime-full job. Keep whatever still
  applies to the remaining fast lane.
- [ ] **Drop the k3d bootstrap composite action** from
  `.github/actions/k3d-job-bootstrap/` if only merge-runtime-full
  used it.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/merge-gate.yml` | Modify | Remove `merge-runtime-full` job definition; update the `gate` aggregator `needs:` list. |
| `tools/scripts/ci/merge-gate/run-full-runtime.sh` | Delete or slim | Gone unless another caller references it. |
| `tests/architecture/test_ci_runtime_smoke_workflow.py` | Modify | Remove tests for merge-runtime-full; keep fast-lane assertions. |
| `.github/actions/k3d-job-bootstrap/action.yml` | Delete | Orphaned after this change. |
| `wiki/architecture/ci.md` | Modify | Reflect the slim merge-gate. |

## Implementation Notes

1. **Do not land this PR before the acceptance criteria pass.**
   Specifically: 10 consecutive `push` events to main where
   staging-e2e succeeded and the release-pin PR auto-merged. That's
   evidence staging is actually catching what merge-runtime-full
   used to catch.
2. Removing `merge-runtime-full` drops merge-gate wall-clock from
   ~60m (worst) to ~15m. Cost of CI minutes drops accordingly.
3. Parallel task: delete any k3d-related infra on the heavy runner
   if it's no longer used. The heavy runner self-heal script may
   reference k3d; trim it.

## Acceptance Criteria

- [ ] `merge-runtime-full` job is absent from merge-gate.yml.
- [ ] `gate` job's `needs:` list updated; workflow passes on a
  no-op PR.
- [ ] Architecture suite green with the removed tests.
- [ ] No PR run triggers k3d boot in CI.
- [ ] 10 consecutive main pushes green pre-removal (gate criterion).

## Verification

```bash
# Fast suite
uv run python -m pytest tests/architecture/ -q

# Workflow syntax
actionlint .github/workflows/merge-gate.yml

# Dry push on a scratch branch, confirm merge-gate wall-clock
# drops to ~15m
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Unblocks: M26.10 T03 (CI runners cx43 -> cx32 apply) — task file lands in the separate M26.10 branch.
