# Voice Platform Orchestration Plan

> **Pattern:** B — Parallel Workstreams (shared foundation → parallel tracks → integration)
>
> **Scope:** Grove core changes (~195 LOC) + grove-voice-livekit new package (~350 LOC).
> NO Platform/Next.js layer. This is the voice AI middleware core.

---

## Quick Start for Supervisor

You are the **supervisor**. You do NOT write code. You delegate to developer subagents,
verify results, and proceed to the next phase.

### Execution Loop (repeat for each phase)

```
1. Read this plan's Phase N section
2. Gather reference material (spec sections, source files, existing code)
3. Construct developer agent prompt with: spec, source, deps, deliverables, tests, gate
4. Launch developer agent (Task tool, subagent_type=developer)
5. When agent completes: run verification gate
6. If gate fails: re-delegate with failure output
7. If gate passes: update progress tracking, proceed to Phase N+1
```

### Rules

- One phase at a time for sequential work. Parallelizable phases noted explicitly.
- Never skip a phase. Dependencies are strict.
- Context budget matters. Don't feed entire specs. Extract only relevant sections.
- Verify before proceeding. Every phase has a gate. No exceptions.
- Update PROGRESS.md after each phase completes.

---

## 1. Feature Definition

**Feature name:** Grove Voice Platform — Core + LiveKit Adapter

**Goal:** Enable any Grove agent (defined in YAML) to conduct real-time phone conversations via LiveKit, with zero changes to agent logic, by adding voice channel config to Grove core and creating a thin adapter package (grove-voice-livekit) that wraps AgentExecutor as a LiveKit-compatible voice agent.

**Acceptance criteria:**
- Grove YAML configs accept `channels.voice` with STT/TTS/VAD settings, validated by Pydantic
- `ExecutorStreamInput` supports a `cancellation_event` for barge-in cancellation (generic, not LiveKit-specific)
- Temporal `VoiceCallWorkflow` orchestrates pre-call → wait → post-call lifecycle
- Chat model supports `channel` field to distinguish voice from chat conversations
- AgentConfig CRUD API allows runtime config loading (needed by grove-voice-livekit workers)
- grove-voice-livekit package: GroveVoiceAgent wraps AgentExecutor via `llm_node` override, config_mapper maps YAML to LiveKit STT/TTS/VAD plugin instances, entrypoint.py runs as LiveKit Agent Worker
- Full integration test validates the voice pipeline (mock STT → AgentExecutor → mock TTS)

**Scope boundaries (what is NOT included):**
- Platform/Next.js UI layer
- Billing, monitoring dashboards
- SIP trunk configuration (LiveKit Cloud dashboard concern)
- Production deployment scripts or CI/CD
- Node merging optimization (future enhancement)
- Filler audio implementation (future enhancement, config schema only)
- Recording/egress (LiveKit Cloud API, not in adapter)

---

## 2. Phase Plan

### Dependency Graph

```
Phase 1 (VoiceChannelConfig) ──┐
Phase 2 (cancellation_event) ──┼── can run in PARALLEL ──┐
Phase 3 (call metadata)   ─────┘                         │
                                                          ▼
Phase 4 (VoiceCallWorkflow) ──── depends on Phase 3 ─────┤
Phase 5 (AgentConfig CRUD API) ── depends on nothing* ───┤
                                                          │
                                                          ▼
                                                  Integration Gate A
                                                  (all Grove core phases)
                                                          │
Phase 6 (package scaffold) ───────────────────────────────┤
                                                          ▼
Phase 7 (config_mapper) ──── depends on Phase 1, 6 ──────┤
Phase 8 (grove_voice_agent) ── depends on Phase 2, 6 ────┤  can run in PARALLEL
                                                          │
                                                          ▼
Phase 9 (entrypoint) ──── depends on Phase 7, 8 ─────────┤
                                                          ▼
Phase 10 (integration test) ── depends on Phase 9 ────────┤
                                                          ▼
                                                  Integration Gate B
                                                  (full project)
```

*Phase 5 has no code dependency on Phases 1-3 but is logically grouped with Grove core.

---

### Phase 1: VoiceChannelConfig Schema

**Objective:** Add Pydantic models for voice channel configuration to Grove's config schema. This enables YAML validation for `channels.voice` with STT, TTS, VAD, turn detection, and filler audio settings. Grove NEVER imports LiveKit — these are provider-agnostic config models.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 5 (lines 269-352) — VoiceChannelConfig schema
- Source files to read: `src/grove/config/schema.py` (existing channel configs: ChatChannelConfig, EmailChannelConfig, ChannelConfig)
- Dependencies from prior phases: none

