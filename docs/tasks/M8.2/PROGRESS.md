# M8.2: Control Plane Refactor Hardening — Progress

## Status

Active implementation lane as of 2026-03-30 by explicit human instruction. This sub-milestone was created on 2026-03-29 from explicit human request after reviewing the current repo state and seeing the same maintainability pain repeatedly: `calls.py` as a junk drawer, duplicated workflow live-state logic, split takeover lifecycle ownership, a monolithic LiveKit entrypoint, and provider/editor drift. The active implementation branch is now `feat/M8.2-control-plane-refactor-hardening`; task-specific branches are historical only. T01 through T10 now live on that branch as separate task commits, and the milestone is ready for one PR.

Requirement trace: optional hardening backlog work. M8.2 does not independently close checklist rows, but it is constrained to preserving and derisking `docs/requirements/checklist.md:228-233,381,385` during implementation.

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Extract shared live-call workflow runtime core | Completed | 2026-03-30 |
| T02 | Extract call observability projection service from `calls.py` | Completed | 2026-03-30 |
| T03 | Split call routes by capability | Completed | 2026-03-30 |
| T04 | Extract shared call subscription authorization policy | Completed | 2026-03-30 |
| T05 | Centralize manual takeover coordination across workflow paths | Completed | 2026-03-30 |
| T06 | Split the LiveKit voice job runtime bridge | Completed | 2026-03-30 |
| T07 | Introduce a shared voice capability registry | Completed | 2026-03-30 |
| T08 | Align admin browser-voice live consumers with the shared control-plane client | Completed | 2026-03-30 |
| T09 | Extract the voice panel from the structured agent editor | Completed | 2026-03-30 |
| T10 | Add architecture guards and refactor proof coverage | Completed | 2026-03-30 |

## Notes

Verified pain that justifies this backlog:

1. `apps/api/src/platform_api/routes/calls.py` is `2221` lines and owns unrelated responsibilities.
2. `packages/grove/src/grove/temporal/voice_call_workflow.py` (`919` lines) and `packages/grove/src/grove/temporal/inbound_call_workflow.py` (`664` lines) duplicate live-call runtime behavior.
3. `apps/api/src/platform_api/routes/calls.py` still owns too much command lifecycle logic.
4. `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` is a `984` line runtime blob.
5. `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` is `990` lines and now carries too much voice-specific editor state inline.

Scope discipline:

1. M8.2 is refactor-only. It should not grow into a new feature milestone.
2. The planned turn-latency observability follow-on remains product-facing. M8.2 must make that work easier, not absorb it.
3. Every task must preserve the current M8 contract and proof lanes while improving ownership and file boundaries.

Current execution note:

1. T01 completed on 2026-03-30. Shared live-call runtime state now lives in `packages/grove/src/grove/temporal/live_call_runtime_state.py`, and both workflows reuse it without inheritance.
2. Focused proof captured during T01:
   - `uv run ruff check packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py packages/grove/tests/unit/temporal/test_live_call_runtime_state.py`
   - `uv run ruff format packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py packages/grove/tests/unit/temporal/test_live_call_runtime_state.py --check`
   - `uv run pytest packages/grove/tests/unit/temporal/test_live_call_runtime_state.py packages/grove/tests/unit/temporal/test_voice_call_workflow.py packages/grove/tests/unit/temporal/test_inbound_call_workflow.py packages/grove/tests/unit/temporal/test_manual_takeover_workflow_lifecycle.py -q --tb=short`
   - `uv run pyright -p pyrightconfig.ci.json`
3. T02 completed on 2026-03-30. Pure call-observability projection models/builders now live in `packages/platform-core/src/platform_core/calls/observability_projection.py`; `apps/api/src/platform_api/routes/calls.py` now delegates latency, trace, runtime-event normalization, and observability-summary assembly to that shared module. Direct unit coverage lives in `packages/platform-core/tests/unit/test_calls/test_observability_projection.py`.
4. Focused proof captured during T02:
   - `uv run ruff check apps/api/src/platform_api/routes/calls.py packages/platform-core/src/platform_core/calls/observability_projection.py packages/platform-core/tests/unit/test_calls/test_observability_projection.py`
   - `uv run ruff format apps/api/src/platform_api/routes/calls.py packages/platform-core/src/platform_core/calls/observability_projection.py packages/platform-core/tests/unit/test_calls/test_observability_projection.py --check`
   - `uv run pytest packages/platform-core/tests/unit/test_calls/test_observability_projection.py apps/api/tests/integration/test_call_events.py apps/api/tests/integration/test_call_latency.py -q --tb=short`
   - `uv run pyright -p pyrightconfig.ci.json`
