# T15: Background review nudge

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T04, T12

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T15 - {short description}`

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

Implement the background review system that periodically nudges the autonomous agent to review and persist memories and skills. After complex tasks (5+ tool calls, trial-and-error patterns), the reviewer spawns a background review that checks if anything from the conversation is worth persisting.

**Durability model:** The review runs as a **separate Temporal activity** (`grove.review_memories_and_skills`), not as a fire-and-forget `asyncio.create_task`. This ensures review survives worker restarts, shutdowns, and activity timeouts. The AutonomousTaskWorkflow calls `execute_autonomous_task` → then `review_memories_and_skills` → then `deliver_result`. If review fails, Temporal retries it. The agent's learning loop is durable, not best-effort.

In CLI mode (no Temporal), the review runs inline after execution completes — synchronous, blocking, but guaranteed to finish before the process exits.

## Subtasks

- [ ] **Create `BackgroundReviewer` class with dependency injection**: Constructor takes: `memory_store` (`MemoryStore | None`), `skill_store` (`SkillStore | None`), `model` (str -- auxiliary LLM model name). The class is stateless per invocation -- all state lives in the method parameters.
- [ ] **Implement `review_memories(messages_snapshot: list[dict]) -> list[str]`**: Inject the memory review prompt into the message list. Call LLM with temperature=0.3, max_tokens=5120, tools=[memory_tool only]. Execute any tool calls the LLM makes. Return a list of descriptions of what was saved. Prompt: "Review the conversation above. Focus on: user preferences and corrections, environment facts, naming conventions, workflow patterns. Save anything worth remembering for future sessions."
- [ ] **Implement `review_skills(messages_snapshot: list[dict]) -> list[str]`**: Inject the skill review prompt into the message list. Call LLM with temperature=0.3, max_tokens=5120, tools=[skill_list, skill_view, skill_manage]. Execute any tool calls the LLM makes. Return a list of descriptions of what was saved. Prompt: "Review the conversation above. Was a non-trivial approach used that required trial and error? If so, create a reusable skill documenting the approach. Only create skills for genuinely reusable techniques, not one-off fixes."
- [ ] **Implement combined `run_review(messages_snapshot: list[dict], review_memory: bool, review_skills: bool) -> ReviewResult`**: Entry point that dispatches to `review_memories` and/or `review_skills`. Returns a `ReviewResult` dataclass with `memories_saved: list[str]`, `skills_saved: list[str]`, `error: str | None`.
- [ ] **Define `ReviewResult` dataclass**: Fields: `memories_saved: list[str]`, `skills_saved: list[str]`, `error: str | None`.
- [ ] **Implement as Temporal activity**: Define `@activity.defn(name="grove.review_memories_and_skills")` in `autonomous_activities.py` (T16). The activity receives a `ReviewInput` (messages_snapshot, review_memory flag, review_skills flag, tenant_id, agent_id, auxiliary_model). It calls `BackgroundReviewer.run_review()` and returns `ReviewResult`. Temporal handles retries and durability. In CLI mode (no Temporal), call `BackgroundReviewer.run_review()` inline after execution.
- [ ] **Nudge interval tracking**: Provide a `NudgeTracker` helper class (or simple dataclass) that tracks: `turns_since_memory_review: int`, `iterations_since_skill_review: int`, `tool_calls_in_session: int`. Methods: `record_turn()`, `record_iteration()`, `record_tool_call()`, `should_review_memory(interval: int) -> bool`, `should_review_skills(interval: int, min_tool_calls: int) -> bool`, `reset_memory_counter()`, `reset_skill_counter()`.
- [ ] **Suppress output (quiet mode)**: The review LLM call and tool executions produce no user-visible output. Log results at DEBUG level only.
- [ ] **Log what was saved**: After review completes, log a compact summary at INFO level: "Background review: saved {n} memories, {m} skills" (only when something was actually saved).
- [ ] **Unit tests with mocked LLM**: Test memory review saves, skill review saves, combined review, empty review (nothing worth saving), error handling (LLM failure), and nudge interval logic.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/background_review.py` | Create | BackgroundReviewer + NudgeTracker (~200 lines) |
| `packages/grove/tests/unit/runtime/test_background_review.py` | Create | Unit tests with mocked LLM and stores |

