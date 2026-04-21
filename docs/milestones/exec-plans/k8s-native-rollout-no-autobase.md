# Execution Plan: K8s-Native Infrastructure Rollout (No Autobase)

> **Status:** Active (Phase 0-1 implemented)  
> **Created:** 2026-03-02  
> **Owner:** Platform Engineering  
> **Track:** Epic

## 1. Goal and non-negotiables

**Goal:** deliver one Kubernetes-native platform stack (Kustomize + SOPS) that runs in four targets:

1. local (developer)
2. CI (GitHub Actions)
3. Hetzner (`kube-hetzner`)
4. GCP (GKE)
5. Azure (AKS)

**Hard constraints:**

- No Autobase.
- Monorepo package-based setup (single repo workflow).
- Preserve build-time artifact exclusion for licensed/single-tenant profiles.
- Keep Grove/platform layering rules intact.

---

## 2. Docker Compose review (current state)

`docker-compose.yml` is useful for dev/e2e, but treating it as production blueprint would be a bad call.

### What is good

- Service graph covers required local dependencies: `postgres`, `temporal`, `livekit`, `minio`, API, workers, web-adjacent test paths.
- Profiles exist (`platform`, `e2e`, `obs`) and map to real workflows.
- Health checks and deterministic Temporal codec env vars are already wired.

### What blocks production parity

- `temporalio/auto-setup:latest` and `livekit --dev` are dev-only defaults.
- Secrets are plain env vars; not acceptable for multi-cloud production.
- No ingress model, network policy, pod security, or workload resource guarantees.
- Local named volumes hide storage-class and backup realities.
- Compose dependency ordering (`depends_on`) does not map to Kubernetes reconciliation behavior.

### Compose-to-K8s mapping baseline

| Compose service | K8s target |
|---|---|
| `platform-api` | `Deployment` + `Service` + `HPA` |
| `temporal-worker`, `agent-worker` | `Deployment` + `ServiceMonitor` |
| `web` (future explicit service) | `Deployment` + `Service` + ingress route |
| `postgres` | `CloudNativePG Cluster` |
| `temporal`, `temporal-ui` | Temporal Helm release |
| `livekit` | LiveKit Helm/manifests |
| `minio` | MinIO Helm/manifests (non-prod) or cloud object storage (prod) |
| `loki/prometheus/tempo/grafana` | kube-prometheus-stack + Loki + Tempo |

---

## 3. Monorepo package layout (target)

Create infrastructure as internal packages, not separate repos:

```text
infra/
  k8s/
    packages/
      base/                         # api/workers/ui shared manifests
      data-cnpg/                    # CloudNativePG clusters + backups
      temporal/                     # Temporal Helm release values + patches
      livekit/                      # LiveKit control plane manifests
      observability/                # metrics/logs/traces stack
      ingress/                      # ingress controller + cert manager + dns hooks
    overlays/
      local-k3s/
      ci-k3s/
      hetzner/
      gcp/
      azure/
      staging/
      prod/
    profiles/
      licensed/
      single-tenant/
  terraform/
    hetzner/                        # kube-hetzner integration wrapper
    gcp/                            # GKE + network + IAM + DNS
    azure/                          # AKS + network + IAM + DNS
```

Secrets:

- SOPS-encrypted manifests in overlays.
- Per-environment age key/KMS separation.

---

## 4. Phase plan

## Phase 0 — Foundation and guardrails

**Objective:** establish repo structure, GitOps contract, and security baseline before cluster rollout.

**Deliverables:**

- `infra/k8s/packages/*` skeleton with `kustomization.yaml` contracts.
- `infra/k8s/overlays/*` skeleton for all target environments.
- SOPS policy (`.sops.yaml`) and secret naming contract.
- CI checks for Kustomize build validation.

**Verification gate:**

```bash
kustomize build infra/k8s/overlays/local-k3s >/dev/null
kustomize build infra/k8s/overlays/ci-k3s >/dev/null
```

---

## Phase 1 — Local + CI k3s stack (mandatory first)

