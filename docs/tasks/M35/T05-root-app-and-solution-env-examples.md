# T05: Rework root, app, and solution `.env.example` ownership

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04, T07, T08

---

## Description

Align the example env files with the new ownership model. The root example becomes a local bootstrap guide. Each deployable app owns its own example file. Solutions that still own runtime env after the migration get solution-owned examples. Solutions with no owned env contract do not get empty placeholders.

## Subtasks

- [ ] **Reduce root scope**: rewrite the root `.env.example` so it points to service-owned env contracts instead of trying to define every process in one place.
- [ ] **Add app-owned examples**: create and document `.env.example` files for `apps/api`, `apps/temporal-worker`, `apps/agent-worker`, and `apps/web`.
- [ ] **Re-audit surviving solution env ownership**: after T02-T04 land, distinguish real solution-owned contracts from platform-owned or cross-solution leaks that should move upward or disappear.
- [ ] **Add solution-owned examples where justified**: create backend/UI solution examples only for solutions with real env-backed runtime ownership after the re-audit.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.env.example` | Modify | Convert root example into a local bootstrap guide |
| `apps/api/.env.example` | Create | API-owned runtime env example |
| `apps/temporal-worker/.env.example` | Create | Temporal worker-owned runtime env example |
| `apps/agent-worker/.env.example` | Create | Deployable voice worker-owned runtime env example |
| `apps/web/.env.example` | Create | Web server/public env example |
| `solutions/appointment_booking/.env.example` | Create selectively | Only if the post-migration re-audit proves `appointment_booking` still owns runtime env |
| `solutions/driver_verification/.env.example` | Create selectively | Only if the post-migration re-audit proves `driver_verification` still owns runtime env |
| `solutions/telematics_ingestion/.env.example` | Create selectively | Only if the post-migration re-audit proves `telematics_ingestion` still owns runtime env |
| `wiki/index.md` | Modify selectively | Point docs readers at the new env example ownership model if needed |

## Implementation Notes

- The current audit did not find solution UI env readers under `solutions/*/ui`; do not create empty UI env examples just for symmetry.
- The current audit found env leaks in `solutions/appointment_booking` and `solutions/telematics_ingestion`, plus the `DRIVER_VERIFICATION_AGENT_DEFINITION_NAME` bridge read on the `driver_verification` worker path. Those do not automatically become solution-owned contracts. Re-audit after T02-T04 and T07 to decide whether they stay solution-owned, move to app-owned settings, or disappear.
- No solution UI `.env.example` path is in scope for M35 today because the audit did not find any concrete UI env owner under `solutions/*/ui`.
- Keep examples honest about shared vs service-specific values. Duplicate only when the same variable is part of multiple deployable contracts.

## Acceptance Criteria

- [ ] Root `.env.example` no longer pretends to be the complete source of truth for every process.
- [ ] Each deployable app has a service-owned `.env.example` matching its runtime contract.
- [ ] Solutions with real runtime env ownership after the migration re-audit have solution-owned `.env.example` files.
- [ ] No empty placeholder `.env.example` files are created for env-less solution UI packages.

## Verification

```bash
find . -name '.env.example' | sort

rg -n "process\\.env" \
  apps/web/src \
  -g '!apps/web/src/env/**'

rg -n "process\\.env" \
  apps/web/src/env \
  apps/web/next.config.ts \
  apps/web/vitest.config.ts \
  apps/web/playwright.config.ts \
  apps/web/e2e/harness.ts \
  apps/web/e2e/build-solutions.ts \
  apps/web/scripts/solution-route-config.mjs

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  apps/api/src/platform_api \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/public_ingress \
  packages/platform-core/src/platform_core/recordings \
  packages/platform-core/src/platform_core/voice \
  packages/grove/src/grove/config \
  packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/observability.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/live_metrics.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/metrics_bootstrap.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/agent_config_resolver.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/config_mapper.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/call_signaler_bootstrap.py \
  packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py \
  solutions/appointment_booking/src/appointment_booking \
  solutions/telematics_ingestion/src/telematics_ingestion

rg -n "envFrom|platform-runtime-config|platform-runtime-secrets|platform-web-runtime-secrets" \
  infrastructure/kubernetes/base \
  tools/scripts/infra/k8s-runtime-secrets.sh
```

Review gate: only shipped runtime readers and deployment inventories from T04/T06 count toward `.env.example` ownership in this task. Tests, tooling under `tools/scripts/**`, and explicit loader/bootstrap allowlists do not justify creating app- or solution-owned example files.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