**Deliverables:**
- `src/grove/config/schema.py` -- Add `STTConfig`, `TTSConfig`, `VADConfig`, `FillerAudioConfig`, `VoiceChannelConfig` Pydantic models; add `voice: VoiceChannelConfig | None = None` to `ChannelConfig`

**Tests:**
- `tests/unit/config/test_voice_schema.py` -- 12 tests:
  - STTConfig: valid construction, missing provider/model validation, language default
  - TTSConfig: valid construction, optional voice_id, missing provider/model validation
  - VADConfig: defaults (type="silero", min_silence_duration_ms=300), custom values
  - FillerAudioConfig: default disabled, enabled
  - VoiceChannelConfig: full construction, enabled=False default, minimal with just enabled
  - ChannelConfig: voice field integration, backward compatibility (chat+email only still works)

**Verification gate:**
```bash
uv run pytest tests/unit/config/test_voice_schema.py --tb=short -q   # Expected: 12 passed
uv run pyright src/grove/config/schema.py                             # Expected: 0 errors
uv run ruff check src/grove/config/schema.py tests/unit/config/test_voice_schema.py
uv run ruff format --check src/grove/config/schema.py tests/unit/config/test_voice_schema.py
```

**Context budget:** ~20K tokens (spec: 5K, source: 8K, overhead: 7K)

**Depends on:** none

**Can run in parallel with:** Phase 2, Phase 3

---

### Phase 2: Cancellation Hook on ExecutorStreamInput

**Objective:** Add an optional `cancellation_event: asyncio.Event | None` field to `ExecutorStreamInput`. When set, the streaming LLM loop in `build_react_graph_streaming` and `build_flow_graph` checks `cancellation_event.is_set()` between chunks and breaks out early. This is a generic mechanism for any channel that needs to cancel mid-stream (voice barge-in, user disconnect, etc.) — NOT LiveKit-specific.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.2 (lines 177-197) — cancellation hook
- Source files to read: `src/grove/runtime/types.py` (ExecutorStreamInput), `src/grove/runtime/graph.py` (call_model_streaming, _make_flow_node), `src/grove/runtime/executor.py` (execute_with_streaming)
- Dependencies from prior phases: none

**Deliverables:**
- `src/grove/runtime/types.py` -- Add `cancellation_event: asyncio.Event | None = None` to `ExecutorStreamInput`
- `src/grove/runtime/graph.py` -- In `call_model_streaming` and the flow graph's streaming node, check `cancellation_event.is_set()` between chunk iterations. If set, break out of the stream loop, emit a "done" chunk, and return partial results.
- `src/grove/runtime/executor.py` -- Pass `cancellation_event` from `ExecutorStreamInput` through to graph builders

**Tests:**
- `tests/unit/runtime/test_cancellation.py` -- 6 tests:
  - ExecutorStreamInput accepts cancellation_event field
  - cancellation_event defaults to None (backward compat)
  - Streaming graph stops when cancellation_event is set mid-stream
  - Partial response returned on cancellation
  - "done" chunk emitted on cancellation
  - No effect when cancellation_event is None (existing behavior preserved)

**Verification gate:**
```bash
uv run pytest tests/unit/runtime/test_cancellation.py --tb=short -q                    # Expected: 6 passed
uv run pytest tests/unit/runtime/ tests/integration/runtime/ --tb=short -q              # Regression: all existing pass
uv run pyright src/grove/runtime/types.py src/grove/runtime/graph.py src/grove/runtime/executor.py  # Expected: 0 errors
uv run ruff check src/grove/runtime/ tests/unit/runtime/test_cancellation.py
uv run ruff format --check src/grove/runtime/ tests/unit/runtime/test_cancellation.py
```

**Context budget:** ~40K tokens (spec: 3K, source: 25K for graph.py+executor.py+types.py, overhead: 12K)

**Depends on:** none

**Can run in parallel with:** Phase 1, Phase 3

---

### Phase 3: Call Metadata on Chat Model

**Objective:** Add voice call metadata fields to the `Chat` and `CreateChatInput` models to distinguish voice conversations from chat conversations. Uses the existing `metadata: dict[str, Any]` field pattern — no schema migration needed. Add a `channel` parameter to `ConversationStore.list_chats()` for filtering (already present in the abstract method signature).

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 10, row "Call metadata on Chat model"
- Source files to read: `src/grove/core/conversations.py` (Chat, CreateChatInput, ConversationStore), `src/grove/backends/postgres/conversation_store.py` (PostgresConversationStore.list_chats)
- Dependencies from prior phases: none

**Deliverables:**
- `src/grove/core/conversations.py` -- Add `channel: str | None = None` field to `Chat` and `CreateChatInput` models. Add `ChannelType = Literal["chat", "voice", "email"]` type alias for documentation (not enforced in model, since metadata dict already handles extension).
- `src/grove/backends/postgres/conversation_store.py` -- Ensure `list_chats` filters by `channel` when the parameter is provided (add WHERE clause on metadata->>'channel' or a dedicated column if cleaner). Ensure `create_chat` persists the channel field.

