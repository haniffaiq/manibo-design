# T01: Activate the Staging Terraform Contract and State

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: M38.2

## Description

Turn the existing NFQ GCP staging Terraform roots from placeholder-ready into an
apply-ready contract. This task does not create the Kubernetes runtime overlay;
it proves the cloud foundation can converge with dedicated staging values.

## Subtasks

- [ ] **Project boundary**: Confirm the dedicated staging GCP project, project
      number, state bucket, region, and admin principals.
- [ ] **State bootstrap**: Verify `project_bootstrap` can own the staging APIs,
      KMS key ring, and regional state bucket.
- [ ] **Root validation**: Validate `network`, `platform`,
      `workloads_bootstrap`, and `google_runtime` with staging inputs.
- [ ] **Example hygiene**: Keep committed examples placeholder-safe while
      documenting every private value operators must supply.
- [ ] **Evidence capture**: Record exact Terraform commands and live blockers in
      `docs/tasks/M38.3/PROGRESS.md`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/gcp/nfq/environments/staging/README.md` | Modify | Document the real apply order and required private inputs |
| `infrastructure/terraform/gcp/nfq/environments/staging/staging.tfvars.example` | Modify | Keep placeholders honest and staging-specific |
| `docs/tasks/M38.3/PROGRESS.md` | Modify | Track validation and apply evidence |

## Implementation Notes

- Do not commit private `staging.tfvars`.
- Do not point staging at `call-platform-production` unless the human explicitly
  approves a shared-project staging boundary.
- Staging root validation should use the same Terraform version family as M38
  and M38.2.

## Acceptance Criteria

- [ ] All five staging Terraform roots validate.
- [ ] The committed example cannot be mistaken for production values.
- [ ] Any live apply blocker is recorded with the exact root and error.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Design: `wiki/design-docs/nfq-gcp-staging-environment.md`
