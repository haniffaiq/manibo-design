# T21: Unify Error/Notice Patterns Across All Pages

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T21 - unify error/notice patterns`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

Migrate all error and notice displays across both consoles to use the `StatusMessage` component from T05. This replaces three different patterns: `ActionBanners`, `InlineNotice`, and scattered inline `<p className="text-sm text-error">` tags.

## Subtasks

- [x] **Audit all error/notice patterns**: Grep for `text-error-700`, `ActionBanners`, `InlineNotice`, and inline error `<p>` tags
- [x] **Replace in call-ops pages**: `call-ops/page.tsx`, `call-ops/alerts/page.tsx`, `call-ops/history/page.tsx`
- [x] **Replace in deployment pages**: `admin/page.tsx` (load error banner)
- [x] **Replace in tenant pages**: `dashboard/page.tsx` (solution error, partial warning)
- [x] **Replace in admin pages**: Any page using `AdminPageShell` with `error`/`notice` props — update AdminPageShell to use StatusMessage internally
- [x] **Replace in support drawer**: `support-drawer.tsx` error displays
- [x] **Delete ActionBanners**: `apps/web/src/components/action-banners.tsx` — after all usages migrated
- [x] **Delete InlineNotice**: `apps/web/src/components/inline-notice.tsx` — after all usages migrated (keep the `useNotice` hook)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Multiple page files | Modify | Replace error/notice patterns with StatusMessage |
| `apps/web/src/components/admin-page-shell.tsx` | Modify | Use StatusMessage instead of ActionBanners |
| `apps/web/src/components/action-banners.tsx` | Delete | Replaced by StatusMessage |
| `apps/web/src/components/inline-notice.tsx` | Delete | Replaced by StatusMessage |

## Implementation Notes

- `StatusMessage` with `bordered={true}` replaces `ActionBanners`.
- `StatusMessage` with `bordered={false}` replaces `InlineNotice` and bare `<p>` error text.
- The `useNotice` hook stays — it provides the auto-dismiss timer. Just change what it renders.
- `AdminPageShell` can accept a `StatusMessage` child or use StatusMessage internally for its `error`/`notice` props.
- This is a wide-but-shallow change — many files touched, but each change is small.

## Acceptance Criteria

- [x] No more `ActionBanners` component or imports
- [x] No more `InlineNotice` component or imports (hook stays)
- [x] No more bare `<p className="text-sm text-[var(--color-error-700)]">` for errors
- [x] All errors/notices use `StatusMessage`
- [x] Visual consistency: all errors look the same across all pages
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #6: Inconsistent error/notice patterns
