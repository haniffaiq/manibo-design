Status: Completed

# Codex Auth Review Rotation

## Goal

- Split the local Codex auth/review hardening from the larger k3d image-truth branch so it can merge to `main` independently.

## Scope

- `tools/agents/review.py`
- `tools/agents/codex_exec.py`
- `tools/scripts/run_local_pr_review.sh`
- `tools/scripts/codex_auth.sh`
- `tests/architecture/test_review_wrapper_cli_compat.py`
- `tests/architecture/test_codex_exec_cli.py`
- `tests/architecture/test_codex_auth_script.py`
- `wiki/ops/codex_ci_bots.md`
- `AGENTS.md`

## Why

- The mixed branch bundles two unrelated concerns:
  - local Codex auth/review reliability
  - k3d runtime/image-truth hardening
- Merging them together would create a trash review diff and block the smaller fix on the heavier runtime work.

## Verification

- `uv run ruff check tools/agents/review.py tools/agents/codex_exec.py tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_codex_exec_cli.py tests/architecture/test_codex_auth_script.py`
- `uv run pytest tests/architecture/test_review_wrapper_cli_compat.py tests/architecture/test_codex_exec_cli.py tests/architecture/test_codex_auth_script.py -q --tb=short`
- `tools/scripts/run_local_pr_review.sh origin/main post_ci`
- `tools/scripts/run_local_pre_pr_ci.sh`
- Local Codex review final verdict: `No concrete, actionable regression` with exit code `0` captured in `/tmp/local_pr_review_auth_only.out`
