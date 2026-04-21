# T14: Session search tool

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T13

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T14 - {short description}`

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

Implement the `SessionSearchTool` for episodic recall. Allows autonomous agents to search past conversation history using full-text search on `grove.messages`. Results are grouped by `chat_id`, and the top matching sessions are summarized by an auxiliary LLM call. This gives the autonomous agent the ability to recall "what happened last time we discussed X" without loading entire conversation histories.

The tool is a system tool (`is_system=True`) -- it is injected by the runtime, not configured by operators.

## Subtasks

- [ ] **Create `SessionSearchTool` subclassing `GroveBaseTool`**: Set `is_system = True`. Tool name: `"session_search"`. Description: `"Search your past conversations. Returns summaries of relevant sessions."`.
- [ ] **Define JSON schema for tool input**: `query` (string, required -- the search query), `max_sessions` (integer, optional, default 5 -- max number of sessions to return).
- [ ] **Implement FTS query**: Execute against `grove.messages` using the `search_vector` column from T13:
  ```sql
  SELECT m.chat_id, m.content, m.role, m.created_at,
         ts_rank(m.search_vector, query) AS rank
  FROM grove.messages m, plainto_tsquery('english', $1) query
  WHERE m.search_vector @@ query
  ORDER BY rank DESC
  LIMIT $2
  ```
  Use a generous raw result limit (e.g., 100 rows) to allow grouping, then truncate after grouping.
- [ ] **Group results by `chat_id`**: Collect matching messages per session. Take the top N sessions by aggregate rank (sum or max rank across messages in each session).
- [ ] **Exclude current session lineage**: If the current `chat_id` has a `parent_id` chain (session spawned from another session), exclude all `chat_id` values in that chain from results. This prevents the agent from "finding" its own current conversation.
- [ ] **Load and truncate session transcripts**: For each top session, load the full message transcript (via `ConversationStore` or direct query). Truncate to ~3K characters to stay within auxiliary LLM context budget.
- [ ] **Summarize via auxiliary LLM call**: For each top session, call an auxiliary LLM (cheap/fast model, same approach as compression summarization) with the truncated transcript and a summarization prompt. Keep summaries concise (~200 words per session).
- [ ] **Return structured results**: List of dicts, each containing: `chat_id` (str), `title` (str -- from chat metadata or first user message), `relevance_score` (float), `summary` (str), `message_count` (int), `date_range` (str -- "YYYY-MM-DD to YYYY-MM-DD").
- [ ] **Handle empty results gracefully**: If no sessions match, return a clear message like "No past conversations found matching your query."
- [ ] **Unit tests with mocked DB and LLM**: Test search with results, empty results, current session exclusion, grouping logic, and summary generation.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/session_search_tool.py` | Create | SessionSearchTool implementation (~150 lines) |
| `packages/grove/tests/unit/tools/system/test_session_search_tool.py` | Create | Unit tests with mocked DB and LLM |

## Implementation Notes

- **Read `tools/base.py` first.** Understand the `GroveBaseTool` interface: `name`, `description`, `parameters` (JSON schema), `is_system`, and the `execute()` method signature.
- **Read existing system tools** (e.g., `tools/system/time.py` or `tools/system/context.py`) for the exact subclass pattern, import style, and how `ToolContext` is accessed.
- **Reference design:** `wiki/queries/research-grove-autonomous-runtime-design.md` section on session search.
- **`ConversationStore` is available via `ToolContext`** -- use it for loading message history. The FTS query itself requires direct DB access (the `search_vector` column is not exposed through `ConversationStore`).
- **Direct DB access:** Use `pg_pool` from `ToolContext` or `GroveActivityContext` for the raw FTS query. Follow the same `pool.acquire()` + `set_config('app.tenant_id', ...)` pattern as other postgres backends.
- **Session lineage exclusion:** Query `grove.chats` for the `parent_id` chain of the current `chat_id`. Build an exclusion set of all ancestor and descendant chat_ids. Use `WHERE m.chat_id NOT IN (...)` in the FTS query.
- **Auxiliary LLM for summarization:** Use the same lightweight model approach as context compression. The summarization prompt should be minimal: "Summarize this conversation transcript in 2-3 sentences. Focus on what was discussed, decided, or accomplished."
- **Tenant isolation via RLS:** The FTS query automatically scopes to the current tenant when `app.tenant_id` is set. No manual tenant filtering needed in the WHERE clause.
- **Performance:** The GIN index from T13 makes FTS queries fast. The main cost is the auxiliary LLM calls for summarization. Limit to `max_sessions` (default 5) to bound latency.
- **No imports from outside `grove` package.** This is a Layer-1 component.

## Acceptance Criteria

- [ ] `SessionSearchTool` subclasses `GroveBaseTool` with `is_system = True`
- [ ] FTS query uses `search_vector` column and `plainto_tsquery()`
- [ ] Results grouped by session (`chat_id`) with aggregate relevance ranking
- [ ] Current session lineage excluded from results
- [ ] Top sessions summarized via auxiliary LLM call
- [ ] Structured results returned with `chat_id`, `title`, `relevance_score`, `summary`, `message_count`, `date_range`
- [ ] Empty results handled gracefully
- [ ] Tenant isolation maintained via RLS
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass with mocked DB and LLM

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- FTS migration: T13 (`packages/grove/src/grove/sql/migrations/011_add_messages_fts.sql`)
- Tool base class: `packages/grove/src/grove/tools/base.py`
- System tool pattern: `packages/grove/src/grove/tools/system/time.py`
- Conversation store: `packages/grove/src/grove/core/conversations.py`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
