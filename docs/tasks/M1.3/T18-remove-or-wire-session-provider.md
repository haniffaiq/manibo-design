# T18: Remove unused AgentSessionProvider or wire it

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

`AgentSessionProvider` is exported from `packages/ui` but nothing consumes it. `LiveAudioPlayer` receives `audioHostRef` as a direct prop instead of reading it from context. The provider also renders its own `<div ref={session.audioHostRef}>` which competes with the one in `LiveAudioPlayer`.

Either wire it in (wrap the live audio section, remove direct prop passing) or delete it entirely. Dead code in a shared package is worse than no code.

## Subtasks

- [x] **Decide**: is the context useful? Only if multiple children need access to the LiveKit session. Currently only `LiveAudioPlayer` and `AgentAudioVisualizerBar` consume the data, and they're siblings in the same parent — props are fine.
- [x] **If deleting**: remove `agent-session-provider.tsx`, remove exports from `index.ts` and `package.json`, remove the competing audio host div concern
- [x] **If wiring**: wrap the live section in the provider, convert `LiveAudioPlayer` to use `useAgentSession()`, remove the duplicate audio host div from either provider or player

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/components/agent-session-provider.tsx` | Delete or Modify | Remove dead code or wire context |
| `packages/ui/src/components/index.ts` | Modify | Remove exports if deleting |
| `packages/ui/package.json` | Modify | Remove export entry if deleting |

## Acceptance Criteria

- [x] No dead code in `packages/ui` — either the provider is consumed or it doesn't exist
- [x] No competing audio host divs
- [x] `packages/ui` build passes

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Provider: `packages/ui/src/components/agent-session-provider.tsx`
- Consumer: `apps/web/src/components/observability/live-audio-player.tsx`
