# T20: Realtime turn provider retry + Grove tool activity boundary

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - This task file represents exactly ONE atomic commit
   - Commit message format: `feat: M13 T20 - add realtime tool activity boundary`

2. **One Milestone = One PR**
   - This task stays on the active M13 branch
   - Do NOT create a separate PR for this task unless the human explicitly splits the milestone

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all Grove layer rules in `wiki/architecture/grove.md`

4. **Before Starting This Task**
   - Reproduce or inspect the latest local browser/phone-call failure
   - Confirm whether the failure is provider throttling, tool execution, or product flow state before editing code
   - Check `docs/tasks/M13/PROGRESS.md` for newer live-call notes

5. **Definition of Done**
   - Realtime voice turns survive transient provider throttles with bounded retry/backoff
   - Tool execution for voice turns can run through a Grove-owned Temporal activity boundary
   - Runtime events, transcript events, tool-call records, logs, metrics, and spans still land in the existing operator/debug surfaces
   - Tests cover production code paths only

---

## Description

The local live-call proof exposed two separate runtime problems that should not be mixed.

First, realtime LLM streaming can fail mid-turn with provider throttling such as Vertex `429` / `RESOURCE_EXHAUSTED`. The current behavior can surface a generic apology immediately. That is bad voice UX and weak observability.

Second, tool calls should not stay as opaque in-process side effects inside the LiveKit worker. They need a durable, observable activity boundary so tool failures, latency, retries, and side effects are visible in the same Temporal-backed runtime story as the rest of the call.

This task keeps the fast path simple: the voice turn still runs in the LiveKit worker process, but provider retry/backoff and tool execution get explicit production-grade boundaries.

```text
+------------------+      +-------------------+      +-------------------+
| STT transcript   | ---> | Grove executor    | ---> | TTS speech        |
+------------------+      | realtime turn     |      +-------------------+
                          |                   |
                          | LLM stream retry  |
                          | stays in-process  |
                          |                   |
                          | tool call request |
                          +---------+---------+
                                    |
                                    v
                          +-------------------+
                          | Grove Temporal    |
                          | tool workflow     |
                          +---------+---------+
                                    |
                                    v
                          +-------------------+
                          | grove.execute_tool|
                          | activity          |
                          +-------------------+
```

## Ownership Boundary

Grove owns the generic contract because tool execution is agent-core behavior, not platform business logic.

```text
+--------------------------+      +-----------------------------+
| packages/grove          | ---> | ToolExecutionWorkflow       |
|                          |      | grove.execute_tool activity |
| Owns types, contracts,   |      | retry/idempotency policy    |
| executor seam, metrics   |      | result envelope             |
+--------------------------+      +-----------------------------+
            ^
            |
+--------------------------+
| grove-voice-livekit      |
| Uses Grove as a library  |
| and waits for tool result|
+--------------------------+
            ^
            |
+--------------------------+
| apps/temporal-worker     |
| Registers/hosts Grove    |
| workflows + activities   |
| for this deployment only |
+--------------------------+
```

`apps/temporal-worker` may host and register the activity because it is the deployment's worker process. It must not own the generic tool-execution contract or accumulate business/tool orchestration logic.

## Subtasks

