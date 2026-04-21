# M26.5 (ex-M23.3) — Test Infrastructure Cleanup — Implementation Prompt

> **Renumbering note:** This milestone was originally numbered **M23.3**. It was renumbered to **M26.5** on 2026-04-05 to group it with the M26.x CI control-plane milestones. Commit messages on branch `refactor/simplify-test-scripts` still use the `M23.3` tag because they predate the renumbering — do not rewrite history.

## Context

You are implementing M26.5: a test infrastructure cleanup for the manibo platform repo. The milestone doc is at `docs/milestones/M26.5-test-infrastructure-cleanup.md`. The task tracker is at `docs/tasks/M26.5/PROGRESS.md`.

**Branch:** `refactor/simplify-test-scripts` (already created, based on `origin/main`)
**Worktree:** `/Users/jakit/customers/jakit/manibo-refactor-test-scripts`

## What this milestone does

Cleans up 87 shell scripts in `tools/scripts/` (flat directory) and 19 opaquely-named E2E test files. No test logic changes. No CI topology changes. Pure rename + reorganize + delete dead code.

## Execution order

Work through tasks T01–T09 sequentially. Each task = one commit. Update `docs/tasks/M26.5/PROGRESS.md` after each task.

### T01 — Delete 11 dead scripts

Delete these files from `tools/scripts/`:
```
mirror-hetzner-bootstrap-images.sh
ci_collect_traceability_artifacts.sh
ci_dump_platform_k8s_logs.sh
profile-build-proof.sh
run_auth_login_e2e.sh
run_clinic_booked_outcome_e2e.sh
run_clinic_inbound_confirmed_booking_e2e.sh
run_clinic_knowledge_base_e2e.sh
extract.sh
sync-from-monorepo.sh
e2e-release-rollout.sh
```

Then grep for each deleted filename across the repo and remove/update references in docs. Archived exec-plan docs (`docs/milestones/exec-plans/`) can keep stale references — just remove from active docs.

### T02 — Inline/merge 7 micro-scripts

1. **`ci_cleanup_isolated_checkout.sh`** (10 lines) — workflows already call `clean-isolated-checkout.sh` directly. Find all 3 calls in `merge-gate.yml` and replace with the direct call. Delete the wrapper.

2. **`ci_expose_k3d_bootstrap_action.sh`** (6 lines) — inline the `cp` command into the `merge-gate.yml` step that calls it. Delete.

3. **`ci_merge_gate_merge_readiness.sh`** (7 lines) — inline the 2 python calls into the workflow step. Delete.

4. **`ci_merge_gate_artifact_exclusion.sh`** + **`ci_merge_gate_artifact_profile_proof.sh`** — these differ by one env var (`ARTIFACT_PROOF_TAG_SUFFIX=merge-gate`). Merge into one script. The workflow step that called `artifact_profile_proof.sh` should now call the merged script with `ARTIFACT_PROOF_TAG_SUFFIX=merge-gate`.

5. **`k3d-build-images.sh`** (7 lines, one-line wrapper) — find callers (mainly `dev-live.sh`), replace with direct `build-platform-images.sh` call. Delete.

6. **`k3d.sh`** (46 lines, router for up/down) — find callers, replace with direct `k3d-up.sh`/`k3d-down.sh`. Delete.

7. **`generated_artifacts.sh`** + **`regen_generated_artifacts.sh`** + **`verify_generated_artifacts.sh`** — merge all 3 into one `generated_artifacts.sh` with `regen`/`verify`/`refresh` subcommands and the logic inlined. Delete the other 2.

### T03 — Create `tools/scripts/lib/common.sh`

Extract these functions that are copy-pasted across 15+ scripts:
```bash
require_cmd()    # check command exists or die
truthy_env()     # normalize 1/true/yes/on → return 0
wait_for_http()  # poll URL with attempts + sleep
die()            # echo to stderr + exit 1
```

Don't update callers yet — that happens in T07/T08.

### T04 — Create generic E2E runners

Create 2 new scripts:

