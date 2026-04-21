# M36.2: Observability Investigation API Decomposition — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Freeze observability investigation API contract and import surface | Done | 2026-04-14 |
| T02 | Extract observability route schemas and dependencies | Done | 2026-04-14 |
| T03 | Move workflow-run decoding and builders into platform-core observability | Done | 2026-04-14 |
| T04 | Move call-session investigation builders into platform-core observability | Done | 2026-04-14 |
| T05 | Move channel, interactive-session, incident, and composition builders into platform-core observability | Done | 2026-04-14 |
| T06 | Replace the observability god router with thin tenant/admin routes and presenters | Done | 2026-04-15 |
| T07 | Tighten guards and prove observability API inventory stability | Done | 2026-04-15 |

## Notes

- M36.2 starts after completed M36.1. It is the dedicated follow-on milestone
  for the observability investigation API.
- The main hotspot is
  `apps/api/src/platform_api/routes/observability/router.py` at 8,012 LOC on
  `origin/main`.
- `apps/api/src/platform_api/routes/observability/reports.py` remains at
  926 LOC, but it is explicitly deferred to a later KPI/report cleanup
  milestone so M36.2 stays diagnosis-focused and reviewer-atomic.
- The platform-wide boundary now applies here and to future platform features:
  - `platform_api` owns HTTP transport
  - `platform_core` owns reusable platform logic
  - code that can run without FastAPI moves below the API shell
  - code that mentions HTTP auth semantics or API-specific href/cursor shaping
    stays in the API shell
- T01 freezes the current `platform_api.routes.observability` package surface
  before any code moves:
  - public package-level imports currently used by callers:
    - `create_observability_router`
    - `create_admin_observability_router`
    - `ChannelRuntimeControlRow`
    - `ChannelRuntimeRow`
    - `InteractiveChannelKpiEventRow`
    - `InteractiveChannelOperatorEventRow`
    - `ObservabilityChannelRuntimeSummary`
    - `ObservabilityRunSummary`
  - temporary private compatibility seams still imported by tests:
    - `_admin_bundle_for_kind`
    - `_admin_run_list`
    - `_channel_runtime_availability`
    - `_channel_runtime_correlation_maps`
    - `_channel_runtime_summary`
    - `_channel_runtime_timeline`
    - `_sort_runs`
    - `_tenant_bundle_for_kind`
  - package-level submodule seam still used by tests:
    - `span_correlation`
  - grouped observability modules still live and inventory-tracked:
    - `router`
    - `reports`
    - `dependencies`
    - `schemas`
    - `runtime`
    - `observability_enrichers`
    - `span_correlation`
  - `reports.py` remains explicitly deferred to a later KPI/report cleanup
    milestone; M36.2 covers the investigation API only
- T02 extracted the route-owned investigation models and route-only auth/query
  helpers into package-local owners:
  - `apps/api/src/platform_api/routes/observability/schemas.py` now owns the
    public response models, literal aliases, and temporary package-exported row
    types already frozen by T01
  - `apps/api/src/platform_api/routes/observability/dependencies.py` now owns
    the route-only limit/window/UUID/auth helpers and route default constants
  - `apps/api/src/platform_api/routes/observability/router.py` keeps the
    investigation builders and endpoint wiring, but stops owning inline schema
    and dependency blocks
- T03 moved the workflow investigation seam below the API shell:
  - new reusable package:
    - `packages/platform-core/src/platform_core/observability/investigation/__init__.py`
    - `packages/platform-core/src/platform_core/observability/investigation/models.py`
    - `packages/platform-core/src/platform_core/observability/investigation/workflows.py`
    - `packages/platform-core/src/platform_core/observability/investigation/service.py`
  - `apps/api/src/platform_api/routes/observability/router.py` now delegates
    workflow-run summary/detail/timeline assembly to
    `platform_core.observability.investigation` and keeps only HTTP-path
    parsing, auth, compare-context shaping, and response conversion
  - moved out of the route layer:
    - Temporal payload decoding
    - workflow trace-context extraction
    - workflow step parsing
    - workflow-run metrics, insights, integrity-gap, and timeline builders
  - focused verification:
    - `uv run pyright apps/api/src/platform_api/routes/observability/router.py packages/platform-core/src/platform_core/observability/investigation packages/platform-core/tests/unit/test_observability/test_investigation_workflows.py`
    - `uv run ruff check apps/api/src/platform_api/routes/observability/router.py apps/api/tests/integration/test_observability.py packages/platform-core/src/platform_core/observability packages/platform-core/tests/unit/test_observability/test_investigation_workflows.py`
    - `uv run pytest packages/platform-core/tests/unit/test_observability/test_investigation_workflows.py apps/api/tests/integration/test_observability.py tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_platform_api_route_contract.py -k 'workflow or observability_runs or observability_run' -q --tb=short`
