# T01: Admin Calls — Replace Dummy Actions with Honest States

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T01 - replace admin calls dummy actions with honest states`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

The admin calls page (`/admin/calls`) has multiple dummy/fake action implementations:
- `dummyNotice()` — shows a fake toast notification via DOM manipulation
- `downloadDummyFile()` — generates and downloads a fake file
- `exportCallsCsv()` — exports hardcoded fake CSV data
- `exportTranscriptTxt()` — exports a hardcoded fake transcript
- `downloadDummyRecording()` — shows a fake "download started" notice

Replace all of these with either real API integrations (using existing API clients) or honest disabled/unavailable states.

## Subtasks

- [ ] **Audit existing API clients**: Check `@/lib/api/admin-calls` for export, transcript download, and recording download endpoints
- [ ] **Replace `exportCallsCsv`**: If export API exists, wire it. Otherwise, implement client-side CSV from the actual loaded call data (not hardcoded rows)
- [ ] **Replace `exportTranscriptTxt`**: If transcript API exists, wire it. Otherwise, disable the button with "Transcript export not available"
- [ ] **Replace `downloadDummyRecording`**: If recording URL API exists, wire it. Otherwise, disable/hide the button
- [ ] **Replace `dummyNotice`**: Use a proper toast/notice pattern (existing `useNotice` hook or `StatusMessage` component)
- [ ] **Remove all `dummyNotice` and `downloadDummyFile` helper functions** from the page file

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/(deployment)/admin/calls/page.tsx` | Modify | Replace all dummy actions, remove helper functions |
| `web/src/lib/api/admin-calls.ts` | Modify (if needed) | Wire real endpoints if they exist |

## Acceptance Criteria

- [ ] No `dummyNotice()` or `downloadDummyFile()` functions remain
- [ ] No hardcoded fake transcript or recording content
- [ ] CSV export uses real loaded data or is honestly disabled
- [ ] Toast notifications use a proper React pattern (not DOM manipulation)
- [ ] `pnpm -C apps/web check-types` passes

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- Current dummy functions: `web/src/app/(deployment)/admin/calls/page.tsx:26-56`