**Tests:**
- `tests/unit/core/test_voice_metadata.py` -- 5 tests:
  - Chat model accepts channel field
  - CreateChatInput accepts channel field
  - channel defaults to None (backward compat)
  - Voice-specific metadata dict keys (call_duration_ms, call_outcome, phone_number) round-trip
  - ChannelType type alias includes expected values
- `tests/integration/backends/test_voice_conversation_store.py` -- 3 tests:
  - Create chat with channel="voice" and voice metadata, retrieve and verify
  - list_chats filters by channel="voice" (returns only voice chats)
  - list_chats without channel filter returns all chats (backward compat)

**Verification gate:**
```bash
uv run pytest tests/unit/core/test_voice_metadata.py tests/integration/backends/test_voice_conversation_store.py --tb=short -q  # Expected: 8 passed
uv run pytest tests/unit/core/ tests/integration/backends/ --tb=short -q                                                        # Regression: all existing pass
uv run pyright src/grove/core/conversations.py src/grove/backends/postgres/conversation_store.py                                  # Expected: 0 errors
uv run ruff check src/grove/core/conversations.py src/grove/backends/postgres/conversation_store.py tests/unit/core/test_voice_metadata.py tests/integration/backends/test_voice_conversation_store.py
uv run ruff format --check src/grove/core/conversations.py src/grove/backends/postgres/conversation_store.py tests/unit/core/test_voice_metadata.py tests/integration/backends/test_voice_conversation_store.py
```

**Context budget:** ~25K tokens (spec: 2K, source: 12K, overhead: 11K)

**Depends on:** none

**Can run in parallel with:** Phase 1, Phase 2

---

### Phase 4: VoiceCallWorkflow for Temporal

**Objective:** Create a Temporal workflow for voice call lifecycle: pre-call context fetching → initiate call via LiveKit API → wait for call_completed signal → post-call processing (persist conversation, analyze outcome). This follows the "1 workflow, 1 long-lived activity per call" pattern from the architecture doc. The workflow does NOT run during the call — LiveKit owns the voice runtime.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.3 (lines 199-240) — Temporal's role, Section 6.1 (lines 358-404) — outbound call flow
- Source files to read: `src/grove/temporal/conversation_workflow.py` (existing pattern), `src/grove/temporal/invoke_workflow.py` (existing pattern), `src/grove/temporal/activities.py` (existing activities), `src/grove/temporal/workflows.py` (barrel), `src/grove/temporal/worker.py` (worker registration)
- Dependencies from prior phases: Phase 3 (channel field on Chat model for persisting voice conversations)

**Deliverables:**
- `src/grove/temporal/voice_call_workflow.py` -- New file (~50 LOC):
  - `VoiceCallWorkflowInput` dataclass: agent_name, organization_id, user_id, phone_number, metadata (dict), room_name (optional)
  - `VoiceCallWorkflowOutput` dataclass: call_id, duration_ms, outcome, conversation_id
  - `VoiceCallWorkflow` with `@workflow.defn`:
    - `run()`: execute pre_call activity → execute initiate_call activity → `workflow.wait_condition` on call_completed signal → execute post_call activity → return output
    - `call_completed` signal handler: receives call result data (duration, outcome, messages)
  - `VOICE_CALL_RETRY_POLICY`: 3 attempts, 5s initial, 60s max, 2x backoff
- `src/grove/temporal/workflows.py` -- Add VoiceCallWorkflow to barrel exports
- `src/grove/temporal/worker.py` -- Register VoiceCallWorkflow in worker

**Tests:**
- `tests/unit/temporal/test_voice_call_workflow.py` -- 8 tests:
  - Workflow has @workflow.defn decorator
  - VoiceCallWorkflowInput dataclass serialization round-trip
  - VoiceCallWorkflowOutput dataclass serialization round-trip
  - Signal handler registered for "call_completed"
  - VOICE_CALL_RETRY_POLICY values match spec (3 attempts, 5s initial, 60s max, 2x)
  - Workflow registered in worker (check create_grove_worker)
  - Barrel exports include VoiceCallWorkflow
  - Input requires agent_name, organization_id, user_id, phone_number

**Verification gate:**
```bash
uv run pytest tests/unit/temporal/test_voice_call_workflow.py --tb=short -q         # Expected: 8 passed
uv run pytest tests/unit/temporal/ tests/integration/temporal/ --tb=short -q        # Regression: all existing pass
uv run pyright src/grove/temporal/voice_call_workflow.py src/grove/temporal/workflows.py src/grove/temporal/worker.py  # Expected: 0 errors
uv run ruff check src/grove/temporal/ tests/unit/temporal/
uv run ruff format --check src/grove/temporal/ tests/unit/temporal/
```

