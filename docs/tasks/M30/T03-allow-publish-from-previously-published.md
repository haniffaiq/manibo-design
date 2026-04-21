# T03: Allow publish from previously_published status

> **Milestone**: M30-agent-version-rollback
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M30 T03 - allow republish from previously_published`

2. **One Milestone = One PR**

3. **Follow CLAUDE.md and AGENTS.md**

4. **Before Starting This Task**
   - Verify T02 is completed

5. **Definition of Done**
   - Code compiles without errors
   - Tests cover the rollback path

6. **After Completing This Task**
   - Update `docs/tasks/M30/PROGRESS.md` to mark this task done

---

## Description

The `publish_version` method currently only accepts versions in `approved` or `in_review` status. Add `previously_published` as a valid source status so operators can rollback by republishing an older version.

## Subtasks

- [x] **Extend valid source statuses**: In the publish method's status guard, add `previously_published` as an allowed status.
- [x] **Skip review requirement for rollback**: A `previously_published` version was already reviewed — it should go straight to `published` without needing re-review.
- [x] **Add rollback test**: Test that publishing a `previously_published` version makes it live and demotes the current live version.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/agents/governance.py` | Modify | Add `previously_published` to valid publish source statuses |
| `packages/platform-core/tests/` | Modify | Add test for rollback path |

## Implementation Notes

- The publish method likely checks `if status not in {'approved', ...}: raise AgentStateError(...)`. Add `'previously_published'` to that set.
- A `previously_published` version already has `compiled_config` and `compiled_hash` — no recompilation needed.

## Acceptance Criteria

- [x] A `previously_published` version can be published (rollback).
- [x] Publishing it demotes the current live version to `previously_published`.
- [x] No re-review is required for rollback.

## References

- Milestone: [M30-agent-version-rollback.md](../../milestones/M30-agent-version-rollback.md)
