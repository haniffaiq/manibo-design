# M19: V2 Phase 7 — WhatsApp + Multi-Party Notification Runtime (Legacy Placeholder)

Status: parked
Created: 2026-03-20
Owner: Jakit
Branch: feat/M19-v2-whatsapp-notifications
Stream: v2
Depends on: M8, M14, M4
Reference: docs/milestones/exec-plans/v2_canonical_architecture_refresh.md (Phase 7, lines 2915-2943)

## Goal

Add WhatsApp as the next interactive channel using the V2 channel runtime model. Historical phase wording grouped email/SMS/WhatsApp/push together, but the active split now treats push as follow-on work outside the M14.3 slice. Make delivery status visible in control plane and business operations.

## Legacy Note

This milestone is kept only as the original Phase 7 placeholder.

Active future channel-runtime planning is now grouped under:

- [M14.1: Channel Runtime Foundations](M14.1-channel-runtime-foundations.md)
- [M14.2: Web Chat Runtime Operations](M14.2-web-chat-runtime-operations.md)
- [M14.3: WhatsApp Interactive Runtime](M14.3-whatsapp-interactive-runtime.md) (planning note only; no executable task backlog until the requirement contract grows)
- Future Slack-interactive work remains an architecture note only until a real requirement exists.

Do not start new runtime work from M19. Outbound WhatsApp notification transport and preferred-channel routing now stay with `M14`; use `M14.3` only as a future planning note for WhatsApp interactive runtime until the requirement contract grows. Future Slack-interactive work stays out of backlog until a real requirement exists.

## Historical V2 Boxes

- `channels` + `runtime modules`
- `connectors`
- `business solutions` (notifications, schedule_management)

## Historical Scope Snapshot

Historical Phase 7 intent bundled these future ideas together:

- WhatsApp as a managed interactive runtime
- policy-driven notification routing across email/SMS/WhatsApp
- delivery status visible in control plane and observability

That historical bundle is preserved here for traceability only. Do not create new task files, acceptance criteria, or implementation plans from M19.

## Verification

```bash
rg -n "M14.3|legacy placeholder|Historical Scope Snapshot|Do not create new task files" docs/milestones/M19-v2-whatsapp-notifications.md docs/milestones/README.md
```