- T04 moved the call-session investigation seam below the API shell:
  - new reusable package owner:
    - `packages/platform-core/src/platform_core/observability/investigation/calls.py`
  - updated exports:
    - `packages/platform-core/src/platform_core/observability/investigation/__init__.py`
    - `packages/platform-core/src/platform_core/observability/investigation/service.py`
  - `apps/api/src/platform_api/routes/observability/router.py` now delegates
    call-session detail, availability, metric, insight, integrity-gap,
    timeline, transcript, and compare-context assembly to
    `platform_core.observability.investigation`
  - moved out of the route layer:
    - call detail bundle assembly
    - transcript fallback assembly from segment rows
    - call-session metric aggregation
    - call-session insight and integrity-gap derivation
    - call-session timeline construction
    - call compare-context field derivation
  - API-only behavior intentionally stays in the shell:
    - tenant/admin auth and path parsing
    - recording signed-url path shaping
    - related-entity href construction
    - solution enricher loading and response shaping
  - focused verification:
    - `uv run pyright packages/platform-core/src/platform_core/observability/investigation apps/api/src/platform_api/routes/observability/router.py`
    - `uv run ruff check packages/platform-core/src/platform_core/observability/investigation apps/api/src/platform_api/routes/observability/router.py packages/platform-core/tests/unit/test_observability/test_investigation_calls.py`
    - `uv run pytest packages/platform-core/tests/unit/test_observability/test_investigation_calls.py apps/api/tests/integration/test_observability.py -k 'call_detail or compare or call_session' -q --tb=short`
- T05 moved the remaining channel-style investigation builders below the API
  shell:
  - new reusable package owners:
    - `packages/platform-core/src/platform_core/observability/investigation/channel_models.py`
    - `packages/platform-core/src/platform_core/observability/investigation/channels.py`
  - updated exports:
    - `packages/platform-core/src/platform_core/observability/investigation/__init__.py`
    - `packages/platform-core/src/platform_core/observability/investigation/service.py`
  - `apps/api/src/platform_api/routes/observability/router.py` now delegates
    control-plane incident, voice-route runtime, tenant-composition,
    interactive-channel, and widget channel-runtime bundle assembly to
    `platform_core.observability.investigation`
  - moved out of the route layer:
    - control-plane incident summary/detail/integrity-gap/timeline builders
    - voice-route runtime summary/detail/integrity-gap builders
    - tenant-composition summary/detail/integrity-gap/timeline builders
    - interactive-channel summary/detail/transcript/timeline builders
    - widget channel-runtime summary/timeline/availability/bundle builders
    - channel correlation selection and trace-context availability helpers
  - API-only behavior intentionally stays in the shell:
    - tenant/admin auth and query parsing
    - compare query/path shaping
    - response-model conversion
    - solution enricher loading and API-specific related-entity links
  - route-layer simplification:
    - `apps/api/src/platform_api/routes/observability/router.py` dropped from
      8,012 LOC at milestone start to 4,824 LOC after T05
    - the obsolete `platform_api.routes.observability.runtime` route-package
      import is now dead and removed from the import-surface inventory
  - focused verification:
    - `uv run pyright apps/api/src/platform_api/routes/observability/router.py packages/platform-core/src/platform_core/observability/investigation packages/platform-core/tests/unit/test_observability/test_investigation_channels.py`
    - `uv run ruff check apps/api/src/platform_api/routes/observability/router.py packages/platform-core/src/platform_core/observability/investigation packages/platform-core/tests/unit/test_observability/test_investigation_channels.py`
    - `uv run pytest packages/platform-core/tests/unit/test_observability/test_investigation_channels.py apps/api/tests/unit/test_observability_v2_read_models.py apps/api/tests/integration/test_public_ingress_observability.py apps/api/tests/integration/test_observability_control_plane_runtime.py apps/api/tests/integration/test_observability_channel_runtime_legacy_materialization.py tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_repo_file_size.py -q --tb=short`
