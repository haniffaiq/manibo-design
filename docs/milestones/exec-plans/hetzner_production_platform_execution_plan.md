# Hetzner Production Platform Execution Plan

Date: 2026-03-07
Owner: Codex (implementation worktree)
Status: Active

## Security Hardening Update

Validated on 2026-03-07 19:14 EET.

Completed:

1. `platform-web`, `agent-worker`, and `livekit-livekit-server` can no longer open TCP sessions to `platform-postgres-rw.platform.svc.cluster.local:5432`.
2. `platform-api` can still open TCP sessions to `platform-postgres-rw.platform.svc.cluster.local:5432`, which preserves application function.
3. The `platform` namespace now has default-deny ingress plus explicit allow rules for:
   - `platform-api`
   - `platform-web`
   - Temporal services
   - CNPG clusters
   - LiveKit Redis
4. Host-network voice workloads are explicitly handled with Cilium policy:
   - `ciliumnetworkpolicy/livekit-redis-allow-hostnetwork`
   - `ciliumnetworkpolicy/platform-api-allow-hostnetwork`
5. Runtime secrets are now split by workload:
   - `platform-api-runtime-secrets`
   - `platform-web-runtime-secrets`
   - `platform-temporal-worker-runtime-secrets`
   - `agent-worker-runtime-secrets`
   - `platform-backup-object-storage`
6. `agent-worker` no longer carries database credentials and now only carries:
   - `GROVE_INTERNAL_API_TOKEN`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
7. `livekit-livekit-server` now runs with:
   - `automountServiceAccountToken=false`
   - `terminationGracePeriodSeconds=300`
   - `allowPrivilegeEscalation=false`
   - `capabilities.drop=["ALL"]`
8. The default `platform` service account was verified to have no useful RBAC for:
   - `list pods`
   - `get secrets`
   - `create pods/exec`
9. Future production secret `encrypt`, `render`, and `apply` runs now fail closed if:
   - `BACKUP_OBJECT_STORAGE_ACCESS_KEY` or `BACKUP_OBJECT_STORAGE_SECRET_KEY` is missing
   - backup Object Storage credentials match the effective app Object Storage credential
   - unless `ALLOW_INSECURE_SHARED_OBJECT_STORAGE_CREDENTIALS=1` is set explicitly for emergency bypass
10. Live production now uses distinct application and backup Object Storage credentials with bucket-policy enforcement.
11. Terraform now manages:
   - the immutable backup bucket with Object Lock default retention
   - the legacy backup bucket policy for old restore data
   - the call-transcriptions bucket policy
   - the tfstate bucket policy
12. The `platform-temporal-worker` rollout strategy now uses surge-first singleton semantics so a future rotation can stall safely instead of dropping the only worker.
13. Historical backups from `db-backups-manibo-production-nbg1` were copied into `db-backups-manibo-production-nbg1-immutable`, the copied objects report Object Lock retention, and the legacy bucket is now empty.
14. GitHub environment `hetzner-production` now holds the production Terraform/backend/runtime inputs, and `.github/workflows/hetzner-production-ops.yml` can run Terraform, retirement, and recovery drills without an operator laptop.

Open blocker:

1. Hetzner Object Storage at-rest encryption posture is still weaker than the stated "all backup data encrypted at rest" target.

## Implementation Status Snapshot

As of 2026-03-07 11:51 EET, the Hetzner production and migration state is:

Completed:

1. The live production stack is still running in `hel1` under `manibo-production` with:
   - `3` control-plane nodes
   - `2` platform nodes
   - `3` stateful nodes
   - `1` agent base node
   - `2` voice nodes
   - `1` ops node
   - `1` monitoring VM
   - `1` Vault VM
   - `1` deploy-runner VM
2. Live production workloads in `hel1` are deployed and healthy in-cluster:
   - `platform-api`
   - `platform-web`
   - `platform-temporal-worker`
   - self-hosted Temporal
   - CNPG `platform-postgres`
   - CNPG `temporal-postgres`
   - self-hosted LiveKit
   - self-hosted SIP
