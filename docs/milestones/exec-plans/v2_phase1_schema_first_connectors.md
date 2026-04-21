# V2 Phase 1: Schema-First Connectors

Date: 2026-03-16

## Goal

Finish the remaining real Phase 1 gap in `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`:

- adapter metadata with `configSchema` and `uiHints`
- API exposure of adapter catalog/schema
- connector config validation against declared schema

Package-family groundwork already existed from earlier V2 work. This note tracks the connector-governance closeout.

## Why This Slice Exists

Before this branch, connector governance was weak:

- adapter registries only tracked factories
- discovery only registered entry points by name
- connector CRUD accepted nearly arbitrary JSON after only plaintext-secret checks
- there was no API catalog telling operators which adapter schemas actually exist

That made Phase 1 look more complete than it was. That was garbage.

## Implemented

- added typed adapter metadata in `packages/platform-core/src/platform_core/contracts/registry.py`
- entry-point discovery now preserves attached adapter descriptors in `packages/platform-core/src/platform_core/contracts/discovery.py`
- built-in and installed adapters now declare real schema/catalog metadata:
  - `packages/platform-core/src/platform_core/contracts/builtin_adapters.py`
  - `solutions/appointment_booking/src/appointment_booking/clinic_webhook_crm.py`
  - `solutions/lead_capture/src/lead_capture/webhook_crm.py`
  - `solutions/notifications/src/notifications/telnyx_sms.py`
- connector service now validates config against declared schema and exposes a catalog:
  - `packages/platform-core/src/platform_core/connectors/service.py`
- typed outbound adapters now validate destination URLs against the connector invoke host allowlist at save-time and runtime instead of trusting arbitrary tenant-supplied targets:
  - `packages/platform-core/src/platform_core/connectors/service.py`
  - `solutions/appointment_booking/src/appointment_booking/clinic_webhook_crm.py`
  - `solutions/lead_capture/src/lead_capture/webhook_crm.py`
  - `solutions/notifications/src/notifications/telnyx_sms.py`
- API catalog route added at `GET /connectors/catalog`:
  - `apps/api/src/platform_api/routes/connectors.py`
- connector catalog visibility now respects tenant enabled-solution state instead of exposing every installed adapter to every tenant:
  - `apps/api/src/platform_api/routes/connectors.py`
  - `packages/platform-core/src/platform_core/contracts/registry.py`
  - `packages/platform-core/src/platform_core/connectors/service.py`
  - `solutions/appointment_booking/src/appointment_booking/clinic_webhook_crm.py`
  - `solutions/lead_capture/src/lead_capture/webhook_crm.py`
  - `solutions/notifications/src/notifications/telnyx_sms.py`
- tenant integrations UI now consumes the connector catalog instead of pretending operators should guess adapter IDs, and legacy/API-only rows no longer pretend to support tenant-visible health checks:
  - `apps/web/src/app/(tenant)/integrations/page-client.tsx`
  - `apps/web/e2e/integrations.spec.ts`
- saved connector responses now expose adapter source-kind/internal-only metadata so the tenant UI can distinguish true internal-only rows from legacy compatibility rows without hardcoded adapter-name lists:
  - `packages/platform-core/src/platform_core/connectors/service.py`
  - `apps/api/src/platform_api/routes/connectors.py`
  - `apps/api/tests/integration/test_connectors.py`
  - `apps/web/src/lib/api/connectors.ts`
  - `apps/web/src/app/(tenant)/integrations/page-client.tsx`
  - `apps/web/e2e/integrations.spec.ts`
- web API client can fetch the connector catalog:
  - `apps/web/src/lib/api/connectors.ts`
- connector route observability now emits route spans, structured logs, and Prometheus counters for catalog/create/list/detail/update/health-check:
  - `apps/api/src/platform_api/routes/connectors.py`
  - `apps/api/tests/integration/test_connectors.py`

## Compatibility Decision

Legacy generic invoke compatibility still exists, but not by accepting arbitrary garbage.

This branch now uses four explicit rules:

- typed installed adapters use their declared schema
- the explicit legacy adapter name `generic_http_invoke` remains tenant-manageable through the `/connectors` API plus `/connectors/{connector_id}/invoke` for the raw REST compatibility lane
- `generic_http_invoke` is intentionally hidden from the tenant-facing typed catalog/UI because this page only supports declared typed adapters
- preexisting undeclared adapters can still be renamed or disabled without mutating config, but config edits fail closed until the adapter is republished with catalog metadata or managed through the API-only compatibility lane
- internal-only adapters such as `memory` are blocked from tenant-facing connector create/update, and new unknown adapter names fail closed instead of silently pretending to be valid

