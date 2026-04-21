# T01: Define deployment solution bundle contract + generated manifest pipeline

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
   - Commit message format: `feat: M28 T01 - define deployment solution bundle contract`

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

Make the deployment-bundle contract explicit so tenant visibility is driven by one honest source of truth. The generated solution manifests/routes and runtime `BUILD_ENABLED_SOLUTIONS` helpers must agree on what this deployment actually ships.

## Subtasks

- [ ] **Audit bundle sources**: Confirm where `NEXT_PUBLIC_SOLUTIONS`, generated manifests, route generation, and runtime visibility sets diverge today.
- [ ] **Define one bundle contract**: Pick one source of truth for shipped solution UIs and wire the generators/runtime helpers to it.
- [ ] **Back the contract with tests**: Cover bundle parsing, generated manifest expectations, and visible-enabled intersection behavior.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/scripts/solution-route-config.mjs` | Modify | Normalize the build-time bundle contract and supported states |
| `apps/web/scripts/generate-solution-routes.mjs` | Modify | Generate manifests/routes from the same bundle contract |
| `apps/web/src/lib/solutions.ts` | Modify | Keep runtime visibility helpers aligned with the generated bundle |
| `apps/web/src/lib/generated-solution-manifests.ts` | Modify (generated) | Reflect the shipped solution UI superset for the target deployment bundle |
| `apps/web/tests/solutions.test.ts` | Modify | Prove bundle parsing and visibility intersection behavior |

## Implementation Notes

- Keep the contract build-time. Do not invent runtime manifest loading.
- Prefer explicit deployment bundle states over silent fallbacks.
- The output must support option B: a deployment ships a superset of solution UIs, tenant enablement controls visibility inside that superset.

## Acceptance Criteria

- [ ] One source of truth defines shipped solution UIs for the deployment bundle.
- [ ] Generated manifests/routes and runtime helpers agree on the shipped bundle.
- [ ] Vitest coverage proves shipped-vs-visible solution behavior.

## References

- Milestone: [M28-solution-visibility-tenant-access-ux.md](../../milestones/M28-solution-visibility-tenant-access-ux.md)
- Related: `docs/requirements/checklist.md` row 85, `wiki/design-docs/frontend-white-label.md`
