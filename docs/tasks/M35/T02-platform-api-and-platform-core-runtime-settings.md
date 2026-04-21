# T02: Migrate platform-api and platform-core runtime readers to service-owned settings

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01, T08

---

## Description

Move API bootstrap and API-owned runtime-critical helpers off ad hoc env reads and onto the API settings contract. This slice covers `platform-api` boot, auth/public-ingress/internal API readers, `platform-core` helpers used directly by the API process, and Layer-1 runtime modules that are actively exercised from the API path. Shared Layer-2 modules such as `platform_core.config.runtime_flags`, `platform_core.config.model_policy`, and `platform_core.recordings.factory` are only in scope here for API-owned caller paths or shared-fragment extraction; temporal-worker callers of those helpers remain T03 work.

## Subtasks

- [ ] **Wire API bootstrap**: replace direct env reads in `platform_api.main`, `platform_api.__main__`, and related API bootstrap modules with the API settings entrypoint or an explicit documented launcher seam.
- [ ] **Migrate API-owned helper readers**: move internal token, public-ingress, OIDC-adjacent, browser voice, and recording/provider config reads behind typed settings access.
- [ ] **Migrate API-owned Layer-1 runtime readers**: replace direct env reads in Layer-1 runtime modules that are exercised from the API path, including the external LLM request policy client.
- [ ] **Keep shared-helper ownership explicit**: when a `platform-core` helper serves both API and worker processes, either extract the shared fragment in a layer-safe way or leave the non-API caller migration to T03/T07 instead of silently treating the helper as API-only.
- [ ] **Cover boot failures and aliases**: add tests proving missing required settings fail early and legacy env names still parse in phase 1.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/__main__.py` | Modify selectively | Align launcher env handling with the API settings contract or document the allowed `PORT` seam |
| `apps/api/src/platform_api/main.py` | Modify | Replace bootstrap env reads with typed settings |
| `apps/api/src/platform_api/optional_routes.py` | Modify | Align API feature-flag env reads with the centralized settings contract |
| `apps/api/src/platform_api/routes/browser_voice.py` | Modify | Stop ad hoc env reads for browser-call defaults |
| `apps/api/src/platform_api/routes/public_ingress.py` | Modify | Consume typed public-ingress settings |
| `apps/api/src/platform_api/routes/internal_agent_config.py` | Modify | Consume typed internal API settings |
| `apps/api/src/platform_api/routes/internal_llm_policy.py` | Modify | Consume typed internal policy settings |
| `apps/api/src/platform_api/auth/dev_auth_flags.py` | Modify | Align dev-auth env parsing with centralized settings rules |
| `apps/api/src/platform_api/telephony_livekit_trunks.py` | Modify | Use typed LiveKit/telephony settings |
| `packages/platform-core/src/platform_core/config/runtime_flags.py` | Modify selectively | Extract shared flag-loading fragments or align API-owned caller paths without taking ownership of worker callers |
| `packages/platform-core/src/platform_core/config/model_policy.py` | Modify selectively | Extract shared model-policy fragments or align API-owned caller paths without taking ownership of worker callers |
| `packages/platform-core/src/platform_core/connectors/service.py` | Modify selectively | Align connector allowlist env reads used by the API path with the centralized settings contract |
| `packages/platform-core/src/platform_core/voice/webhook.py` | Modify | Stop reading runtime env ad hoc in API-owned webhook paths |
| `packages/platform-core/src/platform_core/voice/telnyx_webhook.py` | Modify | Stop reading runtime env ad hoc in API-owned webhook paths |
| `packages/platform-core/src/platform_core/observability/tracing.py` | Modify selectively | Align API tracing bootstrap env handling with the centralized settings contract or document it as an allowed seam |
| `packages/platform-core/src/platform_core/public_ingress/network.py` | Modify | Consume typed proxy/network settings |
| `packages/platform-core/src/platform_core/recordings/factory.py` | Modify selectively | Extract shared recordings settings fragments or align API-owned caller paths without taking ownership of worker callers |
| `packages/grove/src/grove/runtime/llm_request_policy.py` | Modify selectively | Align API-owned Layer-1 request-policy env reads with the centralized settings contract |
| `apps/api/tests/` | Modify/Create | Integration/unit coverage for settings-backed bootstrap behavior |
| `packages/platform-core/tests/` | Modify/Create | Coverage for migrated helper readers |
| `packages/grove/tests/unit/runtime/` | Modify/Create | Coverage for request-policy settings wiring on the API path |

## Implementation Notes

- `platform-api` owns the process contract even when helper code lives under `platform-core`.
- `platform-api` also owns API-path proof for shared Layer-1 runtime readers that are invoked from the API path, such as `grove.runtime.llm_request_policy`. Truly shared Grove execution-path readers stay in T08, not as invisible survivors and not as API-only ownership.
- T01 owns the shared Layer-1 logging/debug fragments (`grove.logger`, `grove.utils.logging`). T02 consumes that contract from the API settings entrypoint where API bootstrap or API-owned helpers rely on those values; it does not create a second API-only parsing path.
- Prefer constructor injection or app-state wiring where the helper already accepts it; fall back to settings helper access only where wiring is impractical in this slice.
- Keep public-ingress, browser voice, and webhook semantics unchanged; this is a config ownership refactor, not a behavior redesign.
- If `PORT` remains a direct launcher-only env read in `__main__.py`, document it as an explicit allowed seam rather than leaving it implicit.
- If an env reader stays in `platform-core` after this task because it serves multiple app owners, name that follow-on owner explicitly instead of leaving it under the generic “API-owned helper” umbrella.
- `platform_core.config.runtime_flags`, `platform_core.config.model_policy`, and `platform_core.recordings.factory` are shared Layer-2 modules today. T02 may reshape them for shared fragments or API callers, but T03 must still own the temporal-worker caller migration before the milestone can claim those helpers are fully centralized.
- Harness-only readers are out of scope here. `packages/platform-core/src/platform_core/releases/service.py` currently uses `PLATFORM_E2E_TESTS` and `PLATFORM_E2E_CHAOS_ROLLOUT_DELAY_S` for release-chaos test lanes, so T06 must record it as explicit harness debt instead of pulling it into the live API runtime contract.

## Acceptance Criteria

- [ ] API bootstrap no longer reads runtime env ad hoc in its main startup path.
- [ ] API-owned `platform-core` helpers no longer read runtime env ad hoc where the API process is the owner.
- [ ] API-owned Layer-1 runtime readers invoked from `apps/api` no longer read runtime env ad hoc outside the API settings contract.
- [ ] Missing required API settings fail before serving traffic.
- [ ] Phase-1 aliases preserve currently shipped env names.
- [ ] Shared Layer-2 helpers touched in this task do not silently inherit worker ownership; temporal-worker caller migration is either complete in T03 or called out there explicitly.

## Verification

```bash
uv run ruff check \
  apps/api/src/platform_api \
  packages/platform-core/src/platform_core/observability \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/connectors \
  packages/platform-core/src/platform_core/voice \
  packages/platform-core/src/platform_core/public_ingress \
  packages/platform-core/src/platform_core/recordings \
  packages/grove/src/grove/runtime/llm_request_policy.py

uv run pyright \
  apps/api/src/platform_api \
  packages/platform-core/src/platform_core/observability \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/connectors \
  packages/platform-core/src/platform_core/voice \
  packages/platform-core/src/platform_core/public_ingress \
  packages/platform-core/src/platform_core/recordings \
  packages/grove/src/grove/runtime/llm_request_policy.py

uv run pytest \
  apps/api/tests \
  packages/platform-core/tests \
  packages/grove/tests/unit/runtime \
  -q --tb=short -k "settings or auth or ingress or webhook or recording or request_policy"

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  apps/api/src/platform_api \
  -g '!apps/api/src/platform_api/__main__.py' \
  packages/platform-core/src/platform_core/observability \
  packages/platform-core/src/platform_core/config \
  packages/platform-core/src/platform_core/connectors \
  packages/platform-core/src/platform_core/voice \
  packages/platform-core/src/platform_core/public_ingress \
  packages/platform-core/src/platform_core/recordings \
  packages/grove/src/grove/runtime/llm_request_policy.py
```

Review gate: the grep checks target env read-sites only. Documented seams such as a launcher-only `PORT` read in `apps/api/src/platform_api/__main__.py` must be called out explicitly if they remain.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
