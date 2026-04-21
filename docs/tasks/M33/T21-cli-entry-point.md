# T21: CLI entry point

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T05, T03, T04, T08, T10, T11, T12

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T21 - {short description}`

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

Implement the standalone CLI for the Grove autonomous runtime. The CLI provides a way to run autonomous tasks without Temporal, connecting directly to PostgreSQL. This is the developer/operator interface for testing, debugging, and running one-off autonomous tasks.

- `grove run --goal "..."` executes an autonomous task directly (no Temporal) and prints the result.
- `grove chat` starts an interactive REPL session.
- `grove memory` manages persistent memory state.
- `grove skills` manages skills.

The CLI connects to PostgreSQL for persistence (stores) but does not require a Temporal server, API server, or FastAPI instance. It bootstraps the minimal set of dependencies needed for `AutonomousExecutor` to run standalone.

## Subtasks

- [ ] **Create CLI package**: Create `packages/grove/src/grove/cli/__init__.py` (empty) and `packages/grove/src/grove/cli/main.py` as the entry point.
- [ ] **Implement CLI framework**: Use `click` (already a Grove dependency -- verify in `pyproject.toml`). If click is not available, use `argparse` from stdlib. Define the top-level `grove` group command.
- [ ] **Implement `grove run` command**: Options: `--goal` (required, string), `--model` (optional, default `"anthropic/claude-sonnet-4-20250514"`), `--agent` (optional, agent config name from YAML), `--max-iterations` (optional, int), `--tools` (optional, comma-separated tool names), `--database-url` (optional, overrides env var). Connects to PostgreSQL, creates `AutonomousExecutor`, calls `execute()` directly (not via Temporal workflow). Streams response to stdout. Prints final summary: duration, iterations, tool calls.
- [ ] **Implement `grove chat` command**: Interactive REPL. Options: `--model` (optional), `--agent` (optional), `--database-url` (optional). Prompt loop: read user input via `input()` or `click.prompt()`, pass to executor, print response, repeat. Chat history maintained in memory across turns. `Ctrl+C` triggers graceful exit with memory flush (if memory store is configured). Print welcome message and instructions on start.
- [ ] **Implement `grove memory list` command**: Show all memory entries for the current agent. Options: `--agent` (required or default), `--database-url` (optional). Queries `PostgresMemoryStore` and prints entries in a readable format.
- [ ] **Implement `grove memory show` command**: `grove memory show memory` or `grove memory show user`. Show the content of a specific memory target. Options: `--agent` (required or default), `--database-url` (optional).
- [ ] **Implement `grove skills list` command**: Show all skills for the current agent. Options: `--agent` (required or default), `--database-url` (optional). Queries `PostgresSkillStore` and prints skill summaries (name, description, category, version, status).
- [ ] **Implement `grove skills show <name>` command**: Show full content of a specific skill. Options: `--agent` (required or default), `--database-url` (optional). Queries `PostgresSkillStore.get_skill()` and prints full content.
- [ ] **Create standalone bootstrap module**: Create `packages/grove/src/grove/cli/standalone_bootstrap.py`. This module wires all dependencies for standalone execution without Temporal or API server: create `asyncpg.Pool`, instantiate `PostgresMemoryStore`, `PostgresSkillStore`, `PostgresConversationStore`, build `ToolRegistry` with autonomous tools, create `AutonomousExecutor`. Returns a ready-to-use executor.
- [ ] **Database URL resolution**: Resolve database URL from (in priority order): `--database-url` CLI flag, `GROVE_DATABASE_URL` env var. If neither is set, print error and exit.
- [ ] **Register entry point in pyproject.toml**: Add `[project.scripts]` entry: `grove = "grove.cli.main:cli"`. Verify the entry point works after `uv sync`.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/cli/test_cli.py`. Test: (a) `grove run` requires `--goal`, (b) `grove chat` starts without errors (mock input/executor), (c) `grove memory list` and `grove memory show` call correct store methods, (d) `grove skills list` and `grove skills show` call correct store methods, (e) database URL resolution priority (flag > env var > error).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/cli/__init__.py` | Create | Package init (empty) |
| `packages/grove/src/grove/cli/main.py` | Create | CLI entry point + command definitions (~150 lines) |
| `packages/grove/src/grove/cli/standalone_bootstrap.py` | Create | Wire PostgreSQL stores for standalone mode (~100 lines) |
| `packages/grove/pyproject.toml` | Modify | Add `[project.scripts]` entry for `grove` CLI |
| `packages/grove/tests/unit/cli/test_cli.py` | Create | Unit tests for CLI argument parsing and commands (~120 lines) |

## Implementation Notes

- **Read `packages/grove/src/grove/runtime/executor.py` first.** Understand how the existing `AgentExecutor` is constructed. `AutonomousExecutor` (from T05) follows a similar constructor pattern. The standalone bootstrap needs to provide the same dependencies.
- **Read `packages/grove/pyproject.toml` to check existing dependencies.** Verify `click` is available. If not, use `argparse`.
- **Standalone tenant identity uses deterministic UUIDs:** Current PostgreSQL stores cast `tenant_id` to `::uuid` (see `conversation_store.py:55`). String sentinels like `"standalone"` will blow up at runtime. Define constants: `STANDALONE_TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")` and `STANDALONE_USER_ID = UUID("00000000-0000-0000-0000-000000000002")` in `standalone_bootstrap.py`. The standalone bootstrap must also seed the tenant row in the database (INSERT ON CONFLICT DO NOTHING) so RLS policies pass.
- **Standalone bootstrap creates:** asyncpg pool (from database URL), `PostgresMemoryStore(pool)`, `PostgresSkillStore(pool)`, `PostgresConversationStore(pool)`, `ToolRegistry` with all autonomous tools (memory, skill_list, skill_view, skill_manage, terminal, execute_code), `AutonomousExecutor` wired with stores and filtered tool registry.
- **No Temporal dependency:** The CLI must not import from `grove.temporal`. The `cli/` package imports from `core/`, `config/`, `runtime/`, `backends/`, and `tools/` only. This is enforced by T22 architecture boundary tests.
- **No API server, no FastAPI:** The CLI runs the executor inline in the same process. No HTTP server, no SSE streaming.
- **For `grove run`:** Call `AutonomousExecutor.execute()` directly and await the result. Print the response to stdout. Print a summary line: `"Completed in {duration:.1f}s -- {iterations} iterations, {tool_calls} tool calls"`.
- **For `grove chat`:** Wrap the REPL in `asyncio.run()`. Each turn: read input, append to conversation history (in-memory list), pass full history to executor, print response, append response to history. Save conversation to DB per turn if conversation store is available.
- **Minimal config for quick start:** `grove run --model anthropic/claude-sonnet-4-20250514 --goal "Research X"` should work with defaults for everything else (no agent YAML required). When `--agent` is not specified, create a minimal agent config from `--model` and `--tools`.
- **Async entrypoint:** Click commands are synchronous, but the executor is async. Use `asyncio.run()` inside each command to bridge sync CLI to async executor. Or use `click` with `asyncio` via a thin wrapper.
- **Graceful shutdown in chat:** Catch `KeyboardInterrupt` in the REPL loop. On `Ctrl+C`, flush any pending memory writes (call `AutonomousExecutor.flush_memory()` if available) and print goodbye message.

## Acceptance Criteria

- [ ] `grove run --goal "..."` executes autonomous task and prints result to stdout
- [ ] `grove run` prints summary (duration, iterations, tool calls) after completion
- [ ] `grove chat` starts interactive REPL with multi-turn conversation support
- [ ] `grove chat` handles `Ctrl+C` gracefully with memory flush
- [ ] `grove memory list` shows current memory entries
- [ ] `grove memory show memory|user` shows specific memory target content
- [ ] `grove skills list` shows skill summaries (name, description, category, version, status)
- [ ] `grove skills show <name>` shows full skill content
- [ ] No Temporal dependency in CLI or standalone_bootstrap modules
- [ ] PostgreSQL connection via `--database-url` flag or `GROVE_DATABASE_URL` env var
- [ ] Entry point registered in `pyproject.toml` and works after `uv sync`
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests pass for CLI argument parsing and command routing

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependencies: T05 (AutonomousExecutor), T03 (PostgresMemoryStore), T11 (PostgresSkillStore)
- Pattern reference: `packages/grove/src/grove/runtime/executor.py` (executor construction)
- Pattern reference: `packages/grove/src/grove/backends/postgres/checkpoint_store.py` (store construction with asyncpg pool)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
