# T06: Slack Notification Adapter

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: M (2-4h)
> **Depends on**: T01, T04
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". There is no Slack-specific checklist row yet, so do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens provider-adapter scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T06 - add slack notification adapter`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: add outbound Slack notification delivery as a request/response adapter only if a new checklist row or real regression explicitly reopens this scope. This task is explicitly not Slack-interactive runtime work, and provider-specific execution must land through a Layer 3 provider pack.

## Subtasks

- [ ] Extend the notification contract if Slack outbound payload needs canonical support
- [ ] Implement Slack notification provider-pack execution with schema metadata and health check behavior
- [ ] Register the provider through the notification connector catalog / discovery contract
- [ ] Add focused tests for delivery success/failure and health checks

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/contracts/notifications.py` | Modify | Canonical outbound notification contract if needed for Slack |
| `packages/platform-core/src/platform_core/connectors/` | Modify | Connector governance/discovery contract only |
| `Layer 3 Slack notification provider pack package (path TBD)` | Create/Modify | Provider-specific Slack notification execution adapter |
| `packages/platform-core/tests/` | Modify/Create | Slack notification adapter tests |
| `apps/api/tests/integration/test_connectors.py` | Modify | Catalog/health coverage for Slack notification adapter |

## Implementation Notes

- Do not blur this with any future Slack-interactive runtime work.
- Keep the adapter outbound-only and boring.
- Provider-specific runtime behavior belongs in a Layer 3 provider pack discovered by Layer 2 governance. Do not dump Slack notification execution into Platform Core.

## Acceptance Criteria

- [ ] Slack notification delivery is available via the connector catalog / discovery contract
- [ ] Slack-notification scope is clearly separate from any future Slack-interactive scope
- [ ] Delivery and health-check paths are test-covered

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
- Related: Slack interactive remains out of backlog until a real requirement exists.
