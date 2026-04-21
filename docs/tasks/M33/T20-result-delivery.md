# T20: Result delivery

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T16

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T20 - {short description}`

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

Implement the pluggable result delivery mechanism for autonomous tasks. When an autonomous task completes, the `AutonomousTaskWorkflow` calls a `deliver_result` activity to send the result to the specified channel. This activity is a separate step from `execute_autonomous_task` for retry isolation — if delivery fails, the autonomous execution result is not lost (it remains in the Temporal workflow output).

**M33 v1 delivery channels:** `chat`, `voice`, `webhook`. SMS and email are out of scope — they require channel adapter infrastructure that lives in platform-core/solutions, not Grove.

**Pluggable design:** Define a `ResultDeliverer` protocol. Each channel implements it. The activity dispatches by channel name. Adding SMS/email later means implementing the protocol + registering the deliverer — no workflow/tool contract changes.

## Subtasks

- [ ] **Define `ResultDeliverer` protocol**: `class ResultDeliverer(Protocol): async def deliver(self, *, task_id: str, tenant_id: str, target: str, message: str) -> None: ...`. Each channel implements this. Place in `core/` or alongside delivery models.
- [ ] **Define `DeliveryConfig` model**: Pydantic model: `task_id` (str), `goal` (str), `delivery_channel` (`DeliveryChannel | None`), `delivery_target` (str | None), `tenant_id` (str).
- [ ] **Implement `deliver_result` activity**: Receives `AutonomousTaskOutput` + `DeliveryConfig`. Looks up `ResultDeliverer` by channel name from a registry (dict[DeliveryChannel, ResultDeliverer]). Calls `deliverer.deliver()`. Unknown channel: raise non-retryable error (fail-closed).
- [ ] **Format result message**: `"Task completed: {goal}\n\nResult:\n{response}\n\nDuration: {duration}s, {tool_calls_count} tool calls"`. Include `task_id` for traceability.
- [ ] **Chat deliverer**: Implements `ResultDeliverer`. Creates message via `ConversationStore.add_message()` + `pg_notify('grove_stream', ...)` for real-time SSE push. Uses assistant role.
- [ ] **Voice deliverer**: In M33 v1, voice is an alias for chat-thread delivery. Bootstrap registers the same `ChatResultDeliverer` under both `"chat"` and `"voice"` keys. The message goes to the originating call's chat thread. No separate voice deliverer class needed in v1.
- [ ] **Webhook deliverer**: Implements `ResultDeliverer`. POST to `delivery_target` URL with JSON body `{task_id, goal, response, duration_ms, tool_calls_count}`. Timeout 30s. Retry via Temporal on transient HTTP errors (5xx, timeout). Non-retryable on 4xx.
- [ ] **No delivery configured**: If `delivery_channel` is None, skip delivery silently. Result available via workflow output only.
- [ ] **Register deliverers in GroveActivityContext** (T17 extension): Add `result_deliverers: dict[str, ResultDeliverer]` field to `GroveActivityContext`. Bootstrap (T18) registers the same `ChatResultDeliverer` under both `"chat"` and `"voice"` keys (voice is an alias for chat-thread delivery in v1), plus `WebhookResultDeliverer` under `"webhook"`.
- [ ] **Handle delivery failures gracefully**: The activity uses Temporal's retry policy. If delivery fails after retries, log the error at ERROR level but do not mark the workflow as failed -- the autonomous execution succeeded, only delivery failed. Include the task_id and delivery_channel in error logs.
- [ ] **Register activity**: Ensure `deliver_result` is registered as a Temporal activity in the same pattern as `execute_autonomous_task` from T16. It runs on the `grove-agent` task queue.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/temporal/test_result_delivery.py`. Test: (a) chat delivery creates message + pg_notify, (b) voice delivery creates message in call chat thread, (c) webhook delivery POSTs to URL with correct body, (d) None delivery_channel skips silently, (e) unknown channel raises non-retryable error, (f) message formatting includes goal, response, duration, tool_calls_count, task_id, (g) idempotency: duplicate delivery with same task_id does not create duplicate message.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/temporal/autonomous_activities.py` | Modify | Add `deliver_result` activity implementation (~80 lines) |
| `packages/grove/tests/unit/temporal/test_result_delivery.py` | Create | Unit tests with mocked stores and channels (~120 lines) |

## Implementation Notes

- **Read `packages/grove/src/grove/temporal/activities.py` and `packages/grove/src/grove/temporal/workflow_activities.py` first.** Match the existing activity definition pattern: `@activity.defn`, function signature, how `GroveActivityContext` is accessed.
- **Read `packages/grove/src/grove/core/conversations.py` for `ConversationStore.add_message()` signature.** Match the message model and insertion pattern.
- **Pluggable via ResultDeliverer protocol.** The activity looks up a `ResultDeliverer` by channel name from `GroveActivityContext.result_deliverers`. Each deliverer implements `async def deliver(*, task_id, tenant_id, target, message) -> None`. Adding new channels (SMS, email) later means implementing the protocol and registering in bootstrap — no workflow/tool changes.
- **M33 v1 channels: chat, voice, webhook.** SMS and email are out of scope. Do NOT import or reference SMS/email adapters, SendMessageTool, or phone number validation in this file.
- **pg_notify for chat delivery:** After `ConversationStore.add_message()`, execute `SELECT pg_notify('grove_stream', $1)` with a JSON payload matching the existing SSE notification format. Grep for `pg_notify` in the codebase to find the exact pattern.
- **Delivery is a separate activity for retry isolation.** If webhook delivery fails (5xx, timeout), Temporal retries the `deliver_result` activity independently. The `execute_autonomous_task` activity does not re-run.
- **ConversationStore injection:** The activity accesses `ConversationStore` and `result_deliverers` from `GroveActivityContext` (T17).
- **Message role for chat/voice delivery:** Use assistant role. The message appears as if the agent sent it in the chat thread.
- **Delivery failure handling:** Transient (network timeout, 5xx): let Temporal retry. Permanent (chat_id not found, 4xx from webhook): catch, set delivery status to `"failed"`, include in workflow output, use `non_retryable_error_types`.
- **Delivery confirmation logging:** Log the delivery result: for chat log created message_id, for webhook log HTTP status, for voice log message_id.
- **Idempotency:** Use `task_id` as dedup key. For chat/voice delivery, check if a message with matching `task_id` metadata already exists before inserting. For webhook, accept potential duplicate POST.
- **Logging:** Use `grove.logger.create_logger()`. Log delivery start (INFO with channel and target), success (INFO), failure (ERROR with exception details).
- **No imports from `runtime/` in this module.** Activities in `temporal/` import from `core/`, `config/`, and `temporal/` only. Channel adapters and stores come via `GroveActivityContext`.

## Acceptance Criteria

- [ ] Completed autonomous task delivers result to specified channel
- [ ] Chat delivery creates message via `ConversationStore.add_message()` + `pg_notify` for real-time SSE push
- [ ] Voice delivery creates message in originating call's chat thread
- [ ] Webhook delivery POSTs to URL with correct JSON body and handles 4xx/5xx correctly
- [ ] Delivery dispatched via `ResultDeliverer` protocol from `GroveActivityContext.result_deliverers`
- [ ] Unknown channel raises non-retryable error (fail-closed)
- [ ] Delivery failures retry via Temporal activity retry policy (results not lost)
- [ ] No delivery configured (`delivery_channel` is None): result available via workflow output only, no error
- [ ] Result message includes goal, response summary, duration, tool_calls_count, and task_id
- [ ] `deliver_result` registered as Temporal activity on `grove-agent` task queue
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new/modified files
- [ ] Unit tests pass with mocked stores and channel adapters

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T16 (AutonomousTaskWorkflow + activities)
- Pattern reference: `packages/grove/src/grove/temporal/activities.py` (existing activity patterns)
- Pattern reference: `packages/grove/src/grove/temporal/workflow_activities.py` (activity registration)
- Pattern reference: `packages/grove/src/grove/core/conversations.py` (ConversationStore)
- Pattern reference: `packages/grove/src/grove/tools/system/send_message.py` (channel delivery)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
