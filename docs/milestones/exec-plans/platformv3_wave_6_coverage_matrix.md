# Wave 6 Coverage Matrix — Platform v3.0 (Hardening & Operations)

This matrix maps Wave 6 phases to the automated tests that prove the behavior end-to-end.

> Exec plan: `docs/milestones/exec-plans/platformv3_wave_6.md`

## Matrix

| Phase | Scope (from exec plan) | Unit tests | Integration tests | Compose E2E tests |
|---|---|---|---|---|
| 6.0 | Audit trail (`audit_writer`, append-only) | `packages/platform-core/tests/unit/test_audit/test_writer.py` | `packages/platform-core/tests/integration/test_audit_writer_role_permissions.py`, `packages/platform-core/tests/integration/test_audit_writer_activity.py` | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.1 | Usage metering (tokens + voice duration) | `packages/grove/tests/unit/providers/test_usage_callback.py`, `apps/temporal-worker/tests/unit/test_usage_activities.py` | `apps/temporal-worker/tests/integration/test_usage_db.py` | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.2 | Tenant provision/offboard workflows (+ compensation + idempotency) | `packages/platform-core/tests/unit/test_tenancy/test_workflows.py` | `packages/platform-core/tests/integration/test_tenant_lifecycle_workflows.py` | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.3 | Observability (health + metrics + correlation) | `packages/platform-core/tests/unit/test_temporal/test_correlation.py`, `packages/platform-core/tests/unit/test_observability/test_metrics.py` | `packages/platform-core/tests/integration/test_correlation_propagation.py` | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.4 | Model catalog + policy enforcement (voice vs chat + fallbacks) | `packages/platform-core/tests/unit/test_config/test_merge.py`, `packages/platform-core/tests/unit/test_voice/test_webhook.py`, `apps/temporal-worker/tests/unit/test_voice_activities_metadata.py`, `packages/grove/tests/unit/runtime/test_graph_nodes.py`, `apps/api/tests/unit/test_model_catalog_wiring.py` | (covered via unit + compose E2E) | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.5 | Approval checkpoint primitives (approve/reject/timeout; no side effects; operator escalation) | `platform_core/approvals/*` is exercised via integration/e2e | `packages/platform-core/tests/integration/test_approval_audit_events.py` | `packages/platform-core/tests/e2e/test_wave6_hardening_operations_compose.py` |
| 6.6 | Evaluation suites (golden traces) | `tests/evals/` | `tests/evals/` | `tests/evals/` (intentionally “local E2E” against deterministic fixtures) |
| 6.7 | Architecture invariants CI tests | `tests/architecture/` | `tests/architecture/` | `tests/architecture/` |

## How To Run (Wave 6)

- Unit + integration (fast local): `uv run pytest packages/platform-core/tests/ apps/temporal-worker/tests/ packages/grove/tests/unit/ -q`
- Compose E2E (full stack): `PLATFORM_E2E_TESTS=1 tools/scripts/compose-worktree.sh e2e`
