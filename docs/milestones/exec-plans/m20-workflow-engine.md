# M20 Workflow Engine — Orchestration Plan

**Status:** Active
**Branch:** `docs/workflow-schema-graph-model`
**Design:** `wiki/design-docs/workflow-schema.md`
**Classification:** Epic (4 phases, multi-file, novel)

---

## Goal

Implement a graph-based workflow engine in Grove that executes deterministic automation steps (post-call processing, webhooks, scheduled tasks) triggered by events, schedules, or manual API calls.

## Acceptance Criteria

- [ ] `WorkflowAction` protocol defined in `grove/core/actions.py`
- [ ] 5 built-in actions: `http_request`, `transform_data`, `log`, `llm_invoke`, `delay`
- [ ] Schema models (`WorkflowConfig`, `WorkflowStepConfig`, etc.) in `grove/config/schema.py`
- [ ] `AgentConfig.workflows` field (optional, backward compatible)
- [ ] Config loader validates workflow graphs (cycle detection, dangling refs)
- [ ] Workflow engine walks graph, resolves templates, executes actions sequentially
- [ ] `GrovePlugin` extended with `workflow_actions` property
- [ ] Conditional routing via `next` as dict (Phase 2)
- [ ] Event triggers via pg_notify (Phase 2)
- [ ] All tests pass (unit, architecture, type check, lint)

## Scope Boundaries

**In scope:** Grove core workflow engine (Layer 1 from design doc)
**Out of scope:** Platform workflows (Layer 2), n8n UI (Phase 4), parallel execution (Phase 3)

---

## Phase 1: Foundation — Protocol + Schema + Engine

**Objective:** WorkflowAction protocol, config schema models, sequential graph engine, template resolution.

### Input

| Source | What to Feed Agent | Tokens (est.) |
|--------|-------------------|---------------|
| Design doc | `wiki/design-docs/workflow-schema.md` sections: Schema Definition, Pydantic Models, Step Execution, D2 | ~15K |
| Config schema | `packages/grove/src/grove/config/schema.py` | ~10K |
| Plugin protocol | `packages/grove/src/grove/core/plugin.py` | ~5K |
| Template resolution | `packages/grove/src/grove/api/routes/webhook.py` (lines 36-101) | ~3K |
| Config loader | `packages/grove/src/grove/config/loader.py` | ~5K |

**Context budget:** ~50K tokens (leaves ~78K for agent reasoning + output)

### Deliverables

| File | What |
|------|------|
| `packages/grove/src/grove/core/actions.py` | `WorkflowAction` protocol, `WorkflowActionContext` dataclass |
| `packages/grove/src/grove/config/schema.py` | `WorkflowTriggerConfig`, `WorkflowStepConfig`, `WorkflowRetryConfig`, `WorkflowConfig` models; `AgentConfig.workflows` field |
| `packages/grove/src/grove/config/loader.py` | Graph validation in load path (cycle detection via topological sort, dangling `next` refs) |
| `packages/grove/src/grove/runtime/workflow_engine.py` | `WorkflowEngine` class: template resolution (extract `_resolve_template` from webhook.py), sequential graph walk, step execution |
| `packages/grove/src/grove/core/plugin.py` | Add `workflow_actions` property to `GrovePlugin` |
| `packages/grove/tests/unit/core/test_workflow_actions.py` | Protocol conformance tests |
| `packages/grove/tests/unit/config/test_workflow_schema.py` | Schema validation tests (valid configs, invalid configs, edge cases) |
| `packages/grove/tests/unit/config/test_workflow_loader.py` | Graph validation tests (cycles, dangling refs, valid graphs) |
| `packages/grove/tests/unit/runtime/test_workflow_engine.py` | Engine tests (template resolution, sequential execution, step output chaining) |

### Verification Gate

```bash
uv run pyright packages/grove/src/
uv run ruff check packages/grove/src/ packages/grove/tests/
uv run ruff format packages/grove/src/ packages/grove/tests/ --check
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
uv run pytest packages/grove/tests/unit/core/test_workflow_actions.py -v --tb=short
uv run pytest packages/grove/tests/unit/config/test_workflow_schema.py -v --tb=short
uv run pytest packages/grove/tests/unit/config/test_workflow_loader.py -v --tb=short
uv run pytest packages/grove/tests/unit/runtime/test_workflow_engine.py -v --tb=short
```

### Dependencies

- None (first phase)

### Parallelization

- **Workstream A:** Protocol + Schema (core/actions.py, config/schema.py, plugin.py) — no runtime deps
- **Workstream B:** Engine + Loader validation (runtime/workflow_engine.py, config/loader.py) — depends on A's schema models
- **Strategy:** A first, then B. OR parallel if B mocks the schema.

---

## Phase 2: Built-in Actions

**Objective:** Implement 5 built-in workflow actions that the engine can execute.

### Input

| Source | What to Feed Agent | Tokens (est.) |
|--------|-------------------|---------------|
| Phase 1 output | `core/actions.py` (WorkflowAction protocol) | ~3K |
| Design doc | Built-in actions section | ~3K |
| HTTP patterns | Existing `httpx` or `aiohttp` usage in codebase (if any) | ~5K |

