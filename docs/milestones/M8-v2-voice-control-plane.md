# M8: V2 Phase 2 -- Voice Control Plane

Status: in_progress
Created: 2026-03-20
Owner: Jakit
Branch: feat/M8-v2-voice-control-plane
Stream: v2
Depends on: none
Reference: docs/milestones/exec-plans/v2_canonical_architecture_refresh.md (Phase 2), docs/milestones/README.md, docs/milestones/exec-plans/m8_control_plane_execution_plan.md

## Goal

Turn the current live-call operator rails into one honest control-plane contract. The repo already has live transcript streaming, persisted runtime events, manual takeover plus urgent-handoff commands, and observability summaries, but they are split across separate SSE and REST paths. The planned M8 slice unifies those rails behind typed envelopes, replay semantics, and a shared realtime client contract, while the durable command-record work starts with manual takeover first and leaves urgent terminate/transfer as explicit follow-on scope until checklist ownership is formalized.

Execution state: active via human override on 2026-03-29. The original tracker deferred V2 Phase 2 while clinic handoff/operator continuity on the same `/call-ops` and observability surfaces remained partial, but implementation started after an explicit human activation. The frozen implementation contract for that activation still lives in `docs/milestones/exec-plans/m8_control_plane_execution_plan.md`.

## Current State (verified in repo)

- Live transcript SSE already exists at `GET /calls/{call_id}/transcript/stream`.
- Live runtime-event SSE already exists at `GET /calls/{call_id}/ops/stream`.
- Runtime events are already persisted in `call_runtime_events`.
- Manual takeover and terminate/transfer already exist as direct REST command endpoints.
- Observability already derives `control_plane_incident` summaries from operator/runtime evidence.
- `platform_core.control_plane` now exists, the current transcript/runtime SSE rails project the same canonical envelope semantics, manual takeover now writes durable `control_plane_commands` rows before workflow dispatch, `/control-plane/ws` provides the first authenticated canonical WebSocket transport for transcript/runtime topics, and the current shared web realtime hooks still consume the legacy SSE bridges while websocket migration stays deferred. The automated backend/frontend proof bundle, production-build UI harness lane, and API inventory verification are now green. The terminate/transfer follow-on command path is still missing, the websocket consumer migration is still open, and the final manual browser-MCP plus OTLP proof package is still open.

## Current Mechanics

```text
TODAY

+--------------------+
| Operator UI        |
| /call-ops          |
| /observability     |
+---------+----------+
          |
          | transcript updates
          v
+-----------------------------+
| /calls/{id}/transcript/...  |
| SSE transcript stream       |
+-----------------------------+

          |
          | runtime updates
          v
+-----------------------------+
| /calls/{id}/ops/stream      |
| SSE runtime-event stream    |
+-----------------------------+

          |
          | operator action
          v
+-----------------------------+
| /calls/{id}/takeover        |
| /terminate-transfer         |
| REST command endpoints      |
+-------------+---------------+
              |
              | direct Temporal signal
              v
+-----------------------------+
| voice workflows             |
| manual_takeover()           |
| escalate_to_human()         |
+-------------+---------------+
              |
              | persist event truth
              v
+-----------------------------+
| tenant tables               |
| call_runtime_events         |
| call_runtime_snapshots      |
+-----------------------------+
```

## Problem Statement

The platform is not missing live call operations. The problem is fragmentation:

1. **Multiple realtime rails** -- transcript, runtime events, and operator commands travel through separate contracts.
2. **No durable command lifecycle** -- commands are signaled directly to workflows before any command record exists.
3. **No canonical envelope** -- SSE payloads are route-local instead of a platform-wide typed protocol.
4. **No shared realtime client** -- `/call-ops` and observability both stitch live state manually.
5. **Naming drift** -- the repo talks about `control_plane_incident` even though no actual control-plane subsystem exists yet.

## Must-Have Or Nice-To-Have?

```text
For current live call operations working at all:
  not a P0 fix

For current clinic launch and current voice operations:
  usually not the immediate blocker

For the full V2 target:
  must-have before more realtime breadth lands cleanly
```

M8 is therefore **not** a decorative cleanup and **not** a current production-outage fix. It is the coherence milestone that must land before pretending the platform has a real V2 realtime/control-plane architecture.

## Design Decisions