- [x] **Add bounded LLM retry/backoff**: retry retryable provider throttles before yielding fallback text, with clear limits and observability.
- [x] **Define Grove tool execution contract**: add typed input/output models for one tool invocation, including tenant/user/session context, tool arguments, result, tool-call record, emitted runtime events, and error envelope.
- [x] **Add executor backend seam**: let `AgentExecutor` execute tools through an injected backend while preserving the existing in-process implementation for contexts that do not configure Temporal.
- [x] **Add Grove Temporal tool workflow/activity**: define a Grove-owned one-shot workflow that runs one `grove.execute_tool` activity through the configured `ToolRegistry`.
- [x] **Wire voice runtime to Temporal-backed tool execution**: configure `grove-voice-livekit` to use the Temporal backend when the LiveKit worker has Temporal connectivity.
- [x] **Register in platform worker**: update `apps/temporal-worker` only to register the Grove workflow/activity and compose the deployment tool registry.
- [x] **Persist and surface evidence**: ensure tool activity timing, failures, runtime events, and transcript/tool-call records appear in existing live-call trace, conversation, runs, and ops stream surfaces.
- [x] **Add production-code tests**: cover Grove retry behavior, executor backend selection, tool workflow/activity behavior, voice runtime forwarding, and worker registration without testing helper scripts.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/llm_calls.py` | Modify | Add bounded retry/backoff for retryable provider throttling before fallback emission |
| `packages/grove/src/grove/runtime/executor.py` | Modify | Route tool execution through an injected backend seam |
| `packages/grove/src/grove/runtime/tool_execution.py` | Create | Define in-process and protocol-level tool execution backend contracts |
| `packages/grove/src/grove/temporal/tool_execution.py` | Create | Define Grove-owned tool execution workflow/activity types and activity implementation |
| `packages/grove/src/grove/temporal/names.py` | Modify | Add stable workflow/activity names for Grove tool execution |
| `packages/grove/src/grove/temporal/worker.py` | Modify | Register the Grove tool workflow/activity in Grove worker composition |
| `packages/grove-voice-livekit/src/grove_voice_livekit/temporal_tool_execution.py` | Create | Add the voice bridge client/backend that calls the Grove Temporal tool workflow |
| `packages/grove-voice-livekit/src/grove_voice_livekit/voice_job.py` | Modify | Inject Temporal-backed tool execution when available |
| `apps/temporal-worker/src/temporal_worker/worker.py` | Modify | Host/register the Grove tool workflow/activity for this deployment |
| `packages/grove/tests/unit/runtime/` | Modify/Create | Production-code tests for retry and executor backend behavior |
| `packages/grove/tests/unit/temporal/` | Modify/Create | Production-code tests for tool execution workflow/activity contract |
| `packages/grove-voice-livekit/tests/` | Modify/Create | Production-code tests that voice forwards tool results and runtime events |
| `apps/temporal-worker/tests/` | Modify/Create | Production-code registration/composition tests only if needed |
| `docs/tasks/M13/PROGRESS.md` | Modify | Record task status and live-call lessons |

## Implementation Notes

- Do not move the whole realtime turn into Temporal. The latency-sensitive STT -> LLM -> TTS loop stays in the LiveKit worker.
- Do not let `packages/grove/runtime/**` import `packages/grove/temporal/**`. The runtime layer receives a backend/protocol. Temporal-specific implementation lives outside the runtime layer.
- Do not put generic tool execution logic in `platform-core`, `apps/api`, or `apps/temporal-worker`. Those layers may compose or host Grove contracts, not own them.
- Do not retry an LLM stream after the first chunk has been yielded to TTS. Retrying after speech starts risks duplicate or contradictory audio.
- Treat `429`, `RESOURCE_EXHAUSTED`, provider rate-limit markers, and retryable transport errors as bounded-retry candidates. Authentication/config errors must fail fast.
- Tool activity retries must be conservative. The first implementation should use `maximum_attempts=1` for side-effecting tool calls unless the tool contract explicitly declares idempotency.
- Tool activity output must include runtime events emitted during execution because a live `runtime_event_sink` cannot be serialized into a Temporal activity.
- Tests belong to production packages (`packages/grove`, `packages/grove-voice-livekit`, `apps/temporal-worker`) and must not target helper scripts or local-only bootstrap utilities.

## Acceptance Criteria

- [x] A retryable provider throttle before any streamed output triggers bounded retry/backoff instead of immediate generic fallback.
- [x] A retryable provider throttle after streamed output has begun does not retry the stream and emits a clear failure event.
- [x] LLM retry attempts emit structured logs, spans, and a counter metric with model, provider, channel, attempt, and error type.
- [x] Grove defines the tool execution input/output envelope and stable Temporal names.
- [x] `AgentExecutor` can execute tools through an injected backend without knowing whether the backend is in-process or Temporal-backed.
- [x] Voice runtime uses Temporal-backed tool execution when configured and preserves in-process execution only for non-Temporal contexts.
- [x] `apps/temporal-worker` registers the Grove workflow/activity without owning business logic.
- [x] Tool-call latency, success/failure, arguments summary, result summary, and emitted runtime events are visible through the existing live-call evidence path.
- [x] Side-effecting tools are not auto-retried unless idempotency is explicitly modeled.
- [x] Tests cover production code paths only; no tests are added for helper scripts or local bootstrap scripts.

## Verification

- `uv run ruff check ...` on the touched Grove, voice, worker, and test files
- `uv run pyright ...` on the touched production files plus Grove/voice tests
- `uv run pytest packages/grove/tests/unit/runtime/test_llm_calls.py packages/grove/tests/unit/runtime/test_tool_execution_backend.py packages/grove/tests/unit/temporal/test_tool_execution.py packages/grove/tests/unit/architecture/test_temporal_naming.py packages/grove/tests/unit/architecture/test_import_boundaries.py -q --tb=short`
- `uv run pytest packages/grove-voice-livekit/tests/unit/test_temporal_tool_execution.py -q --tb=short`
- `uv run pytest apps/temporal-worker/tests/unit/test_worker_registration.py -q --tb=short`
- `uv run python tools/scripts/check_payload_types.py`
- `uv run python -c "import grove; import grove.temporal.tool_execution; import grove_voice_livekit.temporal_tool_execution; import temporal_worker.worker; print('imports ok')"`
- `git diff --check`

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T11-local-real-call-profile-and-pstn-proof.md](./T11-local-real-call-profile-and-pstn-proof.md)
- Related: [T13-runtime-settings-centralization-follow-on.md](./T13-runtime-settings-centralization-follow-on.md)
- Architecture: [grove.md](../../../wiki/architecture/grove.md)
- System: [voice.md](../../../wiki/systems/voice.md)
