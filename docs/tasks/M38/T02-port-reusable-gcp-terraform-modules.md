# T02: Port reusable GCP Terraform modules

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Port the reusable GCP Terraform modules from the Saturn baseline into
`infrastructure/terraform/gcp/nfq/modules/**`, preserving the provider-local
module layout and adapting only what is needed for the Manibo/NFQ contract.

## Subtasks

- [x] **Create provider-local modules**: Add module directories for project
  bootstrap, networking, IAM, Artifact Registry, secrets, GKE, Cloud SQL,
  ingress DNS, observability, and workloads bootstrap.
- [x] **Preserve module interfaces**: Keep module inputs/outputs coherent so
  the environment roots can compose them without ad hoc rewrites.
- [x] **Adapt only repo-facing contract edges**: Adjust comments or docs where
  the Saturn wording leaks through, but avoid speculative refactors.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/modules/project_bootstrap/**` | Create | Project bootstrap module |
| `infrastructure/terraform/gcp/nfq/modules/networking/**` | Create | Network baseline module |
| `infrastructure/terraform/gcp/nfq/modules/iam_platform/**` | Create | IAM + GitHub OIDC module |
| `infrastructure/terraform/gcp/nfq/modules/artifact_registry/**` | Create | Artifact Registry module |
| `infrastructure/terraform/gcp/nfq/modules/secrets/**` | Create | Secret Manager module |
| `infrastructure/terraform/gcp/nfq/modules/gke_cluster/**` | Create | Private GKE cluster module |
| `infrastructure/terraform/gcp/nfq/modules/cloudsql_postgres/**` | Create | Cloud SQL PostgreSQL module |
| `infrastructure/terraform/gcp/nfq/modules/ingress_dns/**` | Create | HTTPS LB + DNS module |
| `infrastructure/terraform/gcp/nfq/modules/observability/**` | Create | Monitoring and alerting module |
| `infrastructure/terraform/gcp/nfq/modules/workloads_bootstrap/**` | Create | Namespaces, KSAs, and add-ons bootstrap module |

## Acceptance Criteria

- [x] All reusable GCP modules exist under `infrastructure/terraform/gcp/nfq/modules/**`.
- [x] The module tree is provider-local and does not introduce a fake shared Terraform surface.
- [x] Saturn-specific naming does not remain in module docs/comments where it would mislead NFQ users.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
