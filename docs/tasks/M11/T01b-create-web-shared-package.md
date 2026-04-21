# T01b: Create packages/web-shared for Solution Dependencies

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T01b - create packages/web-shared for solution dependencies`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Solution UI packages import shared types, API helpers, and components from `apps/web/src/`. When solutions move to separate npm packages, these `@/` imports break because the path alias doesn't exist outside `apps/web`.

Create `packages/web-shared` — a thin TypeScript package that exports the types and utilities solutions need. Both `apps/web` and `@solution/*-ui` packages import from `@grove/web-shared` instead of `@/lib/*` or `@/components/*`.

## What moves to web-shared

Based on import analysis of all solution files:

### Types (pure types, no runtime)
- `auth_types.ts` — `SessionRole` enum (11 lines)
- `solution-manifest-types.ts` — `SolutionUIManifest` interface (28 lines)

### API helper (runtime)
- `api/platform.ts` — `platformApiRequest`, `PlatformApiError` (80 lines)

### Components (runtime, React)
- `page-header.tsx` — shared layout component (39 lines)
- `icons.tsx` — SVG icon components (140 lines)
- `solution-load-error-state.tsx` — error card for solution loading (30 lines)
- `solution-unavailable-state.tsx` — disabled card when solution not enabled (24 lines)

### NOT moving (too coupled to apps/web runtime)
- `tenant-locale-provider.tsx` — React context, stays in apps/web. Solutions receive locale via props.
- `tenant-locale.ts` — 942-line copy object, stays in apps/web. Solutions receive copy via props.
- `solutions.ts` — `useTenantSolutions` hook with SWR, stays in apps/web. Solutions receive state via props.
- `observability-routes.ts` — deeply coupled to observability workspace, stays in apps/web.
- `lib/api/team.ts` — platform API client, stays in apps/web.
- `lib/api/clinic-bookings.ts` — duplicate of solution-owned API, will be removed (solution owns its own API types).

## Target structure

```
packages/web-shared/
├── package.json          # @grove/web-shared
├── tsconfig.json
└── src/
    ├── types/
    │   ├── auth.ts           # SessionRole enum
    │   └── solution-manifest.ts  # SolutionUIManifest, SolutionNavRoute
    ├── api/
    │   └── platform.ts      # platformApiRequest, PlatformApiError
    └── components/
        ├── page-header.tsx
        ├── icons.tsx
        ├── solution-load-error-state.tsx
        └── solution-unavailable-state.tsx
```

## Migration approach

1. Create `packages/web-shared` with the files
2. Update `apps/web` to re-export from `@grove/web-shared` (backward compat — existing `@/` imports still work)
3. New solution UI packages import from `@grove/web-shared` directly
4. Later (optional): migrate remaining `apps/web` internal imports to `@grove/web-shared`

## Subtasks

- [x] **Create package scaffold**: `packages/web-shared/package.json` (`@grove/web-shared`), `tsconfig.json`
- [x] **Move types**: `auth_types.ts` → `src/types/auth.ts`, `solution-manifest-types.ts` → `src/types/solution-manifest.ts`
- [x] **Move API helper**: `api/platform.ts` → `src/api/platform.ts`
- [x] **Move components**: `page-header.tsx`, `icons.tsx`, `solution-load-error-state.tsx`, `solution-unavailable-state.tsx` → `src/components/`
- [x] **Add re-exports in apps/web**: `apps/web/src/lib/auth_types.ts` becomes `export { SessionRole, isSessionRole } from "@grove/web-shared/types/auth"` (backward compat)
- [x] **Add to pnpm-workspace.yaml**: `packages/web-shared` is already covered by `packages/*` glob
- [x] **Verify**: `pnpm install && pnpm -C packages/web-shared check-types && pnpm -C apps/web check-types`

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/web-shared/package.json` | Create | `@grove/web-shared` with exports map |
| `packages/web-shared/tsconfig.json` | Create | TypeScript config |
| `packages/web-shared/src/types/auth.ts` | Create | SessionRole (from apps/web/src/lib/auth_types.ts) |
| `packages/web-shared/src/types/solution-manifest.ts` | Create | SolutionUIManifest (from apps/web/src/lib/solution-manifest-types.ts) |
| `packages/web-shared/src/api/platform.ts` | Create | platformApiRequest (from apps/web/src/lib/api/platform.ts) |
| `packages/web-shared/src/components/page-header.tsx` | Create | PageHeader (from apps/web/src/components/page-header.tsx) |
| `packages/web-shared/src/components/icons.tsx` | Create | Icons (from apps/web/src/components/icons.tsx) |
| `packages/web-shared/src/components/solution-load-error-state.tsx` | Create | Error state (from apps/web/src/components/) |
| `packages/web-shared/src/components/solution-unavailable-state.tsx` | Create | Unavailable state (from apps/web/src/components/) |
| `apps/web/src/lib/auth_types.ts` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/lib/solution-manifest-types.ts` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/lib/api/platform.ts` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/components/page-header.tsx` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/components/icons.tsx` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/components/solution-load-error-state.tsx` | Modify | Re-export from @grove/web-shared |
| `apps/web/src/components/solution-unavailable-state.tsx` | Modify | Re-export from @grove/web-shared |

## Acceptance Criteria

- [x] `packages/web-shared` exists with `@grove/web-shared` package name
- [x] Types, API helper, and components are in the package
- [x] `apps/web` re-exports from `@grove/web-shared` (all existing `@/` imports still work)
- [x] `pnpm -C packages/web-shared check-types` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] `pnpm -C apps/web lint` passes
- [x] No runtime behavior change (re-exports are transparent)

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Import analysis: solution files import 15 `@/` paths, 7 are thin enough to extract