3. Voice nodes now advertise their explicit Hetzner public IPv4 instead of failing on STUN autodiscovery.
4. Hetzner firewall rules now allow the required public voice ports:
   - SIP `5060/udp`, `5060-5061/tcp`
   - TURN/TLS `5349/tcp`
   - LiveKit TCP fallback `7881/tcp`
   - SIP RTP `10000-20000/udp`
   - LiveKit RTC `50000-60000/udp`
5. Public DNS is live in Route53 for:
   - `platform.jakitlabs.com`
   - `api.platform.jakitlabs.com`
   - `temporal.platform.jakitlabs.com`
   - `livekit.platform.jakitlabs.com`
   - `turn.platform.jakitlabs.com`
   - `sip-a.platform.jakitlabs.com`
   - `sip-b.platform.jakitlabs.com`
6. Ingress certificates are issued and `READY=True` for:
   - `platform.jakitlabs.com`
   - `api.platform.jakitlabs.com`
   - `temporal.platform.jakitlabs.com`
   - `livekit.platform.jakitlabs.com`
7. SIP and TURN now serve a real Let's Encrypt certificate for `platform.jakitlabs.com` plus `*.platform.jakitlabs.com` instead of the bootstrap self-signed certificates.
8. The separate monitoring VM is running Prometheus, Alertmanager, Grafana, and blackbox-exporter and is scraping cluster metrics successfully over the private network.
9. External blackbox monitoring reports `probe_success=1` for the live `hel1` stack on:
   - `https://platform.jakitlabs.com`
   - `https://api.platform.jakitlabs.com/health`
   - `https://temporal.platform.jakitlabs.com`
   - `https://livekit.platform.jakitlabs.com`
10. Alertmanager on the monitoring VM is wired to Slack and a synthetic alert delivery test succeeded.
11. The live `nbg1` fixed production footprint is currently:
   - `9 x cx23`
   - `6 x cx33`
   - `2 x lb11`
   - `3` Object Storage buckets
12. The Hetzner production IaC has been migrated to `nbg1` defaults, mirrored third-party runtime images into GHCR, enabled Cilium host-namespace Socket LB for host-network voice workloads, and hardened the recovery tooling.
13. The latest disposable `nbg1` recovery drill `manibo-nbg1-drill-20260307190046-1` passed end to end in `13m49s`:
   - `terraform=7m47s`
   - `bootstrap=0m02s`
   - `operators=1m37s`
   - `restore=1m36s`
   - `workloads=2m47s`

Not finished:

1. A direct `terraform plan` against the current production state is still destructive in place. It wants to replace the live `nbg1` servers, load balancers, and ops VMs rather than reconcile them safely.
2. CNPG Barman Object Store backup wiring is deprecated upstream for CNPG `1.29+`. The current stack is operational today and still needs a planned migration to the Barman Cloud Plugin before that upgrade line.
3. The current voice Redis deployment is still a single instance. That is acceptable for minimal launch cost and garbage for stronger HA claims.

## Recovery Validation Snapshot

Validated on 2026-03-07.

Completed and verified:

1. Scheduled CNPG backups exist and complete successfully for both production clusters:
   - `platform-postgres-nightly`
   - `temporal-postgres-nightly`
2. On-demand production backups were created successfully for both live clusters with primary-targeted CNPG backups:
   - `platform-postgres-primary-20260307161524`
   - `temporal-postgres-primary-20260307161524`
3. Hetzner Object Storage contains both base backups and WAL archives for:
   - `s3://db-backups-manibo-production-nbg1-immutable/platform-postgres`
   - `s3://db-backups-manibo-production-nbg1-immutable/temporal-postgres`
4. Historical restore points from the retired mutable bucket were copied into the immutable bucket and keep their original CNPG server names:
   - `platform-postgres`
   - `temporal-postgres`
5. Fresh-cluster restore drills now succeed on disposable `nbg1` clusters for:
   - `platform-postgres`
   - `temporal-postgres`
   - full workload deployment, including Temporal, LiveKit, SIP, `platform-api`, `platform-web`, `platform-temporal-worker`, and `agent-worker`
