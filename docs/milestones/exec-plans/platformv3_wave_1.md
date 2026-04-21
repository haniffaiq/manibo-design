# Execution Plan: Platform v3.0 — Wave 1: Foundation

> **Parent plan:** platform-v3-implementation-plan.md (archived)
> **Status:** Completed

### Wave 1: Foundation (Sequential — Everything Depends on This)

---

#### Phase 1.0: Rename platform-sdk to platform-core [DONE]

**Objective:** Rename the package directory and all internal references from `platform-sdk` / `platform_sdk` to `platform-core` / `platform_core`. This is the canonical name per architecture doc.

**Input:**
- Architecture doc Section 4 (Layering Model): `packages/platform-core`
- Current: `packages/platform-core/` (renamed)

**Deliverables:**
- `packages/platform-core/` — renamed directory
- `packages/platform-core/pyproject.toml` — updated package name
- `packages/platform-core/src/platform_core/` — renamed Python package
- All imports across the repo updated

**Tests:**
- Existing tests still pass after rename
- `uv sync` succeeds with new package name

**Verification gate:**
```bash
uv sync
uv run pytest --tb=short -q
uv run ruff check . --exclude=.venv
uv run ruff format --check . --exclude=.venv
ls packages/platform-core/src/platform_core/__init__.py  # exists
```

**Context budget:** ~20K tokens
**Depends on:** none
**Can run in parallel with:** none — foundational

---

#### Phase 1.1: Big-bang rename organization_id → tenant_id [DONE]

**Objective:** Rename all occurrences of `organization_id` to `tenant_id` in Grove codebase, migrations, tests, and configuration. This is the canonical column name per architecture doc Section 6.1.1.

**Input:**
- Architecture doc Section 6.1.1: "tenant_id (UUID) is the canonical column name"
- Current: `organization_id` used throughout Grove

**Deliverables:**
- All `organization_id` references in `packages/grove/` renamed to `tenant_id`
- Alembic migration adding `tenant_id` column (or renaming, depending on current schema state)
- All test fixtures updated
- All YAML configs updated

**Tests:**
- All existing tests pass with new column name
- Architecture test validates no `organization_id` references remain

**Verification gate:**
```bash
uv run pytest packages/grove/tests/ --tb=short -q
# Expected: 0 in non-migration code. Alembic migrations may reference legacy column names.
rg "organization_id" packages/grove/src/ --glob '!packages/grove/src/grove/alembic/versions/*' --count
```

**Context budget:** ~40K tokens
**Depends on:** Phase 1.0
**Can run in parallel with:** none

---

#### Phase 1.2: Add tenant_id to grove.messages and grove.checkpoints [DONE]

**Objective:** Add direct `tenant_id` column to `grove.messages` and `grove.checkpoints` tables. RLS policies require direct tenant_id on every table — FK joins are not sufficient.

**Input:**
- Architecture doc Section 6.1.1: Required columns per grove.* table
- Current: messages has FK to chats only, checkpoints missing tenant_id entirely

**Deliverables:**
- Alembic migration: `ALTER TABLE grove.messages ADD COLUMN tenant_id UUID`
- Alembic migration: `ALTER TABLE grove.checkpoints ADD COLUMN tenant_id UUID`
- Backfill: `UPDATE grove.messages SET tenant_id = (SELECT tenant_id FROM grove.chats WHERE chats.id = messages.chat_id)`
- Updated store implementations to populate tenant_id on INSERT
- NOT NULL constraint added after backfill

**Tests:**
- Unit tests for updated stores
- Migration test (up + down)

**Verification gate:**
```bash
uv run pytest packages/grove/tests/unit/ --tb=short -q
uv run pyright packages/grove/src/
```

**Context budget:** ~30K tokens
**Depends on:** Phase 1.1 (tenant_id name must be settled)
**Can run in parallel with:** Phase 1.3

---

#### Phase 1.3: Temporal name prefixing [DONE]

**Objective:** Prefix all Grove core workflow and activity names with `grove.` per Section 7.4 naming convention.

**Input:**
- Architecture doc Section 7.4: `grove.{workflow}`, `grove.{activity}`
- Current: flat names like `process_message`, `ConversationWorkflow`

**Deliverables:**
- All `@workflow.defn` name attributes updated (e.g., `name="grove.ConversationWorkflow"`)
- All `@activity.defn` name attributes updated (e.g., `name="grove.process_message"`)
- All string references in `workflow.execute_activity()` calls updated
- Name constants module: `packages/grove/src/grove/temporal/names.py`
- Task queue renamed: `grove-agents` → `grove-agent`

**Tests:**
- `test_temporal_naming.py` — CI test that scans all @workflow.defn and @activity.defn for grove.* prefix
- All existing Temporal tests pass with new names

**Verification gate:**
```bash
uv run pytest packages/grove/tests/ --tb=short -q
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
rg 'task_queue.*grove-agents' packages/grove/ --count  # Expected: 0
```

**Context budget:** ~35K tokens
**Depends on:** Phase 1.0
**Can run in parallel with:** Phase 1.2

---

## Verification Evidence

2026-02-22:

```bash
uv run pyright packages/grove/src/  # 0 errors
uv run ruff check packages/grove/src/ packages/grove/tests/  # All checks passed
uv run ruff format packages/grove/src/ packages/grove/tests/ --check  # already formatted
uv run pytest packages/grove/tests/ --tb=short -q  # 791 passed, 7 skipped
```
