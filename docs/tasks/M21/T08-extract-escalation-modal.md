# T08: Extract EscalationModal Component

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T08 - extract EscalationModal component`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Extract the escalation confirmation Modal (used for takeover and transfer actions) from the call-ops page into a standalone component. The modal shows different copy and styling depending on whether the action is a takeover or transfer.

## Subtasks

- [x] **Create component**: `apps/web/src/components/call-ops/escalation-modal.tsx`
- [x] **Move Modal logic** for takeover and transfer from call-ops page
- [x] **Define props**: `draft: EscalationDraft | null`, `onSubmit`, `onClose`, `busy`
- [x] **Destructive variant for transfer** — red button for transfer action
- [x] **Cancel first** — Cancel button always appears before the action button

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/call-ops/escalation-modal.tsx` | Create | EscalationModal with takeover/transfer variants |
| `apps/web/src/app/(tenant)/call-ops/page.tsx` | Modify | Remove inline escalation modal, import EscalationModal |

## Acceptance Criteria

- [x] Modal shows correct copy for takeover vs transfer actions
- [x] Transfer action uses destructive variant (red button)
- [x] Cancel button always appears first (left position)
- [x] Modal opens when `draft` is non-null, closes when null
- [x] `busy` prop disables submit button during API call
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
