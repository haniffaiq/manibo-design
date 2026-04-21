# T02: Config schema extension (AutonomousConfig)

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
   - Commit message format: `feat: M33 T02 - {short description}`

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

Extend `AgentConfig` in `packages/grove/src/grove/config/schema.py` with an `autonomous` field that selects `AutonomousExecutor` at runtime. When `autonomous:` is present in agent YAML, the autonomous execution mode activates. When absent, existing `AgentExecutor` / flow-based behavior is completely untouched. This is the configuration contract that enables the dual-executor architecture -- the YAML determines which engine runs.

The key invariant: `flow_definition` and `autonomous` are mutually exclusive. An agent is either a rail agent (flow/react) or an autonomous agent (while loop), never both.

## Subtasks

- [ ] **Define AutonomousConfig model**: Pydantic `BaseModel` with fields: `max_iterations: int = 50`, `memory: AutonomousMemoryConfig | None = None`, `skills: AutonomousSkillsConfig | None = None`, `tools: list[str] | None = None` (optional tool name whitelist), `compression: CompressionConfig | None = None`, `auxiliary_model: str | None = None` (cheap/fast model for side tasks: compression, session search, background review, memory flush — must NOT default to the main expensive model; if None, use a sensible default like `gemini/gemini-2.0-flash`), `allow_host_execution: bool = False` (enables terminal/PTC in platform mode — default False, only True when gVisor or equivalent sandbox is available).
- [ ] **Define AutonomousMemoryConfig model**: Pydantic `BaseModel` with fields: `enabled: bool = True`, `memory_char_limit: int = 2200`, `user_char_limit: int = 1375`.
- [ ] **Define AutonomousSkillsConfig model**: Pydantic `BaseModel` with fields: `enabled: bool = True`, `max_skill_size: int = 15360`.
- [ ] **Define CompressionConfig model**: Pydantic `BaseModel` with fields: `threshold_percent: float = 0.50`, `protect_first_n: int = 3`, `protect_last_n: int = 20`, `tail_token_budget: int = 20000`, `summary_ratio: float = 0.20`.
- [ ] **Define AutonomousDelegationConfig model**: Pydantic `BaseModel` with fields: `default_agent: str`, `timeout_minutes: int = 30`. This is for rail agents that can delegate tasks to an autonomous agent.
- [ ] **Add `autonomous` field to AgentConfig**: `autonomous: AutonomousConfig | None = None`.
- [ ] **Add `autonomous_delegation` field to AgentConfig**: `autonomous_delegation: AutonomousDelegationConfig | None = None`.
- [ ] **Add mutual exclusion validator**: `model_validator(mode="after")` that raises `ValidationError` when both `flow_definition` and `autonomous` are set on the same agent. An agent is either rail or autonomous, not both.
- [ ] **Unit tests for schema validation**: Test valid autonomous config, valid flow config, invalid dual config, defaults, and backward compatibility with existing agent YAMLs.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/config/schema.py` | Modify | Add AutonomousConfig, AutonomousMemoryConfig, AutonomousSkillsConfig, CompressionConfig, AutonomousDelegationConfig models. Add `autonomous` and `autonomous_delegation` fields to AgentConfig. Add mutual exclusion validator. |
| `packages/grove/tests/unit/config/test_autonomous_config.py` | Create | Tests for autonomous config validation, mutual exclusion, defaults, backward compatibility |

## Implementation Notes

- **Read `schema.py` fully before editing.** The file is ~556 lines with many existing models and validators. Add new models ABOVE `AgentConfig` (follow the existing ordering: models defined before they're referenced).
- **Follow existing Pydantic patterns exactly:** Use `BaseModel`, `Field`, `field_validator`, `model_validator` as already done in the file. Match import style.
- **Model placement order in file:** Place new models after `ExtractionConfig` and `GuardrailsPolicy` but before `AgentConfig`. Group them together with a comment header.
- **Mutual exclusion validator:** Add a new `model_validator(mode="after")` to `AgentConfig`. It should be named `validate_autonomous_mutual_exclusion` or similar. Place it after the existing `validate_voice_requires_guardrails` validator.
- **Validator error message:** Use a clear message: `"Agent cannot have both 'flow_definition' and 'autonomous' — choose one execution mode"`.
- **AutonomousDelegationConfig is independent:** A rail agent can have `flow_definition` + `autonomous_delegation` (it delegates TO an autonomous agent). The mutual exclusion is only between `flow_definition` and `autonomous`.
- **Default values match the design doc:** `max_iterations=50`, `memory_char_limit=2200`, `user_char_limit=1375`, `max_skill_size=15360`, `threshold_percent=0.50`, `protect_first_n=3`, `protect_last_n=20`, `tail_token_budget=20000`, `summary_ratio=0.20`.
- **No new imports needed** beyond what `schema.py` already imports. Do NOT add imports from `grove.core.memories` or `grove.core.skills` -- config schema is independent of store protocols.
- **Existing tests must still pass.** Run the full config test suite after changes.
- **CompressionConfig field validators:**
  - `threshold_percent` must be between 0.0 and 1.0
  - `summary_ratio` must be between 0.0 and 1.0
  - `protect_first_n` must be >= 0
  - `protect_last_n` must be >= 1
  - `tail_token_budget` must be >= 1000
  - `max_iterations` must be >= 1

## Acceptance Criteria

- [ ] `AgentConfig(name="x", mission="y", autonomous=AutonomousConfig())` validates successfully
- [ ] `AgentConfig(name="x", mission="y", flow_definition=..., autonomous=...)` raises `ValidationError`
- [ ] `AgentConfig(name="x", mission="y", flow_definition=..., autonomous_delegation=AutonomousDelegationConfig(default_agent="bg"))` validates (delegation is allowed alongside flow)
- [ ] `AgentConfig(name="x", mission="y")` still validates identically (backward compatible, both fields None)
- [ ] All existing config tests pass without modification
- [ ] All default values match the design doc values listed above
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- File to modify: `packages/grove/src/grove/config/schema.py`
- Existing config tests: `packages/grove/tests/unit/config/`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
