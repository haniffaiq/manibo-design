# M8 Voice Runtime — Orchestration Plan

**Feature:** M8 Voice Runtime (feature spec archived)
**Design:** [Design Doc](../../../wiki/design-docs/m8-voice-runtime.md)
**Research:** [Research Findings](../../../wiki/queries/m8-voice-runtime-research.md)
**Status:** Active
**Created:** 2026-02-17

## Feature Definition

**Goal:** Wire grove-voice-livekit to real telephony via Telnyx SIP trunks and LiveKit SIP Bridge, with Temporal orchestration for outbound call lifecycle.

**Acceptance criteria:**
- [ ] Telnyx SIP trunk configured and connected to LiveKit SIP Bridge
- [ ] LiveKit SIP dispatch rules route inbound calls to agent workers
- [ ] Agent worker has working entrypoint + Dockerfile
- [ ] Outbound call flow works end-to-end
- [ ] Inbound call flow works end-to-end
- [ ] Post-call signal back to Temporal on session end
- [ ] call_duration_ms and call_outcome on conversation model
- [ ] FillerAudio and TurnDetection config passthrough
- [ ] Voice latency < 800ms first audio output
- [ ] E2E test validates round-trip

**Scope boundaries:**
- IN: Telnyx SIP wiring, LiveKit SIP config, agent-worker deployment, VoiceCallWorkflow, post-call signaling, call metadata, config passthrough
- OUT: Multi-tenant provisioning, call monitoring, call recording, per-tenant routing, billing, agent hot-reload, transcript persistence (deferred to M14)

## Phase Plan

### Phase 1: Core Protocol + DB Migration (parallel, no dependencies)

**Objective:** Add the CallInitiator protocol to grove.core, add call metadata fields to conversation model, fix config passthrough in entrypoint.

**Input:**
- Design doc sections 5.2 (data models), 5.3 (API surface — CallInitiator protocol)
- `packages/grove/src/grove/core/conversations.py` (~current model)
- `packages/grove/src/grove/config/schema.py` (~voice channel config)
- `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` (~current entrypoint)

**Deliverables:**
1. `packages/grove/src/grove/core/voice.py` — CallInitiator protocol + CallInfo dataclass (~20 LOC)
2. `packages/grove/src/grove/core/conversations.py` — add call_duration_ms, call_outcome fields (~5 LOC)
3. `packages/grove/src/grove/alembic/versions/<timestamp>_add_call_metadata.py` — migration (~20 LOC)
4. `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` — add GROVE_AGENT_NAME env var, fix filler_audio passthrough, fix turn_detection from config (~20 LOC)

**Tests:**
- Unit test for CallInitiator protocol (protocol check)
- Unit test for conversation model with new fields
- Existing architecture tests pass (import boundaries)
- Existing voice unit tests pass (no regression)

**Verification gate:**
```bash
uv run pyright packages/grove/src/
uv run ruff check packages/grove/src/ packages/grove/tests/
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
uv run pytest packages/grove/tests/unit/ -v --tb=short
uv run pytest packages/grove-voice-livekit/tests/ -v --tb=short -k "not real_providers and not e2e"
```

**Context budget:** ~40K tokens (small changes, well-scoped)
**Dependencies:** None
**Parallelizable:** Yes — all 4 deliverables are independent

### Phase 2: VoiceCallWorkflow + Activities (depends on Phase 1 for CallInitiator protocol)

**Objective:** Create the Temporal workflow for outbound call orchestration and the pre/post call activities.

**Input:**
- Design doc section 5.3 (VoiceCallWorkflow, activities)
- Phase 1 output: `core/voice.py` (CallInitiator protocol)
- `packages/grove/src/grove/temporal/workflows.py` (~existing workflow patterns)
- `packages/grove/src/grove/temporal/activities.py` (~existing activity patterns)
- `packages/grove/src/grove/core/conversations.py` (~conversation store patterns)

**Deliverables:**
1. `packages/grove/src/grove/temporal/voice_call_workflow.py` — VoiceCallWorkflow with signal-based wait (~80 LOC)
2. `packages/grove/src/grove/temporal/voice_activities.py` — pre_call, post_call activities (~60 LOC). NOTE: initiate_call_activity lives in apps/agent-worker (Phase 3), NOT here. These activities only do DB reads/writes via conversation store.