**Context budget:** ~35K tokens (spec: 5K, source: 15K for workflow files, deps: 5K, overhead: 10K)

**Depends on:** Phase 3

**Can run in parallel with:** Phase 5 (after Phase 3 completes)

---

### Phase 5: AgentConfig CRUD API

**Objective:** Add REST endpoints for reading agent configurations at runtime. grove-voice-livekit workers need to load AgentConfig when a call is dispatched (the worker receives org_id + agent_name from room metadata and must fetch the full config). Endpoints: GET /agents (list all), GET /agents/{agent_name} (get one), GET /agents/{agent_name}/config (get raw YAML). These are read-only — config creation/update is via YAML files and deployment.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 10, row "AgentConfig CRUD API"
- Source files to read: `src/grove/api/routes/invoke.py` (existing agent listing pattern), `src/grove/api/routes/health.py` (simple route pattern), `src/grove/api/app.py` (route registration), `src/grove/config/loader.py` (GroveConfig, load_agent_config), `src/grove/bootstrap.py` (how config is loaded and stored)
- Dependencies from prior phases: none (uses existing config loader)

**Deliverables:**
- `src/grove/api/routes/agents.py` -- New file (~100 LOC):
  - `create_agents_router()` factory function
  - `GET /agents` — list all agent configs (name, description, channels, has_flow_definition)
  - `GET /agents/{agent_name}` — get full AgentConfig as JSON (Pydantic model_dump)
  - `GET /agents/{agent_name}/voice-config` — get just the voice channel config (for grove-voice-livekit)
  - All endpoints require auth (same pattern as chat routes)
  - 404 when agent_name not found
- `src/grove/api/app.py` -- Register agents router
- `src/grove/bootstrap.py` -- Store agent configs on app.state for route access (if not already there)

**Tests:**
- `tests/integration/api/test_agents.py` -- 10 tests:
  - GET /agents returns list of agent summaries
  - GET /agents/{name} returns full config
  - GET /agents/{name} 404 for unknown agent
  - GET /agents/{name}/voice-config returns voice channel config
  - GET /agents/{name}/voice-config 404 when no voice config
  - GET /agents/{name}/voice-config 404 for unknown agent
  - Auth required on all endpoints (401 without token)
  - Response includes channels field
  - Response includes flow_definition presence flag
  - Multiple agents returned in list

**Verification gate:**
```bash
uv run pytest tests/integration/api/test_agents.py --tb=short -q           # Expected: 10 passed
uv run pytest tests/integration/api/ --tb=short -q                         # Regression: all existing pass
uv run pyright src/grove/api/routes/agents.py src/grove/api/app.py         # Expected: 0 errors
uv run ruff check src/grove/api/routes/agents.py tests/integration/api/test_agents.py
uv run ruff format --check src/grove/api/routes/agents.py tests/integration/api/test_agents.py
```

**Context budget:** ~35K tokens (spec: 2K, source: 15K for route files, deps: 8K, overhead: 10K)

**Depends on:** none

**Can run in parallel with:** Phase 4 (after Phase 3 completes), Phases 1-3

---

### Integration Gate A: Grove Core Verification

After Phases 1-5 complete, run full project verification:

```bash
uv run pytest --tb=short -q                    # ALL tests pass (563 existing + ~49 new ≈ 612)
uv run pyright                                 # Full project: 0 errors
uv run ruff check src/ tests/                  # Full lint
uv run ruff format --check src/ tests/         # Full format
```

Only proceed to Phase 6 after this gate passes.

---

### Phase 6: grove-voice-livekit Package Scaffold

**Objective:** Create the separate `grove-voice-livekit` package with its directory structure, pyproject.toml, and dependencies. This package lives OUTSIDE grove-py (separate repo/directory). For development, it can be a sibling directory. The package depends on `grove` (as a library) and `livekit-agents` + plugins.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.1 (lines 125-176) — package structure
- Source files to read: `grove-py/pyproject.toml` (reference for project config style)
- Dependencies from prior phases: Integration Gate A passed (Grove core is stable)

**Deliverables:**
- `grove-voice-livekit/pyproject.toml` -- Package config:
  - name: grove-voice-livekit
  - dependencies: grove (path or published), livekit-agents>=1.0, livekit-plugins-google, livekit-plugins-elevenlabs, livekit-plugins-silero
  - dev dependencies: pytest, pytest-asyncio, pyright, ruff
  - Python >=3.12
  - Build system: hatchling
