# M6: VOX Phase 1 -- Lead Capture + CRM Delivery

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M6-vox-lead-capture-crm
Stream: v2
Depends on: M4
Reference: docs/requirements/vox.md (REQ-S05, REQ-S06, REQ-S10), docs/requirements/checklist.md rows 129-135

## Goal

Structured lead capture during chat conversations with delivery to CRM/inbox. The WSA agent collects contact info, course interest, and level assessment during conversation. Captured leads are delivered to the configured CRM endpoint. Escalation handles edge cases where the agent cannot resolve the inquiry. Each qualified lead is worth approximately EUR 100.

## Design Decisions

1. **Lead capture is a tool call, not implicit** -- the agent explicitly invokes a `capture_lead` tool when it has enough data, not inferred from conversation.
2. **CRM delivery is a Temporal workflow** -- durable execution with retry for external CRM push, decoupled from the chat session.
3. **Escalation creates a handoff record** -- same handoff model as clinic (M3), reused for VOX.
4. **Recommendation payload is resolved at capture time** -- course recommendations are computed and attached to the lead before CRM delivery.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Lead capture submit endpoint | not started | none |
| T02 | Lead capture record model | not started | T01 |
| T03 | CRM delivery workflow (Temporal) | not started | T02 |
| T04 | Escalation context handoff | not started | T02 |
| T05 | Recommendation payload resolution | not started | T02 |
| T06 | Lead status in observability | not started | T02 |
| T07 | E2E tests | not started | T01-T06 |

## Acceptance Criteria

- [ ] Chat conversation captures structured lead data (name, email, course interest, level)
- [ ] Captured lead is delivered to configured CRM endpoint via Temporal workflow
- [ ] Escalation creates a handoff record when agent cannot resolve
- [ ] Lead includes resolved course recommendations
- [ ] Lead status visible in observability run detail
- [ ] `uv run pytest` passes for lead capture and CRM delivery
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## Verification

```bash
uv run pytest apps/api/tests/ -k "lead_capture or crm_delivery" -v --tb=short
uv run pytest apps/temporal-worker/tests/ -k "crm_delivery" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No CRM admin UI (CRM endpoint is configured via tenant settings)
- No lead scoring algorithm (lead value is flat per qualified capture)
- No automated follow-up from leads (that is M9)

## M33 Impact

**Requires adaptation.** M33 introduces `delegate_autonomous_task` tool enabling asynchronous CRM delivery as a background autonomous task. Autonomous agent could capture lead and delegate CRM push without blocking the conversation. Rail path with synchronous `capture_lead` tool unchanged.
