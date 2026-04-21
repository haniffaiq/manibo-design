# T02d: In-cluster Prometheus with remote_write + staging alertmanager silence

> **Milestone**: M26.9-staging-cluster-and-post-merge-e2e
> **Status**: Not started
> **Estimate**: S (2-3h)
> **Depends on**: T02c (workloads exist to scrape)

---

## Description

Deploy Prometheus + Alertmanager as pods on the staging cluster with
short retention (3-5 days) and `remote_write` to the prod Prometheus so
dashboards survive staging rebuilds. Silence prod alert routes; only
staging-specific routes fire. Design decision #4 in the milestone.

## Subtasks

- [ ] **Prometheus HelmRelease values** for staging with:
  - `retention: 3d`
  - Single replica
  - `remoteWrite` block pointing at the prod Prometheus
    `remote_write_receiver` endpoint, tagged `env=staging`,
    `cluster=manibo-staging`
  - `PodMonitor`/`ServiceMonitor` selectors matching the staging
    workloads (platform-api, temporal-worker, agent-worker, CNPG from
    T02c)
- [ ] **Alertmanager config** that only fires on routes tagged
  `env: staging`. All other routes drop to a null receiver. Do not
  reuse prod's Slack/Pagerduty receivers.
- [ ] **Grafana** skipped on staging — use prod Grafana with an
  `env=staging` label filter on the shared Prometheus data source.
  Document this in the runbook so operators do not look for a staging
  Grafana URL.
- [ ] **Staging-specific alert** for the floating IP attachment: fire
  when the single staging node has been `NotReady` for >10m. This is
  the only alert worth an operator nudge; everything else is best-effort.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `overlays/hetzner/staging/helm-values/kube-prometheus-stack.values.yaml` | Create | Helm values: 3d retention, 1 replica, remoteWrite to prod, podMonitor/serviceMonitor selectors. |
| `overlays/hetzner/staging/alertmanager-staging-routes.yaml` | Create | AlertmanagerConfig: staging route fires; everything else -> null receiver. |
| `overlays/hetzner/staging/prometheusrule-staging-node-notready.yaml` | Create | PrometheusRule firing on single-node NotReady >10m. |
| `overlays/hetzner/staging/secrets/prometheus-remote-write-creds.sops.yaml` | Create (encrypted) | SOPS-encrypted credentials for prod Prometheus `remote_write_receiver`. |
| `overlays/hetzner/staging/kustomization.yaml` | Modify | Add the new resources. |
| `wiki/ops/hetzner-staging-cluster.md` | Modify | Add a "staging metrics in prod Grafana" section explaining the `env=staging` filter pattern. |

## Implementation Notes

1. **remote_write authentication.** The prod Prometheus' receiver
   endpoint is gated; staging needs a dedicated credential pair. Store
   SOPS-encrypted under the staging overlay, reference via the
   HelmRelease `valuesFrom`.
2. **No Grafana on staging.** The prod Grafana reads the prod
   Prometheus; because staging writes its metrics into prod via
   `remote_write` with `env=staging` label, the same Grafana
   dashboards work with a label filter. Cheaper and one less thing to
   lose when staging dies.
3. **Retention 3d, not 3h and not 30d.** 3 days lets an operator
   debug overnight incidents without blowing up the 10GB staging disk.
4. **1-replica Prometheus.** Acceptable since the actual metrics
   store-of-record is prod Prometheus via remote_write. Staging's
   Prometheus is a forwarder plus a short-retention scratchpad.
5. **Do not open the Prometheus UI publicly.** Keep it ClusterIP; port-
   forward for debugging. Staging ingress is for product traffic, not
   ops surface.
6. **Alert routing test:** on the first apply, fire a manual alert
   through Alertmanager's HTTP API and verify it hits the staging
   null receiver, NOT the prod Slack room. Then remove the test
   annotation.

## Acceptance Criteria

- [ ] `kubectl kustomize .../staging/` renders a Prometheus HelmRelease
  with `retention: 3d` and a `remoteWrite` block.
- [ ] Rendered output contains an `AlertmanagerConfig` whose default
  receiver is `null` and which only forwards routes tagged
  `env: staging`.
- [ ] `PrometheusRule` for "staging node NotReady >10m" is present.
- [ ] SOPS round-trip works on the remote_write creds secret.
- [ ] Runbook documents the "staging metrics in prod Grafana" pattern
  with the `env=staging` filter.
- [ ] Prod overlay untouched.
- [ ] PR diff stays inside the small-PR budget.

## Verification

```bash
# Retention set correctly
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "HelmRelease" and .metadata.name == "kube-prometheus-stack") | .spec.values.prometheus.prometheusSpec.retention'
# -> 3d

# remote_write present
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "HelmRelease" and .metadata.name == "kube-prometheus-stack") | .spec.values.prometheus.prometheusSpec.remoteWrite'
# -> list with one entry pointing at the prod remote_write receiver

# Alertmanager default route is null
kubectl kustomize infrastructure/kubernetes/overlays/hetzner/staging/ \
  | yq 'select(.kind == "AlertmanagerConfig") | .spec.route.receiver'
# -> null-receiver
```

## References

- Milestone: [M26.9-staging-cluster-and-post-merge-e2e.md](../../milestones/M26.9-staging-cluster-and-post-merge-e2e.md) (Design Decision #4)
- Prod Prometheus values: `overlays/hetzner/production/helm-values/monitoring.values.yaml`
- Depends on: T02c (workloads to scrape exist)
- Follow-ups: none within M26.9 for observability; T03's E2E workflow may depend on staging metrics being visible for pass/fail signal.
