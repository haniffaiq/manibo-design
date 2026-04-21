# M26.6 — Tooling Script & Architecture Test Cleanup — Progress

> **History:** Scoped as M23.4 before 2026-04-05. Renumbered to M26.6 to group with M26.x CI milestones.

## Status

PR open on `refactor/simplify-py-scripts` (worktree at `../manibo-refactor-py-scripts`).

**This PR is Python-script-only** (Workstream 1). The architecture-test
reorganization (Workstream 2: T07, T08) is deferred to a follow-up so this PR
does not break the meta-test loop. T09 (`infra/**` pattern removal) was
already landed in PR #800 (`802bbb96 chore: drop dead infra/** pattern from
classify_ci_scope`) and is removed from this milestone's scope.

The full bulk reorganization of the remaining ~50 scripts into
`tools/scripts/{ci,pr,check,e2e,obs,artifact}/` subdirectories is also
deferred to a follow-up. Each move requires updating ~3 callers in
`.github/workflows/`, `tools/scripts/**/*.sh`, `tools/agents/`, and
`tests/architecture/`. The high-value renames (codename hygiene) and the
api_inventory_lib package split landed in this PR; the bulk-move slice
adds risk-without-payoff in the same PR diff.

## Tasks

| Task | Description | Status | Date |
|------|-------------|--------|------|
| T00  | Smoke-test safety net (`tests/architecture/test_tools_scripts_smoke.py`) | Done | 2026-04-06 |
| T01 | Catalogue every Python script in `tools/scripts/*.py` | Done | 2026-04-06 |
| T02 | Catalogue every architecture test in `tests/architecture/*.py` | Deferred (Workstream 2) | — |
| T03 | Delete dead Python scripts (3 verified, 839 LOC; 1 reverted after PR review) | Done | 2026-04-07 |
| T04 | Merge near-duplicate Python script families | Skipped (no <30%-diff candidates) | 2026-04-06 |
| T05 | Bulk-reorganize `tools/scripts/*.py` into subdirectories | Deferred (follow-up) | — |
| T05a | Split `api_inventory_lib.py` (1541 LOC) into 10-file package | Done | 2026-04-06 |
| T06 | Rename codename/jargon Python scripts | Done | 2026-04-06 |
| T07 | Group architecture tests into subdirectories | Deferred (Workstream 2) | — |
| T08 | Merge near-duplicate architecture tests | Deferred (Workstream 2) | — |
| T09 | Kill dead `infra/**` pattern in `classify_ci_scope.py` | Done in PR #800 | 2026-04-06 |
| T10 | Update all external callers to new paths | Done (atomic with each move) | 2026-04-06 |
| T11 | GC pass + verify (arch tests, pyright, ruff, local CI harness) | In progress | 2026-04-06 |

## Cataloguing outputs

- [`T01-script-catalogue.md`](T01-script-catalogue.md) — Python script catalogue, **verified**
- [`T02-arch-test-catalogue.md`](T02-arch-test-catalogue.md) — placeholder (Workstream 2, deferred)

## Commits in this PR

| Commit | Phase | Description |
|--------|-------|-------------|
| `75c3ab6d` | T00 + T01 | Smoke-test safety net + verified script catalogue |
| `72ff85ad` | T03 | Delete 4 dead Python scripts (1232 LOC; 1 restored in follow-up) |
| `01ea47d1` | T05a | Split `api_inventory_lib.py` into `arch/api_inventory/` package |
| `e884fab2` | T06 | Rename codename scripts (hoptrans, setup-sip) |

## Verification

- **Architecture tests**: `uv run pytest tests/architecture/ -q --tb=line` → **1027 passed in 112.30 s**
- **Pyright**: `uv run pyright -p pyrightconfig.ci.json` → **0 errors, 0 warnings**
- **Ruff**: `uv run ruff check + format` → all checks passed
- **Byte-identical inventory**: `expected_output_map` from new package matches old monolith on all 4 generated files (221 endpoints, 0 missing, 6 planned, 0 unresolved)
- **Smoke test self-discovery**: 119 parametrized cases on the post-rename tree (62 ast.parse + 57 module-load), all green

## Inventory

Final state on `refactor/simplify-py-scripts`:

- **62** Python files originally under `tools/scripts/`
- **−3** dead scripts deleted (T03 net; `run_clinic_booking_two_agent_monitor.py` was deleted in commit `72ff85ad` and restored in a follow-up commit after PR review)
- **−1** monolith file replaced by 10-file package (T05a, net +9 files)
- **+0** scripts added or renamed in place
- **= 68** Python files now under `tools/scripts/**/*.py` (62 - 3 - 1 + 10)

## Out of scope (deferred follow-ups)

- Workstream 2: `tests/architecture/` directory regrouping (T07, T08)
- Bulk reorganization of remaining ~50 scripts into subdirectories (T05 bulk slice)
- Tenant isolation refactor of `driver_verification_demo.py` and
  `driver_verification_cleanup.py` (revealed by failed solutions/ relocation
  attempt — see M26.6 T06 commit for context)
- Renaming `wiki/ops/hoptrans-*.md` operator runbooks to drop the codename
- Splitting the next-largest scripts (`aggregate_ci_metrics.py` 770 LOC,
  `classify_ci_scope.py` 739 LOC) into per-concern modules
