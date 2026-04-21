# T19: delegate_autonomous_task tool

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T19 - {short description}`

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

Implement the `delegate_autonomous_task` tool that allows rail agents to fire off autonomous tasks in the background. This tool is the bridge between rail and autonomous runtimes: a rail agent (e.g., during a voice call) calls this tool, gets a task_id back instantly, and continues its conversation. The autonomous agent runs asynchronously for 5-30 minutes in the background.

The tool starts an `AutonomousTaskWorkflow` via the Temporal client and returns immediately with a task_id (fire-and-forget). Results are delivered asynchronously via `send_message` to the specified channel. The tool validates agent config and delivery channel before starting the workflow, failing fast rather than after 30 minutes of autonomous work.

## Subtasks

- [ ] **Create DelegateAutonomousTaskTool class**: Subclass `GroveBaseTool` in `packages/grove/src/grove/tools/system/delegate_autonomous_tool.py`. Set `name = "delegate_autonomous_task"`, `is_system = True`.
- [ ] **Define JSON Schema parameters**: `goal` (string, required -- the task objective), `context` (string, required -- relevant background information), `agent_id` (string, required -- which autonomous agent config to use), `delivery_channel` (string, optional -- `"chat"`, `"voice"`, `"webhook"`; SMS and email out of scope for M33 v1), `delivery_target` (string, optional -- chat_id or webhook URL), `max_iterations` (int, optional -- default from agent config), `timeout_minutes` (int, optional -- default 30).
- [ ] **Implement constructor injection for Temporal client**: Accept `temporal_client: temporalio.client.Client` via constructor or resolve from `ToolContext.runtime_state["temporal_client"]`. Constructor DI preferred for testability.
- [ ] **Implement agent config resolution**: Look up autonomous agent config by `agent_id` from `GroveConfig`. Verify the resolved agent has an `autonomous` config section (not just a `flow_definition`). If not found or missing autonomous config, return error dict immediately.
- [ ] **Implement delivery channel validation**: If `delivery_channel` is specified, validate it is one of `DeliveryChannel` enum values (`"chat"`, `"voice"`, `"webhook"`). If `delivery_target` is specified without `delivery_channel`, return error. Validate upfront before starting the workflow.
- [ ] **Build AutonomousTaskInput**: Construct the input dataclass/model for `AutonomousTaskWorkflow` from the tool parameters. Include: goal, context, agent_id, delivery_channel, delivery_target, max_iterations, timeout_minutes, tenant_id (from tool context).
- [ ] **Start AutonomousTaskWorkflow via Temporal**: Generate workflow_id with format `grove.autonomous::{tenant_id}::{uuid4}`. Start the workflow on the `grove-agent` task queue using `temporal_client.start_workflow()`. Do NOT await the result -- fire-and-forget.
- [ ] **Return immediately**: Return `{"status": "started", "task_id": workflow_id}`. The rail agent continues without blocking.
- [ ] **Set tool description**: `"Delegate a complex research or analysis task to run in the background. Returns immediately -- the autonomous agent works asynchronously and delivers results via the specified channel."`
- [ ] **Error handling**: Return structured error dicts (not exceptions) for validation failures: agent not found, missing autonomous config, invalid delivery channel, Temporal client unavailable.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/tools/system/test_delegate_autonomous_tool.py`. Test: (a) successful delegation returns task_id, (b) unknown agent_id returns error, (c) agent without autonomous config returns error, (d) invalid delivery_channel returns error, (e) delivery_target without delivery_channel returns error, (f) Temporal start_workflow called with correct arguments.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/delegate_autonomous_tool.py` | Create | DelegateAutonomousTaskTool subclassing GroveBaseTool (~120 lines) |
| `packages/grove/tests/unit/tools/system/test_delegate_autonomous_tool.py` | Create | Unit tests with mocked Temporal client and config (~150 lines) |

## Implementation Notes

- **Read `packages/grove/src/grove/tools/base.py` and `packages/grove/src/grove/tools/system/send_message.py` first.** Match the GroveBaseTool subclassing pattern exactly: `name`, `description`, `is_system`, `parameters` property returning JSON schema dict, `execute()` method.
- **Read `packages/grove/src/grove/temporal/invoke_workflow.py` for Temporal client usage patterns.** Match how the existing codebase starts workflows.
- **Fire-and-forget:** Use `temporal_client.start_workflow()` (not `execute_workflow()`). The workflow runs independently. The tool does not track or poll it.
- **workflow_id format:** `grove.autonomous::{tenant_id}::{uuid4}` -- namespaced to avoid collision with conversation workflows. Use `uuid.uuid4()` for uniqueness.
- **Temporal client injection:** The Temporal client must be available at tool execution time. Preferred approach: pass via constructor (`DelegateAutonomousTaskTool(temporal_client=client, config=grove_config)`). Alternative: resolve from `ToolContext.runtime_state["temporal_client"]` if constructor DI is not feasible with the existing tool registration flow. Check how other system tools receive dependencies.
- **Agent config resolution:** The `GroveConfig` (or equivalent) stores agent definitions. Each agent has either `flow_definition` (rail) or `autonomous` (autonomous runtime). This tool only works for agents with `autonomous` config.
- **Validate delivery target reachability before starting:** Don't start a 30-minute autonomous task only to fail at delivery. For `delivery_channel="chat"`: validate the chat_id exists via ConversationStore. For `delivery_channel="webhook"`: validate URL format (https required). For `delivery_channel="voice"`: validate the call context is available. Return a clear error if validation fails — the calling agent can inform the user immediately.
- **Rate limiting / concurrent task cap:** Add a simple guard against spawning unlimited autonomous tasks. Check how many `grove.autonomous::` workflows are currently running for this tenant (via Temporal list_workflows or a counter). If above a configurable limit (default: 5 concurrent), return error. This prevents a rail agent from accidentally spawning 100 background tasks in a loop.
- **No imports from `temporal/` in the tool module itself.** The Temporal client type comes from `temporalio.client` (external dependency). The workflow input type comes from `core/` or `temporal/`. If importing from `temporal/`, verify this does not violate boundary rules -- system tools should import from `core/` and `tools/` only. The Temporal client itself is an external library type, not a grove.temporal type, so it is allowed.
- **Logging:** Use `grove.logger.create_logger()`. Log delegation start (INFO level with agent_id and goal summary), validation failures (WARNING).

## Acceptance Criteria

- [ ] Tool starts `AutonomousTaskWorkflow` via Temporal and returns immediately
- [ ] Returns `{"status": "started", "task_id": workflow_id}` without blocking
- [ ] Validates `agent_id` exists and has autonomous config before starting
- [ ] Validates delivery channel is one of `DeliveryChannel` enum values (`"chat"`, `"voice"`, `"webhook"`) or None
- [ ] Returns structured error for invalid inputs (not exceptions)
- [ ] workflow_id follows `grove.autonomous::{tenant_id}::{uuid}` format
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests pass with mocked Temporal client

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T16 (AutonomousTaskWorkflow + activities)
- Pattern reference: `packages/grove/src/grove/tools/base.py` (GroveBaseTool)
- Pattern reference: `packages/grove/src/grove/tools/system/send_message.py` (existing system tool)
- Pattern reference: `packages/grove/src/grove/temporal/invoke_workflow.py` (Temporal client usage)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
