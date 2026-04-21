# T03: Staging-specific release-images.yaml + publish-platform-images update

> **Milestone**: M26.11-staging-bootstrap
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Give staging its own `release-images.yaml` pin that the
`publish-platform-images.yml` workflow updates in the **same commit** as
the prod pin. Post-merge, staging Flux (which tracks `main`) reconciles
the candidate SHA; `staging-e2e` (T04) validates the reconciled pin and
posts a commit status on `github.sha`. Release-pin PRs are left open
with auto-merge OFF in this iteration; the operator merges manually
after confirming a recent green `staging-e2e` on main (predecessor-main
model). The milestone-ideal PR-head status + auto-merge gate is
deferred — see T04 Implementation Notes for the Flux reconfiguration
that would be needed.

Before this change, the staging overlay patched from
`flux/clusters/production/apps/release-images.yaml` — so staging always
ran whatever was already pinned in prod, not the candidate the release-
pin PR was proposing. That coupling is what made the original release-
pin gate conceptually meaningless; this task breaks it so future work
can add real candidate-head validation.

## Subtasks

- [x] Add `infrastructure/kubernetes/flux/clusters/staging/apps/release-images.yaml`
  (initial content mirrors the current prod pin; the workflow bumps it from
  here on).
- [x] Add `infrastructure/scripts/hetzner/staging/update-hetzner-staging-release-images.sh`
  (mirrors the prod updater but targets the staging pin file).
- [x] Switch the staging overlay patch from the prod release-images to the
  new staging release-images.
- [x] Extend `.github/workflows/publish-platform-images.yml` to call the
  staging updater alongside the prod updater, stage BOTH pin files in the
  same release-pin commit, and include the staging updater in the workflow
  trigger `paths`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/flux/clusters/staging/apps/release-images.yaml` | Create | Staging image pin, initially mirrors prod |
| `infrastructure/scripts/hetzner/staging/update-hetzner-staging-release-images.sh` | Create | Bot-invoked updater that rewrites the staging pin file |
| `infrastructure/kubernetes/overlays/hetzner/staging/kustomization.yaml` | Modify | Patch points at staging pin instead of prod pin |
| `.github/workflows/publish-platform-images.yml` | Modify | Call staging updater; commit both pin files together; extend trigger paths |
| `docs/tasks/M26.11/PROGRESS.md` | Modify | Flip T03 status |
| `docs/tasks/M26.11/T03-staging-release-images.md` | Create | This file |

## Implementation Notes

- The staging `release-images.yaml` ships with the *same* SHAs as prod at
  landing time, so nothing about the current staging deploy changes on
  merge. The divergence starts with the next run of
  `publish-platform-images.yml`: the release-pin PR it opens bumps both
  files, and **after** manual merge, staging Flux reconciles the new
  SHA. Auto-merge is OFF on release-pin PRs in this iteration because
  `staging-e2e` cannot post a status on the PR head (T04). The operator
  confirms a recent green `staging-e2e` on main, then merges.
- No separate commit / no separate PR for the staging bump — single
  release-pin PR, two files bumped atomically.
- Staging uses `ghcr.io/jakit-labs/manibo/*` images just like prod. No
  staging-scoped image registry.

## Acceptance Criteria

- [x] `tools/scripts/infra/validate-k8s-overlays.sh` passes.
- [x] Manual dry-run of the staging updater successfully mutates the four
  image SHAs in `flux/clusters/staging/apps/release-images.yaml`.
- [x] Staging overlay builds cleanly and the rendered workload Deployments
  show the staging-pinned image SHAs.

## References

- Milestone: [M26.11-staging-bootstrap.md](../../milestones/M26.11-staging-bootstrap.md)
- Design decision #2 in M26.11 milestone
- Companion T04 ships the honest subset of this design (push:main status + manual merge on release-pin PRs); PR-head status + auto-merge are deferred until Flux on staging can track a release-candidate branch
