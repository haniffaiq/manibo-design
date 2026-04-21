# T09: Add Skeleton Loading States

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T09 - add Skeleton loading states to admin directory pages`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Replace all `"Loading..."` text on admin directory pages with Skeleton placeholder shapes that match the eventual content layout.

## Subtasks

- [x] **Create helper**: `SkeletonTable` — renders N skeleton rows matching table column layout
- [x] **Tenants**: Replace "Loading tenants..." with skeleton table (6 columns)
- [x] **Users**: Replace loading text with skeleton table
- [x] **Assistants list**: Replace loading text with skeleton table
- [x] **Assistants detail** (`agent-definitions/[id]/page.tsx`): Replace loading text in version/editor area with skeleton blocks
- [x] **Releases**: Replace loading text with skeleton table
- [x] **Solutions**: Replace loading text with skeleton table
- [x] **Settings**: Replace loading text with skeleton rows for OIDC + defaults tables
- [x] **Dashboard**: Replace "..." KPI values with skeleton blocks during load
- [x] **Health**: Replace "Loading platform health..." with skeleton KPI grid
- [x] **Phone Routing** (`phone-numbers/page.tsx`): Replace loading text with skeleton table
- [x] **Security** (`security/page.tsx`): Replace loading text with skeleton table

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/skeleton-table.tsx` | Create | Reusable skeleton table matching DataTable layout |
| `apps/web/src/app/(deployment)/admin/page.tsx` | Modify | Skeleton KPIs |
| `apps/web/src/app/(deployment)/admin/tenants/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/users/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/releases/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/solutions/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/settings/page.tsx` | Modify | Skeleton rows |
| `apps/web/src/app/(deployment)/admin/health/page.tsx` | Modify | Skeleton grid |
| `apps/web/src/app/(deployment)/admin/phone-numbers/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/security/page.tsx` | Modify | Skeleton table |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Skeleton blocks for version/editor |

## Acceptance Criteria

- [x] No admin page shows plain "Loading..." text during initial fetch
- [x] Skeleton shapes approximate the loaded content dimensions
- [x] Skeletons pulse with `animate-pulse`
- [x] Layout does not shift when real data replaces skeletons

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Depends on: T04 (Skeleton component must exist first)
