# M36.1: Platform API Route Contracts and Entropy Reduction — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Define and enforce the platform API route package contract | Done | 2026-04-12 |
| T02 | Evict root-level route support modules into package-local owners | Done | 2026-04-12 |
| T03 | Split workflows router into router, schemas, and history | Done | 2026-04-13 |
| T04 | Extract call-ops dependencies and presenters and delete duplicate helpers | Done | 2026-04-13 |
| T05 | Split browser voice routes into router, schemas, and runtime | Done | 2026-04-13 |
| T06 | Split live call and history routes into smaller package modules | Done | 2026-04-13 |
| T07 | Split tenancy tenants routes and normalize telephony route support | Done | 2026-04-13 |
| T08 | Delete dead shims, add entropy guards, and prove API inventory stability | Done | 2026-04-13 |

## Notes

- M36.1 follows merged M36. The route topology is stable enough for internal
  cleanup, but the API contract must stay unchanged.
- The first deliverable is a route-package contract, not a file shuffle.
- Root `apps/api/src/platform_api/routes/` may contain only domain packages,
  `health.py`, and explicitly allowlisted aggregators or temporary shims.
  Non-router support modules at route root are debt to be evicted during M36.1.
- Package-local route support must have explicit ownership names:
  `schemas.py`, `dependencies.py`, `presenters.py`, `streams.py`,
  `runtime.py`, or `history.py`. Generic `utils.py`, `helpers.py`,
  `support.py`, and `*_support.py` names are banned in the route layer unless
  explicitly approved.
- The phase-2 hotspots are measured, not guessed:
  - `apps/api/src/platform_api/routes/workflows/router.py` — 640 LOC
  - `apps/api/src/platform_api/routes/call_ops/browser_voice.py` — 711 LOC
  - `apps/api/src/platform_api/routes/call_ops/calls_live.py` — 648 LOC
  - `apps/api/src/platform_api/routes/tenancy/tenants.py` — 772 LOC
- Expected net route-layer deletion for M36.1, excluding the future
  observability split: roughly 1.2k-2.0k LOC.
- `apps/api/src/platform_api/routes/observability/router.py` remains the
  largest outlier at 8,012 LOC, but it is deliberately deferred to a dedicated
  follow-on milestone so M36.1 stays reviewable.
- T01 route-root classification:
  - Domain packages: `agents`, `auth`, `call_ops`, `connectors`, `internal`,
    `observability`, `public_ingress`, `telephony`, `tenancy`, `workflows`
  - `health.py`: the only flat implementation module allowed to own routes
  - Approved aggregator: `calls.py`
  - Temporary compatibility shims: `admin_agent_definitions.py`,
    `admin_agent_starters.py`, `admin_agents.py`, `admin_calls.py`,
    `agent_definitions.py`, `approvals.py`, `audit_events.py`, `billing.py`,
    `browser_voice.py`, `call_takeover.py`, `calls_history.py`,
    `calls_live.py`, `calls_observability.py`, `calls_streams.py`,
    `calls_test_call.py`, `control_plane.py`, `internal_agent_config.py`,
    `internal_llm_policy.py`, `internal_test_call_runtime.py`,
    `operator_events.py`, `phone_numbers.py`, `platform_defaults.py`,
    `recordings.py`, `releases.py`, `reports.py`, `solutions.py`,
    `team_users.py`, `telephony_numbers.py`, `telephony_policy.py`,
    `telephony_provider_accounts.py`, `telephony_trunks.py`,
    `tenant_settings.py`, `tenants.py`
  - Root-level support-module debt: `call_access.py`,
    `observability_enrichers.py`, `span_correlation.py`
- T01 enforced contract:
  - root `routes/` stays limited to domain packages, `health.py`, approved
    aggregators, temporary compatibility shims, and explicitly documented
    root-level support debt
  - package-local route support may use only explicit ownership names:
    `schemas.py`, `dependencies.py`, `presenters.py`, `streams.py`,
    `runtime.py`, `history.py`
  - generic route-layer dumping-ground names are banned mechanically:
    `utils.py`, `helpers.py`, `support.py`, `*_support.py`
