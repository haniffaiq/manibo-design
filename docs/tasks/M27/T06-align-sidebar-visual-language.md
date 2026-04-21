# T06: Align Sidebar Visual Language (Radius, Tokens, Shadows)

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T06 - align sidebar visual language`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The sidebar uses `rounded-2xl` (16px radius) on nav items and icons, raw `rgba(15,23,42,0.08)` for borders, and a custom shadow `shadow-[0_8px_24px_rgba(15,23,42,0.06)]`. The content area uses `rounded-[var(--radius-md)]` (6px), `var(--color-border)`, and `var(--shadow-sm)`. This mismatch makes the sidebar feel like a different design system. Align everything to use the content area's token-based approach.

## Subtasks

- [x] **sidebar-nav.tsx** — Replace all `rounded-2xl` with `rounded-lg` (8px, matches `--radius-lg`)
- [x] **sidebar-nav.tsx** — Replace all `rgba(15,23,42,0.08)` with `var(--color-border)` (or `border-[var(--color-border)]`)
- [x] **sidebar-nav.tsx** — Replace `shadow-[0_8px_24px_rgba(15,23,42,0.06)]` with `shadow-[var(--shadow-sm)]`
- [x] **sidebar-nav.tsx** — Replace `bg-[rgba(248,250,252,0.95)]` / `bg-[rgba(248,250,252,0.9)]` / `bg-[rgba(248,250,252,0.98)]` with `bg-[var(--color-bg-subtle)]` + `backdrop-blur`
- [x] **tenant-shell.tsx** — Replace the "K" icon's `rounded-2xl` with `rounded-lg`, replace custom shadow and border
- [x] **tenant-shell.tsx** — Replace the language selector's `rounded-2xl` and `rgba()` borders
- [x] **deployment-shell.tsx** — Verify the "D" icon uses consistent radius (it uses `rounded-md` — fine)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/sidebar-nav.tsx` | Modify | Replace hardcoded styles with design tokens |
| `apps/web/src/components/tenant-shell.tsx` | Modify | Align icon and language selector styles |

## Implementation Notes

- The sidebar's `backdrop-blur` is a nice touch — keep it. Just replace the raw `rgba()` background with a token + opacity.
- The active state should still feel visually distinct: `bg-[var(--color-bg)] border-[var(--color-primary-100)] text-[var(--color-primary-700)] shadow-[var(--shadow-sm)]`
- The hover state: `hover:bg-[var(--color-bg)] hover:border-[var(--color-border)]`
- The mobile overlay sidebar: same changes apply to its `aside` element.

## Acceptance Criteria

- [x] No `rounded-2xl` in sidebar-nav.tsx or tenant-shell.tsx
- [x] No raw `rgba()` values in sidebar-nav.tsx or tenant-shell.tsx
- [x] No hardcoded shadow values in sidebar-nav.tsx or tenant-shell.tsx
- [x] Sidebar visually harmonizes with content area (same radius family, same border tokens)
- [x] `pnpm --filter @nfq/web check-types` passes
- [x] Visual spot-check: sidebar still looks good, active state is clear, hover works

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #5: Sidebar visual language mismatch
- Files: `sidebar-nav.tsx:64` (rounded-2xl on items), `tenant-shell.tsx:28` (K icon), `sidebar-nav.tsx:36` (rgba border)