1. **Contract first, transport second** -- the real missing gap is a canonical typed command/event contract with durable command lifecycle, not just "switch SSE to WebSocket".
2. **Reuse the current persisted voice rails** -- `call_runtime_events` and `call_runtime_snapshots` are existing groundwork. M8 must converge them into the control-plane contract, not create a second fake authority.
3. **Durable commands are the core missing piece** -- operator commands must be written to a command record before workflow dispatch and acknowledgment.
4. **SSE stays as a migration bridge** -- during M8, SSE remains a valid projection surface. It should read the same semantics as the canonical control-plane envelope.
5. **WebSocket is the full-V2 canonical surface** -- but it lands on top of the contract, not instead of defining one.
6. **M3 is not a hard prerequisite** -- clinic follow-up UX can continue independently; M8 backend/control-plane work does not require clinic-console polish first.
7. **Adopt LiveKit 1.5.1 where it directly strengthens the same live-call contract** -- turn handling, session usage, recording policy, and per-turn latency reporting are now part of M8 because they feed the same operator, billing, and observability rails. Do not use this as an excuse to rebuild media-plane logic in Grove.

## Architecture Path

```text
TODAY = FEATURED BUT FRAGMENTED

+------------------+      +-------------------+      +-------------------+
| transcript SSE   |      | ops SSE           |      | REST commands     |
| route-local      |      | route-local       |      | direct workflow   |
+---------+--------+      +---------+---------+      +---------+---------+
          \                         |                          /
           \                        |                         /
            \                       |                        /
             +------------------------------------------------+
             | operator UI stitches the rails together        |
             +------------------------------------------------+
```

```text
MINIMAL SANE M8

+----------------------+
| shared realtime      |
| client contract      |
+----------+-----------+
           |
           v
+----------------------+
| typed event envelope |
| typed command record |
| replay semantics     |
| auth + scope rules   |
+----------+-----------+
           |
           +----------------------+
           |                      |
           v                      v
+----------------------+  +----------------------+
| workflow dispatch    |  | SSE projection       |
| from durable command |  | from same semantics  |
+----------------------+  +----------------------+
```

```text
FULL V2 TARGET

+----------------------+
| Operator UI client   |
| one realtime client  |
+----------+-----------+
           |
           | canonical control-plane protocol
           v
+----------------------+
| control_plane        |
| commands             |
| events               |
| replay               |
| auth/scope           |
+----------+-----------+
           |
           | durable truth first
           v
+----------------------+
| command records      |
| event/outbox records |
+----------+-----------+
           |
           +----------------------+
           |                      |
           v                      v
+----------------------+  +----------------------+
| workflows/runtimes   |  | WS + SSE projections |
| execute real work    |  | for clients          |
+----------------------+  +----------------------+
```

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Canonical control-plane envelope types | complete | none |
| T02 | Durable command record + lifecycle model | complete | T01 |
| T03 | Map existing runtime-event rails onto canonical envelope + replay semantics | complete | T01 |
| T04 | Authenticated WebSocket control-plane endpoint | complete | T01-T03 |
| T05 | SSE parity projection on canonical envelope | complete | T01, T03 |
| T06 | Shared web realtime client + migrate one end-to-end consumer path | in progress (implementation + harness + Chrome proof + OTLP evidence landed) | T04, T05 |
| T07 | Broader consumer migration across call-ops and observability live surfaces | in progress (implementation + harness + Chrome proof + OTLP evidence landed) | T06 |
| T08 | Verification, rollout proof, and no-regression bridge | in progress (automation + harness + Chrome proof + OTLP evidence landed) | T02-T07 |
| T09 | Adopt LiveKit 1.5 turn handling and recording options | complete | none |
| T10 | Wire LiveKit session usage and message metrics | complete | T09 |
| T11 | Expose LiveKit voice controls in the structured agent editor | in progress | T09 |

## Acceptance Criteria

