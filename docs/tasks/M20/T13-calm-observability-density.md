# T13: Calm Observability Density

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T12

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T13 - calm observability density and evidence hierarchy`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Reduce visual density in the observability workspace. Add breathing room between sections, strengthen hierarchy between queue/summary/evidence, and make "What to do next" the most visually distinct block.

## Subtasks

- [x] **Increase gap** between case queue rows (from `gap-2` to `gap-3`)
- [x] **Add section labels** to right-rail blocks: "Case record", "What to do next", "Integrity gaps", "Related records", "Evidence rail"
- [x] **"What to do next" accent**: Left border in primary color (`border-l-2 border-[var(--color-primary-500)]`), subtle primary background tint
- [x] **Evidence rail hierarchy**: Primary evidence (transcript, events) full opacity. Raw payloads behind `<details>` disclosure
- [x] **Integrity gaps**: Amber dashed border treatment for missing evidence markers
- [x] **Verify** desktop and mobile rendering

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability-workspace.tsx` | Modify | Adjust spacing, hierarchy, and section treatments |

## Acceptance Criteria

- [x] "What to do next" block has a left accent border and background tint
- [x] Evidence rail items have clear vertical rhythm (no compressed stacking)
- [x] Raw payloads hidden behind disclosure
- [x] Integrity gaps show amber dashed treatment
- [x] Page is scannable at a glance without visual fatigue

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
