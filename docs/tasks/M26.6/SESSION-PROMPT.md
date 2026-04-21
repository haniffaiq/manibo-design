# M26.6 — Tooling Script & Architecture Test Cleanup — Session Prompt

> **Renumbering note:** Originally scoped as M23.4. Renumbered to **M26.6** on 2026-04-05 to group with the M26.x CI control-plane milestones. The direct predecessor milestone is **M26.5** (ex-M23.3, `refactor/simplify-test-scripts` / PR #795), which reorganized the shell side of `tools/scripts/`.

> **Do not commit this file in the same PR as M26.5** (`refactor/simplify-test-scripts` / PR #795). Start a fresh worktree and branch.

## Context

You are implementing M26.6: apply the M26.5 playbook (rename + reorganize + delete dead code) to the two piles M26.5 explicitly skipped:

1. **63 Python scripts** in `tools/scripts/*.py` (flat directory, vague names, duplicate families)
2. **133 architecture tests** in `tests/architecture/*.py` (flat directory, no grouping)

M26.5 already organized the `.sh` scripts into `tools/scripts/{ci,e2e,infra,dev,check,review,obs,artifact,lib}/`. M26.6 populates those same subdirectories with the Python scripts that belong in each, and creates a parallel grouping under `tests/architecture/`.

## Hard constraints

1. **Do NOT change test assertions.** This is rename + reorganize + delete dead code. No semantic changes.
2. **Bot-critical scripts are high-blast-radius.** Files like `run_bot_pr_admission_checks.py`, `pr_readiness_policy.py`, `classify_ci_scope.py`, `check_pr_readiness.py` are referenced by GitHub workflows. Every move must update every workflow atomically.
3. **`api_inventory_lib.py` is 65k lines.** It's a library imported by other scripts. Move it carefully and update every importer; do NOT touch its internals.
4. **Architecture tests are the meta-test.** Breaking `tests/architecture/` makes every other change unverifiable. Do the test-directory reorganization LAST, in its own task.
5. **Merge-gate hooks depend on several scripts being at fixed paths.** Check `.pre-commit-config.yaml` and `.githooks/` before every move.
6. **No `--no-verify` commits.** If the Claude pre-commit hook blocks you on pre-existing issues in `packages/grove/` (bootstrap.py pyright or temporal/activities.py file size), stop and coordinate with the user — those are tracked in a separate workstream.

## Pre-flight (mandatory — first 10 minutes)

```bash
git branch --show-current             # must be main or a fresh branch
git status --short                    # must be clean
git worktree add ../manibo-m26-6 -b refactor/tooling-and-arch-test-cleanup
cd ../manibo-m26-6
ls tools/scripts/*.py | wc -l         # ~63 expected
ls tests/architecture/*.py | wc -l    # ~133 expected
```

Read `docs/milestones/M26.5-test-infrastructure-cleanup.md` for the pattern; this milestone follows the same shape.

## Workstream 1 — tools/scripts/*.py review

### T01 — Catalogue every Python script

Output: `docs/tasks/M26.6/T01-script-catalogue.md` with one row per file:

| Script | Purpose (1 line) | Callers | Status | Target home | Target name |
|--------|------------------|---------|--------|-------------|-------------|
| `run_clinic_voice_room_smoke.py` | Voice room smoke test driver | ? | ? | `e2e/` or DELETE | ? |
| ... | ... | ... | ... | ... | ... |

For each script, run:
```bash
# Find callers
rg -l "\btools/scripts/<name>\.py\b" --glob '!docs/archived/**' --glob '!docs/tasks/M26.5/**'
# Quick purpose scan
head -30 tools/scripts/<name>.py
```

Assign one of these statuses:
- **live** — at least one non-archived caller
- **dead** — zero active callers (delete in T03)
- **duplicate** — near-identical body to another script (merge in T04)
- **orphan** — imported by another Python module but never invoked standalone

### T02 — Catalogue every architecture test

Output: `docs/tasks/M26.6/T02-arch-test-catalogue.md` with one row per file:

| Test file | What it asserts (1 line) | Target group | Duplicate of |
|-----------|--------------------------|--------------|--------------|

Target groups (suggested, refine during T02):
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

### T03 — Delete dead Python scripts

Any script with zero references in:
- `.github/workflows/`
- `.githooks/`
- `.pre-commit-config.yaml`
- `Makefile`
- `pyproject.toml`
- Active (non-archived) docs
- Other `tools/scripts/*.py` files (imports)
- `tools/agents/*.py`

Delete it. Commit per-group with a rationale.

### T04 — Merge near-duplicate families

Known duplicate clusters (confirm in T01 before merging):

| Cluster | Current members | Proposed merged form |
|---------|-----------------|----------------------|
| CI runner health | `check_ci_runner_pool_presence.py`, `check_ci_runner_prewarm.py`, `check_ci_runner_wedged_state.py`, `check_ci_metrics_budget.py`, `check_ci_duration_health.py`, `check_ci_scheduler_health.py` | `ci/runner_health.py` with subcommands |
| Extract helpers | `extract_findings.py`, `extract_bot_report_excerpt.py`, `extract_pytest_failure_excerpt.py` | `review/extract.py` with `--mode findings/bot/pytest` |
| Notify | `notify_ci_runner_health_slack.py`, `notify_ci_monitor_slack.py` | `ci/notify_slack.py` with `--kind health/monitor` |
| Render | `render_release_pr_body.py`, `render_pr_readiness_template.py`, `render_act_pull_request_event.py` | `review/render.py` with subcommands OR keep separate if bodies diverge |

**Only merge if the diff between members is <30%.** If one script has meaningfully different logic, keep it separate and just move it to the right subdirectory.

### T05 — Reorganize `tools/scripts/*.py` into subdirectories

Target layout (refine in T01):

```
tools/scripts/
  ci/
    classify_ci_scope.py
    classify_k8s_local_stack_scope.py
    run_bot_pr_admission_checks.py
    runner_health.py              # merged from 5 check_ci_runner_*
    aggregate_ci_metrics.py
    notify_slack.py               # merged from 2 notify_ci_*
    emit_ci_queue_slo.py
    emit_ci_scope_fallback.py
    evaluate_ci_gate.py
    github_runner_inventory.py
    ci_monitor_alert_kinds.py
  review/
    build_pr_review_prompt.py
    pr_readiness_policy.py
    check_pr_readiness.py
    check_pr_readiness_body.py
    render_pr_readiness_template.py
    check_pr_review_resolution.py
    check_pr_head_freshness.py
    request_pr_codex_review.py
    wait_until_mergeable.py
    bot_issue_upsert.py
    extract.py                    # merged from 3 extract_*
  arch/                           # docs + spine + inventory generation
    generate_api_inventory.py
    generate_component_graph.py
    generate_voice_capability_manifest.py
    check_api_inventory.py
    check_system_graph.py
    check_repo_template_doc_links.py
    sync_arch_spine.py
    api_inventory_lib.py
    system_graph_status.py
    render_release_pr_body.py
  check/
    check_ui_requirements.py
    check_payload_types.py
    check_regression_governance.py
    check_requirements_checklist.py
    list_requirements_checklist_k8s_tests.py
  e2e/
    run_voice_eval_repeated.py
    run_repeated_gate.py
    run_webrtc_stt_benchmark.py
    voice_latency_report.py
    validate_flow.py
    verify_solution_profile.py
    generate_parity_report.py
    generate_clinic_confirmed_booking_mock_response.py
    infra/k3d_harness.py
    driver_verification_demo.py        # was: hoptrans_demo.py
    driver_verification_cleanup.py     # was: hoptrans_cleanup.py
    # DELETE if dead per T01:
    # run_clinic_voice_room_smoke.py
    # run_clinic_booking_two_agent_monitor.py
    # test_agent.py (not a pytest test; rename or delete)
  artifact/
    update_profile_locks.py
  infra/
    setup_livekit_sip.py               # was: setup-sip.py
```

Use `git mv` for every move. Update every importer.

### T06 — Rename codename/jargon scripts

- `hoptrans_demo.py` → `driver_verification_demo.py`
- `hoptrans_cleanup.py` → `driver_verification_cleanup.py`
- `setup-sip.py` → `setup_livekit_sip.py` (also underscores — PEP8)
- `test_agent.py` → something that makes clear it's NOT a pytest test (maybe `agent_smoke.py` or delete)
- `bot_issue_upsert.py` → keep name; it's clear enough

Update every caller.

## Workstream 2 — tests/architecture/*.py review

### T07 — Group architecture tests into subdirectories

**Do this task LAST.** Breaking the architecture test directory breaks the verification loop for every other M26.6 task.

For each test file in the catalogue from T02, `git mv` it into its target subdirectory. Check `pyproject.toml` for any `testpaths` / `python_files` configuration — pytest discovery uses glob, so moving files into subdirectories should "just work" but verify with a `uv run pytest tests/architecture/ --collect-only` before and after.

Add `__init__.py` files ONLY if Python imports between test files require them (rare). Pytest prefers no-__init__ layout.

### T08 — Merge near-duplicate architecture tests

Look for pairs like:
- `test_local_pre_pr_ci_harness.py` vs `test_pr_orchestrator_queue_controls.py` — both touch the same harness
- Any `test_*_workflow_topology.py` that assert overlapping invariants
- Any `test_*_runner*` that duplicate each other

**Only merge if the assertions are overlapping AND the test bodies are near-identical.** When in doubt, leave them.

## Workstream 3 — Cross-cutting hygiene

### T09 — Kill the dead `infra/**` pattern

In `tools/scripts/classify_ci_scope.py:82`, the `_CODE_INCLUDE` list contains `"infra/**"` as a defensive guard against the `infra/` directory being reintroduced (it was removed in `fe65844a` as part of M26.3). The user explicitly wants this removed:

> infra is nonsense we don't have this directory at all

Two files need updating atomically:
1. `tools/scripts/classify_ci_scope.py` — remove the `"infra/**"` line
2. `tests/architecture/test_classify_ci_scope_matrix.py` — remove the `["infra/reintroduced/path.txt"]` test case (added in the same commit)

Verify with:
```bash
uv run pytest tests/architecture/test_classify_ci_scope_matrix.py -v --tb=short
```

### T10 — Update all callers

For every script moved / renamed / merged / deleted in T03–T08, grep the repo for references and update them:

```bash
# In a fresh worktree after T05:
for old in <list of renamed or moved files>; do
  rg -l "\b${old}\b" --glob '!docs/archived/**'
done
```

Key surfaces that reference Python scripts:
- `.github/workflows/*.yml`
- `.githooks/*`
- `.pre-commit-config.yaml`
- `pyproject.toml`
- `Makefile`
- `tools/agents/*.py`
- `tools/scripts/*.sh` (cross-language calls)
- `tools/scripts/*.py` (internal imports — use `rg 'from tools\.scripts'` or `rg 'import .*<name>'`)
- Active docs

### T11 — Verify

```bash
# Architecture tests
uv run pytest tests/architecture/ -v --tb=short

# Grove architecture tests
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short

# Typecheck
uv run pyright -p pyrightconfig.ci.json

# Lint
uv run ruff check . --exclude=.venv
uv run ruff format --check . --exclude .venv

# Local CI harness (the meta-test that tests the test infrastructure)
bash tools/scripts/review/pre-pr-ci.sh
```

## Task order

```
T01 (script catalogue) ──┐
T02 (arch test catalogue) ┤
                          ▼
                         T03 (delete dead)
                          │
                          ▼
                         T04 (merge duplicates)
                          │
                          ▼
                         T05 (reorganize scripts) ──► T06 (rename codenames) ──► T09 (kill infra/**)
                                                                                     │
                                                                                     ▼
                                                                                   T10 (update callers)
                                                                                     │
                                                                                     ▼
                                                                                   T07 (reorganize arch tests)
                                                                                     │
                                                                                     ▼
                                                                                   T08 (merge arch test dupes)
                                                                                     │
                                                                                     ▼
                                                                                   T11 (verify)
```

**One task = one commit.** Update `docs/tasks/M26.6/PROGRESS.md` after each task.

## Critical warnings

1. **Architecture tests are the main risk.** Files in `tests/architecture/` validate exact script names and paths. T10 must update every reference.
2. **Bot-authored PRs run `run_bot_pr_admission_checks.py`.** Renaming it would break bot PRs silently until the next admission run. If you rename it, do it in a dedicated commit with a workflow update in the same commit.
3. **The `tools/scripts/ci/` directory has shell scripts from M26.5.** Adding Python files there means mixed file types in one subdirectory — that's fine, but be consistent with the layout in `check/`, `review/`, etc.
4. **`pyproject.toml` may declare scripts as entry points.** Check `[project.scripts]` before renaming or moving anything.
5. **`.pre-commit-config.yaml` references specific script paths.** Any script moved or renamed that's referenced there must be updated in the same commit.

## Out of scope

- Changing test logic or adding new tests
- Refactoring large script internals (`api_inventory_lib.py`, `check_ci_metrics_budget.py`, etc.)
- Touching `.sh` scripts from M26.5
- Fixing pre-existing `packages/grove/` type errors or file-size violations (separate workstream — `docs/tasks/hygiene-grove-file-limits/`)
- Reorganizing `packages/*/tests/` — only `tests/architecture/` is in scope
