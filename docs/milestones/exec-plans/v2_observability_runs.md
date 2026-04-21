# V2 Observability Runs

Status: completed
Owner: Codex
Date: 2026-03-15

## Goal

Advance the V2 observability contract from a two-subject read model (`call_session`, `workflow_run`) to a normalized observable-entity model that also supports `interactive_channel_session`.

This slice is intentionally narrow:
- land the real API/read-model surface
- keep correlation-first identifiers systematic
- keep tenant and deployment browser routes honest
- prove the new kind through backend tests and browser verification

## Checklist / Contract Rows

- `docs/requirements/checklist.md`
  - operator-grade observability summary bullet
- `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`
  - Must-have: normalized list/detail/timeline/compare API contracts

## Scope

1. Extend observability run list/detail/timeline/compare to `interactive_channel_session`.
2. Preserve stable identifiers in summary/detail contracts:
   - `channel_session_id`
   - `conversation_id`
   - `correlation_id`
   - `composition_version`
   - `artifact_hash`
3. Add tenant + admin web routes for channel-session observability drill-down.
4. Add integration, API-client, and browser proof.

## Files

- `apps/api/src/platform_api/routes/observability.py`
- `apps/api/tests/integration/test_observability.py`
- `apps/web/src/lib/api/observability.ts`
- `apps/web/src/lib/observability-routes.ts`
- `apps/web/src/components/observability-workspace.tsx`
- `apps/web/src/app/(tenant)/observability/channel-sessions/[channelSessionId]/page.tsx`
- `apps/web/src/app/(deployment)/admin/observability/channel-sessions/[channelSessionId]/page.tsx`
- `apps/web/tests/observability-api.test.ts`
- `apps/web/e2e/observability.spec.ts`

## Verification

- `uv run ruff check apps/api/src/platform_api/routes/observability.py apps/api/tests/integration/test_observability.py`
- `uv run pyright apps/api/src/platform_api/routes/observability.py apps/api/tests/integration/test_observability.py`
- `uv run pytest apps/api/tests/integration/test_observability.py -q --tb=short`
- `source ~/.nvm/nvm.sh && nvm use 20.19.0 >/dev/null && pnpm --dir apps/web test -- tests/observability-api.test.ts`
- `source ~/.nvm/nvm.sh && nvm use 20.19.0 >/dev/null && pnpm --dir apps/web check-types`
- `source ~/.nvm/nvm.sh && nvm use 20.19.0 >/dev/null && NEXT_E2E_PORT=3101 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3101 pnpm --dir apps/web exec playwright test e2e/observability.spec.ts --project=chromium`
- `source ~/.nvm/nvm.sh && nvm use 20.19.0 >/dev/null && NEXT_E2E_PORT=3101 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3101 pnpm --dir apps/web exec playwright test`
- `source ~/.nvm/nvm.sh && nvm use 20.19.0 >/dev/null && tools/scripts/run_web_ui_harness.sh --workers=1 e2e/observability.spec.ts`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `git diff --check`
- `tools/scripts/compose-worktree.sh up`
- `ALEMBIC_DATABASE_URL=postgresql+asyncpg://grove:grove@127.0.0.1:24354/grove uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `ALEMBIC_DATABASE_URL=postgresql+asyncpg://grove:grove@127.0.0.1:24354/grove TENANT_SCHEMA=tenant_obs_live_v2 uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`
- `GET /observability/runs?kind=interactive_channel_session`
- `GET /observability/runs?kind=interactive_channel_session&limit=1&start=2026-03-10T09:00:00Z&end=2026-03-10T09:10:00Z`
- `GET /observability/runs/interactive_channel_session/77459221-6ef8-4149-9625-ee15bc12b74a`
- `GET /observability/runs/interactive_channel_session/77459221-6ef8-4149-9625-ee15bc12b74a/timeline`
- `GET /admin/observability/runs/interactive_channel_session/77459221-6ef8-4149-9625-ee15bc12b74a?tenant_id=9f056362-6b61-48ef-8899-c5b4d14b7301`
- `GET /admin/observability/runs/interactive_channel_session/77459221-6ef8-4149-9625-ee15bc12b74a/timeline?tenant_id=9f056362-6b61-48ef-8899-c5b4d14b7301`
- `GET /observability/runs/compare?kind=interactive_channel_session&left=77459221-6ef8-4149-9625-ee15bc12b74a&right=1e7a721c-b2ae-44d6-a2b6-562d74cc1f53`
- `tools/scripts/obs_traceql.sh 'trace_id:9d272c87e8c4b36cc27cd1359f91390f' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} |= "/observability/runs?kind=interactive_channel_session&limit=1&start=2026-03-10T09:00:00Z&end=2026-03-10T09:10:00Z"' 15m 20`
- `tools/scripts/obs_promql.sh 'up{job="platform-api"}'`

