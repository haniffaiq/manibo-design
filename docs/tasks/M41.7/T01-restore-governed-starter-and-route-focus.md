# T01: Restore Governed Starter and Route Focus

> **Milestone**: M41.7-agent-builder-governed-starter-repair
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Repair the main builder shell so governed starter creation and legacy deep-link
flows still work after the new list/detail UI landed.

## Subtasks

- [x] Replace frontend static template creation with governed starter selection
- [x] Preserve legacy redirect query state and route focus into the builder
- [x] Seed unsaved definitions from starter YAML instead of inventing a blank draft

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | Restore route focus handling and governed starter creation |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Preserve legacy detail-route query state |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` | Modify | Preserve test-route query state and force the Test tab |
| `apps/web/src/app/(deployment)/admin/agent-definitions/components/create-assistant-modal.tsx` | Modify | Replace static template picker with governed starter picker |
| `apps/web/src/app/(deployment)/admin/agent-definitions/components/detail-panel.tsx` | Modify | Initialize unsaved definitions from starter YAML and route state |

## Acceptance Criteria

- [x] New assistants are created from governed starters only
- [x] Legacy deep links preserve `tenant_id`, `definition_name`, `version`,
      `starter`, `source`, and requested tab state
- [x] The builder opens newly created assistants with starter YAML loaded and
      ready for the first save

## References

- Milestone: [M41.7-agent-builder-governed-starter-repair.md](../../milestones/M41.7-agent-builder-governed-starter-repair.md)
- Related: [2026-04-20-agent-builder-pr-961-962-follow-on.md](../../../wiki/queries/2026-04-20-agent-builder-pr-961-962-follow-on.md)