6. The latest end-to-end disposable drill `manibo-nbg1-drill-20260307190046-1` completed in `13m49s` total with `1m36s` for database restore and `2m47s` for post-restore workload rollout.
7. Fresh-cluster row-count spot checks matched production for both restored databases across repeated runs.
8. The repeatable recovery path now depends on the following hard fixes:
   - GHCR mirroring for kube-hetzner bootstrap images plus runtime images used by Temporal, LiveKit, SIP, and Redis
   - removal of the empty Hetzner LB hostname annotation that blocked ingress service status publication
   - disabled automatic kube-hetzner upgrade plans during bootstrap to avoid single-node drain deadlocks
   - corrected KEDA Prometheus service DNS
   - enabled Cilium `socketLB` for the host namespace so host-network voice pods can reach ClusterIP services like Redis
   - forcing CNPG backups to target the primary instance so the latest base backup and required WAL segments stay recoverable together

Recovery defects found:

1. The first `nbg1` drill failed because the disposable env had `admin_cidrs = []`, so kube-hetzner created a cluster firewall with no inbound SSH for bootstrap. That was operator-config garbage, not a Hetzner mystery.
2. The initial `nbg1` drills hit `registry.k8s.io` and `mirror.gcr.io` `403 Forbidden` responses. That is fixed in the current code by mirroring the required images to GHCR and updating the production image references.
3. kube-hetzner bootstrap originally deadlocked because automatic upgrade plans cordoned the only ops node while ingress still had a disruption budget. That is fixed in the current code by disabling automatic upgrade plans during bootstrap.
4. Host-network LiveKit and SIP pods originally could not reach Redis over the ClusterIP service because Cilium Socket LB for the host namespace was off. That is fixed in the current code and validated by the passing repeated drills.
5. The monitoring VM deploy script originally updated bind-mounted config without forcing container recreation, so Alertmanager stayed on the stale noop config. The script now forces recreation to pick up config-only changes.

## Objective

Stand up a production Hetzner deployment for the full platform using `kube-hetzner`, `CloudNativePG`,
self-hosted `Temporal`, self-hosted `LiveKit`, and self-hosted SIP, with an explicit operational target of
supporting Lithuania-based traffic at `50` steady concurrent calls and `100` validated concurrent calls.

This plan is intentionally production-first. Staging is not skipped; it is cloned after production topology,
networking, storage, release flow, and voice routing are proven.

## Live Inputs Captured

1. Production web root domain is `platform.jakitlabs.com`.
2. Derived production hosts are:
   - `api.platform.jakitlabs.com`
   - `temporal.platform.jakitlabs.com`
   - `livekit.platform.jakitlabs.com`
   - `turn.platform.jakitlabs.com`
   - `sip-a.platform.jakitlabs.com`
   - `sip-b.platform.jakitlabs.com`
3. The visible Hetzner account-wide limits at planning time are:
   - `30` servers
   - `5` load balancers
   - `60` primary IPs
4. The minimal viable production footprint in this plan is:
   - `14` fixed servers
   - up to `3` autoscaled burst nodes
   - `2` load balancers
5. That footprint stays inside the current visible limits, so quota is not the immediate blocker. Missing secrets and
   runtime bootstrap are.

## Critical Review of the Previous Draft

The earlier plan was directionally fine and operationally incomplete. The main gaps were:

1. Storage posture was underspecified.
   - Current repo truth is a single CNPG instance on `local-path` with no production storage decision:
     `infra/k8s/packages/data-cnpg/cluster-platform-postgres.yaml`.
   - Pretending CNPG is "chosen" without a concrete storage class, backup path, restore test, and failure
     policy is garbage.

2. Voice networking was underspecified.
   - Current repo truth exposes SIP + RTP through a generic Kubernetes `LoadBalancer` service:
     `infra/k8s/packages/livekit-sip/service-livekit-sip.yaml`.
   - Hetzner Load Balancers are not the right answer for UDP media. The production design must explicitly
     handle SIP signaling, RTP, TURN, and public node IP advertisement.

3. Production release plumbing was missing.
   - Current repo truth for `infra/environments/shared/manifests/postgres/main.tf`,
     `infra/environments/shared/manifests/temporal/main.tf`, and
     `infra/environments/shared/manifests/livekit/main.tf` is placeholder output wiring, not deployable IaC.
   - Without a registry, image tag policy, secrets bootstrap, and cluster apply sequence, the plan was not
     operational.

