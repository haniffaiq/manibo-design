# T04: Tenant team-management surfaces use explicit client-role language and fail closed for operators

> **Milestone**: M28-solution-visibility-tenant-access-ux
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M28 T04 - clarify team roles and fail closed for operators`

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

Operators should not land on tenant-admin pages and see editable controls, zero counts, and a buried `403`. This task makes the tenant team-management page use explicit `Client Admin` / `Client Operator` wording and fail closed in the UI with honest permission states from the start.

## Subtasks

- [ ] **Clarify role language on the team page**: Use `Client Admin` / `Client Operator` copy so `Admin`/`Operator` stop being confused with deployment admin on tenant team-management screens.
- [ ] **Gate admin-only tenant surfaces in UI**: Detect client role before rendering invite, edit, deactivate, and remove controls.
- [ ] **Replace fake zero-state stats on permission failure**: When the API denies access, show a clear admin-only state instead of empty counts and empty tables.
- [ ] **Cover the restriction flow**: Add unit/e2e proof that operator sessions see the blocked state and client-admin sessions retain full controls.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/team/page.tsx` | Modify | Use explicit client-role labels and fail closed for operators |
| `apps/web/src/lib/auth_types.ts` | Modify if needed | Reuse or expose role typing needed by the page |
| `apps/web/tests/team-page.test.tsx` | Create/Modify | Cover operator/admin permission-state mapping at the page/state layer |
| `apps/web/e2e/team-management.spec.ts` | Modify | Verify operator sees blocked state and client admin sees management controls |

## Implementation Notes

- Prefer removing unavailable controls over showing them disabled after the fact.
- Do not let card totals silently collapse to zero on permission errors.
- Keep the page copy in plain language: “Only Client Admins can manage team access.”
- Keep the API role values unchanged; this is a presentation-layer clarification only.

## Acceptance Criteria

- [ ] Team-management role copy is explicit enough to distinguish client roles from deployment admin.
- [ ] Operators do not see editable team-management controls.
- [ ] Permission failures render an explicit admin-only state instead of fake zero counts.
- [ ] Client-admin behavior remains intact and tested.

## References

- Milestone: [M28-solution-visibility-tenant-access-ux.md](../../milestones/M28-solution-visibility-tenant-access-ux.md)
- Related: `docs/requirements/checklist.md` requirements “Client Operator account can be created with restricted permissions” and “Client Admin can assign roles: Client Admin or Client Operator”; `apps/web/src/app/(tenant)/team/page.tsx`
