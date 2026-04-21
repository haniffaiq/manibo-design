# T01: Add Missing Design Tokens to brand.css

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T01 - add missing design tokens to brand.css`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The `EscalationBadge` component uses `var(--color-error-100)` and `var(--color-warning-100)` but these tokens are not defined in `packages/ui/src/tokens/brand.css`. Add the missing semantic color tokens to complete the scale and unblock T08 (EscalationBadge replacement).

## Subtasks

- [x] **Add `--color-error-100`**: Value `#fee2e2` (Tailwind red-100 equivalent)
- [x] **Add `--color-warning-100`**: Value `#fef3c7` (Tailwind amber-100 equivalent)
- [x] **Add `--color-warning-200`**: Value `#fde68a` (currently referenced in tenant-dashboard warning card but not defined)
- [x] **Verify existing color references**: Grep the codebase for any other `var(--color-*-100)` or `var(--color-*-200)` references that are missing from brand.css
- [x] **Update globals.css @theme block** if any new tokens need Tailwind mapping

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/tokens/brand.css` | Modify | Add missing color tokens |
| `apps/web/src/app/globals.css` | Modify | Map new tokens in @theme block if needed |

## Implementation Notes

- Follow the existing naming pattern: `--color-{semantic}-{shade}`
- Place new values adjacent to existing entries in the same color group
- Use standard Tailwind color palette values for consistency
- Do NOT change any existing token values

## Acceptance Criteria

- [x] `--color-error-100`, `--color-warning-100`, `--color-warning-200` defined in brand.css
- [x] No undefined CSS variable references remain in the codebase (grep for `var(--color-` and cross-check)
- [x] `pnpm --filter @grove/ui check-types` passes
- [x] Visual spot-check: existing badges and banners render correctly

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Related: T08 (EscalationBadge replacement needs these tokens)
