# T01: Reorganize Tenant Sidebar into Job-Groups

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T01 - reorganize tenant sidebar into job-groups`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

Restructure the tenant workbench sidebar from a flat list into operator job-groups that read as task categories. The groups are: "Live Support" (Call Ops, Alerts), "Review" (Call History, Observability, Automations for admin), solution domain groups (Clinic, Logistics — only shown when the solution is enabled), and "Manage" (admin-only: Team, Activity, Integrations, Settings). This aligns the tenant sidebar with the same job-group pattern used in the M20 deployment sidebar.

## Subtasks

- [x] **Update buildTenantWorkbenchSections for operator role** — restructure sections into Live Support, Review, and solution domain groups
- [x] **Update buildTenantWorkbenchSections for admin role** — add Manage group with admin-only items (Team, Activity, Integrations, Settings) and Automations under Review
- [x] **Verify solution routes still appear when enabled** — Clinic group only shows when appointment-booking solution is enabled, Logistics group only shows when driver-verification solution is enabled

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/tenant-workbench.ts` | Modify | Restructure sections into job-groups: Live Support, Review, solution domains, Manage |

## Acceptance Criteria

- [x] Sidebar shows job-groups: Live Support (Call Ops, Alerts), Review (Call History, Observability), solution domains (Clinic, Logistics), Manage (admin)
- [x] Solution domain groups only appear when the corresponding solution is enabled
- [x] Admin-only items (Team, Activity, Integrations, Settings) are hidden for operator role
- [x] Automations appears under Review only for admin role
- [x] All sidebar links still navigate correctly
- [x] Active link highlighting still works

## References

- Milestone: [completed/M21-operator-console-ux.md](../../milestones/M21-operator-console-ux.md)
- Prior art: M20 T05 sidebar reorganization for deployment console
