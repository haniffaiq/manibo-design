# T05: Build StatusMessage Unified Notice Component

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T05 - build StatusMessage unified notice component`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The codebase has three different patterns for showing errors and notices: `ActionBanners` (bordered card-style), `InlineNotice` (bare colored `<p>`), and scattered inline `<p className="text-sm text-error">`. Consolidate into a single `StatusMessage` component that covers all variants.

## Subtasks

- [x] **Create StatusMessage component**: `apps/web/src/components/status-message.tsx`
  - Props: `variant: "error" | "warning" | "success" | "info"`, `message: string | null`, `bordered?: boolean` (default true), `testId?: string`
  - When `bordered=true`: renders with border + background (like ActionBanners)
  - When `bordered=false`: renders as colored text only (like current InlineNotice)
  - Returns null when message is null/undefined/empty
- [x] **Deprecate but keep old components**: Mark `ActionBanners` and `InlineNotice` with `@deprecated` comments pointing to StatusMessage. Do NOT delete yet (T21 handles migration).

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/status-message.tsx` | Create | Unified notice component |

## Implementation Notes

- Style: `rounded-[var(--radius-md)] border px-3 py-2 text-sm` with variant-specific border/bg/text colors.
- Variant colors follow existing `ActionBanners` pattern:
  - error: `border-error-500 bg-error-50 text-error-700`
  - warning: `border-warning-500 bg-warning-50 text-neutral-700`
  - success: `border-success-500 bg-success-50 text-success-700`
  - info: `border-border bg-bg-subtle text-neutral-700`
- Include `data-testid` support.

## Acceptance Criteria

- [x] `StatusMessage` renders correctly for all 4 variants
- [x] Returns null when message is falsy
- [x] `bordered` prop controls whether background/border are shown
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Related: T21 (migrates all pages to use this component)
- Current implementations: `action-banners.tsx`, `inline-notice.tsx`