4. Capacity isolation for `50-100` concurrent calls was too weak.
   - `apps/agent-worker` is a separate runtime. Treating API, Temporal services, and agent workers as one
     shared "platform pool" is lazy and raises the blast radius during call spikes.

5. The original draft assumed production readiness from local manifests that still contain:
   - `*.localtest.me` ingress hosts
   - `NEXT_PUBLIC_ENABLE_TEST_AUTH=true`
   - `STORAGE_SIGNED_URL_PROVIDER=minio`
   - `adminPassword: admin`
   - single-replica Temporal and LiveKit values

## Operational Target

### Launch and Scale Targets

1. Day-1 production launch target:
   - `50` concurrent calls supported without operator intervention.

2. Pre-scale validation target:
   - `100` concurrent calls proven in load testing before the public capacity claim is raised to `100`.

3. Do not claim `100` concurrent production capacity until:
   - synthetic SIP and RTC load testing passes,
   - agent-worker CPU and memory headroom remain below saturation,
   - RTP packet loss and call setup failures stay inside agreed thresholds.

### Lithuania-Specific Placement

1. Default Hetzner region: `hel1` if the required node classes, load balancers, and quotas are available.
2. Fallback region: `fsn1` if `hel1` cannot satisfy the chosen production footprint.
3. Carrier and speech providers must use EU endpoints and Lithuanian-language compatible routing/models.
4. Do not spread the first production cluster across distant regions. Keep the media path geographically tight.

This region choice is an operational default, not dogma. If provisioning reality contradicts it, record the
decision and the latency tradeoff in the ops runbook.

## Non-Negotiable Decisions

1. Production topology uses one kube-hetzner cluster with dedicated pools:
   - `server`: `3` k3s server/control-plane nodes
   - `stateful`: `3` nodes for CNPG and Redis/Valkey only
   - `platform`: `2` nodes for API, web, and Temporal server components
   - `agent-base`: `1` fixed node for `apps/agent-worker`
   - `agent-burst`: autoscaled node pool for call spikes
   - `voice`: `2` fixed nodes for LiveKit and SIP ingress/media at the initial cost-aware baseline

2. Use a private Hetzner network for all east-west traffic.

3. Use separate public entry planes:
   - one Hetzner LB for HTTP/HTTPS ingress (`app`, `api`, `temporal`, optional Grafana)
   - one Hetzner TCP LB for LiveKit signaling/TURN-TLS if needed
   - direct public IP exposure on voice nodes for SIP and RTP

4. Do not introduce ArgoCD in v1.
   - Use Terraform/OpenTofu for infra and CI-driven Helm/Kustomize applies for workloads.
   - GitOps can come later after the cluster is boring.

5. Use two CNPG clusters:
   - `platform-postgres`
   - `temporal-postgres`

6. Use Hetzner Object Storage for:
   - CNPG backups and WAL archive
   - recordings and file storage
   - any replacement for local MinIO

7. Use HA Redis/Valkey for LiveKit and SIP.
   - A single Redis pod is not acceptable for production voice.

8. Use KEDA to scale `agent-worker` from the real `calls_concurrent` Prometheus metric.
   - Let KEDA scale pods.
   - Let kube-hetzner cluster autoscaler add `agent-burst` nodes when those pods no longer fit.

9. Self-hosted SIP is required, but active calls on a failed voice node will still drop.
   - New-call availability can be preserved with multiple voice nodes.
   - Call-level HA does not magically appear because someone wants it.

## Repo Truth We Must Replace

These repo states are local-only and must not leak into production:

1. `infra/k8s/packages/data-cnpg/cluster-platform-postgres.yaml`
   - `instances: 1`
   - `storageClass: local-path`

2. `infra/k8s/packages/temporal/values.local.yaml`
   - single-replica Temporal server
   - plaintext DB passwords

3. `infra/k8s/packages/livekit/values.local.yaml`
   - `replicaCount: 1`
   - `turn.enabled: false`
   - `use_external_ip: false`

