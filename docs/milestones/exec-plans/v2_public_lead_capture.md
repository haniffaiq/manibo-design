# V2 Public Lead Capture

## Objective

Ship the next stacked V2 public-ingress slice as a draft PR:

- target checklist row advanced: `docs/requirements/checklist.md` section `5. Website Sales Agent (Phase 1 — Critical)`
- target requirement: `Agent captures structured lead data: name, email, phone, assessed level, learning goals, availability, preferred location, target language`

## Scope

- add typed public lead-capture submit/status contracts for guest-session continuation routes
- persist a tenant-visible lead-capture record as canonical public-ingress truth
- add public lead-capture submit + status routes in `apps/api`
- add unit + integration proof for upsert behavior, path/token mismatch rejection, and status reads

## Non-Goals

- CRM or inbox delivery
- assistant response generation
- recommendation payloads
- escalation handoff
- website widget frontend embed

## Status

- [x] choose the next stacked slice and bind it to a checklist row
- [x] implement typed public lead-capture models and tenant migration
- [x] implement submit + status API routes
- [x] add unit and integration coverage
- [x] update `docs/requirements/checklist.md` with truthful progress
- [x] run generated-doc refresh and pre-PR CI
- [x] capture local observability proof for submit + status
- [ ] commit, push, and open the draft PR

## Notes

- This slice is only worth merging if structured website lead data becomes durable tenant truth instead of a future TODO layered on transient chat state.
- CRM delivery is intentionally deferred. Pretending otherwise would be trash because no solution-owned delivery path or connector selection contract has been wired for public website leads yet.
- Local worktree proof used `tools/scripts/compose-worktree.sh up`, which brings up the `platform` profile but does not run `db-migrations`. For this slice, local proof therefore required an explicit `packages/platform-core/alembic_public.ini` upgrade plus a disposable tenant-schema migration/seed before driving the public routes.
- Restack work on `#536` had to fold in inherited public-ingress hardening from the `#531` line because the child branch was still carrying stale query-string guest-token reads and proxy-collapsed CORS prelookup buckets. Leaving that trash in place would make the lead-capture slice fail for parent-branch reasons.
- Lead-capture persistence now also maps tenant-schema/storage failures to `PublicIngressServiceUnavailableError` instead of leaking raw asyncpg exceptions through the API surface.
- Review hardening added a dedicated guest-session lead-capture rate-limit key and commit-time session/conversation revalidation before tenant writes. Without those guards, anonymous lead capture was spam-friendly and could still write against stale session state after auth-time checks.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short -k lead_capture`
- `uv run pytest packages/platform-core/tests/unit/test_call_state_cleanup.py -q --tb=short`
- `uv run pyright apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_service.py`
- `uv run ruff check apps/api/src/platform_api/main.py apps/api/src/platform_api/routes/public_ingress.py apps/api/tests/unit/test_public_ingress_route_helpers.py apps/api/tests/unit/test_public_ingress_app_wiring.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/src/platform_core/alembic/versions/20260315_130000_public_lead_captures.py packages/platform-core/tests/unit/test_call_state_cleanup.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/alembic/versions/20260315_130000_public_lead_captures.py packages/platform-core/tests/unit/test_call_state_cleanup.py --check`
- `uv run python tools/scripts/generate_api_inventory.py`
- `tools/scripts/generated_artifacts.sh refresh`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "lead_capture_submit" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event=~"public_chat_lead_capture_(submitted|status_served)"' 15m 20`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route=~"public_chat_lead_capture_(submit|status)",outcome="success"})'`
