# T06: Add Profile-Specific pnpm-workspace.yaml

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T06 - add profile-specific pnpm-workspace.yaml`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Create profile-specific pnpm workspace files that control which solution UI packages are included in a build. The licensed-platform profile includes only NFQ-contracted solutions, while the single-tenant profile includes only one solution. These workspace files are used by the export/build pipeline to produce client-specific artifacts.

## Subtasks

- [x] **Create licensed-platform workspace** at `docker/profiles/licensed-platform/pnpm-workspace.yaml` listing only NFQ-contracted solution UIs
- [x] **Create single-tenant workspace** at `docker/profiles/single-tenant/pnpm-workspace.yaml` listing only the single solution UI
- [x] **Verify workspace resolution** — `pnpm install` succeeds with each profile workspace

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docker/profiles/licensed-platform/pnpm-workspace.yaml` | Create | Workspace with NFQ-contracted solution UIs only |
| `docker/profiles/single-tenant/pnpm-workspace.yaml` | Create | Workspace with single solution UI only |

## Acceptance Criteria

- [x] `docker/profiles/licensed-platform/pnpm-workspace.yaml` exists and lists only NFQ-contracted solution UIs
- [x] `docker/profiles/single-tenant/pnpm-workspace.yaml` exists and lists only the target solution UI
- [x] `pnpm install` resolves correctly with each profile workspace

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T05 (generated registry wired into apps/web)
