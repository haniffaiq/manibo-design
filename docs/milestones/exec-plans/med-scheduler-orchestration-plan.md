# Med-Scheduler Plugin Orchestration Plan

> **Pattern:** Sequential Pipeline with Parallel Fork (Phase 0 -> 1 -> [2 | 3 | 4] -> 5 -> 6 -> 7)
> **Exception:** Phases 2, 3, and 4 can run in parallel (see file overlap notes in Team Patterns)
> **Estimated phases:** 8 (0-7)

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

**Feature name:** Med-Scheduler Plugin

**Goal:** Build a reference med-scheduler plugin at `src/grove/plugins/med_scheduler/` demonstrating the plugin pattern for domain-specific voice/chat agents, with 4-node flow graph support (intake -> discovery -> booking -> confirmation), per-node tool filtering, conditional edge routing, config-based plugin discovery, production LangGraph checkpointing, and resumability on Temporal retries -- while keeping Grove core domain-agnostic.

**Acceptance criteria:**
- Plugin at `src/grove/plugins/med_scheduler/` implements `GrovePlugin` protocol with 5 domain tools
- `build_flow_graph()` supports per-node tool filtering via `model.bind_tools(subset)` and conditional edges via `add_conditional_edges`
- `execute_with_streaming()` dispatches to flow graph when `flow_definition` is present (fixes current bug)
- Config-based plugin discovery via `AgentConfig.plugins` YAML field with built-in plugin registry
- Bootstrap validates plugins with `isinstance(plugin, GrovePlugin)` check
- `langgraph-checkpoint-postgres` provides production-grade graph state persistence in both dev and production
- Flow graph resumability on Temporal activity retries via checkpoint resume (completed nodes not re-run)
- Agent YAML at `examples/doctor_appointment/agent.yaml` updated with 4-node flow + per-node tools + conditional edges + `plugins:` section
- `scripts/validate_flow.py` updated with tool-call verification instead of keyword matching
- All existing tests pass (446+), new tests added, pyright strict 0 errors, ruff clean
- Compiled LangGraph StateGraph works with both HTTP/SSE path AND future LiveKit voice path (astream compatible)

**Scope boundaries (what is NOT included):**
- No real medical backend integration (tools return mock data)
- No LiveKit adapter implementation (only graph compatibility verified)
- No Temporal workflow changes (existing ConversationWorkflow unchanged)
- No modifications to Grove core types, protocols, or store interfaces
- No real-time availability or pricing APIs

---

## 2. Phase Plan

### Phase 0: Fix Streaming Flow Graph Dispatch (BLOCKER)

**Objective:** Fix the bug where `execute_with_streaming()` ignores `flow_definition` (always uses `build_react_graph_streaming`). Parameterize existing `build_flow_graph()` to support streaming. Initialize streaming initial state with `current_phase` and `flow_context` fields.

**Approach: Option B -- Parameterize existing `build_flow_graph()`**

Instead of creating a separate `build_flow_graph_streaming()` function (~130 LOC duplication), we add optional streaming parameters to the existing `build_flow_graph()`:
- Add `on_chunk: Callable | None = None` and `stream_chunk_types: list[str] | None = None` params to existing `build_flow_graph()` signature
- Inside `_make_flow_node` closure, if `on_chunk` is provided, use `litellm.acompletion(stream=True)` and emit chunks; otherwise use existing non-streaming `acompletion` call
- This is ~40-50 lines of changes to the existing function, NOT a new ~130 LOC function
- Zero code duplication -- one function handles both streaming and non-streaming
- Default `on_chunk=None` preserves exact existing non-streaming behavior

**Input:**
- Source files to read:
  - `src/grove/runtime/executor.py` (L215-282 -- execute_with_streaming, the bug is here: no flow_definition branch)
  - `src/grove/runtime/graph.py` (L343-476 -- build_flow_graph, L155-340 -- build_react_graph_streaming)
  - `src/grove/runtime/graph_state.py` (L1-33 -- GroveAgentState with NotRequired flow fields)
  - `src/grove/runtime/stream_adapter.py` (L1-46 -- stream_graph_execution)
- Dependencies from prior phases: none

**Deliverables:**
- `src/grove/runtime/graph.py` -- Add optional `on_chunk: Callable | None = None` and `stream_chunk_types: list[str] | None = None` params to existing `build_flow_graph()`. Inside `_make_flow_node`, if `on_chunk` is provided, use `litellm.acompletion(stream=True)` and emit chunks; otherwise keep existing non-streaming path. ~40-50 lines of changes to the existing function, zero code duplication.
- `src/grove/runtime/executor.py` -- Update `execute_with_streaming()` to branch on `self._config.flow_definition`: when present, call `build_flow_graph(..., on_chunk=on_chunk, stream_chunk_types=stream_chunk_types)` instead of always calling `build_react_graph_streaming()`. Add `current_phase` and `flow_context` to streaming initial state.

**Implementation details:**
- `build_flow_graph()` signature gains: `on_chunk: Callable | None = None` and `stream_chunk_types: list[str] | None = None`
- Inside `_make_flow_node`: if `on_chunk` is not None, uses `litellm.acompletion(stream=True)`, iterates chunks, emits `StreamChunk(type="text")`, accumulates tool call deltas, executes tools with `StreamChunk(type="tool_call")`/`StreamChunk(type="tool_result")` emission. If `on_chunk` is None, existing non-streaming `acompletion` path runs unchanged.
- `execute_with_streaming()` fix: add `if self._config.flow_definition:` branch before existing `build_react_graph_streaming` call, call `build_flow_graph(..., on_chunk=on_chunk, stream_chunk_types=stream_chunk_types)`
- Streaming initial state fix: add `"current_phase": None, "flow_context": {}` to the initial_state dict in execute_with_streaming (currently missing, see L251-260 vs L166-177)

**Tests:**
- `tests/unit/runtime/test_flow_graph_streaming.py` -- 6 tests: streaming flow graph builds with on_chunk param, text chunks emitted per node, tool call/result chunks emitted, multi-node streaming transitions, current_phase set during streaming, max_steps enforcement in streaming flow
- `tests/integration/runtime/test_flow_streaming_integration.py` -- 3 tests: streaming flow via executor dispatches correctly, streaming initial state includes flow fields, streaming flow produces ExecutorOutput