5. T03 completed on 2026-03-30. `apps/api/src/platform_api/routes/calls.py` is now a thin assembly file over `calls_live.py`, `calls_history.py`, `calls_streams.py`, `calls_observability.py`, and `admin_calls.py`; `browser_voice.py` now reuses the shared stream/event helpers; and `apps/api/tests/integration/test_browser_voice_streams.py` locks the admin parity surface directly.
6. Focused proof captured during T03:
   - `uv run pytest apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_calls_history.py apps/api/tests/integration/test_recordings.py apps/api/tests/integration/test_calls_takeover.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/integration/test_call_events.py apps/api/tests/integration/test_call_latency.py apps/api/tests/integration/test_calls_transcript_stream.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_browser_voice_streams.py -q --tb=short`
   - `uv run pyright -p pyrightconfig.ci.json`
   - `uv run ruff check apps/api/src/platform_api/routes/calls.py apps/api/src/platform_api/routes/admin_calls.py apps/api/src/platform_api/routes/calls_history.py apps/api/src/platform_api/routes/calls_live.py apps/api/src/platform_api/routes/calls_observability.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/browser_voice.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py`
   - `uv run ruff format apps/api/src/platform_api/routes/calls.py apps/api/src/platform_api/routes/admin_calls.py apps/api/src/platform_api/routes/calls_history.py apps/api/src/platform_api/routes/calls_live.py apps/api/src/platform_api/routes/calls_observability.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/browser_voice.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_call_runtime_snapshot.py apps/api/tests/unit/test_calls_list_query.py apps/api/tests/unit/test_calls_active_pagination.py apps/api/tests/unit/test_calls_transcript_stream_backoff.py --check`
   - `uv run python tools/scripts/generate_api_inventory.py`
   - `uv run python tools/scripts/check_api_inventory.py`
7. T04 completed on 2026-03-30. Shared call-subscription authorization now lives in `packages/platform-core/src/platform_core/calls/subscription_access.py`; `apps/api/src/platform_api/routes/call_access.py` is a thin request adapter; tenant transcript streaming, admin browser-voice readers, and control-plane websocket auth selection now reuse the same shared policy path.
8. Focused proof captured during T04:
   - `uv run ruff check apps/api/src/platform_api/routes/browser_voice.py apps/api/src/platform_api/routes/call_access.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/control_plane.py packages/platform-core/src/platform_core/calls/subscription_access.py packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py`
   - `uv run ruff format apps/api/src/platform_api/routes/browser_voice.py apps/api/src/platform_api/routes/call_access.py apps/api/src/platform_api/routes/calls_streams.py apps/api/src/platform_api/routes/control_plane.py packages/platform-core/src/platform_core/calls/subscription_access.py packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py --check`
   - `uv run pytest packages/platform-core/tests/unit/test_calls/test_subscription_access.py apps/api/tests/integration/test_browser_voice_streams.py apps/api/tests/integration/test_control_plane_websocket.py apps/api/tests/integration/test_calls_transcript_stream.py -q --tb=short`
   - `uv run pyright -p pyrightconfig.ci.json`
9. T05 completed on 2026-03-30. `packages/platform-core/src/platform_core/control_plane/manual_takeover.py` now owns command creation, workflow dispatch policy, and request audit emission; `apps/api/src/platform_api/routes/call_takeover.py` is a thin adapter over that coordinator; and Grove workflows now share one success/failure bookkeeping path in `packages/grove/src/grove/temporal/live_call_runtime_state.py`.
10. Focused proof captured during T05:
   - `uv run ruff check apps/api/src/platform_api/routes/call_takeover.py apps/api/tests/integration/test_calls_takeover.py packages/platform-core/src/platform_core/control_plane/manual_takeover.py packages/platform-core/src/platform_core/control_plane/__init__.py packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py`
   - `uv run ruff format apps/api/src/platform_api/routes/call_takeover.py apps/api/tests/integration/test_calls_takeover.py packages/platform-core/src/platform_core/control_plane/manual_takeover.py packages/platform-core/src/platform_core/control_plane/__init__.py packages/grove/src/grove/temporal/live_call_runtime_state.py packages/grove/src/grove/temporal/voice_call_workflow.py packages/grove/src/grove/temporal/inbound_call_workflow.py --check`
   - `uv run pytest apps/api/tests/integration/test_calls_takeover.py apps/api/tests/integration/test_calls.py packages/grove/tests/unit/temporal/test_manual_takeover_workflow_lifecycle.py -q --tb=short`
   - `uv run pyright -p pyrightconfig.ci.json`
