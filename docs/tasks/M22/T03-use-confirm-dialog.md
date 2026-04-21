# T03: Extract useConfirmDialog hook

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

Three admin pages (settings, users, tenants) have their own confirmation dialog state:

- Settings: `deleteTarget` state + Modal for OIDC provider delete
- Users: `confirmTarget` state + Modal for deactivate/remove
- Tenants: offboard/suspend Modals with target state

Each wires `useState<Target | null>(null)` + Modal JSX with cancel/confirm buttons. The pattern is identical — only the title, description, and confirm action differ.

## Subtasks

- [x] **Create `apps/web/src/hooks/use-confirm-dialog.ts`** — hook returning `{ confirm(options), ConfirmDialog }`
- [x] **Add vitest tests** for open/confirm/cancel lifecycle

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-confirm-dialog.ts` | Create | Shared hook |
| `apps/web/tests/use-confirm-dialog.test.ts` | Create | Unit tests |

## Implementation Notes

- `confirm()` accepts `{ title, description, confirmLabel, variant?, onConfirm }` and opens the dialog
- `ConfirmDialog` is a component returned by the hook, renders the Modal with cancel + confirm buttons
- The confirm button must use `evaluate(el => el.click())` pattern internally (or rely on T05 Modal CSS fix first)
- `variant` controls confirm button style: `"destructive"` for deletes, `"primary"` for non-destructive confirmations
- Hook manages `busy` state during `onConfirm` execution — disables buttons while action runs

## Acceptance Criteria

- [x] Single `<ConfirmDialog />` render replaces per-page Modal wiring
- [x] `confirm()` opens dialog, cancel closes it, confirm executes action
- [x] Busy state prevents double-submit during async action
- [x] Works with both destructive and non-destructive confirmations
