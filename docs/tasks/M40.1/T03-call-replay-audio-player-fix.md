# T03: Call Replay — Fix Non-Functional Audio Player and Dummy Downloads

> **Milestone**: M40.1-calls-frontend-polish
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M40.1 T03 - fix call replay audio player and dummy downloads`

2. **One Milestone = One PR**
   - PR branch: `feat/M40.1-calls-frontend-polish`

3. **Follow CLAUDE.md and AGENTS.md**

4. **After Completing This Task**
   - Update `docs/tasks/M40.1/PROGRESS.md`

---

## Description

The call replay page (`/admin/calls/:callId`) has:
1. A non-functional `AudioPlayer` — play button is `disabled`, speed buttons are decorative, waveform is static math-based
2. Dummy `downloadDummyFile` and `dummyNotice` actions identical to the parent calls page
3. The API response includes a `recording` object — if it has a URL, the player should work

## Subtasks

- [ ] **Audit recording API**: Check `getAdminCallReplay` response shape — does `recording` include a playable URL?
- [ ] **If recording URL exists**: Wire `AudioPlayer` to an HTML5 `<audio>` element, sync playhead with real audio time, enable play/pause and speed controls
- [ ] **If no recording URL**: Show an honest "No recording available" state instead of a fake waveform
- [ ] **Replace dummy actions**: Same pattern as T03 — replace `dummyNotice` and `downloadDummyFile` with real or honestly-disabled patterns
- [ ] **Sync playhead across components**: When audio plays, the `Timeline`, `TranscriptPanel`, and `EventInspector` should track the real playhead position

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/(deployment)/admin/calls/[callId]/page.tsx` | Modify | Fix AudioPlayer, replace dummy actions |
| `web/src/lib/api/admin-calls.ts` | Read | Check recording response shape |

## Acceptance Criteria

- [ ] Audio player either plays real audio or shows "No recording available"
- [ ] No `dummyNotice()` or `downloadDummyFile()` functions remain
- [ ] Play/pause works when recording exists
- [ ] Speed control (0.5x, 1x, 1.5x, 2x) works when recording exists
- [ ] Playhead syncs across timeline, transcript, and event inspector
- [ ] `pnpm -C apps/web check-types` passes

## References

- Milestone: [M40.1-calls-frontend-polish.md](../../milestones/M40.1-calls-frontend-polish.md)
- Current page: `web/src/app/(deployment)/admin/calls/[callId]/page.tsx`
