# AH-2026-04-21: M8.2 Refactor Guard Drift

## Status

Done

## Context

PR #967 is blocked by `tests/architecture/test_m8_2_refactor_guards.py`
running against the current GitHub merge ref. The M8.2 guard still expects the
older structured agent editor file and legacy test-workbench page, while
`origin/main` now uses the agent-builder tab layout.

## Scope

- Update only the stale architecture guard.
- Preserve the guard intent: voice editor code must stay extracted and voice
  stream consumers must use the shared control-plane client.
- Do not change web runtime behavior.

## Verification

- `uv run pytest tests/architecture/test_m8_2_refactor_guards.py -q`
- `git diff --check`

## Evidence

- `uv run pytest tests/architecture/test_m8_2_refactor_guards.py -q` -> 5 passed
- Temporary merge proof with `origin/main` merged cleanly, then
  `uv run pytest tests/architecture/test_m8_2_refactor_guards.py -q` -> 5 passed
- `uv run ruff check tests/architecture/test_m8_2_refactor_guards.py` -> passed
- `uv run ruff format --check tests/architecture/test_m8_2_refactor_guards.py` -> 1 file already formatted
- `git diff --check` -> passed
