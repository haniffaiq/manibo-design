# T28: Create Shared InlineNotice Component + useNotice Hook

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T10
> **Priority**: 5 (needed by every page eventually)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T28 - create shared InlineNotice component and useNotice hook`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

T10 replaced `alert()` with raw `<p>` + useState + setTimeout in call-ops. This pattern will be needed on every page that shows "action succeeded" feedback. Extract into a reusable `useNotice()` hook + `<InlineNotice>` component.

## Subtasks

- [x] **Create `apps/web/src/hooks/use-notice.ts`** — `useNotice(autoDismissMs?: number)` returning `{ notice, showNotice, clearNotice }`
- [x] **Create `apps/web/src/components/inline-notice.tsx`** — auto-dismiss notice with success/warning/error variants
- [x] **Update call-ops/page.tsx** — replace raw notice state with `useNotice` + `<InlineNotice>`
- [x] **Verify** call-ops E2E tests pass

## Acceptance Criteria

- [x] Reusable `useNotice` hook with configurable auto-dismiss
- [x] `InlineNotice` component with variant support (success, warning, error)
- [x] call-ops uses the shared components
- [x] `pnpm -C apps/web check-types` passes