4. `infra/k8s/packages/base/configmap-runtime.yaml`
   - MinIO storage
   - local auth/test flags
   - local API base URL

5. `infra/k8s/packages/base/ingress-platform.yaml`
   - `*.grove.localtest.me`

## Architecture Blueprint

### 1. Base Cluster

Use kube-hetzner for:

1. HA k3s control plane
2. private networking
3. node pool separation
4. Hetzner CCM/CSI integration where appropriate
5. Cilium networking with WireGuard encryption enabled
6. firewall and placement group management

### 2. Database Layer

Use CNPG with two clusters:

1. `platform-postgres`
   - Grove/platform schema and tenant data
2. `temporal-postgres`
   - `temporal`
   - `temporal_visibility`

Required characteristics:

1. `3` instances each
2. anti-affinity across `stateful` nodes
3. object-store backups
4. restore-tested retention policy
5. dedicated secrets
6. no shared cluster between app data and Temporal history

Storage decision:

1. Start with node-local storage on the `stateful` pool.
2. Do not add Longhorn in v1.
3. Do not use "whatever default volume class appears" and hope for the best.
4. Before go-live, benchmark the chosen storage path with pgbench and a CNPG failover/restore drill.

### 3. Temporal Layer

Deploy self-hosted Temporal on the `platform` pool with:

1. PostgreSQL persistence on `temporal-postgres`
2. `numHistoryShards: 128` as the initial production default
3. separate frontend/history/matching/worker pods where chart values allow it
4. payload codec keys required in API, Temporal worker, and any other Temporal client
5. real namespace/bootstrap and migration flow

`128` shards stays the default unless forecasted workflow/day volume or queue fan-out clearly requires more
before first data lands. Resizing later is not the place to discover that someone guessed wrong.

### 4. Voice Layer

Deploy LiveKit and SIP on the `voice` pool with:

1. `2` voice nodes for the initial cost-aware production baseline
2. LiveKit configured for external IP advertisement
3. TURN/TLS enabled
4. SIP exposed on dedicated public node IPs
5. RTP UDP range exposed directly on the same node IPs
6. carrier routing configured with primary and secondary SIP targets

Network shape:

1. `livekit.<domain>` for signaling
2. `sip-a.<domain>` and `sip-b.<domain>` for carrier routing
3. direct RTP media to the voice nodes
4. no dependency on a UDP LB for media

Capacity rule for voice:

1. Launch at `50` concurrent-call support with two fixed voice nodes.
2. Raise the voice pool to `3` nodes before marketing or enabling `100` concurrent calls in production.

### 5. Application Layer

Run these on the `platform` and `agent` pools:

1. `apps/api`
2. `apps/web`
3. `apps/temporal-worker`
4. `apps/agent-worker`

Isolation rules:

1. API and Temporal server components stay off the voice nodes.
2. Agent workers do not share the voice nodes.
3. Agent workers get their own autoscaling policy.

## Deliverables

1. Real kube-hetzner production environment under `infra/environments/hetzner/production`
2. Production K8s overlay under `infra/environments/hetzner/production/k8s`
3. Production values/manifests for CNPG, Temporal, LiveKit, SIP, Redis/Valkey, ingress, cert-manager,
   and observability
4. CI-driven deploy workflow for production
5. Vault transit bootstrap for SOPS-managed production secrets under `infra/environments/hetzner/shared/vault-sops`
6. Ops runbooks for bootstrap, deploy, restore, failover, and voice troubleshooting
7. Capacity validation harness for `50` and `100` concurrent calls
8. KEDA scaler for `agent-worker` using `calls_concurrent`
9. A follow-up staging overlay derived from the production blueprint

## Execution Phases

### Phase 1: Production IaC and Base Networking

Objective:
- Replace the current placeholder Hetzner environment with a real production cluster definition.

Deliverables:
- `infra/environments/hetzner/production/*`
- `infra/environments/hetzner/shared/vault-sops/*`
- kube-hetzner config for node pools, firewalls, placement groups, and LBs
- `infra/environments/hetzner/production/k8s/*`

