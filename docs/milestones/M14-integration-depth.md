# M14: Integration Depth (Request/Response)

Status: planning
Created: 2026-03-20
Owner: Jakit
Branch: feat/M14-integration-depth
Stream: platform
Depends on: none
Reference: docs/requirements/checklist.md rows "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", "WhatsApp sending: notifications (preferred channel for Swiss market)", "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)", and "Agent dispatches notifications to all affected parties (students, teacher, internal staff) after execution"; docs/requirements/nfq.md section 7; docs/requirements/vox.md REQ-P03 and REQ-P05

## Goal

Deepen the request/response integration layer only where the current requirement contract still has an honest open gap. Right now that means outbound preferred-channel WhatsApp notification transport/routing on top of the existing webhook sender, lead delivery, and notification baseline. Broader connector-governance ideas such as multi-instance identity, field mapping, and a richer integrations wizard are parked future notes until a new checklist row or real regression justifies reopening that scope. Only true interactive channel runtime moves to the `M14.1`-`M14.3` lane.

## Checklist Rows

Dependency context / non-regression rows only:

- `Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)`
- `CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)`
- `Email sending: automated emails for follow-up sequences and notifications`
- `SMS sending: notifications to contacts`
- `WhatsApp sending: notifications (preferred channel for Swiss market)`
- `Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)`
- `Agent dispatches notifications to all affected parties (students, teacher, internal staff) after execution`
- There is no dedicated checklist row for Slack notification today; `T06` stays bounded by the generic tenant-configurable adapter row and must not claim new product scope beyond that.
- Outbound WhatsApp notification transport and preferred-channel routing remain request/response integration scope in `M14`; `M14.3` is reserved for future interactive WhatsApp runtime only.

## Existing Baseline

The repo already has working baseline primitives that M14 must reuse rather than rebuild:

- outbound webhook delivery via the shared Temporal activity
- lead delivery / CRM push paths already used by VOX/public-ingress flows
- notification delivery paths already used by existing solution code

M14 is the backlog owner for the unmet outbound preferred-channel notification transport/routing row already in the checklist. Broader connector-governance hardening stays parked as future notes until the active tracker explicitly schedules it and a new checklist row or regression makes it honest.

## Design Decisions

1. **Multi-instance connectors, not one adapter slot per tenant** -- runtime selection must support multiple configured instances of the same provider, chosen by connector identity or purpose.
2. **Mapping boundary is fixed** -- workflow/extraction maps source data into a canonical payload; connector config maps canonical payload into the provider API payload.
3. **Provider adapters follow a common protocol** -- each adapter implements a send/deliver interface; runtime selects by connector type and configured connector instance.
4. **Webhook sender reuses platform delivery infrastructure** -- do not register webhook sending as a Grove `WorkflowAction`; reuse the Platform Core / Temporal delivery primitive.
5. **Interactive channel runtimes are separate** -- website widget chat and WhatsApp conversations live under the future runtime track, not in this milestone. Any future Slack-interactive work stays unplanned until a real requirement exists.
6. **Integration setup wizard is a multi-step form** -- not a drag-and-drop builder; keeps UI simple.
7. **Provider-specific runtime behavior lives in Layer 3 provider packs** -- Platform Core owns governance/contracts/registry behavior; provider execution must not be dumped into Layer 2.
8. **Outbound WhatsApp notifications stay in the integration hub** -- preferred-channel notification delivery is request/response transport and routing scope for `M14`, not interactive-channel scope for `M14.3`.

## Terminology Lock

- **notification adapter** -- outbound/request-response provider integration. Examples: CRM push, email send, SMS send, Slack notification. Lives in M14.
- **interactive channel runtime** -- two-way conversational transport runtime. Examples: website widget chat, WhatsApp conversations, future Slack app/bot. Lives under the future runtime track (`M14.1-M14.3` today); future Slack interactive remains out of scope until a real requirement exists.
- **provider account/runtime** -- tenant-scoped installed provider state used by an interactive channel runtime. Examples: WhatsApp business account state, widget/site runtime state, future Slack app install state. Not an M14 connector record.

## Architecture Boundary

