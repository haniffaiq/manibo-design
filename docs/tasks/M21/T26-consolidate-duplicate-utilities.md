# T26: Consolidate Duplicate Utilities into Shared call-ops-presenters

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T09
> **Priority**: 4 (quick win, reduces drift)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T26 - consolidate duplicate utilities into call-ops-presenters`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

The call-ops extraction (T03-T09) created duplicate utility functions across extracted components:
- `normalizeWorkflowLabel` in active-calls-table.tsx AND escalation-modal.tsx
- `formatDateTime` in multiple components
- `toErrorMessage` in 4+ files

Consolidate into `apps/web/src/lib/call-ops-presenters.ts` and import from there.

## Subtasks

- [x] **Create/extend `apps/web/src/lib/call-ops-presenters.ts`** — add `normalizeWorkflowLabel`, `formatDateTime`, `toErrorMessage`
- [x] **Update all call-ops components** — import from shared location, remove local copies
- [x] **Verify** no duplicate definitions remain

## Acceptance Criteria

- [x] Zero duplicate utility functions across call-ops components
- [x] `pnpm -C apps/web check-types` passes
