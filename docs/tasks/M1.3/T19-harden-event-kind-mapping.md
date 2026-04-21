# T19: Harden event kind/severity mapping

> **Milestone**: M1.3-obs-live-streaming
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:** See `docs/tasks/_templates/task-template.md` for full rules.

---

## Description

`opsEventKind` and `opsEventSeverity` in `live-event-mapper.ts` use `eventType.includes("tool")` which is fragile — would false-match hypothetical event types like `troubleshoot.run`. The backend event types have a known prefix structure (`tool.*`, `call.*`, `langgraph.route.*`). Use prefix checks or a lookup map.

## Subtasks

- [x] **Audit backend event types**: grep `apps/api` for `event_type` values to confirm the prefix convention
- [x] **Replace includes with startsWith**: `eventType.startsWith("tool.")` instead of `eventType.includes("tool")`
- [x] **Consider a lookup map**: for the known first segments, map to kind/severity directly. Fall through to `"log"` / `"info"` for unknown.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/observability/live-event-mapper.ts` | Modify | Replace `includes` with `startsWith` or prefix lookup |

## Implementation Notes

Known event type prefixes from backend (verify before implementing):
- `tool.*` → kind `"tool"`
- `langgraph.route.*` → kind `"route"`
- `langgraph.node.*` → kind `"node"`
- `call.escalation.*`, `call.manual_takeover*` → severity from suffix
- `llm.*` → kind `"log"`, severity `"info"`

## Acceptance Criteria

- [x] `opsEventKind` uses prefix matching, not substring matching
- [x] `opsEventSeverity` uses prefix matching for error/warning detection
- [x] Existing SSE event types still map correctly (verify with E2E test SSE mock data)

## References

- Milestone: [completed/M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Mapper: `apps/web/src/components/observability/live-event-mapper.ts:27-41`
- Backend events: `apps/api/src/platform_api/routes/calls.py` (ops stream)
