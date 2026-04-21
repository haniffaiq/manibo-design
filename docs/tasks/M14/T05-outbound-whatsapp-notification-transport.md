# T05: Outbound WhatsApp Notification Transport + Preferred-Channel Routing

> **Milestone**: M14-integration-depth
> **Status**: Planning
> **Estimate**: M (2-4h)
> **Depends on**: T01, T04
> **Checklist Rows**: Backlog owner for the unmet request/response notification transport row "WhatsApp sending: notifications (preferred channel for Swiss market)" plus downstream context from "Agent dispatches notifications to all affected parties (students, teacher, internal staff) after execution". Treat "SMS sending: notifications to contacts" and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)" as non-regression context only unless a new checklist row or regression explicitly reopens them. Keep this scoped to outbound transport/routing; do not turn it into interactive WhatsApp runtime work.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M14
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T05 - add outbound whatsapp notification transport`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Planning-only future hardening: add outbound WhatsApp notification transport and preferred-channel routing on the existing request/response notification lane once M14 is explicitly activated. This task closes the open WhatsApp transport gap without pretending SMS or delivery-confirmation work needs to be reopened. Interactive WhatsApp runtime stays in `M14.3`.

## Subtasks

- [ ] Add outbound WhatsApp notification transport on the existing request/response notification lane without inventing interactive runtime state
- [ ] Register the outbound WhatsApp transport in the notification connector catalog
- [ ] Keep preferred-channel routing honest for email/SMS/WhatsApp delivery policy
- [ ] Keep solution-specific workflow code using the shared connector-backed path
- [ ] Preserve existing SMS and delivery-confirmation behavior as non-regression context
- [ ] Add focused tests for outbound WhatsApp delivery success/failure and health checks

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/connectors/` | Modify | Connector governance/discovery contract only |
| `packages/platform-core/src/platform_core/contracts/notifications.py` | Modify | Preferred-channel/mobile-messaging contract shape if needed |
| `Layer 3 outbound WhatsApp provider pack package (path TBD)` | Create/Modify | Provider-specific outbound WhatsApp execution adapter |
| `solutions/notifications/src/notifications/activities.py` | Modify | Extend request/response notification dispatch to route outbound WhatsApp honestly |
| `solutions/notifications/tests/unit/test_notifications.py` | Modify | Outbound WhatsApp dispatch coverage |
| `solutions/notifications/tests/unit/test_notifications_config_adapter_selection.py` | Modify | Preferred-channel routing coverage |
| `packages/platform-core/tests/` | Modify/Create | Outbound WhatsApp transport tests |

## Implementation Notes

- This is generic provider transport, not channel runtime.
- Outbound WhatsApp here means request/response notification delivery only. Do not add inbound webhooks, session/thread ownership, provider account install/auth flows, or runtime lifecycle state; that belongs to `M14.3`.
- Existing SMS and delivery-confirmation rows are already repo-landed. Treat them as non-regression context here, not as reopened product scope, unless a real regression proves otherwise.
- Provider-specific outbound WhatsApp execution belongs in a Layer 3 provider pack discovered by Layer 2 governance. Do not dump provider runtime logic into Platform Core.

## Acceptance Criteria

- [ ] Shared request/response outbound WhatsApp notification transport exists
- [ ] Preferred-channel notification routing no longer has an unowned WhatsApp transport gap
- [ ] Existing SMS and delivery-confirmation behavior remain covered as non-regression context
- [ ] Outbound WhatsApp send and health paths are test-covered

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
- Related: [ARCHITECTURE_GUARDS.md](../../milestones/ARCHITECTURE_GUARDS.md)
- Related: [M14.3-whatsapp-interactive-runtime.md](../../milestones/M14.3-whatsapp-interactive-runtime.md)