## Implementation Notes

- **Reference design:** `wiki/queries/research-grove-autonomous-runtime-design.md` section on background review and memory/skill nudging.
- **Read `runtime/executor.py` first.** Understand how the main execution loop works, since BackgroundReviewer plugs into AutonomousExecutor's post-execution hook.
- **Messages snapshot is a frozen copy:** The reviewer works on a snapshot of messages taken at trigger time. This prevents race conditions with the main execution loop that continues to append messages.
- **Use auxiliary model, NOT the main expensive model.** Background reviews are side tasks — they must not burn tokens on the primary model (e.g., claude-opus). The `model` constructor parameter should default to a cheap/fast model (e.g., `anthropic/claude-haiku-4-5-20251001` or `gemini/gemini-2.0-flash`). This follows Hermes's auxiliary_client pattern: compression, session search, and background review all use a separate cheap model. The AutonomousConfig (T02) should include an `auxiliary_model: str | None` field, and BackgroundReviewer should use it. If not set, fall back to a sensible default.
- **LLM call pattern:** Use `litellm.acompletion()` with the auxiliary model. Temperature=0.3 for deterministic review behavior. max_tokens=5120 gives enough room for tool call responses.
- **Tool execution within review:** The LLM may call memory_tool.save() or skill_manage.create(). These tool calls must be executed against the real stores. Build a minimal tool execution loop (call LLM, execute tool calls, repeat until LLM stops calling tools or max 3 iterations).
- **Temporal activity in platform mode, inline in CLI mode.** In platform mode, review is a durable Temporal activity (`grove.review_memories_and_skills`) called by AutonomousTaskWorkflow after `execute_autonomous_task` completes. Temporal handles retries and survives worker restarts. In CLI mode (no Temporal), call `BackgroundReviewer.run_review()` synchronously after execution — blocking but guaranteed to complete before process exit. There is NO `spawn_review()` method and NO `asyncio.create_task` anywhere.
- **Error isolation:** Wrap the review in try/except. Log errors but never raise. A failed review should not mark the Temporal workflow as failed — the execution succeeded, only enrichment failed.
- **Nudge triggers (defaults):** Memory review every 5 user turns. Skill review after 5+ tool calls in the current session. These values come from `AutonomousConfig` (T02) -- `BackgroundReviewer` receives them as parameters, not hardcoded.
- **No imports from outside `grove` package.** This is a Layer-1 component.
- **The reviewer does not import `AutonomousExecutor`.** It is a standalone component that receives its dependencies via constructor DI.

## Acceptance Criteria

- [ ] `BackgroundReviewer` created with DI for memory_store, skill_store, and model
- [ ] `run_review()` dispatches to memory and/or skill review based on flags
- [ ] Memory review saves relevant memories via memory tool
- [ ] Skill review creates skills after complex tasks via skill tools
- [ ] Platform mode: review runs as durable Temporal activity (`grove.review_memories_and_skills`)
- [ ] CLI mode: review runs inline synchronously after execution
- [ ] No `asyncio.create_task` or `spawn_review()` — review is always durable or synchronous
- [ ] All exceptions caught and logged — failed review does not fail the workflow
- [ ] `NudgeTracker` tracks turns, iterations, and tool calls with configurable thresholds
- [ ] Quiet mode: no user-visible output from review process
- [ ] INFO log when items are actually saved
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass with mocked LLM and stores

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Memory tool (dependency): T04 (`packages/grove/src/grove/tools/system/memory_tool.py`)
- Skill tools (dependency): T12 (`packages/grove/src/grove/tools/system/skill_*_tool.py`)
- MemoryStore protocol: T01 (`packages/grove/src/grove/core/memories.py`)
- SkillStore protocol: T01 (`packages/grove/src/grove/core/skills.py`)
- AutonomousConfig: T02 (`packages/grove/src/grove/config/schema.py`)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
