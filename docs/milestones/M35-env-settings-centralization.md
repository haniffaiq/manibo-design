# M35: Env Settings Centralization

Status: not started
Created: 2026-04-09
Owner: Jakit
Branch: feat/M35-env-settings-centralization
Stream: platform
Depends on: M13 T11 for telephony-heavy slices; otherwise none
Reference: `wiki/queries/2026-04-09-design-env-settings-centralization.md`, `docs/tasks/M13/T13-runtime-settings-centralization-follow-on.md`

## Goal

Create one typed env contract per runtime owner without breaking the current deployment topology. Python runtimes move to shared low-level settings fragments plus service-owned settings entrypoints, including live Layer-1 runtime modules exercised from API and worker paths. The web app gets centralized env modules split by server-only vs `NEXT_PUBLIC_*` ownership. The root `.env.example` stops acting like the source of truth for every process; deployable services and solution-owned runtime surfaces get their own `.env.example` files where they actually own env-backed behavior.

This milestone is a contract and migration milestone, not an infrastructure rewrite. Phase 1 preserves existing Kubernetes `envFrom` behavior and existing env names through aliases where necessary. The first outcome is explicit ownership, validation, and documentation. Per-service secret/config splits are follow-on work only if they still buy operational value after code-level centralization lands. Shared Grove execution-path env readers that feed the executor/LLM hot path stay inside M35 scope through a dedicated Layer-1 task instead of being silently left behind.

## Design Decisions

1. **Shared low-level Python fragments + service-owned entrypoints** — low-layer concepts like database, Temporal, LiveKit, logging, Google, object storage, and internal API tokens live in shared typed fragments; each deployable service owns its own settings entrypoint.

2. **No global `platform-core` settings object for every process** — Layer 1 packages like `grove-voice-livekit` must not depend on higher-layer settings just to satisfy a "single file" aesthetic, and the deployable `apps/agent-worker` contract must stay explicitly owned at the app layer.

3. **Web env centralization follows visibility boundaries** — server-only env and `NEXT_PUBLIC_*` env are different contracts and live in separate modules, with `@next/env` used to load the same `.env*` rules in tests and scripts.

4. **Phase 1 keeps Kubernetes injection compatible** — shared `platform-runtime-config` / `platform-runtime-secrets` wiring can remain while code-level settings ownership is centralized.

5. **Aliases before renames** — existing env names remain accepted through explicit aliases or migration shims until the new contract is proven in runtime and docs.

6. **`env.example` ownership matches deployable and solution-owned surfaces** — root `.env.example` becomes a local bootstrap guide; apps and solutions own concrete env examples where they read env in shipped code.

7. **Solution UI env examples are conditional** — do not create empty `solutions/*/ui/.env.example` files when no UI env contract exists. Add them only for real UI-owned env usage.

8. **Telephony-critical readers remain in scope, but M13 overlap is a sequencing concern** — implementation may need to land telephony-heavy slices after the active M13 branch merges, even though this planning milestone itself does not depend on M13.

## Architecture

```text
Current
+------------------------------+      +------------------------------+
| Shared env injection         | ---> | Ad hoc env reads scattered   |
| configmap/secrets + .env     |      | across bootstraps/helpers    |
+------------------------------+      +------------------------------+
            |                                      |
            v                                      v
+------------------------------+      +------------------------------+
| apps/api                     |      | apps/temporal-worker         |
| apps/web                     |      | apps/agent-worker            |
+------------------------------+      +------------------------------+
                                               |
                                               v
                                    +------------------------------+
                                    | packages/grove /             |
                                    | platform-core / voice libs   |
                                    +------------------------------+

Target (phase 1)
+------------------------------+      +------------------------------+
| Shared env injection stays   | ---> | Service-owned settings       |
| deployment-compatible        |      | entrypoints per deployable   |
+------------------------------+      +------------------------------+
            |                                      |
            v                                      v
+------------------------------+      +------------------------------+
| apps/api/settings.py         |      | apps/temporal-worker/        |
| apps/web/src/env/*           |      | settings.py                  |
+------------------------------+      +------------------------------+
            |                                      |
            v                                      v
+------------------------------+      +------------------------------+
| Shared low-level fragments   |      | apps/agent-worker/           |
| in grove/platform-core       |      | settings.py                  |
+------------------------------+      +------------------------------+
```

