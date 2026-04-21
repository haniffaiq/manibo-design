# T08: Replace EscalationBadge with Badge from @grove/ui

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T08 - replace EscalationBadge with Badge`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

`EscalationBadge` (`apps/web/src/components/call-ops/escalation-badge.tsx`) builds a custom pill with `rounded-full px-2 py-0.5 text-[11px] font-semibold`, using colors (`--color-error-100`, `--color-warning-100`) not in the design system. The rest of the app uses `Badge` from `@grove/ui`. Delete the custom component and use Badge directly.

## Subtasks

- [x] **Replace usages**: Find all imports of `EscalationBadge` and replace with inline `<Badge>` usage
  - Urgent transfer: `<Badge variant="error">Urgent transfer</Badge>`
  - Needs help: `<Badge variant="warning">Needs help</Badge>`
  - Preserve `data-testid` attribute
- [x] **Delete the component file**: `apps/web/src/components/call-ops/escalation-badge.tsx`
- [x] **Update imports**: Remove any dead imports

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/escalation-badge.tsx` | Delete | Remove custom component |
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Modify | Use Badge directly |
| Any other files importing EscalationBadge | Modify | Use Badge directly |

## Implementation Notes

- Grep for `EscalationBadge` to find all usages.
- The Badge component already supports `variant="error"` and `variant="warning"` with appropriate colors.
- Keep the same conditional logic: `call.escalation?.status === "transfer_requested"` → error, else → warning.
- The function can be inlined in the cell renderer — no separate component needed for 3 lines of logic.

## Acceptance Criteria

- [x] `escalation-badge.tsx` file deleted
- [x] All escalation badges render using `<Badge>` from `@grove/ui`
- [x] Visual: badges look consistent with other badges in the app
- [x] `data-testid` attributes preserved
- [x] `pnpm --filter @nfq/web check-types` passes
- [x] No dead imports remain

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #7: EscalationBadge inconsistency
