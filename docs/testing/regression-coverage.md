# Regression Coverage Decisions

This file records explicit regression-coverage decisions for slices where the
governance rule requires a touched coverage artifact, but the change itself is
structural rather than a new runtime behavior.

The broader tier model, ownership rules, and harness contracts still live in
`wiki/testing/regression-coverage.md`.

## M36: Platform API Route Topology Phase 1

- Date: 2026-04-11
- Scope: regroup `apps/api/src/platform_api/routes/**` into domain packages
  without changing endpoint paths, tags, auth contracts, or response models
- Runtime impact: topology only; the published API inventory remains 259
  endpoints after the regroup

Coverage decision:
- Existing route-family `apps/api/tests/**` suites remain the Tier 0 runtime
  proof for this surface; phase 1 does not introduce new handler behavior that
  would justify inventing synthetic regression cases
- Architecture guards now pin the structural contract that phase 1 adds:
  `tests/architecture/test_platform_api_route_topology.py`,
  `tests/architecture/test_admin_agents_main_wiring.py`,
  `tests/architecture/test_app_layer_boundaries.py`,
  `tests/architecture/test_repo_file_size.py`,
  `tests/architecture/test_requirements_checklist_contract.py`, and
  `tests/architecture/test_v2_preparation_contracts.py`
- `tools/scripts/check_api_inventory.py` remains the published-surface drift
  guard for the regroup

