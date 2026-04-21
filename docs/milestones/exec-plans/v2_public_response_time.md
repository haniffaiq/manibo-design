Status: completed
Owner: Codex
Date: 2026-03-15

# V2 Public Response Time

## Objective

Land the Phase 3 assistant-response timing slice so first-response KPI truth comes from the real public chat write path instead of placeholder lead/follow-up math.

## Checklist rows advanced

- `docs/requirements/checklist.md:245`
- `docs/requirements/checklist.md:249`

## Scope

- add a tenant-authenticated web-chat runtime route for assistant message submission
- persist outbound assistant messages into canonical tenant chat history with typed response metadata
- emit `conversation.inquiry_started`, `conversation.responded`, and `conversation.out_of_office_handled` from the real public-ingress write path
- rewire tenant and admin `/reports/response-time` to conversation-first KPI truth
- prove the write path and read path with deterministic unit and integration coverage

## Notes

- This slice fixes the KPI contract only. It does not pretend the full conversational sales policy is done.
- Out-of-office handling now has canonical write-path events, but it still lacks a dedicated report/UI surface, so that requirement stays partial.
- The runtime route is intentionally tenant-authenticated under `/channels/web-chat/...` instead of stuffing operator actions into the public ingress surface.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_reports_kpis.py -q --tb=short`
- `uv run pyright -p pyrightconfig.ci.json packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/models.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/reports/kpi.py apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/src/platform_api/routes/reports.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py apps/api/tests/integration/test_reports_kpis.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `git diff --check`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `ALEMBIC_DATABASE_URL=postgresql+asyncpg://grove:grove@127.0.0.1:24372/grove uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `ALEMBIC_DATABASE_URL=postgresql+asyncpg://grove:grove@127.0.0.1:24372/grove TENANT_SCHEMA=tenant_voxrtliveb uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`
- `POST /public/widgets/vox-rt-live-05cfd07e/bootstrap`
- `POST /public/chat/sessions/1e79ef45-6979-4ed7-8c89-2b1bd84bea63/messages`
- `POST /channels/web-chat/sessions/1e79ef45-6979-4ed7-8c89-2b1bd84bea63/assistant-messages`
- `GET /reports/response-time`
- `GET /admin/reports/response-time`
- `tools/scripts/obs_traceql.sh 'trace_id:79a20ebe1b5fa69b8f58464e4ceafc70' 15m`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && name = "http GET /reports/response-time" }' 15m`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && name = "http GET /admin/reports/response-time" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event="web_chat_assistant_message_submitted"' 15m 20`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="web_chat_assistant_message_submit",outcome="success"})'`

## Outcome

First-response timing is no longer a fake report. The canonical public chat flow now records when an inquiry actually starts, when the assistant first responds, and whether that first response handled an out-of-office case. Tenant and admin response-time reports now read that conversation truth directly instead of inferring it from unrelated lead/follow-up events.

Live compose proof for this slice used widget `vox-rt-live-05cfd07e` and guest session `1e79ef45-6979-4ed7-8c89-2b1bd84bea63`:

- bootstrap returned pinned `composition_version=comp-live` and `artifact_hash=artifact-live`
- inbound guest message wrote canonical conversation start at correlation `297b7453-a30d-477d-8f78-cef174be7a9f`
- assistant response wrote canonical first-response and out-of-office-handled truth at correlation `9f92676b-719a-4aa0-b561-c65058c3f022`
- tenant and admin `GET /reports/response-time` both returned one initiated conversation, one responded conversation, and `<15m` rate `1.0`
- Tempo captured the assistant write trace `79a20ebe1b5fa69b8f58464e4ceafc70`, tenant report trace `c239948b49176c6c724432318f8c59b0`, and admin report trace `2215c8b28c23e1b8549a2db16f26f0eb`
- Loki captured `web_chat_assistant_message_submitted` with `handled_out_of_office=true` and the matching correlation id
- Prometheus recorded `platform_api_route_events_total{route="web_chat_assistant_message_submit",outcome="success"} = 1`
