# T02: Change publish logic to set old live version to previously_published

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T02 - publish demotes old live to previously_published`

2. **One Milestone = One PR**
   - PR branch naming: `feat/M30-agent-version-rollback`

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T01 is completed

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Existing tests updated

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark this task done

---

## Description

Change `AgentGovernanceService.publish_version()` so that when a new version is published, the old live version transitions to `previously_published` instead of `archived`. The old version remains reachable for rollback.

## Subtasks

- [x] **Find the archive logic**: In `governance.py`, the publish method updates the old live version's status to `archived`. Change this to `previously_published`.
- [x] **Update audit event metadata**: The audit event should reflect the new status transition.
- [x] **Update existing tests**: Any test that asserts old versions become `archived` after publish must now assert `previously_published`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/agents/governance.py` | Modify | Change old-live demotion from `archived` to `previously_published` |
| `packages/platform-core/tests/` | Modify | Update assertions in governance tests |

## Implementation Notes

- The publish method likely has a SQL UPDATE like `SET status = 'archived' WHERE status = 'published' AND agent_definition_id = ...`. Change `'archived'` to `'previously_published'`.
- There should be only ONE published version per assistant at any time — this invariant stays.

## Acceptance Criteria

- [x] Publishing v2 sets v1 to `previously_published`, not `archived`.
- [x] Only one version is `published` at a time.
- [x] Existing governance tests pass with updated assertions.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