- `grove-voice-livekit/src/grove_voice_livekit/__init__.py` -- Package init with __version__
- `grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` -- Empty module with docstring placeholder
- `grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py` -- Empty module with docstring placeholder
- `grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` -- Empty module with docstring placeholder
- `grove-voice-livekit/tests/__init__.py` -- Empty
- `grove-voice-livekit/tests/conftest.py` -- Base fixtures
- `grove-voice-livekit/CLAUDE.md` -- Package-specific instructions

**Tests:**
- `grove-voice-livekit/tests/test_package.py` -- 3 tests:
  - Package imports successfully
  - __version__ is set
  - Submodules importable (config_mapper, grove_voice_agent, entrypoint)

**Verification gate:**
```bash
cd grove-voice-livekit && uv sync                                           # Dependencies install
cd grove-voice-livekit && uv run pytest tests/test_package.py --tb=short -q # Expected: 3 passed
cd grove-voice-livekit && uv run pyright src/                               # Expected: 0 errors
```

**Context budget:** ~15K tokens (spec: 3K, source: 5K, overhead: 7K)

**Depends on:** Integration Gate A

**Can run in parallel with:** none (foundation for Phases 7-9)

---

### Phase 7: config_mapper.py

**Objective:** Implement pure mapping functions that take `VoiceChannelConfig` YAML values and construct LiveKit STT/TTS/VAD plugin instances. This module is the only place where LiveKit plugin constructors are called. API keys come from environment variables, model IDs from config.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.1 (lines 175-176) — config_mapper description, Section 5 (lines 269-352) — YAML schema
- Source files to read: `src/grove/config/schema.py` (STTConfig, TTSConfig, VADConfig from Phase 1)
- Dependencies from prior phases: Phase 1 (VoiceChannelConfig), Phase 6 (package scaffold)

**Deliverables:**
- `grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` (~50 LOC):
  - `build_stt(config: STTConfig) -> google.STT` — maps provider string to Google Cloud STT instance: `google.STT(languages="lt-LT", model="chirp_3", detect_language=False, punctuate=True)`. Language and model come from STTConfig fields.
  - `build_tts(config: TTSConfig) -> elevenlabs.TTS` — maps provider string to TTS instance with model + voice_id
  - `build_vad(config: VADConfig | None) -> silero.VAD` — loads Silero VAD with min_silence_duration
  - Each function raises `ValueError` for unsupported providers
  - API keys read from environment (`GOOGLE_APPLICATION_CREDENTIALS` for STT — service account JSON path, `ELEVENLABS_API_KEY` for TTS)

**Tests:**
- `grove-voice-livekit/tests/test_config_mapper.py` -- 10 tests:
  - build_stt with google provider returns google.STT instance
  - build_stt passes language and model (chirp_3) from config
  - build_stt raises ValueError for unsupported provider
  - build_tts with elevenlabs provider returns correct type
  - build_tts with voice_id passed through
  - build_tts raises ValueError for unsupported provider
  - build_vad returns Silero VAD instance
  - build_vad uses default min_silence_duration when config is None
  - build_vad respects custom min_silence_duration_ms
  - All builders are pure functions (no side effects beyond env reads)

**Verification gate:**
```bash
cd grove-voice-livekit && uv run pytest tests/test_config_mapper.py --tb=short -q  # Expected: 10 passed
cd grove-voice-livekit && uv run pyright src/grove_voice_livekit/config_mapper.py   # Expected: 0 errors
cd grove-voice-livekit && uv run ruff check src/grove_voice_livekit/config_mapper.py tests/test_config_mapper.py
```

**Context budget:** ~25K tokens (spec: 5K, source: 8K for schema, deps: 5K, overhead: 7K)

**Depends on:** Phase 1, Phase 6

**Can run in parallel with:** Phase 8

---

### Phase 8: grove_voice_agent.py (GroveVoiceAgent)

**Objective:** Implement `GroveVoiceAgent` that subclasses LiveKit's `Agent` and overrides `llm_node` to route through Grove's `AgentExecutor.execute_with_streaming()`. This is the core bridge — it converts LiveKit's chat context to Grove's `ExecutorStreamInput`, calls the executor, and yields `ChatChunk` objects for LiveKit's TTS pipeline. Handles barge-in via the cancellation_event from Phase 2.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.1 (lines 167-174) — grove_llm_adapter description (now grove_voice_agent.py)
- Research findings: LiveKit Agent `llm_node` override pattern (from research summary in task prompt)
- Source files to read: `src/grove/runtime/executor.py` (execute_with_streaming), `src/grove/runtime/types.py` (ExecutorStreamInput, StreamChunk, ExecutorOutput)
- Dependencies from prior phases: Phase 2 (cancellation_event), Phase 6 (package scaffold)

