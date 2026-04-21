# T04: Create temporary Route53 DNS for `nfq.jakitlabs.com` and `api.nfq.jakitlabs.com`

> **Milestone**: M38.1-nfq-public-edge-and-auth-readiness
> **Status**: Done
> **Estimate**: S (30-60m)
> **Depends on**: T02

---

## Description

Create the temporary public DNS records in Route53 after the GCP public load
balancer exists. This task is intentionally separate from Terraform because
`jakitlabs.com` is Route53-owned and we explicitly do not want GCP Cloud DNS to
pretend it is authoritative for that temporary domain.

## Outcomes

- Hosted zone: `jakitlabs.com.` (`Z0146836CGRMNBZ74QG8`)
- Change request: `/change/C06513283B26NGT5M0UN1`
- Records:
  - `api.nfq.jakitlabs.com A 34.54.127.17`
  - `nfq.jakitlabs.com A 34.149.188.63`

## Verification Evidence

- Route53 change reached `INSYNC`
- DNS checks:
  - `dig +short api.nfq.jakitlabs.com A`
  - `dig +short nfq.jakitlabs.com A`
- GCP cert status after DNS:
  - `gcloud compute ssl-certificates describe api-cert --global --project call-platform-production`
  - `gcloud compute ssl-certificates describe web-cert --global --project call-platform-production`

## References

- Milestone: [M38.1-nfq-public-edge-and-auth-readiness.md](../../milestones/M38.1-nfq-public-edge-and-auth-readiness.md)
- Progress: [PROGRESS.md](PROGRESS.md)
