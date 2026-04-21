# T06: Redesign Dashboard

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T06 - redesign dashboard with attention block and status hints`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Strip the "Provider Workbench" explanation card. Replace with a conditional attention block that only renders when something needs operator action. Add 1-line status hints to the quick navigation links.

## Subtasks

- [x] **Remove** the "Provider Workbench" Card (data-testid `admin-dashboard-workbench-note`)
- [x] **Add attention block**: Conditional card that renders when:
  - Any worker is `degraded` or `unconfigured`
  - Total tenants = 0
  - Call error rate > 5%
  - Shows what's wrong + link to the right page
- [x] **Merge Worker Health** into the KPI strip instead of a separate full-width card
- [x] **Add status hints** to quick nav links using data already fetched by the dashboard (tenants, health, OIDC providers): e.g., "4 active" next to Tenants, "All healthy" next to Health, "2 providers" next to Settings. Do NOT add hints that require new API calls or cross-tenant fan-out (e.g., assistant counts would need per-tenant queries — out of scope for this no-backend-change milestone)
- [x] **Keep refresh button** and existing SWR data fetching patterns
- [x] **Verify**: `pnpm -C apps/web lint && pnpm -C apps/web check-types`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/page.tsx` | Modify | Rewrite dashboard layout |

## Acceptance Criteria

- [x] No "Provider Workbench" explanation card
- [x] Attention block only renders when there's a problem
- [x] Quick nav links show 1-line status hint using already-fetched data (tenant count, worker health, provider count — no new API calls)
- [x] KPI strip shows 4 cards: Tenants, Active Calls, Workers, Escalation Rate
- [x] Dashboard E2E tests updated or still pass

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
- Wireframe: see milestone doc "Dashboard Layout" section
