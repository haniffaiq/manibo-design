# M38: NFQ GCP Bootstrap — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Create the NFQ GCP milestone/task pack and promote the GCP root contract docs | Done | 2026-04-13 |
| T02 | Port reusable GCP Terraform modules from Saturn into `infrastructure/terraform/gcp/nfq/modules` | Done | 2026-04-13 |
| T03 | Implement `project_bootstrap` and `network` roots for staging and production | Done | 2026-04-13 |
| T04 | Implement `platform` roots with Terraform-owned CI OIDC, GKE, Cloud SQL, DNS, and observability | Done | 2026-04-13 |
| T05 | Implement `workloads_bootstrap` roots and NFQ environment tfvars examples | Done | 2026-04-13 |
| T06 | Neutralize superseded wrapper files, update GCP Terraform READMEs, and verify all roots | Done | 2026-04-13 |
| T07 | Implement an NFQ-scoped GCP Artifact Registry image publish workflow | Parked | 2026-04-13 |
| T08 | Create the GCP production runtime overlay surface under `infrastructure/kubernetes/overlays/gcp/production` | Done | 2026-04-13 |
| T09 | Add internal-first operator scripts for Cloud SQL bootstrap, image pinning, and GKE runtime deploy | Done | 2026-04-13 |
| T10 | Verify the GCP runtime overlay renders cleanly and document the live blockers for first boot | Done | 2026-04-13 |
| T11 | Split GCP observability into internal-safe and public-edge surfaces with managed Prometheus | Done | 2026-04-13 |

## Notes

- M38 was activated by explicit human approval on 2026-04-13 after the design
  note in `wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md`.
- Scope is repo-owned Terraform only. Live GCP project creation or apply proof
  still depends on real NFQ project identifiers and operator access.
- Cross-platform CI auth is allowed. The contract here is only that NFQ's GCP
  CI auth path itself is Terraform-owned and not duplicated inside NFQ.
- The user explicitly extended M38 on 2026-04-13 to cover the next adjacent
  delivery step after Artifact Registry, but source-repo NFQ publishing is now
  parked until the exported NFQ repo exists because build-time artifact
  exclusion must be physical, not just runtime-gated.
- NFQ image publish must stay completely namespaced because NFQ source
  distribution strips internal CI and infrastructure surfaces:
  - separate workflow
  - separate GitHub environment / variable names
  - no coupling to the live GHCR/Hetzner release-pin path
- Region policy is now explicit:
  - core infra: `europe-central2`
  - Gemini on Vertex AI: `europe-central2`
  - Chirp 3 STT/TTS: `eu`
  - OpenAI API: Europe project plus `eu.api.openai.com`
- `production.tfvars.example` now carries the real production project identity:
  `project_id = "call-platform-production"` and
  `project_number = "8230818469"`.
- `staging.tfvars.example` keeps a placeholder project number until the real
  staging project is provisioned.
- Static verification completed with an isolated Terraform `1.14.8` binary
  because the host workstation only had Terraform `1.7.5`.
- Verification evidence:
  - `terraform fmt -recursive infrastructure/terraform/gcp`
  - `init -backend=false` and `validate` succeeded for all 8 env roots
  - `project_bootstrap` dry plans succeeded for both staging and production
    example tfvars
- Live bootstrap evidence:
  - production `project_bootstrap` apply succeeded against
    `call-platform-production` and enabled the baseline APIs
  - Terraform created `tf-state-8230818469-production` in `US` because the
    copied `project_bootstrap` module originally hardcoded `us` / `US`
  - a manual replacement bucket,
    `tf-state-8230818469-production-europe-central2`, was created as a
    regional bucket in `EUROPE-CENTRAL2` with versioning, uniform bucket-level
    access, and public access prevention enabled
  - the branch now switches bootstrap state resources and Artifact Registry to
    `europe-central2`
  - production `network` apply succeeded against the Europe regional state
    backend and created:
    - VPC `call-platform-production-vpc`
    - application and proxy subnets in `europe-central2`
    - router/NAT
    - Private Service Access / service networking
  - production `platform` live rollout created:
    - GitHub Workload Identity Federation pool/provider plus CI service account
    - workload Google service accounts for `api`, `agent`, and `temporal`
    - Artifact Registry repository in `europe-central2`
    - Secret Manager secret containers
    - Cloud SQL Postgres instance `call-platform-production-postgres`
      in `europe-central2`
    - private GKE cluster `call-platform-production-ec2` with managed node
      pools `general-spot-e2-standard-4` and
      `system-ondemand-e2-standard-4`
    - the three `roles/iam.workloadIdentityUser` bindings needed for the
      in-cluster workloads
  - live verification after apply showed:
    - GKE node pools are `RUNNING`
    - Cloud SQL is `RUNNABLE`
    - the control plane endpoint is private-only (`172.16.1.2`) with external
      traffic disabled on the DNS endpoint
