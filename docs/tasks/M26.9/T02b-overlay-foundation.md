# T02b: Staging overlay foundation and hostNetwork ingress

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T02a (Flux root exists and points at
> `overlays/hetzner/staging/`)

---

## Description

Create the staging kustomize overlay at
`infrastructure/kubernetes/overlays/hetzner/staging/`. This PR lands
the overlay scaffolding and the two patches that turn the staging
cluster into a real HTTP ingress target: every Deployment/StatefulSet
drops to 1 replica, and ingress-nginx switches to `hostNetwork` so the
single node's public IPv4 serves :80/:443 directly.

**No CNPG cluster, no Temporal rewire, no Prometheus tuning** — those
land in T02c and T02d.

## Subtasks

- [ ] **Overlay kustomization.yaml** that inherits the prod base and
  applies the two patches below.
- [ ] **patch-replicas-to-one.yaml** — strategic merge patch forcing
  every Deployment and StatefulSet in the base to `replicas: 1`.
  Explicitly names the workloads touched; no wildcard patches that
  would drift silently as the base adds new workloads.
- [ ] **patch-ingress-nginx-host-network.yaml** — patches the
  ingress-nginx controller Deployment (owned by Helm; Flux patches it
  via a postRender) to set `hostNetwork: true`, `dnsPolicy:
  ClusterFirstWithHostNet`, and hostPorts 80/443. Matches what T01's
  voice firewall already permits.
- [ ] **ingress-nginx HelmRelease** in the staging operators layer if
  prod's base does not install ingress-nginx at all. (Prod uses the
  kube-hetzner-managed nginx; staging's T01 set
  `ingress_controller = "none"` so we install via Flux here.) If it
  installs via HelmRelease, add it to T02a's operator list or here —
  whichever keeps this PR under the budget.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/hetzner/staging/kustomization.yaml` | Create | Points at prod base + patches listed here. |
| `infrastructure/kubernetes/overlays/hetzner/staging/patch-replicas-to-one.yaml` | Create | Explicit per-workload `replicas: 1` patches. |
| `infrastructure/kubernetes/overlays/hetzner/staging/patch-ingress-nginx-host-network.yaml` | Create | `hostNetwork: true` + hostPorts patch for the ingress-nginx controller. |
| `infrastructure/kubernetes/overlays/hetzner/staging/helm-values/ingress-nginx.values.yaml` | Create | Helm values for the staging ingress-nginx HelmRelease (hostPort on). |
| `infrastructure/kubernetes/overlays/hetzner/staging/ingress-nginx-helmrelease.yaml` | Create | HelmRelease for ingress-nginx installed in staging (prod uses the kube-hetzner-managed controller; staging uses Flux). |

## Implementation Notes

1. **Explicit per-workload replica patches**, not a wildcard. Wildcard
   patches break silently when a new workload is added to the base;
   explicit lists force the author to think about whether the new
   workload belongs on a single-node staging cluster.
2. **hostNetwork pod scheduling** requires `dnsPolicy:
   ClusterFirstWithHostNet` or internal DNS resolution breaks.
3. **ingress-nginx installation path** is the one place where staging
   diverges structurally from prod. Prod gets its nginx from the
   kube-hetzner terraform module; staging gets it from Flux because
   T01 set `ingress_controller = "none"` to skip the kube-hetzner LB
   that we do not want. Document this divergence in the overlay
   kustomization.yaml's comment header.
4. **No cert-manager ClusterIssuer** for staging yet — that lands
   alongside the first public HTTP endpoint work, which is T02c or
   later. For T02b, a self-signed default is acceptable.
5. **No CNPG cluster, no Temporal patch, no Prometheus** in this PR.
   They are T02c and T02d.

## Acceptance Criteria

- [ ] `kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/`
  renders a YAML document where every `Deployment` and `StatefulSet`
  has `spec.replicas: 1`.
- [ ] The ingress-nginx controller in the rendered output has
  `hostNetwork: true`, `dnsPolicy: ClusterFirstWithHostNet`, and
  hostPorts 80/443.
- [ ] `kubectl apply --dry-run=client -f <(kubectl kustomize ...)`
  validates every resource.
- [ ] Prod overlay (`overlays/hetzner/production/`) is unchanged.
- [ ] PR diff stays inside the small-PR budget.

## Verification

```bash
# Render and verify replica counts
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "Deployment" or .kind == "StatefulSet") | .metadata.name + " replicas=" + (.spec.replicas | tostring)'
# Every line should end with 'replicas=1'.

# Verify hostNetwork on ingress-nginx
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.metadata.name == "ingress-nginx-controller") | .spec.template.spec.hostNetwork'
# -> true

# Client-side validate all resources
kubectl apply --dry-run=client -f <(kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/)
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md)
- Depends on: T02a (Flux root) + T01 (firewall permits hostNetwork ports)
- Follow-ups: T02c, T02d