**Verification gate:**
```bash
uv run pytest tests/unit/runtime/test_flow_graph_streaming.py tests/integration/runtime/test_flow_streaming_integration.py --tb=short -q  # Expected: 9 passed
uv run pytest tests/unit/runtime/ tests/integration/runtime/ --tb=short -q  # Regression: all existing runtime tests pass
uv run pyright src/grove/runtime/graph.py src/grove/runtime/executor.py  # Expected: 0 errors
uv run ruff check src/grove/runtime/graph.py src/grove/runtime/executor.py  # Expected: 0 errors
```

**LOC estimate:** ~40-50 lines of changes to existing `build_flow_graph()` + ~20 lines in executor.py

**Context budget:** ~40K tokens (source: 25K for graph.py + executor.py + stream_adapter.py, deps: 5K for graph_state.py + types.py, overhead: 5K, test patterns: 5K from test_flow_graph.py)

**Depends on:** none

**Can run in parallel with:** none -- sequential (blocker for all subsequent phases)

---

### Phase 1: Enhance FlowNodeConfig for Per-Node Tools + Conditional Edges

**Objective:** Add optional `tools` field to `FlowNodeConfig` for per-node tool filtering. Add conditional edge support to `build_flow_graph()`. Each flow node binds only its declared tool subset to the LLM call.

**Input:**
- Source files to read:
  - `src/grove/config/schema.py` (L133-157 -- FlowNodeConfig, FlowEdge, FlowDefinition)
  - `src/grove/runtime/graph.py` (L343-476 -- build_flow_graph, now with streaming params from Phase 0)
  - `src/grove/runtime/executor.py` (L52-104 -- prepare_execution, _build_openai_tools)
  - `src/grove/tools/registry.py` (L20-79 -- ToolRegistry)
- Dependencies from prior phases: Phase 0 deliverables (parameterized `build_flow_graph()` with streaming support)

**Deliverables:**
- `src/grove/config/schema.py` -- Add `tools: list[str] | None = None` to `FlowNodeConfig`. Add `ConditionalEdge` model with `source: str`, `targets: dict[str, str]` (routing_value -> target_node, with "__end__" support). Add `conditional_edges: list[ConditionalEdge] | None = None` to `FlowDefinition`.
- `src/grove/runtime/graph.py` -- Update `build_flow_graph()`:
  - Per-node tool filtering: if `FlowNodeConfig.tools` is set, filter `openai_tools` to only include tools whose names are in the list. Pass filtered tools to `litellm.acompletion()`.
  - Conditional edges: for nodes with conditional edges, use `graph.add_conditional_edges(source, routing_fn, path_map)` instead of `graph.add_edge()`. Routing function reads `flow_context.get("route")` from state.
  - Flow nodes set `flow_context["route"]` based on tool call results or LLM decisions (via a `_route` key in tool results or a dedicated routing convention).
  - Handoff routing: if any node has a conditional edge to a "handoff" target, route there on error conditions.

**Implementation details:**
- `ConditionalEdge` model:
  ```python
  class ConditionalEdge(BaseModel):
      source: str
      condition_field: str = "route"  # key in flow_context to read
      targets: dict[str, str]  # value -> target node name ("__end__" for terminal)
  ```
- Per-node tool filtering in `_make_flow_node`:
  ```python
  node_tools = openai_tools  # default: all tools
  if node_cfg.tools is not None:
      tool_names = set(node_cfg.tools)
      node_tools = [t for t in (openai_tools or []) if t["function"]["name"] in tool_names]
  ```
- Conditional edge routing function factory:
  ```python
  def _make_routing_fn(condition_field: str, targets: dict[str, str]) -> Callable:
      def route(state: GroveAgentState) -> str:
          ctx = state.get("flow_context") or {}
          value = ctx.get(condition_field, "default")
          target = targets.get(str(value), targets.get("default", END))
          return END if target == "__end__" else target
      return route
  ```
- FlowDefinition validator: ensure conditional edge sources exist in nodes, targets exist in nodes or are "__end__"

**Tests:**
- `tests/unit/config/test_schema_flow.py` -- 6 tests: FlowNodeConfig with tools field, ConditionalEdge model, FlowDefinition with conditional_edges, validation of conditional edge sources/targets, tools field None by default, conditional_edges None by default
- `tests/unit/runtime/test_flow_per_node_tools.py` -- 5 tests: per-node tool filtering passes correct subset, None tools passes all tools, empty tools list passes no tools, tool not in registry ignored gracefully, tools applied in streaming variant too
- `tests/unit/runtime/test_flow_conditional_edges.py` -- 5 tests: conditional routing based on flow_context, default route when key missing, __end__ target maps to END, multiple conditional edges, handoff routing on error

**Verification gate:**
```bash
uv run pytest tests/unit/config/test_schema_flow.py tests/unit/runtime/test_flow_per_node_tools.py tests/unit/runtime/test_flow_conditional_edges.py --tb=short -q  # Expected: 16 passed
uv run pytest tests/unit/ --tb=short -q  # Regression: all existing unit tests pass
uv run pyright src/grove/config/schema.py src/grove/runtime/graph.py  # Expected: 0 errors
uv run ruff check src/grove/config/schema.py src/grove/runtime/graph.py  # Expected: 0 errors
```

**Context budget:** ~45K tokens (source: 20K for graph.py + schema.py, deps: 10K for Phase 0 output + registry.py + executor.py, test patterns: 10K from test_flow_graph.py, overhead: 5K)

**Depends on:** Phase 0

**Can run in parallel with:** none -- sequential

---

### Phase 2: Config-Based Plugin Discovery

**Objective:** Wire up the existing `AgentConfig.plugins: dict[str, PluginConfig]` field (schema.py:165) that is parsed from YAML but never consumed. Add a built-in plugin registry and bootstrap wiring.

**Finding:** `PluginConfig` already has `enabled: bool` and `config: dict[str, Any]` at schema.py:31-33. The schema is there -- nobody reads it to instantiate plugins.