**Objective:** one reproducible k3s path that works both on laptops and GitHub Actions.

**Implementation choice:** use `k3d` (k3s in Docker) for local and CI parity.

**Deliverables:**

- `tools/scripts/k3d-up.sh`, `tools/scripts/k3d-down.sh`.
- GH Actions job for k3d cluster bring-up + deploy from Kustomize overlays.
- Replace compose-based infra smoke with k3s smoke for cluster path validation.
- CNPG single-instance profile for local/CI speed.

**Verification gate:**

```bash
tools/scripts/k3d-up.sh
kubectl get pods -A
kubectl -n platform get deploy
```

---

## Phase 2 — Hetzner production path (`kube-hetzner`)

**Objective:** deploy k8s-native stack on Hetzner with CNPG, without Autobase.

**Deliverables:**

- Terraform wrapper module for `terraform-hcloud-kube-hetzner`.
- Hetzner overlay: ingress/LB, CNPG storage class, backup target, node pools.
- Out-of-cluster monitoring VM for blackbox + alert relay (control-plane survivability).
- Restore drill runbook.

**Verification gate:**

```bash
terraform -chdir=infra/terraform/hetzner plan
kustomize build infra/k8s/overlays/hetzner >/dev/null
```

---

## Phase 3 — GCP path (GKE)

**Objective:** deploy same app/control-plane stack on GKE with provider-specific networking/IAM.

**Deliverables:**

- GKE Terraform module wiring (cluster, node pools, IAM, DNS, LB).
- GCP overlay patches (ingress class, storage class, workload identity).
- CNPG or managed PG decision checkpoint documented (default: managed PG allowed).

**Verification gate:**

```bash
terraform -chdir=infra/terraform/gcp plan
kustomize build infra/k8s/overlays/gcp >/dev/null
```

---

## Phase 4 — Azure path (AKS single-tenant)

**Objective:** dedicated single-tenant AKS deployment with same package graph and strict profile exclusion.

**Deliverables:**

- AKS Terraform module wiring (cluster, node pools, identity, DNS, ingress).
- Azure overlay patches (storage classes, ingress annotations, identity).
- Single-tenant profile deployment pipeline with artifact-exclusion proof gates.

**Verification gate:**

```bash
terraform -chdir=infra/terraform/azure plan
kustomize build infra/k8s/overlays/azure >/dev/null
```

---

## 5. Cross-phase quality gates

- Kustomize build must pass for every overlay.
- SOPS decrypt policy check in CI for secret paths.
- `uv run pyright -p pyrightconfig.ci.json`
- `uv run ruff check . --exclude=.venv`
- `uv run pytest tests/architecture/ -v --tb=short`

---

## 6. Risk register (short, honest)

1. **Risk:** treating docker-compose as deployment source of truth  
   **Mitigation:** enforce k3d+kustomize smoke in CI and make compose strictly dev/e2e.

2. **Risk:** multi-cloud drift across overlays  
   **Mitigation:** keep shared base package immutable; provider overlays patch only deltas.

3. **Risk:** Hetzner storage/performance surprises under CNPG  
   **Mitigation:** failover + restore drills in staging before prod cutover.

4. **Risk:** secret sprawl across environments  
   **Mitigation:** SOPS path policy + least-privilege key ownership per environment.

---

## 7. Definition of done

- Local developers run one command path to stand up k3s and deploy the platform.
- CI runs the same k3s deployment path and validates basic health.
- Hetzner, GCP, and Azure overlays build and deploy from the same monorepo packages.
- No Autobase dependency remains in architecture or operations docs.
- Deployment profile exclusion guarantees still pass for licensed/single-tenant artifacts.

---

## Progress update (2026-03-02)

- ✅ Phase 0 completed: Kustomize package/overlay foundation, `.sops.yaml` policy, and kustomize validation script.
- ✅ Phase 1 completed: local + CI `k3d` bootstrap scripts, local stack runbook, and GitHub Actions `k3d` smoke workflow.
- ⏸️ Phase 2+ deferred to next session (Hetzner, then GCP, then Azure).