Phase 1 centralizes ownership and validation in code while keeping current Kubernetes `envFrom` and secret/render wiring intact. Shared fragments may model low-level contracts, but each deployable service remains the owner of its runtime settings entrypoint and example env surface.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Define shared low-level settings fragments and service entrypoint contract | not started | none |
| T08 | Centralize shared Grove execution-path runtime env readers | not started | T01 |
| T02 | Migrate platform-api and platform-core runtime readers to service-owned settings | not started | T01, T08 |
| T03 | Migrate temporal worker and voice worker runtime readers to service-owned settings | not started | T01, T08, M13 T11 |
| T04 | Centralize web env contract and loader usage | not started | none |
| T05 | Rework root, app, and solution `.env.example` ownership | not started | T02, T03, T04, T07, T08 |
| T06 | Preserve deployment compatibility and document runtime proof expectations | not started | T02, T03, T04, T05, T07, T08, M13 T11 |
| T07 | Migrate surviving solution runtime env readers to explicit owners | not started | T02, T03 |

## Acceptance Criteria

- [ ] Shared low-level Python settings fragments exist in a layer-safe location and are consumed through service-owned settings entrypoints.
- [ ] Shared Grove execution-path runtime readers that feed executor/LLM paths, including provider registry, fallback, the built-in REST connector, and route-decision helpers, are centralized under an explicit Layer-1 task instead of being left implicit.
- [ ] `platform-api`, `platform-temporal-worker`, and `agent-worker` stop reading runtime env ad hoc in their main bootstraps and critical helpers.
- [ ] Layer-1 runtime helpers exercised from API/worker paths, including request policy, payload codec, tenant-lifecycle worker helpers, transcript logging, and shared logging/debug helpers, are either centralized under the owning service contract or explicitly called out as non-goals.
- [ ] The web app stops scattering env access across auth/origin/config helpers and instead uses centralized env modules for server-only and public env.
- [ ] Existing env names remain accepted in phase 1 through aliases or compatibility shims where the current runtime contract already shipped them.
- [ ] Root and service-owned `.env.example` files describe the actual process contracts instead of one monolithic mixed list.
- [ ] Solutions that still own runtime env-backed behavior after the migration use explicit typed owners and have solution-owned `.env.example` files; solutions with no owned env contract do not get empty placeholder files.
- [ ] Deployment manifests and secret/render scripts remain compatible with the phase-1 settings contract; this milestone does not require a per-service K8s secret split.
- [ ] Runtime verification proves the migrated services still boot correctly and the changed web flows still pass type/lint/test coverage.

## Verification

