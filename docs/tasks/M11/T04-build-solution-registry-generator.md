# T04: Build Solution Registry Generator Script

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T04 - build solution registry generator script`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Extend the existing solution route generator to read from the new `solutions/{name}/ui/` packages instead of `apps/web/src/solutions/`.

**Important:** The web build already has a generator at `apps/web/scripts/generate-solution-routes.mjs` that runs as `prepare:solution-routes` and emits route wrappers under `src/app/(tenant)/(generated-solutions)` plus manifest/widget files in `src/lib/`. Do NOT create a second generator — extend the existing one to scan `@solution/*-ui` workspace packages instead of the old `apps/web/src/solutions/` directory.

## Subtasks

- [x] **Extend existing generator** at `apps/web/scripts/generate-solution-routes.mjs` to scan `@solution/*-ui` workspace packages instead of `apps/web/src/solutions/`
- [x] **Read manifest.ts exports** from each `@solution/*-ui` package for pages, widgets, API routes
- [x] **Continue generating the same output files** the Next.js routing already consumes:
  - Route wrappers under `src/app/(tenant)/(generated-solutions)/`
  - `src/lib/generated-solution-manifests.ts`
  - `src/lib/generated-solution-dashboard-widgets.tsx`
- [x] **Keep the existing `prepare:solution-routes` hook** in `apps/web/package.json` — just update what it scans
- [x] **Handle zero installed solution packages gracefully** — generator produces empty arrays, build still succeeds

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/scripts/generate-solution-routes.mjs` | Modify | Update to scan @solution/*-ui workspace packages instead of apps/web/src/solutions/ |
| `apps/web/src/lib/generated-solution-manifests.ts` | Generated | Array of SolutionUIManifest objects (same output, different source) |
| `apps/web/src/lib/generated-solution-dashboard-widgets.tsx` | Generated | Conditional widget imports (same output, different source) |
| `apps/web/src/app/(tenant)/(generated-solutions)/` | Generated | Route wrappers (same output, different source) |

## Acceptance Criteria

- [x] Generator script exists and runs without errors
- [x] Script discovers all `@solution/*-ui` packages in the workspace
- [x] `generated-solution-manifests.ts` contains valid TypeScript with correct manifest data
- [x] `generated-solution-routes.tsx` produces working dynamic imports
- [x] `generated-solution-dashboard-widgets.tsx` produces working conditional widget imports
- [x] Prebuild hook runs the generator before `next build`
- [x] `apps/web` builds successfully with the generated files

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Conventions: T01 solution UI package conventions
