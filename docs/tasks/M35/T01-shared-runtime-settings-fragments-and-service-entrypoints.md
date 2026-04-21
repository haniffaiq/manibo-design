# T01: Define shared low-level settings fragments and service entrypoint contract

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Define the typed config contract that the runtime migration will use. This task chooses the layer-safe shared fragments, sets the caching/bootstrap rules, and makes the service entrypoint ownership explicit before any consumer migration starts.

## Subtasks

- [ ] **Choose fragment ownership**: place shared low-level settings fragments in a layer-safe package and define which settings groups live there versus service-owned modules.
- [ ] **Define service entrypoint APIs**: create the public `get_settings()` / cache-clear pattern for `apps/api`, `apps/temporal-worker`, and `apps/agent-worker`.
- [ ] **Prove owner entrypoint behavior**: add app-owned tests for caching, cache-clear behavior, alias compatibility, and fail-fast validation in each new service entrypoint before T02/T03 start consuming them.
- [ ] **Lock aliasing and failure rules**: define how legacy env names, defaults, and boot-time validation errors will behave in phase 1.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/config/` | Modify/Create | Shared low-level settings fragments and cache helpers |
| `packages/grove/src/grove/logger.py` | Modify selectively | Centralize shared logging-level/app-env parsing behind Layer-1 settings fragments instead of ad hoc reads |
| `packages/grove/src/grove/utils/logging.py` | Modify selectively | Centralize shared debug-logging toggles behind Layer-1 settings fragments instead of ad hoc reads |
| `packages/platform-core/src/platform_core/config/` | Modify selectively | Layer-2-only settings helpers if a setting group cannot live in Layer 1 |
| `apps/api/src/platform_api/settings.py` | Create | API-owned settings entrypoint |
| `apps/temporal-worker/src/temporal_worker/settings.py` | Create | Temporal worker-owned settings entrypoint |
| `apps/agent-worker/src/agent_worker/settings.py` | Create | Deployable voice worker-owned settings entrypoint |
| `packages/grove-voice-livekit/src/grove_voice_livekit/` | Modify selectively | Reusable voice-runtime settings fragments/helpers consumed by `apps/agent-worker` |
| `apps/api/tests/` | Modify/Create | Owner-level tests for API settings entrypoint caching, aliasing, and validation |
| `apps/temporal-worker/tests/` | Modify/Create | Owner-level tests for temporal-worker settings entrypoint caching, aliasing, and validation |
| `apps/agent-worker/tests/` | Modify/Create | Owner-level tests for voice-worker settings entrypoint caching, aliasing, and validation |
| `packages/grove/tests/` | Modify/Create | Unit tests for fragment parsing, aliasing, and cache behavior |

## Implementation Notes

- Use `pydantic-settings` with nested models where that reduces duplication.
- Shared fragments may include `database`, `temporal`, `livekit`, `logging`, `google`, `object_storage`, and `internal_api`.
- Shared logging/debug helpers such as `grove.logger` and `grove.utils.logging` are owned here so later service tasks can consume a single Layer-1 contract instead of silently inheriting direct env parsing.
- Do not move service-specific groups like OIDC or public-ingress policy into Layer 1 just to keep a single file.
- `apps/agent-worker` is the deployable owner for the voice worker contract. `packages/grove-voice-livekit` may expose reusable fragments/helpers, but it does not become the canonical service-owned settings module.
- Alias old env names in this task; do not rename them here.

## Acceptance Criteria

- [ ] Shared low-level settings fragments are defined in a layer-safe location.
- [ ] Each runtime service has a clear settings entrypoint module and cache helper contract.
- [ ] Aliasing, defaults, and boot-time validation rules are documented in code tests, not left implicit.
- [ ] Shared Layer-1 logging/debug env contracts are explicitly owned in this task instead of being implied follow-on work for API or worker slices.
- [ ] `apps/api/tests`, `apps/temporal-worker/tests`, and `apps/agent-worker/tests` each prove the owner entrypoint cache API, alias compatibility, and fail-fast validation behavior.

## Verification

```bash
uv run ruff check \
  packages/grove/src/grove/config \
  packages/grove/src/grove/logger.py \
  packages/grove/src/grove/utils/logging.py \
  packages/platform-core/src/platform_core/config \
  apps/api/src/platform_api/settings.py \
  apps/temporal-worker/src/temporal_worker/settings.py \
  apps/agent-worker/src/agent_worker/settings.py \
  packages/grove-voice-livekit/src/grove_voice_livekit

uv run pyright \
  packages/grove/src/grove/config \
  packages/grove/src/grove/logger.py \
  packages/grove/src/grove/utils/logging.py \
  packages/platform-core/src/platform_core/config \
  apps/api/src/platform_api/settings.py \
  apps/temporal-worker/src/temporal_worker/settings.py \
  apps/agent-worker/src/agent_worker/settings.py \
  packages/grove-voice-livekit/src/grove_voice_livekit

uv run pytest \
  packages/grove/tests \
  apps/api/tests \
  apps/temporal-worker/tests \
  apps/agent-worker/tests \
  -q --tb=short -k "settings or get_settings or cache or alias or validation"
```

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
- Related: `docs/tasks/M13/T13-runtime-settings-centralization-follow-on.md`