```bash
uv run ruff check \
  packages/grove/src/grove/config \
  packages/grove/src/grove/logger.py \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/llm_request_policy.py \
  packages/grove/src/grove/tools/system/rest_connector.py \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py \
  packages/grove/src/grove/utils/logging.py \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/tenancy \
  apps/api/src/platform_api \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/grove-voice-livekit/src/grove_voice_livekit \
  packages/platform-core/src/platform_core/observability \
  solutions/appointment_booking/src/appointment_booking \
  solutions/telematics_ingestion/src/telematics_ingestion

uv run pyright \
  packages/grove/src/grove/config \
  packages/grove/src/grove/logger.py \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/llm_request_policy.py \
  packages/grove/src/grove/tools/system/rest_connector.py \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py \
  packages/grove/src/grove/utils/logging.py \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/tenancy \
  apps/api/src/platform_api \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/grove-voice-livekit/src/grove_voice_livekit \
  packages/platform-core/src/platform_core/observability \
  solutions/appointment_booking/src/appointment_booking \
  solutions/telematics_ingestion/src/telematics_ingestion

uv run pytest \
  apps/api/tests \
  apps/temporal-worker/tests \
  apps/agent-worker/tests \
  packages/platform-core/tests \
  packages/grove/tests \
  packages/grove-voice-livekit/tests \
  solutions/appointment_booking/tests \
  solutions/telematics_ingestion/tests

pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C apps/web playwright:test
tools/scripts/e2e/run-web-e2e.sh
tools/scripts/infra/k3d-up.sh
curl -fsS http://api.grove.localtest.me/health
kubectl -n platform get pods
kubectl -n platform logs deploy/platform-api --tail=200
kubectl -n platform logs deploy/platform-temporal-worker --tail=200
kubectl -n platform logs deploy/agent-worker --tail=200
kubectl -n platform logs deploy/platform-web --tail=200
tools/scripts/e2e/run-k3d-e2e.sh

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  apps/api/src/platform_api \
  -g '!apps/api/src/platform_api/__main__.py' \
  apps/temporal-worker/src/temporal_worker \
  apps/agent-worker/src/agent_worker \
  packages/platform-core/src/platform_core/observability/tracing.py \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/connectors \
  packages/platform-core/src/platform_core/voice \
  packages/platform-core/src/platform_core/public_ingress \
  packages/platform-core/src/platform_core/recordings \
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
  packages/grove/src/grove/config \
  packages/grove/src/grove/logger.py \
  packages/grove/src/grove/providers/registry.py \
  packages/grove/src/grove/runtime/graph_routing.py \
  packages/grove/src/grove/runtime/llm_calls.py \
  packages/grove/src/grove/runtime/graph_route_decision.py \
  packages/grove/src/grove/runtime/llm_request_policy.py \
  packages/grove/src/grove/tools/system/rest_connector.py \
  packages/grove/src/grove/temporal/payload_codec.py \
  packages/grove/src/grove/temporal/voice_activities.py \
  packages/grove/src/grove/utils/logging.py \
  solutions/appointment_booking/src/appointment_booking \
  solutions/telematics_ingestion/src/telematics_ingestion

rg -n "process\\.env" \
  'apps/web/src/app/(auth)/login/page.tsx' \
  'apps/web/src/app/(auth)/admin-login/page.tsx' \
  'apps/web/src/app/api/auth/session/route.ts' \
  'apps/web/src/app/(deployment)/admin/tenants/page.tsx' \
  'apps/web/src/components/observability/use-livekit-observer.ts' \
  apps/web/src/lib

rg -n "process\\.env" \
  apps/web/src/env \
  apps/web/next.config.ts \
  apps/web/vitest.config.ts \
  apps/web/playwright.config.ts \
  apps/web/e2e/harness.ts \
  apps/web/e2e/build-solutions.ts \
  apps/web/scripts/solution-route-config.mjs

find . -name '.env.example' | sort
```

The `rg` checks are review gates: after the milestone lands, direct env reads should remain only in intentional settings/env modules, compatibility seams, tests, or scripts explicitly left out of scope. Harness-only seams such as `platform_core.calls.browser_test_runtime` and `platform_core.releases.service` are recorded in T06 instead of being treated as live runtime-owner migration targets.

## Impact on other milestones

- **M13 runtime/settings overlap**: T02, T03, T07, and T08 touch some of the same runtime readers already called out by `docs/tasks/M13/T13-runtime-settings-centralization-follow-on.md`. If M13 lands related refactors first, M35 must reuse those settings owners instead of forking a second contract.
- **Telephony-heavy sequencing**: voice and Telnyx/LiveKit readers remain in M35 scope, but T03 and T06 stay blocked on active M13 T11 work so the telephony-heavy boot paths merge once before M35 centralization starts.
- **No phase-1 deployment split**: M35 deliberately does not force per-service ConfigMap/Secret ownership in Kubernetes. A later milestone can decide whether operational isolation still buys enough value once code-level ownership and `.env.example` surfaces are stable.

## Non-Goals

- No per-service ConfigMap/Secret rewrite in phase 1.
- No blanket migration of every shell or Python script under `tools/scripts/`.
- No empty placeholder env example files just to mirror folder structure.
- No env taxonomy cleanup that breaks current names before aliases and runtime proof exist.
- No broader configuration-system rewrite beyond env ownership and validation.
