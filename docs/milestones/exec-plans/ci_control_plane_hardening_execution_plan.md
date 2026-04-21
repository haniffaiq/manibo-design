# CI Control-Plane Hardening Execution Plan

Status: Complete

## Goal

Make CI faster and less wasteful without lying about product quality.

The current failure mode is bad:

- product proof, repo contracts, and bot governance are entangled
- review policy is scattered across YAML, scripts, and string-fragile tests
- heavy k3d jobs duplicate bootstrap steps
- governance jobs burn heavy runners
- control-plane failures are too often indistinguishable from product regressions

## Backlog

1. Separate product correctness from bot/process policy.
   - Status: Complete
   - Evidence:
     - `tools/agents/ci_control_plane_policy.py`
     - `tools/scripts/evaluate_ci_gate.py`

2. Stop blocking merges on a slow reviewer bot without a fallback.
   - Status: Complete
   - Evidence:
     - `tools/agents/ci_control_plane_policy.py`
     - `tools/agents/pr_review_bot.py`

3. Move CI policy into one tested config model.
   - Status: Complete
   - Evidence:
     - `tools/agents/ci_control_plane_policy.py`
     - `tests/architecture/test_ci_control_plane_policy.py`

4. Kill string-fragile workflow tests where possible.
   - Status: Complete
   - Evidence:
     - `tests/architecture/test_ci_runtime_smoke_workflow.py`
     - `tests/architecture/test_pr_orchestrator_queue_controls.py`

5. Reuse a common bootstrap for heavy k3d jobs.
   - Status: Complete
   - Evidence:
     - `.github/actions/k3d-job-bootstrap/action.yml`
     - `.github/workflows/ci.yml`
     - `.github/workflows/merge-group-full.yml`

6. Move stateful orchestration logic out of shell where it has grown too far.
   - Status: Complete
   - Evidence:
     - `tools/scripts/evaluate_ci_gate.py`

7. Make review/bot jobs non-starving relative to correctness jobs.
   - Status: Complete
   - Evidence:
     - `.github/workflows/ci.yml`

8. Make review depth depend on scope.
   - Status: Complete
   - Evidence:
     - `tools/agents/ci_control_plane_policy.py`
     - `tools/scripts/classify_ci_scope.py`

9. Classify failures as infra vs policy vs contract drift vs product.
   - Status: Complete
   - Evidence:
     - `tools/agents/ci_control_plane_policy.py`
     - `tools/scripts/evaluate_ci_gate.py`
     - `tools/scripts/aggregate_ci_metrics.py`

10. Improve CI observability itself: queue time, runner delay, step timing, SLOs.
    - Status: Complete
    - Evidence:
      - `tools/scripts/aggregate_ci_metrics.py`
      - `tests/architecture/test_ci_metrics_aggregation.py`
      - `wiki/architecture/ci.md`

## Verification

- `uv run ruff check ...`
- `uv run ruff format ... --check`
- `uv run pytest tests/architecture/test_pr_review_policy.py tests/architecture/test_pr_mergeability_guard.py tests/architecture/test_ci_runtime_smoke_workflow.py tests/architecture/test_pr_orchestrator_queue_controls.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_evaluate_ci_gate.py tests/architecture/test_ci_metrics_aggregation.py -q --tb=short`
- `tools/scripts/run_local_pre_pr_ci.sh --base-ref origin/main`
- YAML parseability of `.github/workflows/ci.yml` and `.github/workflows/merge-group-full.yml`

## Remaining risk

- Review fallback is intentionally narrow. If we widen it carelessly, we will create fake green merges.
- CI policy still spans workflow YAML and Python because GitHub Actions cannot natively consume a typed config object for job graphs.
- The real proof bar is unchanged: merge queue and runtime-heavy jobs still own latest-main truth.
