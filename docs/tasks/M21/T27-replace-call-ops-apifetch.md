# T27: Replace call-ops apiFetch with platformApiRequest

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T09
> **Priority**: 4 (consistency, quick win)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T27 - replace call-ops apiFetch with platformApiRequest`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

`call-ops/page.tsx` has an inline `apiFetch()` wrapper that duplicates what `platformApiRequest` from `@grove/web-shared/api/platform` already does. Every other file uses `platformApiRequest`. Replace for consistency.

## Subtasks

- [x] **Replace `apiFetch` in call-ops/page.tsx** with `platformApiRequest` from `@grove/web-shared/api/platform`
- [x] **Remove the inline `apiFetch` function**
- [x] **Update EscalationModal** if it receives `apiFetch` as a prop — use `platformApiRequest` directly instead

## Acceptance Criteria

- [x] No inline `apiFetch` function in call-ops components
- [x] All API calls use `platformApiRequest` from web-shared
- [x] `pnpm -C apps/web check-types` passes
