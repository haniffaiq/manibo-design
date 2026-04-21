# T17: GroveActivityContext extension + worker registration

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T01, T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T17 - {short description}`

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

Extend `GroveActivityContext` with `memory_store` and `skill_store` fields. Register `AutonomousTaskWorkflow` and autonomous activities on the Temporal worker. This is a minimal wiring task -- two new optional fields on the context dataclass, and two new registrations in the worker factory.

Both new fields default to `None`, so all existing code that creates `GroveActivityContext` without these fields continues to work unchanged.

## Subtasks

- [ ] **Add `memory_store` field to `GroveActivityContext`**: `memory_store: MemoryStore | None = None`. Add the import under `TYPE_CHECKING` block: `from grove.core.memories import MemoryStore`.
- [ ] **Add `skill_store` field to `GroveActivityContext`**: `skill_store: SkillStore | None = None`. Add the import under `TYPE_CHECKING` block: `from grove.core.skills import SkillStore`.
- [ ] **Add `result_deliverers` field to `GroveActivityContext`**: `result_deliverers: dict[str, ResultDeliverer] = field(default_factory=dict)`. This is the pluggable delivery registry used by T20's `deliver_result` activity. Bootstrap (T18) populates it with chat, voice, and webhook deliverers. In M33 v1, voice is an alias for chat-thread delivery (same `ChatResultDeliverer` registered under both `"chat"` and `"voice"` keys). Empty dict means no delivery channels configured (workflow output only).
- [ ] **Modify `create_grove_worker()` in `temporal/worker.py`**: Import `AutonomousTaskWorkflow` from `grove.temporal.autonomous_workflow`. Import `AutonomousActivities` from `grove.temporal.autonomous_activities`. Create `AutonomousActivities` instance with `options.activity_context`. Add `AutonomousTaskWorkflow` to the `workflows` list. Add autonomous activity methods to the `activity_list`.
- [ ] **Register autonomous workflow and activities**: Import `AutonomousTaskWorkflow` and `AutonomousActivities` directly (T16 is a dependency — these modules must exist). Add them to the worker alongside existing workflows/activities.
- [ ] **Verify existing callers unchanged**: Confirm that all existing code creating `GroveActivityContext` (in `bootstrap.py`, tests, etc.) still works without providing the new fields.
- [ ] **Unit tests**: Test that `GroveActivityContext` can be created with and without the new fields. Test that worker creation includes autonomous components when available.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/temporal/context.py` | Modify | Add `memory_store` and `skill_store` optional fields |
| `packages/grove/src/grove/temporal/worker.py` | Modify | Register autonomous workflow and activities |
| `packages/grove/tests/unit/temporal/test_activity_context.py` | Create | Tests for context with new fields |

## Implementation Notes

- **Read `temporal/context.py` first.** It is 38 lines. The dataclass uses `TYPE_CHECKING` imports for all store types. Follow the same pattern for `MemoryStore` and `SkillStore`.
- **Read `temporal/worker.py` first.** It is 71 lines. Understand the `create_grove_worker()` function structure: client connection, activities instance creation, activity list, worker creation.
- **Field ordering in dataclass:** Add new optional fields AFTER the existing optional fields (after `extra`). This maintains backward compatibility since all new fields have defaults.
- **TYPE_CHECKING imports:** Both `MemoryStore` and `SkillStore` are protocols defined in `grove.core.memories` and `grove.core.skills`. Import them under `if TYPE_CHECKING:` to avoid circular imports at runtime, matching the existing pattern for `CheckpointStore`, `ConversationStore`, etc.
- **Direct imports in worker.py:** T16 is a hard dependency of this task, so import directly — no try/except ImportError fallback. The autonomous modules must exist when T17 is implemented:
  ```python
  from grove.temporal.autonomous_workflow import AutonomousTaskWorkflow
  from grove.temporal.autonomous_activities import AutonomousActivities
  ```
- **Activity method registration:** Follow the same pattern as `GroveActivities` -- add individual activity methods (not the class itself) to the `activity_list`.
- **No changes to `GroveWorkerOptions`:** The `activity_context` field already carries the new stores via `GroveActivityContext`. No new options needed.

## Acceptance Criteria

- [ ] `GroveActivityContext` has `memory_store: MemoryStore | None = None` field
- [ ] `GroveActivityContext` has `skill_store: SkillStore | None = None` field
- [ ] Existing code creating `GroveActivityContext` without new fields still works (backward compatible)
- [ ] Worker registers `AutonomousTaskWorkflow` when available
- [ ] Worker registers autonomous activities when available
- [ ] Worker registers autonomous workflow and activities via direct imports (no fallback)
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Context dataclass: `packages/grove/src/grove/temporal/context.py`
- Worker factory: `packages/grove/src/grove/temporal/worker.py`
- Store protocols: T01 (`packages/grove/src/grove/core/memories.py`, `packages/grove/src/grove/core/skills.py`)
- Autonomous workflow (dependency): T16 (`packages/grove/src/grove/temporal/autonomous_workflow.py`)
- Autonomous activities (dependency): T16 (`packages/grove/src/grove/temporal/autonomous_activities.py`)
- Existing activities pattern: `packages/grove/src/grove/temporal/activities.py`
