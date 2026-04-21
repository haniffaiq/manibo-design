# T03: Migrate temporal worker and voice worker runtime readers to service-owned settings

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01, T08, M13 T11

---

## Description

Move worker bootstrap and worker-owned runtime-critical helpers off direct env reads. This slice covers the Temporal worker process, tenant-lifecycle helpers invoked by Temporal activities, the deployable voice worker surface in `apps/agent-worker`, low-level voice runtime modules that currently read env at import or boot time, and Layer-1 Temporal/runtime helpers that are exercised from the worker path.

## Subtasks

- [ ] **Migrate Temporal bootstrap**: replace direct env reads in the worker main path, health/polling config, and worker-side LiveKit helpers.
- [ ] **Migrate temporal-worker shared-helper callers**: stop worker callers from depending on env-backed shared Layer-2 helpers such as `platform_core.config.runtime_flags`, `platform_core.config.model_policy`, and `platform_core.recordings.factory` without worker-owned settings wiring.
- [ ] **Migrate voice worker bootstrap**: replace import-time and boot-time env reads in `apps/agent-worker` and `grove-voice-livekit`, with `apps/agent-worker` owning the typed voice-worker settings entrypoint.
- [ ] **Prove worker startup behavior**: add owner-level tests in `apps/agent-worker/tests/` plus worker/runtime tests in `apps/temporal-worker/tests/` and `packages/grove-voice-livekit/tests/` for bootstrap defaults, alias support, and early failure messages for missing required settings.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/temporal-worker/src/temporal_worker/__main__.py` | Modify | Replace worker bootstrap env reads |
| `apps/temporal-worker/src/temporal_worker/worker.py` | Modify | Stop temporal-worker callers from relying on env-backed shared runtime flags and recording-provider helpers |
| `apps/temporal-worker/src/temporal_worker/voice_activities.py` | Modify | Consume typed worker settings |
| `apps/temporal-worker/src/temporal_worker/activities/agent_config_resolution.py` | Modify | Stop temporal-worker model-policy validation from depending on env-backed shared helpers without worker-owned settings wiring |
| `apps/temporal-worker/src/temporal_worker/activities/livekit_takeover.py` | Modify | Consume typed worker settings |
| `apps/temporal-worker/src/temporal_worker/activities/extraction.py` | Modify | Consume typed worker settings for mock/failure toggles and shared model-policy callers |
| `apps/temporal-worker/src/temporal_worker/search_attributes.py` | Modify | Consume typed startup timing settings |
| `apps/agent-worker/src/agent_worker/settings.py` | Create | Deployable voice worker settings entrypoint |
| `apps/agent-worker/src/agent_worker/main.py` | Modify | Bootstrap the voice worker through typed settings |
| `packages/platform-core/src/platform_core/tenancy/activities.py` | Modify selectively | Keep Temporal tenant-lifecycle activities wired through worker-owned settings instead of hidden env-backed helpers |
| `packages/platform-core/src/platform_core/tenancy/provisioning_service.py` | Modify selectively | Remove tenant-lifecycle env reads/mutations from the worker path or centralize them behind the worker-owned settings contract |
| `packages/grove/src/grove/temporal/payload_codec.py` | Modify selectively | Align worker-owned payload codec env reads with the centralized worker settings contract |
| `packages/grove/src/grove/temporal/voice_activities.py` | Modify selectively | Align worker-owned transcript logging env reads with the centralized worker settings contract |
| `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` | Modify | Remove import-time ad hoc env parsing from boot path |
| `packages/grove-voice-livekit/src/grove_voice_livekit/observability.py` | Modify | Align tracing bootstrap env reads with worker settings or document the allowed seam |
| `packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py` | Modify | Align metrics bootstrap env reads with worker settings |
| `packages/grove-voice-livekit/src/grove_voice_livekit/metrics_bootstrap.py` | Modify | Consume typed metrics settings |
| `packages/grove-voice-livekit/src/grove_voice_livekit/agent_config_resolver.py` | Modify | Consume typed internal API / registry settings |
| `packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py` | Modify | Consume typed runtime toggles and LiveKit URL helpers that are already on the voice job path |
| `packages/grove-voice-livekit/src/grove_voice_livekit/call_signaler_bootstrap.py` | Modify | Consume typed voice worker settings |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` | Modify | Consume typed execution toggles |
| `apps/temporal-worker/tests/` | Modify/Create | Coverage for worker settings-backed startup behavior |
| `apps/agent-worker/tests/` | Modify/Create | Owner-level coverage for voice-worker bootstrap, alias support, and missing-setting failures |
| `packages/grove-voice-livekit/tests/` | Modify/Create | Coverage for voice-worker settings-backed startup behavior |

## Implementation Notes