That keeps existing raw HTTP invoke connectors working for API consumers without letting typoed, non-existent, or dev-only adapters sneak through as fake “validated” config.

## Proof

Completed:

- `uv run pytest packages/platform-core/tests/unit/test_contracts/test_contracts.py packages/platform-core/tests/unit/test_contracts/test_discovery.py -q --tb=short`
  - result: `25 passed`
- `uv run ruff check packages/platform-core/src/platform_core/contracts/registry.py packages/platform-core/src/platform_core/contracts/discovery.py packages/platform-core/src/platform_core/contracts/builtin_adapters.py packages/platform-core/src/platform_core/connectors/service.py solutions/appointment_booking/src/appointment_booking/clinic_webhook_crm.py solutions/notifications/src/notifications/telnyx_sms.py apps/api/src/platform_api/routes/connectors.py packages/platform-core/tests/unit/test_contracts/test_contracts.py packages/platform-core/tests/unit/test_contracts/test_discovery.py packages/platform-core/tests/integration/test_connector_registry_and_health.py apps/api/tests/integration/test_connectors.py tests/architecture/test_v2_preparation_contracts.py`
  - result: `All checks passed!`
- `uv run pyright packages/platform-core/src/platform_core/contracts/registry.py packages/platform-core/src/platform_core/contracts/discovery.py packages/platform-core/src/platform_core/contracts/builtin_adapters.py packages/platform-core/src/platform_core/connectors/service.py solutions/appointment_booking/src/appointment_booking/clinic_webhook_crm.py solutions/notifications/src/notifications/telnyx_sms.py apps/api/src/platform_api/routes/connectors.py`
  - result: `0 errors, 0 warnings, 0 informations`
- `uv run pytest solutions/lead_capture/tests/unit/test_webhook_crm.py packages/platform-core/tests/integration/test_connector_registry_and_health.py apps/api/tests/integration/test_connectors.py -q --tb=short`
  - result: `23 passed, 10 warnings`
- `uv run pytest tests/architecture/test_v2_preparation_contracts.py -q --tb=short`
  - result: `6 passed`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
  - result: `API inventory contract OK (endpoints=172, missing=0, planned_without_contract=6)`
- `pnpm --dir apps/web exec vitest run tests/connectors-api.test.ts`
  - result: `5 passed`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && NEXT_E2E_PORT=3116 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3116 pnpm --dir apps/web exec playwright test e2e/integrations.spec.ts --project=chromium`
  - result: `2 passed`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && NEXT_E2E_PORT=3117 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3117 pnpm --dir apps/web exec playwright test`
  - result: `79 passed`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && tools/scripts/run_web_ui_harness.sh`
  - result: `UI harness complete`
  - artifacts: `tools/agents/artifacts/ui-harness/local-20260316T173936Z/`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && tools/scripts/run_local_pre_pr_ci.sh`
  - result: `Local pre-PR CI passed.`
- Chrome DevTools desktop/mobile manual verification artifacts:
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-desktop-devtools.png`
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-mobile-devtools.png`
- Playwright MCP desktop/mobile manual verification artifacts:
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-desktop-playwright-mcp.png`
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-mobile-playwright-mcp.png`
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-playwright-mcp.json`
  - `tools/agents/artifacts/ui-harness/manual-phase1-integrations-playwright-mcp.txt`
- `tools/scripts/compose-worktree.sh up`
  - result: `platform-api` and `temporal-worker` healthy with worktree-scoped Prometheus/Loki/Tempo
- local connector CRUD + catalog + health-check workload against the compose stack
  - result: connector flow succeeded for tenant `5da5b14e-4727-4ee7-85bf-a128b1efce07` and connector `ffc9d39b-8386-4b98-9574-32071ae90aec`; the health-check route returned `latest_health.status=unhealthy`, which is acceptable here because the proof target is route/log/metric/span emission rather than adapter health
- `tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route=~"connector_(catalog|create|list|detail|update|health_check)",outcome="success"})' 15m`
  - result: `connector_catalog=1`, `connector_create=1`, `connector_list=1`, `connector_detail=1`, `connector_update=1`, `connector_health_check=1`
