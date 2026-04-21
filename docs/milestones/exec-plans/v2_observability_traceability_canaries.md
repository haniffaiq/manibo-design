# V2 Observability Traceability Canaries

Status: completed
Owner: Codex
Date: 2026-03-16

## Goal

Close the first real V2 observability proof loop for `interactive_channel_session`.

This slice is intentionally blunt:
- route-backed API/UI support was not enough
- the harness had to prove raw persisted truth -> normalized read model -> tenant/admin browser routes
- the proof had to pass in both the fast Compose lane and the cluster-backed local-k3d lane

## Checklist / Contract Rows

- `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`
  - Must-have: normalized list/detail/timeline/compare API contracts
  - broader autonomous canary coverage
- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`
  - Section `11. Make observability a proof-backed platform contract`
  - Phase 3 web-chat observability requirement

## Scope

1. Add a deterministic `interactive_channel_session_traceability` canary to the existing harness.
2. Persist and verify the public-ingress truth needed for the new subject kind:
   - guest session control
   - chat session
   - chat messages
   - lead capture
   - recommendations
   - escalations
   - operator events
   - KPI ingress events
3. Make the canary fail closed when the KPI taxonomy is missing the new interactive-channel lifecycle events.
4. Make the cluster-backed parity path honest by fixing local image build/import verification instead of hand-waving `k3d` sync success.

## Files

- `tools/agents/traceability/models.py`
- `tools/scripts/run_traceability_canary.sh`
- `tools/scripts/build-platform-images.sh`
- `tools/scripts/k3d-sync-app-runtime.sh`
- `packages/platform-core/tests/e2e/test_observability_traceability_compose.py`
- `packages/platform-core/src/platform_core/reports/kpi.py`
- `packages/platform-core/src/platform_core/alembic_public/versions/20260316_110000_expand_kpi_event_types_for_interactive_channels.py`

## Verification

- `uv run python -m py_compile packages/platform-core/tests/e2e/test_observability_traceability_compose.py tools/agents/traceability/models.py`
- `uv run ruff check packages/platform-core/src/platform_core/reports/kpi.py packages/platform-core/tests/e2e/test_observability_traceability_compose.py tools/agents/traceability/models.py`
- `uv run pyright packages/platform-core/src/platform_core/reports/kpi.py packages/platform-core/tests/e2e/test_observability_traceability_compose.py tools/agents/traceability/models.py`
- `bash -n tools/scripts/build-platform-images.sh tools/scripts/k3d-sync-app-runtime.sh`
- `uv run pytest packages/platform-core/tests/e2e/test_observability_traceability_compose.py::test_interactive_channel_session_traceability_canary -q --tb=short`
- `TRACEABILITY_WEB_PORT=3114 tools/scripts/run_traceability_harness.sh interactive_channel_session_traceability`
- `K8S_OVERLAY=local-k3s-offline tools/scripts/k3d-up.sh`
- `K8S_OVERLAY=local-k3s-offline K3D_SYNC_USE_LOCAL_IMAGES=0 tools/scripts/k3d-sync-app-runtime.sh`
- `TRACEABILITY_HARNESS_MODE=external TRACEABILITY_WEB_BASE_URL=http://app.grove.localtest.me PLATFORM_E2E_API_URL=http://api.grove.localtest.me TRACEABILITY_EXTERNAL_KUBECONFIG=${KUBECONFIG:-$HOME/.kube/config} tools/scripts/run_traceability_harness.sh interactive_channel_session_traceability`

## Outcome

The first V2 interactive-channel observability subject is now proven instead of merely exposed.

Green proof artifacts:

- Compose: `tools/agents/artifacts/traceability-harness/local-20260316T062054Z/interactive_channel_session_traceability`
- cluster-backed local-k3d parity via harness `external` mode: `tools/agents/artifacts/traceability-harness/local-20260316T073721Z/interactive_channel_session_traceability`

## 2026-03-18 PR Follow-up

PR `#586` exposed a separate CI failure that had nothing to do with the canary logic.

- `PR traceability harness` was dying during bootstrap because the shared k3d action ran a full workspace `uv sync`.
- That dragged `agent-worker` -> `grove-voice-livekit` -> `livekit-plugins-silero` -> `onnxruntime` into a web-chat traceability lane that does not need voice-worker packages.
- On the GitHub runner that translated into `No space left on device` before the harness even started.

The fix is intentionally narrow:

- `pr-traceability-harness` now skips the shared action's full dependency install.
- The job installs only the packages the harness actually needs on the host side: `platform-core`, `platform-api`, and `temporal-worker`.
- This keeps `pytest`/`ruff`/`pyright` available while dropping the voice/noise-cancellation stack from the runner host environment.

What the canary now proves:

- raw persistence keeps the same correlation chain across guest-session control, chat session, chat transcript, lead capture, recommendation, escalation, KPI ingress events, and operator warning events
- tenant/admin observability list/detail/timeline routes both project `interactive_channel_session` honestly
- tenant/admin browser routes show the same session, status, metrics, timeline evidence, and related-entity linkage as the read model

The real bug fixed in this slice was not theoretical. Fresh local-k3d parity was lying because the image-build/import path could claim success while the cluster still served `ImagePullBackOff`. The sync path now fails loudly if the local image never lands in Docker or on the node container runtimes.

## Remaining Gaps

- `interactive_channel_session` is only the first V2 subject. The harness still lacks first-class canaries for:
  - control-plane commands
  - control-plane incidents
  - channel-runtime state and delivery degradation
  - tenant-composition invalidation
- this slice does not finish the whole observability endgame; it makes the first web-chat/V2 proof loop real
