# V2 Observability Channel Runtimes

Status: in_progress
Owner: Codex
Date: 2026-03-16

## Goal

Add the missing V2 channel-runtime observability API surface so operators can inspect runtime state without abusing run/session routes.

This slice is intentionally API-first:
- add tenant + admin list/detail/timeline read models for channel runtimes
- keep correlation, tenant, widget, composition, and artifact identifiers systematic
- project truth from existing public-ingress tables instead of inventing a fake runtime service
- prove the routes locally with real seeded data
- do not claim product-live operator UX until the web workspace consumes the new routes

## Contract Rows

- `docs/requirements/checklist.md`
  - operator-grade observability summary bullet
- `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`
  - Must-have: normalized API contracts

## Scope

1. Add `/observability/channel-runtimes` and `/admin/observability/channel-runtimes`.
2. Add detail + timeline endpoints for one widget runtime.
3. Project runtime status, auth state, delivery state, degradation reasons, and composition/artifact context from:
   - `public.widget_configs`
   - `public.guest_session_controls`
   - `public.kpi_events`
   - `public.operator_events`
4. Add integration coverage for tenant + admin read paths.

## Files

- `apps/api/src/platform_api/routes/observability.py`
- `apps/api/tests/integration/test_observability.py`
- `docs/requirements/checklist.md`
- `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`

## Verification

- `uv run ruff check apps/api/src/platform_api/routes/observability.py apps/api/tests/integration/test_observability.py`
- `uv run pyright apps/api/src/platform_api/routes/observability.py apps/api/tests/integration/test_observability.py`
- `uv run pytest apps/api/tests/integration/test_observability.py -q --tb=short -k 'parseable_trace_context or blocked_session_degradation or sort_runs_prefers_latest_activity_before_start_time'`
- `uv run pytest apps/api/tests/integration/test_observability.py -q --tb=short -k 'test_tenant_and_admin_channel_runtime_observability_list_detail_and_timeline'`
- `uv run python tools/scripts/check_api_inventory.py`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `git diff --check`
- `LOCAL_PR_REVIEW_TIMEOUT_SECONDS=900 CODEX_REVIEW_MODEL=gpt-5.4 CODEX_REVIEW_REASONING_EFFORT=high python3 tools/agents/review.py --base origin/feat/v2-observability-runs --uncommitted`

## Notes

- The targeted pytest line is currently blocked by local testcontainer startup instability. The failure is environmental (`postgres:16-alpine` container dies before readiness), not an assertion failure in the route code.
- Manual seeded proof already flushed and fixed one real bug in this slice: `operator_events.metadata` needed an explicit `::jsonb` cast before `jsonb || ...` in the runtime operator-event projection.
- Local review found and this slice now fixes four real correctness bugs before push:
  - quiet runtimes with long-lived tokens no longer sort ahead of active runtimes because `latest_control_at` now uses token issuance time instead of future expiry
  - `trace_unavailable` now stays true unless the runtime correlation id is a parseable `traceparent`
  - blocked-session degradation timeline items now use the known issue time instead of future token expiry
- tenant/admin `status` filtering now matches the serialized runtime status, so token-only runtimes stay `Ready` instead of being filtered back as phantom `Running`
- A fresh manual re-proof against the current compose Postgres was blocked by local DB recovery mode (`pg_isready` rejecting connections), so the final delta relies on the local review findings plus the new non-container pytest coverage above.
- This does not close the remaining V2 observability debt. Control-plane incidents and broader composition diagnostics still need normalized read surfaces.
- The backend route surface is rebuilt on current `main`, and `apps/web/src/lib/api/observability.ts` now exposes typed web client helpers for `/observability/channel-runtimes*` and `/admin/observability/channel-runtimes*` so route inventory no longer lies about zero web callers. The existing generic observability workspace still targets the legacy `/observability/runs/channel_runtime/*` voice-route detail/timeline flow, so dedicated widget-runtime operator UI remains a separate follow-up instead of being smuggled into this API slice.
