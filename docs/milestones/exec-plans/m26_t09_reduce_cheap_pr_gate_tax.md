# M26 T09: Reduce Cheap PR Gate Tax

## Objective

Keep one required PR branch-protection surface (`gate`) while making cheap PRs actually cheap.

## Decisions

1. `docs_only` and `automation_fast_track` PRs keep `gate` but stop emitting `ci_ready_for_review_required=true`.
2. Required-review lanes keep `admission summary`; cheap docs-only and release-pin lanes skip it.
3. Fast repo checks remain the last non-gate proof for cheap PRs, so branch protection does not need PR-type carve-outs.

## Evidence

1. `uv run ruff check tools/agents/ci_control_plane_policy.py tools/scripts/classify_ci_scope.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_evaluate_ci_gate.py`
   - `All checks passed!`
2. `uv run ruff format tools/agents/ci_control_plane_policy.py tools/scripts/classify_ci_scope.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_evaluate_ci_gate.py --check`
   - `7 files already formatted`
3. `uv run pyright tools/agents/ci_control_plane_policy.py tools/scripts/classify_ci_scope.py`
   - `0 errors, 0 warnings, 0 informations`
4. `uv run python -m pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_evaluate_ci_gate.py -q`
   - `71 passed in 1.22s`

## Risks

1. Manual/debug `pr-admission.yml` still exists for replay tooling, so future changes can accidentally drift it away from the live `Merge gate` behavior again.
2. `admission summary` still exists for review-required lanes; if nobody needs that summary later, there is still more CI sludge left to delete.
