# T03: CRM Adapters for HubSpot and Salesforce

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens provider-adapter scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T03 - add crm adapters for hubspot and salesforce`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: add CRM provider adapters for HubSpot and Salesforce only if a new checklist row or real regression explicitly reopens this scope. Provider-specific execution must land through a Layer 3 provider pack, not as runtime code dumped into Platform Core.

## Subtasks

- [ ] Tighten the CRM contract if the current `LeadData` / `LeadDeliveryResult` shape is too weak for provider adapters
- [ ] Implement HubSpot CRM provider-pack execution with schema metadata and health check
- [ ] Implement Salesforce CRM provider-pack execution with schema metadata and health check
- [ ] Register both providers through the connector catalog / discovery contract
- [ ] Add focused unit/integration tests for delivery success and failure paths

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/contracts/crm.py` | Modify | Canonical CRM contract if needed |
| `packages/platform-core/src/platform_core/connectors/` | Modify | Connector governance/discovery contract only |
| `Layer 3 CRM provider pack package (path TBD)` | Create/Modify | Provider-specific HubSpot/Salesforce execution adapters |
| `packages/platform-core/tests/` | Modify/Create | CRM adapter tests |
| `apps/api/tests/integration/test_connectors.py` | Modify | Connector catalog/health coverage for CRM adapters |

## Implementation Notes

- Do not add new generic CRM adapters under `solutions/*`.
- Keep the provider payload shaping inside the adapters, driven by connector config and field mappings.
- If the shared CRM contract is too thin, fix it here instead of hiding provider-specific junk in `metadata`.
- Provider-specific runtime behavior belongs in a Layer 3 provider pack discovered by Layer 2 governance. Do not dump HubSpot/Salesforce execution into Platform Core.

## Acceptance Criteria

- [ ] HubSpot and Salesforce providers are registered through the connector catalog / discovery contract
- [ ] CRM provider execution lives in a Layer 3 provider pack, not as runtime code in Platform Core
- [ ] Health-check and delivery paths are test-covered

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
- Related: [ARCHITECTURE_GUARDS.md](../../milestones/ARCHITECTURE_GUARDS.md)
