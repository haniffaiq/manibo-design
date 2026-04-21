# T10: Code execution tool

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T09

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T10 - {short description}`

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

Implement the agent-facing code execution tool that wraps `PTCRuntime` (from T09). This is the tool the LLM calls when it wants to write and execute a Python script with access to Grove tools. It is a thin wrapper: receive a script string from the LLM, pass it to `PTCRuntime.execute_script()`, format the result for the LLM context.

The tool description is the most critical part of this task. It teaches the LLM how PTC works: write a Python script, import tools from `grove_tools`, use `print()` to return results to context. The description must be clear enough that the LLM uses PTC correctly on the first attempt.

**Platform mode:** This tool inherits the platform_mode restriction from PTCRuntime (T09). In platform mode, `execute()` delegates to PTCRuntime which returns an error. The tool itself doesn't check — PTCRuntime handles it. CLI mode always works.

## Subtasks

- [ ] **Create CodeExecutionTool**: Define in `packages/grove/src/grove/tools/system/code_execution_tool.py` subclassing `GroveBaseTool`. Set `name = "execute_code"`, `is_system = True`. Constructor takes `ptc_runtime: PTCRuntime` (DI). Add `from __future__ import annotations` at top.
- [ ] **Define JSON Schema**: `parameters` dict with: `script` (string, required, description: "Python script to execute. Use `from grove_tools import ...` to access tools."), `timeout` (integer, optional, default 300, description: "Maximum execution time in seconds, max 600").
- [ ] **Write tool description**: This is critical — it teaches the LLM how to use PTC. Include in the `description` class attribute:
  ```
  Write and execute a Python script with access to Grove tools.

  How it works:
  - Your script runs in a separate process with its own Python environment.
  - Use `from grove_tools import web_search, terminal, read_file, write_file, search_files, web_fetch` to call tools.
  - Tool results stay inside the script process — they do NOT enter your context window.
  - Only print() output returns to your context. Summarize results before printing.

  When to use:
  - Multi-step operations (search 5 URLs, compare results, print summary).
  - Data processing (parse files, transform data, generate reports).
  - Any task where intermediate tool results are large but the final answer is small.

  Example:
  ```python
  from grove_tools import web_search, web_fetch

  results = web_search(query="Python asyncio best practices 2026")
  for item in results[:3]:
      page = web_fetch(url=item["url"])
      print(f"- {item['title']}: {page[:200]}")
  ```

  Prefer this over terminal for multi-step workflows. Use terminal for simple one-liners.
  ```
- [ ] **Implement execute()**: `async def execute(self, params: dict[str, Any], context: ToolContext) -> Any`. Steps: (1) extract `script` and `timeout` from params, (2) clamp timeout to range [1, 600], (3) call `self._ptc_runtime.execute_script(script=script, context=context, timeout=timeout)`, (4) format `PTCResult` into a response dict.
- [ ] **Format result**: Return dict with keys: `status` (from PTCResult), `output` (stdout — the only content the LLM sees), `error` (stderr, if any), `tool_calls_made` (int), `duration_seconds` (float). If status is "error", include the error message prominently.
- [ ] **Platform check**: At the start of `execute()`, check `sys.platform == "win32"`. If true, return `{"status": "error", "output": "", "error": "Code execution (PTC) is not available on Windows.", "tool_calls_made": 0, "duration_seconds": 0.0}`.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/tools/system/test_code_execution_tool.py` with tests: (a) successful execution returns formatted result, (b) script error returns error status, (c) timeout clamped to [1, 600], (d) Windows platform returns error, (e) tool description contains key guidance phrases.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/code_execution_tool.py` | Create | CodeExecutionTool subclassing GroveBaseTool (~100 lines) |
| `packages/grove/tests/unit/tools/system/test_code_execution_tool.py` | Create | Unit tests with mocked PTCRuntime |

## Implementation Notes

- **This is intentionally thin.** All complexity lives in `PTCRuntime` (T09). This tool is a GroveBaseTool wrapper with a good description.
- **Tool description is load-bearing.** The LLM learns PTC usage from the description. If the description is unclear, the LLM will misuse PTC (e.g., forgetting to `print()`, trying to return values, importing non-existent modules). Test that key phrases are present.
- **PTCRuntime injected via constructor:** Follow the same DI pattern as `SendMessageTool` (takes `conversation_store` in constructor). Here, `CodeExecutionTool.__init__(self, ptc_runtime: PTCRuntime)`.
- **Pattern reference:** Read `packages/grove/src/grove/tools/system/send_message.py` for the GroveBaseTool subclassing pattern (constructor DI, class attributes, execute method).
- **Logging:** Use `grove.logger.create_logger()`. Log script execution start (DEBUG) with script length, and completion (DEBUG) with status and duration.
- **The available tools list in the description** should match `PTCRuntime.allowed_tools` default. If the defaults change in T09, this description must be updated. Keep them in sync.

## Acceptance Criteria

- [ ] LLM can call `execute_code` with a Python script string
- [ ] Script has access to tools via `from grove_tools import ...`
- [ ] Only `print()` output returns to LLM context (tool results stay in script process)
- [ ] Script failures return clean error messages with status "error"
- [ ] Timeout clamped to [1, 600] range
- [ ] Windows platform returns clean error (no crash)
- [ ] Tool description contains: import example, print() guidance, when-to-use guidance
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests cover success, error, timeout clamping, Windows check, and description content

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T09 (PTC via UDS RPC — provides PTCRuntime)
- Pattern reference: `packages/grove/src/grove/tools/base.py` (GroveBaseTool)
- Pattern reference: `packages/grove/src/grove/tools/system/send_message.py` (existing system tool with DI)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
