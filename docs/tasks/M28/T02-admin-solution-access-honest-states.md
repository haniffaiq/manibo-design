# T02: Admin solution access uses honest shipped/unshipped states

> **Milestone**: M28-solution-visibility-tenant-access-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M28 T02 - fix admin solution access states`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M28-solution-visibility`
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
   - Check `docs/tasks/M28/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M28/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Stop the deployment admin solutions page from advertising impossible actions. Shipped solutions can be enabled/disabled normally; unshipped solutions must show an explicit unavailable state instead of the normal enable CTA.

## Subtasks

- [ ] **Model shipped state in the page**: Use the bundle contract from T01 so the page knows whether a solution screen exists in this deployment.
- [ ] **Replace misleading affordances**: Show unavailable copy/disabled controls for unshipped solutions instead of the regular enable action.
- [ ] **Prove the behavior**: Extend frontend tests and Playwright coverage so admins can see the difference between shipped-disabled and unshipped solutions.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/solutions/page.tsx` | Modify | Render honest shipped/unshipped states and CTAs |
| `apps/web/src/lib/solutions.ts` | Modify | Expose the shipped/bundle state needed by the page |
| `apps/web/tests/admin-solutions-page.test.tsx` | Create/Modify | Cover shipped/unshipped page-state mapping and copy at the UI layer |
| `apps/web/e2e/admin-solutions.spec.ts` | Modify | Verify shipped solutions can be enabled and unshipped ones are clearly unavailable |

## Implementation Notes

- Keep the page operator-proof. “Enable” should mean “will become visible in this deployment.”
- If a solution is not shipped, say so plainly and do not show a normal success path.
- Do not fake readiness for `call_monitoring` or `operations_monitor` unless their tenant routes/UI are actually bundled.

## Acceptance Criteria

- [ ] Admins can visually distinguish shipped-disabled solutions from unshipped solutions.
- [ ] Unshipped solutions do not present the same enable flow as shipped solutions.
- [ ] Playwright proves the page state for both categories.

## References

- Milestone: [M28-solution-visibility-tenant-access-ux.md](../../milestones/M28-solution-visibility-tenant-access-ux.md)
- Related: `apps/web/src/app/(deployment)/admin/solutions/page.tsx`, `docs/requirements/checklist.md` row 85
