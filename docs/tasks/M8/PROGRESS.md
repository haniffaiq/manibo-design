# M8: V2 Phase 2 -- Voice Control Plane -- Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Canonical control-plane envelope types | Complete | `platform_core.control_plane` now defines canonical voice control-plane envelopes plus transcript/runtime row mappers and SSE bridge serializers |
| T02 | Command persistence model | Complete | Manual takeover now writes durable `control_plane_commands` rows with deterministic lifecycle transitions plus audit correlation metadata before workflow signaling is acknowledged |
| T03 | Map existing runtime-event rails onto canonical envelope + replay semantics | Complete | Transcript and ops SSE now project canonical envelopes while preserving `after_seq` replay semantics on the existing persisted rails |
| T04 | Authenticated WebSocket control-plane endpoint | Complete | `/control-plane/ws` now authenticates tenant and super-admin tenant-scoped readers, replays transcript/runtime envelopes from per-topic sequence cursors, delivers live canonical envelope updates, and is inventoried as an implemented websocket transport even though in-repo web consumers still use the SSE bridge today |
| T05 | SSE parity projection on canonical envelope | Complete | Runtime SSE now reads `summary` and `occurred_at_ms` from the canonical payload while keeping legacy top-level compatibility fields and replay behavior intact |
| T06 | Shared web realtime client + migrate one end-to-end consumer path | In progress (implementation + harness + Chrome proof + OTLP evidence landed) | `call-ops` live transcript now consumes a shared control-plane transcript client under `apps/web/src/lib/realtime/`, the route-local SSE stitching is gone, the production-build UI harness is green, Chrome DevTools MCP proof and OTLP evidence are captured, and only the broken Playwright MCP lane still blocks honest closure |
| T07 | Broader consumer migration across call-ops and observability live surfaces | In progress (implementation + harness + Chrome proof + OTLP evidence landed) | `call-ops` support drawer and observability live-session consumers now use shared transcript/runtime hooks, production-build UI harness proof is green, Chrome DevTools MCP proof is captured for both live surfaces, and OTLP evidence is ready for the PR body; only Playwright MCP remains |
| T08 | Verification, rollout proof, and no-regression bridge | In progress (automation + harness + Chrome proof + OTLP evidence landed) | Backend replay/command/websocket proof, frontend regression proof, full production-build UI harness proof, API inventory verification, Chrome DevTools MCP proof, and k3d OTLP evidence are all captured; the only remaining blocker is the broken Playwright MCP proof lane |
| T09 | Adopt LiveKit 1.5 turn handling and recording options | Complete | Grove voice config now maps onto LiveKit 1.5 `TurnHandlingOptions` and selective `RecordingOptions`, adaptive interruption and dynamic endpointing are the default path, and the persisted voice stack metadata now carries the LiveKit SDK version |
| T10 | Wire LiveKit session usage and message metrics | Complete | LiveKit `session_usage_updated` and `ChatMessage.metrics` now feed typed workflow payloads, shared usage-event mapping, preserved post-call latency fields, and serialized `voice_model_usages` metadata without dropping the legacy billing contract |
| T11 | Expose LiveKit voice controls in the structured agent editor | In progress (implementation landed; lint/typecheck pass; admin web proof still blocked) | The deployment admin structured editor now exposes endpointing mode, interruption mode, noise cancellation model, and filler-audio enablement so the schema/mapper/runtime surface is no longer YAML-only for those LiveKit-backed voice controls; targeted admin Playwright and UI-harness proof still fail on existing admin-route/runtime debt, and manual Playwright MCP proof still needs a fresh session after the local MCP config fix |

## Notes

Execution state: active via human override on 2026-03-29.
Frozen activation plan: `docs/milestones/exec-plans/m8_control_plane_execution_plan.md`
No hard dependency on M3. Clinic follow-up is UI depth; M8 is control-plane contract work.
Current repo already has partial groundwork: persisted `call_runtime_events`, replayable SSE via `after_seq`, direct takeover/transfer commands, and live consumer stitching in `/call-ops` and observability.
LiveKit 1.5.1 runtime adoption is now part of M8 where it directly advances the same live-call contract surfaces: turn handling, recording policy, usage reporting, and latency reporting are in scope; larger transfer-path and custom observability endpoint work is still follow-on.