- T01 import-surface proof:
  - package-backed route exports such as `platform_api.routes.auth`,
    `platform_api.routes.connectors`, `platform_api.routes.observability`,
    `platform_api.routes.public_ingress`, and `platform_api.routes.workflows`
    are now frozen by architecture tests with their exact caller paths across
    direct imports and supported string-path seams
  - grouped imports such as `platform_api.routes.call_ops.*`,
    `platform_api.routes.tenancy.*`, `platform_api.routes.telephony.*`,
    `platform_api.routes.agents.*`, `platform_api.routes.observability.*`,
    and `platform_api.routes.internal.*` are now frozen by architecture tests
    with their exact caller paths across direct imports and supported
    string-path seams (`patch(...)`, `monkeypatch.setattr(...)`, and
    `factory_path=...`)
  - flat root imports remain live in `apps/api/src/platform_api/main.py`, route
    wrappers such as `call_ops/browser_voice.py`, `tenancy/tenants.py`, and
    `observability/reports.py`, plus integration/unit tests and supported
    string-path seams; later shim deletions must update that caller inventory
    instead of guessing
- T02 route-root support eviction:
  - the live T02 scope on current `main` was four root support modules, not the
    six named in the original task prose; these were already absent before T02:
    `telephony_trunks_support.py`,
    `observability_channel_runtime_support.py`
  - removed root support/seam files:
    `call_access.py`, `call_takeover.py`, `observability_enrichers.py`,
    `span_correlation.py`
  - direct callers now import the explicit package-local owners instead:
    `platform_api.routes.call_ops.call_access`,
    `platform_api.routes.call_ops.call_takeover`,
    `platform_api.routes.observability.observability_enrichers`,
    `platform_api.routes.observability.span_correlation`
  - route root now carries no support-module debt on the live tree; remaining
    flat files are domain shims, `health.py`, or the approved `calls.py`
    aggregator
- T03 workflows route split:
  - moved all route-owned workflow `BaseModel` classes into
    `apps/api/src/platform_api/routes/workflows/schemas.py`
  - moved Temporal history decoding, workflow-step parsing, and retry-input
    reconstruction into
    `apps/api/src/platform_api/routes/workflows/history.py`
  - reduced `apps/api/src/platform_api/routes/workflows/router.py` from
    640 LOC to a thin route-wiring module under the 500 LOC milestone target
  - preserved the public package surface
    `platform_api.routes.workflows.create_workflows_router` and kept endpoint
    paths, auth, response payloads, and retry behavior unchanged
- T04 call-ops dedupe:
  - extracted the repeated operator/admin route guard into
    `apps/api/src/platform_api/routes/call_ops/dependencies.py`
  - extracted the shared observability response-loading seam into
    `apps/api/src/platform_api/routes/call_ops/presenters.py`:
    `load_call_runtime_events`, `load_call_latency_response`, and
    `load_call_trace_summary_response`
  - extracted the route-owned persisted-call event envelope into
    `apps/api/src/platform_api/routes/call_ops/schemas.py` as
    `CallEventsResponse`
  - rewired `calls_observability.py`, `browser_voice.py`, the flat
    `routes/calls_observability.py` shim, and the affected call-ops route
    files to import the package-local owners instead of duplicating private
    helpers
  - kept `calls_history.py` compatibility DB access and the larger browser/live
    route splits out of scope for T04; those remain T05/T06 work
- T05 browser voice split:
  - reduced `apps/api/src/platform_api/routes/call_ops/browser_voice.py`
    from 711 LOC to 498 LOC, bringing it under the milestone ceiling
  - moved browser voice request/response models into the existing
    package-local owner `apps/api/src/platform_api/routes/call_ops/schemas.py`
    instead of creating `browser_voice_schemas.py`, because T01 already
    mechanically enforces `schemas.py` / `runtime.py` as the allowed route
    support seam names
  - created `apps/api/src/platform_api/routes/call_ops/runtime.py` for the
    LiveKit URL/credential helpers, room lifecycle helpers, seeded test-call
    record loading/cleanup, and browser-test history/event shaping
  - preserved the flat shim monkeypatch surface in
    `apps/api/src/platform_api/routes/browser_voice.py` so existing unit and
    integration tests can keep patching `_resolve_livekit_service_url`,
    `_resolve_livekit_server_credentials`, `_load_browser_test_call_record`,
    and `_cleanup_browser_voice_room`
  - kept endpoint paths, auth behavior, response payloads, and inventory
    output unchanged while proving the browser voice route split with the
    existing browser voice unit/integration suite plus route-contract guards
