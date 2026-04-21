# M38.2 Progress

## 2026-04-20

- Started NFQ GCP Secret Manager sync milestone after live inbound call bring-up
  exposed that runtime values were still live-only Kubernetes Secrets.
- Decision: use GCP Secret Manager + External Secrets Operator + Reloader for
  NFQ GCP production; do not introduce SOPS for this production path.
- T01 done:
  - Terraform production bootstrap inputs codify ESO, Reloader, the ESO
    Workload Identity service account, and Secret Manager accessor grants.
  - GCP production overlay now renders a ClusterSecretStore, ExternalSecrets,
    and Reloader annotations for runtime Secrets/ConfigMaps.
  - GCP production overlay now renders ESO/Reloader PodMonitoring, and the
    NFQ/GCP observability Terraform module now creates secret-sync controller
    restart, controller availability, ExternalSecret readiness, and
    ClusterSecretStore readiness alerts.
  - NFQ/GCP-specific architecture tests live under
    `tests/architecture/nfq/gcp/`.
- T02 done:
  - Created/versioned GCP Secret Manager runtime bundles from live Kubernetes
    Secrets without printing payloads.
  - Installed ESO and Reloader in production.
  - Verified ClusterSecretStore readiness and `SecretSynced` status for all
    runtime ExternalSecrets.
  - Verified application Deployments were ready after sync.
- Outbound proof exposed two extra launch-readiness repairs that were codified
  in this branch:
  - Telnyx FQDN connection SIP auth drift is now reconciled by the setup
    scripts when explicit SIP credentials are provided.
  - NFQ/GCP agent-worker now runs Grove metrics on `9090` and LiveKit health on
    `8081`, avoiding the production bind conflict.
- T03 done:
  - Debug log, adhoc task, M38.2 milestone/task docs, milestone index, wiki log,
    and discipline checklist memory were updated.
  - Scoped architecture/secret-sync tests passed.
- PR review follow-up:
  - GCP production direct Kubernetes runtime Secret apply now refuses to write
    ESO-owned Secrets and points operators at the Secret Manager/ESO path.
  - Removed the unused `external_secrets` accessor from
    `platform-runtime-config`.
