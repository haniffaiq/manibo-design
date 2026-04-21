# T18: Bootstrap wiring

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T03, T04, T08, T10, T11, T12, T14, T17

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T18 - {short description}`

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

Wire all new stores and tools into Grove's bootstrap process. `PostgresMemoryStore` and `PostgresSkillStore` get created alongside existing stores. New system tools get registered in the `ToolRegistry`. `GroveActivityContext` receives the new stores. This is the integration task that connects all the pieces built in T01-T17.

Bootstrap wiring is conditional: autonomous stores and tools are only created if at least one agent in the config has an `autonomous` section. When no agent has autonomous config, bootstrap behavior is identical to pre-M33.

## Subtasks

- [ ] **Detect autonomous agents in config**: Scan `grove_config.agents` for any agent with `autonomous` config set (not None). Store result as a boolean `has_autonomous_agents`. This determines whether autonomous stores and tools are created.
- [ ] **Create `PostgresMemoryStore` in bootstrap**: If `has_autonomous_agents` and `pg_pool` is available, create `PostgresMemoryStore(pg_pool)`. Otherwise `memory_store = None`.
- [ ] **Create `PostgresSkillStore` in bootstrap**: If `has_autonomous_agents` and `pg_pool` is available, create `PostgresSkillStore(pg_pool)`. Otherwise `skill_store = None`.
- [ ] **Register `MemoryTool` in `ToolRegistry`**: If `memory_store` is not None, register `MemoryTool(memory_store)` as a system tool. Tool from T04.
- [ ] **Register `SessionSearchTool` in `ToolRegistry`**: If `memory_store` is not None (FTS search needs conversation history access), register `SessionSearchTool(conversation_store)`. Tool from T14.
- [ ] **Register skill tools in `ToolRegistry`**: If `skill_store` is not None, register: `SkillListTool(skill_store)`, `SkillViewTool(skill_store)`, `SkillManageTool(skill_store)`. Tools from T12.
- [ ] **Register `TerminalTool` in `ToolRegistry`**: If `has_autonomous_agents`, register `TerminalTool()`. Tool from T08.
- [ ] **Register `CodeExecutionTool` in `ToolRegistry`**: If `has_autonomous_agents`, create `PTCRuntime(tool_registry, allowed_tools=...)` and register `CodeExecutionTool(ptc_runtime)`. Tool from T10. Handle the circular dependency: PTCRuntime needs tool_registry, but CodeExecutionTool is being registered INTO tool_registry. Solution: create PTCRuntime AFTER all other tools are registered, then register CodeExecutionTool last.
- [ ] **Create filtered ToolRegistry per autonomous agent**: For each agent with `autonomous` config, build a filtered registry via `tool_registry.create_filtered()`. If `AutonomousConfig.tools` lists specific tool names, use those. Otherwise use a default safe set excluding side-effect tools (`send_message`, `complete_action`, `handoff_to_agent`, `subscribe_to_event`). The filtered registry is what `AutonomousExecutor` receives — never the full unfiltered registry.
- [ ] **Build and inject `result_deliverers` into `GroveActivityContext`**: Create the delivery registry: `result_deliverers: dict[str, ResultDeliverer] = {}`. If `has_autonomous_agents` and `conversation_store` is available: register `ChatResultDeliverer(conversation_store, pg_pool)` under key `"chat"` and `"voice"`. Register `WebhookResultDeliverer()` under key `"webhook"`. Pass the populated dict to `GroveActivityContext(result_deliverers=result_deliverers)`.
- [ ] **Pass `memory_store` and `skill_store` to `GroveActivityContext`**: Set the new fields (from T17) during context construction: `memory_store=memory_store, skill_store=skill_store`.
- [ ] **Maintain backward compatibility**: If no agent has autonomous config, bootstrap is identical to pre-M33. No new stores created, no new tools registered, no changes to `GroveActivityContext` behavior. Verify by running existing tests without autonomous config.
- [ ] **Integration test**: Bootstrap with a config that includes one autonomous agent and one rail agent. Verify: autonomous stores created, tools registered, context populated, rail agent unaffected.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/bootstrap.py` | Modify | Wire stores, register tools, update context construction |
| `packages/grove/tests/unit/test_bootstrap_autonomous.py` | Create | Integration test for bootstrap with autonomous config |

## Implementation Notes

