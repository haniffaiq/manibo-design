# T22: Architecture boundary tests

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T22 - {short description}`

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

Add architecture boundary tests ensuring the autonomous runtime follows Grove's layering rules. All new modules introduced by M33 must obey the same dependency hierarchy as existing code: `core/` imports nothing from other grove packages, `runtime/` imports only from `core/` and `config/` and `tools/`, `temporal/` imports only from `core/` and `temporal/`, `backends/` imports only from `core/`, `cli/` imports from everything except `temporal/`, and `tools/system/` imports only from `core/` and `tools/`.

These tests are additive -- they extend the existing `test_import_boundaries.py` without modifying existing rules.

## Subtasks

- [ ] **Read existing boundary test file**: Read `packages/grove/tests/unit/architecture/test_import_boundaries.py` in full. Understand the testing technique (AST import analysis, allowed-import declarations, test parametrization). All new rules must follow the exact same pattern.
- [ ] **Add rule: `core/memories.py` imports nothing from grove**: The memory protocol file in `core/` must not import from any other grove subpackage (`runtime/`, `temporal/`, `tools/`, `backends/`, `config/`, `cli/`). Only stdlib and Pydantic imports allowed.
- [ ] **Add rule: `core/skills.py` imports nothing from grove**: Same constraint as `core/memories.py`. Only stdlib and Pydantic imports allowed.
- [ ] **Add rule: `runtime/autonomous.py` imports only from allowed packages**: Allowed: `grove.core`, `grove.config`, `grove.tools`, `grove.providers`. Disallowed: `grove.temporal`, `grove.backends`, `grove.cli`. Same import rules as `runtime/executor.py`.
- [ ] **Add rule: `runtime/compressor.py` imports only from `core/`**: The context compressor must not import from `runtime/` (no cross-imports within runtime), `temporal/`, `backends/`, `cli/`. Allowed: `grove.core` only.
- [ ] **Add rule: `runtime/memory_flush.py` imports only from `core/` and `runtime/`**: Memory flush needs compressor types from `runtime/`. Disallowed: `grove.temporal`, `grove.backends`, `grove.cli`. Allowed: `grove.core`, `grove.runtime`.
- [ ] **Add rule: `runtime/ptc.py` imports only from `core/` and `tools/`**: PTC (programmatic tool calling) needs tool types. Disallowed: `grove.temporal`, `grove.backends`, `grove.cli`, other `grove.runtime` modules.
- [ ] **Add rule: `tools/system/*` autonomous tools import only from `core/` and `tools/`**: Applies to all new system tools: `delegate_autonomous_tool.py`, `memory_tool.py`, `skill_list_tool.py`, `skill_view_tool.py`, `skill_manage_tool.py`, `terminal_tool.py`, `code_execution_tool.py`, `command_approval.py`, `session_search_tool.py`. Disallowed: `grove.runtime`, `grove.temporal`, `grove.backends`, `grove.cli`. Note: `temporalio.client` (external library) is allowed for `delegate_autonomous_tool.py` -- only `grove.temporal` (internal) is forbidden.
- [ ] **Add rule: `backends/postgres/memory_store.py` imports only from `core/`**: The memory store implementation must only reference core types. Disallowed: `grove.runtime`, `grove.temporal`, `grove.tools`, `grove.cli`, `grove.config`.
- [ ] **Add rule: `backends/postgres/skill_store.py` imports only from `core/`**: Same constraint as memory store.
- [ ] **Add rule: `temporal/autonomous_workflow.py` imports only from `core/` and `temporal/`**: The workflow definition imports core types and temporal utilities. Disallowed: `grove.runtime`, `grove.backends`, `grove.tools`, `grove.cli`.
- [ ] **Add rule: `temporal/autonomous_activities.py` imports only from allowed packages**: Allowed: `grove.core`, `grove.config`, `grove.runtime`, `grove.temporal`. Disallowed: `grove.tools` (activities use stores, not tools directly), `grove.backends`, `grove.cli`.
- [ ] **Add rule: `cli/` imports only from allowed packages**: Allowed: `grove.core`, `grove.config`, `grove.runtime`, `grove.backends`, `grove.tools`. Disallowed: `grove.temporal` (CLI is standalone, no Temporal dependency).
- [ ] **Add rule: No new file imports from `platform-core` or `solutions`**: Verify all new M33 files maintain Grove independence. No imports from `packages/platform-core/` or `solutions/`. This is the fundamental Grove independence rule.
- [ ] **Verify all new files have `from __future__ import annotations`**: Add a test that checks every new Python file in the M33 scope has this import as the first import statement.
- [ ] **Run existing architecture tests to confirm no regression**: All existing boundary rules continue to pass with the new files present.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/tests/unit/architecture/test_import_boundaries.py` | Modify | Add boundary rules for all new M33 modules (~80 lines of additions) |

## Implementation Notes

- **Read `packages/grove/tests/unit/architecture/test_import_boundaries.py` first.** This is the only file you modify. Understand its full structure before adding rules.
- **Additive only:** Do NOT modify or remove existing rules. Only add new test cases, new parametrize entries, or new test functions.
- **Use the same testing technique:** The existing file uses one of these approaches (determine by reading):
  - AST analysis: parse the file, walk `Import`/`ImportFrom` nodes, check against allowed list
  - `importlib`: dynamically import and inspect
  - Static text analysis: read file content and regex-match import statements
  Match whichever technique is already in use.
- **File existence guards:** Some files (T05-T24) may not exist yet when running tests in isolation. Use conditional skips (`pytest.mark.skipif` or file existence checks) so the test suite does not fail if an M33 file has not been created yet. Alternatively, if the existing test infrastructure handles missing files gracefully, follow that pattern.
- **The `grove.temporal` vs `temporalio` distinction is critical:** `grove.temporal` is an internal package (importing it creates coupling to Temporal-specific Grove code). `temporalio` is an external library (importing `temporalio.client.Client` is fine for type hints in tools). The boundary rules should block `from grove.temporal import ...` but allow `from temporalio.client import Client`.
- **Test ordering:** New tests should be grouped logically (e.g., "autonomous runtime boundary tests") and placed after existing tests, not interleaved.
- **Parametrize if possible:** If the existing file uses `@pytest.mark.parametrize` for boundary rules, add new entries to the existing parametrize list rather than creating separate test functions for each file.

## Acceptance Criteria

- [ ] All new M33 files follow Grove's dependency hierarchy
- [ ] `core/` files import nothing from other grove subpackages
- [ ] `runtime/` files do not import from `temporal/`, `backends/`, or `cli/`
- [ ] `tools/system/` files do not import from `runtime/`, `temporal/` (internal), `backends/`, or `cli/`
- [ ] `backends/` files import only from `core/`
- [ ] `temporal/` files do not import from `backends/`, `tools/`, or `cli/`
- [ ] `cli/` files do not import from `temporal/`
- [ ] No M33 file imports from `platform-core` or `solutions` (Grove independence)
- [ ] All new files have `from __future__ import annotations`
- [ ] Existing architecture boundary tests continue to pass (no regression)
- [ ] Tests run as part of existing architecture test suite: `uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short`
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes on test file
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on modified file

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T05 (AutonomousExecutor -- the first runtime module that needs boundary enforcement)
- Target file: `packages/grove/tests/unit/architecture/test_import_boundaries.py`
- Grove independence rule: `CLAUDE.md` rule #1 ("Grove independence: packages/grove/** is product-agnostic")
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
