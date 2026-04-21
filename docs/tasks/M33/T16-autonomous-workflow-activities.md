# T16: AutonomousTaskWorkflow + activities

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T05, T03, T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T16 - {short description}`

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

Implement the Temporal workflow and activities for autonomous task execution. `AutonomousTaskWorkflow` orchestrates three steps: (1) `execute_autonomous_task` — run the while loop, (2) `review_memories_and_skills` — durable post-execution review (T15), (3) `deliver_result` — optional result delivery via `ResultDeliverer` (T20). The workflow registers on the same `grove-agent` task queue as existing workflows.

This is the Temporal integration point for autonomous execution. Unlike `ConversationWorkflow` (which uses signals for interactive chat), `AutonomousTaskWorkflow` is fire-and-forget: it receives a goal, executes it, reviews for learnings, and optionally delivers the result.

## Subtasks

- [ ] **Define `AutonomousTaskInput` Pydantic model**: Fields: `tenant_id: str`, `agent_id: str` (which autonomous agent config to use), `goal: str` (the task description), `context: str | None = None` (additional context), `model: str | None = None` (model override), `tools: list[str] | None = None` (tool whitelist override), `max_iterations: int = 50`, `delivery_channel: DeliveryChannel | None = None`, `delivery_target: str | None = None` (e.g., chat_id, webhook URL), `timeout_minutes: int = 30`.
- [ ] **Define `DeliveryChannel` StrEnum**: Values: `"chat"`, `"voice"`, `"webhook"`. SMS and email are out of scope for M33 v1. The delivery system is pluggable — new channels are added by implementing a `ResultDeliverer` protocol (see T20) without changing workflow or tool contracts.
- [ ] **Define `AutonomousTaskOutput` Pydantic model**: Fields: `task_id: str`, `status: AutonomousTaskStatus`, `response: str`, `tool_calls_count: int`, `duration_ms: int`, `error: str | None = None`.
- [ ] **Define `AutonomousTaskStatus` StrEnum**: Values: `"completed"`, `"failed"`, `"timeout"`.
- [ ] **Create `AutonomousTaskWorkflow`** (`@workflow.defn`):
  1. Receive `AutonomousTaskInput` as workflow argument
  2. Execute `execute_autonomous_task` activity with heartbeat timeout and overall timeout from input
  3. Execute `review_memories_and_skills` activity (T15) — durable post-execution review. Runs even if delivery is not configured. Failure does not fail the workflow (catch and log).
  4. If `delivery_channel` and `delivery_target` are set: execute `deliver_result` activity
  5. Return `AutonomousTaskOutput`
  6. Handle `asyncio.CancelledError` and `temporalio.exceptions.ActivityError` for clean failure reporting
- [ ] **Create `AutonomousActivities` class**: Constructor receives `GroveActivityContext` (same DI pattern as `GroveActivities`).
- [ ] **Implement `execute_autonomous_task` activity**: Set tenant context via `set_config('app.tenant_id', ...)`. Load agent config from `GroveActivityContext`. Create `AutonomousExecutor` (from T05). Call `executor.execute(goal, context)`. Heartbeat every 30 seconds during execution. Return `AutonomousTaskOutput`.
- [ ] **Implement `deliver_result` activity**: Send the task result to the delivery target. Dispatch to the `ResultDeliverer` registered for the channel (see T20). Chat: `ConversationStore.add_message()` + pg_notify. Voice: create a message in the originating call's chat. Webhook: POST to URL. Unknown channel: raise non-retryable error (fail-closed, not silent skip).
- [ ] **Define `DeliverResultInput` Pydantic model**: Fields: `tenant_id: str`, `delivery_channel: str`, `delivery_target: str`, `result: str`, `task_id: str`.
- [ ] **Add workflow/activity name constants to `temporal/names.py`**: `AUTONOMOUS_TASK_WORKFLOW = "grove.AutonomousTaskWorkflow"`, `EXECUTE_AUTONOMOUS_TASK = "grove.execute_autonomous_task"`, `DELIVER_RESULT = "grove.deliver_result"`, `AUTONOMOUS_TASK_WORKFLOW_ID_PREFIX = "grove.autonomous::"`.
- [ ] **Add `autonomous_task_workflow_id` helper function to `temporal/names.py`**: `def autonomous_task_workflow_id(tenant_id: str, task_id: str) -> str` that returns `f"{AUTONOMOUS_TASK_WORKFLOW_ID_PREFIX}{tenant_id}::{task_id}"`.
- [ ] **Retry policy**: Match existing `ConversationWorkflow` retry policy: max 3 attempts, 5s initial interval, 120s max interval, 3x backoff coefficient.
- [ ] **Activity timeout**: `start_to_close_timeout` derived from `input.timeout_minutes`. `heartbeat_timeout` set to 60 seconds (allows 2 missed heartbeats at 30s interval before Temporal considers the activity stuck).
- [ ] **Unit tests**: Test workflow execution with mocked activities, test activity with mocked executor, test delivery activity, test timeout handling.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/temporal/autonomous_workflow.py` | Create | AutonomousTaskWorkflow (~100 lines) |
| `packages/grove/src/grove/temporal/autonomous_activities.py` | Create | AutonomousActivities (~150 lines) |
| `packages/grove/src/grove/temporal/names.py` | Modify | Add autonomous workflow/activity name constants and helper |
| `packages/grove/tests/unit/temporal/test_autonomous_workflow.py` | Create | Unit tests for workflow and activities |