**Deliverables:**
- `grove-voice-livekit/src/grove_voice_livekit/grove_voice_agent.py` (~200 LOC):
  - `GroveVoiceAgent(Agent)` class:
    - Constructor: receives `AgentExecutor` instance, stores it
    - `llm_node(self, chat_ctx, tools, model_settings) -> AsyncIterable[ChatChunk]`:
      1. Convert `chat_ctx.messages` to Grove message format (list of dicts with role/content)
      2. Create `asyncio.Event()` for cancellation
      3. Build `ExecutorStreamInput` with messages, context, on_chunk callback, cancellation_event
      4. Start `executor.execute_with_streaming()` as background task
      5. Use `asyncio.Queue` to bridge on_chunk callback → async iteration
      6. Yield `ChatChunk` objects for each text chunk received
      7. On "done" chunk, stop iteration
    - Sentence boundary aggregation: buffer text tokens, yield to TTS at sentence boundaries (`.`, `?`, `!`, `\n`) for natural speech cadence
    - Barge-in: expose `cancel()` method that sets the cancellation_event

**Tests:**
- `grove-voice-livekit/tests/test_grove_voice_agent.py` -- 10 tests:
  - GroveVoiceAgent accepts AgentExecutor in constructor
  - llm_node converts LiveKit messages to Grove format
  - llm_node yields ChatChunk objects
  - Text chunks aggregated at sentence boundaries
  - Partial buffer flushed on done chunk
  - Cancellation event stops streaming
  - Empty response handled gracefully
  - Tool calls during flow don't emit to TTS (only text chunks)
  - Multiple turns maintain conversation context
  - ExecutorOutput metrics accessible after call

**Verification gate:**
```bash
cd grove-voice-livekit && uv run pytest tests/test_grove_voice_agent.py --tb=short -q  # Expected: 10 passed
cd grove-voice-livekit && uv run pyright src/grove_voice_livekit/grove_voice_agent.py   # Expected: 0 errors
cd grove-voice-livekit && uv run ruff check src/grove_voice_livekit/grove_voice_agent.py tests/test_grove_voice_agent.py
```

**Context budget:** ~40K tokens (spec: 5K, source: 20K for executor+types, deps: 5K, overhead: 10K)

**Depends on:** Phase 2, Phase 6

**Can run in parallel with:** Phase 7

---

### Phase 9: entrypoint.py (LiveKit Worker)

**Objective:** Implement the LiveKit Agent Worker entrypoint that loads Grove config, creates the AgentExecutor, configures STT/TTS/VAD from YAML, and starts the voice session. This is the process entry point — it runs as a LiveKit worker, receives job assignments, and spins up GroveVoiceAgent per call.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 4.1 (lines 131-165) — entrypoint pseudocode, Section 6.2 (lines 406-451) — inbound call flow
- Source files to read: `src/grove/config/loader.py` (load_agent_config), `src/grove/tools/registry.py` (ToolRegistry), `src/grove/runtime/executor.py` (AgentExecutor constructor)
- Dependencies from prior phases: Phase 7 (config_mapper), Phase 8 (GroveVoiceAgent)

**Deliverables:**
- `grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` (~100 LOC):
  - `async def entrypoint(ctx: JobContext) -> None`:
    1. `await ctx.connect()`
    2. Parse room metadata: `org_id`, `agent_name`, optional call context
    3. Load `AgentConfig` (from local YAML or Grove API based on config)
    4. Build `ToolRegistry` with agent's configured tools
    5. Create `AgentExecutor(config=agent_config, tool_registry=tool_registry)`
    6. Build STT/TTS/VAD via `config_mapper` from `agent_config.channels.voice`
    7. Create `AgentSession(stt=..., tts=..., vad=..., llm=GroveVoiceAgent(executor))`
    8. `await session.start(agent=grove_voice_agent, room=ctx.room)`
  - `def main() -> None`:
    - `cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))`
  - Config loading strategy: check env var `GROVE_CONFIG_PATH` for local YAML, fallback to `GROVE_API_URL` for HTTP fetch

**Tests:**
- `grove-voice-livekit/tests/test_entrypoint.py` -- 8 tests:
  - entrypoint reads room metadata (org_id, agent_name)
  - entrypoint loads AgentConfig from YAML path
  - entrypoint creates ToolRegistry with agent tools
  - entrypoint creates AgentExecutor with correct config
  - entrypoint builds STT/TTS/VAD from voice config
  - entrypoint creates AgentSession with all components
  - entrypoint handles missing voice config gracefully (raises clear error)
  - main() creates WorkerOptions with correct entrypoint

