# T06: Context compressor (4-phase algorithm)

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T05

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T06 - {short description}`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M33-grove-autonomous-runtime`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M33/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M33/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Implement the 4-phase context compression algorithm adapted from the Hermes agent design. Compression triggers when the conversation message list exceeds a token threshold (configurable, default 50% of model context window). The algorithm prunes old tool results, determines head/tail protection boundaries, summarizes the middle section via an auxiliary LLM call, and assembles a clean compressed message list. Supports iterative re-compression: on subsequent triggers, the existing summary is updated rather than recreated from scratch.

This is a pure algorithm module with no side effects beyond one LLM call (phase 3). The `AutonomousExecutor` (T05) calls this via its compression hook. The compressor takes a message list in, returns a shorter message list out.

## Subtasks

- [ ] **Create ContextCompressor class**: Constructor accepts `CompressionConfig` (from T02). Store config values as instance attributes. Initialize `_compression_count: int = 0` and `_previous_summary: str | None = None` for iterative tracking.
- [ ] **Implement `should_compress(messages: list[dict[str, Any]]) -> bool`**: Estimate token count of messages using rough heuristic. Return `True` if estimated tokens exceed `threshold_tokens`. Threshold is passed to constructor or derived from config (`threshold_percent * context_window_tokens`; default context_window_tokens parameter with fallback to 128_000).
- [ ] **Implement `estimate_tokens_rough(messages: list[dict[str, Any]]) -> int`**: Sum `len(str(m.get("content", ""))) / 4 + 10` for each message. Add `len(str(m.get("tool_calls", ""))) / 4` for messages with tool calls. Return integer. This is a fast O(n) heuristic, not tiktoken.
- [ ] **Phase 1 -- Prune (`_phase_prune`)**: Walk messages backward. For any message with `role == "tool"` whose index is outside the protected tail (last `protect_last_n` messages): if `len(content) > 200`, replace content with `"[Old tool output cleared]"`. Return modified message list (shallow copy, replace in-place on copies). This is pure string manipulation, no LLM call, O(n).
- [ ] **Phase 2 -- Boundaries (`_phase_boundaries`)**: Determine head and tail slices. Head: first `protect_first_n` messages (always includes system prompt). Tail: last N messages where N is determined by token budget -- walk backward from end, accumulating tokens until `tail_token_budget` is reached or `protect_last_n` messages are included (whichever is larger). Middle: everything between head and tail. Call `_align_boundary_forward(messages, index)` and `_align_boundary_backward(messages, index)` to avoid splitting tool_call/tool_result pairs. Return `(head_end_idx, tail_start_idx)`.
- [ ] **Boundary alignment (`_align_boundary_forward`, `_align_boundary_backward`)**: A tool_call message (has `tool_calls` field) and its corresponding tool result messages (next N messages with `role == "tool"`) must stay together. `_align_boundary_forward(messages, idx)`: if message at `idx` is a tool result, scan backward to find the tool_call message and return that index. `_align_boundary_backward(messages, idx)`: if message at `idx` is an assistant with tool_calls, scan forward to find all tool results and return the index after the last one.
- [ ] **Phase 3 -- Summarize (`_phase_summarize`)**: Serialize middle messages into a structured text block. Call auxiliary LLM via `litellm.acompletion()` with a summary prompt template. Summary prompt requests 7 sections: Goal, Progress So Far, Key Decisions Made, Problems Encountered, Pending Tasks, Next Immediate Step, Critical Context. Token budget for summary: `max(2000, min(12000, int(middle_token_count * summary_ratio)))`. If this is a re-compression (`_compression_count > 0` and `_previous_summary` exists), use an update prompt instead: include previous summary and ask LLM to update it with new middle content. On LLM failure (exception), log warning and return empty string (proceed without summary, drop middle).
- [ ] **Summary serialization (`_serialize_for_summary`)**: For each middle message: include role, truncate tool call arguments to 500 chars, truncate tool result content to 3000 chars (1500 head + 1500 tail with `\n...[truncated]...\n` separator). Format as readable text, not JSON.
- [ ] **Phase 4 -- Assemble (`_phase_assemble`)**: Concatenate: head messages + summary injection message + tail messages. Summary injection message: `{"role": "assistant", "content": "## Session Summary\n\n{summary_text}"}`. Choose role to avoid consecutive same-role messages -- if head ends with assistant, use `"user"` role with prefix `"[System note: session summary]\n\n{summary_text}"`. Call `_sanitize_tool_pairs(assembled)` before returning.
- [ ] **Orphan sanitization (`_sanitize_tool_pairs`)**: After assembly, scan for: (1) tool result messages whose `tool_call_id` has no matching tool_call in any preceding assistant message -- remove these orphans. (2) Assistant messages with `tool_calls` where none of the tool_call_ids have a matching tool result following -- append stub tool results: `{"role": "tool", "tool_call_id": "{id}", "content": "[Result from previous context]"}`. Return cleaned list.
- [ ] **System prompt annotation**: On first compression only (`_compression_count == 0`), append `"\n\n[Note: earlier turns compacted by context compression]"` to the first message (system prompt). Do not re-append on subsequent compressions.
- [ ] **Implement `compress(messages: list[dict[str, Any]], on_chunk: Callable | None = None) -> list[dict[str, Any]]`**: Full pipeline: phase 1 (prune) -> phase 2 (boundaries) -> phase 3 (summarize middle) -> phase 4 (assemble). Increment `_compression_count`. Store summary in `_previous_summary`. If `on_chunk` provided, emit `StreamChunk(type="autonomous.compression", content=json.dumps({"phase": "complete", "tokens_before": N, "tokens_after": M, "summary_preview": first_200_chars}))`. Return compressed message list.
- [ ] **Unit tests for each phase + full pipeline**: Test phase 1 (prune replaces old tool results), phase 2 (boundaries respect tool pairs), phase 3 (summary generation with mocked LLM, fallback on failure), phase 4 (assembly, orphan sanitization), full pipeline end-to-end, iterative re-compression, should_compress threshold logic.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/compressor.py` | Create | ContextCompressor class (~400-500 lines) |
| `packages/grove/tests/unit/runtime/test_compressor.py` | Create | Unit tests for each phase and full pipeline |

## Implementation Notes

- **Reference implementation:** The Hermes context compressor is at `~/simonas/projects/oss/hermes-agent/agent/context_compressor.py` (677 lines). Study its structure but adapt to Grove's conventions. The Hermes version uses Claude-specific formatting; this version must be provider-agnostic (using litellm).
- **No side effects except phase 3 LLM call.** Phases 1, 2, 4 are pure functions. Phase 3 makes one `litellm.acompletion()` call to a cheap/fast model (e.g., `gpt-4o-mini` or `claude-3-haiku`). The model for summarization should be configurable (add `summary_model: str = "gpt-4o-mini"` to constructor or config).
- **Phase ordering matters.** Prune first (reduces noise before boundary calculation), then boundaries (on pruned list), then summarize (only the middle), then assemble (clean final list).
- **Boundary alignment is critical.** Splitting a tool_call from its tool_result creates invalid message sequences that LLM APIs reject. Both `_align_boundary_forward` and `_align_boundary_backward` exist to prevent this.
- **Tool pair detection:** A tool_call message has `tool_calls: list[dict]` field. Each tool_call has an `id` field. Tool result messages have `role == "tool"` and `tool_call_id` matching one of those ids. Multiple tool results can follow a single tool_call message (parallel tool calls).
- **Summary prompt template** (phase 3):
  ```
  Summarize the following conversation segment concisely. Focus on:
  1. **Goal**: What is the agent trying to accomplish?
  2. **Progress**: What has been done so far?
  3. **Key Decisions**: What choices were made and why?
  4. **Problems**: What issues were encountered?
  5. **Pending**: What remains to be done?
  6. **Next Step**: What should happen immediately next?
  7. **Critical Context**: Any facts, IDs, paths, or values that must not be lost.

  Keep the summary under {budget} tokens. Be factual, not narrative.
  ```
- **Update prompt for re-compression** (when `_previous_summary` exists):
  ```
  Update this existing session summary with new conversation turns.
  Merge, don't append. Remove stale information. Keep under {budget} tokens.

  EXISTING SUMMARY:
  {_previous_summary}

  NEW TURNS:
  {middle_serialized}
  ```
- **Message copying:** Use shallow copies (`[{**m} for m in messages]`) in phase 1 to avoid mutating the input list. Phases 2-4 work on the copies.
- **Keep under 500 lines.** Extract serialization and sanitization into private methods. Each phase should be a clearly named private method.
- **Async:** Phase 3 (`_phase_summarize`) is async (LLM call). Other phases are sync but the public `compress()` method is async to accommodate phase 3.

## Acceptance Criteria

- [ ] Phase 1 prunes tool result content > 200 chars outside protected tail (replaces with placeholder)
- [ ] Phase 2 protects first N and last N messages, aligns boundaries around tool pairs
- [ ] Phase 3 generates structured summary via auxiliary LLM within token budget
- [ ] Phase 3 gracefully handles LLM failure (logs warning, proceeds without summary)
- [ ] Phase 4 assembles head + summary + tail with no orphaned tool pairs
- [ ] Iterative compression updates previous summary instead of recreating
- [ ] `should_compress()` returns `True` only when estimated tokens exceed threshold
- [ ] `should_compress()` returns `False` for small message lists
- [ ] System prompt annotated with compression note on first compression only
- [ ] Summary injection avoids consecutive same-role messages
- [ ] Orphaned tool results removed, orphaned tool calls get stub results
- [ ] File stays under 500 lines
- [ ] `pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `ruff check` and `ruff format --check` pass
- [ ] Unit tests for each phase independently + full pipeline pass

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Executor from T05: `packages/grove/src/grove/runtime/autonomous.py`
- Config from T02: `packages/grove/src/grove/config/schema.py` (CompressionConfig)
- Reference implementation: `~/simonas/projects/oss/hermes-agent/agent/context_compressor.py`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
