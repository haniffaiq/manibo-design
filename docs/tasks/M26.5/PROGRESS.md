# M26.5 (ex-M23.3) — Test Infrastructure Cleanup — Progress

## Tasks

| Task | Description | Status | Date |
|------|-------------|--------|------|
| T01 | Delete 11 dead scripts + remove stale doc references | Done | 2026-04-05 |
| T02 | Inline/merge 7 micro-scripts into callers + merge artifact gate | Done | 2026-04-05 |
| T03 | Create `tools/scripts/lib/common.sh` shared functions | Done | 2026-04-05 |
| T04 | Create generic E2E runners: `run-compose-e2e.sh`, `run-real-eval.sh` | Done | 2026-04-05 |
| T05 | Kill 14 clinic wrappers (inline 2, replace 7, keep 2, delete 3) | Done | 2026-04-05 |
| T06 | Rename 19 `test_wave*` + 2 support files to self-explanatory names | Done | 2026-04-05 |
| T07 | Reorganize `tools/scripts/` into subdirectories + rename all scripts | Done | 2026-04-05 |
| T08 | Update CI workflows, arch tests, Makefile, CLAUDE.md, docs to new paths | Done | 2026-04-05 |
| T09 | Verify: `review/pre-pr-ci.sh`, architecture tests, CI green | Done | 2026-04-05 |
| T10 | Fix Temporal Helm v1 values for the prerelease release gate | Done | 2026-04-08 |

## Dead scripts — T01

| Script | Refs | Evidence |
|--------|------|----------|
| `mirror-hetzner-bootstrap-images.sh` | 0 | Zero references anywhere |
| `ci_collect_traceability_artifacts.sh` | 1 | Only archived exec-plan doc |
| `ci_dump_platform_k8s_logs.sh` | 1 | Only archived exec-plan doc |
| `profile-build-proof.sh` | 1 | Only completed task doc M11/T07 |
| `run_auth_login_e2e.sh` | 2 | Only archived docs |
| `run_clinic_booked_outcome_e2e.sh` | 1 | Only archived exec-plan |
| `run_clinic_inbound_confirmed_booking_e2e.sh` | 1 | Only archived exec-plan |
| `run_clinic_knowledge_base_e2e.sh` | 1 | Only archived doc |
| `extract.sh` | 6 | Dead monorepo tool, no live callers |
| `sync-from-monorepo.sh` | 1 | Only called by extract.sh (also dead) |
| `e2e-release-rollout.sh` | 3 | Only archived docs; k3d-test-e2e.sh covers this |

## Inline/merge — T02

| Script | Lines | Action |
|--------|-------|--------|
| `ci_cleanup_isolated_checkout.sh` | 10 | Inline into `merge-gate.yml` |
| `ci_expose_k3d_bootstrap_action.sh` | 6 | Inline into `merge-gate.yml` |
| `ci_merge_gate_merge_readiness.sh` | 7 | Inline into workflow (2 python calls) |
| `ci_merge_gate_artifact_exclusion.sh` | 15 | Merge with `artifact_profile_proof.sh` |
| `ci_merge_gate_artifact_profile_proof.sh` | 15 | (merged into above) |
| `k3d-build-images.sh` | 7 | Delete — one-line wrapper |
| `k3d.sh` | 46 | Delete — useless router |
| `regen_generated_artifacts.sh` | 24 | Merge into `artifacts.sh` |
| `verify_generated_artifacts.sh` | 22 | Merge into `artifacts.sh` |
| `generated_artifacts.sh` | 43 | Replaced by merged `artifacts.sh` |

## Wave test renames — T06

All in `packages/platform-core/tests/e2e/`:

| Current | New |
|---------|-----|
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

## Script rename map — T07

See full rename table in [M26.5 milestone doc](../../milestones/M26.5-test-infrastructure-cleanup.md#script-name-renames--full-mapping).

## Follow-up fixes

- 2026-04-07: Issue #805 narrowed a Tier 0 `k3d` regression to platform-core E2E bootstrap DSN selection. Shared `packages/platform-core/tests/e2e` helpers now prefer `PLATFORM_E2E_ADMIN_DATABASE_URL` or `DATABASE_URL` before the app-scoped `PLATFORM_E2E_DATABASE_URL`, matching `tools/scripts/e2e/run-k3d-e2e.sh` and restoring privileged setup for the `packages/platform-core/tests/e2e` suite plus the traceability harness.
- 2026-04-08: Release run `24150941813` exposed that the prerelease/local Temporal values still targeted the pre-`1.0.0`
  Helm chart contract. The production overlay remains pinned to chart `0.73.2`, so `T10` now explicitly keeps local
  on the v1 contract while preserving production on the legacy contract.
- 2026-04-08: T10 completed. Direct `helm template` render now passes for
  `infrastructure/kubernetes/base/platform/temporal/values.local.yaml` against `temporal/temporal` chart `1.0.0`, and
  `tools/scripts/infra/k3d-up.sh` now pins that same prerelease chart version instead of floating to upstream latest.
  `tests/architecture/test_temporal_helm_values.py` now mechanically enforces the split local/prod contract alongside
  the prerelease chart pin, with passing `validate-contracts.sh` and `validate-product.sh`.
