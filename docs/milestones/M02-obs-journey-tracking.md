# M02: Journey Tracking & Proactive Agent Observability

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M02-obs-journey-tracking
Stream: obs
Depends on: M1.2 (UI components), M6 (lead_id correlation from lead capture), M9 (FNA sequence state), M10 (OMA monitor state). Can start UI with mock data after M1.2; real data requires M6/M9/M10 APIs.
Reference: docs/requirements/vox.md, docs/milestones/exec-plans/v2_canonical_architecture_refresh.md

## Goal

Track cross-interaction customer journeys and proactive agent behavior across channels and time. A lead that goes from WSA chat → FNA email follow-up → VSA call → registration should be visible as one connected journey, not five unlinked cases. Background agents (FNA sequences, OMA monitoring) should have their own observable case types.

## Design Decisions

1. **Journey is a new case type** — `lead_journey` alongside existing `call_session`, `interactive_channel_session`, etc. The journey case aggregates touchpoints from multiple individual cases linked by a shared lead/subject identifier.

2. **Journey timeline is coarser than evidence rail** — each entry is a touchpoint (one chat, one email, one call), not individual events within those interactions. Clicking a touchpoint opens the individual case in a side panel or navigates to it.

3. **FNA sequence is a trackable workflow case** — the follow-up nurture sequence appears as a `workflow_run` case with step-by-step visibility: which emails sent, opened, replied, and what the cadence/priority state is.

4. **OMA is a continuous monitor case** — a new `agent_monitor` case type showing scan intervals, detection events, active alerts, escalation ladder state, and resolution history.

5. **Linking mechanism** — journey touchpoints are linked by `lead_id` or `subject_key` from the lead capture / CRM delivery system. This requires backend support for cross-case correlation beyond `call_id` / `correlation_id`.

6. **Funnel position** — right rail shows where the lead is in the sales funnel (Inquiry → Qualified → Matched → Registered / Archived) with percentage progress.

## Wireframes

### Journey View

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to queue                                     🧭 Lead journey              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Maria Schmidt — German B1 Evening                    [Registered] ✓              │
│ VOX Zurich · Lead captured Mar 20 · Registered Mar 26 · 6 days to convert       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Touchpoints: 5 │ Channels: 3 │ Agents: 3 │ Outcome: registered                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                    │                             │
│  JOURNEY TIMELINE                                  │  LEAD RECORD                │
│                                                    │                             │
│  Mar 20  💬 WSA: Chat (4m)                         │  Name: Maria Schmidt        │
│  │ Web widget · de-CH · 3 courses proposed         │  Email: m.s@gmail.com       │
│  │ Lead captured ✓ · Reg link sent ✓               │  Level: B1 (confirmed)      │
│  │ [Open case →]                                   │  Course: German B1 Evening  │
│  │                                                 │                             │
│  Mar 21  📧 FNA: Follow-up #1                      │  ─────────────────────────  │
│  │ Opened ✓ · No reply                             │  FUNNEL POSITION            │
│  │ [Open case →]                                   │                             │
│  │                                                 │  ████████████████░░ 100%    │
│  Mar 23  📧 FNA: Follow-up #2                      │  Inquiry → Qualified →      │
│  │ Reply: "interested but schedule"                │  Matched → Registered ✓     │
│  │ → Routed to VSA                                 │                             │
│  │ [Open case →]                                   │  ─────────────────────────  │
│  │                                                 │  AGENT INVOLVEMENT          │
│  Mar 24  📞 VSA: Discovery call (8m)               │                             │
│  │ B1 confirmed · Matched to evening course        │  WSA: 1 conversation        │
│  │ CRM summary pushed ✓                            │  FNA: 2 emails (of 5 max)   │
│  │ [Open case →]                                   │  VSA: 1 call                │
│  │                                                 │                             │
│  Mar 26  ✅ Registered                             │  ─────────────────────────  │
│  │ German B1 Evening · Mon/Wed · CHF 890           │  RELATED RECORDS            │
│  │                                                 │  [Open in CRM]              │
│  ╌╌╌ POST-REGISTRATION ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │  [Open FNA sequence]        │
│                                                    │  [All touchpoints]          │
│  Apr 19  ⚙ SMA: Schedule change                   │                             │
│  │ Alternative proposed → confirmed                │                             │
│  │ Student notified: SMS ✓ + Email ✓               │                             │
│  │ [Open case →]                                   │                             │
│                                                    │                             │
└────────────────────────────────────────────────────┴─────────────────────────────┘
```

### FNA Sequence View

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to queue                                     🔄 Nurture sequence          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Follow-up: Maria Schmidt                             [Active — Step 2/5]         │
│ VOX Zurich · lead_nurture · Started Mar 21 · Next step: Mar 25                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Steps: 2/5 │ Responses: 1 │ Opens: 2 │ Next in: 2 days                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                    │                             │
│  SEQUENCE EVIDENCE RAIL                            │  SEQUENCE CONFIG            │
│                                                    │                             │
│  Mar 21  [Step 1 — Email]              delivered   │  Template: nurture-5-step   │
│  │ Subject: "Ihr Deutschkurs in Zürich"            │  Max attempts: 5            │
│  │ Opened ✓ · No reply                             │  Cadence: 2d, 2d, 3d, 5d   │
│  │ Wait: 2 days                                    │  Stop on: reply or register │
│  │                                                 │  Priority: high             │
│  Mar 23  [Step 2 — Email]              reply ✓     │                             │
│  │ Subject: "Passt der Abendkurs?"                 │  ─────────────────────────  │
│  │ Opened ✓ · Reply received ✓                     │  WHAT TO DO NEXT            │
│  │ → Sequence paused: reply received               │                             │
│  │ → Routed to: VSA or human sales                 │  ● Route reply to VSA       │
│  │                                                 │    [Do now]                 │
│  ╌╌╌╌ PENDING STEPS ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │                             │
│                                                    │  ─────────────────────────  │
│  Mar 25  [Step 3]                      ○ paused    │  RELATED RECORDS            │
│  Mar 28  [Step 4]                      ○ scheduled │  [Open lead journey]        │
│  Apr 2   [Step 5 — Archive]            ○ scheduled │  [Open source WSA chat]     │
│                                                    │  [Open in CRM]              │
│                                                    │                             │
└────────────────────────────────────────────────────┴─────────────────────────────┘
```