**Context budget:** ~40K tokens

### Deliverables

| File | What |
|------|------|
| `packages/grove/src/grove/actions/__init__.py` | Action registry, `get_builtin_actions()` |
| `packages/grove/src/grove/actions/http_request.py` | HTTP request action (async httpx) |
| `packages/grove/src/grove/actions/transform_data.py` | Data transformation (jmespath or simple dict ops) |
| `packages/grove/src/grove/actions/log.py` | Structured logging action |
| `packages/grove/src/grove/actions/llm_invoke.py` | LLM call via LiteLLM (reuse providers/registry.py) |
| `packages/grove/src/grove/actions/delay.py` | Async sleep action |
| `packages/grove/tests/unit/actions/test_*.py` | Tests for each action |

### Verification Gate

```bash
uv run pyright packages/grove/src/
uv run pytest packages/grove/tests/unit/actions/ -v --tb=short
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

### Dependencies

- Phase 1 (WorkflowAction protocol must exist)

### Import Boundary

`actions/ → {actions, core}` — add to `test_import_boundaries.py`

---

## Phase 3: Conditional Routing + Event Triggers

**Objective:** `next` as dict for branching, `condition` action, event trigger subscription via pg_notify.

### Input

| Source | What to Feed Agent | Tokens (est.) |
|--------|-------------------|---------------|
| Phase 1+2 output | Engine, schema, actions | ~10K |
| Design doc | Conditional routing example, event emission contract | ~5K |
| pg_notify infra | `backends/postgres/notifications.py`, `runtime/subscription_handler.py` | ~10K |

**Context budget:** ~50K tokens

### Deliverables

| File | What |
|------|------|
| `packages/grove/src/grove/actions/condition.py` | Condition evaluation action |
| `packages/grove/src/grove/runtime/workflow_engine.py` | Update: conditional `next` evaluation (dict branch resolution) |
| `packages/grove/src/grove/runtime/workflow_triggers.py` | Event subscription, schedule registration, trigger dispatch |
| `packages/grove/tests/unit/runtime/test_workflow_conditional.py` | Conditional routing tests |
| `packages/grove/tests/unit/runtime/test_workflow_triggers.py` | Trigger subscription/dispatch tests |

### Verification Gate

```bash
uv run pyright packages/grove/src/
uv run pytest packages/grove/tests/unit/ -v --tb=short
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
```

### Dependencies

- Phase 1 + Phase 2

---

## Phase 4: Integration + Temporal Wiring

**Objective:** Wire workflow engine into Temporal activities, integration tests with real config loading.

### Input

| Source | What to Feed Agent | Tokens (est.) |
|--------|-------------------|---------------|
| Phase 1-3 output | All workflow code | ~15K |
| Temporal activities | `temporal/activities.py` pattern | ~10K |
| Example config | `examples/doctor_appointment/agent.yaml` | ~5K |

**Context budget:** ~50K tokens

### Deliverables

| File | What |
|------|------|
| `packages/grove/src/grove/temporal/workflow_activities.py` | Temporal activity wrapper for workflow engine |
| `packages/grove/examples/doctor_appointment/agent.yaml` | Add `workflows:` section (post_call_summary example) |
| `packages/grove/tests/integration/test_workflow_e2e.py` | Full workflow execution test (load config → trigger → execute → verify output) |

### Verification Gate

```bash
uv run pyright packages/grove/src/
uv run pytest packages/grove/tests/unit/ -v --tb=short
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short
uv run pytest packages/grove/tests/integration/test_workflow_e2e.py -v --tb=short
```

### Dependencies

- Phase 1 + Phase 2 + Phase 3

---

## Files Modified (Cross-Phase)

| File | Phase |
|------|-------|
| `core/actions.py` | 1 |
| `core/plugin.py` | 1 |
| `config/schema.py` | 1 |
| `config/loader.py` | 1 |
| `runtime/workflow_engine.py` | 1, 3 |
| `actions/__init__.py` | 2 |
| `actions/http_request.py` | 2 |
| `actions/transform_data.py` | 2 |
| `actions/log.py` | 2 |
| `actions/llm_invoke.py` | 2 |
| `actions/delay.py` | 2 |
| `actions/condition.py` | 3 |
| `runtime/workflow_triggers.py` | 3 |
| `temporal/workflow_activities.py` | 4 |
| `examples/doctor_appointment/agent.yaml` | 4 |
| `tests/unit/architecture/test_import_boundaries.py` | 2 |

## Progress

| Phase | Status | Tests | Notes |
|-------|--------|-------|-------|
| 1: Foundation | Pending | — | — |
| 2: Built-in Actions | Pending | — | Blocked by Phase 1 |
| 3: Conditional + Triggers | Pending | — | Blocked by Phase 2 |
| 4: Integration | Pending | — | Blocked by Phase 3 |

## Cross-References

- Design: `wiki/design-docs/workflow-schema.md`
- Architecture: `wiki/architecture/grove.md`
- Milestone: `docs/milestones/M20-deployment-console-ux.md` (M20)
- Repository guidelines: `AGENTS.md`
