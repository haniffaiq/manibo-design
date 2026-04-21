# M9: VOX Phase 2 -- Follow-Up + Voice Sales

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M9-vox-followup-voice-sales
Stream: platform
Depends on: M6, M8
Reference: docs/requirements/vox.md (REQ-S07, REQ-S08, REQ-S09), docs/requirements/checklist.md rows 145-150, 158-164

## Goal

FNA automated follow-up email sequences and VSA outbound voice sales calls. FNA sends scheduled nurture emails to captured leads who have not converted. VSA makes outbound discovery calls to warm leads. Call summaries are generated and pushed to CRM.

## Design Decisions

1. **Follow-up sequences are Temporal workflows** -- durable execution with scheduled timers for email cadence, pause/resume on lead reply.
2. **Email sending uses a pluggable integration** -- solution-level email adapter, not a hardcoded provider.
3. **Outbound calls use the same VoiceCallWorkflow** -- VSA reuses the existing voice infrastructure with an outbound SIP initiation activity.
4. **Call summary generation is a post-call activity** -- same pattern as clinic post-call extraction.
5. **Sequence and call state are observable** -- both appear in observability as case types (see M02 for journey tracking).

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Follow-up sequence workflow (Temporal) | not started | none |
| T02 | Email sending integration | not started | T01 |
| T03 | Sequence cadence + prioritization logic | not started | T01 |
| T04 | Outbound call initiation API | not started | none |
| T05 | VSA discovery call workflow | not started | T04 |
| T06 | Call summary generation + CRM push | not started | T05 |
| T07 | Sequence/call observability in UI | not started | T01, T05 |
| T08 | E2E tests | not started | T01-T07 |

## Acceptance Criteria

- [ ] FNA sends follow-up emails on configured schedule (cadence timers work)
- [ ] Sequence pauses on lead reply or conversion
- [ ] VSA makes outbound calls with discovery checklist
- [ ] Call summaries are generated post-call and pushed to CRM
- [ ] Sequence and call status visible in observability
- [ ] `uv run pytest` passes for sequence, email, outbound call, and summary tests
- [ ] `pnpm -C apps/web lint && pnpm -C apps/web check-types` passes

## Verification

```bash
uv run pytest apps/temporal-worker/tests/ -k "follow_up or sequence or outbound" -v --tb=short
uv run pytest apps/api/tests/ -k "outbound_call or sequence" -v --tb=short
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
```

## Non-Goals

- No multi-channel follow-up (email only in v1; SMS/WhatsApp deferred)
- No A/B testing of email templates
- No automated lead scoring to prioritize sequences

## M33 Impact

**Partially obsoleted.** FNA as an autonomous agent replaces the hardcoded Temporal follow-up sequence workflow. The agent decides email content, cadence, and routing autonomously instead of following a static step sequence. Temporal delivery workflow stays for reliability, but content generation moves to the agent. VSA gains memory for cross-call context.
