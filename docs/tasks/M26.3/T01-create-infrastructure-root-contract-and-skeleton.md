# T01: Create the canonical `infrastructure/` root contract and skeleton

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None
> **Activation Note**: M26.3 was explicitly activated by the human on 2026-04-02. This task is complete.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T01 - create infrastructure root contract`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M26.3-infrastructure-migration`
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

Create the canonical `infrastructure/` root layout, including the repo-owned SOPS home, and write the documentation contract so later migration commits have a stable target instead of freestyle directory churn.

## Subtasks

- [ ] **Create root directories**: Add the top-level `infrastructure/` tree with the agreed Terraform, Kubernetes, SOPS, and script subdirectories.
- [ ] **Write root READMEs**: Define ownership and naming rules in `infrastructure/README.md`, `infrastructure/terraform/README.md`, and `infrastructure/kubernetes/README.md`.
- [ ] **Define SOPS home**: Add `infrastructure/sops/README.md` and document the future `.sops.yaml` target location without creating a second live config yet.
- [ ] **Fence the old paths**: Update milestone/docs references so future tasks treat `infra/` and `clusters/` as migration sources, not the durable contract.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/README.md` | Create | Canonical root contract for infrastructure layout |
| `infrastructure/terraform/README.md` | Create | Provider-isolated Terraform ownership rules |
| `infrastructure/kubernetes/README.md` | Create | Shared base, overlay, and Flux directory rules |
| `infrastructure/sops/README.md` | Create | Repo-owned SOPS policy and secret-path contract |
| `docs/milestones/M26.3-infrastructure-directory-structure-migration.md` | Modify | Keep the target tree and task notes aligned with the implemented skeleton |
| `docs/tasks/M26.3/PROGRESS.md` | Modify | Mark task completion and any migration guardrails discovered during implementation |

## Implementation Notes

- Do not move production files yet; this task creates the target contract and skeleton only.
- Keep directory names consistent with the milestone tree as it exists now: provider roots, `base`, `overlays`, `flux`, and `sops`. Do not smuggle in optional future splits such as `project-bootstrap` or `gitops-bootstrap`.
- Keep provider-specific SOPS backends out of the global SOPS home. `infrastructure/sops/**` owns config and policy, not Hetzner Vault resources.
- Do not create a second live `.sops.yaml` in this task. The real SOPS config move happens atomically in T04 with consumer rewiring.
- Create only durable bucket directories in the skeleton. Do not add empty future provider/environment overlays or Flux cluster roots just for symmetry.
- Prefer minimal placeholder files over speculative content.

## Acceptance Criteria

- [ ] The repo has an `infrastructure/` root with the agreed top-level subdirectories.
- [ ] The root skeleton includes an explicit `infrastructure/sops/` home for repo-owned SOPS config.
- [ ] Root READMEs explain ownership well enough that later tasks do not need to guess where things belong.
- [ ] No production/runtime path references are moved in this task beyond documentation-level contract updates.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: legacy platform-v3 consolidated review row 7.24
