# V2 Public Lead Delivery

## Objective

Ship the next stacked V2 public-ingress slice as a draft PR:

- target checklist rows advanced: `docs/requirements/checklist.md` rows `130`, `131`, and `209`
- target requirement: `Captured lead data is delivered to CRM or sales inbox in agreed format with all required fields`

## Scope

- add a public-ingress delivery service that turns delivery-ready lead captures into CRM delivery attempts
- resolve CRM adapter selection from tenant solution config or the single active healthy connector
- add a generic `lead_capture_webhook` CRM adapter for structured webhook delivery
- persist `delivered` or `failed` lead state plus delivery references and operator escalations
- add unit + integration proof for successful delivery, failed delivery, and adapter payload shape

## Non-Goals

- website widget UI
- assistant-side lead extraction or qualification policy
- inbox-specific email delivery adapters
- voice follow-up workflows
- broader connector management UX

## Status

- [x] bind the slice to concrete checklist rows
- [x] implement connector-backed lead delivery from public-ingress submit
- [x] add a solution-owned generic webhook CRM adapter
- [x] add unit and integration proof for success and failure paths
- [x] update `docs/requirements/checklist.md` with truthful progress
- [x] run checklist evidence + pre-PR CI
- [x] capture local observability proof for delivered public lead capture
- [ ] commit, push, and open the draft PR

## Notes

- This slice only earns its keep if website lead capture stops at least one real failure mode: silently storing a lead while pretending delivery will happen later.
- Delivery is intentionally conservative. Partial captures still persist as `captured`; only delivery-ready leads attempt CRM handoff.
- This is not full connector-governance completion. It uses the existing connector contract honestly, which is good enough for this slice and not good enough to declare item `2` done.
- Local observability proof used the worktree compose stack plus a disposable host-side mock CRM webhook on `host.docker.internal`. That is ugly but honest: it proves the connector-backed delivery path inside the running `platform-api` container instead of another in-memory fake.
- Review hardening tightened two real failure modes: delivery now skips cleanly when `lead_capture` is not enabled for the tenant instead of falling through to arbitrary active CRM connectors, and the generic webhook adapter now reuses connector host-allowlist validation before any outbound HTTP call.
- Follow-up review hardening closed two more real defects: repeated ready submits now treat an already delivered lead as idempotent instead of firing the CRM handoff again, and delivery-path config/operator-event storage failures now bubble as public-ingress `503` errors instead of raw `500`s.
- Final review hardening removed the last weak assumptions: public lead delivery now requires an explicit `lead_capture.crm_adapter` instead of hijacking whichever CRM connector happens to be active, and `DELIVERED` is treated as terminal even when an upstream webhook returns success without a provider ID.

## Verification

- `uv run pytest solutions/lead_capture/tests/unit/test_webhook_crm.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py solutions/lead_capture/src/lead_capture/webhook_crm.py solutions/lead_capture/tests/unit/test_webhook_crm.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py solutions/lead_capture/src/lead_capture/webhook_crm.py solutions/lead_capture/tests/unit/test_webhook_crm.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py solutions/lead_capture/src/lead_capture/webhook_crm.py solutions/lead_capture/tests/unit/test_webhook_crm.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `tools/scripts/run_local_pre_pr_ci.sh`
- `tools/scripts/compose-worktree.sh up`
- `uv run python -m alembic -c packages/platform-core/alembic_public.ini upgrade head`
- `TENANT_SCHEMA=tenant_voxobsdelivery uv run python -m alembic -c packages/platform-core/alembic.ini upgrade head`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "lead_capture_submit" }' 15m`
- `tools/scripts/obs_logql.sh '{service="platform-api"} | json | event=~"public_chat_lead_capture_submitted|public_lead_capture_delivered"' 15m 50`
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="public_chat_lead_capture_submit",outcome="success"})'`
