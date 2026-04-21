# T11: PostgreSQL skill store + migration

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T11 - {short description}`

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

Implement `PostgresSkillStore` satisfying the `SkillStore` protocol (defined in T01). Create `grove.agent_skills` and `grove.agent_skill_versions` tables with row-level security (RLS) for tenant isolation. Follow the same patterns established by `PostgresConversationStore` and the T03 `PostgresMemoryStore`.

Skills are agent-created procedural memory: reusable procedures, domain knowledge, and learned patterns that autonomous agents discover and persist. The store manages the full lifecycle: create, read, update (including patch), soft-delete, and version history. Every mutation creates a version record for audit trail.

## Subtasks

- [ ] **Create SQL migration**: Create `packages/grove/src/grove/sql/migrations/010_add_agent_skills.sql` with:
  - Table `grove.agent_skills`: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `tenant_id UUID NOT NULL`, `agent_id TEXT NOT NULL`, `skill_name TEXT NOT NULL`, `description TEXT NOT NULL DEFAULT ''`, `content TEXT NOT NULL`, `version INT NOT NULL DEFAULT 1`, `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'review', 'active', 'archived'))`, `category TEXT NOT NULL DEFAULT 'general'`, `char_limit INT NOT NULL DEFAULT 15360`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`. Add `UNIQUE (tenant_id, agent_id, skill_name)`.
  - Table `grove.agent_skill_versions`: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `skill_id UUID NOT NULL REFERENCES grove.agent_skills(id) ON DELETE CASCADE`, `version INT NOT NULL`, `content TEXT NOT NULL`, `description TEXT NOT NULL DEFAULT ''`, `change_source TEXT NOT NULL CHECK (change_source IN ('agent_create', 'agent_patch', 'operator_edit'))`, `change_summary TEXT NOT NULL DEFAULT ''`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`. Add `UNIQUE (skill_id, version)`.
  - Enable RLS on both tables: `ALTER TABLE grove.agent_skills ENABLE ROW LEVEL SECURITY`, create policy `tenant_isolation` using `(tenant_id = current_setting('app.tenant_id')::uuid)`. Same for `grove.agent_skill_versions` joined through `skill_id`.
  - Create indexes: `idx_agent_skills_tenant_agent` on `(tenant_id, agent_id)`, `idx_agent_skill_versions_skill_id` on `(skill_id)`.
- [ ] **Create down migration**: Create `packages/grove/src/grove/sql/migrations/010_add_agent_skills.down.sql` to drop both tables.
- [ ] **Create PostgresSkillStore class**: Define in `packages/grove/src/grove/backends/postgres/skill_store.py`. Constructor takes `pool: asyncpg.Pool`. Use the same `_AsyncpgPool` / `_AsyncpgConnection` protocol pattern as `PostgresConversationStore`. Add `from __future__ import annotations` at top.
- [ ] **Implement tenant_connection context**: Use `SELECT set_config('app.tenant_id', $1, true)` before every query (same `_SET_TENANT` pattern as conversation_store.py). All queries run within a transaction with tenant_id set.
- [ ] **Implement list_skills()**: `async def list_skills(self, *, tenant_id: str, agent_id: str) -> list[SkillSummary]`. Query `grove.agent_skills` WHERE `agent_id = $1` AND `status != 'archived'`, ORDER BY `skill_name`. Map rows to `SkillSummary` models. Return empty list if none found.
- [ ] **Implement get_skill()**: `async def get_skill(self, *, tenant_id: str, agent_id: str, skill_name: str) -> Skill | None`. Query `grove.agent_skills` by `agent_id` and `skill_name`. If found, also query `grove.agent_skill_versions` for all versions ordered by version DESC. Map to `Skill` model with populated `versions` list. Return `None` if not found.
- [ ] **Implement create_skill()**: `async def create_skill(self, *, tenant_id: str, agent_id: str, name: str, description: str, content: str, category: str, source: SkillChangeSource) -> Skill`. Validate content length against `SKILL_CHAR_LIMIT` (15360). Validate content against injection patterns. INSERT into `grove.agent_skills` with `version=1`. INSERT into `grove.agent_skill_versions` with `version=1`, `change_source=source`. Return created `Skill`.
- [ ] **Implement update_skill()**: `async def update_skill(self, *, tenant_id: str, agent_id: str, skill_name: str, content: str, description: str | None, source: SkillChangeSource) -> Skill`. Fetch current skill, validate new content length, validate against injection patterns. UPDATE `grove.agent_skills` incrementing `version`, setting new `content`, `updated_at=now()`. If `description` is not None, update description too. INSERT version record into `grove.agent_skill_versions`. Return updated `Skill`.
- [ ] **Implement patch support in update_skill**: Accept optional `old_string: str | None` and `new_string: str | None` parameters. When both are provided, load current content, find `old_string` using whitespace-normalized fuzzy matching (collapse whitespace sequences to single space for comparison), replace with `new_string`, then proceed with the update. Raise `ValueError` if `old_string` not found in content.
- [ ] **Implement delete_skill()**: `async def delete_skill(self, *, tenant_id: str, agent_id: str, skill_name: str) -> None`. Soft delete: UPDATE `status = 'archived'`, `updated_at = now()`. Never hard delete.
- [ ] **Content validation**: Reuse injection scanning patterns from T03's `PostgresMemoryStore` (if available) or implement: scan content for SQL injection attempts (`'; DROP`, `UNION SELECT`, etc.) and prompt injection patterns (`<|system|>`, `[INST]`, etc.). Raise `ValueError` on detection.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/backends/postgres/test_skill_store.py` with tests using mocked asyncpg pool: (a) list_skills returns SkillSummary list, (b) get_skill returns full Skill with versions, (c) get_skill returns None for missing skill, (d) create_skill inserts skill + version record, (e) update_skill increments version and creates version record, (f) patch with old_string/new_string replaces content, (g) patch with missing old_string raises ValueError, (h) delete_skill sets status to archived, (i) content exceeding char_limit raises ValueError, (j) injection patterns blocked.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/sql/migrations/010_add_agent_skills.sql` | Create | Migration for grove.agent_skills and grove.agent_skill_versions tables |
| `packages/grove/src/grove/sql/migrations/010_add_agent_skills.down.sql` | Create | Down migration dropping both tables |
| `packages/grove/src/grove/backends/postgres/skill_store.py` | Create | PostgresSkillStore class (~250 lines) |
| `packages/grove/tests/unit/backends/postgres/test_skill_store.py` | Create | Unit tests with mocked asyncpg pool |