**Input:**
- Source files to read:
  - `src/grove/config/schema.py` (L31-33 -- PluginConfig, L165 -- AgentConfig.plugins)
  - `src/grove/bootstrap.py` (L200-213 -- plugin registration loop, L55-63 -- GroveOptions.plugins)
  - `src/grove/core/plugin.py` (L68-95 -- GrovePlugin Protocol)
  - `src/grove/plugins/outlook/__init__.py` (L186-233 -- OutlookPlugin reference, L25-53 -- DisabledPlugin)
  - `src/grove/__main__.py` (L1-171 -- CLI entry point, _parse_args, _run)
- Dependencies from prior phases: Phase 0 (streaming fix must be in place first)

**Design:**
- Add a built-in plugin registry mapping names to factory module paths:
  ```python
  PLUGIN_REGISTRY = {
      "outlook": "grove.plugins.outlook.outlook_plugin",
      "med_scheduler": "grove.plugins.med_scheduler.create_plugin",
  }
  ```
- In bootstrap, after loading AgentConfig, iterate `agent_config.plugins`:
  1. Look up name in PLUGIN_REGISTRY -> get factory module path
  2. If not found, check for `module` key in plugin config -> importlib.import_module (external plugins)
  3. Call factory function with plugin config dict
  4. Skip if `enabled: false`
  5. Add isinstance(plugin, GrovePlugin) validation with clear error message
- Remove `plugins: list[Any] = []` from `__main__.py` -- plugins come from YAML config now

**Backward compatibility:** `GroveOptions.plugins: list[Any]` is KEPT for programmatic plugin injection (used by the platform layer and tests). Config-discovered plugins from YAML are MERGED with programmatic plugins. Priority: programmatic plugins load first, then YAML-discovered plugins. Duplicate plugin names raise ValueError.

