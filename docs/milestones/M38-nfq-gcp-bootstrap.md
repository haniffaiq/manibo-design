# M38: NFQ GCP Bootstrap

Status: in progress
Created: 2026-04-13
Owner: Jakit
Branch: feat/nfq-gcp-bootstrap
Stream: infra
Depends on: M26.3
Reference: wiki/queries/2026-04-13-design-nfq-gcp-bootstrap.md

## Goal

Replace the placeholder NFQ GCP wrapper surface under
`infrastructure/terraform/gcp/**` with a real provider-local Terraform stack
for `staging` and `production`, adapted from the Saturn baseline but aligned to
Manibo's repo contract. Then carry the baseline through the next adjacent
delivery slice needed to prove NFQ can actually boot on GKE:
- project bootstrap, networking, IAM/workload identity, GKE, Artifact Registry,
  Secret Manager, Cloud SQL, Cloud DNS, observability, and workload bootstrap
  surfaces
- an export-scoped NFQ GCP image-publish CI contract using Terraform-owned
  NFQ CI OIDC without allowing unsafe source-monorepo publishes
- an internal-first GKE runtime overlay and operator scripts that can deploy
  the app stack against the live Cloud SQL + GKE baseline before public DNS is
  ready

## Design Decisions

1. Keep the durable repo contract under `infrastructure/terraform/gcp/**`; do
   not create a second standalone Terraform tree.
2. Use Saturn's four-root split inside each environment:
   `project_bootstrap`, `network`, `platform`, `workloads_bootstrap`.
3. Use Cloud SQL for GCP database provisioning. Do not model in-cluster
   Postgres as the NFQ GCP baseline.
4. GCP owns the authoritative NFQ public DNS zones and records.
5. "EMI's" means IAM / identities, including Workload Identity and GitHub OIDC
   federation.
6. NFQ CI auth is Terraform-owned. Manibo may keep its own separate CI auth
   path because it is a distinct platform surface.
7. Placeholder wrapper files may be neutralized or documented as superseded,
   but no destructive cleanup is hidden inside this milestone without explicit
   approval.
8. Region policy for NFQ production is:
   - core infra: `europe-central2`
   - Gemini on Vertex AI: `europe-central2`
   - Chirp 3 STT/TTS: `eu`
   - OpenAI API: Europe project plus `eu.api.openai.com`
9. NFQ publish automation must be completely namespaced because NFQ is a
   distributed platform surface:
   - separate workflow name
   - separate GitHub environment / variables
   - no reuse of the live Manibo/Hetzner GHCR release lane
   - no dependence on internal-only release-pin automation

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Create the NFQ GCP milestone/task pack and promote the GCP root contract docs | done | none |
| T02 | Port reusable GCP Terraform modules from Saturn into `infrastructure/terraform/gcp/nfq/modules` | done | T01 |
| T03 | Implement `project_bootstrap` and `network` roots for staging and production | done | T02 |
| T04 | Implement `platform` roots with Terraform-owned CI OIDC, GKE, Cloud SQL, DNS, and observability | done | T03 |
| T05 | Implement `workloads_bootstrap` roots and NFQ environment tfvars examples | done | T04 |
| T06 | Neutralize superseded wrapper files, update GCP Terraform READMEs, and verify all roots | done | T05 |
| T07 | Implement an NFQ-scoped GCP Artifact Registry image publish workflow | parked | T04, T06 |
| T08 | Create the GCP production runtime overlay surface under `infrastructure/kubernetes/overlays/gcp/production` | done | T05, T07 |
| T09 | Add internal-first operator scripts for Cloud SQL bootstrap, image pinning, and GKE runtime deploy | done | T08 |
| T10 | Verify the GCP runtime overlay renders cleanly and document the live blockers for first boot | done | T08, T09 |
| T11 | Split GCP observability into internal-safe and public-edge surfaces with managed Prometheus | done | T04, T10 |

## Acceptance Criteria