## Implementation Notes

- **Pattern reference:** Read `packages/grove/src/grove/backends/postgres/conversation_store.py` thoroughly before writing. Match its: import structure, `_AsyncpgPool`/`_AsyncpgConnection` protocol definitions, `_SET_TENANT` constant, transaction patterns, and type annotations.
- **Migration numbering:** Check existing migrations in `packages/grove/src/grove/sql/migrations/` — the latest is `009_*`. Use `010_` for this migration. If T03 (memory store) has already taken `010_`, use the next available number.
- **RLS for versions table:** The `grove.agent_skill_versions` table does not have a direct `tenant_id` column. RLS policy should join through `grove.agent_skills` on `skill_id` to check tenant isolation: `USING (EXISTS (SELECT 1 FROM grove.agent_skills s WHERE s.id = skill_id AND s.tenant_id = current_setting('app.tenant_id')::uuid))`.
- **Whitespace-normalized fuzzy matching for patch:** Collapse all whitespace sequences (spaces, tabs, newlines) to single space in both the content and `old_string` for matching purposes. Apply the replacement using the original (non-normalized) `old_string` position in the original content.
- **Version numbering:** Auto-increment within a skill. `create_skill` starts at version 1. Each `update_skill` increments by 1. Query `MAX(version)` from skill record, not from versions table.
- **change_source values:** `agent_create` (autonomous agent created the skill), `agent_patch` (autonomous agent patched existing skill), `operator_edit` (human operator edited via UI — future, but the enum value exists now).
- **SkillStatus check constraint:** The `status` column uses a CHECK constraint, not a foreign key. Values: `draft`, `review`, `active`, `archived`. Default is `active` (agents create active skills by default).
- **Logging:** Use `grove.logger.create_logger()`. Log create/update/delete operations at DEBUG level with skill name and agent_id.

## Acceptance Criteria

- [ ] `PostgresSkillStore` satisfies the `SkillStore` protocol from `grove.core.skills`
- [ ] RLS policies isolate tenants on both `grove.agent_skills` and `grove.agent_skill_versions`
- [ ] `create_skill()` inserts skill row + version record in a single transaction
- [ ] `update_skill()` increments version, updates content, and inserts version record
- [ ] `delete_skill()` soft-deletes (sets status to `archived`), never hard-deletes
- [ ] Patch with `old_string`/`new_string` works with whitespace-normalized fuzzy matching
- [ ] `char_limit` (15360) enforced on create and update — raises `ValueError` if exceeded
- [ ] Injection patterns in content are blocked — raises `ValueError`
- [ ] Version history preserved on every mutation (audit trail)
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Migration SQL is valid and creates both tables with correct constraints

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T01 (Store protocols — provides SkillStore protocol, Skill/SkillSummary/SkillVersion models)
- Pattern reference: `packages/grove/src/grove/backends/postgres/conversation_store.py`
- Pattern reference: `packages/grove/src/grove/sql/migrations/001_initial.sql` (RLS patterns)
- Sibling: T03 (PostgreSQL memory store — same patterns, possibly same migration sequence)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
