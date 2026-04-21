# AH-2026-04-20: Move Agent Worker Metrics Port

> **Status**: Completed
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Description

Move the Grove `agent-worker` custom Prometheus metrics endpoint off pod port
`8081`, because LiveKit Agents 1.5.1 uses `8081` for the worker HTTP health
server in production. Production currently crashes before it can process calls
because both servers try to bind the same port.

The stable Kubernetes Service port remains `8081` during this transition, but
its `targetPort: metrics` resolves to the new pod port `9090`. This avoids a
strategic-merge duplicate-port rollout failure against the existing live
Service while still moving the in-pod Grove metrics server away from LiveKit's
health port.

## Subtasks

- [x] Update base `agent-worker` metrics env/pod port to `9090`.
- [x] Update production overlays and policies that explicitly pin the old
      `agent-worker` metrics port.
- [x] Render Hetzner and GCP production overlays to confirm the effective
      manifests.
- [x] Run focused repository checks that can catch YAML or test drift.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/queries/2026-04-20-agent-worker-metrics-port-conflict.md` | Create | Investigation note and evidence trail |
| `infrastructure/kubernetes/base/workloads/agent-worker/deployment-agent-worker.yaml` | Modify | Keep LiveKit health on `8081`, add Grove metrics pod port `9090` |
| `infrastructure/kubernetes/base/workloads/agent-worker/service-agent-worker-metrics.yaml` | Review | Keep the stable Service port; existing `targetPort: metrics` routes to pod port `9090` |
| `infrastructure/kubernetes/overlays/gcp/production/patch-agent-worker-deployment.yaml` | Modify | Keep GCP production override aligned with base |
| `infrastructure/kubernetes/overlays/hetzner/production/networkpolicies-platform-hardening.yaml` | Modify | Allow monitoring ingress to `agent-worker` metrics on `9090` |

## Acceptance Criteria

- [x] `kubectl kustomize infrastructure/kubernetes/overlays/hetzner/production`
      renders `agent-worker` with `GROVE_AGENT_METRICS_PORT=9090`.
- [x] `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
      renders `agent-worker` with `GROVE_AGENT_METRICS_PORT=9090`.
- [x] Rendered Hetzner NetworkPolicy allows monitoring namespace ingress to
      destination port `9090` for `agent-worker`.
- [x] Focused `grove-voice-livekit` metrics tests pass.
- [x] No production calls are placed during this fix.

## Verification

- `kubectl kustomize infrastructure/kubernetes/overlays/hetzner/production`
- `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
- `yq 'select(.kind == "Deployment" and .metadata.name == "agent-worker") | .spec.template.spec.containers[] | select(.name == "agent-worker") | {"env": [.env[] | select(.name == "GROVE_AGENT_METRICS_PORT")], "ports": .ports}' /tmp/manibo-hetzner-production-render.yaml`
  - rendered `GROVE_AGENT_METRICS_PORT: "9090"` and pod ports `health:8081`
    plus `metrics:9090`
- `yq 'select(.kind == "Deployment" and .metadata.name == "agent-worker") | .spec.template.spec.containers[] | select(.name == "agent-worker") | {"env": [.env[] | select(.name == "GROVE_AGENT_METRICS_PORT")], "ports": .ports}' /tmp/manibo-gcp-production-render.yaml`
  - rendered `GROVE_AGENT_METRICS_PORT: "9090"` and pod ports `health:8081`
    plus `metrics:9090`
- `yq 'select(.kind == "NetworkPolicy" and .metadata.name == "agent-worker-allow-monitoring") | .spec.ingress' /tmp/manibo-hetzner-production-render.yaml`
  - rendered monitoring ingress destination port `9090`
- `kubectl --context manibo-production apply --dry-run=server -f /tmp/manibo-branch-hetzner-agent-worker-scope.yaml`
  - server-side dry-run passed for the affected Hetzner production resources
- `uv run pytest packages/grove-voice-livekit/tests/unit/test_live_metrics.py packages/grove-voice-livekit/tests/unit/test_metrics_bootstrap.py -q`
  - `13 passed in 0.19s`
- `git diff --check`

## References

- Query: `wiki/queries/2026-04-20-agent-worker-metrics-port-conflict.md`
- Voice system: `wiki/systems/voice.md`
- Infrastructure: `wiki/architecture/infrastructure.md`
