Status: completed
Owner: Codex
Date: 2026-03-15

# V2 Widget Analytics

## Objective

Land the Phase 3 `widget analytics intake with correlation IDs` slice on top of the public-ingress KPI work so web chat has a route-backed analytics surface instead of log-only hand waving.

## Checklist rows advanced

- `docs/requirements/checklist.md:246`
- `docs/requirements/checklist.md:247`

## Scope

- add public widget analytics intake through `POST /public/widgets/{widget_id}/analytics`
- persist analytics intake through canonical `public.kpi_events`
- carry `widget_id` through public lead KPI events so widget-level reporting is possible
- add tenant/admin widget analytics reports from route-backed API surfaces
- add deterministic unit and integration coverage for write and read paths

## Notes

- This slice does not pretend to close the product/UI work; it only makes the runtime and reporting contract real.
- First-response and out-of-office handled KPIs remain open because assistant-response timing truth is still missing.
- Local compose proof still needs an explicit public-schema migration because `tools/scripts/compose-worktree.sh up` does not run `db-migrations`.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `git diff --check`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `ALEMBIC_DATABASE_URL=postgresql+asyncpg://grove:grove@127.0.0.1:28202/grove uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `POST /public/widgets/vox-widget-0c03c763/analytics`
- `GET /reports/widget-analytics?widget_id=vox-widget-0c03c763`
- `GET /admin/reports/widget-analytics?widget_id=vox-widget-0c03c763`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "widget_analytics" }' 15m`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && name = "http GET /reports/widget-analytics" }' 15m`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && name = "http GET /admin/reports/widget-analytics" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event="public_widget_analytics_recorded"' 15m 20`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="public_widget_analytics_ingest",outcome="success"})'`

## Outcome

Widget analytics is now a route-backed, report-backed runtime surface instead of log-only fiction. Live compose proof showed:

- `POST /public/widgets/vox-widget-0c03c763/analytics` accepted `widget.viewed`, `widget.opened`, and `widget.registration_clicked` with shared `correlation_id=widget-live-proof-001`
- tenant and admin `GET /reports/widget-analytics` returned the same canonical counts for `views=1`, `opens=1`, and `registration_clicks=1`
- Tempo captured the write path with traces `d5a662e7d10ce4a5d7ae7bbabaea1a73`, `d65c3db85dea20bd6294844e5bb0c479`, and `55dfcface84503f9576448e02ba22efb`, plus read-path traces `d6876ee617cf44d11a2bbe0827615848` and `3b0b877ad188deab7932897f86c18d0`
- Loki captured three `public_widget_analytics_recorded` events with the same correlation id and correct `event_type` values
- Prometheus recorded `platform_api_route_events_total{route="public_widget_analytics_ingest",outcome="success"} = 3`
