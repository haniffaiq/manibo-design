# T04: Rehome SOPS policy/config and secret-path contracts under `infrastructure/sops`

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Activation Note**: The human explicitly activated M26.3 on 2026-04-02 after the planning backlog landed on `main`.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T04 - rehome sops policy and config`

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

Move the repo-owned SOPS configuration and baseline secret-path policy into `infrastructure/sops/**`, update direct consumers to the new config location, and keep provider-specific secret backends such as Hetzner Vault transit under provider-owned Terraform. Later tasks that physically move secret-bearing directories own the corresponding path-rule rewrites in the same commit as those moves.

## Subtasks

- [x] **Move global SOPS config**: Rehome `.sops.yaml` into `infrastructure/sops/.sops.yaml`.
- [x] **Preserve live baseline coverage**: Make sure the moved config still covers the currently live secret-bearing paths when the config home changes.
- [x] **Update direct SOPS consumers atomically**: Point runtime secret helpers, workflow path filters, and active docs at the new SOPS config path in the same commit as the config move.
- [x] **Document backend ownership**: Make it explicit that `infrastructure/sops/**` owns policy/config, while Hetzner `vault-sops` remains provider-specific Terraform.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.sops.yaml` | Move/Modify | Source repo-wide SOPS path policy |
| `infrastructure/sops/.sops.yaml` | Create | Target SOPS config location |
| `infrastructure/sops/README.md` | Create | Explain SOPS ownership and backend split |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify | Update `--config` path if needed |
| `.github/workflows/flux-production-deploy.yml` | Modify | Keep deploy triggers aligned with the moved SOPS policy path |
| `wiki/ops/k3d-local-stack.md` | Modify | Update SOPS path and operator instructions |
| `wiki/ops/hetzner-security-gdpr.md` | Modify | Update SOPS setup references |

## Implementation Notes

- Do not move Hetzner Vault bootstrap into the global SOPS directory; that backend stays under Hetzner Terraform.
- Preserve path coverage for the currently live encrypted secret manifests after the config move.
- Move the live config and its direct consumers together. A repo-root `.sops.yaml` path filter must not be left behind after the config moves.
- Keep the final config readable; this is policy, not a dumping ground for environment prose.
- T05, T06, and T07 move secret-bearing directories. Those tasks own the corresponding SOPS rule rewrites in the same commit as their path moves.

## Acceptance Criteria

- [x] Repo-owned SOPS config lives under `infrastructure/sops/.sops.yaml`.
- [x] The moved SOPS config still covers the currently live secret-bearing paths immediately after the config-home move.
- [x] Direct SOPS consumers, including the Hetzner production deploy workflow trigger, use the new SOPS config location in the same commit.
- [x] Provider-specific secret backends remain under provider-owned Terraform instead of leaking into the global SOPS directory.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `.sops.yaml`, `infrastructure/terraform/hetzner/shared/vault-sops/README.md`
