# T03: PostgreSQL memory store + migration

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
   - Commit message format: `feat: M33 T03 - {short description}`

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

Implement `PostgresMemoryStore` satisfying the `MemoryStore` protocol defined in T01. Create the `grove.agent_memories` PostgreSQL table with row-level security (RLS) for tenant isolation. Follow the exact same patterns as `PostgresCheckpointStore` (`backends/postgres/checkpoint_store.py`) and the migration style from `sql/migrations/001_initial.sql`.

This is the persistence layer for autonomous agent hot memory. Each agent has two memory targets (`memory` for working notes, `user` for per-user context), stored as plain text with `\n\S\n` delimiters between entries. The store is deliberately simple -- single row per (tenant_id, agent_id, target) triple, UPSERT semantics.

## Subtasks

- [ ] **Create SQL migration for `grove.agent_memories` table**: Table schema: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `tenant_id UUID NOT NULL`, `agent_id TEXT NOT NULL`, `target TEXT NOT NULL CHECK (target IN ('memory', 'user'))`, `content TEXT NOT NULL DEFAULT ''`, `char_limit INT NOT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Add `UNIQUE` constraint on `(tenant_id, agent_id, target)`. Add `updated_at` trigger using existing `grove.set_updated_at()` function. Add index on `(tenant_id, agent_id)`.
- [ ] **Enable RLS on `grove.agent_memories`**: Create policy `tenant_isolation` that restricts all operations to rows where `tenant_id = current_setting('app.tenant_id')::uuid`. Follow the same RLS pattern used by other grove tables.
- [ ] **Create down migration**: Drop table, drop policy. Follow `*.down.sql` naming convention.
- [ ] **Implement PostgresMemoryStore class**: Constructor takes `asyncpg.Pool`. Implement `load()`, `save()`, `delete()` methods. All queries use tenant_id via `SET LOCAL app.tenant_id` within a transaction (same pattern as `PostgresCheckpointStore`).
- [ ] **load() implementation**: Query by `(tenant_id, agent_id, target)`. Return `content` string or `None` if no row exists.
- [ ] **save() implementation**: UPSERT (`INSERT ... ON CONFLICT (tenant_id, agent_id, target) DO UPDATE SET content = $4, char_limit = $5, updated_at = NOW()`). Validate content length against char_limit BEFORE executing query -- raise `ValueError` if `len(content) > char_limit`.
- [ ] **delete() implementation**: `DELETE FROM grove.agent_memories WHERE tenant_id = $1 AND agent_id = $2 AND target = $3`.
- [ ] **Injection scanning**: Before `save()`, scan content for prompt injection patterns. Block and raise `ValueError` with descriptive message if any match. Patterns to block (case-insensitive regex):
  - `ignore\s+(all\s+)?previous\s+instructions`
  - `you\s+are\s+now`
  - `disregard\s+(all\s+)?rules`
  - `curl\s+.*\b(secret|password|token|key)\b`
  - `wget\s+.*\b(secret|password|token|key)\b`
  - `authorized_keys`
  - Invisible Unicode characters: `[\u200B\u200C\u2060\uFEFF]`
- [ ] **Unit tests with mocked asyncpg pool**: Test load (found/not found), save (new/update/over limit/injection blocked), delete. Mock `asyncpg.Pool.acquire()` context manager chain.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/sql/migrations/010_add_agent_memories.sql` | Create | Migration to create `grove.agent_memories` table with RLS |
| `packages/grove/src/grove/sql/migrations/010_add_agent_memories.down.sql` | Create | Down migration to drop table and policies |
| `packages/grove/src/grove/backends/postgres/memory_store.py` | Create | PostgresMemoryStore implementation |
| `packages/grove/tests/unit/backends/postgres/test_memory_store.py` | Create | Unit tests with mocked asyncpg |

## Implementation Notes

- **Read `backends/postgres/checkpoint_store.py` first.** It is 64 lines. Match its exact style: `_SET_TENANT` constant, `pool.acquire()` + `conn.transaction()` pattern, type ignore comments for asyncpg generics.
- **Migration numbering:** The latest migration is `009_update_call_outcome_check.sql`. Use `010` for this migration.
- **Migration idempotency:** Follow the pattern from `001_initial.sql` -- use `DO $$ BEGIN IF EXISTS ... END $$` check against `grove_schema_version`. Record migration version at the end.
- **RLS pattern:** Enable RLS with `ALTER TABLE grove.agent_memories ENABLE ROW LEVEL SECURITY`. Create policy: `CREATE POLICY tenant_isolation ON grove.agent_memories USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)`.
- **SET LOCAL for tenant:** Use `SELECT set_config('app.tenant_id', $1, true)` within the transaction, matching the `_SET_TENANT` constant in checkpoint_store.py.
- **UPSERT:** PostgreSQL `INSERT ... ON CONFLICT (tenant_id, agent_id, target) DO UPDATE SET ...` -- this is the natural pattern for "save or update" with a unique constraint.
- **Injection scanning as a private method:** Extract to `_scan_for_injection(content: str) -> None` that raises `ValueError`. Call it in `save()` before the query. Keep it deterministic (regex only, no LLM).
- **Injection patterns should be compiled once:** Use `re.compile()` at module level for the patterns list, not inside the method.
- **Content is the raw section-delimited string:** The tool layer (T04) handles entry parsing. The store layer sees content as opaque text with a char_limit contract.

## Acceptance Criteria

- [ ] `PostgresMemoryStore` satisfies `MemoryStore` protocol (pyright assignment check passes)
- [ ] Migration creates `grove.agent_memories` table with correct schema and constraints
- [ ] RLS policy isolates tenants (only rows matching `app.tenant_id` accessible)
- [ ] `save()` enforces `char_limit` before executing query
- [ ] `save()` blocks injection patterns with clear `ValueError` message including which pattern matched
- [ ] `load()` returns `None` for non-existent entries (not empty string, not exception)
- [ ] `delete()` is idempotent (no error if row doesn't exist)
- [ ] Down migration drops table cleanly
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass with mocked asyncpg pool

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Protocol defined in T01: `packages/grove/src/grove/core/memories.py`
- Pattern reference: `packages/grove/src/grove/backends/postgres/checkpoint_store.py`
- Migration pattern: `packages/grove/src/grove/sql/migrations/001_initial.sql`
- Existing RLS: Check other grove tables for RLS policy examples