**Verification gate:**
```bash
cd grove-voice-livekit && uv run pytest tests/test_entrypoint.py --tb=short -q  # Expected: 8 passed
cd grove-voice-livekit && uv run pyright src/grove_voice_livekit/entrypoint.py   # Expected: 0 errors
cd grove-voice-livekit && uv run ruff check src/grove_voice_livekit/ tests/
cd grove-voice-livekit && uv run ruff format --check src/grove_voice_livekit/ tests/
```

**Context budget:** ~40K tokens (spec: 5K, source: 15K for loader+registry+executor, deps: 10K for Phase 7+8 outputs, overhead: 10K)

**Depends on:** Phase 7, Phase 8

**Can run in parallel with:** none — sequential

---

### Phase 10: Integration Testing

**Objective:** Full integration test of the voice pipeline: mock STT produces transcription → GroveVoiceAgent processes through AgentExecutor → mock TTS receives synthesized text. Validates the complete flow without real LiveKit infrastructure or STT/TTS providers. Also tests the config loading path and agent lifecycle.

**Input:**
- Spec sections: `wiki/systems/voice.md` Section 6.3 (lines 452-502) — single voice turn
- Source files to read: All grove-voice-livekit modules (Phase 7-9 outputs)
- Dependencies from prior phases: Phase 9 (all grove-voice-livekit modules complete)

**Deliverables:**
- `grove-voice-livekit/tests/integration/__init__.py`
- `grove-voice-livekit/tests/integration/test_voice_pipeline.py` -- Full pipeline integration tests
- `grove-voice-livekit/tests/integration/conftest.py` -- Integration fixtures (mock LiveKit components, sample agent YAML)
- `grove-voice-livekit/examples/sample_agent.yaml` -- Sample agent config with voice channel for testing

**Tests:**
- `grove-voice-livekit/tests/integration/test_voice_pipeline.py` -- 8 tests:
  - Full pipeline: mock STT text → GroveVoiceAgent.llm_node → executor → text chunks aggregated → mock TTS receives sentences
  - Config loading: YAML → VoiceChannelConfig → config_mapper → STT/TTS/VAD instances
  - Multi-turn conversation: two sequential transcriptions maintain conversation context
  - Tool execution during voice: tool call mid-flow, only text chunks reach TTS
  - Barge-in simulation: set cancellation_event mid-stream, verify partial output + clean stop
  - Flow graph execution: multi-node flow via voice (greeting → data collection)
  - Error handling: LLM failure during voice returns error gracefully
  - Agent lifecycle: create → process turns → cleanup

**Verification gate:**
```bash
cd grove-voice-livekit && uv run pytest tests/ --tb=short -q                    # Expected: all pass (~39 total)
cd grove-voice-livekit && uv run pyright src/                                   # Expected: 0 errors
cd grove-voice-livekit && uv run ruff check src/ tests/                         # Clean
cd grove-voice-livekit && uv run ruff format --check src/ tests/                # Clean
```

**Context budget:** ~50K tokens (spec: 5K, source: 20K for all modules, deps: 15K, overhead: 10K)

**Depends on:** Phase 9

**Can run in parallel with:** none — final phase

---

### Integration Gate B: Full Project Verification

After Phase 10 completes, verify everything together:

```bash
# Grove core (grove-py)
cd grove-py && uv run pytest --tb=short -q      # ALL tests pass (~612)
cd grove-py && uv run pyright                    # 0 errors
cd grove-py && uv run ruff check src/ tests/     # Clean

# grove-voice-livekit
cd grove-voice-livekit && uv run pytest --tb=short -q   # ALL tests pass (~39)
cd grove-voice-livekit && uv run pyright src/            # 0 errors
cd grove-voice-livekit && uv run ruff check src/ tests/  # Clean
```

---

## 3. Execution Protocol

For EACH phase, the supervisor MUST follow this sequence:

### Step 1: Gather Reference Material

Collect the spec sections, source files, and prior-phase outputs that the developer agent needs.
Use exact line ranges from specs to stay within context budget.

### Step 2: Construct Agent Prompt

Build the developer agent prompt containing:

1. **Spec extract** — the "what to build" reference (paste relevant sections)
2. **Source file list** — files the developer must read for reference
3. **Existing dependencies** — Python modules already written to import from
4. **Deliverables** — exact files to create or modify
5. **Tests** — exact test files to create, with expected count
6. **Verification commands** — exact pytest/pyright commands to run
7. **Boot instructions** — "Read PROGRESS.md first. Run `uv run pytest --tb=short -q` before investigating failures."

### Step 3: Launch Developer Agent

Delegate to a developer agent with file read/write/bash capabilities. The agent must:
- Read each referenced source file
- Read each spec section
- Read each dependency file
- Write the deliverable files
- Write the test files
- Run verification commands
- Report results

### Step 4: Verify Gate