- Design artifact:
  `wiki/queries/2026-04-12-design-platform-api-route-entropy-phase2.md`
  `wiki/queries/2026-04-12-design-m36-1-t02-route-root-support-eviction.md`
  `wiki/queries/2026-04-13-design-m36-1-t03-workflows-router-split.md`
  `wiki/queries/2026-04-13-design-m36-1-t04-call-ops-dedupe.md`
- T06 live/history route split:
  - reduced `apps/api/src/platform_api/routes/call_ops/calls_live.py`
    from 647 LOC to 152 LOC and
    `apps/api/src/platform_api/routes/call_ops/calls_history.py`
    from 342 LOC to 142 LOC
  - moved the live-call and history response models into the existing
    package-local owner
    `apps/api/src/platform_api/routes/call_ops/schemas.py` instead of
    creating stale task-doc names like `calls_history_models.py`, because T01
    already mechanically enforces `schemas.py` / `runtime.py` / `history.py`
    as the allowed route support seam names
  - expanded `apps/api/src/platform_api/routes/call_ops/runtime.py` to own the
    active-call Temporal query compatibility, workflow selection, detail/event
    loading, and LiveKit operator token minting used by `calls_live.py`
  - created `apps/api/src/platform_api/routes/call_ops/history.py` for
    transcript coalescing, quality-score derivation, historical call/detail
    response shaping, the `calls_history` compatibility DB seam, and browser
    voice test-call history/event loaders moved out of `runtime.py` to keep
    the runtime module below the repo file-size ceiling
  - preserved the grouped and flat route export surfaces:
    `platform_api.routes.call_ops.calls_live`,
    `platform_api.routes.call_ops.calls_history`,
    `platform_api.routes.calls_live`, and
    `platform_api.routes.calls_history` still expose the same route factories
    and response model names, so the API contract and shim callers stayed
    unchanged
- T07 tenancy + telephony normalization:
  - reduced `apps/api/src/platform_api/routes/tenancy/tenants.py` from
    772 LOC to 488 LOC by moving tenant lifecycle and OIDC route models into
    `apps/api/src/platform_api/routes/tenancy/schemas.py` and the route-owned
    list/export/span/UUID parsing/response shaping helpers into
    `apps/api/src/platform_api/routes/tenancy/runtime.py`
  - kept the hard monkeypatch seam
    `platform_api.routes.tenants.onboard_tenant` intact for T07 by leaving the
    onboarding compatibility wrapper local to `tenancy/tenants.py` while the
    flat `apps/api/src/platform_api/routes/tenants.py` shim temporarily
    re-exported the moved models and export helpers from the package-local
    owners; T08 later deleted that flat shim after the caller inventory proved
    it dead
  - followed the T01 route-contract owner names (`schemas.py` and
    `runtime.py`) instead of the stale task-prose filenames
    `tenant_schemas.py` / `tenant_service.py`, so the tenancy package now
    matches the mechanically enforced support-module contract
  - normalized telephony route support around
    `apps/api/src/platform_api/routes/telephony/dependencies.py`:
    `telephony_numbers.py`, `phone_numbers.py`, `telephony_policy.py`, and
    `telephony_trunks.py` now import shared span annotation, auth guards, and
    request-scoped service builders from one package-local owner
  - kept `apps/api/src/platform_api/routes/telephony/runtime.py` trunk-specific
    for LiveKit/bootstrap/trunk error mapping while removing its duplicate
    request/span helper implementations, so telephony no longer carries
    inconsistent inline support seams across the route files touched by T07
- T08 shim deletion + final guards:
  - deleted the 32 dead flat route shims under
    `apps/api/src/platform_api/routes/`; route root now contains only the ten
    domain packages, `health.py`, and the approved `calls.py` aggregator
  - rewired `apps/api/src/platform_api/main.py`, grouped route modules, and
    unit/integration tests to import the grouped route owners directly instead
    of bouncing through root shims
  - updated the mechanical route topology/contract/import-surface guards so the
    post-shim import surface is frozen to the live grouped callers and the root
    route surface can no longer silently regrow deleted shims
  - tightened shrink-only file-size ceilings for the route files reduced in
    M36.1: `calls.py` (4), `workflows/router.py` (243),
    `call_ops/browser_voice.py` (482), `call_ops/calls_live.py` (152),
    `call_ops/calls_history.py` (140), `tenancy/tenants.py` (489), and
    `platform_api/main.py` (747)
  - preserved the published API surface; inventory regeneration/check now
    proves the shim deletions did not change endpoint contracts
