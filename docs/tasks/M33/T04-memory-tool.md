# T04: Memory tool

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
   - Commit message format: `feat: M33 T04 - {short description}`

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

Implement the memory tool that autonomous agents use to add, replace, and remove entries from hot memory. This is a single tool with an `action` parameter that routes to the appropriate operation. Follows the Hermes frozen snapshot pattern -- the tool persists writes to the database immediately, and its response shows the current live state, but the system prompt remains frozen until the next session or compression cycle. This ensures prefix cache stability while giving the agent awareness of its own memory state.

Content is stored as a single string with `\n\S\n` (section sign, U+00A7) delimiters separating individual entries. The tool handles parsing and assembly of this delimited format. The store layer (T03) treats content as opaque text.

## Subtasks

- [ ] **Create MemoryTool class**: Subclass `GroveBaseTool`. Set `name = "memory"`, `is_system = True`. Constructor accepts `memory_store: MemoryStore` (injected at registration time, stored as instance attribute).
- [ ] **Define JSON Schema for tool parameters**: `action` (enum: `"add"`, `"replace"`, `"remove"`), `target` (enum: `"memory"`, `"user"`), `content` (string, required for `add` and `replace`), `old_text` (string, required for `replace` and `remove`). All four parameters in a single flat schema object.
- [ ] **Implement execute() with action routing**: Parse `action` from params, dispatch to `_handle_add()`, `_handle_replace()`, `_handle_remove()` private methods. Each returns the structured response dict.
- [ ] **Add action**: Validate content not empty, validate content doesn't exceed remaining capacity (current_chars + len(content) + delimiter_len <= char_limit), check injection patterns (delegate to store or local check), parse existing content into entries list, check for duplicate (if content already exists as an entry, return success with "Entry already exists" message), append new entry, join with delimiter, persist via `memory_store.save()`.
- [ ] **Replace action**: Parse existing content into entries list, find entries matching `old_text` via substring search (`old_text in entry`), if zero matches return error "No entry matches the given text", if multiple matches return error with numbered previews of all matching entries (first 80 chars each), if exactly one match replace that entry's content with `content`, validate new total doesn't exceed char_limit, persist.
- [ ] **Remove action**: Parse existing content into entries list, find entries matching `old_text` via substring search, same ambiguity handling as replace, if exactly one match remove that entry from list, persist (or delete if no entries remain).
- [ ] **Return structured response**: Dict with keys: `success: bool`, `target: str`, `entries: list[str]` (current entries after operation), `usage: str` (formatted as `"45% -- 990/2200 chars"`), `entry_count: int`, `message: str` (human-readable result description).
- [ ] **Emit runtime event**: On successful mutation, emit `StreamChunk(type="autonomous.memory_mutation", content=json.dumps({"action": action, "target": target, "content_preview": first_100_chars}))` via `context.runtime_event_sink` (if available). This flows through pg_notify → SSE → operator console evidence rail.
- [ ] **Write tool description with behavioral guidance**: The `description` field should include guidance for the LLM on when to use memory: save durable facts (project context, user preferences, key decisions), avoid saving transient data (file contents, long logs), prioritize quality over quantity. Keep description under 300 chars.
- [ ] **Unit tests**: Test all three actions (add/replace/remove), char limit enforcement, duplicate detection, ambiguous match handling, empty content rejection, injection blocking, usage calculation.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/memory_tool.py` | Create | MemoryTool implementation |
| `packages/grove/tests/unit/tools/system/test_memory_tool.py` | Create | Unit tests for memory tool |

## Implementation Notes

- **Read `tools/base.py` and an existing system tool first.** Check `tools/system/time.py` or `tools/system/send_message.py` for the pattern. Match their class structure exactly.
- **GroveBaseTool interface:** `name: str`, `description: str`, `parameters: dict[str, Any]` (JSON Schema), `is_system: bool`, `async execute(params: dict[str, Any], context: ToolContext) -> Any`.
- **Entry delimiter:** `ENTRY_DELIMITER = "\n\u00a7\n"` (newline + section sign + newline). Define as module-level constant.
- **Entry parsing:** `content.split(ENTRY_DELIMITER)` to get list, filter out empty strings. `ENTRY_DELIMITER.join(entries)` to reassemble.
- **Char limits from MemoryTarget:** The char limit depends on the target. Use constants from `core/memories.py`: `MEMORY_CHAR_LIMIT = 2200` for target `"memory"`, `USER_CHAR_LIMIT = 1375` for target `"user"`.
- **Substring matching for replace/remove:** Use `old_text in entry` (simple substring containment). NOT regex, NOT fuzzy match. If the user provides ambiguous text that matches multiple entries, force them to be more specific.
- **Ambiguous match previews:** When multiple entries match, format as: `"Multiple entries match (N found). Be more specific:\n1. {entry[:80]}...\n2. {entry[:80]}..."`.
- **Duplicate detection on add:** Before appending, check `if content in existing_entries`. If found, return success (idempotent) with message "Entry already exists".
- **Injection scanning:** The store layer (T03) handles injection scanning on save. The tool layer should NOT duplicate this logic. If the store raises `ValueError`, catch it and return `{success: False, message: str(error)}`.
- **ToolContext provides tenant_id and agent_id:** Extract from `context.tenant_id` and `context.agent_name` (check the actual field names in `ToolContext`).
- **Memory store can be None:** If `memory_store` is None (memory not configured), return `{success: False, message: "Memory not available for this agent"}`.
- **Usage calculation:** `percent = int((len(content) / char_limit) * 100)`, format as `f"{percent}% -- {len(content)}/{char_limit} chars"`.

## Acceptance Criteria

- [ ] `MemoryTool` registered as system tool (`is_system = True`)
- [ ] `add` action appends entry and persists
- [ ] `replace` action finds and replaces single matching entry
- [ ] `remove` action finds and removes single matching entry
- [ ] Char limit enforced with clear error (shows current usage vs limit)
- [ ] Ambiguous substring match returns error with numbered previews of all matches
- [ ] Duplicate `add` is idempotent (succeeds silently)
- [ ] Empty content rejected for `add` and `replace`
- [ ] Response includes usage percentage string
- [ ] Response includes current entries list (live state)
- [ ] Store-level injection errors caught and returned as `{success: False}`
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests pass

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Protocol from T01: `packages/grove/src/grove/core/memories.py`
- Base class: `packages/grove/src/grove/tools/base.py`
- System tool examples: `packages/grove/src/grove/tools/system/time.py`, `packages/grove/src/grove/tools/system/send_message.py`
- Tool context: `packages/grove/src/grove/tools/types.py`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
