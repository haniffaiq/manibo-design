# T09: Reduce docs-only and release-pin gate tax on the single merge path

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T05, T07

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T09 - reduce cheap pr gate tax`

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

Keep one branch-protection surface (`gate`) but make docs-only and release-promotion PRs cheap. These PRs should classify once, prove only what they need, and stop wasting queue time on generic merge tax.

## Subtasks

- [x] Verify the current classifier flags for docs-only and prod-release PRs
- [x] Remove leftover unnecessary proof or review steps from the cheap gate path
- [x] Keep one required `gate` status instead of creating special branch-protection carve-outs

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/merge-gate.yml` | Modify | Keep the cheap path truly cheap |
| `tools/scripts/classify_ci_scope.py` | Modify | Emit the right cheap-path flags |
| `tools/scripts/evaluate_ci_gate.py` | Modify | Respect the minimal proof contract |
| `wiki/architecture/ci.md` | Modify | Document the final cheap-path behavior |

## Implementation Notes

Do not special-case branch protection by PR type if the same gate can stay cheap. The goal is one boring gate, not a zoo of exceptions.

## Acceptance Criteria

- [x] Docs-only PRs pay only the fast proof they actually need
- [x] Release-promotion PRs keep the same `gate` surface but finish near-instantly
- [x] No heavy/runtime or review tax is paid when the classifier says the PR does not need it

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [ci-operations.md](../../../wiki/ops/ci-operations.md)
