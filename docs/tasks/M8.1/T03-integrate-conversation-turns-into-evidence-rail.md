# T03: Integrate Unified Conversation Turns into EvidenceRail

> **Milestone**: M8.1-voice-turn-latency-observability
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M8.1 T03 - integrate conversation turns into evidence rail`

2. **One Milestone = One PR**
   - PR branch: `feat/M8.1-voice-turn-latency-observability`

3. **Follow CLAUDE.md**
   - Read `wiki/design-docs/react-best-practices.md`
   - Read the M1 components to understand the decomposition

4. **Before Starting This Task**
   - Verify T02 is completed
   - Read `apps/web/src/components/observability/evidence-rail.tsx` thoroughly
   - Read `apps/web/src/components/observability/use-case-detail.ts` for data flow

5. **After Completing This Task**
   - Update `docs/tasks/M8.1/PROGRESS.md`

---

## Description

Wire the ConversationTurnRow component (T02) into the EvidenceRail. Split the existing evidence timeline into two sections: (1) Conversation turns (transcript items merged with latency data) and (2) System events (routes, nodes, metrics, logs — non-turn items). Fetch latency data alongside existing case data and merge turns with transcript segments.

## Subtasks

- [x] **Fetch latency data in use-case-detail**: Add `getCallLatency()` call using `Promise.allSettled` alongside existing fetches. Store `turns[]` in case detail state.
- [x] **Match turns to transcript segments**: Build a merge function that pairs `LiveCallTurnLatency` entries with their corresponding `TranscriptSegment` by `turn_index` / sequence order. Handle mismatches gracefully (transcript without latency, latency without transcript).
- [x] **Split timeline into conversation + system events**: Filter `filteredTimeline` into conversation items (kind === "transcript") and system items (everything else). Render conversation section with ConversationTurnRow, system section with existing timeline items.
- [x] **Compute maxEotMs**: Derive the max `eot_to_agent_speak_ms` across all turns for normalizing bar widths.
- [x] **Add expand state management**: Track which turn index is expanded. Only one turn expanded at a time.
- [x] **Render Conversation section in EvidenceRail**: Place between AudioWaveformTimeline and system events. Section header: "Conversation · N turns" with legend.
- [x] **Render System Events section**: Section header: "System Events · N items". Uses existing timeline rendering.
- [x] **Handle voice vs non-voice cases**: Only show conversation turns section for `caseKind === "call_session"`. Non-voice cases render the existing unified timeline.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/evidence-rail.tsx` | Modify | Add conversation turns section, split timeline |
| `apps/web/src/components/observability/use-case-detail.ts` | Modify | Fetch latency data alongside case data |
| `apps/web/src/components/observability/domain-logic.ts` | Modify | Add merge function for turns + transcript |

## Implementation Notes

- Do NOT restructure the M1 component decomposition. Add to existing components, don't merge or split them.
- Latency fetch should happen in `use-case-detail.ts` alongside existing fetches using `Promise.allSettled`.
- The conversation section replaces transcript items in the timeline for voice calls. System events stay separate.
- For non-voice cases (workflow runs, channel sessions), the existing unified timeline renders unchanged.
- The legend (STT=blue, LLM=purple, TTS=amber, Speak=green) goes in the conversation section header.

## Acceptance Criteria

- [x] Conversation turns render in EvidenceRail for voice call sessions
- [x] Each turn shows transcript + latency bar (merged data)
- [x] System events (routes, nodes, metrics) render in separate section below
- [x] Non-voice cases render existing unified timeline unchanged
- [x] Latency data fetched without introducing async waterfall
- [x] Clicking a turn expands it inline
- [x] No visual regression on non-voice cases
- [x] `pnpm -C apps/web check-types && pnpm -C apps/web lint` passes

## References

- Milestone: [M8.1-voice-turn-latency-observability.md](../../milestones/M8.1-voice-turn-latency-observability.md)
- EvidenceRail: `apps/web/src/components/observability/evidence-rail.tsx`
- Data hook: `apps/web/src/components/observability/use-case-detail.ts`
- Domain logic: `apps/web/src/components/observability/domain-logic.ts`
