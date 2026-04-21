# T07: Webhook Delivery Alignment on Shared Primitive

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens this scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T07 - align webhook delivery on shared primitive`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: formalize outbound webhook delivery inside the integration hub by reusing the existing `platform.deliver_outgoing_webhook` Temporal activity only if a new checklist row or real regression explicitly reopens this scope. This is not part of the current M14 backlog.

## Subtasks

- [ ] Reuse the existing Temporal webhook delivery primitive instead of building a new workflow action
- [ ] Wire the integration-hub surface to the existing webhook delivery path where needed
- [ ] Add tests proving connector/integration-level webhook delivery uses the shared primitive
- [ ] Update docs/comments so the Grove misplacement does not come back

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/temporal-worker/src/temporal_worker/activities/outgoing_webhooks.py` | Verify/Modify | Existing webhook delivery primitive |
| `packages/platform-core/` | Modify | Integration-hub entry point for outbound webhook delivery |
| `apps/temporal-worker/tests/integration/test_outgoing_webhooks.py` | Modify | Integration proof for reused primitive |
| `docs/milestones/M14-integration-depth.md` | Verify/Modify | Keep architecture wording aligned |

## Implementation Notes

- The primitive already exists. Reuse it.
- If this task starts growing into a second webhook subsystem, the design is wrong.
- Treat the existing primitive as baseline capability. The work here is connector-hub alignment and proof, not rebuilding webhook delivery.

## Acceptance Criteria

- [ ] Outbound webhook delivery in M14 uses the existing Temporal primitive
- [ ] No Grove `WorkflowAction` is introduced for webhook sending
- [ ] Integration tests prove the shared path is used

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
- Related: [ARCHITECTURE_GUARDS.md](../../milestones/ARCHITECTURE_GUARDS.md)
