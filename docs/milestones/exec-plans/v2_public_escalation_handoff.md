# V2 Public Escalation Handoff

## Objective

Ship the next stacked V2 public-ingress slice as a draft PR:

- target checklist row advanced: `docs/requirements/checklist.md` row `133`
- target requirement: `Agent escalates gracefully to human when conversation is outside its scope: full context handed off`

## Scope

- add a typed public escalation submit contract for anonymous web-chat sessions
- persist tenant-visible escalation truth with stable reason code, operator summary, urgency, and context snapshot
- bridge the escalation into `public.operator_events` for operator follow-up without using operator events as the only source of truth
- prove idempotent repeat submission per guest session so the widget cannot spam duplicate handoff records
- add unit + integration coverage for stored context, linked operator event, and idempotency

## Non-Goals

- recommendation payloads
- assistant-side escalation policy or trigger inference
- operator console UI
- voice control-plane takeover
- CRM follow-up workflows beyond the existing public lead path

## Status

- [x] bind the slice to a concrete checklist row
- [x] add typed escalation models, service flow, and API route
- [x] add tenant migration and persistence for public escalation records
- [x] link escalation submit to `public.operator_events` with durable context
- [x] add unit + integration proof for context snapshot and idempotency
- [x] harden escalation storage failures to return public-ingress `503` instead of raw `500`
- [x] update generated API inventory and keep checklist progress honest about the missing widget caller
- [x] capture observability proof in durable branch artifacts
- [x] close post-review gaps: revalidate active session in the escalation write transaction and throttle escalation submit
- [x] close follow-up review gaps: build the escalation snapshot under the session lock and make operator-event emission best-effort
- [x] close final review gap: retry missing operator-event emission when an existing escalation is retried
- [x] commit, push, and open the draft PR

## Notes

- This slice is intentionally narrow. It closes the human-handoff hole in web chat without pretending recommendations, guardrails, or operator UX are done.
- “Full context handed off” is implemented honestly, not magically: the escalation record stores a transcript excerpt and latest lead-capture snapshot, while the canonical full transcript still lives in tenant chat history.
- The route is idempotent per guest session. Re-submitting the same public escalation returns the existing record and does not spray duplicate operator events into the queue.
- The escalation write path now re-checks the active session row inside the transaction, matching the other public-ingress mutations instead of trusting an earlier session read.
- The escalation context snapshot now comes from the repository transaction after that session lock is taken, so concurrent guest writes cannot slip past the handoff snapshot.
- The tenant escalation row is now the durable source of truth even if `public.operator_events` emission is unavailable; the operator queue signal is best-effort instead of all-or-nothing.
- Retrying an already-created escalation now repairs a missing operator-event row instead of silently returning stale success forever after the first best-effort queue write failed.
- Escalation submit now has its own anonymous-ingress rate-limit key, so the route-level `429` path is real instead of dead code.
- This branch only delivers the backend handoff contract. The repo still has no public widget/web caller for the escalation endpoint, so checklist row `133` remains partial until that consumer lands.
- Draft PR: `#540` `feat(api): add v2 public escalation handoff`

## Verification

- `uv run pytest packages/platform-core/tests/unit/test_public_ingress/test_service.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_public_ingress.py -q --tb=short`
- `uv run pyright packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run ruff check packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py`
- `uv run ruff format packages/platform-core/src/platform_core/public_ingress/ apps/api/src/platform_api/routes/public_ingress.py packages/platform-core/tests/unit/test_public_ingress/test_service.py apps/api/tests/integration/test_public_ingress.py --check`
- `uv run python tools/scripts/check_requirements_checklist.py --only-evidence --fail-on-evidence-issues`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `tools/scripts/run_local_pre_pr_ci.sh`

## Observability Evidence

- OTLP spans emitted: `Yes`

```bash
tools/scripts/obs_traceql.sh '{ resource.service.name = "platform-api" && span.public_ingress.route = "escalation_submit" }' 15m | jq '{traces: [.traces[] | {traceID, rootTraceName, spanSet: {matched: .spanSet.matched, spans: [.spanSet.spans[] | {spanID, attributes: [.attributes[] | select(.key=="public_ingress.route" or .key=="public_ingress.guest_session_id" or .key=="public_ingress.escalation_reason" or .key=="public_ingress.escalation_priority")] }]}}]}'
{
  "traces": [
    {
      "traceID": "dc25bcb373a26cb9304e06d93a610d7",
      "rootTraceName": "http POST /public/chat/sessions/571b0a6a-feb6-4c19-8b46-d488a3bb4895/escalations",
      "spanSet": {
        "matched": 1,
        "spans": [
          {
            "spanID": "1dfdb5ec138b9579",
            "attributes": [
              {
                "key": "public_ingress.route",
                "value": {
                  "stringValue": "escalation_submit"
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

```bash
tools/scripts/obs_logql.sh '{service="platform-api"} | json | event="public_chat_escalation_submitted"' 15m 20 | jq '{result: [.data.result[] | {event: .stream.event, guest_session_id: .stream.guest_session_id, reason_code: .stream.reason_code, priority: .stream.priority, escalation_ref: .stream.escalation_ref, trace_id: .stream.trace_id, span_id: .stream.span_id}]}'
{
  "result": [
    {
      "event": "public_chat_escalation_submitted",
      "guest_session_id": "571b0a6a-feb6-4c19-8b46-d488a3bb4895",
      "reason_code": "out_of_scope",
      "priority": "urgent",
      "escalation_ref": "a4d2583f-49a8-45b0-8601-149e32cd04f7",
      "trace_id": "0dc25bcb373a26cb9304e06d93a610d7",
      "span_id": "1dfdb5ec138b9579"
    }
  ]
}
```

```bash
tools/scripts/obs_promql.sh 'sum by (route,outcome) (platform_api_route_events_total{route="public_chat_escalation_submit",outcome="success"})' | jq '{result: [.data.result[] | {metric: .metric, value: .value[1]}]}'
{
  "result": [
    {
      "metric": {
        "outcome": "success",
        "route": "public_chat_escalation_submit"
      },
      "value": "1"
    }
  ]
}
```
