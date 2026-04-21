# T12: Telnyx carrier events in observability evidence rail

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T04, T05, T06, T11

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T12 - add Telnyx carrier event observability`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M13-telephony-management`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M13/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M13/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Make Telnyx carrier-side SIP connection events first-class evidence inside the existing call observability surfaces. Today, when an inbound call fails before `livekit-sip` or `platform-api` logs anything, the platform becomes blind even though Telnyx still knows whether it accepted the DID, tried a given FQDN, waited for `180/183`, timed out before `200 OK`, or received an upstream SIP error. This task adds a real Telnyx webhook receiver, verifies and deduplicates those events, correlates them to the existing call/session model, persists them into the same call-runtime evidence stream used by live voice ops, and exposes them through the M1/M1.x evidence-rail surfaces instead of inventing a separate telephony debug page.

## Architecture Target

```text
Telnyx connection events
        |
        v
platform webhook ingress
        |
        v
normalize + verify + dedupe
        |
        v
correlate to call/session
        |
        v
persist as runtime evidence
        |
        +--> observability timeline API
        |
        +--> /calls/{id}/ops/stream SSE
        |
        +--> evidence rail in M1 UI
```

## Subtasks

- [x] **Add a real Telnyx connection webhook receiver**: create a platform-owned ingress endpoint for Telnyx FQDN connection events instead of temporary `webhook.site` debugging hooks.
- [x] **Verify authenticity and idempotency**: validate the Telnyx signature/headers, reject forged requests, and make duplicate/replayed events harmless.
- [x] **Correlate carrier events to platform calls**: match by `connection_id`, DID, and provider call identifiers so events land on the correct call/session record.
- [x] **Persist carrier events into call runtime evidence**: store normalized Telnyx carrier events in the same evidence/event stream used by call ops and post-call timeline views.
- [x] **Expose carrier events through live and historical observability**: stream them through `/calls/{id}/ops/stream` and include them in call detail/timeline observability APIs.
- [x] **Map Telnyx events into M1 evidence-rail semantics**: keep raw payloads for drill-down, but normalize the operator-visible labels/severity using the existing evidence rail patterns from M1.2/M1.3.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/` | Modify/Create | Add the Telnyx webhook ingress route and wire it into platform auth/verification flows |
| `packages/platform-core/src/platform_core/voice/` | Modify | Normalize, correlate, and persist carrier-side events into call runtime evidence |
| `apps/api/src/platform_api/routes/observability.py` | Modify | Classify persisted carrier events into the existing timeline/evidence-rail contract |
| `apps/web/src/components/observability/` | Reuse Existing | Existing M1 rail already renders generic timeline items once backend emits normalized `kind`/summary/severity |
| `wiki/ops/voice-call-local-demo.md` | Modify | Document how Telnyx carrier events appear in platform observability during PSTN debugging |
| `docs/tasks/M13/PROGRESS.md` | Modify | Record execution state and proof once implemented |

## Implementation Notes

- This task is explicitly a follow-on to the completed observability work in `M1`, `M1.2`, and `M1.3`. Do not build a standalone “Telnyx debug page.” The right destination is the existing evidence rail, live ops stream, and observability timeline/detail surfaces.
- Normalize Telnyx events before they hit operator-facing UI. Raw vendor JSON belongs in `payload`/drill-down, not as the primary UI.
- Persist the smallest stable normalized contract that the platform can own even if Telnyx changes minor webhook fields.
- Correlation must fail closed. If a Telnyx event cannot be mapped confidently to an existing call/session, keep it out of tenant-facing timelines and surface it only as unmatched operator evidence if a later milestone explicitly requires that.
- Use the existing runtime evidence/call ops stream seam. This task should extend the current voice-call observability path, not create a second event pipeline.
- Outbound correlation must not depend on Telnyx callbacks arriving after the call already exists. Seed a best-effort outbound `calls` row before the SIP participant is created so later carrier events have a real call/session record to attach to.
- Developer-specific public SIP hosts and test phone numbers must stay parameterized. The implementation and proof flow should read the active public SIP target from runtime config (`LIVEKIT_SIP_HOST` / provider inventory) and the active test destination from operator input or seeded test data, never from a hardcoded developer IP or personal handset literal.
- The operator-facing evidence rail should be able to show at least these normalized carrier facts when present:
  - carrier accepted inbound DID
  - carrier routed to SIP connection
  - carrier tried the active configured public SIP host/FQDN on the expected signaling port
  - no `180/183` before timeout
  - no `200 OK` before timeout
  - upstream SIP response `403` / `408` / `480` / other final failure
  - call delivered to LiveKit SIP
  - carrier-side hangup cause

## Acceptance Criteria

- [x] Platform exposes a real Telnyx webhook endpoint for FQDN connection/call events.
- [x] Incoming Telnyx webhook events are authenticity-checked and idempotent.
- [x] Normalized carrier events correlate to the correct call/session using `connection_id`, DID, and provider call identifiers.
- [x] Carrier events are persisted into the same call runtime evidence stream used by voice call ops/history.
- [x] `/calls/{id}/ops/stream` includes carrier-side events for live cases.
- [x] Observability call detail/timeline APIs include the same carrier-side events for historical cases.
- [x] The M1 evidence rail can show normalized carrier-side milestones/failures without exposing raw vendor JSON as the default UI.

## UI Handling Contract

- The existing M1 evidence rail remains the primary surface. Do not create a telephony-only debug page for normal operator use.
- Carrier-delivery failures must render as `route` timeline items with plain-language labels first and raw SIP/vendor data second.
- The default UI should show normalized labels such as:
  - `Carrier accepted inbound DID`
  - `Carrier routed to SIP connection`
  - `Call delivered to LiveKit SIP`
  - `LiveKit SIP dropped the inbound call before room dispatch (486 flood/AuthDrop)`
  - `No 180/183 before timeout`
  - `No 200 OK before timeout`
  - `Upstream SIP response 403`
- The primary evidence-rail row should show:
  - label: normalized operator-facing summary
  - severity: `info` / `warning` / `error`
  - timestamp: provider event time when available
  - short detail: one-sentence diagnostic hint when the failure class is known
- Raw provider payload must stay in drill-down only. The collapsed row should never default to raw Telnyx JSON, raw webhook fields, or unexplained SIP jargon.
- When the platform can infer a likely cause from a normalized failure class, the drill-down should include a diagnostic hint. Example:
  - `486 flood/AuthDrop` -> likely no matching inbound trunk or SIP dispatch rule on the active LiveKit server
- UI filtering/grouping should treat carrier events as part of the existing `route` evidence family so operators can compare telephony delivery failures with other routing/runtime events in the same timeline.
- If a carrier event cannot be confidently correlated to a call/session, fail closed for tenant-facing UI. Do not show unmatched carrier events in the normal tenant evidence rail.

## Current Execution Notes

- The first T12 slice lands a real platform-owned Telnyx webhook ingress contract at `/webhooks/telnyx/voice` instead of relying on temporary `webhook.site` captures.
- The second T12 slice closes the full write/read path without inventing a second telemetry pipeline:
  - webhook freshness validation using `telnyx-timestamp`
  - idempotent ingest keyed by persisted `carrier_event_id`
  - fail-closed correlation through `connection_id` + DID + provider call identifiers
  - best-effort outbound `calls` row seeding before SIP dial so Telnyx callbacks can resolve to a real call
  - persistence into existing `call_runtime_events`
  - existing `/calls/{id}/ops/stream` and observability timeline/detail APIs reuse that persisted evidence without route-specific branching
- No dedicated `apps/web` change was required. The M1 evidence rail already renders generic observability timeline items, so the backend only needed to emit normalized `summary`, `severity`, and `kind="route"` signals for carrier events.
- Latest local-real-call debugging added one more explicit carrier-failure contract: `486 flood` from `livekit-sip` is not a generic network error and should not render as an opaque SIP code in the UI. On the active self-hosted branch, that response means LiveKit SIP dropped the inbound call before room dispatch (`AuthDrop`), which usually points at inbound trunk / SIP dispatch rule mismatch on the active server. T12 now treats that as a normalized carrier-route failure with:
  - runtime event type `carrier.telnyx.failed.auth_drop`
  - operator label `LiveKit SIP dropped the inbound call before room dispatch (486 flood/AuthDrop)`
  - drill-down diagnostic that points operators toward inbound trunk / dispatch-rule mismatches instead of generic PSTN troubleshooting

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [M1-obs-ui-redesign.md](../../milestones/M1-obs-ui-redesign.md)
- Related: [M1.2-obs-evidence-rail.md](../../milestones/M1.2-obs-evidence-rail.md)
- Related: [M1.3-obs-live-streaming.md](../../milestones/M1.3-obs-live-streaming.md)
- Related: [T11-local-real-call-profile-and-pstn-proof.md](./T11-local-real-call-profile-and-pstn-proof.md)
- Related: [voice-call-local-demo.md](../../../wiki/ops/voice-call-local-demo.md)