```text
+---------------------------------------------------+      +---------------------------------------------------+
| M14 INTEGRATION HUB                               |      | FUTURE CHANNEL RUNTIME                            |
|---------------------------------------------------|      |---------------------------------------------------|
| workflow/extraction                               |      | provider event                                    |
|   -> canonical payload                            |      |   -> provider account/runtime                     |
|      -> connector-specific mapping                |      |      -> session/thread routing                    |
|         -> provider API payload                   |      |         -> Grove / agent runtime                  |
|                                                   |      |            -> outbound response                   |
| Scope                                             |      |               -> provider send/delivery state     |
| - CRM adapters                                    |      |                                                   |
| - email adapters                                  |      | Scope                                             |
| - SMS adapters                                    |      | - website widget chat                             |
| - Slack notification adapter                      |      | - WhatsApp interactive                            |
| - webhook delivery primitive                      |      | - future Slack interactive                        |
| - health / test-send / governance                 |      |                                                   |
+-------------------------------+-------------------+      +-------------------------------+-------------------+
                                \\                                                  /
                                 \\                                                /
                                  \\                                              /
                                   v                                            v
+---------------------------------------------------------------------------------------------------------------+
| SHARED PRIMITIVES BOTH CAN REUSE                                                                             |
|---------------------------------------------------------------------------------------------------------------|
| - tenant isolation / RBAC                                                                                     |
| - SecretRef + secret providers                                                                                |
| - schema registry + JSON schema validation                                                                    |
| - audit events                                                                                                |
| - Temporal workflows/activities                                                                               |
| - health records / observability                                                                              |
| - provider descriptors/catalog metadata                                                                       |
| - canonical payload definitions                                                                               |
| - retry/error classification patterns                                                                         |
+---------------------------------------------------------------------------------------------------------------+
```

## Future Channel Runtime Track

Interactive runtime work is grouped separately so M14 stays request/response-only:

- [M14.1: Channel Runtime Foundations](M14.1-channel-runtime-foundations.md)
- [M14.2: Web Chat Runtime Operations](M14.2-web-chat-runtime-operations.md)
- [M14.3: WhatsApp Interactive Runtime](M14.3-whatsapp-interactive-runtime.md)
- Future Slack-interactive work remains an architecture note only until a real requirement exists.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T05 | Outbound WhatsApp notification transport + preferred-channel routing | planning | none |

## Parked Future Notes (not current M14 backlog)

- `T01` Multi-instance connector identity + routing contract
- `T02` Connector field mapping API
- `T03` CRM adapters for HubSpot / Salesforce
- `T04` Email provider adapter hardening
- `T06` Slack notification adapter
- `T07` Webhook delivery alignment note
- `T08` Integration setup wizard UI
- `T09` Full milestone verification gate

These notes stay parked until a new checklist row or a real regression explicitly reopens broader connector-governance scope.

## Acceptance Criteria

- [ ] Outbound WhatsApp notification transport exists on the request/response notification lane
- [ ] Preferred-channel notification routing covers outbound WhatsApp delivery without inventing interactive runtime state
- [ ] Existing SMS and delivery-confirmation behavior remain intact as non-regression context
- [ ] Existing webhook/lead/notification baseline is reused rather than duplicated
- [ ] M14 does not introduce interactive channel runtime state, session/thread lifecycle, or provider account install/auth flows
- [ ] `uv run pytest` passes for the outbound notification transport tests that move this row

## Verification

```bash
uv run pytest apps/api/tests/ -k connector --tb=short
uv run pytest apps/temporal-worker/tests/ -k integration --tb=short
uv run pytest solutions/notifications/tests/ -k notifications --tb=short
```

## Non-Goals

- No visual workflow builder for integrations (M15 covers workflow UX)
- No bi-directional CRM sync (push-only for now)
- No OAuth flow for third-party connectors (API keys / webhooks only)
- No interactive channel runtime or session/thread lifecycle (see M14.1-M14.3; future Slack interactive remains out of scope until a real requirement exists)
- No Slack interactive app/bot runtime

## M33 Impact

**Requires adaptation (low).** Autonomous agents can delegate adapter calls asynchronously via `delegate_autonomous_task`. Existing synchronous request/response adapters work unchanged with both rail and autonomous agents. New delegation pattern is optional — an enhancement, not a requirement.