- T11 observability split:
  - replaced the mixed Terraform module
    `infrastructure/terraform/gcp/nfq/modules/observability` with:
    - `infrastructure/terraform/gcp/nfq/modules/observability_internal_safe`
    - `infrastructure/terraform/gcp/nfq/modules/observability_public_edge`
  - wired the `platform` roots to keep public-edge checks disabled until real
    DNS / ingress inputs exist, and gated `ingress_dns` behind
    `public_edge_enabled` so normal `platform` applies no longer depend on
    `-target`
  - enabled GKE managed Prometheus in
    `infrastructure/terraform/gcp/nfq/modules/gke_cluster`
  - added GCP `PodMonitoring` resources in
    `infrastructure/kubernetes/overlays/gcp/production/observability` for:
    - `platform-temporal-worker`
  - internal-safe alert coverage now includes:
    - unhealthy nodes
    - container restart spikes
    - Cloud SQL down / CPU / memory / disk
    - Temporal queue depth
    - voice packet loss / jitter / reconnect spikes
  - internal-safe dashboard coverage now includes:
    - node health
    - container restarts
    - Cloud SQL CPU / disk
    - Temporal queue depth
    - concurrent calls
    - voice packet loss p95
  - public-edge remains a separate apply surface for:
    - public uptime checks
    - HTTPS LB 5xx alerting
    - public edge dashboard
  - known follow-on gaps kept explicit:
    - `agent-worker` still has no metrics endpoint or `PodMonitoring`
    - API scrape auth and API-derived alerting now live in the follow-up
      observability PR so this milestone stays infra/k8s-only
    - carrier/provider degradation alerting is deferred with that API scrape
      path because the current GCP overlay only scrapes `platform-temporal-worker`
    - LLM / STT / TTS provider failure paging still needs explicit runtime
      counters suitable for alert thresholds
  - T11 verification evidence:
    - `terraform fmt -recursive infrastructure/terraform/gcp`
    - `terraform validate` succeeded for:
      - `infrastructure/terraform/gcp/nfq/environments/staging/platform`
      - `infrastructure/terraform/gcp/nfq/environments/production/platform`
    - `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
      rendered successfully (`459` lines) with the Temporal worker
      `PodMonitoring` resource
    - `tools/scripts/infra/k8s-runtime-secrets.sh render-all --overlay gcp/production --namespace platform`
      rendered successfully for the internal runtime secret set without a
      dedicated API metrics bearer-token Secret
- Remaining live blockers:
  - `workloads_bootstrap` was applied successfully from an in-VPC admin VM
  - live fixes during that apply:
    - the admin VM boot disk had to be resized from `10G` to `30G`
    - the CI/bootstrap service account needed `roles/container.admin`; the
      original `roles/container.developer` grant was not enough for KEDA's
      cluster-scoped RBAC and webhook objects
  - `ingress_dns` and the public-edge observability slice are still blocked on
    real NFQ DNS names, NEG names, and alert-routing contacts
  - internal-safe observability is implemented and validate/render verified,
    but it was not applied from this workstation because the repo still only
    contains example tfvars and the committed alert-recipient value is still
    the placeholder `platform.alerts@example.com`
  - recordings storage does not yet have a GCS provider implementation
- T07 image-publish follow-on:
  - `.github/workflows/publish-nfq-gcp-images.yml` remains explicitly
    NFQ-scoped and bound to the GitHub Environment `nfq-gcp-production`
  - in `jakit-labs/manibo` it now fails closed and emits a summary explaining
    that publish must happen from the exported NFQ repo, where excluded
    solutions are physically absent
  - it still preserves the namespaced WIF / service-account contract for the
    eventual exported-repo publish lane
- M38 was explicitly extended again on 2026-04-13 after human approval of
  `wiki/queries/2026-04-13-design-nfq-gke-runtime-overlay.md`:
  - T08-T10 cover the first internal-first GKE runtime slice needed to boot
    the application against the live NFQ GCP baseline
  - this follow-on does not include public DNS / ingress completion yet; it is
    specifically the private-cluster runtime path
- T08 landed the new overlay under
  `infrastructure/kubernetes/overlays/gcp/production`:
  - internal-first runtime slice, later extended by M13 voice cutover
  - no `Ingress` resources
  - no MinIO
  - no GHCR pull-secret dependency
  - no in-cluster Postgres host assumptions
  - Terraform-owned KSAs wired onto `platform-api`, `temporal-worker`, and
    `agent-worker`
  - `agent-worker` is deployed for the production voice runtime; LiveKit Cloud
    mode uses scoped LiveKit URLs/secrets, while self-hosted LiveKit remains the
    explicit Hetzner/LiveKit runtime path
- T09 landed the first operator scripts under
  `infrastructure/scripts/gcp/production`:
  - `bootstrap-gcp-production-cloudsql.sh`
  - `update-gcp-production-release-images.sh`
  - `deploy-gcp-production-runtime.sh`
- T10 verification evidence:
  - `bash -n infrastructure/scripts/gcp/production/bootstrap-gcp-production-cloudsql.sh`
  - `bash -n infrastructure/scripts/gcp/production/update-gcp-production-release-images.sh`
  - `bash -n infrastructure/scripts/gcp/production/deploy-gcp-production-runtime.sh`
  - `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
    rendered successfully (`459` lines)
  - with a temporary local
    `infrastructure/kubernetes/overlays/gcp/production/secrets.env`,
    `tools/scripts/infra/k8s-runtime-secrets.sh render-all --overlay gcp/production`
    rendered successfully (`125` lines)
  - the derived Secret set now includes:
    - `platform-postgres-app`
    - `platform-postgres-superuser`
    - `temporal-postgres-app`
    - `temporal-postgres-superuser`
    - `platform-web-runtime-secrets`
    - `platform-api-runtime-secrets`
    - `platform-temporal-worker-runtime-secrets`
    - `agent-worker-runtime-secrets`
    - `livekit-server-keys`
  - `validate` / `apply` on `gcp/production` now require a real OIDC provider
    so the first operator login path cannot ship empty