Required details:
- production domains and DNS records
- Vault transit mount/key/policy for SOPS-encrypted runtime secrets
- `hel1` default, `fsn1` fallback
- node labels and taints for `stateful`, `platform`, `agent`, and `voice`
- Cilium/WireGuard enabled
- ingress LB for app traffic
- voice TCP LB only if needed for LiveKit signaling/TURN-TLS
- minimal-cost baseline instance types with burst capacity delegated to autoscaling

Verification gate:
- Terraform/OpenTofu plan is clean and reproducible
- Vault bootstrap outputs a stable `SOPS_VAULT_TRANSIT_URI` without storing a long-lived SOPS token in Terraform state
- cluster provisions from zero
- node pools and taints are visible in `kubectl get nodes --show-labels`
- ingress LB and private networking are reachable as designed

### Phase 2: Stateful Services

Objective:
- Replace local singleton state with production-grade clusters and backup policy.

Deliverables:
- `platform-postgres` CNPG cluster
- `temporal-postgres` CNPG cluster
- HA Redis/Valkey deployment
- Hetzner Object Storage bucket policy and secret wiring

Required details:
- anti-affinity and pod disruption budgets
- backup schedule
- WAL retention
- restore procedure
- failover procedure
- storage benchmark record

Verification gate:
- CNPG failover drill succeeds
- backup completes
- restore into a scratch namespace or scratch cluster succeeds
- Redis/Valkey failover or restart does not require manual surgery

### Phase 3: Temporal Productionization

Objective:
- Move Temporal from local-only chart values to a production-safe deployment.

Deliverables:
- production Temporal values
- split persistence to `temporal-postgres`
- payload codec secret contract
- namespace/bootstrap job
- metrics and alerting

Required details:
- no plaintext DB credentials in values files
- `numHistoryShards: 128`
- retention and visibility DB wiring
- rolling upgrade procedure

Verification gate:
- Temporal frontend, history, matching, and worker pods are healthy
- schema setup/update jobs succeed
- workflow start/complete/retry works through the real cluster
- payloads are unreadable plaintext in the UI/history store

### Phase 4: LiveKit, SIP, and Voice Edge

Objective:
- Build a production voice plane that matches Hetzner’s real network limits.

Deliverables:
- production LiveKit values
- production SIP deployment
- public IP routing and DNS for SIP targets
- TURN/TLS configuration
- carrier bootstrap/runbook updates
- voice-pool scale-up path from `2` to `3` nodes

Required details:
- external IP advertisement
- RTP UDP range
- SIP TLS `5061`
- primary/secondary trunk target configuration
- Krisp/noise handling policy if retained
- node selectors restricting voice pods to the `voice` pool

Verification gate:
- inbound PSTN call succeeds
- outbound PSTN call succeeds
- two-way audio works
- one voice node can be removed and new calls still route through surviving nodes

### Phase 5: Platform Runtime and Release Flow

Objective:
- Replace local runtime config with a repeatable production release pipeline.

Deliverables:
- production runtime ConfigMaps/Secrets
- real OIDC config
- object-storage signed URL config
- CI workflow for build, push, and deploy
- pinned image tag policy

Required details:
- registry choice and naming
- immutable image tags
- rollout order for API, Temporal worker, agent worker, and web
- migration order
- rollback order

Verification gate:
- full platform deploy from CI to prod cluster succeeds
- OIDC login works
- workflow execution works
- recording/object storage path works

### Phase 6: Capacity Validation for Lithuania

Objective:
- Prove the cluster supports the required call load instead of guessing.

Deliverables:
- concurrent call load harness
- synthetic SIP scenario definitions
- dashboard and alert thresholds for live load runs
- capacity report for `50` and `100` concurrent calls

Required details:
- Lithuania-region latency baseline
- call setup success rate
- RTP loss/jitter thresholds
- agent-worker CPU and memory headroom
- LiveKit room/node distribution
- KEDA scale-out and scale-in behavior under synthetic load

Verification gate:
- `50` concurrent calls pass with steady-state headroom
- `100` concurrent calls pass in a controlled load test
- no uncontrolled queue buildup in Temporal or agent workers
- p95 end-of-user-utterance to first agent audio stays within the agreed launch threshold

