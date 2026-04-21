# M26 T08: Split CI Architecture Test Monoliths

Status: completed
Date: 2026-03-25
Owner: Codex

## Objective

Split the oversized CI architecture junk-drawer tests into focused modules so the repo file-size gate applies to CI policy tests without allowlisting the two monoliths.

## Decisions

1. Keep the existing assertions intact; move them into focused modules instead of rewriting policy coverage.
2. Introduce one tiny shared support module for repeated loader/path helpers instead of duplicating that setup across every new file.
3. Remove the legacy allowlist entries for `tests/architecture/test_ci_merge_gate_topology.py` and `tests/architecture/test_pr_orchestrator_queue_controls.py` once the split is in place.

## Result

New merge-gate policy modules:

1. `tests/architecture/test_ci_orchestrator_review_dispatch.py`
2. `tests/architecture/test_ci_review_workflow_topology.py`
3. `tests/architecture/test_ci_merge_gate_workflow_topology.py`
4. `tests/architecture/test_pr_review_bot_required_lane.py`
5. `tests/architecture/test_pr_review_bot_parse_contracts.py`
6. `tests/architecture/test_pr_review_bot_clean_state.py`

New queue/follow-up policy modules:

1. `tests/architecture/test_pr_followup_queue_budget.py`
2. `tests/architecture/test_pr_followup_queue_cooldowns.py`
3. `tests/architecture/test_pr_orchestrator_queue_controls.py`
4. `tests/architecture/test_ci_scope_image_refresh.py`
5. `tests/architecture/test_pr_followup_recovery_actions.py`

Shared support:

1. `tests/architecture/ci_architecture_test_support.py`

## Verification

```bash
uv run ruff check tests/__init__.py tests/architecture/__init__.py tests/architecture/ci_architecture_test_support.py tests/architecture/test_ci_orchestrator_review_dispatch.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_pr_review_bot_required_lane.py tests/architecture/test_pr_review_bot_parse_contracts.py tests/architecture/test_pr_review_bot_clean_state.py tests/architecture/test_pr_followup_queue_budget.py tests/architecture/test_pr_followup_queue_cooldowns.py tests/architecture/test_pr_orchestrator_queue_controls.py tests/architecture/test_ci_scope_image_refresh.py tests/architecture/test_pr_followup_recovery_actions.py tests/architecture/test_repo_file_size.py
uv run pytest tests/architecture/test_ci_orchestrator_review_dispatch.py tests/architecture/test_ci_review_workflow_topology.py tests/architecture/test_ci_merge_gate_workflow_topology.py tests/architecture/test_pr_review_bot_required_lane.py tests/architecture/test_pr_review_bot_parse_contracts.py tests/architecture/test_pr_review_bot_clean_state.py tests/architecture/test_pr_followup_queue_budget.py tests/architecture/test_pr_followup_queue_cooldowns.py tests/architecture/test_pr_orchestrator_queue_controls.py tests/architecture/test_ci_scope_image_refresh.py tests/architecture/test_pr_followup_recovery_actions.py tests/architecture/test_repo_file_size.py -q
```