- Preserve the deployable owner boundary: `apps/agent-worker` is the service surface even if most logic lives in `packages/grove-voice-livekit`.
- Keep `packages/grove-voice-livekit` free of a service-owned settings singleton. Shared voice-runtime fragments are fine; the canonical runtime contract belongs to `apps/agent-worker`.
- T03 owns the temporal-worker caller migration for shared Layer-2 helpers used from `platform_core.config.runtime_flags`, `platform_core.config.model_policy`, and `platform_core.recordings.factory`. T02 may extract shared fragments, but worker caller rewiring still lands here.
- T03 also owns Layer-1 worker-path env readers such as `grove.temporal.payload_codec` and `grove.temporal.voice_activities`; leaving them out would let the milestone claim centralized worker config while live worker behavior still reads `os.environ` directly.
- T01 owns the shared Layer-1 logging/debug fragments (`grove.logger`, `grove.utils.logging`). T03 consumes that contract from worker-owned entrypoints where Temporal or voice-worker bootstraps rely on those values; it does not fork a worker-only logging parser.
- Temporal tenant lifecycle is in scope here because `platform_core.tenancy.activities` is a worker-owned caller path and `platform_core.tenancy.provisioning_service` currently reads `DATABASE_URL` plus mutates `TENANT_SCHEMA` / `ALEMBIC_DATABASE_URL` during migration bootstrap. M35 should not claim worker env centralization while that Temporal activity path still depends on raw env.
- Shared Grove execution-path readers that are owned in Layer 1 move under T08 first; T03 then owns the temporal/voice-worker caller proof so worker slices do not keep depending on stale pre-T08 env behavior.
- Keep solution-owned bridge knobs out of the shared worker contract. `apps/temporal-worker/src/temporal_worker/activities/target.py` currently reads `DRIVER_VERIFICATION_AGENT_DEFINITION_NAME`, but that is a `driver_verification` business knob and belongs under T07 as a solution-owned or injected dependency instead of expanding T03 into solution config ownership.
- Scope this task to the entrypoint-critical voice modules listed below, including modules imported on the startup/job path from `entrypoint.py` and `voice_job.py`. Other `grove-voice-livekit` env readers that are not proven startup-critical must be recorded as explicit follow-on debt in T06 instead of being silently pulled into this slice.
- Pure browser-test harness helpers such as `packages/platform-core/src/platform_core/calls/browser_test_runtime.py` stay outside the phase-1 worker runtime contract. Record them as explicit harness-only seams in T06 instead of treating them as live worker settings ownership.
- Be careful with import-time behavior in `grove-voice-livekit`; settings loading must not create circular imports or change multiprocessing assumptions.
- Keep `.env` fallback behavior explicit during migration if local voice flows still rely on it.
- Keep the owner-level test lane honest: `apps/agent-worker/tests/` must prove the deployable service entrypoint contract directly rather than relying only on package-level `grove-voice-livekit` coverage.

## Acceptance Criteria

- [ ] Temporal worker bootstrap no longer reads runtime env ad hoc in its main startup path.
- [ ] Voice worker bootstrap no longer reads runtime env ad hoc in entrypoint-critical modules.
- [ ] Worker-side aliases preserve currently shipped env names in phase 1.
- [ ] Missing required worker settings fail before the worker starts processing jobs.
- [ ] `apps/agent-worker/tests/` covers bootstrap defaults, alias handling, and missing-setting failure messages for the service-owned voice-worker settings entrypoint.
- [ ] Temporal-worker callers of `platform_core.config.runtime_flags`, `platform_core.config.model_policy`, and `platform_core.recordings.factory` no longer depend on env-backed shared helpers outside the worker-owned settings contract.
- [ ] Tenant-lifecycle helpers invoked by Temporal activities no longer leave `packages/platform-core/src/platform_core/tenancy/provisioning_service.py` as an unowned worker-path env reader.
- [ ] Layer-1 worker-path env readers invoked from Temporal worker bootstrap/runtime, including payload codec and transcript logging helpers, no longer read runtime env ad hoc outside the worker-owned settings contract.

## Verification

```bash
uv run ruff check \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/platform-core/src/platform_core/tenancy \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py \
  packages/grove-voice-livekit/src/grove_voice_livekit

uv run pyright \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/platform-core/src/platform_core/tenancy \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py \
  packages/grove-voice-livekit/src/grove_voice_livekit

uv run pytest \
  apps/temporal-worker/tests \
  apps/agent-worker/tests \
  packages/platform-core/tests \
  packages/grove/tests/unit/temporal \
  packages/grove-voice-livekit/tests \
  -q --tb=short -k "settings or bootstrap or alias or failure or browser or worker or voice or codec or transcript or tenant"

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/platform-core/src/platform_core/tenancy/activities.py \
  packages/platform-core/src/platform_core/tenancy/provisioning_service.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/observability.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/metrics_bootstrap.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/agent_config_resolver.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/call_signaler_bootstrap.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py
```

Review gate: the grep targets env read-sites only. Documented write-only seams such as `os.environ["PROMETHEUS_MULTIPROC_DIR"] = ...` are allowed if the task records why they remain.

Package-level env readers outside the listed entrypoint-critical modules are not automatically in scope for T03. Any survivors, plus browser-test harness seams such as `platform_core.calls.browser_test_runtime`, must be called out as explicit follow-on debt in T06.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
