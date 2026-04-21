# T02: Introduce `E2E_PYTEST_WORKERS` env gate in `run-k3d-e2e.sh` and wire CI to `=2`

> **Milestone**: M26.8-in-cluster-test-parallelism
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Teach `tools/scripts/e2e/run-k3d-e2e.sh` to read an `E2E_PYTEST_WORKERS` env
var and pass it to pytest as `-n ${workers} --dist loadfile`. Default is
single-worker behaviour (unset or `1`) so local developers and ad-hoc
invocations are unchanged. Wire the merge-gate workflow to export
`E2E_PYTEST_WORKERS=2` only in the `Run Full K8s Runtime Proof` job so the
rollout is scoped to the heavy lane that actually runs the in-cluster pytest
phase.

## Subtasks

- [ ] **Script change**: modify `tools/scripts/e2e/run-k3d-e2e.sh:664-668` to
  build a `pytest_extra_args` array, add `-n "${workers}" --dist loadfile`
  when `E2E_PYTEST_WORKERS` is set to an integer ≥ 2 or the literal `auto`,
  and pass the array to `uv run python -m pytest`.
- [ ] **Input validation**: fail fast with a clear message when the env var
  is set to something other than a positive integer or `auto`.
- [ ] **CI wiring**: export `E2E_PYTEST_WORKERS: "2"` in the env block of the
  `Run Full K8s Runtime Proof` job in `.github/workflows/merge-gate.yml`.
  Do NOT add it to `pr-admission.yml` — PR-scope does not run k3d.
- [ ] **Architecture test**: extend
  `tests/architecture/test_ci_runtime_smoke_workflow.py` with a case that
  asserts the env var is set on exactly the intended job and is a plain
  integer or `auto`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/e2e/run-k3d-e2e.sh` | Modify | Add `E2E_PYTEST_WORKERS` handling before the final pytest invocation. Exact change shown in Implementation Notes. |
| `.github/workflows/merge-gate.yml` | Modify | Add `E2E_PYTEST_WORKERS: "2"` to the `Run Full K8s Runtime Proof` job env block. |
| `tests/architecture/test_ci_runtime_smoke_workflow.py` | Modify | Add one assertion covering the env var presence on the heavy job only. |

## Implementation Notes

1. Replace the trailing pytest invocation at
   `tools/scripts/e2e/run-k3d-e2e.sh:660-668` with this shape (keep the
   existing `fail_with_class` on non-zero exit):

   ```bash
   if [[ "$#" -eq 0 ]]; then
     set -- apps/api/tests/e2e/test_release_rollout_compose_e2e.py
   fi

   pytest_extra_args=()
   workers="${E2E_PYTEST_WORKERS:-}"
   if [[ -n "${workers}" && "${workers}" != "1" ]]; then
     if [[ "${workers}" == "auto" || "${workers}" =~ ^[1-9][0-9]*$ ]]; then
       pytest_extra_args+=(-n "${workers}" --dist loadfile)
     else
       echo "E2E_PYTEST_WORKERS must be a positive integer or 'auto' (got: ${workers})" >&2
       exit 2
     fi
   fi

   echo "Running E2E tests (workers=${workers:-1}): $*"
   if ! uv run python -m pytest "${pytest_extra_args[@]}" "$@" -q --tb=short; then
     fail_with_class "harness_verdict_failure" "pytest" \
       "Cluster-backed pytest suite failed: $*"
   fi
   ```

2. `--dist loadfile` groups tests by file across workers. This preserves any
   within-file ordering assumptions (fixtures that set up then tear down in a
   single file stay on one worker). It is the safest distribution for a
   first-pass xdist rollout and avoids surfacing false flake from cross-file
   fixture coupling.
3. The env export belongs in the job's `env:` block, not in a step's env, so
   every step of the heavy job sees it consistently (including any future
   step that re-invokes the script).
4. The architecture test should use the existing YAML parser path in
   `tests/architecture/test_ci_runtime_smoke_workflow.py` (not a fresh
   regex); find the precedent in the file and add one test function.
5. Do not change `K3D_RESET_CLUSTER_ON_CI`, cluster name seeding, or any
   M26.4 isolation primitive. If the change surface feels larger than the
   file list above, stop and re-scope with the human.

## Acceptance Criteria

- [ ] `E2E_PYTEST_WORKERS=2 tools/scripts/e2e/run-k3d-e2e.sh apps/api/tests/e2e/test_release_rollout_compose_e2e.py` runs pytest with `-n 2 --dist loadfile` against a local k3d cluster and exits green.
- [ ] Unset/empty `E2E_PYTEST_WORKERS` leaves the pytest command identical
  to the pre-change behaviour.
- [ ] Setting `E2E_PYTEST_WORKERS=garbage` fails fast with exit code 2 and
  an actionable error message including the offending value.
- [ ] `merge-gate.yml` has `E2E_PYTEST_WORKERS: "2"` on the `Run Full K8s
  Runtime Proof` job env block and nowhere else.
- [ ] `tests/architecture/test_ci_runtime_smoke_workflow.py` passes and
  covers the new env-var wiring.

## Verification

```bash
# Local dry-run: confirm unset is a no-op
E2E_PYTEST_WORKERS= tools/scripts/e2e/run-k3d-e2e.sh --help 2>&1 | head -5 || true

# Input validation
E2E_PYTEST_WORKERS=garbage tools/scripts/e2e/run-k3d-e2e.sh --command true; echo "exit=$?"

# Architecture tests
uv run python -m pytest tests/architecture/test_ci_runtime_smoke_workflow.py -q

# Shell syntax gate
bash -n tools/scripts/e2e/run-k3d-e2e.sh

# Full local k3d loop (heavier; run if you are touching the script seriously)
E2E_PYTEST_WORKERS=2 tools/scripts/e2e/run-k3d-e2e.sh \
  apps/api/tests/e2e/test_release_rollout_compose_e2e.py
```

## References

- Milestone: [M26.8-in-cluster-test-parallelism.md](../../milestones/M26.8-in-cluster-test-parallelism.md)
- Depends on: [T01-add-pytest-xdist-and-audit-fixtures.md](T01-add-pytest-xdist-and-audit-fixtures.md)
- Current pytest invocation: `tools/scripts/e2e/run-k3d-e2e.sh:660-668`
- Merge-gate heavy job: `.github/workflows/merge-gate.yml` (search for `Run Full K8s Runtime Proof`)
- Architecture harness: `tests/architecture/test_ci_runtime_smoke_workflow.py`