- [x] `infrastructure/terraform/gcp/nfq/modules/**` contains the reusable NFQ GCP
      module set needed for project bootstrap, networking, IAM, Artifact
      Registry, secrets, GKE, Cloud SQL, ingress DNS, observability, and
      workload bootstrap.
- [x] `infrastructure/terraform/gcp/nfq/environments/{staging,production}/` each
      contain the four real Terraform roots: `project_bootstrap`, `network`,
      `platform`, and `workloads_bootstrap`.
- [x] The `platform` roots own NFQ GitHub OIDC / Workload Identity
      provisioning in Terraform instead of relying on an NFQ shell bootstrap.
- [x] The environment contracts model Cloud SQL and GCP-owned authoritative DNS
      as first-class Terraform surfaces.
- [x] The old thin NFQ wrapper files are clearly superseded and no longer
      masquerade as the live root contract.
- [x] Terraform `1.13.0` `fmt`, `init -backend=false`, and `validate` succeed
      for all eight new GCP roots, and `project_bootstrap` dry plans succeed
      for both committed environment example files.
- [x] The NFQ image-publish surface is namespaced and fails closed in the
      source monorepo until an exported NFQ repo exists, so generic monorepo
      Dockerfiles cannot publish contract-violating artifacts.
- [x] `infrastructure/kubernetes/overlays/gcp/production/**` exists and
      captures the minimal internal-first NFQ runtime surface for GKE:
      app workloads, Cloud SQL-backed runtime config, no GHCR pull secret,
      no in-cluster Postgres, no public ingress dependency.
- [x] Operator scripts exist for the first boot path:
      Cloud SQL role/database bootstrap, GAR image pin updates, runtime secret
      apply, Temporal Helm install, and overlay apply from the in-VPC admin
      surface.
- [x] The overlay and deploy scripts are verified with render / dry-run proof,
      and the remaining live blockers are explicit rather than hidden inside
      the manifests.
- [x] The GCP observability surface is split into:
      - an internal-safe slice that can monitor infra, workloads, and service
        degradations before public DNS exists
      - a public-edge slice that stays disabled until real public hostnames and
        ingress values exist
- [x] GKE managed Prometheus is enabled and the GCP production overlay ships
      scrape resources for the Temporal worker, while API scrape auth remains
      a separate follow-up so workload degradation alerts can come online
      without widening the internal-route token contract inside this milestone.

## Verification

System Terraform on the workstation was `1.7.5`, which is below the copied
module constraint (`>= 1.13.0`). Verification therefore used an isolated
Terraform `1.14.8` binary downloaded to a temp directory:

```bash
TFBIN=/var/folders/.../terraform

$TFBIN fmt -recursive infrastructure/terraform/gcp
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/project_bootstrap init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/project_bootstrap validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/network init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/network validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/platform init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/platform validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/workloads_bootstrap init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/workloads_bootstrap validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/project_bootstrap init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/project_bootstrap validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/network init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/network validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/platform validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/workloads_bootstrap init -backend=false -input=false
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/workloads_bootstrap validate
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/staging/project_bootstrap plan -refresh=false -lock=false -input=false -var-file=../staging.tfvars.example
$TFBIN -chdir=infrastructure/terraform/gcp/nfq/environments/production/project_bootstrap plan -refresh=false -lock=false -input=false -compact-warnings -var-file=../production.tfvars.example
uv run python - <<'PY'
from pathlib import Path
import yaml

path = Path(".github/workflows/publish-nfq-gcp-images.yml")
with path.open("r", encoding="utf-8") as fh:
    yaml.safe_load(fh)
print(path)
PY
bash -n tools/scripts/artifact/build-platform-images.sh
bash -n infrastructure/scripts/gcp/production/bootstrap-gcp-production-cloudsql.sh
bash -n infrastructure/scripts/gcp/production/update-gcp-production-release-images.sh
bash -n infrastructure/scripts/gcp/production/deploy-gcp-production-runtime.sh
kubectl kustomize infrastructure/kubernetes/overlays/gcp/production >/tmp/gcp-overlay-render.yaml
tmp_env='infrastructure/kubernetes/overlays/gcp/production/secrets.env'
trap 'rm -f "$tmp_env"' EXIT
cp infrastructure/kubernetes/overlays/gcp/production/secrets.env.example "$tmp_env"
tools/scripts/infra/k8s-runtime-secrets.sh render-all --overlay gcp/production >/tmp/gcp-runtime-secrets-render.yaml
rm -f "$tmp_env"
trap - EXIT
```

