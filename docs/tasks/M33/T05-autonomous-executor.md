# T05: AutonomousExecutor while loop

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T05 - {short description}`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M33-grove-autonomous-runtime`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M33/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M33/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Implement the core `AutonomousExecutor` -- the while loop that runs autonomous agents. This is the heart of the autonomous runtime. It replaces LangGraph's state machine with a plain `while` loop driven by the LLM. The LLM is the control flow: it calls tools until it decides to respond, or the iteration budget runs out.

The executor loads hot memory and skill index at session start (frozen snapshot), builds the system prompt, then enters the main loop: call LLM, check for tool calls, execute tools, append results, repeat. No LangGraph, no state machine, no graph -- just a loop.

This task does NOT include compression (T06) or memory flush (T07). Those plug in via callable hooks that this executor accepts but does not implement. The executor calls `compression_hook` when configured and `should_compress()` returns True, but the actual compression logic lives elsewhere.

## Subtasks

- [ ] **Create AutonomousExecutor class**: Constructor accepts: `config: AgentConfig`, `tool_registry: ToolRegistry` (or equivalent tool lookup), `memory_store: MemoryStore | None = None`, `skill_store: SkillStore | None = None`. Store as instance attributes.
- [ ] **Implement `execute(input: ExecutorInput) -> ExecutorOutput`**: Main entry point. Loads frozen snapshots, builds system prompt, runs the while loop, returns result.
- [ ] **Load frozen memory snapshot**: At execution start, call `memory_store.load()` for both `MemoryTarget.MEMORY` and `MemoryTarget.USER`. Store as frozen strings. These do NOT update mid-execution.
- [ ] **Load skill index**: At execution start, call `skill_store.list_skills()`. Build index string: `"Available skills:\n- {name}: {description}\n- ..."`. Frozen for the session.
- [ ] **Build system prompt (`_build_system_prompt`)**: Pure function (testable in isolation). Assembles: `[mission]` + `\n\n` + `[tool behavior guidance]` + `\n\n` + `[frozen memory snapshot]` + `\n\n` + `[skill index]` + `\n\n` + `[timestamp: Current time: {ISO 8601}]`. Memory snapshot formatted as: `"\u2550\u2550\u2550 MEMORY (your notes) [{usage}] \u2550\u2550\u2550\n{entries}"`. Skill index omitted if no skills or skill_store is None. Timestamp refreshed each iteration is NOT needed -- frozen at start.
- [ ] **Main while loop**: `iteration = 0; while iteration < max_iterations:`. Each iteration: (1) call LLM via `litellm.acompletion()`, (2) parse response for `tool_calls`, (3) if tool_calls present: execute each via tool_registry, append tool results to messages, increment iteration, continue. (4) if no tool_calls: extract final response text, break.
- [ ] **LLM call**: Use `litellm.acompletion()` with: `model` from `config.model`, `messages` list (system + conversation history), `tools` list (from tool_registry, formatted as OpenAI function calling schema), `temperature` from config. Handle provider-specific model string formatting (litellm handles this).
- [ ] **Tool execution loop**: For each tool_call in response: extract `function.name` and `function.arguments`, look up tool in registry, call `tool.execute(params, context)`, append tool result message. If tool not found, append error result: `"Tool '{name}' not found"`.
- [ ] **Iteration budget warning**: At 85% of `max_iterations`, inject a system message: `"WARNING: {remaining} iterations remaining out of {max_iterations}. Wrap up or save progress."`. Inject once, track with a boolean flag.
- [ ] **Iteration budget exhaustion**: When `iteration >= max_iterations`, break the loop. Append a final assistant message: `"[Iteration budget exhausted after {max_iterations} iterations]"`.
- [ ] **Emit runtime events via on_chunk**: At the top of each iteration, emit `StreamChunk(type="autonomous.iteration", content=json.dumps({"iteration": n, "max": max_iterations, "tool_calls_this_iter": count}))`. At 85% budget, emit `autonomous.budget_warning`. At loop end, emit `autonomous.goal_complete` with `iterations_used` and `response_preview`. These flow through the existing pg_notify/SSE pipeline — no new infrastructure.
- [ ] **Track ExecutionMetrics**: Record `duration_ms` (wall clock), `tokens` (sum input/output from all LLM responses), `steps` (number of iterations), `estimated_cost` (None for now, placeholder).
- [ ] **Streaming variant `execute_with_streaming(input: ExecutorStreamInput) -> ExecutorOutput`**: Same logic as `execute()`, but use `litellm.acompletion(..., stream=True)` and emit chunks via `input.on_chunk(StreamChunk(...))`. Accumulate streamed response for tool call parsing.
- [ ] **Heartbeat hook**: Constructor accepts `heartbeat_fn: Callable[[], None] | None = None`. Called once per iteration at the top of the loop. Temporal integration (T16) will pass a heartbeat function to keep the activity alive.
- [ ] **Compression hook**: Constructor accepts `compression_fn: Callable[[list[dict[str, Any]]], list[dict[str, Any]]] | None = None`. After each iteration, if compression_fn is set and message list exceeds a rough token threshold, call `messages = await compression_fn(messages)`. The threshold check is a simple heuristic: `sum(len(str(m)) for m in messages) / 4 > threshold_tokens`. The actual threshold comes from `config.autonomous.compression.threshold_percent * model_context_window` (default 50% of 128K = 64K tokens).
- [ ] **Reuse existing types**: Use `ExecutorInput`, `ExecutorOutput`, `ExecutionMetrics`, `ToolCallRecord`, `StreamChunk` from `runtime/types.py`. Do NOT create parallel type definitions.
- [ ] **Unit tests with mocked LLM**: Test: simple completion (no tools), single tool call + response, multi-tool iteration, budget warning injection, budget exhaustion, empty tool registry, streaming.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/autonomous.py` | Create | AutonomousExecutor class (~250-350 lines) |
| `packages/grove/tests/unit/runtime/test_autonomous.py` | Create | Unit tests with mocked litellm responses |

## Implementation Notes

- **Read `runtime/executor.py` first.** Understand how the existing `AgentExecutor` works, what types it uses, and how it interfaces with tools. The autonomous executor is a sibling, not a replacement.
- **Read `runtime/types.py` fully.** All input/output types are already defined there. Reuse them exactly.
- **Do NOT import LangGraph.** The whole point is avoiding LangGraph for autonomous execution. If you find yourself importing `langgraph`, stop.
- **litellm.acompletion():** This is the unified LLM interface already used in the codebase. Check `runtime/llm_calls.py` for existing usage patterns. Use the same import and calling convention.
- **Tool registry interface:** Check how `AgentExecutor` gets tools. The tool registry likely provides a method to list tools as OpenAI-format function definitions and to look up a tool by name. Match that pattern.
- **System prompt is the FIRST message** with `role: "system"`. It contains the frozen snapshot. User messages from `input.messages` follow.
- **Message format:** OpenAI chat completion format: `{"role": "system"|"user"|"assistant"|"tool", "content": "..."}`. Tool calls use `{"role": "assistant", "tool_calls": [...]}` and `{"role": "tool", "tool_call_id": "...", "content": "..."}`.
- **Token counting heuristic:** `estimate_tokens_rough(messages) -> int` -- sum `len(str(m.get("content", ""))) / 4 + 10` for each message. The `+10` accounts for role/metadata overhead. This is a rough estimate, not tiktoken.
- **Pure function for system prompt assembly:** `_build_system_prompt(mission, memory_snapshot, skill_index, guidance) -> str`. This should be testable without any I/O.
- **Memory snapshot format:** Use Unicode box-drawing characters for visual separation: `"\u2550\u2550\u2550 MEMORY (your notes) [45% \u2014 990/2200 chars] \u2550\u2550\u2550"`. Only include if memory_store is configured and snapshot is non-empty.
- **Error handling in tool execution:** Catch all exceptions from tool.execute(), format as error string, continue loop. Never let a tool crash the executor.
- **Read `prompts/builder.py` first.** Current prompt assembly has NO memory or skills slot. The autonomous executor builds its own system prompt with these slots. Do NOT modify the existing prompt builder — the autonomous executor owns its own `_build_system_prompt()` method. The rail agent's prompt builder stays untouched.
- **Tool filtering is mandatory.** Do NOT pass the full ToolRegistry to the executor. Accept a pre-filtered registry (filtered by `AutonomousConfig.tools` allowlist in bootstrap). If no allowlist, use a default safe set. Side-effect tools like `send_message`, `complete_action`, `handoff_to_agent` should NOT be available unless explicitly listed.
- **Keep under 400 lines.** If approaching 400, extract helpers to private methods. Compression and flush are separate modules (T06, T07) -- do not implement them here.
- **Async throughout:** All methods are `async def`. Use `await` for litellm calls and tool execution.

## Acceptance Criteria

- [ ] `AutonomousExecutor` runs a simple tool-calling loop to completion with mocked LLM
- [ ] Iteration budget enforced: warning injected at 85%, execution stops at max
- [ ] System prompt includes frozen memory snapshot (when memory_store configured)
- [ ] System prompt includes skill index (when skill_store configured and skills exist)
- [ ] System prompt includes mission text
- [ ] `ExecutorOutput` contains response text, metrics, and tool call records
- [ ] Tool execution errors caught and returned as error results (no crash)
- [ ] Streaming variant emits `StreamChunk` objects via callback
- [ ] Heartbeat hook called once per iteration when provided
- [ ] Compression hook called when message list exceeds threshold (hook logic tested, actual compression deferred to T06)
- [ ] No LangGraph imports anywhere in the file
- [ ] Types reused from `runtime/types.py` (no parallel definitions)
- [ ] File stays under 400 lines
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass with mocked litellm

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Sibling executor: `packages/grove/src/grove/runtime/executor.py`
- Runtime types: `packages/grove/src/grove/runtime/types.py`
- LLM call patterns: `packages/grove/src/grove/runtime/llm_calls.py`
- Store protocols from T01: `packages/grove/src/grove/core/memories.py`, `packages/grove/src/grove/core/skills.py`
- Config from T02: `packages/grove/src/grove/config/schema.py` (AutonomousConfig)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
