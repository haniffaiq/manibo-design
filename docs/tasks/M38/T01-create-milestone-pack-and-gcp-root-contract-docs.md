# T01: Create the NFQ GCP milestone pack and promote the GCP root contract docs

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M38 T01 - create milestone pack and docs`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M38-nfq-gcp-bootstrap`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M38/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M38/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Create the live milestone/task pack for the NFQ GCP bootstrap work and update
the repo's GCP planning/docs surface so implementation has an explicit contract
before Terraform changes land.

## Subtasks

- [x] **Create the milestone doc**: Add `docs/milestones/M38-nfq-gcp-bootstrap.md`
  with the approved design decisions and verification gates.
- [x] **Create the live task tracker**: Add `docs/tasks/M38/PROGRESS.md` and the
  task files needed to execute the milestone.
- [x] **Update the milestone index**: Add M38 to `docs/milestones/README.md`
  with active implementation status.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/milestones/M38-nfq-gcp-bootstrap.md` | Create | Milestone contract for the NFQ GCP bootstrap work |
| `docs/tasks/M38/PROGRESS.md` | Create | Live execution tracker for M38 |
| `docs/tasks/M38/T01-*.md` through `T06-*.md` | Create | Executable task pack |
| `docs/milestones/README.md` | Modify | Add M38 to readiness and execution-order tables |

## Implementation Notes

- This task is documentation only. It does not modify Terraform code.
- The design source of truth is `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`.

## Acceptance Criteria

- [x] M38 exists as a live milestone doc.
- [x] `docs/tasks/M38/` exists with a progress tracker and executable tasks.
- [x] `docs/milestones/README.md` lists M38 as an active milestone.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