## Notes

- This does **not** close the wider V2 observability backlog. Control-plane incidents, channel-runtime health, and broader composition diagnostics still need first-class normalized read surfaces.
- Shipping backend-only here would be trash. The web workspace must understand the new subject kind in the same PR line or the contract remains fragmented.
- Local review caught four real bugs during this slice:
  - related-entity links were emitting `kind=` instead of the route contract's `filter_kind=` query parameter
  - the interactive-channel list path was applying `LIMIT` before the requested time window, which could silently drop valid in-range sessions when newer out-of-range rows existed
  - malformed `channel_session_id` values were reaching a raw `::uuid` database cast and returning 500 instead of the established 400 `Invalid channel_session_id` contract
  - interactive-channel list ordering was still prioritizing `started_at` after windowing by latest activity, which could bury the most recently degraded chat below a newer-started but older-activity one
  The branch fixes all four before PR publication.

## Outcome

Tenant and deployment observability are no longer locked to `call_session` and `workflow_run`. This slice makes `interactive_channel_session` a first-class route-backed subject across the normalized list/detail/timeline/compare API and the corresponding tenant/admin browser routes.

Live compose proof used tenant `obs_live_v2` in schema `tenant_obs_live_v2` with two seeded web-chat sessions:

- `77459221-6ef8-4149-9625-ee15bc12b74a` resolved as `Blocked`, with `lead_state=failed`, `recommendation_state=unavailable`, `abuse_state=blocked`, and `composition_version=comp-web-left`
- `1e7a721c-b2ae-44d6-a2b6-562d74cc1f53` resolved as `Delivered`, with `lead_state=delivered` and `composition_version=comp-web-right`
- tenant list/detail/timeline and admin detail/timeline all returned 200 with normalized `channel_session_id`, `conversation_id`, `correlation_id`, `composition_version`, and `artifact_hash`
- compare returned the expected context deltas for composition version, lead state, and abuse state between the two channel sessions
- after inserting six newer out-of-window sessions on `2026-03-12`, the narrow-window tenant list query `start=2026-03-10T09:00:00Z`, `end=2026-03-10T09:10:00Z`, `limit=1` still returned `77459221-6ef8-4149-9625-ee15bc12b74a`; the old pre-fix query shape would have dropped it
- Tempo captured the fixed narrow-window list trace `9d272c87e8c4b36cc27cd1359f91390f`, tenant detail trace `97258c2f25ca5153e0d128f38c247d25`, and admin detail trace `1834cead88689fe47b2d120b2d242b29`
- Loki captured the corresponding access-log line for the narrow-window list query plus the tenant/admin detail routes for the new `interactive_channel_session` surface
- Prometheus currently proves scrape visibility for the live read surface via `up{job="platform-api"} = 1`; dedicated route counters for observability reads remain separate debt

Artifacts captured for this slice:

- live route payloads and headers in `tools/agents/artifacts/observability/v2_observability_runs_live/`
- seed metadata in `tools/agents/artifacts/observability/v2_observability_runs_live_seed.json`
- manual browser artifacts:
  - `tools/agents/artifacts/ui-harness/manual-playwright-observability-desktop.png`
  - `tools/agents/artifacts/ui-harness/manual-playwright-observability-mobile.png`
  - `tools/agents/artifacts/ui-harness/manual-chrome-observability-desktop.png`
  - `tools/agents/artifacts/ui-harness/manual-chrome-observability-mobile.png`
  - `tools/agents/artifacts/ui-harness/manual-chrome-observability-desktop.snapshot.txt`
  - `tools/agents/artifacts/ui-harness/manual-chrome-observability-mobile.snapshot.txt`
