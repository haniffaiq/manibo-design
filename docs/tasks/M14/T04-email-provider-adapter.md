# T04: Email Provider Adapter

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: M (2-4h)
> **Depends on**: T01
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens provider-adapter scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T04 - add email provider adapter`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: add a governed outbound email provider path only if a new checklist row or real regression explicitly reopens this scope. Provider-specific execution must land through a Layer 3 provider pack rather than a built-in Platform Core adapter.

## Subtasks

- [ ] Tighten the notification contract if email needs richer canonical fields
- [ ] Implement email provider-pack execution with config schema and health check
- [ ] Register the provider through the notification connector catalog / discovery contract
- [ ] Add focused tests for send success/failure and health checks

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/contracts/notifications.py` | Modify | Canonical notification contract if needed for email |
| `packages/platform-core/src/platform_core/connectors/` | Modify | Connector governance/discovery contract only |
| `Layer 3 email provider pack package (path TBD)` | Create/Modify | Provider-specific email execution adapter |
| `packages/platform-core/tests/` | Modify/Create | Email adapter tests |
| `apps/api/tests/integration/test_connectors.py` | Modify | Catalog/health coverage for email adapter |

## Implementation Notes

- Start with one real provider path, not a fake abstraction forest.
- Keep provider-specific email payload details inside the adapter.
- Provider-specific runtime behavior belongs in a Layer 3 provider pack discovered by Layer 2 governance. Do not dump email execution into Platform Core.

## Acceptance Criteria

- [ ] A shared email provider path is available through the connector catalog / discovery contract
- [ ] Email send and health-check paths are test-covered
- [ ] Provider execution lives in a Layer 3 provider pack, not as runtime code in Platform Core

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