11. T06 completed on 2026-03-30. `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` is now a `303` line composition shell over:
    - `packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py` for transcript forwarding, runtime-event emission, session callback wiring, room reconnect handling, and RTC quality sampling
    - `packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py` for shutdown cleanup and final `CallCompletedSignal` retry/reporting
    - `packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py` for contact-context shaping, room/start kwargs, and initial greeting selection
12. Focused proof captured during T06:
    - `uv run ruff check packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py`
    - `uv run ruff format packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py packages/grove-voice-livekit/src/grove_voice_livekit/session_bootstrap.py packages/grove-voice-livekit/src/grove_voice_livekit/runtime_bridge.py packages/grove-voice-livekit/src/grove_voice_livekit/shutdown_reporting.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py --check`
    - `uv run pytest packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/unit/test_entrypoint_metadata_integration.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py -q --tb=short`
    - `uv run pyright -p pyrightconfig.ci.json`
13. T07 completed on 2026-03-30. One backend-owned voice capability registry now lives in `packages/grove/src/grove/config/voice_capabilities.py`; the checked-in web manifest is generated into `apps/web/src/lib/voice/generated-voice-capabilities.ts`; `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` now validates supported providers and modes against that authority; and `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` now consumes manifest-driven provider options and the correct provider-specific TTS field semantics (`voice_name` for Google, `voice_id` for ElevenLabs).
14. Focused proof captured during T07:
    - `uv run ruff check packages/grove/src/grove/config/voice_capabilities.py tools/scripts/generate_voice_capability_manifest.py packages/grove/tests/unit/config/test_voice_capabilities.py packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py`
    - `uv run ruff format packages/grove/src/grove/config/voice_capabilities.py tools/scripts/generate_voice_capability_manifest.py packages/grove/tests/unit/config/test_voice_capabilities.py packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py --check`
    - `uv run pytest packages/grove/tests/unit/config/test_voice_capabilities.py packages/grove/tests/unit/config/test_voice_schema.py packages/grove-voice-livekit/tests/test_config_mapper.py -q --tb=short`
    - `uv run python tools/scripts/generate_voice_capability_manifest.py --check`
    - `uv run pyright -p pyrightconfig.ci.json`
    - `pnpm -C apps/web lint`
    - `pnpm -C apps/web check-types`
    - `pnpm -C apps/web exec vitest run tests/structured-agent-editor-voice-panel-render.test.tsx tests/structured-agent-editor-voice-panel.test.ts`
    - `pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts e2e/admin-agent-channels.spec.ts`
    - `pnpm -C apps/web exec playwright test`
    - `tools/scripts/e2e/run-web-e2e.sh`
    - Manual desktop/mobile proof captured with both Playwright MCP and Chrome DevTools MCP while selecting `elevenlabs`, verifying the manifest-driven option lists, and writing `voice_id`
    - Web UI harness artifacts stored at `tools/agents/artifacts/ui-harness/local-20260330T101650Z`
15. T08 completed on 2026-03-30. The actual shared-client seam shipped by M8 on this branch is now centralized in `apps/web/src/lib/realtime/voice-control-plane-client.ts`, which owns tenant/admin stream scope, replay URL construction, and canonical-plus-legacy bridge parsing for both transcript and runtime feeds. `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts`, `apps/web/src/lib/realtime/use-voice-call-runtime-feed.ts`, and `apps/web/src/components/observability/use-live-case-stream.ts` now consume that module, and the admin browser-voice test workbench at `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` passes a typed admin tenant scope instead of constructing `/admin/tenants/.../calls` strings directly.
16. T08 also closed the inventory lie. `tools/scripts/api_inventory_lib.py` now recognizes the shared admin stream consumer path, and regenerated `docs/arch/generated/api_inventory.md` shows `web` as the known consumer for `GET /admin/tenants/{tenant_id}/calls/{call_id}/transcript/stream` and `GET /admin/tenants/{tenant_id}/calls/{call_id}/ops/stream`.
17. Focused proof captured during T08:
    - `uv run ruff check tools/scripts/api_inventory_lib.py`
    - `uv run ruff format tools/scripts/api_inventory_lib.py --check`
    - `uv run pyright -p pyrightconfig.ci.json`
    - `uv run pytest tests/architecture/test_api_inventory_contract.py -q --tb=short`
    - `uv run python tools/scripts/generate_api_inventory.py`
    - `uv run python tools/scripts/check_api_inventory.py`
    - `pnpm -C apps/web lint`
    - `pnpm -C apps/web check-types`
    - `pnpm -C apps/web exec vitest run tests/voice-control-plane-client.test.ts tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx`
    - `pnpm -C apps/web exec playwright test e2e/agent-test-workbench.spec.ts`
    - `pnpm -C apps/web exec playwright test`
    - `tools/scripts/e2e/run-web-e2e.sh`
    - Manual desktop/mobile proof captured with both Playwright MCP and Chrome DevTools MCP on the admin test workbench after the shared client replayed transcript and runtime events from the admin browser-voice stream endpoints
    - Web UI harness artifacts stored at `tools/agents/artifacts/ui-harness/local-20260330T104622Z`