1. **`run-compose-e2e.sh`** — extracts the shared 15-line boilerplate from `run_clinic_availability_e2e.sh`, `run_clinic_inbound_auto_answer_e2e.sh`, `run_clinic_patient_identification_e2e.sh`:
   ```
   Usage: run-compose-e2e.sh <pytest-path> [pytest-args...]
   ```
   Does: `compose-worktree.sh env` → export `PLATFORM_E2E_*` → `uv run pytest "$@"`.

2. **`run-real-eval.sh`** — extracts the credential gate from `run_clinic_booking_real_eval.sh` etc.:
   ```
   Usage: run-real-eval.sh [--require-google] [--require-openai] [--require-soniox] <pytest-path> [pytest-args...]
   ```
   Does: check required credentials → `uv run pytest "$@"`.

### T05 — Kill 14 clinic wrappers

Using the generic runners from T04:

| Delete | Replace with |
|--------|-------------|
| `run_clinic_booking_e2e.sh` | Inline `uv run pytest solutions/appointment_booking/tests/e2e/test_clinic_booking_scenarios.py -q --tb=short` into Makefile `test-solution-scenario-e2e` |
| `run_clinic_handoff_e2e.sh` | Same — inline into Makefile |
| `run_clinic_availability_e2e.sh` | Callers use `run-compose-e2e.sh packages/platform-core/tests/e2e/test_clinic_availability_compose.py` |
| `run_clinic_inbound_auto_answer_e2e.sh` | Same pattern |
| `run_clinic_patient_identification_e2e.sh` | Same pattern |
| `run_clinic_booking_real_eval.sh` | Callers use `run-real-eval.sh --require-google solutions/appointment_booking/tests/e2e/real_providers/...` |
| `run_clinic_handoff_real_eval.sh` | Same pattern |
| `run_clinic_booking_audio_real_eval.sh` | `run-real-eval.sh --require-google --require-soniox ...` |
| `run_clinic_booking_two_agent_real_eval.sh` | `run-real-eval.sh --require-google ...` |
| 3 dead ones | Already deleted in T01 |

Keep: `run_clinic_voice_reliability.sh` (rename in T07), `run_clinic_voice_room_smoke.sh` (rename in T07).

Update `Makefile` target `test-solution-scenario-e2e` to use direct pytest. Update `periodic-tests.yml` to use `run-real-eval.sh`. Update `run_clinic_voice_reliability.sh` to call the new generic runners.

### T06 — Rename 19 `test_wave*` files

All in `packages/platform-core/tests/e2e/`. Use `git mv` for each:

| Old | New |
|-----|-----|
| `test_wave2_security_isolation_compose.py` | `test_tenant_rls_isolation_compose.py` |
| `test_wave5_call_ops_compose.py` | `test_call_ops_lifecycle_compose.py` |
| `test_wave6_hardening_operations_compose.py` | `test_operator_audit_retention_compose.py` |
| `test_wave7_agent_governance_compose.py` | `test_agent_governance_compose.py` |
| `test_wave7_billing_budget_enforcement_compose.py` | `test_billing_budget_enforcement_compose.py` |
| `test_wave7_connectors_compose.py` | `test_connectors_config_compose.py` |
| `test_wave7_recordings_retention_compose.py` | `test_recordings_retention_compose.py` |
| `test_wave7_release_rollout_chaos_db_restart_compose.py` | `test_release_rollout_chaos_db_restart_compose.py` |
| `test_wave7_release_rollout_chaos_worker_restart_compose.py` | `test_release_rollout_chaos_worker_restart_compose.py` |
| `test_wave7_release_rollout_concurrency_compose.py` | `test_release_rollout_concurrency_compose.py` |
| `test_wave7_tenant_db_context_compose.py` | `test_tenant_db_context_compose.py` |
| `test_wave7_tenant_state_enforcement_compose.py` | `test_tenant_state_enforcement_compose.py` |
| `test_wave9_auth_client_admin_login_compose.py` | `test_auth_oidc_login_compose.py` |
| `test_wave9_clinic_availability_compose.py` | `test_clinic_availability_compose.py` |
| `test_wave9_clinic_booking_compose.py` | `test_clinic_booking_compose.py` |
| `test_wave9_clinic_inbound_auto_answer_compose.py` | `test_clinic_inbound_auto_answer_compose.py` |
| `test_wave9_clinic_inbound_confirmed_booking_compose.py` | `test_clinic_inbound_confirmed_booking_compose.py` |
| `test_wave9_clinic_knowledge_base_compose.py` | `test_clinic_knowledge_base_compose.py` |
| `test_wave9_clinic_patient_identification_compose.py` | `test_clinic_patient_identification_compose.py` |
| `wave7_agent_governance_compose_test_support.py` | `agent_governance_compose_test_support.py` |
| `wave6_hardening_operations_compose_test_support.py` | `operator_audit_retention_compose_test_support.py` |

