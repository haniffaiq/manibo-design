# M26.1: Bot PR Recovery + Control Plane Simplification — Progress

## Status

Implementation started on PR `#742` from branch `feat/M26.1-control-plane-implementation`, and follow-on hardening continues on `fix/M26.1-ci-repair-hardening`. The new follow-up work first closed two drift gaps discovered after the original implementation shipped, then added heavy-runner create watchdog hardening, and now tracks one more heavy-host repair loop discovered from live production failures: reclaimable disk pressure still burns the only heavy runner until idle-clean finally gets a window, and the k3d node container still starts with the default soft `nofile=1024`.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Extract shared tracked PR state contract | Complete | 2026-03-29 |
| T02 | Make workflow dispatch ref-aware and add PR-head gate rescue | Complete | 2026-03-29 |
| T03 | Canonicalize review signal handling and simplify blocking artifacts | Complete | 2026-03-29 |
| T04 | Split follow-up policy from side effects and replace the action blob | Complete | 2026-03-29 |
| T05 | Finish fingerprint contract centralization across issue and PR bots | Complete | 2026-03-29 |
| T06 | Close runner prewarm drift and stale zero-run scheduler alert gaps | Complete | 2026-04-07 |
| T07 | Fail fast when `k3d cluster create` wedges | Complete | 2026-04-12 |
| T08 | Add heavy-runner self-heal and k3d runtime ulimits | Complete | 2026-04-14 |

## Notes

Implementation notes:

1. `Merge gate` remains the only live PR workflow; gate rescue first rerequests stale zero-run current-head check suites and only falls back to one bounded empty refresh commit when the PR head stays stale with no suite to rescue.
2. `manibo-bot review (required)` remains the single merge-critical review authority. Blocking top-level summary comments are fallback-only when formal request-changes posting fails.
3. `tools/agents/tracked_pr_state.py` is now the shared contract for orchestrator, follow-up, mergeability, and review bot PR/check parsing.
4. `tools/agents/pr_followup_policy.py` owns typed follow-up decisions and reason codes; `pr_followup.py` records those decisions in `run_summary.json` even when no action executes.
5. Fingerprint marker rendering/injection is shared in `tools/agents/root_cause_fingerprints.py` and consumed by issue upsert plus issue/PR bot flows.
6. T06 tightened the runtime contract around those foundations without adding new CI topology: scheduler-health now respects latest suite activity after rerequest before alerting, and runner bootstrap/rollout reapply the current prewarm and cleanup host assets from `cloud-init` before warming the heavy host.
7. Verified on 2026-04-07 with `uv run python -m pytest tests/architecture/test_ci_scheduler_health.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_ci_runner_prewarm_service.py tests/architecture/test_ci_runner_warm_floor_defaults.py -q --tb=short` and `uv run ruff check tools/scripts/check_ci_scheduler_health.py tools/scripts/ci/runner/render_cloud_init_file.py tests/architecture/test_ci_scheduler_health.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_ci_runner_prewarm_service.py tests/architecture/test_ci_runner_warm_floor_defaults.py`.
8. T07 is the post-release follow-up opened after production deploy run `24311654953` finally succeeded on attempt 3. Attempts 1 and 2 hung inside `k3d cluster create --wait` after CoreDNS host-alias injection, so the milestone now adds a repo-owned create watchdog that fails fast and emits diagnostics instead of waiting for outer timeout or manual cancellation.
9. T08 is the next heavy-runner follow-up opened after deploy runs `24374812828` and `24385438368` plus runner-health run `24388346212` proved the real failure chain: the single heavy host accumulates recent workdirs and docker/k3d state until disk crosses the guard, while the k3d node container still inherits soft `nofile=1024` and fails with `fsnotify` / `inotify_init` exhaustion during k3s startup.
10. Verified on 2026-04-14 with `uv run python -m pytest tests/architecture/test_ci_runner_heavy_self_heal.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_k3d_bootstrap_cleanup.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py -q --tb=short`, `uv run ruff check tools/scripts/infra/k3d_harness.py tests/architecture/test_ci_runner_heavy_self_heal.py tests/architecture/test_ci_runner_prewarm_workflow.py tests/architecture/test_k3d_bootstrap_cleanup.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py`, and `bash -n tools/scripts/ci/runner/heavy-runner-self-heal.sh tools/scripts/infra/k3d-up.sh tools/scripts/e2e/monitor-k3d-startup.sh`.
9. Verified on 2026-04-12 with `uv run python -m pytest tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_k3d_bootstrap_cleanup.py -q --tb=short`, `uv run ruff check tools/scripts/infra/k3d_harness.py tests/architecture/test_k3d_harness.py tests/architecture/test_local_pre_pr_ci_harness.py tests/architecture/test_k3d_bootstrap_cleanup.py`, and `bash -n tools/scripts/infra/k3d-up.sh tools/scripts/e2e/monitor-k3d-startup.sh`.
