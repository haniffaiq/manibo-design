# T04: Verification, cleanup, and proof capture

> **Milestone**: M26.4-mainline-k3d-proof-consolidation
> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: T03
> **Activation Note**: Human explicitly activated M26.4 on 2026-04-03. This task is implemented in the active worktree.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.4 T04 - verify and capture mainline k3d proof shift`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.4-mainline-k3d-proof-consolidation`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26.4/PROGRESS.md` for current state

5. **Definition of Done**
   - Tests/docs/lint pass for the changed CI surface
   - Dead references to removed PR `k3d` jobs are gone
   - Proof commands and milestone progress are updated

6. **After Completing This Task**
   - Update `docs/tasks/M26.4/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Run the final verification set for the simplified topology, remove stale references to deleted PR `k3d` jobs, and capture the proof in milestone/progress docs so the new ownership model is durable instead of chat-only.

## Subtasks

- [ ] **Run workflow/policy regression tests**: execute the architecture tests that lock workflow topology, policy routing, and local harness truth.
- [ ] **Clean stale references**: remove leftover mentions of deleted PR `k3d` jobs from docs/tests/scripts.
- [ ] **Capture durable proof**: update progress/milestone docs with the final commands and settled topology notes.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M26.4/PROGRESS.md` | Modify | Record completion state and proof |
| `docs/milestones/M26.4-mainline-k3d-proof-consolidation.md` | Modify | Record any final settled contract details discovered during implementation |
| `wiki/architecture/ci.md` | Modify | Remove any last stale references if they remain |
| `tests/architecture/test_ci_control_plane_policy.py` | Modify | Final assertion cleanup if needed |
| `tests/architecture/test_ci_merge_gate_workflow_topology.py` | Modify | Final assertion cleanup if needed |

## Implementation Notes

- This is cleanup plus proof capture, not a hiding place for more topology changes.
- If a stale reference shows the implementation was incomplete, fix the owning task instead of papering over it here.
- Do not call the milestone done without command output proving the new topology/tests agree.

## Acceptance Criteria

- [ ] Relevant architecture tests, lint, and formatting checks pass.
- [ ] No stale repo references still describe deleted PR `k3d` jobs as active.
- [ ] Milestone/progress docs contain the final proof commands and settled ownership notes.

## References

- Milestone: [M26.4-mainline-k3d-proof-consolidation.md](../../milestones/M26.4-mainline-k3d-proof-consolidation.md)
- Related: [ci-operations.md](../../../wiki/architecture/ci.md)
