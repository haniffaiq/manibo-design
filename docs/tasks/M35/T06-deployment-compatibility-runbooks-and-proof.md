# T06: Preserve deployment compatibility and document runtime proof expectations

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04, T05, T07, T08, M13 T11

---

## Description

Close the migration by proving the new contract works with the current deployment model and by documenting the remaining seams honestly. This task does not split Kubernetes secrets/configmaps per service. It verifies compatibility, updates env/render/runbook docs, and records the intentionally unmigrated script debt.

## Subtasks

- [ ] **Document deployment compatibility**: update runtime secret/config docs and runbooks so they describe service-owned settings plus the current shared K8s injection model.
- [ ] **Audit compatibility seams**: list remaining script/test env readers that intentionally remain outside the first migration slice.
- [ ] **Record harness-only env seams explicitly**: keep browser-test/runtime chaos helpers such as `packages/platform-core/src/platform_core/calls/browser_test_runtime.py` and `packages/platform-core/src/platform_core/releases/service.py` out of the live service contract, but name them as explicit phase-1 debt.
- [ ] **Capture runtime proof**: verify service boot, worker boot, and web/test startup still work with the centralized contract on the local k3d stack, which is the repo’s runtime truth.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/base/platform/core/configmap-runtime.yaml` | Modify selectively | Align comments/defaults with the centralized contract if needed |
| `infrastructure/kubernetes/base/workloads/platform-api/deployment-platform-api.yaml` | Modify selectively | Keep phase-1 env wiring compatible |
| `infrastructure/kubernetes/base/workloads/temporal-worker/deployment-temporal-worker.yaml` | Modify selectively | Keep phase-1 env wiring compatible |
| `infrastructure/kubernetes/base/workloads/agent-worker/deployment-agent-worker.yaml` | Modify selectively | Keep phase-1 env wiring compatible |
| `infrastructure/kubernetes/base/workloads/platform-web/deployment-web.yaml` | Modify selectively | Keep phase-1 env wiring compatible |
| `tools/scripts/infra/k8s-runtime-secrets.sh` | Modify selectively | Keep secret rendering aligned with the documented contract |
| `infrastructure/kubernetes/overlays/ci/secrets.env.example` | Modify selectively | Reflect the phase-1 contract honestly for CI |
| `infrastructure/kubernetes/overlays/hetzner/production/secrets.env.example` | Modify selectively | Reflect the phase-1 contract honestly for production |
| `infrastructure/kubernetes/overlays/local/default/secrets.env.example` | Modify selectively | Reflect the phase-1 contract honestly for default local k3d |
| `infrastructure/kubernetes/overlays/local/offline/secrets.env.example` | Modify selectively | Reflect the phase-1 contract honestly for offline local flows |
| `wiki/ops/voice-call-local-demo.md` | Modify | Point local/runtime setup at the new settings contract |
| `wiki/ops/README.md` | Modify selectively | Link to the new env ownership rules if needed |

## Implementation Notes

- Compatibility is the requirement here. Do not turn this task into a per-service manifest split.
- If a manifest does not need a code change, update the docs instead of churning YAML.
- The output must leave a clear list of intentionally unmigrated script/test env readers for follow-on work.
- Harness/test seams that are not part of the live runtime contract must be named concretely here. The current known examples are `packages/platform-core/src/platform_core/calls/browser_test_runtime.py` and `packages/platform-core/src/platform_core/releases/service.py`.
- Use k3d as the proof lane for runtime compatibility. Tests and manifest validation are supporting evidence, not the primary runtime proof.
- Because T06 closes the voice/telephony deployment proof, it stays blocked until active M13 T11 telephony work merges and the overlapping boot-path files settle on `main`.

## Acceptance Criteria

- [ ] Current deployment manifests remain compatible with the centralized settings contract.
- [ ] Secret/render/runbook docs describe the new ownership model honestly.
- [ ] Remaining script/test env readers outside the first slice, including `platform_core.calls.browser_test_runtime` and `platform_core.releases.service`, are recorded as explicit harness debt, not silent drift.
- [ ] Runtime proof exists for API, worker, and web startup after the migration on the local k3d stack, with service health/log evidence plus browser proof for the affected web flows.

## Verification

```bash
tools/scripts/infra/k3d-up.sh
curl -fsS http://api.grove.localtest.me/health
kubectl -n platform get pods
kubectl -n platform logs deploy/platform-api --tail=200
kubectl -n platform logs deploy/platform-temporal-worker --tail=200
kubectl -n platform logs deploy/agent-worker --tail=200
kubectl -n platform logs deploy/platform-web --tail=200
tools/scripts/e2e/run-k3d-e2e.sh
tools/scripts/e2e/run-web-e2e.sh

uv run pytest apps/api/tests apps/temporal-worker/tests packages/grove-voice-livekit/tests -q --tb=short
pnpm -C apps/web test

rg -n "envFrom|platform-runtime-config|platform-runtime-secrets|platform-web-runtime-secrets" \
  infrastructure/kubernetes/base \
  tools/scripts/infra/k8s-runtime-secrets.sh

tools/scripts/infra/k8s-runtime-secrets.sh validate --overlay local/default
```

Browser proof gate: verify the affected web/auth flows against the k3d stack with both Chrome DevTools MCP and Playwright MCP before closing the task.

If the task changes API/UI/runtime surfaces, also run:

```bash
uv run python tools/scripts/generate_api_inventory.py
uv run python tools/scripts/check_api_inventory.py
```

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
