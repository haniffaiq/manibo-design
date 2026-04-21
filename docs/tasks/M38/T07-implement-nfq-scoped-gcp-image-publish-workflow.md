# T07: Implement an NFQ-scoped GCP Artifact Registry image publish workflow

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Parked
> **Estimate**: S (< 2h)
> **Depends on**: T04, T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M38 T07 - {short description}`

2. **One Milestone = One PR**
   - All tasks within this milestone go into the active `M38` PR
   - Do NOT open a separate PR for this task

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions

4. **Before Starting This Task**
   - Verify T04 and T06 are complete
   - Read `wiki/queries/2026-04-13-design-nfq-gcp-image-publish.md`
   - Check `docs/tasks/M38/PROGRESS.md` for current state

5. **Definition of Done**
   - A dedicated parked NFQ publish-workflow placeholder exists
   - The workflow documents the exported-repo activation prerequisites
   - The source repo does not pretend the publish lane is ready before the
     exported repo slug exists in Terraform WIF trust
   - Namespaced NFQ variables and environment contract are documented

6. **After Completing This Task**
   - Update `docs/tasks/M38/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Add a dedicated CI workflow contract for the exported NFQ repo that builds the
platform images and pushes them to the NFQ production Artifact Registry
repository in `europe-central2`. The workflow must be explicitly NFQ-scoped
because NFQ is distributed as a clean, client-facing codebase and must not
inherit the Manibo/Hetzner GHCR release lane or its variable names by
accident. The source monorepo must fail closed instead of publishing unsafe
generic images.

## Subtasks

- [x] **Add a dedicated parked placeholder**: keep
  `.github/workflows/publish-nfq-gcp-images.yml` as a manual no-op template
  that explains the exported-repo activation requirements
- [x] **Document NFQ-scoped auth and registry settings**: keep the dedicated
  NFQ GitHub environment / variable contract and Terraform WIF prerequisites
  recorded, but do not treat them as an active publish lane yet
- [x] **Fail closed in Terraform examples**: keep
  `ci_oidc.github_repositories = []` in the committed NFQ example tfvars until
  the exported NFQ repo actually exists
- [ ] **Activate exported-repo publish only**: add the exported NFQ repo slug
  to Terraform WIF trust, re-apply the production `platform` root, and
  rehydrate the real publish workflow only in that exported repo

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/publish-nfq-gcp-images.yml` | Modify | Parked NFQ publish-workflow placeholder |
| `docs/milestones/M38-nfq-gcp-bootstrap.md` | Modify | Extend M38 scope and acceptance criteria with T07 |
| `docs/tasks/M38/PROGRESS.md` | Modify | Track T07 progress and completion |
| `docs/tasks/M38/T07-implement-nfq-scoped-gcp-image-publish-workflow.md` | Create | Task contract |
| `docs/milestones/README.md` | Modify | Keep M38 task/readiness metadata current |
| `wiki/queries/2026-04-13-design-nfq-gcp-image-publish.md` | Modify | Record the namespacing/distribution constraint and final workflow contract |
| `wiki/index.md` | Modify | Index the new design note |
| `wiki/log.md` | Modify | Record the design/implementation outcome |

## Implementation Notes

- Reuse `tools/scripts/artifact/build-platform-images.sh` only after the
  exported NFQ repo slug exists in Terraform WIF trust and the publish lane is
  rehydrated in that exported repo.
- Keep the existing `publish-platform-images.yml` intent unchanged. It still
  belongs to GHCR + Hetzner production release pinning.
- Use a dedicated GitHub Environment such as `nfq-gcp-production`.
- Use NFQ-scoped variable names, not the repo-wide generic `GCP_*` names
  already used elsewhere.
- The web image needs NFQ-scoped build-time values too; do not inherit the
  Manibo production URLs from the GHCR publish workflow.
- This task stops at image publish. It does not update Flux pins or roll out to
  GKE.

## Acceptance Criteria

- [x] `.github/workflows/publish-nfq-gcp-images.yml` exists as a parked,
      NFQ-scoped placeholder
- [x] The workflow documents that exported-repo activation requires the NFQ
      repo slug to be added to Terraform WIF trust and re-applied
- [x] The future publish lane uses NFQ-scoped GitHub environment / variable
      names and does not reuse the generic repo-wide `GCP_*` variables
- [x] The existing GHCR/Hetzner publish workflow stays functionally unchanged
- [x] The source monorepo fails closed instead of publishing unconstrained
      generic images for NFQ
- [x] The committed NFQ example tfvars grant no source-repo GitHub WIF trust by
      default
- [ ] Publish proof from an exported NFQ repo into
      `europe-central2-docker.pkg.dev/call-platform-production/platform`
      remains pending until the exported repo slug exists and Terraform WIF
      trust is updated

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-image-publish.md`
