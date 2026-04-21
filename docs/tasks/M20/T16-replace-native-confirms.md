# T16: Replace Native confirm() with Modal Component

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T16 - replace native confirm() with Modal component`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

The design spec and QA checklist prohibit native `alert()` / `confirm()` dialogs. Two admin pages still use `window.confirm()` for destructive actions. Replace them with the existing `Modal` component from `@grove/ui/modal` using the destructive confirmation pattern (red button, Cancel first, explicit target name in title).

## Subtasks

- [x] **Settings** (`settings/page.tsx:187`): Replace `window.confirm("Delete OIDC provider...")` with a Modal confirmation dialog showing provider issuer, Cancel + destructive Delete button
- [x] **Users** (`users/page.tsx:216`): Replace `window.confirm(message)` with a Modal confirmation dialog showing user name/email, Cancel + destructive action button
- [x] **Verify** no remaining `window.confirm` or `window.alert` calls in admin pages

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/settings/page.tsx` | Modify | Replace `window.confirm` with Modal for OIDC provider deletion |
| `apps/web/src/app/(deployment)/admin/users/page.tsx` | Modify | Replace `window.confirm` with Modal for user destructive actions |

## Implementation Notes

Follow the same pattern as the existing offboard Modal on the Tenants page:

```tsx
<Modal
  open={deleteOpen}
  onClose={closeDeleteModal}
  title="Delete sign-in provider"
  description={`Remove ${provider.issuer}? This will disconnect staff sign-in for all affected tenants.`}
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={closeDeleteModal}>Cancel</Button>
      <Button variant="destructive" onClick={() => void confirmDelete()}>Delete provider</Button>
    </div>
  }
/>
```

## Acceptance Criteria

- [x] No `window.confirm` or `window.alert` calls in any file under `apps/web/src/app/(deployment)/admin/`
- [x] Destructive actions use Modal with red button and explicit target name
- [x] Cancel is always the left button
- [x] All E2E tests pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Design spec rule: "No Native Browser UI" — use styled Modal dialogs
