# M18: V2 Phase 6 — Diagnostics, Tool Catalog, Health + Provider Policy

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M18-v2-diagnostics
Stream: v2
Depends on: M8, M14
Reference: docs/milestones/exec-plans/v2_canonical_architecture_refresh.md (Phase 6, lines 2881-2909)

## Goal

Make the growing platform operable by humans. Setup doctor/validation, operator-visible tool catalog with metadata, governed provider pack registry, dependency health rollups with alerting, and health views across connectors, channels, workflows, content, and providers.

## V2 Boxes Activated

- `diagnostics + health`
- `tool_catalog`
- `provider_policy_registry`

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Tool catalog entry model with risk/ownership metadata | not started | none |
| T02 | Tool catalog API (list, introspect, validate at bootstrap) | not started | T01 |
| T03 | Provider policy registry model + governance API | not started | none |
| T04 | Setup doctor / validation flows | not started | T01, T03 |
| T05 | Dependency health rollups (connectors, channels, workflows, composition) | not started | none |
| T06 | Alert policy + alert event model and API | not started | T05 |
| T07 | Admin health dashboard with rollups and alerts | not started | T05, T06 |
| T08 | E2E tests | not started | T01-T07 |

## Acceptance Criteria

- [ ] Operators can see which tools an agent uses, who owns them, and risk classification
- [ ] Bootstrap fails if tool catalog metadata doesn't match registered runtime tools
- [ ] Dependency health rollups cover connectors, channels, workflow bindings, and composition state
- [ ] Alert policies trigger on degraded dependencies; alert events are visible in admin UI
- [ ] Setup doctor validates tenant config and reports actionable fixes

## Verification

```bash
uv run ruff check packages/platform-core/src/platform_core/diagnostics/ packages/platform-core/src/platform_core/health/
uv run pyright packages/platform-core/src/platform_core/diagnostics/ packages/platform-core/src/platform_core/health/
uv run pytest packages/platform-core/tests/ -q --tb=short
pnpm -C apps/web lint && pnpm -C apps/web check-types
```

## M33 Impact

**Requires adaptation.** Tool catalog must account for M33 system tools (memory, skills, terminal, execute_code, delegate_autonomous_task). These are dynamically registered by bootstrap when autonomous agents are configured. Health rollups must monitor memory store and skill store availability. Bootstrap validation extended to fail-closed when autonomous stores are unavailable.
