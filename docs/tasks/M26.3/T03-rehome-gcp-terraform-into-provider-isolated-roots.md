# T03: Rehome GCP Terraform into provider-isolated modules and environment roots

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Completed**: 2026-04-02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T03 - rehome gcp terraform roots`

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

Move the currently implemented GCP Terraform wrappers into the provider-isolated tree without inventing a deeper root-stack split that the repo does not implement yet. This task rehomes the live GCP environment wrappers and any real provider-local modules as-is, owns the dependency rewrite needed because those wrappers currently import `../../shared/k8s`, and then classifies legacy `infra/terraform/**` stubs so they stop masquerading as durable structure.

## Subtasks

- [x] **Create the GCP provider tree**: Rehome active GCP environment wrappers into `infrastructure/terraform/gcp/nfq/environments/**`.
- [x] **Rehome real provider-local modules only**: Move existing GCP-local modules into `infrastructure/terraform/gcp/nfq/modules/**` only when a real source module exists; do not fabricate empty module directories for symmetry.
- [x] **Rewrite the shared-wrapper dependency atomically**: Update the moved GCP wrappers so their current `../../shared/k8s` dependency still resolves in the same commit, either by rehoming the shared dependency they need or by pointing explicitly at the transitional legacy location that T10 later cleans up.
- [x] **Kill misleading legacy stubs**: Remove or quarantine old `infra/terraform/**` paths once the new GCP tree owns the contract.
- [x] **Gate deeper stack splits honestly**: Any later split into `project-bootstrap`, `network`, `platform`, or `gitops-bootstrap` root stacks requires real source stacks or active consumers first; it is not part of this task by default.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infra/environments/gcp/**` | Move/Modify | Source GCP environment roots |
| `infra/environments/shared/k8s/**` | Modify/Move | Shared wrapper dependency currently imported by GCP env roots; update this path contract in the same commit as the GCP move |
| `infra/terraform/**` | Move/Delete | Legacy Terraform tree replaced by provider-isolated roots |
| `infrastructure/terraform/gcp/**` | Create | Target GCP Terraform tree |
| `wiki/distribution/nfq/clean-repo-migration-prep-2026-04-01.md` | Modify | Update GCP-facing path references if they stay active |
| legacy platform-v3 consolidated review notes (row 7.24) | Modify | Remove stale references to dead Terraform structure if those notes are ever restored as active documentation |

## Implementation Notes

- GCP owns Cloud SQL in Terraform; do not create a fake shared Kubernetes database path.
- Prefer provider-local modules over a global common module tree, but only when there is actual repeated GCP logic to extract.
- If old `infra/terraform` remains temporarily for migration compatibility, mark it clearly as transitional and delete or quarantine it in T10.
- Do not strand moved GCP wrappers with dead relative imports. If the shared wrapper stays in the legacy tree temporarily, the new GCP wrappers must point there explicitly and T10 must own the later cleanup.
- The `project-bootstrap` / `network` / `platform` / `gitops-bootstrap` split is an optional future refactor, not mandatory acceptance for this path-migration task.

## Acceptance Criteria

- [x] GCP Terraform lives under `infrastructure/terraform/gcp/**` with provider-local env roots that faithfully rehome the currently implemented wrappers.
- [x] The moved GCP env roots resolve their shared wrapper dependency in the same commit; no broken `../../shared/k8s` import path remains.
- [x] Any provider-local module directories created by this task correspond to real extracted GCP logic, not empty symmetry placeholders.
- [x] Any future split into multiple GCP root stacks is explicitly gated on real source stacks or active consumers and is not required for T03 completion.
- [x] Legacy stub `infra/terraform` paths no longer masquerade as the durable deployment structure.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: legacy platform-v3 consolidated review row 7.24
