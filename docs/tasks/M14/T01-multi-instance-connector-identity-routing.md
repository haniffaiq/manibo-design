# T01: Multi-Instance Connector Identity and Routing Contract

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens connector-governance scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T01 - add multi-instance connector identity and routing`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: replace the current one-connector-per-tenant/type/adapter model with a real multi-instance connector identity and routing contract only if a new checklist row or real regression justifies reopening connector governance. This is not part of the current M14 backlog.

## Subtasks

- [ ] Add a tenant-scoped connector identity/routing key that allows multiple instances of the same adapter per tenant
- [ ] Update the public connector schema and migration away from the current `(tenant_id, connector_type, adapter_name)` uniqueness model
- [ ] Replace adapter-name-only runtime resolution with connector-id or routing-key based resolution
- [ ] Update tenant solution config away from single `crm_adapter` / `notification_adapter` / `scheduling_adapter` selectors where needed
- [ ] Update every current adapter-selection consumer that still assumes one active connector or adapter-name-only lookup
- [ ] Migrate solution-config schema/API/UI surfaces that currently expose `crm_adapter` and `notification_adapter` as public selector fields
- [ ] Migrate lead-capture activity inputs and config-selection fallbacks that still resolve CRM adapters by raw adapter name
- [ ] Add migration and regression tests covering multi-instance lookup, backward compatibility, and existing public-ingress/solution flows
- [ ] Regenerate/check API inventory and confirm every changed route still has an honest consumer story

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/alembic_public/versions/` | Create | Migration for multi-instance connector identity/routing |
| `packages/platform-core/src/platform_core/connectors/models.py` | Modify | Connector identity/routing model |
| `packages/platform-core/src/platform_core/connectors/store.py` | Modify | Multi-instance lookup and persistence |
| `packages/platform-core/src/platform_core/connectors/service.py` | Modify | Routing-key or connector-id resolution path |
| `packages/platform-core/src/platform_core/solutions/config_model.py` | Modify | Replace single adapter-name selectors where needed |
| `packages/platform-core/src/platform_core/public_ingress/recommendations.py` | Modify | Stop scheduling lookup from relying on adapter-name-only or single-active fallback |
| `packages/platform-core/src/platform_core/public_ingress/delivery.py` | Modify | Stop lead-delivery connector selection from relying on stale adapter-name selectors |
| `solutions/lead_capture/src/lead_capture/models.py` | Modify | Replace raw adapter-name selector inputs where the public contract must move to connector identity or routing-key semantics |
| `solutions/lead_capture/src/lead_capture/activities.py` | Modify | Update lead-delivery connector selection away from adapter-name-only fallback |
| `solutions/appointment_booking/src/appointment_booking/api.py` | Modify | Update booking/admin connector selection surfaces to routing-key or connector-id aware resolution |
| `solutions/appointment_booking/src/appointment_booking/activities.py` | Modify | Update CRM/notification connector resolution used by workflows and activities |
| `solutions/appointment_booking/ui/src/api/clinic-bookings.ts` | Modify | Move clinic config client types and payload normalization away from raw adapter-name selectors |
| `solutions/appointment_booking/ui/src/components/clinic-config-editor.tsx` | Modify | Update clinic config UX for connector identity or routing-key selection |
| `solutions/notifications/src/notifications/activities.py` | Modify | Update notification dispatch away from adapter-name-only fallback |
| `solutions/schedule_management/src/schedule_management/activities.py` | Modify | Update scheduling connector resolution used by recommendations and schedule workflows |
| `packages/platform-core/tests/integration/test_connector_registry_and_health.py` | Modify | Multi-instance connector regression coverage |
| `packages/platform-core/tests/unit/test_connectors/` | Modify/Create | Store/service lookup tests |
| `packages/platform-core/tests/unit/test_public_ingress/` | Modify/Create | Recommendation and delivery regression coverage for multi-instance routing |
| `apps/api/tests/integration/test_solutions_api.py` | Modify | Solution-config schema/update regression coverage for connector identity migration |
| `solutions/lead_capture/tests/unit/test_lead_capture_config_adapter_selection.py` | Modify | Lead-capture selector migration coverage |
| `solutions/appointment_booking/tests/integration/test_post_call_activities.py` | Modify | Booking activity regression coverage for migrated selector behavior |
| `solutions/*/tests/` | Modify/Create | Booking/notification/schedule regression coverage for migrated selector behavior |

## Implementation Notes

- The current uniqueness constraint in `20260224_092000_connector_registry_and_health.py` is the core blocker.
- Keep this task focused on connector identity/routing. Do not sneak field-mapping or provider payload logic into it.
- Backward compatibility matters; existing tenants configured with adapter-name selectors must not be silently broken.
- Audit the live selector callers before changing the contract; public-ingress recommendation/delivery, lead-capture workflows, appointment-booking config surfaces, and solution activities already resolve connectors outside the connector store/service layer.
- Do not land backend store changes while leaving tenant config schema/UI and lead-capture activity inputs on raw adapter-name selectors; that split contract is a regression, not progress.
- If this task touches any `src/` paths, the eventual PR must satisfy the OTLP evidence gate captured in `T09`; do not mark it done with tests only.

## Acceptance Criteria

- [ ] A tenant can persist multiple connector instances for the same `connector_type + adapter_name`
- [ ] Runtime resolution is no longer limited to adapter-name-only lookup
- [ ] Existing configured tenants still resolve or fail with an explicit migration path
- [ ] Public-ingress recommendation/delivery flows no longer rely on single-active or adapter-name-only selection
- [ ] Lead-capture, appointment-booking config schema/UI, notifications, and schedule-management flows are covered by regression tests for the new routing contract
- [ ] Connector store/service tests cover multi-instance routing
- [ ] API inventory is regenerated/checked and any changed consumer contract is explicitly accounted for

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
- Related: [M14.1-channel-runtime-foundations.md](../../milestones/M14.1-channel-runtime-foundations.md)
