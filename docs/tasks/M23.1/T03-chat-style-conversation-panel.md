# T03: Redesign Conversation Panel as Chat-Style Layout

> **Milestone**: M23.1 — Test Workbench UX Hardening
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T02

---

## Description

The conversation panel currently renders turns as engineering data cards — each turn is a rectangular card with header metadata, transcript text, timing bar, and tool executions all at the same visual weight. It looks like a data table, not a conversation.

**Target:** A chat-style layout (like LangSmith's "Messages View") where user and assistant messages appear as left/right aligned bubbles. Engineering data (timing bars, tool executions, pipeline breakdown) appears as collapsible annotations beneath each bubble, not inline with the chat content.

**Design principles:**
- **Primary layer**: Chat bubbles showing who said what — scannable as a conversation
- **Secondary layer**: Timing bars, tool calls, latency badges — visible but subordinate
- **Tertiary layer**: Pipeline breakdown, timing milestones, interruption data — expandable on click

## Subtasks

- [x] **Chat bubble layout**: User messages left-aligned with subtle left border, assistant messages right-aligned with subtle right border (or indented). Different background tints for user vs assistant.
- [x] **Speaker label + timestamp**: Small header above each bubble: "Caller · 12:06:04" or "Agent · 12:06:04"
- [x] **Timing bar as annotation**: The `[STT][LLM][TTS][Speak]` bar appears below the bubble text in a muted, collapsible row — not inline with the transcript
- [x] **Tool calls as compact pills**: Tool executions shown as small inline badges below the timing bar, not as separate rows
- [x] **Felt latency badge**: Small badge in the bubble corner showing total latency (e.g., "2.3s")
- [x] **Error highlighting**: Failed tool calls and validation errors shown as red-tinted annotation beneath the bubble, not stretching the full card width
- [x] **Auto-scroll to latest**: During live calls, scroll to the newest message (like a real chat window)
- [x] **Preserve existing data**: All existing `ConversationTurnRow` data must remain accessible — this is a visual restructuring, not a data removal

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/test-workbench/chat-conversation.tsx` | Create | New chat-style conversation component for the test workbench |
| `apps/web/src/app/(deployment)/admin/agent-definitions/[id]/test/page.tsx` | Modify | Replace ConversationTurnRow loop with ChatConversation |

## Layout Change

The conversation panel now owns the **entire left column**. System events moved to the right column (T04). This gives the chat full vertical height — no more sharing with a 92-item event log.

## Implementation Notes

- Do NOT modify the existing `ConversationTurnRow` in `observability/` — it's used by the observability workspace which has a different audience (ops staff reviewing historical sessions). The test workbench audience is engineers who want a chat-like live view.
- Reuse the same `MergedConversationTurn` data shape — this is purely a presentation change.
- Consider using `useRef` + `scrollIntoView` for auto-scroll during live calls.

## Acceptance Criteria

- [x] User messages visually distinct from assistant messages (alignment, color, or border)
- [x] Transcript text is the primary visual element, not the timing data
- [x] Timing bars, tools, and pipeline breakdown are accessible but don't dominate the view
- [x] Live calls auto-scroll to the newest message
- [x] Error details (tool failures) are visible but don't stretch across the full width
- [x] Clicking a bubble/annotation still expands to show full pipeline breakdown

## Design Reference

LangSmith "Messages View": A chatbot-like UI showing inputs/outputs for each conversation turn in chronological order, with clickable links to full trace data.

Langfuse "Session Replay": Full conversation thread displayed as chat messages with metadata annotations.
