## Objective

Complete M26 T07 by shrinking `.github/workflows/merge-gate.yml` below the repo file-size gate, moving the cheap stateless fast path to GitHub-hosted runners, and keeping review plus runtime-heavy proof on self-hosted runners.

## Assumptions

1. T01-T06 and T10 are already merged even though some milestone/progress docs are stale.
2. The checklist row advanced by this task is `docs/requirements/checklist.md:63`.
3. Branch-protection-facing job names must remain unchanged: `fast repo checks`, `fast product checks`, `manibo-bot review (required)`, `merge readiness`, and `gate`.

## Decisions

1. Keep `Merge gate` as the only live PR workflow.
2. Reuse existing runner-output names (`control_runs_on_json`, `shared_control_runs_on_json`, `gate_runs_on_json`) but change the fast-path values to GitHub-hosted instead of self-hosted control.
3. Leave `automation`, `bots`, `heavy`, `artifact`, and `infra` pools self-hosted.
4. Push bulky workflow shell bodies into `tools/scripts/ci_merge_gate_*.sh`; keep YAML limited to job wiring plus action orchestration.

## Actions

1. Read milestone/task/ops/review docs plus current workflow, classifier, policy, and topology tests.
2. Confirm current `merge-gate.yml` size is 1214 lines and still allowlisted.
3. Identify current fast-path runner coupling: `changes`, `fast repo checks`, `fast product checks`, and `gate` still route through the self-hosted control lane.
4. Shrink `merge-gate.yml` to 699 lines by moving bulky shell bodies into `tools/scripts/ci_merge_gate_*.sh` helpers.
5. Move the stateless fast path to GitHub-hosted `ubuntu-24.04` while keeping `bots` plus heavy/runtime proof self-hosted.
6. Update milestone/task/ops/review docs to match the new runner topology and the already-landed T06/T10 truth.
7. Fix follow-on regressions the refactor exposed: missing `requirements_checklist_k8s_required` export, stale CI metrics aggregation/budget tests, and missing artifact-profile queue-SLO token wiring.

## Evidence

1. `git branch --show-current` in the clean PR worktree: `feat/M26-t07-split-merge-gate-r3`
2. `git status --short` in the clean PR worktree shows only T07-scoped edits plus the extracted helper scripts.
3. Final size check: `wc -l .github/workflows/merge-gate.yml tools/agents/ci_control_plane_policy.py tools/scripts/aggregate_ci_metrics.py tests/architecture/test_ci_control_plane_policy.py` -> `700`, `1029`, `779`, `697`
4. Static proof:
   - `uv run pyright -p pyrightconfig.ci.json` -> `0 errors, 0 warnings, 0 informations`
   - `uv run ruff check tests/architecture tools/agents tools/scripts` -> `All checks passed!`
   - `uv run ruff format tests/architecture tools/agents tools/scripts --check` -> `163 files already formatted`
5. Targeted T07 architecture proof:
   - `UV_CACHE_DIR=/tmp/uv-cache-manibo uv run pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_topology.py tests/architecture/test_ci_runtime_smoke_workflow.py tests/architecture/test_classify_ci_scope_matrix.py tests/architecture/test_evaluate_ci_gate.py tests/architecture/test_ci_metrics_aggregation.py tests/architecture/test_ci_metrics_budget.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_repo_file_size.py -q` -> `174 passed in 9.73s`
   - `UV_CACHE_DIR=/tmp/uv-cache-manibo uv run pytest tests/architecture/test_ci_runner_prewarm.py tests/architecture/test_ci_runner_warm_floor_defaults.py tests/architecture/test_local_pre_pr_ci_harness.py -q` -> `45 passed in 0.15s`
   - `UV_CACHE_DIR=/tmp/uv-cache-manibo uv run pytest tests/architecture/test_pr_review_policy.py -q` -> `11 passed in 0.03s`
   - `uv run pytest tests/architecture/test_repo_file_size.py -q` -> `4 passed in 2.35s`
6. YAML and helper-script sanity:
   - `python3 - <<'PY' ... yaml.safe_load('.github/workflows/merge-gate.yml') ... PY` -> `yaml ok`
   - `bash -n tools/scripts/ci_cleanup_isolated_checkout.sh tools/scripts/ci_collect_traceability_artifacts.sh tools/scripts/ci_dump_platform_k8s_logs.sh tools/scripts/ci_expose_k3d_bootstrap_action.sh tools/scripts/ci_merge_gate_artifact_profile_proof.sh tools/scripts/ci_merge_gate_changes.sh tools/scripts/ci_merge_gate_merge_readiness.sh tools/scripts/ci_merge_gate_pr_static_prepare.sh tools/scripts/ci_merge_gate_pr_traceability_harness.sh` -> success
7. Local pre-PR CI:
   - `tools/scripts/run_local_pre_pr_ci.sh --full` clears the static, architecture, k3d bootstrap, image-build, and most cluster-backed proof phases, but the final cluster-backed E2E tranche still fails in unrelated product/runtime tests outside T07 scope:
     - `packages/platform-core/tests/e2e/test_observability_traceability_compose.py::test_interactive_channel_session_traceability_canary`
     - `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py::test_wave6_model_fallback_on_simulated_provider_failure_emits_audit_event`
     - `packages/platform-core/tests/e2e/test_wave7_connectors_compose.py::test_connector_health_check_appends_rows`
     - `packages/platform-core/tests/e2e/test_wave7_tenant_state_enforcement_compose.py::test_wave7_tenant_state_blocks_tenant_scoped_writes_no_side_effects`
8. Local review lanes on the clean T07 worktree:
   - `tools/scripts/run_local_pr_review.sh origin/main pre_ci` -> `No blocking findings.`
   - `tools/scripts/run_local_pr_review.sh origin/main post_ci` -> only `P3` doc-truth findings, resolved in this worktree.

## Risks

1. Runner-output changes touch shared policy tests and manual replay workflow expectations, so stale assertions will fail until they are updated deliberately.
2. The repo file-size baseline test compares against stale `origin/main`, so unrelated pre-existing drift still shows up locally even after T07-specific files are fixed.
3. This worktree branch already contains committed M1.3 docs changes unrelated to T07, and local `pre_ci` review flags those docs as an API/requirements contract mismatch.

## Next Steps

1. Run the remaining required verification (`pyright`, `ruff`, repo-size test, local pre/post review lanes) on the final doc-backed diff.
2. If this branch is going to be used for a PR, either drop the unrelated committed M1.3 docs from the branch or fix that contract drift before opening it.
3. Keep the repo-size evidence explicit: the only remaining red is the unrelated stale-`origin/main` baseline drift in five pre-existing files, not T07.