- `tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.route.resource =~ "connector_(catalog|create|list|detail|update|health_check)" }' 15m`
  - result: six connector route spans captured in Tempo, one each for catalog/create/list/detail/update/health-check
- `tools/scripts/obs_logql.sh '{compose_project="grove-jakit-1926988947",service="platform-api"} | json | event=~"connector_(catalog_read|created|list_read|detail_read|updated|health_check_requested)"' 15m 50`
  - result: six structured platform-api events captured in Loki with matching trace IDs

OTLP evidence snapshot:

- OTLP spans emitted: Yes

```bash
tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.route.resource =~ "connector_(catalog|create|list|detail|update|health_check)" }' 15m | jq '{traces: [.traces[] | {traceID, rootTraceName, route: ([.spanSet.spans[0].attributes[] | select(.key == "route.resource")][0].value.stringValue), durationMs}], metrics}'
{
  "traces": [
    {
      "traceID": "d7d583a05874576ae21c5ccd603f307c",
      "rootTraceName": "http POST /connectors/ffc9d39b-8386-4b98-9574-32071ae90aec/health-check",
      "route": "connector_health_check",
      "durationMs": 178
    },
    {
      "traceID": "dd645c61c6706aa361e8441c3f631429",
      "rootTraceName": "http PATCH /connectors/ffc9d39b-8386-4b98-9574-32071ae90aec",
      "route": "connector_update",
      "durationMs": 39
    },
    {
      "traceID": "52b8b66b8614aa2b715b6def040e4fcc",
      "rootTraceName": "http GET /connectors/ffc9d39b-8386-4b98-9574-32071ae90aec",
      "route": "connector_detail",
      "durationMs": 15
    },
    {
      "traceID": "7be673cbb84fb77e97f7313b382e60cd",
      "rootTraceName": "http GET /connectors",
      "route": "connector_list",
      "durationMs": 24
    },
    {
      "traceID": "81b6574760638621309b2fdf02aa8195",
      "rootTraceName": "http POST /connectors",
      "route": "connector_create",
      "durationMs": 65
    },
    {
      "traceID": "6463644dcdfbedb1a250193767e091c7",
      "rootTraceName": "http GET /connectors/catalog",
      "route": "connector_catalog",
      "durationMs": 21
    }
  ],
  "metrics": {
    "inspectedBytes": "144270",
    "completedJobs": 1,
    "totalJobs": 1
  }
}
```

```bash
tools/scripts/obs_logql.sh '{compose_project="grove-jakit-1926988947",service="platform-api"} | json | event=~"connector_(catalog_read|created|list_read|detail_read|updated|health_check_requested)"' 15m 50 | jq '{events: [.data.result[] | {event: .stream.event, trace_id: .stream.trace_id, span_id: .stream.span_id, connector_id: (.stream.connector_id // null), tenant_id: .stream.tenant_id}], totalEntriesReturned: .data.stats.summary.totalEntriesReturned}'
{
  "events": [
    {
      "event": "connector_created",
      "trace_id": "81b6574760638621309b2fdf02aa8195",
      "span_id": "a7fc5b1f50dfe0a0",
      "connector_id": "ffc9d39b-8386-4b98-9574-32071ae90aec",
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    },
    {
      "event": "connector_updated",
      "trace_id": "dd645c61c6706aa361e8441c3f631429",
      "span_id": "7cbf80dd4cb206fe",
      "connector_id": "ffc9d39b-8386-4b98-9574-32071ae90aec",
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    },
    {
      "event": "connector_detail_read",
      "trace_id": "52b8b66b8614aa2b715b6def040e4fcc",
      "span_id": "106aa9ec2d4c1929",
      "connector_id": "ffc9d39b-8386-4b98-9574-32071ae90aec",
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    },
    {
      "event": "connector_health_check_requested",
      "trace_id": "d7d583a05874576ae21c5ccd603f307c",
      "span_id": "88cd073ee6619e80",
      "connector_id": "ffc9d39b-8386-4b98-9574-32071ae90aec",
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    },
    {
      "event": "connector_catalog_read",
      "trace_id": "6463644dcdfbedb1a250193767e091c7",
      "span_id": "3f33999887f1bc77",
      "connector_id": null,
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    },
    {
      "event": "connector_list_read",
      "trace_id": "7be673cbb84fb77e97f7313b382e60cd",
      "span_id": "9f0e50b419c66a8a",
      "connector_id": null,
      "tenant_id": "5da5b14e-4727-4ee7-85bf-a128b1efce07"
    }
  ],
  "totalEntriesReturned": 6
}
```

