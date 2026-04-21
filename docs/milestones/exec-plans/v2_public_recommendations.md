# V2 Public Recommendations

Status: completed

## Objective

Land the missing V2 public-ingress recommendation contract so web chat can resolve and persist tenant-visible recommendation payloads instead of hand-waving about future course matching.

## Scope

- add typed recommendation payload contracts to `platform_core.public_ingress`
- resolve live recommendations through the governed scheduling connector path
- persist tenant-visible recommendation payloads in the tenant schema
- expose `GET /public/chat/sessions/{guest_session_id}/recommendations`
- prove the route with unit and integration coverage

## Files

- `packages/platform-core/src/platform_core/public_ingress/models.py`
- `packages/platform-core/src/platform_core/public_ingress/recommendations.py`
- `packages/platform-core/src/platform_core/public_ingress/service.py`
- `packages/platform-core/src/platform_core/public_ingress/store.py`
- `packages/platform-core/src/platform_core/alembic/versions/20260315_150000_public_recommendations.py`
- `apps/api/src/platform_api/routes/public_ingress.py`
- `packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `apps/api/tests/integration/test_public_ingress.py`
- `docs/requirements/checklist.md`

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `ALEMBIC_DATABASE_URL="$PLATFORM_E2E_ALEMBIC_DATABASE_URL" uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `CREATE SCHEMA IF NOT EXISTS tenant_voxrecommendationslive`
- `TENANT_SCHEMA=tenant_voxrecommendationslive ALEMBIC_DATABASE_URL="$PLATFORM_E2E_ALEMBIC_DATABASE_URL" uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "recommendations" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event="public_chat_recommendations_served"' 15m 20`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="public_chat_recommendations",outcome="success"})'`

## Outcome

Public web chat now has a real recommendation payload surface tied to scheduling connectors and tenant-visible persistence. That materially advances REQ-S05 and closes another missing backend route in the V2 public-ingress contract, but the repo still has no visible web/widget caller that renders this recommendation payload end to end.

Local observability proof used the unavailable path on purpose. That route still exercises the real public bootstrap, guest auth, tenant persistence, and telemetry surfaces without fabricating a test-only scheduling adapter inside the running compose stack.
