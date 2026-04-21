# T09: Active Calls — Button Hierarchy + Overflow Menu

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T03, T08

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T09 - active calls button hierarchy + overflow menu`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Each call row currently shows 6 peer-level buttons: Support details, Listen in, Join call, Watch transcript, Take over, Transfer now. This overwhelms non-technical operators. Restructure into a 2-tier hierarchy: 2 primary actions visible + 1 overflow menu for secondary actions.

## Subtasks

- [x] **Restructure actions column**: Replace 6 buttons with:
  - **Primary**: "Take over" (primary variant, filled) + "Transfer" (outline)
  - **Overflow ("...")**: Support details, Listen in, Join call, Watch transcript
  - When `call.escalation` exists: "Claim" replaces "Take over" (same position, primary variant)
- [x] **Hide workflow_id and run_id** from the visible table. Move "Support reference" to the Support Drawer only (it's already there).
- [x] **Simplify table columns**: Column 1 = Call (call_id + badge + workflow label), Column 2 = Actions (2 buttons + overflow)
- [x] **Preserve all data-testid attributes** — the overflow menu items must keep their testids for Playwright

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/active-calls-table.tsx` | Modify | Restructure columns and actions |

## Implementation Notes

- Import `OverflowMenu` from T03.
- The "Support reference" column (workflow_id, run_id) is removed from the table. This data is still visible in the Support Drawer.
- Button order left-to-right: `[Take over / Claim]` `[Transfer]` `[...]`
- Primary button uses default Button variant (filled), Transfer uses `variant="outline"`.
- Overflow menu items: each calls the same handler as the current button.

## Acceptance Criteria

- [x] Only 2 buttons + 1 overflow menu visible per call row
- [x] "Take over" is visually dominant (primary/filled variant)
- [x] "Claim" replaces "Take over" when escalation exists
- [x] 4 secondary actions accessible via overflow menu
- [x] workflow_id and run_id NOT visible in the table
- [x] All data-testid attributes preserved (including on overflow menu items)
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #1: Button overload on active calls
- Wireframe: "CALL OPS — ACTIVE CALLS" sketch (2026-03-26)
