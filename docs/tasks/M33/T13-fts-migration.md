# T13: FTS migration on grove.messages

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
   - Commit message format: `feat: M33 T13 - {short description}`

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

Add full-text search capability to the existing `grove.messages` table. Create a generated `tsvector` column and GIN index for efficient text search across conversation history. This is a pure database migration -- no application code changes required. The generated column auto-populates for existing rows and new inserts, maintained entirely by PostgreSQL.

This migration enables T14 (session search tool) to perform fast full-text queries against conversation history with relevance ranking.

## Subtasks

- [ ] **Create SQL migration adding `search_vector` column to `grove.messages`**: `tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED`. The `STORED` keyword means PostgreSQL materializes the value on write, not on read.
- [ ] **Create GIN index**: `CREATE INDEX idx_messages_fts ON grove.messages USING GIN (search_vector)`. GIN index enables fast `@@` operator lookups on the tsvector column.
- [ ] **Add migration version guard**: Follow the pattern from `001_initial.sql` -- wrap in `DO $$ BEGIN ... END $$` block checking `grove_schema_version` to ensure idempotency.
- [ ] **Record schema version at end of migration**: Insert into `grove.grove_schema_version` with version number matching migration file prefix.
- [ ] **Create down migration**: Drop the index and column in reverse order: `DROP INDEX IF EXISTS grove.idx_messages_fts; ALTER TABLE grove.messages DROP COLUMN IF EXISTS search_vector;`
- [ ] **Test migration on existing data**: After migration, verify `search_vector` column is populated for existing rows (non-null for rows with content).
- [ ] **Verify FTS query works**: Confirm `SELECT * FROM grove.messages WHERE search_vector @@ plainto_tsquery('english', 'test term')` returns results, and `ts_rank(search_vector, query)` produces ordering.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/sql/migrations/011_add_messages_fts.sql` | Create | Migration adding search_vector generated column and GIN index |
| `packages/grove/src/grove/sql/migrations/011_add_messages_fts.down.sql` | Create | Down migration dropping index and column |

## Implementation Notes

- **Migration numbering:** T03 uses `010` for `agent_memories`. Use `011` for this migration. If T11 (skill store) uses `011`, coordinate numbering -- check the latest migration number before creating the file.
- **Read `001_initial.sql` first.** It establishes the `grove.grove_schema_version` table and the idempotency pattern. Match that pattern exactly.
- **Read `007_gin_index_and_external_id_unique.sql`** for the existing GIN index pattern on grove tables.
- **Generated column requires PostgreSQL 12+.** This is safe -- the project already uses PostgreSQL 14+.
- **`STORED` vs computed:** The `STORED` keyword materializes the tsvector on disk. This costs ~50-100 bytes per row of storage but makes read queries fast (no recomputation). This is the right tradeoff for a search index.
- **The `english` text search configuration** handles stemming (e.g., "running" matches "run"), stop words (e.g., "the", "a" are ignored), and accent normalization. This is the standard config for English text.
- **`coalesce(content, '')` handles NULLs.** If `content` is NULL, the tsvector is computed from empty string (resulting in an empty tsvector, not a NULL).
- **RLS on `grove.messages` already exists.** FTS queries automatically inherit tenant isolation from the existing RLS policies. No additional RLS configuration needed.
- **This is a pure DB migration.** No Python code changes. No imports. No test files. The migration is tested by running it against a database with existing data.
- **Index creation on large tables:** `CREATE INDEX` is a blocking operation. For production tables with millions of rows, consider `CREATE INDEX CONCURRENTLY`. However, for the current scale, standard `CREATE INDEX` within the migration transaction is acceptable.

## Acceptance Criteria

- [ ] Migration runs without errors on existing `grove.messages` data
- [ ] `search_vector` column is auto-populated for all existing rows with non-null content
- [ ] `search_vector` column updates automatically on INSERT and UPDATE (verified by inserting a new row)
- [ ] GIN index `idx_messages_fts` created on `grove.messages`
- [ ] `plainto_tsquery('english', 'search term')` with `@@` operator returns relevant results
- [ ] `ts_rank(search_vector, query)` produces numeric ranking for result ordering
- [ ] RLS still enforced on FTS queries (tenant isolation maintained)
- [ ] Migration is idempotent (can be re-run safely via version guard)
- [ ] Down migration drops index and column cleanly
- [ ] No Python files changed (pure SQL migration)

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Migration pattern: `packages/grove/src/grove/sql/migrations/001_initial.sql`
- GIN index precedent: `packages/grove/src/grove/sql/migrations/007_gin_index_and_external_id_unique.sql`
- Messages table definition: `packages/grove/src/grove/sql/migrations/001_initial.sql`
- Consumed by: T14 (session search tool)
