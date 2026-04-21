# T03: Implement project bootstrap and network roots

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

Create real `project_bootstrap` and `network` Terraform roots for both
`staging` and `production` under `infrastructure/terraform/gcp/nfq/environments/**`.

## Subtasks

- [x] **Create environment root directories**: Add `project_bootstrap/` and
  `network/` under both `staging` and `production`.
- [x] **Wire module composition**: Hook the new roots to the provider-local
  modules with correct backend/provider blocks and outputs.
- [x] **Carry remote-state seams explicitly**: Ensure later roots can consume
  network outputs via Terraform remote state instead of hidden lookups.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/staging/project_bootstrap/**` | Create | Staging project bootstrap root |
| `infrastructure/terraform/gcp/nfq/environments/staging/network/**` | Create | Staging network root |
| `infrastructure/terraform/gcp/nfq/environments/production/project_bootstrap/**` | Create | Production project bootstrap root |
| `infrastructure/terraform/gcp/nfq/environments/production/network/**` | Create | Production network root |

## Acceptance Criteria

- [x] Both environments have real `project_bootstrap` and `network` roots.
- [x] Root outputs expose the VPC/network state later roots need.
- [x] `terraform init -backend=false` and `terraform validate` succeed for these roots.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
