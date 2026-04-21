# T09: Verification, old-path cleanup, and proof capture

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T08, T10
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.3 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T09 - verify infrastructure tree migration`

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

Prove the migrated tree works, delete any remaining retired path scaffolding, and capture the evidence needed to keep the milestone honest.

## Subtasks

- [x] **Run focused Terraform and kustomize checks**: Verify representative Terraform roots and Kubernetes overlays from the new paths.
- [x] **Run focused tests**: Execute path-dependent architecture and helper tests that cover the moved infrastructure contracts.
- [x] **Remove retired scaffolding**: Delete any temporary compatibility shims or placeholder old-path remnants that are no longer needed.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M26.3/PROGRESS.md` | Modify | Record task completion and evidence |
| `docs/milestones/M26.3-infrastructure-directory-structure-migration.md` | Modify | Update verification notes if the final proof set changes |
| `infra/**` | Delete/Modify | Remove retired legacy structure once all consumers are migrated |
| `clusters/**` | Delete/Modify | Remove retired top-level cluster paths once Flux roots move |

## Implementation Notes

- This task is where destructive cleanup belongs. Do not delete legacy paths earlier unless the replacement already works.
- Under the current safety rules, retained top-level pointer/quarantine docs are
  acceptable evidence when a destructive delete is not explicitly approved.
- Do not delete legacy `infra/environments/{ci,shared,tenants}` roots until T10 has explicitly migrated or quarantined them.
- Do not delete legacy `infra/environments/hetzner/staging/**` until T10 has explicitly classified it as migrated or quarantined.
- T09 must not count the local/CI overlay proof as complete until T05 has updated kustomize validation to cover the migrated local/default, local/offline, and CI overlay paths.
- Capture evidence from real commands, not “should work” prose.
- Keep proof scoped to path-contract migration, not broader production deployment claims.

## Acceptance Criteria

- [x] Representative Terraform roots initialize from the new tree.
- [x] Kubernetes validation and targeted architecture tests pass against the new paths.
- [x] Retired `infra/` and `clusters/` scaffolding is removed or clearly quarantined, and no legacy root owned by T10 is deleted before classification.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `docs/requirements/checklist.md` rows 62 and 64
