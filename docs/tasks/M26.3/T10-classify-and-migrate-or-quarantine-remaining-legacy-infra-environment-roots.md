# T10: Classify and migrate or quarantine remaining legacy `infra/environments` roots

> **Milestone**: M26.3-infrastructure-directory-structure-migration
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T05, T06
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-02. Do not implement until M26.3 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M26.3 T10 - classify remaining legacy infra roots`

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

Classify the remaining tracked roots under `infra/environments/local/**`, `infra/environments/ci/**`, `infra/environments/shared/**`, `infra/environments/tenants/**`, and reserved Hetzner staging paths under `infra/environments/hetzner/staging/**`, then either migrate them into the new `infrastructure/` contract or quarantine them explicitly so T09 does not silently delete live paths. Shared-wrapper pieces already pulled forward as direct dependencies by T03 or T05 are not double-owned here; this task owns what remains after those task-local path contracts are satisfied.

## Subtasks

- [x] **Inventory remaining non-provider and reserved roots**: Confirm what `local`, `ci`, `shared`, `tenants`, and Hetzner staging actually own today and whether each path is active, transitional, or historical.
- [x] **Decide destination or quarantine**: For each root, either assign a concrete target under `infrastructure/**` or mark it as explicitly quarantined legacy material with ownership and deletion conditions.
- [x] **Update docs and cleanup contract**: Make the milestone, progress tracker, and any active runbooks/docs reflect the final decision so T09 can clean up honestly.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infra/environments/local/**` | Modify/Move | Local environment roots that need migration or quarantine |
| `infra/environments/ci/**` | Modify/Move | Legacy CI environment roots that need migration or quarantine |
| `infra/environments/shared/**` | Modify/Move | Legacy shared wrappers/manifests that need migration or quarantine |
| `infra/environments/tenants/**` | Modify/Move | Legacy tenant-specific roots that need migration or quarantine |
| `infra/environments/hetzner/staging/**` | Modify/Move | Reserved Hetzner staging paths that need explicit migration or quarantine ownership |
| `infrastructure/**` | Create/Modify | Target home for any roots that remain active under the new contract |
| `docs/milestones/M26.3-infrastructure-directory-structure-migration.md` | Modify | Keep the cleanup contract honest |
| `docs/tasks/M26.3/PROGRESS.md` | Modify | Record classification decisions and guardrails |
| `wiki/ops/**/*.md` | Modify | Update any active references if migration/quarantine decisions affect operator paths |

## Implementation Notes

- Do not silently delete these roots under a generic “cleanup” task. They are real tracked directories today.
- A quarantine decision is acceptable only if the docs say who owns it, why it is still present, and what event allows final deletion.
- Prefer migration for active paths and quarantine for historical or tenant-specific leftovers that do not belong in the new canonical tree yet.
- If another task must pull a `shared/**` dependency forward to stay atomic, let that task own the direct dependency rewrite and keep T10 focused on the remaining legacy root cleanup/quarantine decision.

## Acceptance Criteria

- [x] `infra/environments/local/**`, `infra/environments/ci/**`, `infra/environments/shared/**`, `infra/environments/tenants/**`, and `infra/environments/hetzner/staging/**` are explicitly classified as migrated or quarantined.
- [x] The milestone no longer implies blanket `infra/**` retirement without handling these roots.
- [x] T09 can delete or retain old paths based on explicit documented decisions instead of guesswork.

## References

- Milestone: [M26.3-infrastructure-directory-structure-migration.md](../../milestones/M26.3-infrastructure-directory-structure-migration.md)
- Related: `infra/environments/README.md`, `infra/environments/local/main.tf`, `infra/environments/ci/main.tf`, `infra/environments/shared/k8s/main.tf`, `infra/environments/tenants/nfq-client-azure/main.tf`, `infra/environments/hetzner/staging/README.md`
