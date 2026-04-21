# T25: Decompose SupportDrawer (588 lines) into Sub-Components

> **Milestone**: M21-operator-console-ux
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T07
> **Priority**: 3 (588 lines with mixed concerns)

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M21 T25 - decompose SupportDrawer into sub-components`
2. **One Milestone = One PR** — branch: `feat/M21-operator-console-ux`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M21/PROGRESS.md` after completing

---

## Description

T07 extracted SupportDrawer from call-ops as a proper slide-over, but at 588 lines it does its own SSE streaming, data fetching, 5 useMemo computations, and renders 7 content sections. It needs the same decomposition treatment the call-ops page got.

## Subtasks

- [x] **Extract SupportGuidanceSection** — live guidance banner + action buttons
- [x] **Extract SupportLatencyMetrics** — per-metric summary cards (llm_ttft, tts_ttfb, etc.)
- [x] **Extract SupportStackCards** — AI model / speech / voice provider identity cards
- [x] **Extract SupportAssistantPath** — node-by-node timing section
- [x] **Extract SupportReferences** — collapsible support reference IDs
- [x] **Rewrite SupportDrawer** as slide-over shell under 200 lines that composes sub-components
- [x] **Verify** call-ops E2E tests pass

## Acceptance Criteria

- [x] SupportDrawer is under 200 lines (slide-over shell + composition)
- [x] Each sub-component in `apps/web/src/components/call-ops/`
- [x] SSE streams stay in the drawer shell (sub-components receive data via props)
- [x] `pnpm -C apps/web check-types` passes