Execute gate checks. If ANY check fails:
1. Identify the failure from output
2. Re-delegate to the developer agent with the failure output
3. Repeat until gate passes

### Step 5: Update Progress

After the gate passes, update PROGRESS.md with:
- Date completed
- Tests passing (phase count + cumulative)
- Files created/modified
- Architecture decisions made
- Known issues or caveats

### Step 6: Proceed

Only after the gate passes and progress is updated, move to the next phase.

---

## 4. Context Budget Calculator

| Phase | Spec | Source | Deps | Overhead | Total | Notes |
|-------|------|--------|------|----------|-------|-------|
| 1 - VoiceChannelConfig | 5K | 8K | 0K | 7K | **~20K** | Smallest phase, schema only |
| 2 - cancellation_event | 3K | 25K | 0K | 12K | **~40K** | graph.py is large (~400 LOC) |
| 3 - call metadata | 2K | 12K | 0K | 11K | **~25K** | Touches conversations + store |
| 4 - VoiceCallWorkflow | 5K | 15K | 5K | 10K | **~35K** | Reads existing workflow patterns |
| 5 - AgentConfig CRUD API | 2K | 15K | 8K | 10K | **~35K** | Reads existing route patterns |
| 6 - package scaffold | 3K | 5K | 0K | 7K | **~15K** | Minimal, boilerplate |
| 7 - config_mapper | 5K | 8K | 5K | 7K | **~25K** | Needs LiveKit plugin docs |
| 8 - grove_voice_agent | 5K | 20K | 5K | 10K | **~40K** | Core bridge, needs executor API |
| 9 - entrypoint | 5K | 15K | 10K | 10K | **~40K** | Assembles all components |
| 10 - integration test | 5K | 20K | 15K | 10K | **~50K** | Full pipeline validation |

All phases under 100K budget. Phase 10 is the heaviest at ~50K due to needing all prior modules as context.

---

## 5. Parallelization Summary

### Parallel Group 1: Grove Core Foundation (Phases 1, 2, 3)

These three phases modify independent files with zero overlap:
- Phase 1: `config/schema.py` + `tests/unit/config/test_voice_schema.py`
- Phase 2: `runtime/types.py`, `runtime/graph.py`, `runtime/executor.py` + `tests/unit/runtime/test_cancellation.py`
- Phase 3: `core/conversations.py`, `backends/postgres/conversation_store.py` + tests

**File ownership:** No overlap. Safe to parallelize.

### Parallel Group 2: Grove Core Completion (Phases 4, 5)

After Phase 3 completes:
- Phase 4: `temporal/voice_call_workflow.py` + `temporal/workflows.py` + `temporal/worker.py`
- Phase 5: `api/routes/agents.py` + `api/app.py`

**File ownership:** No overlap. Safe to parallelize.

### Parallel Group 3: grove-voice-livekit Core (Phases 7, 8)

After Phase 6 completes:
- Phase 7: `config_mapper.py` + tests
- Phase 8: `grove_voice_agent.py` + tests

**File ownership:** No overlap. Safe to parallelize.

### Sequential: Phases 6 → (7, 8) → 9 → 10

Phase 6 is foundation. Phase 9 depends on both 7 and 8. Phase 10 depends on 9.

---

## 6. Cross-Reference

| Need | Where to Look |
|------|---------------|
| Project setup and standards | `CLAUDE.md` (project root) |
| Voice architecture (full spec) | `wiki/systems/voice.md` |
| Exec plan template | `exec-plans template (archived)` |
| Architecture decisions | `wiki/queries/research-langgraph-vs-temporal.md` |
| LangGraph patterns | `wiki/queries/research-langgraph-integration-strategy.md` |
| Current project state | `PROGRESS.md` |
| This plan | `docs/milestones/exec-plans/voice-platform-orchestration-plan.md` |

---

## 7. Risk Notes

| Risk | Phase | Mitigation |
|------|-------|------------|
| LiveKit Agent SDK API changes | 7, 8, 9 | Pin `livekit-agents>=1.0,<2.0` in pyproject.toml. Depends on `livekit-plugins-google` for STT. Use context7 to verify current API before implementing. |
| graph.py complexity for cancellation | 2 | cancellation_event check is ~5 LOC inserted in 2 places. Keep minimal. |
| Config mapper provider expansion | 7 | Start with google (Cloud STT, Chirp 3) + elevenlabs only. Raise ValueError for others. Add providers as needed. |
| Integration test mocking depth | 10 | Mock at LiveKit SDK boundary (AgentSession, JobContext). Don't mock Grove internals. |
| Temporal workflow testing without server | 4 | Test structure/decorators/dataclasses only (unit tests). Integration tests with real Temporal deferred to E2E. |
