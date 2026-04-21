# M26 Follow-up: Codex Review Dispatch Cleanup

## Objective

Remove the repo-owned auto `@codex review` request path from PR workflows and follow-up automation, and surface the real `codex login status` failure output in the required review prep step.

## Decisions

1. Keep required `manibo-bot review (required)` unchanged as the merge-path authority.
2. Remove advisory auto-dispatch from `.github/workflows/pr-admission.yml` and `.github/workflows/merge-gate.yml`.
3. Keep connector review manual-only.
4. Preserve the real `codex login status` stderr instead of swallowing it behind generic auth guidance.
5. Source `tools/scripts/ensure_ci_review_tooling.sh` from the merge-gate prep helper so PATH/auth setup survives inside the same Actions step.
6. Force `CODEX_REVIEW_SANDBOX=danger-full-access` on self-hosted PR review workflows because the default `workspace-write` bubblewrap sandbox is failing on the bot runner lane with `bwrap: loopback: Failed RTM_NEWADDR`.

## Evidence

Verified locally:

1. `uv run pytest tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_pr_review_policy.py tests/architecture/test_pr_followup_queue_cooldowns.py tests/architecture/test_evaluate_ci_gate.py -q`
   - `102 passed in 3.46s`
2. `uv run pyright -p pyrightconfig.ci.json`
   - `0 errors, 0 warnings, 0 informations`
3. `uv run ruff check tools/agents/ci_control_plane_policy.py tools/agents/pr_followup.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_pr_review_policy.py`
   - `All checks passed!`
4. `uv run ruff format tools/agents/ci_control_plane_policy.py tools/agents/pr_followup.py tests/architecture/test_ci_control_plane_policy.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_ci_pr_path_simulation.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_pr_review_policy.py --check`
   - `7 files already formatted`
5. `bash -n tools/scripts/ci_merge_gate_pr_static_prepare.sh`
   - exit `0`

Live PR diagnosis:

6. `gh api repos/jakit-labs/manibo/actions/jobs/68655820094/logs`
   - failing line: `tools/scripts/ci_merge_gate_pr_static_prepare.sh: line 10: codex: command not found`
7. Root cause: `ci_merge_gate_pr_static_prepare.sh` was invoking `bash tools/scripts/ensure_ci_review_tooling.sh`, so the child shell's PATH updates died before `codex login status` ran in the parent shell.
8. `gh pr view 694 --json latestReviews,reviewDecision`
   - latest `manibo-bot` required review on head `2ccd3d5d` failed with `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`
9. Root cause: prompt-backed review runs through `tools/agents/codex_exec.py`, whose default sandbox was still `workspace-write` on the self-hosted `bots` lane.

## Risks

1. The manual helper `tools/scripts/request_pr_codex_review.py` remains in-tree; this change removes automated invocation, not the helper itself.
2. Any tooling that only inspected the old `request_codex_review` policy bit will now see it consistently disabled for review-required lanes.
3. This repo fix cannot repair a genuinely broken runner install; it only removes the self-inflicted PATH-loss bug in the required review prep step.
4. `danger-full-access` is now scoped to isolated PR review VMs only; if someone copies that env into non-review workflows without thinking, they are lowering containment for no reason.