Evidence:
- `uv run pytest tests/architecture/test_platform_api_route_topology.py tests/architecture/test_admin_agents_main_wiring.py tests/architecture/test_api_inventory_contract.py tests/architecture/test_m8_2_refactor_guards.py apps/api/tests -q --tb=short`
- `uv run pytest tests/architecture/test_app_layer_boundaries.py::test_asyncpg_usage_is_restricted_in_apps tests/architecture/test_repo_file_size.py::test_repo_code_and_ci_files_within_limits tests/architecture/test_requirements_checklist_contract.py::test_repo_complete_rows_have_runnable_proof tests/architecture/test_v2_preparation_contracts.py::test_v2_schema_first_connector_governance_contract_exists -q --tb=short`
- `uv run python tools/scripts/check_api_inventory.py`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && tools/scripts/review/pre-pr-ci.sh`

Follow-up:
- Phase 2 must update route-family regression coverage when schemas,
  dependencies, services, and compatibility shims are split or removed.

## M36.1: Platform API Route Contract Planning

- Date: 2026-04-12
- Scope: redefine `M36.1` around route-package contracts and entropy reduction;
  update the milestone/task pack; add route-contract guidance to `AGENTS.md`
  and `apps/api/AGENTS.md`
- Runtime impact: none; this change is planning and agent-guidance only

Coverage decision:
- Existing Tier 0 runtime coverage for `apps/api/tests/**` remains the runtime
  proof for platform API behavior; this PR does not change handlers, schemas,
  or mounted routes
- Adding new runtime tests for a planning-only PR would be fake coverage; the
  correct regression artifact here is this explicit decision record plus the
  follow-on architecture tests planned in `M36.1`

Evidence:
- `git diff --check`
- `rg -n "M37-platform-api-route-entropy-phase2|docs/tasks/M37|M36.1-platform-api-route-entropy-phase2" docs wiki AGENTS.md apps/api/AGENTS.md`
- `find docs/tasks/M36.1 -maxdepth 1 -type f | sort`

Follow-up:
- When implementation for `M36.1` starts, update this file again with the
  exact route-family regression strategy and the architecture checks that
  become the mechanical enforcement.

## Dev Google Credentials Wrapper Simplification

- Date: 2026-04-13
- Scope: simplify local Google credential handling so local wrapper scripts may
  accept `GOOGLE_CREDENTIALS_FILE`, but normalize immediately to standard
  `GOOGLE_APPLICATION_CREDENTIALS` before Docker Compose, dev-live, k3d, and
  real-provider helpers consume the setting
- Runtime impact: local runtime wiring only; no product logic, provider SDK
  call paths, or published API contracts changed

Coverage decision:
- Existing runtime/provider behavior remains covered by the normal Tier 0 and
  provider-specific suites; this PR narrows env-wiring at the entry-script
  boundary instead of introducing a new runtime behavior
- The mechanical proof for this change is the wrapper/regression coverage in
  `tests/architecture/test_clinic_real_eval_scripts.py`,
  `tests/architecture/test_dev_live_script.py`,
  `tests/architecture/test_local_observability_wiring.py`, and
  `tests/architecture/test_local_pre_pr_ci_harness.py`
- Adding new product-runtime scenarios here would be fake coverage because the
  changed contract is env normalization and Compose interpolation, not a new
  feature exercised by application code

Evidence:
- `uv run pytest tests/architecture/test_clinic_real_eval_scripts.py tests/architecture/test_dev_live_script.py tests/architecture/test_local_observability_wiring.py tests/architecture/test_local_pre_pr_ci_harness.py packages/platform-core/tests/unit/test_audio_tts.py tests/architecture/test_repo_file_size.py::test_repo_code_and_ci_files_within_limits -q --tb=short`
- `uv run pytest packages/grove-voice-livekit/tests/real_providers packages/grove/tests/e2e/real_providers --collect-only -q`
- `GITHUB_EVENT_NAME=pull_request GITHUB_BASE_REF=main python3 tools/scripts/check_regression_governance.py`

Follow-up:
- If this local wrapper contract expands beyond env normalization into shared
  runtime/provider behavior, add or update Tier 0 runtime tests in
  `packages/platform-core/tests/**` or `packages/grove/tests/**` rather than
  extending this decision record.

## M13: Self-Hosted LiveKit SIP Runtime

- Date: 2026-04-14
- Scope: restore the self-hosted PSTN transport/runtime path for local LiveKit
  SIP by packaging the worker correctly, removing the broken local
  `rtc.force_tcp` override, hardening room-metadata fallback, and adding the
  public-IP SIP probe used for real-call proof
- Runtime impact: self-hosted voice runtime only; this slice changes local
  worker bootstrapping and SIP transport behavior, but does not add new product
  API behavior or change the cloud voice path

Coverage decision:
- Existing focused runtime tests in `packages/grove-voice-livekit/tests/**`
  remain the Tier 0 proof for worker bootstrap, metadata fallback, and
  self-hosted voice job wiring touched by this PR
- The new architecture proof in
  `tests/architecture/test_telephony_local_sip_probe.py` is the mechanical
  guard for the local SIP probe surface introduced here
- A broader end-to-end telephony evaluation harness belongs to `M13.1`; adding
  synthetic call orchestration to this transport-repair PR would be fake
  coverage and would hide the actual self-hosted regression behind unrelated
  scaffolding

Evidence:
- `uv run pytest packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/test_entrypoint_outbound_calls.py packages/grove-voice-livekit/tests/test_room_metadata_wait.py tests/architecture/test_telephony_local_sip_probe.py -q`
- `uv run ruff check packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py packages/grove-voice-livekit/src/grove_voice_livekit/livekit_deployment_mode.py packages/grove-voice-livekit/src/grove_voice_livekit/room_metadata_wait.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/test_entrypoint_outbound_calls.py packages/grove-voice-livekit/tests/test_room_metadata_wait.py tests/architecture/test_telephony_local_sip_probe.py tools/scripts/telephony_local_sip_probe.py`
- `uv run pyright packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py packages/grove-voice-livekit/src/grove_voice_livekit/livekit_deployment_mode.py packages/grove-voice-livekit/src/grove_voice_livekit/room_metadata_wait.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py`

Follow-up:
- `M13.1` owns deterministic inbound/outbound telephony evaluation and whole
  conversation scoring; keep that harness work out of this self-hosted runtime
  repair PR.

## M13: Voice Turn Observability

- Date: 2026-04-14
- Scope: add per-turn voice observability plumbing across the LiveKit adapter,
  runtime bridge, metrics collection, and the shared Temporal
  `voice_call_models` contract used to persist turn-level telemetry
- Runtime impact: voice-runtime instrumentation only; this slice adds turn
  payloads, metrics, and bridge emissions, but does not introduce a new user
  workflow or require a separate end-to-end harness beyond the existing Grove
  voice test surface

Coverage decision:
- Existing Grove voice Tier 0 tests are the correct regression proof for this
  change because the touched Grove contract is consumed entirely through the
  LiveKit voice adapter in this PR
- The focused suites in `packages/grove-voice-livekit/tests/**` already cover
  the new turn-completion path, runtime bridge event emission, live metrics,
  latency collection, and the metadata-wait fallback that now protects the
  observability startup path
- Adding a second synthetic orchestration harness here would be fake coverage;
  the actual regression surface is the adapter/runtime contract exercised by
  the existing focused unit and package tests

Evidence:
- `uv run pytest packages/grove-voice-livekit/tests/test_grove_voice_agent.py packages/grove-voice-livekit/tests/test_room_metadata_wait.py packages/grove-voice-livekit/tests/unit/test_grove_voice_agent_turn_completion.py packages/grove-voice-livekit/tests/unit/test_live_metrics.py packages/grove-voice-livekit/tests/unit/test_runtime_bridge_events.py packages/grove-voice-livekit/tests/unit/test_voice_latency_collector.py -q`
- `uv run ruff check packages/grove/src/grove/temporal/voice_call_models.py packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py packages/grove-voice-livekit/src/grove_voice_livekit/observability.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge_io.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_latency_collector.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_runtime_turn_observability.py packages/grove-voice-livekit/tests/test_grove_voice_agent.py packages/grove-voice-livekit/tests/test_room_metadata_wait.py packages/grove-voice-livekit/tests/unit/test_grove_voice_agent_turn_completion.py packages/grove-voice-livekit/tests/unit/test_live_metrics.py packages/grove-voice-livekit/tests/unit/test_runtime_bridge_events.py packages/grove-voice-livekit/tests/unit/test_voice_latency_collector.py`
- `uv run pyright packages/grove/src/grove/temporal/voice_call_models.py packages/grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py packages/grove-voice-livekit/src/grove_voice_livekit/observability.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge_io.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_latency_collector.py packages/grove-voice-livekit/src/grove_voice_livekit/voice_runtime_turn_observability.py`
- `GITHUB_EVENT_NAME=pull_request GITHUB_BASE_REF=main python3 tools/scripts/check_regression_governance.py`

Follow-up:
- If turn observability starts feeding a cross-package exported analytics
  surface, add Grove-level regression coverage in `packages/grove/tests/**`
  instead of extending this documentation-only decision.

## Production Voice Booking Observability Hardening

- Date: 2026-04-17
- Scope: carry booking-confirmed runtime events through the shared inbound call
  workflow contract, LiveKit voice runtime bridge, Temporal worker post-call
  metadata, and appointment booking tool runtime-event emission
- Runtime impact: production voice booking observability only; the Grove
  Temporal change is a data-carrier contract so the LiveKit adapter and
  temporal-worker can preserve `book_appointment` results through call shutdown
  and post-call extraction

Coverage decision:
- Existing Grove voice package tests are the correct Tier 0 proof for the
  shared Grove Temporal contract because the changed Grove payload is consumed
  through `packages/grove-voice-livekit/**` in this PR
- Temporal-worker unit tests cover the post-call metadata behavior that consumes
  the runtime event, including the clinic outcome source and latest confirmed
  booking selection
- Appointment-booking solution tests cover the solution-owned event payload and
  spoken-search resolution behavior; duplicating solution-specific assertions
  under `packages/grove/tests/**` would cross the layer boundary and create fake
  shared-framework coverage

Evidence:
- `uv run pytest apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_clinic_metadata.py packages/grove-voice-livekit/tests/test_grove_voice_agent.py packages/grove-voice-livekit/tests/test_grove_voice_agent_flow_runtime_state.py solutions/appointment_booking/tests/unit/test_appointment_booking.py solutions/appointment_booking/tests/unit/test_appointment_booking_spoken_resolution.py solutions/appointment_booking/tests/unit/test_appointment_booking_runtime_events.py -q`
- `uv run pytest packages/grove-voice-livekit/tests/unit/test_shutdown_reporting.py solutions/appointment_booking/tests/unit/test_appointment_booking_runtime_events.py -q`
- `uv run pytest solutions/appointment_booking/tests/unit/test_post_call_booking_metadata.py apps/temporal-worker/tests/unit/test_inbound_call_orchestrator_clinic_metadata.py -q`
- `uv run pytest packages/grove-voice-livekit/tests/test_room_metadata_wait.py -q`
- `uv run pytest solutions/appointment_booking/tests/e2e/test_clinic_handoff_scenarios.py solutions/appointment_booking/tests/e2e/test_clinic_booking_scenarios.py -q --tb=short`
- `tools/scripts/review/pre-pr-ci.sh`

Follow-up:
- If runtime events become a public Grove API beyond inbound voice call
  orchestration, add dedicated Grove-level regression tests under
  `packages/grove/tests/**` for the exported contract.
