# T02: Enable the GCP public edge for NFQ web and API

> **Milestone**: M38.1-nfq-public-edge-and-auth-readiness
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Stand up the Terraform-managed GCP public edge for the existing private NFQ
runtime without trying to solve DNS delegation or OIDC in the same step. This
task should prepare both the web and API services for standalone NEGs, expose
the edge IPs as Terraform outputs, and switch the production examples from the
old placeholder `nfq.example.com` contract to the temporary `jakitlabs.com`
contract the team is actually using.

## Subtasks

- [x] **Prepare standalone NEG backends for both web and API**: annotate the
      GCP production services with stable NEG names so Terraform can attach
      load-balancer backends deterministically.
- [x] **Model the production public edge for both hostnames**: update the
      production Terraform example so it reflects `nfq.jakitlabs.com` and
      `api.nfq.jakitlabs.com`, keeps temporary DNS out of GCP Cloud DNS, and
      defines health checks for both services.
- [x] **Expose edge outputs for follow-on DNS work**: publish the public IP
      outputs from the platform root so Route53 can be wired without manual GCP
      console lookups.
- [x] **Verify the render/validate surfaces**: prove the overlay renders and
      the Terraform roots still validate after the public-edge changes.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M38.1/T02-enable-gcp-public-edge-for-web-and-api.md` | Create | Durable execution contract for this task |
| `docs/tasks/M38.1/PROGRESS.md` | Modify | Mark T02 in progress and capture blockers |
| `docs/milestones/M38.1-nfq-public-edge-and-auth-readiness.md` | Modify | Reflect that T02 is active |
| `infrastructure/kubernetes/overlays/gcp/production/kustomization.yaml` | Modify | Include the web NEG patch |
| `infrastructure/kubernetes/overlays/gcp/production/patch-platform-api-service-neg.yaml` | Modify | Give API a stable standalone NEG name |
| `infrastructure/kubernetes/overlays/gcp/production/patch-platform-web-service-neg.yaml` | Create | Give web a stable standalone NEG name |
| `infrastructure/terraform/gcp/nfq/environments/production/production.tfvars.example` | Modify | Model the temporary NFQ public edge without Cloud DNS ownership |
| `infrastructure/terraform/gcp/nfq/environments/production/platform/outputs.tf` | Modify | Surface public-edge IP outputs |
| `infrastructure/terraform/gcp/nfq/environments/staging/platform/outputs.tf` | Modify | Keep output contracts aligned across environments |
| `tests/architecture/test_gcp_production_overlay_internal_api_token.py` | Modify | Verify both standalone NEG annotations render as intended |

## Implementation Notes

- The existing `ingress_dns` Terraform module is actually a standalone
  NEG-backed HTTPS load-balancer surface plus optional Cloud DNS resources.
  For the temporary `jakitlabs.com` phase, keep `dns_records = {}` so Terraform
  does not create a fake public Cloud DNS zone for a Route53-owned domain.
- Google’s standalone NEG docs support custom names through
  `cloud.google.com/neg: {"exposed_ports":{"PORT":{"name":"NEG_NAME"}}}`.
  Use stable names so Terraform can reference the zonal NEGs without scraping
  generated names from the live cluster.
- Do not re-enable the base Kubernetes `Ingress` resources for this task. They
  are nginx/localtest surfaces and are not the GCP public edge contract.

## Acceptance Criteria

- [x] The GCP production overlay renders standalone NEG annotations for both
      `platform-api` and `platform-web`.
- [x] The production Terraform example models both temporary NFQ public
      hostnames without claiming GCP Cloud DNS authority over `jakitlabs.com`.
- [x] The production and staging platform roots expose public-edge IP outputs.
- [x] Verification proves the overlay renders and both platform roots validate.
- [x] The production GCP edge is live with healthy `api-backend` and
      `web-backend` services.

## Verification Evidence

- Overlay render:
  - `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
- Focused architecture test:
  - `uv run pytest tests/architecture/test_gcp_production_overlay_internal_api_token.py -q`
- Terraform validate:
  - `/tmp/terraform-1.14.6/terraform -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform validate`
  - `/tmp/terraform-1.14.6/terraform -chdir=infrastructure/terraform/gcp/nfq/environments/staging/platform validate`
- Live Terraform apply:
  - `/tmp/terraform-1.14.6/terraform -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform apply -auto-approve -target=module.ingress_dns -var-file=../production.tfvars.example`
  - `/tmp/terraform-1.14.6/terraform -chdir=infrastructure/terraform/gcp/nfq/environments/production/network apply -auto-approve -var-file=../production.tfvars.example`
- Live GCP checks:
  - `gcloud compute backend-services get-health api-backend --global --project call-platform-production`
  - `gcloud compute backend-services get-health web-backend --global --project call-platform-production`
  - `gcloud compute forwarding-rules describe api-forwarding-rule --global --project call-platform-production`
  - `gcloud compute forwarding-rules describe web-forwarding-rule --global --project call-platform-production`

## Outcomes

- Public forwarding rules:
  - API: `34.54.127.17`
  - web: `34.149.188.63`
- Managed certificates:
  - `api-cert` for `api.nfq.jakitlabs.com`
  - `web-cert` for `nfq.jakitlabs.com`
- Certificate status remains `PROVISIONING` until Route53 points the temporary
  public hostnames at the load-balancer IPs.

## References

- Milestone: [M38.1-nfq-public-edge-and-auth-readiness.md](../../milestones/M38.1-nfq-public-edge-and-auth-readiness.md)
- Progress: [PROGRESS.md](PROGRESS.md)