- T06 replaced the single investigation route shell with thin route modules and
  explicit API-side helper owners:
  - new route modules:
    - `apps/api/src/platform_api/routes/observability/tenant.py`
    - `apps/api/src/platform_api/routes/observability/admin.py`
  - new API-side helper owners:
    - `apps/api/src/platform_api/routes/observability/presenters.py`
    - `apps/api/src/platform_api/routes/observability/records.py`
    - `apps/api/src/platform_api/routes/observability/listing.py`
    - `apps/api/src/platform_api/routes/observability/compare.py`
    - `apps/api/src/platform_api/routes/observability/session_details.py`
    - `apps/api/src/platform_api/routes/observability/incident_runtime_details.py`
    - `apps/api/src/platform_api/routes/observability/composition_details.py`
    - `apps/api/src/platform_api/routes/observability/interactive_runtime_details.py`
    - `apps/api/src/platform_api/routes/observability/runtime.py`
  - compatibility surface kept stable:
    - `apps/api/src/platform_api/routes/observability/__init__.py` still exports
      `create_observability_router`, `create_admin_observability_router`, the
      frozen package-level schema rows, and the temporary private seams proved
      by T01
    - `apps/api/src/platform_api/routes/observability/router.py` is now a thin
      compatibility shim that re-exports the frozen route-package surface
  - route-layer simplification:
    - `apps/api/src/platform_api/routes/observability/router.py` dropped from
      4,825 LOC after T05 to 25 LOC after T06
    - `apps/api/src/platform_api/routes/observability/tenant.py` is 377 LOC
    - `apps/api/src/platform_api/routes/observability/admin.py` is 417 LOC
    - every new observability route/helper file stays below the repository
      700-line gate
    - endpoint route modules and thin package shims stay below the 500-line
      route target
    - over-target API-side helper modules remain explicit shrink-only debt:
      `interactive_runtime_details.py`, `listing.py`, `presenters.py`,
      `records.py`, and `runtime.py`
  - API-only shaping now lives outside the route factories:
    - response bundle conversion
    - compare/timeline paging helpers
    - recording signed-url path shaping
    - API-specific related-entity href construction
  - focused verification:
    - `uv run ruff check apps/api/src/platform_api/routes/observability tests/architecture/test_platform_api_route_import_surface.py`
    - `uv run pyright apps/api/src/platform_api/routes/observability/router.py apps/api/src/platform_api/routes/observability/tenant.py apps/api/src/platform_api/routes/observability/admin.py apps/api/src/platform_api/routes/observability/presenters.py apps/api/src/platform_api/routes/observability/records.py apps/api/src/platform_api/routes/observability/listing.py apps/api/src/platform_api/routes/observability/compare.py apps/api/src/platform_api/routes/observability/session_details.py apps/api/src/platform_api/routes/observability/incident_runtime_details.py apps/api/src/platform_api/routes/observability/composition_details.py apps/api/src/platform_api/routes/observability/interactive_runtime_details.py apps/api/src/platform_api/routes/observability/runtime.py`
    - `uv run pytest apps/api/tests/integration/test_observability.py apps/api/tests/integration/test_public_ingress_observability.py apps/api/tests/integration/test_observability_composition_summary.py apps/api/tests/integration/test_telnyx_webhook_observability.py apps/api/tests/unit/test_observability_v2_read_models.py tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_platform_api_route_contract.py tests/architecture/test_repo_file_size.py -q --tb=short`
    - `tools/scripts/artifact/artifacts.sh refresh`
- T07 closed the milestone with durable anti-entropy guardrails and inventory
  proof:
  - `tests/architecture/test_platform_api_route_import_surface.py` now freezes
    the final observability route-module shape so new modules or resurrected
    private package exports require an intentional guard update
  - `tests/architecture/test_repo_file_size.py` removed the obsolete
    8,012-line `observability/router.py` allowance, enforces under-500
    ceilings for endpoint route modules and thin package shims, and freezes
    named over-target helper modules as shrink-only debt
  - `apps/api/src/platform_api/routes/observability/__init__.py` and
    `apps/api/src/platform_api/routes/observability/router.py` now expose only
    the public route factories and public row/summary schema seams; private
    test helpers import from their owning modules instead of the package root
  - `apps/api/src/platform_api/routes/observability/reports.py` remains
    explicitly deferred to the later KPI/report cleanup milestone, with its
    file-size ceiling tightened to the current 926-line baseline
  - API inventory was regenerated and produced no route-contract drift
  - focused verification:
    - `uv run ruff check apps/api/src/platform_api/routes/observability/__init__.py apps/api/src/platform_api/routes/observability/router.py apps/api/tests/unit/test_observability_route_surface.py apps/api/tests/unit/test_observability_v2_read_models.py apps/api/tests/integration/test_public_ingress_observability.py tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_repo_file_size.py`
    - `uv run pytest apps/api/tests/unit/test_observability_route_surface.py apps/api/tests/unit/test_observability_v2_read_models.py apps/api/tests/integration/test_public_ingress_observability.py tests/architecture/test_platform_api_route_import_surface.py tests/architecture/test_repo_file_size.py -q --tb=short`
    - `uv run python tools/scripts/generate_api_inventory.py && uv run python tools/scripts/check_api_inventory.py`
- Current observability investigation proof surface is large and must stay
  green through the split:
  - `apps/api/tests/integration/test_observability.py`
  - `apps/api/tests/integration/test_public_ingress_observability.py`
  - `apps/api/tests/integration/test_observability_control_plane_runtime.py`
  - `apps/api/tests/integration/test_observability_channel_runtime_legacy_materialization.py`
  - `apps/api/tests/integration/test_observability_solution_enrichers.py`
  - `apps/api/tests/integration/test_observability_solution_enrichers_details.py`
  - `apps/api/tests/integration/test_observability_solution_enrichers_driver_verification.py`
  - `apps/api/tests/unit/test_observability_v2_read_models.py`