The shared env-tfvars pattern still emits undeclared-variable warnings on
root-local plan commands because one env file feeds all four roots. That is a
copied Saturn behavior, not a hidden regression in this port.

Production bootstrap was also applied manually against
`call-platform-production`, which created the baseline APIs and the original
state bucket `tf-state-8230818469-production`. That apply exposed a real
follow-up issue in the copied baseline: the `project_bootstrap` module
originally hardcoded `us` / `US` for KMS and GCS, so the original state bucket
landed in `US`. A replacement regional bucket,
`tf-state-8230818469-production-europe-central2`, was then created manually in
`EUROPE-CENTRAL2` with versioning and uniform bucket-level access enabled.
The branch now removes those hardcoded `us` values and switches Artifact
Registry to `europe-central2`.

Production live applies then advanced further than the original milestone
expected:

- `network` was applied successfully against the Europe regional backend and
  created the VPC, regional subnets, Cloud Router/NAT, and Private Service
  Access wiring.
- `platform` was applied in targeted recovery steps and successfully created:
  - GitHub WIF pool/provider and CI service account
  - workload Google service accounts for `api`, `agent`, and `temporal`
  - Artifact Registry in `europe-central2`
  - Secret Manager secret containers
  - Cloud SQL Postgres in `europe-central2`
  - private GKE cluster `call-platform-production-ec2`
  - both managed node pools
  - the workload-identity IAM bindings that depend on the cluster workload pool

The internal-first runtime slice is now present and render-verified:

- `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
  rendered successfully (`459` lines).
- The rendered overlay contains no `Ingress` resources, no `SKIP_AUTH`, no
  `platform-postgres-rw` references, and no GHCR pull-secret dependency.
- The rendered workloads bind to the Terraform-created KSAs that remain in the
  internal-first overlay:
  - `platform-api`
  - `temporal-worker`
  - `agent-worker`
- M13 removed the earlier voice-runtime deferral: the GCP production overlay now
  renders `agent-worker`, uses scoped `agent-worker-runtime-secrets`, and keeps
  LiveKit Cloud URLs in secrets instead of rendering the local LiveKit ingress.
- The new operator scripts all pass `bash -n` syntax proof:
  - `infrastructure/scripts/gcp/production/bootstrap-gcp-production-cloudsql.sh`
  - `infrastructure/scripts/gcp/production/update-gcp-production-release-images.sh`
  - `infrastructure/scripts/gcp/production/deploy-gcp-production-runtime.sh`
- With a temporary local copy of
  `infrastructure/kubernetes/overlays/gcp/production/secrets.env`, runtime
  secret rendering succeeds (`125` lines) and produces the expected Secret
  bundle:
  - `platform-postgres-app`
  - `platform-postgres-superuser`
  - `temporal-postgres-app`
  - `temporal-postgres-superuser`
  - `platform-web-runtime-secrets`
  - `platform-api-runtime-secrets`
  - `platform-temporal-worker-runtime-secrets`
  - `agent-worker-runtime-secrets`
  - `livekit-server-keys`
- The production runtime secret contract now requires a real OIDC provider for
  operator sign-in before `validate` / `apply` will proceed.

The first internal boot path is now proven live:

- an in-VPC admin VM bootstrapped Cloud SQL roles / databases and applied the
  runtime overlay successfully
- immutable GAR image refs were published and written into the GCP production
  overlay pins
- these workloads are now running in namespace `platform`:
  - `platform-api`
  - `platform-web`
  - `platform-temporal-worker`
  - Temporal Helm workloads
- `agent-worker` was intentionally deferred during the first internal boot, but
  the current production overlay now includes it for voice runtime.
- internal smoke verification from the admin VM succeeded:
  - `curl http://127.0.0.1:18080/health` via
    `kubectl port-forward -n platform svc/platform-api 18080:8000`
    returned `{"status":"ok",...}`
  - `curl -I http://127.0.0.1:13000/` via
    `kubectl port-forward -n platform svc/platform-web 13000:3000`
    returned `307` redirecting to `/login`
