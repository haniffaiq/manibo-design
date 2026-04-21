# T10: Translate Assistant Lifecycle Labels to Business Language

> **Milestone**: M20-deployment-console-ux
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M20 T10 - translate assistant lifecycle labels to business language`
2. **One Milestone = One PR** — branch: `feat/M20-deployment-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M20/PROGRESS.md` after completing

---

## Description

Replace internal lifecycle status labels with operator-facing language on the Assistants list and detail views.

Important: `AdminAgentDefinitionStatus` only has `draft | published | retired`. The review lifecycle (`in_review`) exists on individual versions, not on the definition summary. This task only translates what the list API actually returns. Version-level review labels belong in the detail page, which receives version-level status.

## Subtasks

- [x] **Update list-view display labels** in helpers:
  - `draft` → "Draft"
  - `published` → "Live"
  - `retired` → "Retired"
- [x] **Update summary counters**: "2 published" → "2 live"
- [x] **Update detail page** version status labels where version-level `in_review` status exists:
  - `in_review` → "Under review" (version-level only, not definition-level)
- [x] **Preserve** badge variant mapping (published/live=success, draft=warning, retired=neutral, in_review=warning on detail page)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/helpers.ts` | Modify | Update label functions |
| `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx` | Modify | Update summary text |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/page.tsx` | Modify | Update version labels |

## Acceptance Criteria

- [x] List view shows "Live" / "Draft" / "Retired" badges (no "Under review" — that status only exists on versions, not definitions)
- [x] Summary counters say "2 live · 1 draft · 0 retired"
- [x] Badge colors: live=success (green), draft=warning (amber), retired=neutral
- [x] Detail page shows "Under review" for versions with `in_review` status
- [x] E2E tests updated if they assert on old label text

## References

- Milestone: [completed/M20-deployment-console-ux.md](../../milestones/M20-deployment-console-ux.md)
