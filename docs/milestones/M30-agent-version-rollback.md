# M30: Agent Version Rollback Support

Status: done
Created: 2026-03-28
Owner: Jakit
Branch: feat/M30-agent-version-rollback
Stream: platform
Depends on: M28 (done), M29 (done)
Reference: `packages/platform-core/src/platform_core/agents/governance.py`

## Goal

Publishing a new agent version should not auto-archive the previous live version. The operator must be able to roll back to a previous version instantly if the new version misbehaves in production. Archived versions should be a deliberate operator action, not a side-effect of publishing.

## Current Behavior (broken)

1. v1 is published (Live)
2. Operator publishes v2
3. v1 is auto-archived — cannot be republished
4. If v2 has issues, the only option is to create v3 from v1's config and go through the full review/publish cycle again

## Target Behavior

1. v1 is published (Live)
2. Operator publishes v2 — v1 moves to "Previously live" (not archived)
3. If v2 has issues, operator clicks "Publish" on v1 — v1 becomes Live again, v2 moves to "Previously live"
4. Archiving a version is a separate explicit action (only available on non-live versions)

## Design Decisions

1. **New version status: `previously_published`** — Replaces the auto-archive behavior. When a new version is published, the old live version transitions to `previously_published`, not `archived`.

2. **Republish from `previously_published`** — The publish action is available on `previously_published` versions. Clicking it makes that version live and moves the current live version to `previously_published`.

3. **Explicit archive** — Add an "Archive" action on `previously_published` and `rejected` versions. Archived versions cannot be republished.

4. **No rollback API** — Rollback is just "publish an older version." No new endpoint needed — the existing `publish_version` works, it just needs to accept `previously_published` as a valid source status.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Add `previously_published` status to version state machine | done | none |
| T02 | Change publish logic to set old live version to `previously_published` instead of `archived` | done | T01 |
| T03 | Allow publish from `previously_published` status | done | T02 |
| T04 | Add explicit archive action on non-live versions in UI | done | T02 |
| T05 | Update version action buttons for new status transitions | done | T03, T04 |
| T06 | Verification: publish, rollback, and archive flow | done | T01-T05 |

## Acceptance Criteria

- [x] Publishing a new version does NOT archive the previous live version.
- [x] Previous live versions show as "Previously live" with a "Publish" action to rollback.
- [x] Clicking "Publish" on a previously-live version makes it live and demotes the current live version.
- [x] Archiving a version is a separate explicit action.
- [x] Archived versions cannot be republished.
- [x] The DB status column accepts `previously_published` as a valid value.
- [x] Existing tests updated, new tests cover rollback flow.

## Verification

```bash
uv run ruff check packages/platform-core/src/platform_core/agents/compiler.py packages/platform-core/src/platform_core/agents/governance.py packages/platform-core/src/platform_core/agents/published_artifacts.py packages/platform-core/tests/integration/test_agent_governance_registry.py apps/api/src/platform_api/routes/admin_agent_definitions.py apps/api/tests/integration/test_agent_definitions.py
uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -q --tb=short
uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short
pnpm -C apps/web test -- tests/admin-agent-definitions-api.test.ts tests/admin-agent-definition-detail-page.test.tsx
pnpm -C apps/web lint
pnpm -C apps/web check-types
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web playwright:test
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh --workers=1
```

Note: `uv run pyright packages/platform-core/src/platform_core/agents/governance.py` remains red on pre-existing unknown-typed YAML normalization code at `packages/platform-core/src/platform_core/agents/governance.py:102-123`; M30 did not introduce those type errors.

## Non-Goals

- No A/B traffic splitting between versions.
- No automatic rollback triggers (health-based).
- No version comparison/diff UI.
