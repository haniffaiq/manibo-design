# T24: Documentation

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T01-T23

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T24 - {short description}`

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

Update Grove architecture documentation to describe the autonomous runtime. This is the final task in M33 -- all code is complete, and this task captures the architectural additions in documentation. Keep documentation concise: describe architecture and point to source files, do not duplicate code.

## Subtasks

- [ ] **Read existing `wiki/architecture/grove.md` in full.** Understand its structure, section ordering, and documentation style before adding anything.
- [ ] **Add "Autonomous Runtime" section to ARCHITECTURE.md**: Place after the existing execution model section. Cover:
  - **What it is:** A while-loop executor (`AutonomousExecutor`) for open-ended tasks. No predefined graph. The LLM is the control flow.
  - **When it runs:** Selected by agent YAML config. `autonomous:` section in agent config selects `AutonomousExecutor`; `flow_definition:` selects the existing `AgentExecutor`. Both share ToolRegistry, Temporal, PostgreSQL, and streaming.
  - **How it differs from rail:** Rail agents follow a LangGraph flow/react graph. Autonomous agents run an open-ended while loop: prompt LLM, execute tool calls, check stop conditions, repeat. No predefined steps.
  - **Iteration lifecycle:** LLM call -> tool execution -> stop condition check -> repeat. Stop conditions: LLM returns response without tool calls, max_iterations reached, timeout exceeded.
  - **Context compression:** 4-phase algorithm (prune old tool results, determine boundaries, summarize middle, assemble). Fires when token count exceeds threshold. Memory flush (extra LLM call) precedes compression to save durable facts.
  - **PTC (Programmatic Tool Calling):** LLM writes Python scripts; child process runs them. Tool calls route through UDS RPC to parent's ToolRegistry. Only stdout returns to context. Collapses multi-step chains.
- [ ] **Add to Package Structure diagram**: List new files/directories:
  - `core/memories.py`, `core/skills.py` (store protocols)
  - `runtime/autonomous.py`, `runtime/compressor.py`, `runtime/memory_flush.py`, `runtime/ptc.py` (autonomous runtime)
  - `backends/postgres/memory_store.py`, `backends/postgres/skill_store.py` (store implementations)
  - `tools/system/memory_tool.py`, `tools/system/skill_list_tool.py`, `tools/system/skill_view_tool.py`, `tools/system/skill_manage_tool.py`, `tools/system/terminal_tool.py`, `tools/system/code_execution_tool.py`, `tools/system/delegate_autonomous_tool.py`, `tools/system/command_approval.py`, `tools/system/session_search_tool.py` (autonomous tools)
  - `temporal/autonomous_workflow.py`, `temporal/autonomous_activities.py` (Temporal integration)
  - `cli/main.py`, `cli/standalone_bootstrap.py` (standalone CLI)
- [ ] **Add to Layer Architecture**: Autonomous executor sits in the runtime layer, same level as existing `AgentExecutor`. New stores in backends layer. New tools in tools layer. Temporal integration in temporal layer. CLI is a new top-level entry point.
- [ ] **Add to Dependency Rules**: New modules follow the same hierarchy. Specifically: `cli/` does NOT import `temporal/` (standalone mode). `tools/system/` does NOT import `runtime/` or `temporal/` (internal). `backends/` imports only `core/`.
- [ ] **Add to Data Flows**: Document the autonomous execution data flow:
  1. Agent YAML `autonomous:` config -> `AutonomousExecutor` selected
  2. System prompt assembled: base instructions + frozen memory snapshot + frozen skill index
  3. While loop: LLM call -> tool execution -> stop check -> repeat
  4. Compression fires at token threshold: memory flush -> 4-phase compress -> continue
  5. On completion: result returned (or delivered via channel if delegated)
- [ ] **Add to Key Technical Decisions**: Document the "while loop vs LangGraph" decision (design decision #1 from milestone doc). One sentence: why, and reference the milestone doc for full rationale.
- [ ] **Document agent YAML autonomous config section**: Add an example YAML snippet showing the `autonomous:` section with all fields: `model`, `max_iterations`, `timeout_minutes`, `tools`, `compression_threshold`, `memory_char_limit`, `user_char_limit`. Show alongside existing `flow_definition:` for contrast.
- [ ] **Document new tools (brief descriptions)**: List each new tool with its purpose (one line each): `memory` (read/update hot memory), `session_search` (FTS over past conversations), `skill_list` (show skill index), `skill_view` (show full skill content), `skill_manage` (create/update/delete skills), `terminal` (execute shell commands with safety guardrails), `execute_code` (run Python scripts with tool access via PTC), `delegate_autonomous_task` (fire-and-forget autonomous task delegation).
- [ ] **Document new PostgreSQL tables**: Brief schema description for `grove.agent_memories` (tenant_id, agent_id, target, content, char_limit) and `grove.agent_skills` + `grove.agent_skill_versions` (tenant_id, agent_id, name, description, content, category, status, version history).
- [ ] **Document CLI usage**: Brief section covering `grove run --goal "..."`, `grove chat`, `grove memory list|show`, `grove skills list|show`. Note: CLI connects to PostgreSQL directly, no Temporal required.
- [ ] **Keep additions under 500 lines**: Do not duplicate code in docs. Reference source files for implementation details. Describe architecture and contracts, not line-by-line implementation.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/architecture/grove.md` | Modify | Add autonomous runtime section, update package structure, layer architecture, dependency rules, data flows, technical decisions (~300-500 lines of additions) |

## Implementation Notes

- **Read `wiki/architecture/grove.md` in full before making any edits.** Match the existing documentation style: heading levels, formatting conventions, code block usage, cross-reference style.
- **Do not restructure existing sections.** Add new content in the appropriate existing sections (Package Structure, Layer Architecture, Dependency Rules, Data Flows, Key Technical Decisions) and add one new top-level section for the autonomous runtime overview.
- **Reference source files, not inline code.** Example: "See `runtime/autonomous.py` for the while-loop implementation" rather than pasting the loop code.
- **The `arch_spine.md` is auto-generated.** Note in the doc if manual additions are needed there, but do not edit it directly unless the generation script is updated.
- **YAML example should be complete but concise.** Show a realistic agent config with both `flow_definition` and `autonomous` sections side by side. Use comments in the YAML for field explanations.
- **No AI attribution.** Per CLAUDE.md rule #6, do not add AI attribution to documentation.
- **Verify after editing:** Run architecture doc tests if they exist (`packages/grove/tests/unit/architecture/`). Some tests may validate documentation structure or freshness.

## Acceptance Criteria

- [ ] `wiki/architecture/grove.md` describes the autonomous runtime: what, when, how, why
- [ ] Package structure diagram updated with all new files
- [ ] Layer architecture updated to show autonomous executor placement
- [ ] Dependency rules updated with new module constraints (especially: cli does not import temporal)
- [ ] Data flow for autonomous execution documented end-to-end
- [ ] Agent YAML `autonomous:` config section documented with example
- [ ] All 8 new tools documented (brief one-liner descriptions)
- [ ] New PostgreSQL tables documented (grove.agent_memories, grove.agent_skills, grove.agent_skill_versions)
- [ ] CLI usage documented (grove run, grove chat, grove memory, grove skills)
- [ ] No stale or contradictory documentation introduced
- [ ] Additions stay under 500 lines
- [ ] `uv run ruff check` and `uv run ruff format --check` pass (if any code blocks are added)
- [ ] Architecture doc tests pass: `uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short`

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependencies: T01-T23 (all code tasks must be complete before documenting)
- Target file: `wiki/architecture/grove.md`
- Design decisions: milestone doc, design decisions #1-#14
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
