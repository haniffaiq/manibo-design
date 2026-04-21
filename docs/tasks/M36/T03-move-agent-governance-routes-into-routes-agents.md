# T03: Move agent-governance routes into `routes/agents`

> **Milestone**: M36-platform-api-route-topology-phase1
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Create the `routes/agents` domain package and move the agent-governance route files under it while preserving every current factory import. This task is pure ownership cleanup for the agent admin and policy surface, not a semantic refactor.

## Subtasks

- [ ] **Create `routes/agents/`**: add a stable domain package for agent-governance route implementations.
- [ ] **Move agent-governance implementations**: relocate `agent_definitions.py`, `admin_agent_definitions.py`, `admin_agents.py`, `admin_agent_starters.py`, `platform_defaults.py`, and `approvals.py` under the new package.
- [ ] **Keep top-level compatibility shims**: leave the original flat files as import-compatible shims that re-export the moved implementations.
- [ ] **Preserve main wiring**: keep the same factories mounted from `platform_api.main`.
- [ ] **Retain focused wiring tests**: ensure agent-admin route mounting and main import wiring remain covered after the move.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/agents/` | Create | Domain package for agent-governance route implementations |
| `apps/api/src/platform_api/routes/agent_definitions.py` | Modify | Compatibility shim to `routes.agents.agent_definitions` |
| `apps/api/src/platform_api/routes/admin_agent_definitions.py` | Modify | Compatibility shim to `routes.agents.admin_agent_definitions` |
| `apps/api/src/platform_api/routes/admin_agents.py` | Modify | Compatibility shim to `routes.agents.admin_agents` |
| `apps/api/src/platform_api/routes/admin_agent_starters.py` | Modify | Compatibility shim to `routes.agents.admin_agent_starters` |
| `apps/api/src/platform_api/routes/platform_defaults.py` | Modify | Compatibility shim to `routes.agents.platform_defaults` |
| `apps/api/src/platform_api/routes/approvals.py` | Modify | Compatibility shim to `routes.agents.approvals` |
| `apps/api/src/platform_api/main.py` | Modify selectively | Preserve factory wiring behavior |
| `tests/architecture/test_admin_agents_main_wiring.py` | Modify if needed | Keep the architecture contract green after the move |
| `apps/api/tests/` | Modify/Create | Focused agent-governance route wiring coverage where missing |

## Implementation Notes

- Planning-only task. Do not execute until the human explicitly activates M36.
- Keep the old flat filenames as minimal re-export shims; do not leave logic in both places.
- Preserve `__all__` exports where they exist so import semantics remain predictable.
- Do not change route prefixes, tags, or auth gates while moving these files.

## Acceptance Criteria

- [ ] The six agent-governance route files live under `routes/agents/`.
- [ ] The original flat route filenames remain as thin compatibility shims.
- [ ] `platform_api.main` and existing tests keep importing the same factories successfully after the move.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api/routes/agents \
  apps/api/src/platform_api/routes/agent_definitions.py \
  apps/api/src/platform_api/routes/admin_agent_definitions.py \
  apps/api/src/platform_api/routes/admin_agents.py \
  apps/api/src/platform_api/routes/admin_agent_starters.py \
  apps/api/src/platform_api/routes/platform_defaults.py \
  apps/api/src/platform_api/routes/approvals.py \
  apps/api/src/platform_api/main.py \
  tests/architecture/test_admin_agents_main_wiring.py \
  apps/api/tests

uv run pyright \
  apps/api/src/platform_api/routes/agents \
  apps/api/src/platform_api/main.py

uv run pytest \
  tests/architecture/test_admin_agents_main_wiring.py \
  apps/api/tests \
  -q --tb=short -k "agent_definitions or admin_agent or approvals or platform_defaults"
```

## References

- Milestone: [M36-platform-api-route-topology-phase1.md](../../milestones/M36-platform-api-route-topology-phase1.md)
- Design: `wiki/queries/2026-04-11-design-platform-api-route-topology-refactor.md`
