# T06: Neutralize old wrappers, update docs, and verify the GCP roots

> **Milestone**: M38-nfq-gcp-bootstrap
> **Status**: Completed
> **Estimate**: M (2-4h)
> **Depends on**: T05

---

## Description

Make the new GCP root contract obvious in the repo, keep superseded wrapper
files from pretending to be the live surface, and run the Terraform validation
commands for every new root.

## Subtasks

- [x] **Update GCP READMEs**: Describe the four-root layout and the NFQ-owned
  CI/DNS/Cloud SQL contract in `infrastructure/terraform/gcp/**`.
- [x] **Neutralize superseded placeholders**: Turn the old thin wrapper files
  into clearly superseded compatibility notes rather than live Terraform roots.
- [x] **Run static Terraform proof**: Run format, init, and validate commands
  across every new root and record the evidence in `docs/tasks/M38/PROGRESS.md`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/README.md` | Modify | GCP tree contract |
| `infrastructure/terraform/gcp/nfq/environments/staging/README.md` | Modify | Staging environment contract |
| `infrastructure/terraform/gcp/nfq/environments/production/README.md` | Modify | Production environment contract |
| `infrastructure/terraform/gcp/nfq/environments/staging/{main.tf,outputs.tf,variables.tf}` | Modify | Superseded wrapper notes |
| `infrastructure/terraform/gcp/nfq/environments/production/{main.tf,outputs.tf,variables.tf}` | Modify | Superseded wrapper notes |
| `infrastructure/terraform/gcp/nfq/modules/shared-k8s/{README.md,main.tf,outputs.tf,variables.tf}` | Modify | Superseded placeholder notes |
| `docs/tasks/M38/PROGRESS.md` | Modify | Record verification outcomes |

## Acceptance Criteria

- [x] The GCP README surface points contributors at the real four-root layout.
- [x] Superseded placeholder files no longer read like the live Terraform contract.
- [x] Static Terraform verification has been executed and recorded.

## References

- Milestone: [M38-nfq-gcp-bootstrap.md](../../milestones/M38-nfq-gcp-bootstrap.md)
- Related: `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`