Capacity rule:
- if `100` concurrent fails, launch with a lower enforced cap and scale the `agent` and `voice` pools before
  claiming `100`

### Phase 7: Staging Clone

Objective:
- Create a smaller environment that mirrors production decisions, not a toy environment with different failure modes.

Deliverables:
- `infra/k8s/overlays/staging-hetzner`
- smaller node counts with the same pool split
- staging DNS, certs, and deploy workflow lane

Verification gate:
- one-button deploy to staging
- same backup and restore flow as production
- same voice routing model as production, just smaller

## Acceptance Criteria

1. Production cluster can be recreated from code and documented secrets.
2. Two CNPG clusters exist, back up successfully, and restore successfully.
3. Temporal runs on its own DB cluster with payload codec enforcement.
4. LiveKit and SIP run on dedicated voice nodes with direct RTP media routing.
5. Real OIDC authentication replaces local/test auth.
6. MinIO is gone from production configuration.
7. CI can build, push, and deploy the platform without manual kubectl drift.
8. `50` concurrent Lithuania calls are supported as launch capacity.
9. `100` concurrent Lithuania calls are validated before the higher advertised cap is enabled.
10. Staging exists as a smaller clone of production after the production baseline is proven.

## Rollout Order

1. Provision production cluster and base DNS/networking.
2. Deploy cert-manager, ingress, observability, and object-storage secrets.
3. Deploy CNPG and Redis/Valkey.
4. Run database bootstrap and restore drill before application traffic.
5. Deploy Temporal.
6. Deploy LiveKit and SIP.
7. Deploy API, web, Temporal worker, and agent worker.
8. Run platform smoke tests.
9. Run voice smoke tests.
10. Run `50` concurrent load test.
11. Run `100` concurrent validation test.
12. Enable customer traffic.
13. Clone staging from the final production topology.

## Rollback and Failure Policy

1. If CNPG backup/restore is not proven, stop. Do not move to customer traffic.
2. If voice media path requires emergency firewall hacks during testing, stop and fix the network model. Do not
   normalize hand-edited firewall drift.
3. If `100` concurrent calls fail, do not "hope it will be fine in production." Reduce the enforced cap and scale.
4. If SIP failover between targets is not proven with the carrier, do not claim SIP HA.
5. If CI deploys cannot recreate the cluster state cleanly, the release process is not done.

## Evidence Expectations

Every completed phase must leave behind:

1. code or manifest pointers
2. exact verification commands
3. screenshots or dashboards where UI/ops evidence matters
4. runbook updates under `wiki/ops/`
5. any compromise logged in tech-debt-tracker (archived)

## Research Basis

Primary sources used to shape this plan:

1. kube-hetzner: https://github.com/kube-hetzner/terraform-hcloud-kube-hetzner
2. Hetzner LB FAQ: https://docs.hetzner.com/networking/load-balancers/faq/
3. LiveKit self-hosting deployment: https://docs.livekit.io/home/self-hosting/deployment/
4. LiveKit ports and firewall: https://docs.livekit.io/home/self-hosting/ports-firewall/
5. LiveKit SIP server: https://docs.livekit.io/transport/self-hosting/sip-server/
6. CloudNativePG documentation: https://cloudnative-pg.io/documentation/current/
7. CloudNativePG backup docs: https://cloudnative-pg.io/documentation/current/backup_barmanobjectstore/
8. Temporal Helm charts: https://github.com/temporalio/helm-charts

Repo sources that motivated the corrections:

1. `infra/k8s/packages/data-cnpg/cluster-platform-postgres.yaml`
2. `infra/k8s/packages/livekit-sip/service-livekit-sip.yaml`
3. `infra/k8s/packages/base/configmap-runtime.yaml`
4. `infra/k8s/packages/base/ingress-platform.yaml`
5. `infra/k8s/packages/temporal/values.local.yaml`
6. `infra/k8s/packages/livekit/values.local.yaml`
7. `infra/environments/shared/manifests/postgres/main.tf`
8. `infra/environments/shared/manifests/temporal/main.tf`
9. `infra/environments/shared/manifests/livekit/main.tf`
