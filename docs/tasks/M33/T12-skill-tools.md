# T12: Skill tools (list, view, manage)

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T12 - {short description}`

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

Implement three skill tools for autonomous agents: `skill_list` (browse available skills), `skill_view` (load full skill content), and `skill_manage` (create, patch, edit, delete skills). These tools follow a progressive disclosure pattern: the skill index (Level 0, ~50 tokens per skill) is always available in the system prompt. Full skill content (Level 1, ~1-5K tokens) is loaded on demand via `skill_view`. Skill mutations happen through `skill_manage`.

Skills are the bridge between autonomous and rail agents: autonomous agents learn procedures and save them as skills. Rail agents consume these skills in their system prompts. The tools enable the autonomous agent side of this workflow.

## Subtasks

- [ ] **Create SkillListTool**: Define in `packages/grove/src/grove/tools/system/skill_list_tool.py` subclassing `GroveBaseTool`. Set `name = "skill_list"`, `is_system = True`. Constructor takes `skill_store: SkillStore` (DI). Add `from __future__ import annotations` at top.
- [ ] **Implement SkillListTool.execute()**: Call `self._skill_store.list_skills(tenant_id=context.tenant_id, agent_id=context.agent_id)`. Format results as compact text suitable for system prompt inclusion. Format: one line per skill: `"- {name} (v{version}, {category}): {description}"`. Return dict with `skills` (formatted string) and `count` (int).
- [ ] **SkillListTool JSON schema**: Parameters: none required. The tool uses `tenant_id` and `agent_id` from `ToolContext`.
- [ ] **SkillListTool description**: "List all available skills. Returns a compact index of skill names, versions, categories, and descriptions. Use this to see what skills exist before viewing or managing them."
- [ ] **Create SkillViewTool**: Define in `packages/grove/src/grove/tools/system/skill_view_tool.py` subclassing `GroveBaseTool`. Set `name = "skill_view"`, `is_system = True`. Constructor takes `skill_store: SkillStore` (DI). Add `from __future__ import annotations` at top.
- [ ] **Implement SkillViewTool.execute()**: Takes `name` (string, required) parameter. Call `self._skill_store.get_skill(tenant_id=context.tenant_id, agent_id=context.agent_id, skill_name=params["name"])`. If not found, return `{"error": f"Skill '{name}' not found."}`. If found, return dict with `name`, `description`, `category`, `version`, `status`, `content` (the full skill text), `version_count` (total versions).
- [ ] **SkillViewTool JSON schema**: Parameters: `name` (string, required, description: "Name of the skill to view").
- [ ] **SkillViewTool description**: "Load the full content of a skill by name. Use skill_list first to see available skills. Returns the complete skill text, metadata, and version info."
- [ ] **Create SkillManageTool**: Define in `packages/grove/src/grove/tools/system/skill_manage_tool.py` subclassing `GroveBaseTool`. Set `name = "skill_manage"`, `is_system = True`. Constructor takes `skill_store: SkillStore` (DI). Add `from __future__ import annotations` at top.
- [ ] **Implement SkillManageTool.execute()**: Dispatch on `action` parameter:
  - `action="create"`: Requires `name`, `description`, `content`. Optional `category` (default "general"). Call `skill_store.create_skill(...)` with `source=SkillChangeSource.AGENT_CREATE`. Return created skill summary.
  - `action="patch"`: Requires `name`, `old_string`, `new_string`. Call `skill_store.update_skill(...)` with `old_string`, `new_string`, `source=SkillChangeSource.AGENT_PATCH`. Return updated skill summary.
  - `action="edit"`: Requires `name`, `content`. Optional `description`. Call `skill_store.update_skill(...)` with full content replacement, `source=SkillChangeSource.AGENT_PATCH`. Return updated skill summary.
  - `action="delete"`: Requires `name`. Call `skill_store.delete_skill(...)`. Return confirmation message.
  - Unknown action: Return `{"error": f"Unknown action '{action}'. Valid actions: create, patch, edit, delete"}`.
- [ ] **Emit runtime event on skill mutation**: On successful create/patch/edit/delete, emit `StreamChunk(type="autonomous.skill_mutation", content=json.dumps({"action": action, "name": name, "version": version}))` via `context.runtime_event_sink` (if available). This flows through pg_notify → SSE → operator console evidence rail.
- [ ] **SkillManageTool JSON schema**: Parameters: `action` (string, required, enum: ["create", "patch", "edit", "delete"], description: "Operation to perform"), `name` (string, required, description: "Skill name"), `description` (string, optional, description: "Skill description (for create and edit)"), `content` (string, optional, description: "Full skill content (for create and edit)"), `category` (string, optional, description: "Skill category (for create, default 'general')"), `old_string` (string, optional, description: "Text to find and replace (for patch)"), `new_string` (string, optional, description: "Replacement text (for patch)").
- [ ] **SkillManageTool description**: "Manage agent skills: create, patch, edit, or delete. Create skills when you discover reusable procedures or domain knowledge. Prefer 'patch' (old_string/new_string) over 'edit' (full replacement) — patch is more token-efficient and preserves unchanged content. Delete archives the skill (soft delete, recoverable)."
- [ ] **Content validation**: Enforce `SKILL_CHAR_LIMIT` (15360 chars, from `grove.core.skills`) on create and edit actions. Return `{"error": f"Content exceeds {SKILL_CHAR_LIMIT} character limit ({len(content)} chars)."}` if exceeded. Patch validation happens in the store layer.
- [ ] **Error handling**: Wrap store calls in try/except for `ValueError` (raised by store on injection detection, char limit, missing old_string for patch). Return `{"error": str(e)}` on ValueError. Let other exceptions propagate.
- [ ] **Unit tests for SkillListTool**: Create `packages/grove/tests/unit/tools/system/test_skill_list_tool.py` testing: (a) returns formatted skill index, (b) returns empty list when no skills, (c) format matches expected compact layout.
- [ ] **Unit tests for SkillViewTool**: Create `packages/grove/tests/unit/tools/system/test_skill_view_tool.py` testing: (a) returns full skill content for existing skill, (b) returns error for missing skill.
- [ ] **Unit tests for SkillManageTool**: Create `packages/grove/tests/unit/tools/system/test_skill_manage_tool.py` testing: (a) create action creates skill, (b) patch action patches skill, (c) edit action replaces content, (d) delete action archives skill, (e) unknown action returns error, (f) content exceeding char_limit returns error, (g) ValueError from store returned as error.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/skill_list_tool.py` | Create | SkillListTool (~80 lines) |
| `packages/grove/src/grove/tools/system/skill_view_tool.py` | Create | SkillViewTool (~80 lines) |
| `packages/grove/src/grove/tools/system/skill_manage_tool.py` | Create | SkillManageTool (~150 lines) |
| `packages/grove/tests/unit/tools/system/test_skill_list_tool.py` | Create | Unit tests for SkillListTool |
| `packages/grove/tests/unit/tools/system/test_skill_view_tool.py` | Create | Unit tests for SkillViewTool |
| `packages/grove/tests/unit/tools/system/test_skill_manage_tool.py` | Create | Unit tests for SkillManageTool |

