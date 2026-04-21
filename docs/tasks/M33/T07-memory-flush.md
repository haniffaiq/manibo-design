# T07: Memory flush (pre-compression save)

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T04, T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T07 - {short description}`

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

Implement the memory flush mechanism that fires before context compression. When the context window fills up and compression is about to discard messages, the agent gets one final turn with only the memory tool to save durable facts before context is lost. This is a critical piece of the autonomous runtime's long-term memory: without flush, context compression would silently discard potentially important information the agent discovered during the session.

The flush is a self-contained sub-interaction: inject a system prompt telling the LLM to save important facts, give it only the memory tool, let it make tool calls, execute those calls directly (bypassing normal tool dispatch), then strip all flush artifacts from the conversation history so the main conversation is unaware the flush happened.

## Subtasks

- [ ] **Create MemoryFlusher class**: Define `MemoryFlusher` in `packages/grove/src/grove/runtime/memory_flush.py` with constructor DI: `memory_store` (`MemoryStore` from `grove.core.memories`), `model` (`str` — the auxiliary LLM model name for flush calls). Add `from __future__ import annotations` at top.
- [ ] **Implement flush() method**: `async def flush(self, messages: list[dict[str, Any]], memory_tool_schema: dict[str, Any]) -> list[dict[str, Any]]` — returns the message list with flush artifacts stripped. Steps: (1) inject flush prompt message with sentinel, (2) call LLM with only memory tool, (3) execute any memory tool calls directly via memory_store, (4) strip all messages from sentinel onward, (5) return cleaned list.
- [ ] **Define flush prompt**: Use this exact system message content: `"[System: The session is being compressed. Save anything worth remembering — prioritize user preferences, corrections, and recurring patterns over task-specific details.]"` Injected as a message with role `"user"` so the LLM responds to it.
- [ ] **Implement sentinel marker**: Generate a unique sentinel string (`f"__grove_flush_{uuid4().hex}"`) and embed it in the flush message metadata (e.g., as a `_flush_sentinel` key in the message dict). Use this sentinel to find and strip flush artifacts — never use object identity or list index math.
- [ ] **Configure LLM call**: Use `litellm.acompletion()` with parameters: `model=self._model`, `messages=messages + [flush_message]`, `tools=[memory_tool_schema]`, `temperature=0.3`, `max_tokens=5120`. Only the memory tool schema is passed — no other tools available during flush.
- [ ] **Execute memory tool calls directly**: Parse tool calls from the LLM response. For each tool call invoking the memory tool, extract parameters and call `self._memory_store.save()` directly. Do not route through ToolRegistry or any normal tool dispatch path.
- [ ] **Strip flush artifacts**: After executing tool calls, find the sentinel in the message list and remove all messages from that point onward (the flush prompt, assistant response, and any tool call/result messages). Return the original messages list truncated at the sentinel position.
- [ ] **Handle LLM failure gracefully**: Wrap the entire flush operation in try/except. On any exception (LLM call failure, tool call failure, parsing error), log a warning with `grove.logger.create_logger()` and return the original messages list unchanged. Flush failure must never prevent compression from proceeding.
- [ ] **Emit runtime event**: After successful flush, if `on_chunk` callback is provided, emit `StreamChunk(type="autonomous.memory_flush", content=json.dumps({"entries_saved": count, "targets": ["memory", "user"]}))`. Accept `on_chunk` as optional parameter to `flush()`.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/runtime/test_memory_flush.py` with tests: (a) successful flush saves memory and strips artifacts, (b) LLM returns no tool calls — messages unchanged, (c) LLM call fails — messages unchanged with warning logged, (d) multiple tool calls all executed, (e) sentinel-based stripping is robust (doesn't strip too much or too little).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/memory_flush.py` | Create | MemoryFlusher class (~150 lines) |
| `packages/grove/tests/unit/runtime/test_memory_flush.py` | Create | Unit tests with mocked LLM and memory store |

## Implementation Notes

- **Reference:** `hermes-agent/run_agent.py` `flush_memories()` function (in external reference repo). Adapt the pattern but integrate with Grove's MemoryStore protocol and litellm.
- **Sentinel design:** The sentinel is a UUID-based string embedded in the flush message dict. Stripping works by scanning messages for the sentinel value. This is more robust than tracking list indices, which could shift if other code modifies the list concurrently.
- **After flush, no trace remains:** The message list returned by `flush()` must look identical to the input — as if flush never happened. The main conversation loop and compression pipeline should be unaware of the flush.
- **Only memory tool during flush:** This is intentional. The LLM should focus on saving facts, not executing arbitrary tools. Pass only the memory tool's JSON schema in the `tools` parameter.
- **litellm.acompletion():** Use `litellm.acompletion` (async), not `litellm.completion`. Import from `litellm`.
- **Integration point:** The `ContextCompressor` (T06) calls `MemoryFlusher.flush()` before starting compression. The compressor receives the cleaned message list back and proceeds with its 4-phase algorithm.
- **Pattern reference:** Read `packages/grove/src/grove/runtime/llm_calls.py` for the project's existing litellm usage patterns.
- **Logging:** Use `grove.logger.create_logger()` for the module logger, matching existing runtime module patterns.

## Acceptance Criteria

- [ ] `flush()` injects prompt, calls LLM, executes memory saves via MemoryStore
- [ ] Flush artifacts completely stripped from returned message history (sentinel-based)
- [ ] LLM failure does not prevent compression from proceeding (graceful degradation)
- [ ] Only memory tool schema available during flush call (no other tools)
- [ ] LLM call uses `temperature=0.3`, `max_tokens=5120`
- [ ] Direct memory_store.save() calls — no ToolRegistry dispatch
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests cover success path, no-tool-calls path, failure path, and multi-call path

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T04 (Memory tool — provides memory tool schema)
- Dependency: T06 (Context compressor — calls flush before compression)
- Pattern reference: `packages/grove/src/grove/runtime/llm_calls.py`
- Protocol: `packages/grove/src/grove/core/memories.py` (MemoryStore — from T01)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
