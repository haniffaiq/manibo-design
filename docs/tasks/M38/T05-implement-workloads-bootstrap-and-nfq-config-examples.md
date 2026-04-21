# T05: Implement workloads bootstrap roots and NFQ config examples

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T04

---

## Description

Create the `workloads_bootstrap` roots and provide repo-committed NFQ example
configuration that shows how to fill the environment contract without leaking
real tenant values or secrets.

## Subtasks

- [x] **Create `workloads_bootstrap` roots**: Add the Kubernetes/Helm roots for
  both environments.
- [x] **Create NFQ example tfvars contracts**: Add `staging.tfvars.example` and
  `production.tfvars.example` with placeholder but structurally correct values.
- [x] **Model NFQ workload identities and namespaces**: Keep the example config
  aligned to the current Manibo workload shape.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/staging/workloads_bootstrap/**` | Create | Staging workloads bootstrap root |
| `infrastructure/terraform/gcp/nfq/environments/production/workloads_bootstrap/**` | Create | Production workloads bootstrap root |
| `infrastructure/terraform/gcp/nfq/environments/staging/staging.tfvars.example` | Create | Staging example configuration |
| `infrastructure/terraform/gcp/nfq/environments/production/production.tfvars.example` | Create | Production example configuration |

## Acceptance Criteria

- [x] Both environments have `workloads_bootstrap` roots.
- [x] Example tfvars files exist and model the shared environment contract used across the four roots.
- [x] No real credentials or live project-specific secrets are committed.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
