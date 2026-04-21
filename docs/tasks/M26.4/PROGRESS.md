# M26.4: Mainline K3d Proof Consolidation — Progress

## Status

Completed in the active worktree on 2026-04-03. M26.4 was explicitly activated to remove PR-scoped `k3d` proof, fold traceability into the authoritative mainline full-runtime lane, and align the docs/harness truth with that topology.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Fold the traceability harness into mainline full runtime proof | Completed | 2026-04-03 |
| T02 | Remove PR-scoped runtime proof jobs and simplify gate policy | Completed | 2026-04-03 |
| T03 | Align docs, local harnesses, and release/nightly ownership with mainline `k3d` truth | Completed | 2026-04-03 |
| T04 | Verification, cleanup, and proof capture | Completed | 2026-04-03 |

## Notes

1. This milestone is about workflow topology simplification, not about inventing a persistent shared cluster. The only honest reuse is one `k3d` bootstrap inside one mainline proof run.
2. The traceability harness now runs inside `tools/scripts/ci/merge-gate/run-full-runtime.sh` on the already-booted mainline/release `k3d` cluster, so deleting the PR traceability lane does not create a coverage hole.
3. `Run Targeted Runtime Smoke`, `Run Traceability Smoke`, and `Run Targeted K8s Requirement Proof` are removed from active and manual PR workflow topology. PRs stay non-runtime; mainline/release/nightly own runtime proof.
4. Frontend-related PRs and mainline runs now own real `apps/web` proof through `pnpm --filter @nfq/web test` plus `tools/scripts/e2e/run-web-e2e.sh` when frontend or coupled backend/API/auth scope is present.
5. Checklist row materially advanced: row 63 (`Release-control CI provides deterministic PR proof, runner-lane routing, and merge finalization for client delivery changes`).

## Verification

1. `uv run pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_ci_runtime_smoke_workflow.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_evaluate_ci_gate.py tests/architecture/test_ci_scope_image_refresh.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_inventory_truth.py -q --tb=short`
   Result: `155 passed in 1.44s`
2. `uv run pytest tests/architecture/test_regression_e2e_workflow.py tests/architecture/test_release_deploy_workflow.py -q --tb=short`
   Result: `6 passed in 0.06s`
3. `uv run ruff check tools/agents/ci_control_plane_gate_policy.py tools/agents/ci_control_plane_policy.py tools/agents/pr_review_policy.py tools/scripts/classify_ci_scope.py tools/scripts/run_bot_pr_admission_checks.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_ci_runtime_smoke_workflow.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_evaluate_ci_gate.py tests/architecture/test_ci_scope_image_refresh.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_inventory_truth.py`
   Result: `All checks passed!`
4. `uv run ruff format --check tools/agents/ci_control_plane_gate_policy.py tools/agents/ci_control_plane_policy.py tools/agents/pr_review_policy.py tools/scripts/classify_ci_scope.py tools/scripts/run_bot_pr_admission_checks.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_ci_runtime_smoke_workflow.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_evaluate_ci_gate.py tests/architecture/test_ci_scope_image_refresh.py tests/architecture/test_pr_review_policy.py tests/architecture/test_ci_control_plane_inventory_truth.py`
   Result: `15 files already formatted`
5. `uv run pyright -p pyrightconfig.ci.json`
   Result: `0 errors, 0 warnings, 0 informations`
6. `python3 tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
   Result: `Repo=✅ evidence issues: 0`
7. `bash -n tools/scripts/ci/merge-gate/validate-product.sh tools/scripts/ci/merge-gate/run-full-runtime.sh tools/scripts/review/pre-pr-ci.sh tools/scripts/review/pre-push-guard.sh`
   Result: success
