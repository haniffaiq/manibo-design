# T04: Implement platform roots with CI OIDC, GKE, Cloud SQL, and DNS

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: L (4-8h)
> **Depends on**: T03

---

## Description

Build the main `platform` Terraform roots for `staging` and `production`,
covering Terraform-owned GitHub OIDC, IAM/workload identities, Artifact
Registry, Secret Manager, GKE, Cloud SQL, authoritative Cloud DNS, and
observability.

## Subtasks

- [x] **Compose IAM + CI OIDC in Terraform**: Use the IAM platform module as
  the NFQ source of truth for GitHub OIDC / Workload Identity Federation.
- [x] **Wire cluster and database**: Provision private GKE and Cloud SQL using
  the network root outputs.
- [x] **Wire DNS and public service contracts**: Keep authoritative Cloud DNS
  in GCP and expose the ingress/load-balancer contract through Terraform.
- [x] **Wire observability primitives**: Add notification channels, uptime
  checks, and baseline alert policy support.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/staging/platform/**` | Create | Staging platform root |
| `infrastructure/terraform/gcp/nfq/environments/production/platform/**` | Create | Production platform root |

## Acceptance Criteria

- [x] The platform roots own NFQ GitHub OIDC / WIF in Terraform.
- [x] Cloud SQL, GKE, and DNS are composed through the platform roots.
- [x] The platform roots validate without live backend access.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