After renaming, grep for every old filename across the entire repo and update references:
- `.github/workflows/regression-e2e.yml` — references `test_wave7_release_rollout_chaos_*`
- `tools/scripts/ci_merge_gate_merge_runtime_full.sh` — references `test_wave9_clinic_inbound_confirmed_booking_compose.py`
- `tools/scripts/classify_ci_scope.py` — references `test_wave9_clinic_inbound_auto_answer_compose.py`
- `tests/architecture/test_ci_runtime_smoke_workflow.py` — references `test_wave9_clinic_inbound_confirmed_booking_compose.py`
- `tests/architecture/test_repo_file_size.py` — references `test_wave6_hardening_operations_compose.py`
- `tests/architecture/test_list_requirements_checklist_k8s_tests.py` — references `test_wave9_auth_client_admin_login_compose.py`
- All `run_clinic_*` scripts that reference wave test paths (but most are already deleted by T05)
- `wiki/testing/regression-coverage.md`
- `docs/requirements/checklist.md`
- Internal imports within the test files themselves (check for `from wave7_*` or `import wave6_*`)

### T07 — Reorganize `tools/scripts/` into subdirectories + rename

This is the big move. Create directories and `git mv` every shell script to its new location with its new name. The full mapping is in the milestone doc under "Script name renames — full mapping".

Key directories to create:
```bash
mkdir -p tools/scripts/{ci/merge-gate,ci/runner,ci/scope,e2e,infra,dev,check,review,obs,artifact,lib}
```

After moving, update `source` / `bash` / `exec` references in every script that calls another script. Use `rg 'tools/scripts/' tools/scripts/` to find all cross-references.

### T08 — Update all callers

Grep for every old path and update to new path in:
- `.github/workflows/*.yml` — all workflow files
- `Makefile`
- `CLAUDE.md` (project root)
- `docs/**/*.md` (active docs; archived docs can stay stale)
- `tests/architecture/*.py` — architecture tests that validate script names/paths
- `tools/scripts/*.py` — Python scripts that reference shell scripts
- `.githooks/` — if any hooks reference scripts
- `tools/agents/*.py` — agent scripts that reference tools/scripts paths

### T09 — Verify

Run these from the worktree root:
```bash
# Architecture tests (validate script names, import boundaries, doc integrity)
uv run pytest tests/architecture/ -v --tb=short

# Grove architecture tests
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short

# Typecheck
uv run pyright -p pyrightconfig.ci.json

# Lint
uv run ruff check . --exclude=.venv
uv run ruff format --check . --exclude .venv

# Pre-PR CI harness (the meta-test that tests the test infrastructure)
bash tools/scripts/review/pre-pr-ci.sh
```

If architecture tests fail because they hardcode old script names, fix them as part of T08 (not T09).

## Critical warnings

1. **Atomic commits per task.** Don't leave the repo in a broken state between tasks.
2. **Architecture tests are the main risk.** Files in `tests/architecture/` validate exact script names and paths. T08 must update every reference.
3. **`ensure_ci_python_tooling.sh` and `ensure_ci_review_tooling.sh`** are `source`d by other scripts, not called standalone. They need to move but their callers must update `source` paths.
4. **The `check/` directory is shell-only.** The 63 Python scripts in `tools/scripts/*.py` are out of scope — don't move them.
5. **CI workflow paths are absolute from repo root** (`tools/scripts/foo.sh`). Every `git mv` of a script must update every workflow file that calls it.
6. **`obs/traceql.sh` is referenced in `CLAUDE.md` PR evidence rules.** Update to the new path.