- [x] One canonical typed envelope exists for current live call runtime events
- [x] Operator commands persist a durable command record before workflow dispatch and acknowledgment
- [x] Replay from cursor or sequence boundary works on canonical envelope semantics
- [x] At least one live consumer path uses the shared realtime client end to end
- [x] SSE projection still works during migration and reads the same contract semantics
- [x] Existing transcript, ops, takeover, operator-alert, observability, and history-contract flows do not regress in the automated proof lane
- [x] Tenant plus existing admin/deployment read-model scope enforcement on the shared voice control-plane events do not regress
- [x] Voice runtime defaults now expose LiveKit adaptive interruption handling and dynamic endpointing instead of hardcoded VAD-only interruption mode
- [x] LiveKit per-model session usage and per-turn message metrics are bridged onto the existing billing and post-call observability contract without dropping current event types
- [ ] Any `apps/web/**` UI/layout changes are verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts kept
- [x] `uv run pytest` passes for control-plane, replay, and migration coverage
- [x] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes for the changed web flows
- [x] Full `apps/web` Playwright E2E suite passes before the milestone is marked done
- [ ] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## Verification

```bash
uv run python -m pytest packages/platform-core/tests/unit/test_control_plane/test_envelopes.py packages/platform-core/tests/integration/test_control_plane_command_records.py apps/api/tests/integration/test_call_ops_stream.py apps/api/tests/integration/test_calls_transcript_stream.py apps/api/tests/integration/test_control_plane_websocket.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_audit_events.py -q --tb=short
# Inventory proof only covers HTTP/SSE companion routes; it is not the websocket contract check.
uv run python tools/scripts/generate_api_inventory.py
uv run python tools/scripts/check_api_inventory.py
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web exec vitest run tests/voice-control-plane-transcript-feed.test.tsx tests/voice-control-plane-runtime-feed.test.tsx
pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/observability-live.spec.ts e2e/operator-alerts.spec.ts
pnpm -C apps/web exec playwright test
tools/scripts/e2e/run-web-e2e.sh
OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/traceql.sh trace_id:f91da9c42b37e930ef3dfe05542c0dca
OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/logql.sh '{service="platform-api"} |= "/calls/00000000-0000-4000-a000-000000000123/transcript/stream"' 30m 20
OBS_RUNTIME=k3d OBS_K8S_CONTEXT=k3d-grove-ci-ef9c597f89 tools/scripts/obs/promql.sh 'up{pod=~"platform-api-.*"}'
```

## Research Basis

This milestone rewrite is grounded in actual repo state:

- transcript SSE route: `apps/api/src/platform_api/routes/calls.py`
- ops SSE route: `apps/api/src/platform_api/routes/calls.py`
- direct operator command dispatch: `apps/api/src/platform_api/routes/calls.py`
- persisted runtime event writer: `packages/grove/src/grove/temporal/voice_activities.py`
- workflow runtime event emission: `packages/grove/src/grove/temporal/voice_call_workflow.py`
- current SSE consumer stitching: `apps/web/src/components/observability/use-live-case-stream.ts`, `apps/web/src/components/call-ops/live-transcript.tsx`, `apps/web/src/components/call-ops/support-drawer.tsx`
- official LiveKit turn/interruption docs: https://docs.livekit.io/agents/logic/turns/

## Follow-On Work (still not done in M8)

LiveKit 1.5.1 adoption inside M8 now covers the parts that directly affect the same live-call contract:

- current repo dependency lock is `livekit-agents 1.5.1`
- current voice runtime now uses `TurnHandlingOptions`, defaults interruption mode to `adaptive`, defaults endpointing mode to `dynamic`, and maps optional selective recording policy
- current voice runtime captures `session_usage_updated`, bridges `ChatMessage.metrics`, and persists `voice_model_usages` plus `livekit.sdk_version`
- current usage/billing writes still preserve the existing `voice_duration_seconds`, `llm_tokens`, `stt_characters`, and `tts_characters` contract while enriching per-model metadata when LiveKit provides it

Still open follow-on work:

- custom LiveKit observability endpoint plumbing beyond the current OTLP/control-plane bridge
- speaker diarization and text-transform exposure beyond the current STT/provider config mapping
- transfer-path polish that uses LiveKit handoff improvements without destabilizing the existing `/calls/{id}/terminate-transfer` and workflow signal path

## Non-Goals

- No new call-ops UI layout (same page, different transport)
- No clinic-specific handoff UX polish work from M3
- No custom Grove media-plane interruption or endpointing logic
- No event schema versioning protocol in v1

## M33 Impact

**Requires adaptation (low).** Autonomous voice agents emit the same control-plane envelope as rail agents (same SSE event types, same message schema). Context compression events need a new event type in the control-plane contract. Turn structure may vary (autonomous agents don't follow predefined graph), but latency milestones (STT, LLM TTFT, TTS TTFB) still apply.
