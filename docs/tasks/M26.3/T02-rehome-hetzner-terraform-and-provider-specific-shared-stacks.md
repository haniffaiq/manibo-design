# T02: Rehome Hetzner Terraform and Hetzner-only shared stacks

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Activation Note**: M26.3 was explicitly activated by the human on 2026-04-02. This task is complete.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T02 - rehome hetzner terraform stacks`

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

Move the live Hetzner Terraform roots and Hetzner-only root stacks into the provider-isolated tree, including `ci-runner` and `vault-sops`, without changing their runtime behavior. Hetzner Kubernetes overlays and Helm values stay owned by T06; this task owns the Terraform/root-stack path move plus every direct consumer of those moved paths. Reserved-but-unimplemented Hetzner staging roots are classified by T10, not migrated here.

## Subtasks

- [ ] **Move the live Hetzner environment root**: Rehome the production Terraform entrypoints into `infrastructure/terraform/hetzner/environments/**`.
- [ ] **Move Hetzner-only root stacks**: Rehome `ci-runner` and `vault-sops` into `infrastructure/terraform/hetzner/shared/**`.
- [ ] **Update direct path consumers atomically**: Rewire workflows, render/bootstrap/recovery scripts, runner scripts, and path-based tests that point at the moved Terraform/root-stack paths.
- [ ] **Fix relative module and doc references**: Update internal paths, examples, and README instructions to the new tree.
- [ ] **Leave speculative staging out of the move**: Do not create a Hetzner Terraform staging root unless T10 first promotes a real staging source tree into scope.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infra/environments/hetzner/production/**` | Move/Modify | Source Hetzner production Terraform/support-stack paths that become provider-isolated stacks; exclude `k8s/**` and `helm-values/**`, which T06 owns |
| `infra/environments/hetzner/shared/vault-sops/**` | Move/Modify | Source Hetzner Vault/SOPS root stack |
| `infra/ci-runner/**` | Move/Modify | Hetzner-only runner provisioning moved under provider ownership |
| `infrastructure/terraform/hetzner/**` | Create | Target Hetzner Terraform tree |
| `.github/workflows/flux-production-deploy.yml` | Modify | Keep production deploy triggers aligned with moved Terraform paths |
| `.github/workflows/hetzner-production-ops.yml` | Modify | Update production ops workflow path contracts |
| `infrastructure/scripts/hetzner/production/render-hetzner-production-ci-inputs.sh` | Modify | Update Terraform env-root paths |
| `infrastructure/scripts/hetzner/production/render-hetzner-production-kubeconfig.sh` | Modify | Update Terraform env-root paths |
| `infrastructure/scripts/hetzner/shared/bootstrap-monitoring-vm.sh` | Modify | Update monitoring stack paths |
| `infrastructure/scripts/hetzner/shared/bootstrap-vault-vm.sh` | Modify | Update vault stack paths |
| `infrastructure/scripts/hetzner/production/restore-hetzner-production-from-backup.sh` | Modify | Update production env-root paths |
| `infrastructure/scripts/hetzner/production/run-hetzner-recovery-drill.sh` | Modify | Update production env-root paths |
| `infrastructure/scripts/hetzner/production/force-relocate-hetzner-cluster.sh` | Modify | Update production env-root paths |
| `infrastructure/scripts/hetzner/production/retire-hetzner-legacy-backups.sh` | Modify | Update production env-root paths |
| `tools/scripts/ci/runner/rollout-runners.sh` | Modify | Update runner stack paths |
| `tests/architecture/test_ci_runner_prewarm.py` | Modify | Update runner stack path assertions |
| `tests/architecture/test_ci_runner_warm_floor_defaults.py` | Modify | Update runner stack path assertions |
| `wiki/architecture/ci.md` | Modify | Update runner provisioning paths |
| `wiki/ops/hetzner-*.md` | Modify | Update Hetzner production/recovery runbooks to the new paths |

## Implementation Notes

- Do not “genericize” Hetzner-specific logic during the move.
- Keep backend, tfvars, and secret file contracts stable unless a path update is required.
- Treat `ci-runner` and `vault-sops` as Hetzner-owned root stacks, not provider modules with duplicate homes.
- T06 owns Hetzner Kubernetes overlays and Helm values. This task owns the Terraform/root-stack move and every direct consumer of those moved paths.
- Preserve recovery/runbook semantics; this task is structure, not behavior change.
- Hetzner staging is currently a reserved placeholder, not a live Terraform root. Do not fabricate a staging root here just to make the tree look symmetrical.

## Acceptance Criteria

- [ ] The live Hetzner Terraform roots live under `infrastructure/terraform/hetzner/**`.
- [ ] `ci-runner` no longer lives in a fake neutral top-level directory.
- [ ] Direct workflows, scripts, and path-based tests that reference the moved Hetzner Terraform/root-stack paths are updated in the same commit.
- [ ] Hetzner runbooks point to the new Terraform paths.
- [ ] This task does not invent a Hetzner Terraform staging root that the current repo does not implement.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `infrastructure/terraform/hetzner/environments/production/README.md`, `infrastructure/terraform/hetzner/shared/ci-runner/README.md`