### OMA Monitor View

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to queue                                     🔍 Operations monitor        │
├──────────────────────────────────────────────────────────────────────────────────┤
│ OMA: 3 active alerts, 12 resolved today              [Healthy]                   │
│ VOX · Scan interval: 5 min · Last scan: 14:32:01                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Active: 3 │ Escalated: 1 │ Auto-resolved: 8 │ Staff-resolved: 4                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                    │                             │
│  DETECTION TIMELINE                                │  ACTIVE ALERTS              │
│                                                    │                             │
│  14:32  [Scan] 3 issues found                      │  🔴 Missed lesson reminder  │
│  │                                                 │     Student: Peter K.       │
│  14:32  [Alert]  🔴                                │     Escalated to staff      │
│ ▎ Missed lesson reminder                           │     [Resolve]               │
│ ▎ Student: Peter K.                                │                             │
│ ▎ Escalated → staff notification                   │  ⚠ Unconfirmed session      │
│ ▎                                                  │     Teacher: Anna M.        │
│  14:32  [Alert]  ⚠                                │     Auto-reminder sent      │
│ ▎ Unconfirmed session · Teacher: Anna M.           │     [Resolve]               │
│ ▎ Auto-sent confirmation request                   │                             │
│ ▎                                                  │  ─────────────────────────  │
│  14:22  [Alert — Resolved]  ✓                      │  ESCALATION LADDER          │
│  │ Late cancellation · Auto-notified ✓             │  L1: Auto-remind            │
│  │                                                 │  L2: Staff notify           │
│  14:17  [Scan] 0 issues                            │  L3: Manager escalate       │
│                                                    │  L4: Auto-action            │
│                                                    │                             │
└────────────────────────────────────────────────────┴─────────────────────────────┘
```

## New Case Types Required

| Case type | Agent | Lifespan | Key fields |
|-----------|-------|----------|------------|
| `lead_journey` | Cross-agent | Days to weeks | `lead_id`, touchpoint list, funnel position, conversion outcome |
| `nurture_sequence` | FNA | Days to weeks | `lead_id`, step position, cadence, responses, pause state |
| `agent_monitor` | OMA | Continuous | scan interval, active alerts, escalation states, resolution history |

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Define journey case type and touchpoint model | not started | none |
| T02 | Journey timeline component (coarser than evidence rail) | not started | T01 |
| T03 | Lead record right-rail panel (funnel, agents, CRM link) | not started | T01 |
| T04 | Touchpoint-to-case navigation (click → open individual case) | not started | T02 |
| T05 | FNA sequence case view (steps, cadence, pause state) | not started | none |
| T06 | OMA monitor case view (scans, alerts, escalation ladder) | not started | none |
| T07 | Add journey/sequence/monitor to queue with appropriate badges | not started | T01, T05, T06 |
| T08 | Journey linking by lead_id in queue filter | not started | T01 |
| T09 | Update E2E tests for new case types | not started | T02-T08 |

## Acceptance Criteria

- [ ] Lead journey case shows all touchpoints across channels in chronological order
- [ ] Each touchpoint links to the individual case (chat, call, email, workflow)
- [ ] Funnel position visible in right rail
- [ ] FNA sequence shows step-by-step progress with delivery/open/reply status
- [ ] OMA monitor shows scan timeline with active alerts and escalation state
- [ ] New case types appear in queue with appropriate badges (🧭 Journey, 🔄 Sequence, 🔍 Monitor)
- [ ] Queue can filter by lead_id to show all cases for one customer

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test e2e/observability.spec.ts --project=chromium
```

## Non-Goals

- No CRM integration (journey data comes from backend APIs, not direct CRM reads)
- No lead scoring algorithm (funnel position is derived from captured state)
- No OMA rule editor (escalation config is backend/admin work)
- No real-time OMA scan trigger from UI (OMA runs on its own schedule)

## Backend Dependencies

This milestone requires backend API support that does not exist yet:

1. **Journey API** — endpoint that returns touchpoints for a `lead_id` across case types
2. **Lead correlation** — `lead_id` or `subject_key` must be available on `ObservabilityRunSummary`
3. **Sequence state API** — FNA workflow must expose step position, cadence, and pause state
4. **Monitor state API** — OMA must expose scan history, active alerts, and escalation state

Until these APIs exist, the UI can be built with mock data and type contracts.

## M33 Impact

**Requires adaptation.** Define observability contract for autonomous agents: memory saves appear as evidence rail items, skill creation appears as observable events, background task delegation appears in journey timeline. Consider adding `autonomous_agent_session` as a new case type alongside existing voice/chat/workflow case types.
