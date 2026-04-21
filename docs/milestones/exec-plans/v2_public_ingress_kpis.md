# V2 Public Ingress KPIs

Status: completed

## Objective

Close the observability lie in the public-ingress stack by making KPI truth for initiated conversations, captured leads, delivered leads, and escalations real in persistence, reports, tests, and harness-grade proof.

## Checklist Rows

- `docs/requirements/checklist.md`
  - section `12. Analytics & Reporting`
  - row `First response time to new inquiries is tracked and visible` stays open
  - row `Number of leads captured per period is tracked`
  - row `Conversations initiated vs. leads delivered rate is tracked`

## Scope

- emit public-ingress KPI events from the real write path, not synthetic backfill
- persist correlation-linked `conversation.initiated`, `lead.captured`, `lead.delivered`, and `lead.escalated`
- expose initiated/captured/delivered rates through `GET /reports/lead-funnel` and `GET /admin/reports/lead-funnel`
- prove the tenant and admin report shapes with deterministic integration coverage
- align the V2 implementation plan so the next public-ingress phase explicitly depends on `wiki/ops/harness_engineering.md` and `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`

## Files

- `packages/platform-core/src/platform_core/public_ingress/service.py`
- `packages/platform-core/src/platform_core/public_ingress/store.py`
- `packages/platform-core/src/platform_core/reports/kpi.py`
- `packages/platform-core/src/platform_core/alembic_public/versions/20260315_170000_public_kpi_ingress_events.py`
- `apps/api/src/platform_api/routes/reports.py`
- `packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `apps/api/tests/integration/test_public_ingress.py`
- `apps/api/tests/integration/test_reports_kpis.py`
- `docs/requirements/checklist.md`
- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `tools/scripts/run_local_pre_pr_ci.sh`

## Outcome

This slice does not pretend OTLP breadcrumbs are enough. The phase only counts when the runtime writes KPI truth, the report routes read that truth, and the harness/test layer can prove the numbers without manual storytelling.

The next V2 phase now also says that explicitly in `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`, so future public-ingress work cannot call itself done on ad-hoc traces and screenshots alone.