- the live first-boot defects that had to be fixed were:
  - Temporal Cloud SQL config needed chart-native TLS instead of duplicated
    `sslmode` connect attributes
  - the API init container needed `ssl=require` for the asyncpg Alembic URL
  - Grove Alembic needed a bootstrap `app.tenant_id` session setting for
    fail-closed RLS bootstrap
  - the API bootstrap grant set had to match Cloud SQL's real table ownership
    split instead of assuming blanket ownership transfer was allowed

The remaining live gap is now public-facing completion and export hardening:

- `workloads_bootstrap` was applied successfully from an in-VPC admin VM after
  two live fixes:
  - the admin VM boot disk had to be resized from `10G` to `30G`
  - the CI/bootstrap service account needed `roles/container.admin` because
    `roles/container.developer` was insufficient for KEDA's cluster-scoped
    RBAC and webhook resources
- `ingress_dns` and `observability` were intentionally left unapplied because
  the committed production env example still carries placeholder NFQ DNS zone,
  hostname, NEG, and alert-recipient values.
- The NFQ image-publish follow-on now remains only as a parked placeholder in
  `.github/workflows/publish-nfq-gcp-images.yml`. Activation is explicitly
  deferred until an exported NFQ repo slug exists, Terraform
  `ci_oidc.github_repositories` is changed from the committed empty default to
  include that slug, and the production `platform` root has been re-applied so
  WIF/IAM trust that repo.
- Public ingress, final NFQ domain cutover, GCS-backed recordings, and real
  LiveKit runtime values are explicitly deferred beyond this first internal
  boot slice.

The observability follow-on is now split the way SRE operations actually need
it:

- the old mixed `modules/observability` surface has been replaced with:
  - `modules/observability_internal_safe`
  - `modules/observability_public_edge`
- GKE now enables managed Prometheus so Terraform can alert on the workload and
  Temporal-worker metrics the platform already emits safely today
- the GCP production overlay now adds `PodMonitoring` resources for:
  - `platform-temporal-worker` `/metrics`
- the internal-safe Terraform slice now owns:
  - notification channels
  - cluster unhealthy-node alerting
  - container restart alerting
  - Cloud SQL down / CPU / memory / disk alerts
  - Temporal queue-depth alerting
  - voice packet-loss / jitter / reconnect alerts
  - an internal SRE overview dashboard
- the public-edge Terraform slice now owns only:
  - public uptime checks
  - HTTPS load balancer 5xx alerting
  - a public-edge dashboard
- the committed env examples deliberately keep
  `public_edge_enabled = false` and `public_observability_enabled = false`
  until real DNS and ingress values exist
- internal-safe observability is code-complete and validate/render verified,
  but I did not apply it from this workstation because the repo still has only
  example tfvars and the committed alert-recipient input is still a placeholder
  email address
- API-derived carrier/provider degradation alerting is intentionally deferred
  to the follow-on observability PR because the infra-only GCP overlay in this
  milestone does not add an authenticated `platform-api` scrape path

## Non-Goals

- No blind full-stack `terraform apply` against placeholder DNS /
  observability values.
- No public ingress or DNS cutover for the GCP runtime slice yet.
- No removal of the Manibo-specific shell OIDC bootstrap path.
- No voice-stack cutover or GCS signed recording provider work hidden inside
  this milestone.