```bash
tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route=~"connector_(catalog|create|list|detail|update|health_check)",outcome="success"})' | jq '.'
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "outcome": "success",
          "route": "connector_catalog"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      },
      {
        "metric": {
          "outcome": "success",
          "route": "connector_create"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      },
      {
        "metric": {
          "outcome": "success",
          "route": "connector_list"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      },
      {
        "metric": {
          "outcome": "success",
          "route": "connector_detail"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      },
      {
        "metric": {
          "outcome": "success",
          "route": "connector_update"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      },
      {
        "metric": {
          "outcome": "success",
          "route": "connector_health_check"
        },
        "value": [
          1773688782.754,
          "1"
        ]
      }
    ]
  }
}
```

Review findings already addressed:

- `tools/agents/artifacts/pr-review/context/local_phase1_connector_review.out` correctly flagged the old unknown-adapter fallback; this branch now rejects undeclared adapter names unless they are the explicit `generic_http_invoke` legacy lane
- the same review correctly flagged that `/connectors/catalog` was only wired as a dead helper; the tenant integrations page and its E2E coverage now consume that catalog for adapter selection, setup guidance, and health-check affordances
- the follow-up review correctly flagged that dev-only `memory` and legacy generic invoke were being mixed into the same operator path; tenant-facing connector CRUD now blocks `memory`, catalog/UI no longer surface generic invoke, and the generic invoke compatibility lane is now explicitly documented as API-only through `/connectors` plus `/connectors/{connector_id}/invoke`
- the latest successful review correctly flagged that typed outbound adapters were still trusting arbitrary tenant-supplied URLs; this branch now applies the connector invoke host allowlist to `clinic_webhook` and `telnyx_sms` during connector save and again when those adapters issue outbound requests
- the next review correctly flagged that legacy undeclared connectors would have lost name/status-only edits after the fail-closed adapter change; this branch now preserves rename/disable updates for preexisting undeclared rows while still rejecting new unknown adapters and unknown config edits
- the next fresh review correctly flagged that `lead_capture_webhook` was still entering the catalog through the permissive descriptorless fallback; this branch now attaches explicit schema/UI metadata for that adapter and the tenant integrations UI now seeds the correct webhook config shape when it is selected
- the next fresh review correctly flagged that the integrations page was still defaulting missing catalog metadata to `supports_health_check=true` and exposing solution-scoped adapters across tenants; this branch now disables tenant-visible health checks when no descriptor is present and filters `/connectors/catalog` by the tenant's enabled solutions
- the next fresh review correctly flagged that the integrations UI still hardcoded `memory` as its only internal-only adapter; saved connector responses now carry descriptor-derived `adapter_internal_only` / `adapter_source_kind` metadata and the UI/E2E coverage now distinguish internal-only rows from legacy compatibility rows without adapter-name hacks
- the latest review correctly flagged that the integrations form was mislabeling missing catalog metadata for disabled solution-owned adapters and that the API coverage only asserted descriptor metadata on detail responses; this branch now renders a dedicated “solution disabled” warning for `entry_point` rows hidden from the catalog and asserts `adapter_source_kind` / `adapter_internal_only` on `GET /connectors` list rows too

Note:

- `tools/scripts/run_local_pr_review.sh` now builds a durable prompt plus last-message artifact around `codex_exec.py`; this slice keeps those files because the wrapper subprocess itself can still get interrupted locally even when the generated review content is usable
- the built-in Playwright MCP wrapper still threw `Transport closed` locally, but the Phase 1 manual proof is no longer blocked: the same `@playwright/mcp` server was driven directly over its local SSE transport and produced desktop/mobile artifacts plus a parsed result snapshot for the changed integrations flow

## Status

- code changes: complete
- targeted proof: complete
- web UI gate: complete; Chrome DevTools MCP, Playwright MCP, Playwright CLI, and the full UI harness all have retained artifacts
- OTLP proof: complete
- local deep review: latest completed review artifact had no `P1`/`P2` findings; all remaining `P3`s from that run are fixed, and the post-fix rerun is currently tooling-blocked because local `codex_exec.py` workers are hanging without writing a fresh last-message artifact
- branch gate rerun: complete under Node 22 after SSRF and API-only compatibility corrections
- PR: merged as `#575`
