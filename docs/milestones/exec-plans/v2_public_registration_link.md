# V2 Public Registration Link

Status: completed

## Objective

Ship the next stacked V2 public-ingress slice as a rebased PR follow-up:

- target checklist row advanced: `docs/requirements/checklist.md` row `132`
- target user story: `Agent provides registration link when visitor is ready to register`

## Scope

- add a typed widget-level registration URL contract to public widget config
- expose the registration URL through public widget config/bootstrap responses
- populate recommendation item `action_url` values from the widget registration URL
- persist recommendation payloads with stable registration links instead of leaving CTA wiring as UI fiction
- prove the behavior with unit and integration coverage

## Non-Goals

- website widget frontend rendering
- analytics intake
- multi-step follow-up workflows
- governed content lifecycle for registration copy
- channel runtime health rollups

## Status

- [x] bind the slice to checklist row `132`
- [x] add the typed widget registration URL contract plus public schema migration
- [x] populate recommendation payload action URLs from widget config
- [x] add unit and integration proof for config/bootstrap/recommendation propagation
- [x] update `docs/requirements/checklist.md` with truthful progress
- [x] run checklist/doc/static verification
- [x] run pre-PR CI
- [x] capture live compose + observability proof for ready-path registration links
- [ ] republish the rebased PR branch and refresh remote CI/review state

## Notes

- This slice is intentionally narrow. It closes the “ready to register” conversion hole without pretending widget analytics, governed content, or the full `channels` runtime are done.
- The registration URL is stored on `public.widget_configs`, not hidden in generic solution `custom_fields`, because this is public-ingress contract data with a stable schema.
- Recommendation payloads already had `action_url`; leaving that field empty while claiming clickable registration options would be trash.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ packages/platform-core/src/platform_core/alembic_public/versions/20260315_160000_widget_registration_url.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py docs/milestones/exec-plans/v2_public_registration_link.md docs/requirements/checklist.md`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ packages/platform-core/src/platform_core/alembic_public/versions/20260315_160000_widget_registration_url.py apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `git diff --check`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `ALEMBIC_DATABASE_URL="$PLATFORM_E2E_ALEMBIC_DATABASE_URL" uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `CREATE SCHEMA IF NOT EXISTS tenant_voxregistrationlive`
- `TENANT_SCHEMA=tenant_voxregistrationlive ALEMBIC_DATABASE_URL="$PLATFORM_E2E_ALEMBIC_DATABASE_URL" uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`
- `POST /public/widgets/vox-registration-widget/bootstrap`
- `GET /public/chat/sessions/{guest_session_id}/recommendations?guest_token=...`
- `SELECT jsonb_pretty(items_payload) FROM tenant_voxregistrationlive.public_recommendations ...`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "recommendations" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event="public_chat_recommendations_served"' 15m 20`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="public_chat_recommendations",outcome="success"})'`

## Outcome

The public recommendation ready-path now emits clickable registration CTAs instead of dead payloads. Live compose proof showed:

- bootstrap returned widget-level `registration_url`
- recommendations returned `resolution_state=ready` with three `action_url` values containing `guest_session_id`, `conversation_id`, and `slot_id`
- tenant persistence stored the same action URLs in `tenant_voxregistrationlive.public_recommendations`
- observability captured the request end-to-end via Tempo trace `7e54585608a9ae26edbe35217beaedf7`, a `public_chat_recommendations_served` Loki event with `recommendation_count=3`, and Prometheus route metric `platform_api_route_events_total{route="public_chat_recommendations",outcome="success"} = 1`

This still advances the requirement only to backend-only foundation in repo terms. There is still no repo-visible web/widget caller rendering these CTA links during the actual public chat flow, so checklist row `132` stays partial rather than pretending the end-to-end UX exists here.
