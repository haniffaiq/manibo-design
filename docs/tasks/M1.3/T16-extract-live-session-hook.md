# T16: Extract useLiveCaseSession composition hook from workspace

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T14, T15

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

`observability-workspace.tsx` has accumulated too much live-session orchestration: `useLiveCaseStream`, `useLiveKitObserver`, transition effect, metrics mapping, `isLive` / `isVoiceCase` derivation. Every future live feature (chat SSE, more LiveKit controls) will add more hooks here.

Extract a single `useLiveCaseSession` composition hook that owns:
- SSE streaming (`useLiveCaseStream`)
- LiveKit observer (`useLiveKitObserver`)
- Live/voice detection (`isLive`, `isVoiceCase`)
- Transition effect (SSE end → SWR revalidation)
- Metrics placeholder mapping

The workspace calls it once and destructures the result.

## Subtasks

- [x] **Create `use-live-case-session.ts`**: compose `useLiveCaseStream` + `useLiveKitObserver`, derive `isLive`, `isVoiceCase`, handle transition
- [x] **Move metrics placeholder logic**: `isLive ? metrics.map(m => ({...m, value: "--"})) : metrics` moves into the hook
- [x] **Simplify workspace**: replace 15+ lines of hook calls + derivations with one `useLiveCaseSession(detailSummary)` call
- [x] **Verify no behavioral change**: lint, type-check, E2E tests still pass

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/use-live-case-session.ts` | Create | Composition hook owning all live state |
| `apps/web/src/components/observability-workspace.tsx` | Modify | Replace inline hook calls with single `useLiveCaseSession` |

## Implementation Notes

The hook should accept `detailSummary: ObservabilityRunSummary | null` and `detailMutate: () => Promise<...>` and return everything the workspace needs: `isLive`, `isVoiceCase`, `liveStream`, `liveKit`, `displayMetrics`.

Do NOT move the SSE or LiveKit hooks themselves — just compose them. The hook is a coordination layer, not a replacement.

## Acceptance Criteria

- [x] `observability-workspace.tsx` has zero direct references to `useLiveCaseStream` or `useLiveKitObserver`
- [x] All live behavior unchanged (E2E tests pass)
- [x] Workspace function body is shorter by ~15 lines
- [x] New hook is under 60 lines

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Current wiring: `apps/web/src/components/observability-workspace.tsx:43-55`
