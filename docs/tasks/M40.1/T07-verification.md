# T07: Verification — Lint, Typecheck, and Visual Proof

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T01, T02, T03, T04, T05, T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T07 - verification lint typecheck visual proof`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

Final verification pass across all M40.1 changes. Run lint, typecheck, tests, and capture visual proof for each touched page at mobile and desktop breakpoints.

## Subtasks

- [ ] **Lint**: `pnpm -C apps/web lint` passes clean
- [ ] **Typecheck**: `pnpm -C apps/web check-types` passes clean
- [ ] **Tests**: `pnpm -C apps/web test` passes (existing + any new tests from M40.1)
- [ ] **Visual proof — admin calls**: Screenshots at 375px and 1440px showing live tab, history tab, detail view
- [ ] **Visual proof — call replay**: Screenshots at 375px and 1440px showing timeline, transcript, inspector, player
- [ ] **Visual proof — tenant call-ops**: Screenshots at 375px and 1440px showing dashboard, history with pagination, alerts with bulk actions
- [ ] **No dummy/mock remnants**: Grep for `dummyNotice`, `downloadDummyFile` in calls page files — zero hits

## Verification Commands

```bash
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
grep -rn "dummyNotice\|downloadDummyFile" web/src/app/
```

## Acceptance Criteria

- [ ] All verification commands pass
- [ ] Visual proof captured for all 3 page groups (admin calls, call replay, tenant call-ops) at both breakpoints
- [ ] No dummy/mock code remains
- [ ] PROGRESS.md fully updated

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
