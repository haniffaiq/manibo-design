# T01: Audit `manibo-bot` vs connector review parity on recent PRs

> **Milestone**: M26-ci-control-plane-reliability
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26 T01 - audit review parity`

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

Build an evidence baseline from recent merged PRs that compares same-head `manibo-bot` outcomes against `chatgpt-codex-connector` findings. This task exists to kill guesswork before changing authority rules.

## Subtasks

- [x] Collect a representative recent PR sample with both internal and connector review artifacts
- [x] Compare same-head outcomes, not just entire PR timelines
- [x] Categorize misses into prompt, diff/context, parser, or fallback classes
- [x] Publish a short parity summary that later tasks can reference

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M26/PROGRESS.md` | Modify | Mark the audit done once completed |
| `docs/milestones/M26-ci-control-plane-reliability.md` | Modify | Add the measured parity snapshot if it changes materially |
| `wiki/architecture/ci.md` | Modify | Capture the measured split between required and advisory reviewers if useful |

## Implementation Notes

Use real merged PRs from GitHub, not synthetic examples. The useful unit is “same head SHA, different review outcome,” because timeline-only comparisons can overstate the mismatch.

Completed evidence:

1. Sampled recent merged human PRs: `#659`, `#658`, `#656`, `#655`, `#654`, `#647`, `#646`, `#645`, `#644`, `#638`, `#634`, `#632`, `#631`, `#628`, `#625`, `#622`, `#621`, `#613`, `#608`.
2. Same-head disagreement confirmed on `#656`, `#655`, `#646`, `#638`, and `#634`.
3. The most important root cause found during the audit is prompt suppression in `tools/agents/review.py` for the common `--base` path. That means the required review bot often does not receive the repo review rubric at all.

## Acceptance Criteria

- [x] The audit uses real recent PRs and records same-head disagreements
- [x] The output clearly identifies whether misses are prompt, parser, context, or fallback failures
- [x] Later milestone tasks can cite this audit instead of hand-waving about review quality

## References

- Milestone: [M26-ci-control-plane-reliability.md](../../milestones/M26-ci-control-plane-reliability.md)
- Related: [review_agent.md](../../../wiki/ops/codex_ci_bots.md)
