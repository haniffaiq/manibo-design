# V2 Public Chat History

## Objective

Ship the next stacked V2 public-ingress slice as a draft PR:

- target checklist row advanced: `docs/requirements/checklist.md` section `5. Website Sales Agent (Phase 1 — Critical)`
- target requirement: `Agent conducts conversational lead qualification (not form-like): assesses actual language level through conversation, captures learning goals, scheduling constraints, and contact details`

## Scope

- add authenticated public-ingress continuation resolution for guest-session routes
- add tenant-visible public chat message persistence as the canonical message truth
- add public chat send + history routes in `apps/api`
- add unit + integration proof for token validation, path mismatch rejection, message persistence, and ordered history reads

## Non-Goals

- assistant response generation
- streaming / typing indicators
- lead capture
- recommendations
- escalation handoff
- widget frontend embed

## Status

- [x] choose the next stacked slice and bind it to a checklist row
- [x] implement continuation auth resolution and message persistence
- [x] implement send + history API routes
- [x] add unit and integration coverage
- [x] run targeted verification and pre-PR CI
- [x] update `docs/requirements/checklist.md` with truthful progress

## Notes

- This slice is only worth merging if customer-visible public chat history becomes canonical tenant storage instead of transient Grove/runtime state.
- Local platform compose also needed `PUBLIC_INGRESS_TOKEN_SECRET`; without that env, the new public-ingress routes were dead in the default observed stack. This slice fixes that gap in `docker-compose.yml` and guards it in `tests/architecture/test_local_observability_wiring.py`.
- Restacked onto `feat/v2-public-ingress-bootstrap` at `cedfc1fc` before verification. Review-driven hardening added fail-closed unresolved secret-ref handling, public chat session lifecycle enforcement on history reads, and deterministic `FOR UPDATE` sequencing for canonical message persistence.
- Integration expectations changed after the parent bootstrap hardening: replay-style second bootstraps now fail at the rate limiter before grant reuse, and missing `public_chat_sessions` fixtures must drop with `CASCADE` because canonical message history now depends on that table.
- A local stack-aware review against `origin/feat/v2-public-ingress-bootstrap` surfaced two more credible blockers and both were fixed before push: guest-session continuation writes are now rate limited in `packages/platform-core/src/platform_core/public_ingress/service.py`, and history reads no longer accept `guest_token` through the URL query string in `apps/api/src/platform_api/routes/public_ingress.py`.

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py apps/api/tests/unit/test_public_ingress_app_wiring.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py`
- `uv run ruff check apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/src/platform_core/public_ingress/service.py packages/platform-core/src/platform_core/public_ingress/store.py apps/api/tests/unit/test_public_ingress_app_wiring.py packages/platform-core/tests/unit/test_public_ingress/test_service.py packages/platform-core/tests/unit/test_public_ingress/test_store.py apps/api/tests/integration/test_public_ingress.py`
- `git diff --check`
- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest packages/platform-core/tests/unit/test_call_state_cleanup.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py packages/platform-core/src/platform_core/alembic/versions/20260315_120000_public_chat_messages.py packages/platform-core/tests/unit/test_call_state_cleanup.py tests/architecture/test_local_observability_wiring.py`
- `uv run python tools/scripts/generate_api_inventory.py`
- `tools/scripts/generated_artifacts.sh refresh`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `tools/scripts/run_local_pre_pr_ci.sh`
