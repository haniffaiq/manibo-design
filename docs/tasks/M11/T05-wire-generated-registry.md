# T05: Wire Generated Registry into apps/web

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T04

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T05 - wire generated registry into apps/web`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Replace all hardcoded solution imports in `apps/web` with imports from the generated registry files. After this task, `apps/web/src/solutions/` contains only `registry.ts` (which reads from generated files), and all solution UI code lives in external `@solution/*-ui` packages. Adding or removing a solution becomes a workspace dependency change, not a code change.

## Subtasks

- [x] **Update `apps/web/src/solutions/registry.ts`** to import from generated files instead of local directories
- [x] **Do NOT add direct workspace dependencies** in `apps/web/package.json` — solution UI packages are discovered by the generator script scanning the pnpm workspace, not by direct `"@solution/...": "workspace:*"` deps. Direct workspace deps cause `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when a profile doesn't include that solution, breaking the zero-solution build requirement in T07.
- [x] **Remove hardcoded solution imports** from dashboard widgets, route wiring, and any other files in `apps/web/src/`
- [x] **Delete `apps/web/src/solutions/appointment-booking/`** directory (files already moved in T02)
- [x] **Delete `apps/web/src/solutions/driver-verification/`** directory (files already moved in T03)
- [x] **Verify build** — `pnpm -C apps/web build` succeeds

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/solutions/registry.ts` | Modify | Import from generated files instead of local solution directories |
| `apps/web/package.json` | Modify | Add `@solution/appointment-booking-ui` and `@solution/driver-verification-ui` as workspace deps |
| `apps/web/src/solutions/appointment-booking/` | Delete | All files already moved to solution package in T02 |
| `apps/web/src/solutions/driver-verification/` | Delete | All files already moved to solution package in T03 |

## Acceptance Criteria

- [x] `apps/web/src/solutions/` contains only `registry.ts` (plus any generated index)
- [x] `apps/web/package.json` does NOT list solution UI packages as direct dependencies (they are workspace-discovered by the generator, not direct deps — this enables zero-solution builds)
- [x] No hardcoded solution imports remain in `apps/web/src/` (outside of registry.ts)
- [x] `pnpm -C apps/web build` succeeds
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T02 (appointment-booking move), T03 (driver-verification move), T04 (registry generator)
