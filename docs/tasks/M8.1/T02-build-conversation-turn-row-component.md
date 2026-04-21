# T02: Build ConversationTurnRow Component with Inline Latency Bars

> **Milestone**: M8.1-voice-turn-latency-observability
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Commit message format: `feat: M8.1 T02 - build conversation turn row component`

2. **One Milestone = One PR**
   - PR branch: `feat/M8.1-voice-turn-latency-observability`

3. **Follow CLAUDE.md**
   - Read `wiki/design-docs/react-best-practices.md` before writing React code
   - Read `AGENTS.md` for repository guidelines

4. **Before Starting This Task**
   - Verify T01 is completed
   - Read the milestone document for full context

5. **After Completing This Task**
   - Update `docs/tasks/M8.1/PROGRESS.md`

---

## Description

Build a unified conversation turn row component that renders transcript text + inline latency bar + tool executions + interruption markers in a single card. Each turn row is a self-contained unit that replaces the old separate transcript items + separate waterfall bars with one merged representation. Supports click-to-expand for full pipeline breakdown.

## Visual Design

```text
Collapsed (default):
┌──────────────────────────────────────────────────────────────────────┐
│ Turn 3 · 12:04:33 · agent                               ⚠  480ms  │
│ "I can help you reschedule. Let me check available times."          │
│ ├─STT──┤├────────LLM────────┤├TTS┤├sp┤                             │
│  └─ 🔧 check_availability   340ms  ✓                               │
└──────────────────────────────────────────────────────────────────────┘

Expanded (click):
┌──────────────────────────────────────────────────────────────────────┐
│ Turn 3 · 12:04:33 · agent                               ⚠  480ms  │
│ "I can help you reschedule. Let me check available times."          │
│ ├─STT──┤├────────LLM────────┤├TTS┤├sp┤                             │
│                                                                      │
│  Pipeline                                                       ms  │
│  STT finalize    ████████                                   68ms   │
│  LLM first token ██████████████████████████████████        325ms   │
│  TTS first byte  ██████                                     52ms   │
│  Pre-speech gap  ████                                       35ms   │
│  ────────────────────────────────────────────────────────────────── │
│  Felt latency (eot → agent speak)                         480ms   │
│                                                                      │
│  Timeline                                                           │
│  User spoke       0ms ═══════════════════════════════ 1,200ms      │
│  STT finalized                                        1,268ms      │
│  LLM started                                          1,280ms      │
│  LLM first token                                      1,605ms      │
│  TTS first byte                                       1,628ms      │
│  Agent spoke      1,680ms ═══════════════════════════ 2,400ms      │
│                                                                      │
│  🔧 check_availability                                340ms  ✓     │
└──────────────────────────────────────────────────────────────────────┘

Interrupted:
┌──────────────────────────────────────────────────────────────────────┐
│ Turn 4 · 12:04:36 · caller                            ⚡    150ms  │
│ "Thursday works, 10 o'clock please"                                 │
│ ├STT┤├─LLM─┤├T┤├spk┤  120ms overlap                               │
└──────────────────────────────────────────────────────────────────────┘

Live (in progress):
┌──────────────────────────────────────────────────────────────────────┐
│ Turn 7 · 12:04:42 · agent                                    ●    │
│ "You're welcome! Have a great d..."                                 │
│ ├─STT─┤├──LLM──┤├─T ●   (in progress)                              │
└──────────────────────────────────────────────────────────────────────┘

Failed tool:
┌──────────────────────────────────────────────────────────────────────┐
│ Turn 6 · 12:04:40 · agent                                ⚠  520ms │
│ "I'm sorry, I couldn't complete the booking."                       │
│ ├─STT─┤├───────LLM────────┤├──TTS──┤├─speak─┤                      │
│  └─ 🔧 book_appointment     450ms  ✗ "timeout"                     │
└──────────────────────────────────────────────────────────────────────┘
```

## Subtasks

- [x] **Define ConversationTurnRow props**: `turn: LiveCallTurnLatency`, `transcript: { speaker: string; text: string; timestamp: string } | null`, `maxEotMs: number` (for normalizing bar widths across all turns), `expanded: boolean`, `onToggleExpand: () => void`, `isLive?: boolean`, `slowThresholdMs?: number` (default 500)
- [x] **Build collapsed state**: Turn header (index, timestamp, speaker, felt latency), transcript text, inline latency bar (4 color-coded segments), tool executions, interruption marker
- [x] **Build latency bar**: Stacked horizontal segments for `stt_finalize_delay_ms` (blue-500), `llm_ttft_ms` (purple-500), `tts_ttfb_ms` (amber-500), remaining to `eot_to_agent_speak_ms` (green-500). Bar widths proportional to `maxEotMs`.
- [x] **Build expanded state**: Pipeline breakdown (4 metric rows with individual bars), timing milestones (absolute ms values), tool execution details
- [x] **Handle partial turns**: Live turns may have only STT but not yet LLM. Render available segments, pulse the right edge.
- [x] **Handle null latency**: If no latency data for a turn, show transcript only (no bar). This covers turns where latency collection failed.
- [x] **Add slow turn warning**: If `eot_to_agent_speak_ms > slowThresholdMs`, show amber warning icon
- [x] **Add interruption marker**: If `user_interrupted_agent === true`, show red flash icon + overlap duration
- [x] **Add tool execution items**: Nested below the latency bar. Show name, duration, status (✓/✗), error detail if failed.
- [x] **Write vitest tests**: Collapsed render, expanded render, partial turn, null latency, slow threshold, interruption, tools, failed tool, live pulsing

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/conversation-turn-row.tsx` | Create | Unified turn row component |
| `apps/web/tests/conversation-turn-row.test.tsx` | Create | Vitest tests |

## Implementation Notes

- Use Tailwind + inline `style={{ width: \`${pct}%\` }}` for bar widths. No charting library.
- Max bar width = 100%. Each turn's bars are proportional to `maxEotMs` passed from parent.
- The component is pure — no data fetching. Parent passes transcript + latency data.
- Follow M1 component patterns: named export, props interface, no barrel imports.
- Compact layout: collapsed row ~80-100px height. Expanded adds ~200px.
- Colors: blue-500 (STT), purple-500 (LLM), amber-500 (TTS), green-500 (speak), red-500 (interrupt), slate-500 (tools)

## Acceptance Criteria

- [x] Collapsed turn row shows transcript + latency bar + tools + interruption in one card
- [x] Expanded turn row shows full pipeline breakdown with individual bars + timing milestones
- [x] Bar widths are proportional, normalized across all turns via `maxEotMs`
- [x] Null latency gracefully falls back to transcript-only
- [x] Partial live turns show available bars with pulsing edge
- [x] Interrupted turns show red marker with overlap duration
- [x] Slow turns show warning indicator
- [x] Tool executions render inline with status
- [x] Vitest tests cover all visual states
- [x] `pnpm -C apps/web check-types && pnpm -C apps/web lint` passes

## References

- Milestone: [M8.1-voice-turn-latency-observability.md](../../milestones/M8.1-voice-turn-latency-observability.md)
- Design system: `apps/web/src/components/ui/` (Card, Badge patterns)
- Existing timeline item pattern: `apps/web/src/components/observability/evidence-rail.tsx`