## Implementation Notes

- **Progressive disclosure is the design principle:** Level 0 (skill_list output, ~50 tokens/skill) is injected into the system prompt at session start (handled by AutonomousExecutor, not by these tools). Level 1 (skill_view, ~1-5K tokens per skill) is loaded on demand when the agent needs the full content. The tools implement Level 0 and Level 1 retrieval plus mutation.
- **Pattern reference:** Read `packages/grove/src/grove/tools/system/send_message.py` for the GroveBaseTool subclassing pattern with constructor DI. Match: `from __future__ import annotations`, class attributes for `name`/`description`/`parameters`/`is_system`, constructor storing the store, `execute()` method signature.
- **ToolContext provides tenant_id and agent_id:** All store calls need these. Extract from `context.tenant_id` and `context.agent_id`. Read `packages/grove/src/grove/tools/types.py` to verify `ToolContext` field names.
- **SkillChangeSource enum:** Import from `grove.core.skills` (defined in T01). Use `SkillChangeSource.AGENT_CREATE` for create action, `SkillChangeSource.AGENT_PATCH` for both patch and edit actions.
- **Logging:** Use `grove.logger.create_logger()`. Log skill mutations at DEBUG level (create, patch, edit, delete) with skill name. Do not log full skill content (too verbose).
- **No business logic in tools:** Tools are thin wrappers around SkillStore. Validation (char_limit, injection) lives in the store. The only tool-side validation is the char_limit pre-check for create/edit to give a cleaner error message before hitting the DB.

## Acceptance Criteria

- [ ] `skill_list` returns compact skill index formatted as one line per skill
- [ ] `skill_view` loads full skill content by name, returns error for missing skills
- [ ] `skill_manage` create/patch/edit/delete all dispatch correctly to SkillStore
- [ ] Patch (old_string/new_string) preferred over edit (full replacement) — documented in tool description
- [ ] `SKILL_CHAR_LIMIT` enforced on create and edit actions
- [ ] ValueError from store returned as `{"error": ...}` (not raised as exception)
- [ ] All three tools use `SkillStore` via constructor DI
- [ ] All three tools set `is_system = True`
- [ ] `tenant_id` and `agent_id` sourced from `ToolContext`
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests cover all actions, error paths, and edge cases for each tool

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T11 (PostgreSQL skill store — provides PostgresSkillStore)
- Dependency: T01 (Store protocols — provides SkillStore protocol, Skill/SkillSummary models, SkillChangeSource enum)
- Pattern reference: `packages/grove/src/grove/tools/base.py` (GroveBaseTool)
- Pattern reference: `packages/grove/src/grove/tools/system/send_message.py` (existing system tool with DI)
- Pattern reference: `packages/grove/src/grove/tools/types.py` (ToolContext)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