**Deliverables:**
- `src/grove/bootstrap.py` -- Add plugin resolution from AgentConfig.plugins. Add isinstance(plugin, GrovePlugin) validation in the plugin registration loop. If validation fails, log error with plugin name and skip (don't crash). Add structured log message for each validated plugin.
- `src/grove/plugins/__init__.py` -- NEW: built-in plugin registry mapping names to factory module paths
- `src/grove/__main__.py` -- Remove empty plugins list (plugins come from config)

**Tests:**
- `tests/unit/plugins/test_plugin_registry.py` -- ~8 tests: plugin resolution by name, external module fallback, disabled skip, missing plugin error, isinstance validation, valid GrovePlugin passes, object missing protocol methods logged and skipped, DisabledPlugin pattern passes validation

**Verification gate:**
```bash
uv run pytest tests/unit/plugins/test_plugin_registry.py --tb=short -q  # Expected: ~8 passed
uv run pyright src/grove/bootstrap.py src/grove/plugins/__init__.py  # Expected: 0 errors
uv run ruff check src/grove/bootstrap.py src/grove/plugins/__init__.py  # Expected: 0 errors
```

**Context budget:** ~30K tokens

**Depends on:** Phase 0

**Can run in parallel with:** Phase 3, Phase 4 (see file overlap notes in Team Patterns section)

---

### Phase 3: Production LangGraph Checkpointer + State Resumability

**Objective:** Add `langgraph-checkpoint-postgres` for production-grade graph state persistence. Enable flow graph resumability on Temporal activity retries. Dev environment uses the SAME checkpointer as production.

**Background:**
- `langgraph-checkpoint-postgres` v3.0.4 uses psycopg3 (NOT asyncpg) -- separate connection pool required
- Checkpoints after every node (super-step) -- completed nodes are NOT re-run on retry
- On retry: pass `None` as input to `graph.ainvoke()` with same `thread_id` to resume from last checkpoint
- Retry detection: `activity.info().attempt > 1` in Temporal activity

**Input:**
- Source files to read:
  - `src/grove/runtime/graph.py` (build_*_graph functions -- compile() calls)
  - `src/grove/runtime/executor.py` (graph invocation)
  - `src/grove/runtime/stream_adapter.py` (graph.ainvoke / graph.astream calls)
  - `src/grove/temporal/activities.py` (process_message activity)
  - `src/grove/bootstrap.py` (application startup, pool creation)
  - `pyproject.toml` (dependencies)
- Dependencies from prior phases: Phase 0 (streaming fix must be in place first)

**Note on executor.py:** This file was previously modified by Phase 0 (streaming flow dispatch fix). Phase 3's changes (checkpointer param + thread_id) are in DIFFERENT methods/areas than Phase 0's changes (flow_definition branch in execute_with_streaming), so no conflict expected. However, developers should be aware of the prior modification and read the Phase 0 version of executor.py before making changes.

**Design:**
1. Add dependencies: `langgraph-checkpoint-postgres>=3.0`, `psycopg[binary]>=3.1`, `psycopg-pool>=3.1`
2. Create psycopg `AsyncConnectionPool` in bootstrap alongside existing asyncpg pool
3. Create `AsyncPostgresSaver` from psycopg pool, call `.setup()` at startup
4. Pass checkpointer to all `build_*_graph()` functions -> `graph.compile(checkpointer=saver)`
5. Pass `thread_id` config to `graph.ainvoke()` / `graph.astream()`: `config={"configurable": {"thread_id": conversation_id}}`
6. In `process_message` activity: detect retry via `activity.info().attempt > 1`, pass `None` input on retry

**Thread ID design:** `thread_id` uses `conversation_id` alone (NOT `conversation_id:message_id`). Rationale: using `conversation_id` alone allows the checkpointer to maintain state ACROSS messages in the same conversation, which is the desired behavior for a multi-turn flow graph. A flow graph should persist its phase state across conversation turns (user sends message 1 -> intake phase, user sends message 2 -> discovery phase, etc.). Using `message_id` would create a new checkpoint thread per message, defeating the purpose.

**Checkpoint tables:** LangGraph checkpoint tables (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations`) are created in the `public` schema by `.setup()`, NOT in the `grove` schema. These tables are managed by LangGraph, not Alembic. This is a conscious design decision -- the checkpointer is a LangGraph concern, not a Grove schema concern.

**Database connection note:** Both the existing asyncpg pool and the new psycopg pool use the same `database_url` from `GroveOptions`. The psycopg pool is created with: `AsyncConnectionPool(conninfo=options.database_url, max_size=5, kwargs={"autocommit": True, "row_factory": dict_row})`

**Checkpointer plumbing path:**
1. `bootstrap.py` creates `AsyncPostgresSaver` from psycopg pool, stores in `GroveActivityContext.extra["checkpointer"]`
2. `activities.py` `process_message` extracts checkpointer from `self._context.extra["checkpointer"]`
3. `activities.py` passes checkpointer to `AgentExecutor` constructor (new param)
4. `AgentExecutor.execute()` and `execute_with_streaming()` pass checkpointer to `build_flow_graph()` and `build_react_graph()`/`build_react_graph_streaming()`
5. Graph builders pass to `graph.compile(checkpointer=checkpointer)`
6. `stream_adapter.py` passes `config={"configurable": {"thread_id": conversation_id}}` to `graph.ainvoke()`

**Deliverables:**
- `pyproject.toml` -- Add langgraph-checkpoint-postgres, psycopg dependencies
- `src/grove/runtime/graph.py` -- All build_*_graph() accept optional `checkpointer` param, pass to `graph.compile(checkpointer=checkpointer)`
- `src/grove/runtime/executor.py` -- Accept checkpointer + thread_id, pass to graph builders
- `src/grove/runtime/stream_adapter.py` -- Pass config with thread_id to graph.ainvoke()
- `src/grove/temporal/activities.py` -- Detect retry via activity.info().attempt, pass None on retry
- `src/grove/bootstrap.py` -- Create psycopg pool + AsyncPostgresSaver, add to activity context

**File ownership:** Phase 3 owns the following files:
- `pyproject.toml` (new dependencies)
- `src/grove/runtime/graph.py` (compile() checkpointer param)
- `src/grove/runtime/executor.py` (checkpointer + thread_id param)
- `src/grove/runtime/stream_adapter.py` (thread_id config)
- `src/grove/temporal/activities.py` (retry detection)
- `src/grove/bootstrap.py` (psycopg pool + AsyncPostgresSaver creation)
- `tests/unit/runtime/test_checkpointer_integration.py`
- `tests/integration/test_resumability.py`

**Tests:**
- `tests/unit/runtime/test_checkpointer_integration.py` -- Graph compiles with checkpointer, thread_id passed correctly
- `tests/integration/test_resumability.py` -- Simulate crash + retry, verify completed nodes not re-run
- Expected: ~8 tests

**Verification gate:**
```bash
uv run pytest tests/unit/runtime/test_checkpointer_integration.py tests/integration/test_resumability.py --tb=short -q  # Expected: ~8 passed
uv run pyright src/grove/runtime/graph.py src/grove/runtime/executor.py src/grove/temporal/activities.py  # Expected: 0 errors
```

**Context budget:** ~50K tokens

**Depends on:** Phase 0 (streaming fix must be in place first)

**Can run in parallel with:** Phase 2 (plugin discovery), Phase 4 (med-scheduler plugin) -- see file overlap notes in Team Patterns section

**Risk mitigation:**
- C1 (SOLVED): Flow state survives Temporal retries via LangGraph checkpointer. Completed nodes skipped on resume.
- H3 (SOLVED): Production PostgreSQL checkpointer. Dev = production.
- Remaining gap: tool calls within a retried node MAY re-execute. Future mitigation (if needed): add idempotency keys on side-effecting tools. NOT blocking -- the crash window within a single node's ReAct loop is typically <30s.

---

### Phase 4: Med-Scheduler Plugin (Tools + Plugin Class)

**Objective:** Create the med-scheduler plugin at `src/grove/plugins/med_scheduler/` with 5 domain tools and a plugin class implementing `GrovePlugin` protocol. All tools return mock data.

**Input:**
- Source files to read:
  - `src/grove/core/plugin.py` (L68-95 -- GrovePlugin Protocol)
  - `src/grove/plugins/outlook/__init__.py` (L186-233 -- OutlookPlugin reference pattern, L25-53 -- DisabledPlugin)
  - `src/grove/tools/base.py` (L9-51 -- GroveBaseTool ABC)
  - `src/grove/tools/types.py` (L56-68 -- GroveTool Protocol)
  - `examples/doctor_appointment/mock_tools.py` (L1-99 -- existing mock tool pattern)
- Dependencies from prior phases: none (new files only)

**Deliverables:**
- `src/grove/plugins/med_scheduler/__init__.py` -- `MedSchedulerPlugin` class implementing GrovePlugin protocol. `DisabledPlugin` stub (reuse pattern from outlook). `create_plugins()` factory function returning `[MedSchedulerPlugin()]`. Plugin properties: name="med_scheduler", tools=list of 5 tools, instructions=med-scheduler specific prompt text, event_source=None, channel_adapter=None, channels=None.
- `src/grove/plugins/med_scheduler/tools.py` -- 5 tool classes extending `GroveBaseTool`:
  1. `GetPatientInfoTool` -- params: `query` (str). Returns mock patient record.
  2. `ListSpecialtiesTool` -- params: `location` (str, optional). Returns list of medical specialties.
  3. `CheckAvailabilityTool` -- params: `specialty` (str), `location` (str), `date_from` (str), `date_to` (str). Returns mock available slots.
  4. `CollectPatientDetailsTool` -- params: `patient_id` (str), `phone` (str), `email` (str). Returns confirmation.
  5. `BookAppointmentTool` -- params: `slot_id` (str), `patient_id` (str), `reason` (str, optional). Returns mock booking confirmation with status.

**Implementation details:**
- Each tool follows the `GroveTool` protocol exactly: `name` property, `description` property, `parameters` property (JSON Schema dict), `execute(params, context)` async method, `to_core_tool()` method.
- Tools extend `GroveBaseTool` (not just implement Protocol) to get `set_context`/`get_context`/`to_langchain_tool` for free.
- Mock data is deterministic (no random values) for test reproducibility.
- Plugin instructions text tells the agent how to use the tools in the appointment booking flow.
- `create_plugins()` is the module-level factory that the plugin registry expects.

**Tests:**
- `tests/unit/plugins/test_med_scheduler_tools.py` -- 10 tests: each tool has correct name/description/parameters schema, each tool executes with mock params and returns expected shape, to_core_tool returns correct dict
- `tests/unit/plugins/test_med_scheduler_plugin.py` -- 5 tests: plugin implements GrovePlugin protocol (isinstance check), name property, tools list has 5 items, instructions non-empty, create_plugins factory returns list

**Verification gate:**
```bash
uv run pytest tests/unit/plugins/test_med_scheduler_tools.py tests/unit/plugins/test_med_scheduler_plugin.py --tb=short -q  # Expected: 15 passed
uv run pyright src/grove/plugins/med_scheduler/  # Expected: 0 errors
uv run ruff check src/grove/plugins/med_scheduler/ tests/unit/plugins/  # Expected: 0 errors
```

**Context budget:** ~30K tokens (source: 10K for plugin.py + outlook reference + base.py + types.py, deps: 5K for mock_tools.py example, overhead: 5K, test patterns: 5K, instructions: 5K)

**Depends on:** none (new files only)

**Can run in parallel with:** Phase 2, Phase 3 (no file overlap)

---

### Phase 5: Agent YAML + Sub-Agents

**Objective:** Update `examples/doctor_appointment/agent.yaml` with 4-node flow definition using per-node tools, conditional edges, and `plugins:` section. Update triage sub-agent config. Remove old mock_tools.py (tools now come from plugin).

**Input:**
- Source files to read:
  - `examples/doctor_appointment/agent.yaml` (L1-29 -- current 2-node flow)
  - `examples/doctor_appointment/mock_tools.py` (L1-99 -- will be replaced by plugin)
  - `examples/doctor_appointment/sub_agents/triage.yaml` (L1-10 -- current triage sub-agent)
  - `src/grove/config/schema.py` (FlowNodeConfig with tools + ConditionalEdge from Phase 1)
  - `src/grove/plugins/med_scheduler/__init__.py` (from Phase 4 -- plugin tool names)
- Dependencies from prior phases: Phase 1 (schema changes), Phase 2 (plugin discovery), Phase 4 (tool names)

**Deliverables:**
- `examples/doctor_appointment/agent.yaml` -- Updated 4-node flow with `plugins:` section:
  - `intake` node: instructions for greeting + identity verification, tools: `[get_patient_info]`
  - `discovery` node: instructions for specialty/location/availability search, tools: `[list_specialties, check_availability]`
  - `booking` node: instructions for patient data collection + price confirmation, tools: `[collect_patient_details]`
  - `confirmation` node: instructions for final booking + confirmation, tools: `[book_appointment]`
  - Fixed edges: intake->discovery only (all other transitions use conditional edges)
  - Conditional edges: discovery->{continue: booking, handoff: __handoff__}, booking->{continue: confirmation, handoff: __handoff__}, confirmation->{complete: __end__, handoff: __handoff__}
  - Note: "handoff" targets are handled by the system `handoff_to_agent` tool, not a graph node. `__handoff__` is a sentinel that triggers the handoff tool.
- `examples/doctor_appointment/sub_agents/triage.yaml` -- Updated with clearer mission for urgent symptom triage
- `examples/doctor_appointment/mock_tools.py` -- KEEP but update to import from plugin (or keep as standalone for backward compat with examples that don't use plugins). The mock_tools.py serves as a standalone example; the plugin is the proper implementation.

**Implementation details:**
- YAML flow_definition structure with `plugins:` section:
  ```yaml
  plugins:
    med_scheduler:
      enabled: true
      config: {}

  flow_definition:
    entry_point: intake
    nodes:
      intake:
        instructions: >
          Greet the patient warmly. Verify their identity using get_patient_info.
          Ask what type of appointment they need. If symptoms suggest urgency,
          recommend escalation to the triage specialist.
        tools:
          - get_patient_info
      discovery:
        instructions: >
          Help the patient find the right specialist. Use list_specialties to show
          available specialties. Once they choose, use check_availability to find
          open slots. Present the best options clearly with dates and times.
        tools:
          - list_specialties
          - check_availability
      booking:
        instructions: >
          Collect the patient's contact details using collect_patient_details.
          Confirm the appointment details: doctor, date, time, specialty, location.
          Present the consultation fee and ask for confirmation.
        tools:
          - collect_patient_details
      confirmation:
        instructions: >
          Book the appointment using book_appointment. Provide the confirmation
          number and all appointment details. Remind the patient of any
          preparation instructions.
        tools:
          - book_appointment
    edges:
      - source: intake
        target: discovery
      # discovery, booking, confirmation use conditional_edges below — no fixed edges for these
    conditional_edges:
      - source: discovery
        condition_field: route
        targets:
          continue: booking
          handoff: __handoff__
      - source: booking
        condition_field: route
        targets:
          continue: confirmation
          handoff: __handoff__
      - source: confirmation
        condition_field: route
        targets:
          complete: __end__
          handoff: __handoff__
  ```

**Tests:**
- `tests/unit/examples/test_agent_configs.py` -- Update existing tests to handle 4-node flow definition, per-node tools, conditional edges, plugins section. Expected: ~6 tests (existing 4 updated + 2 new for per-node tools and conditional edges)

**Verification gate:**
```bash
uv run pytest tests/unit/examples/ --tb=short -q  # Expected: all existing + new tests pass
uv run pytest tests/unit/config/ --tb=short -q  # Regression: config tests still pass
uv run pyright  # Full project: 0 errors
uv run ruff check examples/ tests/unit/examples/  # Expected: 0 errors
```

**Context budget:** ~25K tokens (source: 8K for existing YAML + mock_tools, deps: 8K for Phase 1 schema + Phase 4 plugin, overhead: 5K, test patterns: 4K)

**Depends on:** Phase 1 (schema), Phase 2 (plugin discovery), Phase 4 (tool names)

**Can run in parallel with:** none -- sequential

---

### Phase 6: Update validate_flow.py

**Objective:** Replace brittle keyword matching in `scripts/validate_flow.py` with tool-call verification. Check that expected tools were called in each phase. Reduce from 10 steps to 4 (matching 4-node flow). Add structured output validation.

**Input:**
- Source files to read:
  - `scripts/validate_flow.py` (L1-469 -- current keyword-based validation)
  - `examples/doctor_appointment/agent.yaml` (from Phase 5 -- 4-node flow with tool assignments)
  - `src/grove/plugins/med_scheduler/tools.py` (from Phase 4 -- tool names)
- Dependencies from prior phases: Phase 4 (tool names), Phase 5 (YAML config)

**Deliverables:**
- `scripts/validate_flow.py` -- Rewritten FLOW_STEPS to match 4-node flow. Each step includes `expect_tools` list instead of/in addition to `expect_keywords`. SSE parser updated to capture tool_call/tool_result chunks. Validation checks that expected tool names appear in the tool_call chunks for each step. Keep backward-compatible keyword matching as secondary validation. Keep interactive mode, CLI args, colored output.

**Implementation details:**
- Updated FLOW_STEPS (4 phases instead of 10):
  ```python
  FLOW_STEPS = [
      {
          "state_name": "Intake",
          "message": "I need to book a doctor appointment. My name is Jonas Petraitis, born March 15, 1985.",
          "expect_tools": ["get_patient_info"],
          "expect_keywords": ["appointment", "help"],
      },
      {
          "state_name": "Discovery",
          "message": "I've been having knee pain. I'd like to see an orthopedist in Vilnius.",
          "expect_tools": ["list_specialties", "check_availability"],
          "expect_keywords": ["specialist", "available", "slot"],
      },
      {
          "state_name": "Booking",
          "message": "The earliest slot works. My phone is +370 612 34567, email jonas@example.com",
          "expect_tools": ["collect_patient_details"],
          "expect_keywords": ["confirm", "details"],
      },
      {
          "state_name": "Confirmation",
          "message": "Yes, please confirm the booking.",
          "expect_tools": ["book_appointment"],
          "expect_keywords": ["confirmed", "booking", "appointment"],
      },
  ]
  ```
- SSE parser captures tool_call events:
  ```python
  if chunk_type == "tool_call":
      tool_name = parsed.get("tool_name", "")
      if tool_name:
          collected_tool_calls.append(tool_name)
  ```
- Validation logic: check `expect_tools` against `collected_tool_calls` (subset match)

**Tests:**
- Manual E2E testing only (this is a script, not library code). Document test procedure in script docstring.

**Verification gate:**
```bash
uv run ruff check scripts/validate_flow.py  # Expected: 0 errors
uv run ruff format --check scripts/validate_flow.py  # Expected: 0 errors
uv run pyright scripts/validate_flow.py  # Expected: 0 errors (or document known issues)
```

**Context budget:** ~20K tokens (source: 10K for validate_flow.py, deps: 5K for Phase 4/5 output, overhead: 5K)

**Depends on:** Phase 4 (tool names), Phase 5 (YAML config)

**Can run in parallel with:** none -- sequential

---

### Phase 7: Integration Tests + E2E Verification

**Objective:** Add integration tests verifying the full pipeline: plugin -> registry -> executor -> flow graph with per-node tools and conditional edges. Add E2E test running validate_flow.py pattern programmatically. Add resumability tests. Verify all review risks mitigated.

**Input:**
- Source files to read:
  - `tests/e2e/conftest.py` (existing E2E fixtures)
  - `tests/e2e/test_e2e_flow_graph.py` (existing flow graph E2E test pattern)
  - `tests/integration/runtime/test_flow_integration.py` (existing flow integration tests)
  - `src/grove/plugins/med_scheduler/__init__.py` (from Phase 4)
  - `src/grove/plugins/med_scheduler/tools.py` (from Phase 4)
  - All Phase 0-6 deliverables
- Dependencies from prior phases: All prior phases (0-6)

**Deliverables:**
- `tests/integration/plugins/test_med_scheduler_integration.py` -- 6 tests: plugin loads and registers tools in ToolRegistry, per-node tool filtering works end-to-end with executor, 4-node flow executes all phases in order, conditional edge routing triggers on error flow_context, streaming flow produces correct chunk types, mock tools return expected shapes through full pipeline
- `tests/integration/runtime/test_flow_conditional_integration.py` -- 4 tests: conditional edge routes to correct target based on flow_context, default route works when condition missing, __end__ target terminates graph, handoff-style routing works with error condition
- `tests/integration/test_resumability.py` -- 4 tests: checkpoint saves after each node, retry with None input resumes from last checkpoint, completed nodes not re-run on retry, thread_id correctly scoped to conversation_id
- `tests/e2e/test_e2e_med_scheduler.py` -- 3 tests: full 4-node flow via executor with med-scheduler plugin tools, streaming 4-node flow produces text + tool_call + tool_result chunks, plugin loaded via config-based discovery integrates with bootstrap pattern

**Implementation details:**
- Integration tests mock `litellm.acompletion` (same pattern as `test_flow_graph.py`)
- Plugin tools registered via `ToolRegistry.register()` in test fixtures
- Flow definition loaded from actual `examples/doctor_appointment/agent.yaml`
- Conditional edge tests set `flow_context["route"]` in mock tool results
- E2E tests use real `AgentExecutor` with mock LLM
- Resumability tests use `langgraph-checkpoint-postgres` with test database

**Review risk mitigation verification:**
- C1 (SOLVED): Resumability test verifies completed nodes not re-run on retry via checkpointer
- H2 (fixed edges can't handle errors): Integration test verifies conditional_edges routing
- H3 (SOLVED): Resumability test uses same AsyncPostgresSaver as production
- H4 (no per-node tool filtering): Integration test verifies only declared tools passed to LLM
- M1 (missing plugin export convention): Integration test verifies config-based plugin discovery works
- M3 (no runtime plugin validation): Integration test verifies isinstance check
- M4 (brittle keyword validation): validate_flow.py uses tool-call verification
- M5 (no tests for new tools/plugin): Unit + integration tests added
- M6 (unnecessary tools): Only 5 tools, each assigned to specific nodes

**Tests:**
- (Listed in deliverables above: 17 tests total)

**Verification gate:**
```bash
uv run pytest tests/integration/plugins/test_med_scheduler_integration.py tests/integration/runtime/test_flow_conditional_integration.py tests/integration/test_resumability.py tests/e2e/test_e2e_med_scheduler.py --tb=short -q  # Expected: 17 passed
uv run pytest --tb=short -q  # FULL REGRESSION: all 446+ existing tests + all new tests pass
uv run pyright  # Full project: 0 errors
uv run ruff check src/ tests/  # Expected: 0 errors
uv run ruff format --check src/ tests/  # Expected: 0 errors
```

**Context budget:** ~50K tokens (source: 15K for existing test patterns, deps: 20K for all prior phase outputs, overhead: 5K, test patterns: 10K)

**Depends on:** All prior phases (0-6)

**Can run in parallel with:** none -- final integration phase

---

## 3. Execution Protocol

For EACH phase, the supervisor MUST follow this sequence:

### Step 1: Gather Reference Material

Collect the spec sections, source files, and prior-phase outputs that the developer agent needs.
Use exact line ranges from specs to stay within context budget.

### Step 2: Construct Agent Prompt

Build the developer agent prompt containing:

1. **Spec extract** -- the "what to build" reference (paste relevant sections from this plan)
2. **Source file list** -- files the developer must read for reference
3. **Existing dependencies** -- Python modules already written to import from
4. **Deliverables** -- exact files to create or modify
5. **Tests** -- exact test files to create, with expected count
6. **Verification commands** -- exact pytest/pyright commands to run
7. **Boot instructions** -- "Read PROGRESS.md first. Run `uv run pytest --tb=short -q` before investigating failures."

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

| Content Type | Typical Size | Budget Guideline |
|-------------|-------------|-----------------|
| Spec section (per phase) | 5-40K tokens | Extract only relevant lines |
| Source files (per phase) | 10-30K tokens | List only files the phase touches |
| Prior-phase deps | 5-15K tokens | Only imports needed |
| Tests to port | 5-20K tokens | Only tests for this phase |
| Instructions overhead | 3-5K tokens | Keep prompt concise |
| **Total per agent** | **~50-80K tokens** | **Stay under 100K** |

**Rules:**
- Never feed the full spec to a developer agent. Extract the relevant section.
- If a phase touches 10+ source files, consider splitting into sub-phases.
- Compressed handoffs between phases: pass summaries of what was built, not full file contents.
- Developer agents should read files themselves rather than receiving file contents in the prompt.

**Phase budget estimates:**
| Phase | Source | Deps | Tests | Overhead | Total |
|-------|--------|------|-------|----------|-------|
| 0 | 25K | 5K | 5K | 5K | ~40K |
| 1 | 20K | 10K | 10K | 5K | ~45K |
| 2 | 12K | 5K | 5K | 8K | ~30K |
| 3 | 20K | 10K | 10K | 10K | ~50K |
| 4 | 10K | 5K | 5K | 5K | ~30K |
| 5 | 8K | 8K | 4K | 5K | ~25K |
| 6 | 10K | 5K | 0K | 5K | ~20K |
| 7 | 15K | 20K | 10K | 5K | ~50K |

---

## 5. Team Patterns

### Execution Pattern: Sequential Pipeline with Three-Way Parallel Fork

```
Phase 0 (streaming fix) -> Phase 1 (schema + edges) -> [Phase 2 | Phase 3 | Phase 4] (parallel) -> Phase 5 (YAML) -> Phase 6 (validate) -> Phase 7 (integration)
```

```
Phase 0 (BLOCKER) -> Phase 1 -> +-- Phase 2 (config plugin discovery) --+-> Phase 5 -> Phase 6 -> Phase 7
                                |-- Phase 3 (checkpointer + resume)     |
                                +-- Phase 4 (plugin + tools)           -+
```

**File ownership boundaries for parallel phases:**

Phase 2 owns:
- `src/grove/bootstrap.py` (plugin resolution additions)
- `src/grove/plugins/__init__.py` (NEW: built-in plugin registry)
- `src/grove/__main__.py` (remove empty plugins list)
- `tests/unit/plugins/test_plugin_registry.py`

Phase 3 owns:
- `pyproject.toml` (new dependencies)
- `src/grove/runtime/graph.py` (compile() checkpointer param)
- `src/grove/runtime/executor.py` (checkpointer + thread_id param)
- `src/grove/runtime/stream_adapter.py` (thread_id config)
- `src/grove/temporal/activities.py` (retry detection)
- `src/grove/bootstrap.py` (psycopg pool + AsyncPostgresSaver creation)
- `tests/unit/runtime/test_checkpointer_integration.py`
- `tests/integration/test_resumability.py`

Phase 4 owns:
- `src/grove/plugins/med_scheduler/__init__.py`
- `src/grove/plugins/med_scheduler/tools.py`
- `tests/unit/plugins/test_med_scheduler_tools.py`
- `tests/unit/plugins/test_med_scheduler_plugin.py`

**File overlap note:** Phase 2 and Phase 3 both modify `bootstrap.py`. Phase 2 adds plugin resolution logic. Phase 3 adds psycopg pool + checkpointer creation. These changes touch DIFFERENT sections of bootstrap.py (Phase 2: plugin loading block ~L200-213, Phase 3: pool creation block ~L180-190). Coordinate merge: whichever phase completes second must rebase on the other's changes. Alternatively, run Phase 3 AFTER Phase 2 if merge coordination is too risky.

**Note on executor.py:** Phase 0 modifies `executor.py` (streaming flow dispatch fix). Phase 3 also modifies `executor.py` (checkpointer + thread_id). These changes are in DIFFERENT methods/areas and should not conflict, but the Phase 3 developer must read the Phase 0 version before making changes.

---

## 6. Verification Gates

Every phase MUST have a verification gate. No exceptions.

### Standard Gate Template

```bash
# 1. Tests pass
uv run pytest tests/[path] --tb=short -q

# 2. Type checking clean
uv run pyright src/[path]

# 3. Lint clean
uv run ruff check src/[path] tests/[path]

# 4. Format clean
uv run ruff format --check src/[path] tests/[path]
```

### Gate Escalation Protocol

If a gate fails:
1. **First attempt:** Re-delegate to the same developer agent with failure output
2. **Second attempt:** Provide additional context (related source files, error analysis)
3. **Third attempt:** Investigate whether the phase design is flawed. Consider splitting the phase.
4. **After 3 failures:** Stop. Reassess the phase scope and dependencies.

### Integration Gate (after Phase 7)

After all phases complete, run full verification:
```bash
uv run pytest --tb=short -q              # ALL tests
uv run pyright                           # Full project type check
uv run ruff check src/ tests/            # Full lint
uv run ruff format --check src/ tests/   # Full format check
```

---

## 7. Files Modified Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `src/grove/plugins/__init__.py` | 2 | Built-in plugin registry mapping |
| `src/grove/plugins/med_scheduler/__init__.py` | 4 | Plugin class + create_plugins factory |
| `src/grove/plugins/med_scheduler/tools.py` | 4 | 5 domain tools |
| `tests/unit/plugins/test_plugin_registry.py` | 2 | Plugin discovery tests |
| `tests/unit/plugins/test_med_scheduler_tools.py` | 4 | Tool unit tests |
| `tests/unit/plugins/test_med_scheduler_plugin.py` | 4 | Plugin unit tests |
| `tests/unit/config/test_schema_flow.py` | 1 | Schema extension tests |
| `tests/unit/runtime/test_flow_per_node_tools.py` | 1 | Per-node tool tests |
| `tests/unit/runtime/test_flow_conditional_edges.py` | 1 | Conditional edge tests |
| `tests/unit/runtime/test_flow_graph_streaming.py` | 0 | Streaming flow graph tests |
| `tests/unit/runtime/test_checkpointer_integration.py` | 3 | Checkpointer compile + thread_id tests |
| `tests/integration/runtime/test_flow_streaming_integration.py` | 0 | Streaming flow integration |
| `tests/integration/runtime/test_flow_conditional_integration.py` | 7 | Conditional edge integration |
| `tests/integration/plugins/test_med_scheduler_integration.py` | 7 | Plugin integration tests |
| `tests/integration/test_resumability.py` | 3, 7 | Checkpoint resumability tests |
| `tests/e2e/test_e2e_med_scheduler.py` | 7 | E2E med-scheduler tests |

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `pyproject.toml` | 3 | Add langgraph-checkpoint-postgres, psycopg, psycopg-pool dependencies |
| `src/grove/runtime/graph.py` | 0, 1, 3 | Add streaming params (`on_chunk`, `stream_chunk_types`) to `build_flow_graph()`, per-node tool filtering, conditional edges, checkpointer param in compile() |
| `src/grove/runtime/executor.py` | 0, 3 | Fix streaming flow dispatch, add flow fields to streaming initial state, add checkpointer + thread_id |
| `src/grove/runtime/stream_adapter.py` | 3 | Pass config with thread_id to graph.ainvoke() |
| `src/grove/temporal/activities.py` | 3 | Detect retry via activity.info().attempt, pass None input on retry |
| `src/grove/config/schema.py` | 1 | Add `tools` to FlowNodeConfig, add ConditionalEdge, add conditional_edges to FlowDefinition |
| `src/grove/bootstrap.py` | 2, 3 | Config-based plugin resolution, isinstance validation, psycopg pool + AsyncPostgresSaver creation |
| `src/grove/plugins/__init__.py` | 2 | NEW: built-in plugin registry |
| `src/grove/__main__.py` | 2 | Remove empty plugins list (plugins come from YAML config) |
| `examples/doctor_appointment/agent.yaml` | 5 | Update to 4-node flow with per-node tools + conditional edges + plugins section |
| `examples/doctor_appointment/sub_agents/triage.yaml` | 5 | Updated mission text |
| `scripts/validate_flow.py` | 6 | Tool-call verification, 4 steps |
| `tests/unit/examples/test_agent_configs.py` | 5 | Updated for 4-node flow + plugins section |

---

## 8. Cross-Reference

| Need | Where to Look |
|------|---------------|
| Project setup and standards | `CLAUDE.md` (project root) |
| Architecture decisions | `wiki/queries/research-langgraph-vs-temporal.md` |
| Component specifications | `wiki/queries/research-langgraph-integration-strategy.md` |
| LangGraph patterns | `wiki/queries/research-langgraph-integration-strategy.md` |
| Current project state | `PROGRESS.md` |
| This plan | `docs/milestones/exec-plans/med-scheduler-orchestration-plan.md` |
| Exec plan template | `exec-plans template (archived)` |

---

## 9. Review Risk Mitigation Matrix

| Risk ID | Risk | Mitigation | Phase |
|---------|------|------------|-------|
| C1 | Flow state not resumable on Temporal restart | SOLVED. langgraph-checkpoint-postgres provides node-level resume on Temporal retry. Completed flow nodes are NOT re-run. Retry detection via activity.info().attempt > 1 passes None input to trigger resume. thread_id uses conversation_id (not message_id) to maintain state across turns. Remaining narrow gap: tool calls within a retried node may re-execute (~<30s window). Future hardening: idempotency keys on side-effecting tools if monitoring shows duplicates. | 3 |
| H1 | 10 nodes = 5x latency | Solved: 4 nodes | 5 |
| H2 | Fixed edges can't handle errors | `add_conditional_edges` with routing functions | 1 |
| H3 | No LangGraph checkpointer | SOLVED. langgraph-checkpoint-postgres (AsyncPostgresSaver) used in both dev and production. Separate psycopg3 connection pool alongside existing asyncpg pool. Tables managed by LangGraph's .setup() in public schema (not grove schema, not Alembic-managed). Dev = production configuration. | 3 |
| H4 | No per-node tool filtering | `model.bind_tools(subset)` per node via FlowNodeConfig.tools | 1 |
| M1 | Missing plugin module export convention | Config-based plugin discovery via AgentConfig.plugins YAML field + built-in plugin registry | 2 |
| M2 | Plugin loading confusion | Clear error messages on missing plugin name, missing module, failed import | 2 |
| M3 | No runtime plugin validation | `isinstance(plugin, GrovePlugin)` check in bootstrap | 2 |
| M4 | Brittle keyword validation | Tool-call verification in validate_flow.py | 6 |
| M5 | No tests for new tools/plugin | Unit + integration + E2E tests | 4, 7 |
| M6 | Unnecessary tools | 5 tools only, assigned per-node | 4, 5 |