## Implementation Notes

- **Read `temporal/conversation_workflow.py` first.** It is the primary workflow pattern to follow. Note how it uses `workflow.defn`, `workflow.run`, and `workflow.execute_activity`.
- **Read `temporal/activities.py` first.** It shows the `GroveActivities` class pattern with DI via constructor and `@activity.defn` decorators with explicit `name=` parameters.
- **Read `temporal/names.py` first.** All name constants follow the `grove.` prefix convention. Activity names are lowercase with underscores. Workflow names are PascalCase.
- **Workflow ID format:** `grove.autonomous::{tenant_id}::{task_id}` -- follows the same namespaced pattern as `grove.call/{call_id}`.
- **Same task queue:** `GROVE_TASK_QUEUE ("grove-agent")`. The autonomous workflow shares the worker with conversation and invoke workflows.
- **No signals needed:** Unlike `ConversationWorkflow` (which receives user messages via signals), autonomous tasks are fire-and-forget. The workflow starts, runs to completion, and optionally delivers a result.
- **Heartbeat pattern:** Inside the activity, run a background asyncio task that calls `activity.heartbeat()` every 30 seconds while the executor runs. Cancel the heartbeat task when execution completes.
- **Tenant context:** Use `SELECT set_config('app.tenant_id', $1, true)` within the activity before creating the executor. Follow the exact pattern from `activities.py`.
- **`AutonomousExecutor` import:** Import from `grove.runtime.autonomous` (created in T05). The executor takes memory_store, skill_store, tool_registry, and agent_config.
- **Filtered tool registry in activity:** The activity must NOT pass the full GroveActivityContext tool_registry to the executor. Build a filtered registry using `tool_registry.create_filtered()` based on the agent's `AutonomousConfig.tools` allowlist. If no allowlist, exclude side-effect tools (send_message, complete_action, handoff_to_agent, subscribe_to_event). Additionally, set `platform_mode=True` on TerminalTool/PTCRuntime to block host execution in the Temporal worker.
- **Auxiliary model propagation:** Pass `config.autonomous.auxiliary_model` (from T02/T15) to ContextCompressor, MemoryFlusher, BackgroundReviewer, and SessionSearchTool. These components must NOT default to the main expensive model.
- **Error handling:** Catch exceptions from the executor, set `status = "failed"` and populate `error` field. Never let raw exceptions propagate -- always return a typed `AutonomousTaskOutput`.
- **Duration tracking:** Record `time.monotonic()` before and after execution to compute `duration_ms`.

## Acceptance Criteria

- [ ] `AutonomousTaskWorkflow` registered with `@workflow.defn(name=AUTONOMOUS_TASK_WORKFLOW)`
- [ ] Workflow executes `execute_autonomous_task` activity and returns `AutonomousTaskOutput`
- [ ] Activity creates `AutonomousExecutor`, runs to completion, returns structured output
- [ ] Heartbeat fires every 30 seconds during execution
- [ ] Tenant context (`app.tenant_id`) set before execution
- [ ] Result delivery fires when `delivery_channel` and `delivery_target` are configured
- [ ] Timeout handling: activity times out after `timeout_minutes`
- [ ] Error handling: failed executions return `status="failed"` with error message
- [ ] Name constants in `temporal/names.py` follow `grove.` prefix convention
- [ ] `autonomous_task_workflow_id()` helper generates correct workflow IDs
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Workflow pattern: `packages/grove/src/grove/temporal/conversation_workflow.py`
- Activities pattern: `packages/grove/src/grove/temporal/activities.py`
- Name constants: `packages/grove/src/grove/temporal/names.py`
- Activity context: `packages/grove/src/grove/temporal/context.py`
- AutonomousExecutor (dependency): T05
- MemoryStore (dependency): T03 (`packages/grove/src/grove/backends/postgres/memory_store.py`)
- SkillStore (dependency): T11 (`packages/grove/src/grove/backends/postgres/skill_store.py`)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
