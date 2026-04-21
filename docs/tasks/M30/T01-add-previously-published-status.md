# T01: Add previously_published status to version state machine

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T01 - add previously_published version status`

2. **One Milestone = One PR**
   - PR branch naming: `feat/M30-agent-version-rollback`

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Read the milestone document for full context
   - Check `docs/tasks/M30/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark this task done

---

## Description

Add `previously_published` as a valid version status in the DB schema, the backend governance types, and the frontend type definitions. This status represents a version that was live but has been superseded by a newer published version — it is NOT archived and can be republished.

## Subtasks

- [x] **DB migration**: Add `previously_published` to the CHECK constraint on `public.agent_definition_versions.status`. PostgreSQL requires DROP + RECREATE for CHECK constraint changes.
- [x] **Backend type**: Add `previously_published` to the status enum/literal in `AgentGovernanceService` and related types in `platform_core.agents`.
- [x] **Frontend type**: Add `previously_published` to `AdminAgentDefinitionVersionStatus` in `apps/web/src/lib/api/admin-agent-definitions.ts`.
- [x] **UI helpers**: Add label ("Previously live") and badge variant (neutral) for the new status in `helpers.ts`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/alembic_public/versions/` | Create | Migration to update status CHECK constraint |
| `packages/platform-core/src/platform_core/agents/governance.py` | Modify | Accept `previously_published` in status transitions |
| `apps/web/src/lib/api/admin-agent-definitions.ts` | Modify | Add to `AdminAgentDefinitionVersionStatus` union |
| `apps/web/src/app/(deployment)/admin/agent-definitions/helpers.ts` | Modify | Add label + badge variant for new status |

## Implementation Notes

- The CHECK constraint change requires: `ALTER TABLE ... DROP CONSTRAINT ...; ALTER TABLE ... ADD CONSTRAINT ... CHECK (status IN (...));`
- Use `IF NOT EXISTS` patterns for idempotency.
- The new status sits between `published` and `archived` in the lifecycle.

## Acceptance Criteria

- [x] `previously_published` is a valid DB value for `agent_definition_versions.status`.
- [x] Backend governance code recognizes the new status.
- [x] Frontend displays "Previously live" with a neutral badge for this status.
- [x] Migration is idempotent.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
- Related: `packages/platform-core/src/platform_core/agents/governance.py`
