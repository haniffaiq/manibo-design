# T07: Harden Disabled Button Contrast

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T07 - harden disabled button contrast across admin pages`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Audit all Button disabled states in `packages/ui/src/components/button.tsx` and ensure every variant uses solid, legible colors when disabled. Never opacity-based.

## Subtasks

- [x] **Audit** `button.tsx` disabled styles for all variants (primary, outline, ghost, destructive)
- [x] **Fix non-destructive variants**: Disabled state = `bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)] border-[var(--color-neutral-200)]` for primary, outline, ghost
- [x] **Fix destructive variant**: Disabled state = `bg-[var(--color-error-50)] text-[var(--color-error-300)] border-[var(--color-error-200)]` — keeps muted red tint so operators still recognize it as a destructive action even when disabled
- [x] **Remove** any `opacity-50` or `disabled:opacity-*` rules from button styles
- [x] **Verify** visually on admin pages with disabled action rows (especially tenant Offboard and user Remove buttons)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/button.tsx` | Modify | Standardize disabled styles |

## Acceptance Criteria

- [x] No `opacity` used for disabled buttons in any variant
- [x] Disabled buttons are visually distinct but text remains legible (WCAG 3:1 contrast)
- [x] Disabled destructive buttons are still recognizable as destructive (muted red tint, not gray)
- [x] `pnpm -C packages/ui build` succeeds

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
