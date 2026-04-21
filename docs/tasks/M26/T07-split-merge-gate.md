# T07: Split `merge-gate.yml` and CI helper orchestration below the repo size cap

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T07 - split merge gate`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26-ci-control-plane`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M26/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Bring `merge-gate.yml` back under the repo size gate by pushing bulky logic into scripts while keeping `Merge gate` as the one live PR workflow. The cheap stateless fast path moves to GitHub-hosted runners; required review and runtime-heavy proof stay self-hosted.

## Subtasks

- [x] Identify orchestration vs bulky implementation in `merge-gate.yml`
- [x] Move cheap/stateless jobs to GitHub-hosted runners and keep environment-bound jobs self-hosted
- [x] Extract bulky shell/policy sections into helper scripts or smaller reusable pieces
- [x] Keep the live PR DAG and job names stable while shrinking the YAML

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/merge-gate.yml` | Modify | Reduce YAML size, keep orchestration only, and remap the stateless fast path to GitHub-hosted runners |
| `tools/scripts/ci/merge-gate/*.sh` | Modify/Create | Hold bulky shell logic outside YAML |
| `tools/agents/ci_control_plane_policy.py` | Modify | Keep runner-output policy and branch-protection-facing job mapping coherent |
| `wiki/architecture/ci.md` | Modify | Reflect the hybrid hosted/self-hosted ownership split |

## Implementation Notes

Do not “fix” the size problem by deleting proof. The correct move is to move bulk out of YAML while keeping the live topology readable, preserve runner-output names, and remap only the stateless fast path.

## Acceptance Criteria

- [x] `merge-gate.yml` is below the repo size cap
- [x] Job names, branch-protection surface, and live PR DAG stay stable
- [x] `changes`, cheap fast repo checks, cheap fast product checks, and `gate` run on GitHub-hosted `ubuntu-24.04`
- [x] Heavy/runtime proof and required review remain on self-hosted runners
- [x] Bulky logic lives in scripts with clear ownership instead of YAML dumps

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
