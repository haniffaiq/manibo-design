# T03: Expand Driver-Verification UI Package with Real Code

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T03 - expand driver-verification UI package with real code`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

The driver-verification solution already has a prototype UI package (`solutions/driver_verification/ui/`). Replace the placeholder with real code by moving files from `apps/web/src/solutions/driver-verification/` into the package, renaming from `@nfq/driver-verification-ui` to `@solution/driver-verification-ui` to match the new naming convention.

## Subtasks

- [x] **Rename package** from `@nfq/driver-verification-ui` to `@solution/driver-verification-ui` in `package.json`
- [x] **Move drivers-page.tsx** to `src/pages/`
- [x] **Move manifest.ts** to `src/`
- [x] **Move api/driver-verification.ts** to `src/api/`
- [x] **Move widgets/dashboard-widget.tsx** to `src/widgets/`
- [x] **Remove placeholder.tsx** from the package
- [x] **Update all import paths** in moved files
- [x] **Verify package builds** — typecheck succeeds

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/driver_verification/ui/package.json` | Modify | Rename to `@solution/driver-verification-ui`, update exports map |
| `solutions/driver_verification/ui/src/pages/drivers-page.tsx` | Move | From `apps/web/src/solutions/driver-verification/drivers-page.tsx` |
| `solutions/driver_verification/ui/src/manifest.ts` | Move | From `apps/web/src/solutions/driver-verification/manifest.ts` |
| `solutions/driver_verification/ui/src/api/driver-verification.ts` | Move | From `apps/web/src/solutions/driver-verification/api/` |
| `solutions/driver_verification/ui/src/widgets/dashboard-widget.tsx` | Move | From `apps/web/src/solutions/driver-verification/widgets/` |
| `solutions/driver_verification/ui/src/placeholder.tsx` | Delete | Remove prototype placeholder |

## Acceptance Criteria

- [x] Package renamed to `@solution/driver-verification-ui`
- [x] All files moved from `apps/web/src/solutions/driver-verification/`
- [x] `placeholder.tsx` removed
- [x] All imports within moved files resolve correctly
- [x] `pnpm install` succeeds
- [x] `apps/web/src/solutions/driver-verification/` directory is empty or deleted

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Conventions: T01 solution UI package conventions
