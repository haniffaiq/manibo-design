# T02: Verify Live NFQ Production Secret Sync and Rollouts

> **Milestone**: M38.2-nfq-gcp-secret-manager-sync
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

## Description

Seed the GCP Secret Manager runtime bundles from the current live Kubernetes
Secrets, install/apply the controller resources in production, and prove sync
and rollout health without printing secret payloads.

## Subtasks

- [x] **Seed Secret Manager**: Create bundle containers and add versions from
      live Kubernetes Secret data without printing payloads.
- [x] **Install controllers**: Apply ESO and Reloader through the production
      controller path.
- [x] **Apply sync manifests**: Apply the GCP production overlay after CRDs are
      available.
- [x] **Verify sync**: Confirm ExternalSecrets are synced and affected
      Deployments are ready.

## Acceptance Criteria

- [x] ESO and Reloader Deployments are ready in production.
- [x] Runtime ExternalSecrets report synced status.
- [x] `platform-api`, `platform-temporal-worker`, `agent-worker`, and
      `platform-web` remain ready after sync.
- [x] Verification evidence is recorded in the debug log.

## Completion Evidence

- ESO deployment ready in namespace `external-secrets`.
- Reloader deployment ready in namespace `reloader`.
- ClusterSecretStore `gcp-secret-manager` reported `Ready=True`.
- ExternalSecrets reported `Ready=True` / `SecretSynced`:
  - `platform-api-runtime-secrets`
  - `platform-temporal-worker-runtime-secrets`
  - `agent-worker-runtime-secrets`
  - `platform-web-runtime-secrets`
  - `platform-api-metrics-token`
- Application rollouts were verified after sync; the later `agent-worker`
  metrics-port crash was fixed separately and codified in the production
  overlay.

## References

- Milestone: `docs/milestones/M38.2-nfq-gcp-secret-manager-sync.md`
- Debug log: `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`