Implementation evidence captured so far:
- Canonical envelope module: `packages/platform-core/src/platform_core/control_plane/envelopes.py`
- Command lifecycle module: `packages/platform-core/src/platform_core/control_plane/commands.py`
- Tenant migration: `packages/platform-core/src/platform_core/alembic/versions/20260329_120000_control_plane_commands.py`
- SSE bridge integration: `packages/platform-core/src/platform_core/calls/sse_streams.py`
- WebSocket route: `apps/api/src/platform_api/routes/control_plane.py`
- WebSocket transport helper: `packages/platform-core/src/platform_core/control_plane/transport.py`
- Shared web transcript bridge client: `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts`
- Shared web runtime bridge client: `apps/web/src/lib/realtime/use-voice-call-runtime-feed.ts`
- Replay/mapping verification: `uv run python -m pytest packages/platform-core/tests/unit/test_control_plane/test_envelopes.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py -q --tb=short`
- SSE parity verification: `uv run python -m pytest apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py packages/platform-core/tests/unit/test_control_plane/test_envelopes.py -q --tb=short`
- Command durability verification: `uv run python -m pytest packages/platform-core/tests/integration/test_control_plane_command_records.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_audit_events.py -q --tb=short`
- WebSocket auth/replay/live delivery verification: `uv run python -m pytest apps/api/tests/integration/test_control_plane_websocket.py packages/platform-core/tests/unit/test_control_plane/test_envelopes.py -q --tb=short`
- Shared client verification: `pnpm -C apps/web test -- --run apps/web/tests/voice-control-plane-transcript-feed.test.tsx`
- Shared runtime/transcript client verification: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec vitest run tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx`
- Web app type verification: `pnpm -C apps/web check-types`
- Targeted migrated-live-flow verification: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/observability-live.spec.ts e2e/operator-alerts.spec.ts`
- Direct web regression suite: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web exec playwright test`
- Consolidated backend proof: `uv run python -m pytest packages/platform-core/tests/unit/test_control_plane/test_envelopes.py packages/platform-core/tests/integration/test_control_plane_command_records.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py apps/api/tests/integration/test_control_plane_websocket.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_audit_events.py -q --tb=short`
- API inventory verification (including websocket routes): `uv run python tools/scripts/generate_api_inventory.py && uv run python tools/scripts/check_api_inventory.py`
- Manual transcript screenshots: `tools/agents/artifacts/manual-ui/t06-transcript/chrome-desktop-call-ops-transcript.png`, `tools/agents/artifacts/manual-ui/t06-transcript/chrome-mobile-call-ops-transcript.png`
- Targeted production-build UI harness verification: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh e2e/admin-agent-channels.spec.ts e2e/routes.spec.ts` -> `19 passed`, artifacts at `tools/agents/artifacts/ui-harness/local-20260329T082625Z/`
- Full production-build UI harness verification: `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh` -> `128 passed`, artifacts at `tools/agents/artifacts/ui-harness/local-20260329T082654Z/`
- Chrome DevTools MCP manual proof artifacts: `tools/agents/artifacts/manual-ui/m8-proof/chrome-desktop-call-ops-support-live.png`, `tools/agents/artifacts/manual-ui/m8-proof/chrome-mobile-call-ops-support-live.png`, `tools/agents/artifacts/manual-ui/m8-proof/chrome-desktop-observability-live.png`, `tools/agents/artifacts/manual-ui/m8-proof/chrome-mobile-observability-live.png`
- Playwright MCP proof is still blocked in this environment: `playwright/browser_tabs` -> `Transport closed`
- OTLP evidence capture:
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/traceql.sh trace_id:f91da9c42b37e930ef3dfe05542c0dca`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/logql.sh '{service="platform-api"} |= "/calls/00000000-0000-4000-a000-000000000123/transcript/stream"' 30m 20`
  - `OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/promql.sh 'up{pod=~"platform-api-.*"}'`
- Supporting voice runtime upgrade: LiveKit agents/plugins moved to `1.5.1`, the session config now uses `turn_handling` with adaptive interruption + dynamic endpointing defaults, selective recording options are mapped, `session_usage_updated` and `conversation_item_added` are wired, and usage/latency data is bridged onto the existing Manibo billing + post-call metadata contract