- **Read `bootstrap.py` FULLY before editing.** It is the composition root -- it imports everything and wires all dependencies. Understand the existing flow before adding to it.
- **Follow existing wiring patterns.** Look at how `checkpoint_store`, `conversation_store`, and `subscription_store` are created and passed to `GroveActivityContext`. The new stores follow the same pattern.
- **Conditional wiring block:** Add a clearly commented section for autonomous wiring, placed AFTER existing store and tool creation:
  ```python
  # ---------------------------------------------------------------
  # Autonomous runtime (only if any agent has autonomous config)
  # ---------------------------------------------------------------
  ```
- **Import order:** All new imports at the top of `bootstrap.py`, grouped with existing imports. `bootstrap.py` is the ONLY file in Grove that imports everything -- this is by design (composition root pattern).
- **Circular dependency with CodeExecutionTool:** `PTCRuntime` needs access to `ToolRegistry` to delegate tool calls to the PTC sandbox. But `CodeExecutionTool` is registered in `ToolRegistry`. Solution: register all other tools first, then create `PTCRuntime(tool_registry, ...)`, then register `CodeExecutionTool(ptc_runtime)` last. The registry is mutable after creation.
- **`allowed_tools` for PTCRuntime:** The PTC sandbox should only have access to a subset of tools (not recursive access to CodeExecutionTool itself). Define the allowed list based on the autonomous agent's `tools` config, or default to a safe subset.
- **No changes to `GroveOptions` needed** unless bootstrap requires new configuration. The autonomous detection is based on agent configs, which are already loaded.
- **Error handling (fail-closed):** If autonomous agents are configured but required stores cannot be created (e.g., pg_pool is None), **raise an error and abort bootstrap**. Do not silently degrade — the architecture spine requires fail-closed behavior for missing config/state. A misconfigured deployment must fail loudly at startup, not silently at runtime when an agent tries to use a missing store.
- **Test the negative case:** Verify that bootstrap without any autonomous agents produces identical behavior to pre-M33. No new objects created, no new tools registered.

## Acceptance Criteria

- [ ] Bootstrap detects autonomous agents in config
- [ ] `PostgresMemoryStore` created when autonomous agents exist and `pg_pool` available
- [ ] `PostgresSkillStore` created when autonomous agents exist and `pg_pool` available
- [ ] `MemoryTool` registered in `ToolRegistry` when memory_store exists
- [ ] `SessionSearchTool` registered in `ToolRegistry` when memory_store exists
- [ ] `SkillListTool`, `SkillViewTool`, `SkillManageTool` registered when skill_store exists
- [ ] `TerminalTool` registered when autonomous agents exist
- [ ] `CodeExecutionTool` registered last (after PTCRuntime created with populated registry)
- [ ] `GroveActivityContext` receives `memory_store`, `skill_store`, and `result_deliverers`
- [ ] `result_deliverers` contains `chat`, `voice`, and `webhook` deliverers when autonomous agents configured
- [ ] `result_deliverers` is empty dict when no autonomous agents configured (backward compatible)
- [ ] No autonomous stores/tools created when no agent has autonomous config (backward compatible)
- [ ] Circular dependency between `CodeExecutionTool` and `ToolRegistry` resolved via registration ordering
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Integration test passes: full bootstrap with autonomous config succeeds
- [ ] Existing tests pass without modification (backward compatibility)

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Bootstrap file: `packages/grove/src/grove/bootstrap.py`
- GroveActivityContext: T17 (`packages/grove/src/grove/temporal/context.py`)
- PostgresMemoryStore: T03 (`packages/grove/src/grove/backends/postgres/memory_store.py`)
- PostgresSkillStore: T11 (`packages/grove/src/grove/backends/postgres/skill_store.py`)
- MemoryTool: T04 (`packages/grove/src/grove/tools/system/memory_tool.py`)
- SessionSearchTool: T14 (`packages/grove/src/grove/tools/system/session_search_tool.py`)
- SkillListTool/SkillViewTool/SkillManageTool: T12 (`packages/grove/src/grove/tools/system/skill_*_tool.py`)
- TerminalTool: T08 (`packages/grove/src/grove/tools/system/terminal_tool.py`)
- CodeExecutionTool + PTCRuntime: T10 (`packages/grove/src/grove/tools/system/code_execution_tool.py`)
- AutonomousConfig: T02 (`packages/grove/src/grove/config/schema.py`)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
