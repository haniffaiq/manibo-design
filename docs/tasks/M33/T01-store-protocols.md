# T01: Store protocols (MemoryStore, SkillStore)

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T01 - {short description}`

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

Define `MemoryStore` and `SkillStore` protocols in `packages/grove/src/grove/core/`. These are the interfaces that PostgreSQL implementations will satisfy in T03 and T11 respectively. Follow the same module-level patterns as `core/checkpoints.py` and `core/conversations.py` (Pydantic models + abstract store in one file), but use `typing.Protocol` instead of `ABC` for structural subtyping. Protocol-based means any class with matching method signatures satisfies the contract without explicit inheritance.

**Why protocols instead of ABC:** The existing stores (`CheckpointStore`, `ConversationStore`) use ABC, but the milestone design decision explicitly requires Protocol for autonomous stores. This enables structural subtyping -- implementations satisfy the protocol by shape, not by inheritance. This is the deliberate direction for new store contracts in Grove.

## Subtasks

- [ ] **Define MemoryStore protocol**: Create `MemoryStore` protocol class with methods: `load(tenant_id: str, agent_id: str, target: MemoryTarget) -> str | None`, `save(tenant_id: str, agent_id: str, target: MemoryTarget, content: str) -> None`, `delete(tenant_id: str, agent_id: str, target: MemoryTarget) -> None`. All methods async. All parameters use keyword arguments after `self`.
- [ ] **Define MemoryEntry model**: Pydantic `BaseModel` with fields: `id: str`, `tenant_id: str`, `agent_id: str`, `target: MemoryTarget`, `content: str`, `char_limit: int`, `created_at: datetime`, `updated_at: datetime`.
- [ ] **Define MemoryTarget enum**: `StrEnum` with values `"memory"` and `"user"`. These represent the two hot memory targets -- `memory` for agent's own working notes, `user` for per-user context.
- [ ] **Define SkillStore protocol**: Create `SkillStore` protocol class with methods: `list_skills(tenant_id: str, agent_id: str) -> list[SkillSummary]`, `get_skill(tenant_id: str, agent_id: str, skill_name: str) -> Skill | None`, `create_skill(tenant_id: str, agent_id: str, name: str, description: str, content: str, category: str, source: SkillChangeSource) -> Skill`, `update_skill(tenant_id: str, agent_id: str, skill_name: str, content: str, description: str | None, source: SkillChangeSource) -> Skill`, `delete_skill(tenant_id: str, agent_id: str, skill_name: str) -> None`. All methods async. All parameters use keyword arguments after `self`.
- [ ] **Define Skill data models**: `SkillSummary` (Pydantic BaseModel: `name: str`, `description: str`, `category: str`, `version: int`, `status: SkillStatus`), `Skill` (full model: extends summary with `content: str`, `versions: list[SkillVersion]`, `tenant_id: str`, `agent_id: str`, `created_at: datetime`, `updated_at: datetime`), `SkillVersion` (BaseModel: `version: int`, `content: str`, `description: str`, `source: SkillChangeSource`, `created_at: datetime`).
- [ ] **Define enums**: `SkillStatus` (StrEnum: `"draft"`, `"review"`, `"active"`, `"archived"`), `SkillChangeSource` (StrEnum: `"agent_create"`, `"agent_patch"`, `"operator_edit"`).
- [ ] **Add `from __future__ import annotations`** to all new files.
- [ ] **Unit tests for protocol structural typing**: Verify that a plain class with matching method signatures satisfies the protocol (using `isinstance` checks with `runtime_checkable` or pyright assignment tests).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/core/memories.py` | Create | MemoryStore protocol + MemoryEntry model + MemoryTarget enum |
| `packages/grove/src/grove/core/skills.py` | Create | SkillStore protocol + Skill + SkillSummary + SkillVersion models + SkillStatus + SkillChangeSource enums |
| `packages/grove/tests/unit/core/test_memory_protocol.py` | Create | Structural typing tests for MemoryStore protocol |
| `packages/grove/tests/unit/core/test_skill_protocol.py` | Create | Structural typing tests for SkillStore protocol |

## Implementation Notes

- **Pattern reference:** Read `core/checkpoints.py` (25 lines) and `core/conversations.py` (173 lines) before writing. Match their import style, model placement, and docstring conventions.
- **Protocol, not ABC:** Use `typing.Protocol` with `typing.runtime_checkable` decorator. This is a deliberate divergence from the existing ABC-based stores. The existing `CheckpointStore(ABC)` and `ConversationStore(ABC)` remain unchanged.
- **All methods async:** Every protocol method returns a coroutine (`async def`).
- **Keyword-only arguments:** All parameters after `self` should be keyword-only (use `*` separator or natural keyword args).
- **tenant_id and agent_id are always required:** Multi-tenant, multi-agent system. Never optional.
- **Char limits (constants, not magic numbers):** Define module-level constants:
  - `MEMORY_CHAR_LIMIT = 2200` (agent working memory)
  - `USER_CHAR_LIMIT = 1375` (per-user context)
  - `SKILL_CHAR_LIMIT = 15360` (15KB per skill)
- **StrEnum for all enums:** Use `enum.StrEnum` (Python 3.11+), not `Literal` types. This gives both type safety and serialization.
- **No business logic in protocol files:** Only type definitions, models, enums, and constants. No validation beyond Pydantic field types.
- **No imports from outside grove.core:** These are leaf modules with no upward dependencies.

## Acceptance Criteria

- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors on both new files
- [ ] `MemoryStore` and `SkillStore` use `typing.Protocol`, not `ABC`
- [ ] All types have explicit annotations (no implicit `Any`)
- [ ] `StrEnum` used for `MemoryTarget`, `SkillStatus`, `SkillChangeSource`
- [ ] All protocol methods are `async def`
- [ ] Char limit constants defined at module level
- [ ] Unit tests confirm structural subtyping works (plain class satisfies protocol)
- [ ] `ruff check` and `ruff format --check` pass on new files

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Pattern reference: `packages/grove/src/grove/core/checkpoints.py`
- Pattern reference: `packages/grove/src/grove/core/conversations.py`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
