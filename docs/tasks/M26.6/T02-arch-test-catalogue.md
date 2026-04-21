# M26.6 T02 — Architecture Test Catalogue

> **Placeholder.** To be populated during T02 execution. Do not commit any `git mv` of test files until every row below is filled in.

## How to build this table

For each file under `tests/architecture/*.py`:

```bash
# Quick purpose scan — module docstring + first test body
head -40 tests/architecture/<name>.py

# Find related test files (possible duplicates)
rg -l "classify_ci_scope|pr_readiness|runner_health" tests/architecture/
```

## Target groups (refine during T02)

- `tests/architecture/ci/runner/` — runner health, prewarm, pool presence
- `tests/architecture/ci/workflow/` — workflow topology, job ordering
- `tests/architecture/ci/policy/` — control-plane policy
- `tests/architecture/ci/metrics/` — metrics/budget
- `tests/architecture/pr/review/` — PR review bot behavior
- `tests/architecture/pr/readiness/` — PR readiness/template sync
- `tests/architecture/pr/state/` — PR state tracking
- `tests/architecture/temporal/` — Temporal invariants
- `tests/architecture/scripts/` — script-specific tests (test_deploy_script, etc.)
- `tests/architecture/conventions/` — import boundaries, naming, layering

## Catalogue

| Test file | What it asserts (1 line) | Target group | Duplicate of |
|-----------|--------------------------|--------------|--------------|
| _(to be filled in during T02)_ | | | |