**Tests:**
- Unit test: VoiceCallWorkflow signal handling (mock activities)
- Unit test: VoiceCallWorkflow timeout behavior (20 min default)
- Unit test: pre_call_activity loads context from conversation store
- Unit test: post_call_activity persists call_duration_ms and call_outcome
- Architecture tests pass (import boundaries — temporal/ imports only from {temporal, core, config, runtime})

**Verification gate:**
```bash
uv run pyright packages/grove/src/
uv run ruff check packages/grove/src/ packages/grove/tests/
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
uv run pytest packages/grove/tests/unit/ -v --tb=short
```

**Context budget:** ~50K tokens
**Dependencies:** Phase 1 (CallInitiator protocol in core/voice.py)
**Parallelizable:** No — depends on Phase 1

### Phase 3: Agent Worker Wiring (depends on Phase 1 for entrypoint changes)

**Objective:** Wire apps/agent-worker with entrypoint, LiveKit CallInitiator implementation, post-call Temporal signal, and Dockerfile.

**Input:**
- Design doc sections 5.1 (architecture), 5.3 (entrypoint, CallInitiator)
- Phase 1 output: updated entrypoint.py with GROVE_AGENT_NAME
- Phase 1 output: core/voice.py (CallInitiator protocol)
- `apps/agent-worker/pyproject.toml` (~current deps)
- `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` (~current entrypoint)

**Deliverables:**
1. `apps/agent-worker/src/agent_worker/main.py` — entrypoint that runs grove-voice-livekit worker (~30 LOC)
2. `apps/agent-worker/src/agent_worker/call_initiator.py` — LiveKit implementation of CallInitiator protocol (~50 LOC). Calls CreateSIPParticipant API. This is where the livekit-api SDK import lives.
3. `apps/agent-worker/src/agent_worker/temporal_signal.py` — post-call signal to Temporal on session end (~30 LOC)
4. `apps/agent-worker/Dockerfile` — Docker build (~15 LOC)
5. `apps/agent-worker/pyproject.toml` — update deps (grove, grove-voice-livekit, livekit-api, temporalio)
6. `docker-compose.yml` — add agent-worker service (for CI/staging, NOT macOS local dev)

**Tests:**
- Unit test: LiveKit CallInitiator implementation (mock livekit API)
- Unit test: post-call Temporal signal logic (mock temporal client)
- Unit test: main.py entrypoint initialization

**Verification gate:**
```bash
uv run pyright apps/agent-worker/src/
uv run ruff check apps/agent-worker/
uv run pytest apps/agent-worker/tests/ -v --tb=short  # if tests dir exists
```

**Context budget:** ~50K tokens
**Dependencies:** Phase 1 (entrypoint changes, CallInitiator protocol)
**Parallelizable with Phase 2:** Yes — Phase 2 (workflow) and Phase 3 (agent worker) can run in parallel after Phase 1 completes

### Phase 4: SIP Infrastructure Setup Script (independent, depends on Telnyx account)

**Objective:** Create a setup script that provisions Telnyx SIP trunk and LiveKit SIP infrastructure.

**Input:**
- Research doc sections 2-6 (Telnyx config, LiveKit config, dispatch rules)
- Design doc section 5.1 (component architecture)
- Telnyx credentials (from user/environment)
- LiveKit credentials (from user/environment)

**Deliverables:**
1. `tools/scripts/setup-sip.py` — idempotent setup script (~200 LOC)
   - Creates Telnyx Outbound Voice Profile
   - Creates Telnyx FQDN Connection (credential auth, AnchorSite: Frankfurt)
   - Creates Telnyx FQDN record pointing to LiveKit SIP URI
   - Creates LiveKit inbound trunk (krisp_enabled=True)
   - Creates LiveKit outbound trunk (with X-Telnyx-Username header)
   - Creates LiveKit dispatch rule (Individual, room_prefix="call-", agentName per GROVE_AGENT_NAME)
   - Prints trunk IDs for .env configuration
2. `.env.example` — update with Telnyx/SIP/LiveKit SIP vars

**Tests:**
- Unit test: script functions with mocked Telnyx/LiveKit APIs
- Manual: run against staging Telnyx + LiveKit accounts

**Verification gate:**
```bash
uv run ruff check tools/scripts/setup-sip.py
uv run pyright tools/scripts/setup-sip.py
# Manual: run script, verify trunks created
```

