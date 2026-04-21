# T08: Classify script ownership and update scripts, workflows, tests, and docs to the new infrastructure paths

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03, T04, T05, T06, T07
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.3 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T08 - classify script ownership and update path consumers`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.3-infrastructure-structure`
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
   - Check `docs/tasks/M26.3/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M26.3/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Classify script ownership and sweep the remaining non-Flux infrastructure path consumers so automation, tests, and operational docs point to the new tree instead of the retired `infra/` layout, while explicitly deciding which scripts remain repo-wide tooling under `tools/scripts/**` and which move under `infrastructure/scripts/**`.

## Subtasks

- [x] **Classify script ownership**: Decide which scripts stay in `tools/scripts/**` because they are repo-wide CI or harness tooling and which scripts move under `infrastructure/scripts/**` because they are environment-owned operations.
- [x] **Update remaining automation and workflows**: Fix non-Flux path triggers, deploy scripts, helper scripts, and CI policy classifiers that still depend on retired `infra/` paths after T07.
- [x] **Update tests and fixtures**: Fix architecture tests and any path-dependent harness helpers.
- [x] **Update active docs**: Update ops docs, milestone references, and any repo navigation docs that still point at old paths.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/scripts/**` | Create/Modify | Target home for infrastructure-owned operational scripts that do not belong in repo-wide tooling |
| `.github/workflows/*.yml` | Modify | Update path filters and script invocations |
| `tools/scripts/**` | Modify | Update infrastructure path references |
| `tools/agents/**` | Modify | Update any path-based CI policy or review logic |
| `tests/architecture/**` | Modify | Update path-dependent assertions |
| `docs/**` | Modify | Update active references to infrastructure paths |

## Implementation Notes

- Flux cluster-root consumers move atomically in T07. This task handles the remaining non-Flux infrastructure path sweep.
- Do not blindly move every infra-adjacent helper into `infrastructure/scripts/**`. `k3d`, CI harness, and generic validation helpers can stay in `tools/scripts/**` if they are repo-wide tooling.
- Historical docs may keep old paths when explicitly marked as historical context; active docs should not.
- Keep grep-based proof focused on active automation/docs, not archived historical artifacts.

## Acceptance Criteria

- [x] Active workflows, scripts, tests, and docs resolve the new infrastructure paths.
- [x] Script ownership is explicit: infra-owned operational scripts are moved or retained intentionally instead of ending up in the new tree by guesswork.
- [x] CI path filters and deploy scripts no longer reference retired root paths.
- [x] Remaining old-path references are either removed or explicitly quarantined as historical-only.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `docs/milestones/README.md`, `tools/scripts/infra/validate-k8s-overlays.sh`