18. T09 completed on 2026-03-30. The inline voice editor block now lives in `apps/web/src/components/agent-editor/voice-panel.tsx`, and `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` shrank from `857` lines to `537` while keeping YAML mutation ownership in the parent editor shell.
19. Focused proof captured during T09:
    - `pnpm -C apps/web lint`
    - `pnpm -C apps/web check-types`
    - `pnpm -C apps/web exec vitest run tests/structured-agent-editor-voice-panel.test.tsx tests/structured-agent-editor-voice-panel-render.test.tsx tests/structured-agent-editor-voice-panel.test.ts`
    - `uv run pyright -p pyrightconfig.ci.json`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh`
    - Manual desktop/mobile proof captured with both Playwright MCP and Chrome DevTools MCP on the admin definition detail flow after opening `New Version`, expanding `Voice`, switching TTS provider to `elevenlabs`, and writing `voice-abc123`
    - Playwright MCP screenshots: `/Users/jakit/.codex/mcp-debug/playwright-http/page-2026-03-30T11-47-01-571Z.png` and `/Users/jakit/.codex/mcp-debug/playwright-http/page-2026-03-30T11-47-13-464Z.png`
    - Web UI harness artifacts stored at `tools/agents/artifacts/ui-harness/local-20260330T113257Z`
20. T10 completed on 2026-03-30. The stale post-refactor size ceilings are now tightened in `tests/architecture/test_repo_file_size.py` and `packages/grove/tests/unit/architecture/test_file_size.py`; `packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py` and `tests/architecture/test_m8_2_refactor_guards.py` now mechanically assert that the refactored shells still depend on the extracted shared modules; and `tools/scripts/api_inventory_lib.py` was trimmed back under the shrink-only ceiling while keeping the T08 admin-stream consumer scan intact.
21. Focused proof captured during T10:
    - `uv run ruff check tests/architecture/test_repo_file_size.py packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py tests/architecture/test_m8_2_refactor_guards.py tools/scripts/api_inventory_lib.py`
    - `uv run ruff format tests/architecture/test_repo_file_size.py packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py tests/architecture/test_m8_2_refactor_guards.py tools/scripts/api_inventory_lib.py --check`
    - `uv run pyright -p pyrightconfig.ci.json`
    - `uv run pytest tests/architecture/ -q -k 'repo_file_size or m8_2_refactor_guards or pr_observability_evidence_guard or api_inventory_contract' --tb=short`
    - `uv run pytest packages/grove/tests/unit/architecture/test_file_size.py packages/grove/tests/unit/architecture/test_live_call_runtime_state_wiring.py packages/grove/tests/unit/temporal/test_live_call_runtime_state.py packages/grove/tests/unit/temporal/test_manual_takeover_workflow_lifecycle.py packages/grove-voice-livekit/tests/test_entrypoint.py packages/grove-voice-livekit/tests/unit/test_entrypoint_metadata_integration.py packages/grove-voice-livekit/tests/unit/test_session_bootstrap.py -q --tb=short`
    - `uv run python tools/scripts/generate_api_inventory.py`
    - `uv run python tools/scripts/check_api_inventory.py`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec vitest run tests/voice-control-plane-client.test.ts tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx tests/structured-agent-editor-voice-panel.test.tsx tests/structured-agent-editor-voice-panel-render.test.tsx tests/structured-agent-editor-voice-panel.test.ts`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && NEXT_E2E_PORT=3119 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3119 pnpm -C apps/web exec playwright test`
    - `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh`
    - No additional Chrome DevTools MCP or Playwright MCP manual browser proof was required for T10 because no `apps/web/src/**` file changed; the task instead locked that requirement into the milestone/task docs for future UI-touching M8.2 work.