- Live internal boot evidence:
  - published immutable GAR refs for the runtime overlay, including the live
    `platform-api` digest
  - bootstrapped Cloud SQL databases / roles from the in-VPC admin VM
  - applied the GCP production overlay from the admin VM until these pods were
    healthy in namespace `platform`:
    - `platform-api`
    - `platform-web`
    - `platform-temporal-worker`
    - Temporal Helm workloads
  - `agent-worker` was originally deferred in the app-only slice; M13 now
    removes that deferral so production voice calls can run on the same overlay
  - internal smoke proof from the admin VM:
    - `curl http://127.0.0.1:18080/health` via `kubectl port-forward` returned
      `{"status":"ok",...}`
    - `curl -I http://127.0.0.1:13000/` via `kubectl port-forward` returned
      `307` redirecting to `/login`
- Live defects fixed during first boot:
  - Temporal Cloud SQL wiring needed chart-native TLS settings instead of
    duplicate `sslmode` connect attributes
  - the API init container needed `ssl=require` on the asyncpg Alembic URL,
    not `sslmode=require`
  - Grove Alembic needed a bootstrap `app.tenant_id` session value so
    fail-closed RLS migrations do not crash on first boot
  - the API bootstrap grants had to be reduced to the privileges Cloud SQL's
    `postgres` role can actually grant; blanket ownership / ALL TABLES grants
    were invalid against the live object ownership split
- The runtime database contract is now explicit in the committed tfvars
  examples: `platform`, `grove`, `temporal`, and `temporal_visibility`.
- Known rough edge kept intentionally from the Saturn baseline:
  - one env tfvars file feeds all four roots, so root-local `terraform plan`
    emits undeclared-variable warnings for values owned by the other roots
- Remaining first-boot blockers are now explicit:
  - the internal boot slice is complete; the next blockers are public-facing
    inputs and hardening:
    - finish DNS / ingress / observability once the NFQ domain and alert
      inputs exist
    - replace the manually maintained admin-VM runtime path with the final NFQ
      CI/CD execution surface once the exported NFQ repo exists
    - defer GCS-backed recordings and final LiveKit values until after the
      internal boot slice proves out
