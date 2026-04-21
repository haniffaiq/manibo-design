# T02: Create the GCP Staging Kubernetes Overlay and Public Edge Contract

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01

## Description

Create the `gcp/staging` Kubernetes overlay and public edge contract needed for
a real NFQ staging runtime. This is the staging counterpart to the production
overlay, but it must not copy production hostnames, production secret names, or
LiveKit Cloud mode assumptions.

## Subtasks

- [ ] **Overlay foundation**: Add
      `infrastructure/kubernetes/overlays/gcp/staging`.
- [ ] **Runtime config**: Patch staging API, web, temporal worker, and
      agent-worker settings with staging hostnames and staging Cloud SQL config.
- [ ] **Public edge**: Model staging web/API hostnames and NEG/public-edge
      outputs without using production DNS names.
- [ ] **Operator scripts**: Add or generalize GCP staging scripts for image pin
      updates, runtime deploy, and Cloud SQL bootstrap.
- [ ] **Architecture proof**: Add namespaced NFQ/GCP tests that fail if staging
      renders production values.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/gcp/staging/**` | Create | Staging runtime overlay |
| `infrastructure/scripts/gcp/staging/**` | Create | Staging operator scripts if production scripts cannot be parameterized cleanly |
| `infrastructure/terraform/gcp/nfq/environments/staging/**` | Modify | Public edge outputs and staging hostname contract if needed |
| `tests/architecture/nfq/gcp/test_staging_overlay_runtime_contracts.py` | Create | Namespaced staging overlay architecture guard |
| `docs/tasks/M38.3/PROGRESS.md` | Modify | Track render and contract evidence |

## Implementation Notes

- Prefer parameterizing existing GCP production scripts only if the result stays
  clearer than separate staging scripts.
- Staging public domains should be temporary `jakitlabs.com` names until NFQ
  gives an owned domain, matching the production M38.1 pattern.
- The overlay must render before any live cluster apply.

## Acceptance Criteria

- [ ] `kubectl kustomize infrastructure/kubernetes/overlays/gcp/staging`
      renders successfully.
- [ ] The rendered staging overlay contains no production hostnames, production
      DIDs, or LiveKit Cloud production URLs.
- [ ] Namespaced NFQ/GCP staging architecture tests pass.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Related: `docs/milestones/M38.1-nfq-public-edge-and-auth-readiness.md`
