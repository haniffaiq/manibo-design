# T01: Terraform the 1-node Hetzner staging cluster

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: M (4-6h)
> **Depends on**: None

---

## Description

Create a new terraform root at
`infrastructure/terraform/hetzner/environments/staging/` that
provisions a minimal single-node k3s cluster on Hetzner. No LB, no
external ops hosts, Prometheus inside the cluster. Shared Object
Storage project with prod, different key prefix. Voice firewall open
for real PSTN call testing.

No `terraform apply` from this PR. Code lands first; a human applies
later with the staging HCLOUD token and Object Storage access keys.

## Subtasks

- [ ] **New terraform root** under
  `infrastructure/terraform/hetzner/environments/staging/` with:
  - `versions.tf` — provider versions pinned to prod's
  - `providers.tf` — hcloud + aws (S3-compat for state) — same three
    aliases as prod (tfstate/app/backup), same endpoint
  - `variables.tf` — all defaults tuned for staging scale
  - `main.tf` — kube-hetzner module call with a single
    control-plane nodepool (count=1,
    `allow_scheduling_on_control_plane = true`), no agent pools, no
    autoscaler, voice-edge firewall rules attached via label
  - `outputs.tf` — kubeconfig, node public IP, floating IP
  - `object_storage.tf` — NO new buckets (reuse prod project). This
    file either stays absent or contains data-only references.
  - `terraform.tfvars.example` with documented minimal values.
- [ ] **Cloud-init** for the single node reuses the kube-hetzner
  module defaults. No custom cloud-init needed for this task.
- [ ] **Backend config template** at `backend.hcl.example` that
  points at `tf-state-manibo-production-nbg1` with key
  `staging/terraform.tfstate`. Actual `backend.hcl` stays
  gitignored and created by the operator with read/write access
  keys scoped to the staging prefix.
- [ ] **Floating IP** provisioned and attached to the control-plane
  node so DNS (`api.staging.manibo.ai`,
  `sip.staging.manibo.ai`) can point at a stable target even if
  the VM is rebuilt.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/terraform/hetzner/environments/staging/versions.tf` | Create | Pin hcloud and aws provider versions to match prod. |
| `infrastructure/terraform/hetzner/environments/staging/providers.tf` | Create | hcloud + three aws aliases (tfstate, app, backup), Hetzner OS endpoint. |
| `infrastructure/terraform/hetzner/environments/staging/variables.tf` | Create | All vars tuned for staging: `cluster_name = manibo-staging`, `node_server_type = cx33`, `location = nbg1`, `network_ipv4_cidr = 172.20.0.0/16`, `admin_cidrs`, `floating_ip_name = manibo-staging-ingress`, `ghcr_registry_*`. |
| `infrastructure/terraform/hetzner/environments/staging/main.tf` | Create | `kube_hetzner` module with single control-plane nodepool, `use_control_plane_lb = false`, `allow_scheduling_on_control_plane = true`, voice-edge firewall rules, floating IP attached. |
| `infrastructure/terraform/hetzner/environments/staging/outputs.tf` | Create | `kubeconfig`, `node_ipv4`, `node_ipv6`, `floating_ipv4`, `control_plane_name`. |
| `infrastructure/terraform/hetzner/environments/staging/terraform.tfvars.example` | Create | Example values with inline comments explaining the shared-bucket / staging-prefix state backend pattern. |
| `infrastructure/terraform/hetzner/environments/staging/backend.hcl.example` | Create | Template pointing at `tf-state-manibo-production-nbg1`, key `staging/terraform.tfstate`. |
| `wiki/ops/hetzner-staging-cluster.md` | Create | Operator runbook: terraform init + plan + apply, DNS A-record to floating IP, kubeconfig retrieval, node rebuild playbook. |

## Implementation Notes

1. The staging `network_ipv4_cidr` MUST NOT overlap with prod's
   `10.0.0.0/8` or any peered network. Use `172.20.0.0/16` (RFC 1918,
   outside the entire `10.0.0.0/8` block). The earlier candidate
   `10.1.0.0/16` was rejected during review because it sits inside
   prod's `/8` and would create ambiguous routing on any future VPN
   peering.
2. Shared Object Storage state backend: same endpoint, same bucket,
   key prefix `staging/`. Operator creates a staging-scoped access
   key pair (IAM policy path-scoped to `staging/*`) in the Hetzner
   console manually. That key pair lives in the operator's 1Password
   + the GitHub Actions secret set used by staging workflows.
3. `use_control_plane_lb = false` is the key setting that kills the
   Hetzner LB cost. Control-plane API access goes through the node's
   public IPv4 (or the floating IP) directly, firewalled via
   `firewall_kube_api_source = admin_cidrs`.
4. `allow_scheduling_on_control_plane = true` is required because a
   single-node cluster needs the control plane to also run
   workloads.
5. Voice firewall rules use the same `label_selector` pattern as
   prod but target the single node. Since all workloads run on that
   node, the label selector effectively applies to the whole cluster.
6. Ingress-nginx deployment config: `hostNetwork: true`,
   `dnsPolicy: ClusterFirstWithHostNet`, no LB backend. The
   kube-hetzner module supports `ingress_controller = "nginx"`; we
   apply patches via Flux in T02 to switch to hostNetwork.
7. No CNPG / Temporal / LiveKit resources provisioned by this task —
   those are Kubernetes manifests owned by T02 (Flux overlay).
8. Do NOT provision a Hetzner Object Storage bucket in this root —
   reuse prod's. Adding a bucket here doubles the Object Storage
   subscription fee.
9. No agent-burst pool, no stateful pool, no voice pool, no external
   ops hosts. Everything on one node. This is the explicit "minimal"
   choice.

## Acceptance Criteria

- [ ] `terraform init -backend-config=backend.hcl` succeeds against
  the shared Object Storage backend using a staging-scoped access
  key.
- [ ] `terraform plan` shows:
  - 1 `hcloud_server` (control-plane node, cx33)
  - 1 `hcloud_network` + 1 `hcloud_network_subnet`
  - 1 `hcloud_floating_ip` with attachment
  - k3s install + kube-hetzner-managed helm releases
  - Voice-edge firewall rules attached
  - **No** `hcloud_load_balancer`
  - **No** `hcloud_server_network` for monitoring/vault/deploy-runner
    (those hosts don't exist on staging)
- [ ] `terraform validate` green.
- [ ] Architecture tests (if any pin infra structure) still green.
- [ ] Cost estimate in the runbook matches the node-plus-floating-IP
  arithmetic on the pricing snapshot shown there (~€10/month as of
  2026-04-16; verify against Hetzner list prices before budgeting).

## Verification

```bash
cd infrastructure/terraform/hetzner/environments/staging

# Backend + provider init (requires backend.hcl created locally by
# operator with staging-scoped Object Storage creds).
terraform init -backend-config=backend.hcl

# Dry-run plan (requires HCLOUD_TOKEN for the staging scope)
terraform plan -out=/tmp/staging-t01.tfplan

# Validate
terraform validate

# No architecture test breakage
uv run python -m pytest tests/architecture/ -q
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Prod terraform root this is modelled on: `infrastructure/terraform/hetzner/environments/production/`
- kube-hetzner module: https://github.com/kube-hetzner/terraform-hcloud-kube-hetzner
