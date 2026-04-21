# T03: Ship PR Proof and Merge Watch

> **Milestone**: M41.7-agent-builder-governed-starter-repair
> **Status**: In Progress
> **Estimate**: S (< 2h)
> **Depends on**: T01, T02

---

## Description

Close the review loop on the repaired PR: run verification, reply to review
threads with evidence, update PR metadata, and babysit CI until mergeable.

## Subtasks

- [x] Run the milestone verification commands and capture evidence
- [ ] Reply to and resolve the remaining `#961` review threads
- [ ] Watch CI/reviews until the PR merges or a human decision is required

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M41.7/PROGRESS.md` | Modify | Mark milestone completion state |
| `wiki/queries/2026-04-20-agent-builder-pr-961-962-follow-on.md` | Modify | Append verification evidence and merge outcome |

## Acceptance Criteria

- [ ] `#961` has evidence-backed replies on each resolved review thread
- [x] CI is green or any non-local blocker is documented with the failing run
- [ ] The PR is merged or paused with an explicit blocker note

## References

- Milestone: [M41.7-agent-builder-governed-starter-repair.md](../../milestones/M41.7-agent-builder-governed-starter-repair.md)
- Related: [2026-04-20-agent-builder-pr-961-962-follow-on.md](../../../wiki/queries/2026-04-20-agent-builder-pr-961-962-follow-on.md)
