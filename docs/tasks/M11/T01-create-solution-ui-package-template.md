# T01: Create Solution UI Package Template and Conventions

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T01 - create solution UI package template and conventions`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Define the canonical structure and conventions for solution UI packages. Each solution that ships frontend code gets a `ui/` directory inside its `solutions/<name>/` folder, published as `@solution/<name>-ui` in the pnpm workspace. This conventions doc is the single source of truth for all future solution UI packages.

## Subtasks

- [x] **Create conventions document** at `wiki/design-docs/solution-ui-package-conventions.md`
- [x] **Document package naming** — `@solution/{name}-ui` (e.g., `@solution/appointment-booking-ui`)
- [x] **Document directory structure** — `src/`, `manifest.ts`, `pages/`, `api/`, `widgets/`, `components/`
- [x] **Document package.json template** — exports map, peerDependencies on react, next, @grove/ui
- [x] **Document tsconfig.json template** — extends shared config, path aliases
- [x] **Document layering rules** — solution UI may import `@grove/ui` + shared types, never another solution UI

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/design-docs/solution-ui-package-conventions.md` | Create | Full conventions doc with templates and layering rules |

## Acceptance Criteria

- [x] Conventions doc exists at `wiki/design-docs/solution-ui-package-conventions.md`
- [x] Package naming convention documented (`@solution/{name}-ui`)
- [x] Directory structure template documented (`src/`, `manifest.ts`, `pages/`, `api/`, `widgets/`, `components/`)
- [x] `package.json` template documented with exports map and peerDependencies
- [x] `tsconfig.json` template documented
- [x] Layering rules documented (solution -> @grove/ui + shared types, never solution -> solution)

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
