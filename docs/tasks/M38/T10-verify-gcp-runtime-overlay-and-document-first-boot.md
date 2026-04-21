# T10: Verify GCP Runtime Overlay And Document First Boot

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T08, T09

---

## Description

Prove the new GCP runtime overlay renders cleanly, the scripts pass dry
verification, and the remaining blockers for first boot are explicit in docs
instead of hidden inside the implementation.

## Subtasks

- [x] **Render proof**: run `kustomize build` for the new overlay.
- [x] **Script proof**: run shell syntax checks and runtime secret render proof
      for the GCP overlay.
- [x] **Durability**: update milestone progress and wiki/log references with the
      first-boot status and remaining live blockers.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M38/PROGRESS.md` | Modify | Mark verification state and blockers |
| `wiki/log.md` | Modify | Capture the overlay landing and first-boot blockers |
| `wiki/index.md` | Modify | Index the new runtime overlay docs if needed |

## Implementation Notes

- Verification here is render/dry-run proof, not just “files exist”.
- If live boot is still blocked on missing operator-owned secrets or DNS, say
  so explicitly with the exact missing inputs.

## Acceptance Criteria

- [x] `kustomize build infrastructure/kubernetes/overlays/gcp/production`
      succeeds.
- [x] `bash -n` succeeds for every new GCP production script.
- [x] The remaining first-boot blockers are documented in the milestone
      progress and wiki.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Tasks: [T08-create-gcp-production-runtime-overlay.md](T08-create-gcp-production-runtime-overlay.md),
  [T09-add-gcp-runtime-bootstrap-and-deploy-scripts.md](T09-add-gcp-runtime-bootstrap-and-deploy-scripts.md)
