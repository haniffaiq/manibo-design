# T05: Reorganize Sidebar into 4 Job-Groups

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T05 - reorganize sidebar into 4 job-groups`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Reorganize the deployment console sidebar from 3 groups (Dashboard / Management / System) to 4 job-oriented groups that read as operator tasks.

## Subtasks

- [x] **Update sections array** in `apps/web/src/app/(deployment)/admin/layout.tsx`
- [x] **Rename "Phone Numbers"** label to "Phone Routing" in sidebar
- [x] **Verify**: All sidebar links still work, active states highlight correctly

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/layout.tsx` | Modify | Change `sections` array to 4 groups |

## Implementation Notes

New sections structure:

```tsx
const sections = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: <IconDashboard /> },
    ],
  },
  {
    title: "Tenants & Access",
    items: [
      { label: "Tenants", href: "/admin/tenants", icon: <IconBuilding /> },
      { label: "Solutions", href: "/admin/solutions", icon: <IconLayers /> },
      { label: "Users", href: "/admin/users", icon: <IconUsers /> },
    ],
  },
  {
    title: "Assistants & Rollouts",
    items: [
      { label: "Assistants", href: "/admin/agent-definitions", icon: <IconCode /> },
      { label: "Releases", href: "/admin/releases", icon: <IconPackage /> },
      { label: "Phone Routing", href: "/admin/phone-numbers", icon: <IconPhone /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Observability", href: "/admin/observability", icon: <IconActivity /> },
      { label: "Health", href: "/admin/health", icon: <IconActivity /> },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Security", href: "/admin/security", icon: <IconShield /> },
      { label: "Settings", href: "/admin/settings", icon: <IconSettings /> },
    ],
  },
];
```

## Acceptance Criteria

- [x] Sidebar shows 5 sections: Dashboard (ungrouped), Tenants & Access, Assistants & Rollouts, Operations, Platform
- [x] "Phone Numbers" label reads "Phone Routing"
- [x] All 11 admin routes are reachable from sidebar
- [x] Active link highlighting still works
- [x] E2E tests that reference sidebar links still pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
