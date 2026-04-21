# T{NN}: {Task Title}

> **Milestone**: M{N}-{milestone-name}
> **Status**: Not Started | In Progress | Completed
> **Estimate**: S (< 2h) | M (2-4h) | L (4-8h)
> **Depends on**: T{XX}, T{YY} (or "None")

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M{N} T{NN} - {short description}`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M{N}-{milestone-name}`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M{N}/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M{N}/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

{Brief description of what this task accomplishes and why it's needed}

## Subtasks

- [ ] **{Subtask 1}**: {Description}
- [ ] **{Subtask 2}**: {Description}
- [ ] **{Subtask 3}**: {Description}

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `path/to/file` | Create | {What this file does} |
| `path/to/existing` | Modify | {What changes are needed} |

## Implementation Notes

{Any specific guidance, code patterns to follow, or gotchas to be aware of}

## Acceptance Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## References

- Milestone: [M{N}-{name}.md](../../milestones/M{N}-{name}.md)
- Related: {Any related tasks, design docs, or specs}
