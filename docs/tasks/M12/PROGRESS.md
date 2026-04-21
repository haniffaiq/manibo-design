# M12: Workbench Composition + Role-Scoped Shells — Progress

## Task Status

| Task | Title | Status | Completed | Issue |
|------|-------|--------|-----------|-------|
| T01 | Deployment workbench shell parity | Done | 2026-03-25 | #615 |
| T02 | FE — Landing-route precedence rules using role + enabled solutions | Done | 2026-03-26 | #617 |
| T03 | Solution-contributed observability coverage | Done | 2026-03-19 | #618 |
| T04 | Shared queue/case/compare primitives | Done | 2026-03-25 | #618 |
| T05 | Verify manifest-driven nav covers all routes | Done | 2026-03-19 | #617 |
| T06 | UI proof backfill for role-scoped shell rendering | Done | 2026-03-26 | #615 |
| T08 | BE — Shared solution enricher contract + observability API response shape | Done | 2026-03-26 | #618 |
| T09 | FE — Adopt typed solution enrichers in shared case detail/evidence rail | Done | 2026-03-26 | #618 |

## Notes

Canonical milestone branch: feat/M12-workbench-composition
#615 DONE: role-scoped shells now carry recorded browser artifacts plus full Playwright/harness proof in `tools/agents/artifacts/m12-manual-20260326/` and `tools/agents/artifacts/ui-harness/local-20260326T122506Z/`.
#617 DONE: server-safe landing-route resolution now uses role plus enabled solutions, with single-solution tenants routed to manifest-owned defaults and safe fallbacks preserved for zero/many-solution cases.
#618 DONE: shared queue/case/compare plus the typed backend enricher contract and shared frontend enricher rendering now ship together.
#698 FOLLOW-ON: leftover page-archetype/state-grammar work is separate design debt and does not block the active M12 task table.