**Context budget:** ~60K tokens (Telnyx + LiveKit API research heavy)
**Dependencies:** Telnyx account credentials (external). Code-wise independent of Phases 1-3.
**Parallelizable:** Yes — can run in parallel with Phases 1-3

### Phase 5: Integration Testing + E2E (depends on all above)

**Objective:** Validate the full pipeline works end-to-end.

**Input:**
- All Phase 1-4 outputs
- Telnyx staging account + phone number
- LiveKit Cloud staging project

**Deliverables:**
1. Integration test: agent worker connects to local LiveKit, handles mock SIP participant
2. E2E test: full outbound call via SIP (staging only, periodic CI)
3. Manual verification: call Lithuanian number, verify agent answers

**Tests:**
- Integration: ~3-4 tests
- E2E: 1-2 tests (staging/periodic CI only)

**Verification gate:**
```bash
uv run pytest packages/grove-voice-livekit/tests/integration/ -v --tb=short
# Staging only:
uv run pytest packages/grove-voice-livekit/tests/e2e/ -v --tb=short -k "sip"
```

**Context budget:** ~40K tokens
**Dependencies:** Phases 1-4 all complete. Staging credentials available.
**Parallelizable:** No — final integration phase

## Execution Protocol

1. **Phase 1** — Delegate to developer agent. Gather: core/conversations.py, core/ directory structure, entrypoint.py, schema.py. Verify gate. Commit.
2. **Phase 2 + Phase 3** — Run in parallel after Phase 1 passes gate. Two developer agents. Phase 2 gets workflow patterns from temporal/. Phase 3 gets agent-worker shell + CallInitiator protocol from Phase 1.
3. **Phase 4** — Can start anytime (independent). Developer agent with Telnyx/LiveKit research doc as input.
4. **Phase 5** — After all gates pass. Integration + E2E testing.
5. **Final gate:** All tests pass, PR review, merge.

## Dependency Graph

```
Phase 1 (Core + DB + Config)
    ├── Phase 2 (Workflow + Activities)  ─┐
    └── Phase 3 (Agent Worker)           ─┤── Phase 5 (Integration + E2E)
Phase 4 (SIP Setup Script)              ─┘
```

Phases 2, 3, 4 can all run in parallel after Phase 1.

## Progress

| Phase | Status | Tests | Gate |
|-------|--------|-------|------|
| 1. Core Protocol + DB | pending | 0/0 | -- |
| 2. VoiceCallWorkflow | pending | 0/0 | -- |
| 3. Agent Worker | pending | 0/0 | -- |
| 4. SIP Setup Script | pending | 0/0 | -- |
| 5. Integration + E2E | pending | 0/0 | -- |

## Files Modified

| File | Phase | Change |
|------|-------|--------|
| `packages/grove/src/grove/core/voice.py` | 1 | New — CallInitiator protocol |
| `packages/grove/src/grove/core/conversations.py` | 1 | Modify — call metadata fields |
| `packages/grove/src/grove/alembic/versions/<ts>_add_call_metadata.py` | 1 | New — migration |
| `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` | 1 | Modify — agent_name, config passthrough |
| `packages/grove/src/grove/temporal/voice_call_workflow.py` | 2 | New — VoiceCallWorkflow |
| `packages/grove/src/grove/temporal/voice_activities.py` | 2 | New — pre/post call activities |
| `apps/agent-worker/src/agent_worker/main.py` | 3 | New — entrypoint |
| `apps/agent-worker/src/agent_worker/call_initiator.py` | 3 | New — LiveKit CallInitiator |
| `apps/agent-worker/src/agent_worker/temporal_signal.py` | 3 | New — post-call signal |
| `apps/agent-worker/Dockerfile` | 3 | New — Docker build |
| `apps/agent-worker/pyproject.toml` | 3 | Update — deps |
| `docker-compose.yml` | 3 | Update — agent-worker service |
| `tools/scripts/setup-sip.py` | 4 | New — SIP infra setup |
| `.env.example` | 4 | Update — SIP vars |

## Cross-References

- Feature Spec (archived)
- [Design Doc](../../../wiki/design-docs/m8-voice-runtime.md)
- [Research](../../../wiki/queries/m8-voice-runtime-research.md)
- [Voice Architecture](../../../wiki/systems/voice.md)
- [Platform Architecture](../../../wiki/architecture/architecture.md)
- [M8 milestone](../M8-v2-voice-control-plane.md)
