# T04: Add Live Turn Latency Polling Hook and Wire Live Updates

> **Milestone**: M8.1-voice-turn-latency-observability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M8.1 T04 - add live turn latency polling and wire updates`

2. **One Milestone = One PR**
   - PR branch: `feat/M8.1-voice-turn-latency-observability`

3. **Follow CLAUDE.md**
   - Read `wiki/design-docs/react-best-practices.md` (SWR not useEffect+fetch)

4. **Before Starting This Task**
   - Verify T01 is completed
   - Read `apps/web/src/components/observability/use-live-case-stream.ts`
   - Read `apps/web/src/components/observability/use-live-case-session.ts`

5. **After Completing This Task**
   - Update `docs/tasks/M8.1/PROGRESS.md`

---

## Description

Create a SWR hook that polls `GET /calls/{call_id}/latency` during live calls, and wire it into the EvidenceRail so conversation turns update in real-time. New turns appear at the bottom with a fade-in animation. Partial turns (in-progress) show with pulsing indicators.

## Subtasks

- [x] **Create `useCallLatency` hook**: SWR with `refreshInterval: 3000` when `isLive === true`, no polling otherwise. Props: `callId: string | null`, `isLive: boolean`. Returns `{ turns, summaries, stack, loading, error }`.
- [x] **Handle live-to-historical transition**: When `isLive` goes false, do one final SWR revalidation to get complete finalized data.
- [x] **Wire into use-case-detail or use-live-case-session**: Consume the hook in the appropriate orchestrator. Pass live turns to EvidenceRail.
- [x] **Animate new turn arrival**: When `turns.length` increases, latest turn gets opacity fade-in. No complex animations.
- [x] **Pass `isLive` to ConversationTurnRow**: Last turn shows pulsing indicator when live.
- [x] **Write vitest tests**: Polling behavior, live transition, null callId, error handling.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/realtime/use-call-latency.ts` | Create | SWR polling hook |
| `apps/web/src/components/observability/use-case-detail.ts` | Modify | Wire live latency data |
| `apps/web/tests/use-call-latency.test.ts` | Create | Vitest tests |

## Implementation Notes

- Use SWR `useSWR` with conditional fetching (`callId ? key : null`).
- Do NOT use `useEffect` + `fetch` — banned in codebase.
- Place in `apps/web/src/lib/realtime/` alongside existing voice control plane hooks.
- 3s polling is sufficient — turn latency updates every ~2-5s during a call.

## Acceptance Criteria

- [x] Hook polls every 3s when `isLive === true`
- [x] Stops polling when `isLive === false`
- [x] Final revalidation on live-to-historical transition
- [x] New turns animate in with fade
- [x] Last live turn shows pulsing indicator
- [x] No useEffect+fetch anti-pattern
- [x] `pnpm -C apps/web check-types && pnpm -C apps/web lint` passes

## References

- Milestone: [M8.1-voice-turn-latency-observability.md](../../milestones/M8.1-voice-turn-latency-observability.md)
- Fetch function: `apps/web/src/lib/api/call-observability.ts:143-147` (getCallLatency)
- Existing live hooks: `apps/web/src/lib/realtime/use-voice-call-transcript-feed.ts`
- SWR pattern: `wiki/design-docs/react-best-practices.md`
