# T04: Re-enable staging-e2e push trigger (predecessor-main model)

> **Milestone**: M26.11-staging-bootstrap
> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: T03

---

## Description

Flip the `staging-e2e` workflow off its M26.9 T02d workflow-dispatch-only
holding pattern. With T01-T03 in place (runtime secrets landable, staging
gets its own release-images pin), the workflow can safely fire on every
push to main, posting a `staging-e2e` commit status that branch protection
can require.

The milestone's original intent ("staging-e2e posts its status on the
release-pin PR head") is explicitly NOT shipped in this task — see the
Implementation Notes below. Instead, T04 delivers the honest subset:
post-merge status on `github.sha`, with waiting/verification that actually
proves the staging cluster serves the expected SHA before E2E runs.

## Subtasks

- [x] Add `push: main` trigger.
- [x] Resolve `EXPECTED_SHA` per event type:
  - `workflow_dispatch`: input ref, falling back to `github.sha`.
  - `push`: `github.sha`.
- [x] Wait on the `staging-apps` Kustomization (not the root
  `flux-system`) so "ready" means the workload pin file + Deployment
  pods actually rolled.
- [x] Assert live Deployment image refs match
  `flux/clusters/staging/apps/release-images.yaml` before running
  E2E — fails closed if Flux reported Ready but the pods haven't
  rolled yet.
- [x] Remove auto-merge from `publish-platform-images.yml` — release-
  pin PRs are now left open for manual merge because `staging-e2e`
  cannot validate the PR head.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/staging-e2e.yml` | Modify | Enable `push: main`; wait on `staging-apps` Kustomization; assert live image digests match pin file |
| `.github/workflows/publish-platform-images.yml` | Modify | Remove `gh pr merge --auto --merge`; release-pin PRs require manual merge |
| `docs/tasks/M26.11/PROGRESS.md` | Modify | Flip T04 status |
| `docs/tasks/M26.11/T04-staging-e2e-triggers.md` | Create | This file |

## Implementation Notes

- **Deliberately NO `pull_request` trigger.** An earlier draft posted a
  `staging-e2e` status on the release-pin PR head SHA while actually
  validating `pull_request.base.sha` (current main tip); the review bot
  correctly flagged this as dishonest — branch protection would get a
  green status on a SHA that was never tested. Dropped the lie: the only
  status this workflow posts is on `github.sha` after a push to main.
- **Release promotion is now manual.** Since `staging-e2e` cannot run
  against the release-pin PR head, auto-merge was removed from
  `publish-platform-images.yml`. The workflow opens the release-pin PR
  and leaves it for the operator to merge after confirming a recent green
  `staging-e2e` status on main. Auto-merge with a "required check" claim
  was either deadlocking or promoting without candidate validation;
  manual merge is the honest shape until a true candidate-head gate
  exists.
- **Reconcile wait is scoped to `staging-apps`, not root.** The root
  `flux-system` Kustomization goes Ready as soon as its child CRs are
  applied, which does not imply `staging-apps` reconciled the new
  `release-images.yaml` or rolled the workload pods. Waiting on
  `staging-apps` specifically closes that race.
- **Live image assertion catches the remaining race.** Even after
  `staging-apps` is Ready, a release-pin bump might leave pods mid-roll.
  The new step reads the pinned image refs out of
  `flux/clusters/staging/apps/release-images.yaml` and compares them
  against what the live Deployment objects actually report. If any
  differ, the job fails before E2E runs — better a red gate than a
  false-green on the predecessor pin.
- True candidate-head validation (staging reconciles the PR branch
  before merge) would require Flux to be reconfigured against a
  release-candidate branch. Left as a follow-up.

## Acceptance Criteria

- [x] Workflow YAML parses.
- [x] `publish-platform-images.yml` no longer calls `gh pr merge --auto`.
- [ ] First green `staging-e2e` run on a push to main confirms the
  reconcile wait + live-image assertion are functional (verified
  during T07).

## References

- Milestone: [M26.11-staging-bootstrap.md](../../milestones/M26.11-staging-bootstrap.md)
- Design decision #2 in the milestone (release-pin gate convergence)
- Predecessor: M26.9 T04 (release-pin gate scaffolding)
