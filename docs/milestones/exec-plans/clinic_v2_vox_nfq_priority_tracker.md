# Execution Plan: Clinic + V2 + VOX/NFQ Priority Tracker

> **Status:** Active
> **Created:** 2026-03-16
> **Owner:** Jakit
> **Track:** Epic

## 1. Goal

Finish the NFQ clinic booking delivery first, with a hard P0 bar:

- a caller can complete a clinic booking in local `k3d` without requiring real clinic-system integrations
- operators can see the full conversation and the latency truth in UI
- the team stops bleeding time into low-yield rabbit holes

## 2. Why This Exists

Current repo reality is easy to misread:

- NFQ clinic booking is mostly real, but the remaining gaps are concentrated in operator workflow continuity, handoff UX, and proof quality, not in generic platform scaffolding.
- P0 is not "the flow exists in backend tests." P0 is "a call can run in local `k3d`, end in a booked state, and the operator can inspect transcript + latency truth in the product UI."
- V2 has real prep work landed, but large parts of the V2 plan are still architecture contract and future channel/runtime work, not immediate delivery.
- VOX starts in two weeks, but VOX Phase 1 still has hard blockers around public ingress, widget/chat, knowledge base lifecycle, and multilingual/public-sales behavior.
- NFQ source handoff is also real work, but it is a delivery-protection lane, not a reason to derail clinic P0 with a repo-wide reshuffle.

If work is not ordered aggressively, the team will spend a week polishing the wrong thing and call it progress.

## 3. Priority Rules

1. Clinic completion beats V2 elegance.
2. V2 work is allowed only if it directly unblocks clinic proof, connector governance, or VOX Phase 1 start.
3. No new UI surface starts without a checklist or UI-requirements anchor.
4. No “smart architecture” branch expands scope if it does not move one of the next two-week delivery outcomes.
5. Tech debt is a tool, not a religion:
   - take debt when it shortens the path to a real requirement
   - do not take debt that creates a second fake control plane, duplicate contract, or forked product surface

### Runtime-Track Status Lock

This tracker is the execution authority for the new future channel-runtime split:

- `M14.1` Channel Runtime Foundations: planning only, blocked behind `M8` + `M14` plus future tracker activation
- `M14.2` Web Chat Runtime Operations: planning only, blocked behind `M14.1` + `M4` plus future tracker activation
- `M14.3` WhatsApp Interactive Runtime: planning only, blocked behind `M14` + `M14.1` + `M14.2` plus an explicit interactive-WhatsApp requirement/endpoint contract and future tracker activation
- outbound preferred-channel notification transport/routing, including WhatsApp notifications, remains with `M14` request/response integration scope
- future Slack interactive: no milestone/task backlog until a real Slack-interactive requirement exists
- `M19` legacy placeholder only; do not start new work from it

If a milestone doc says a future runtime track "follows the active tracker", this section is the answer.

## 4. Source Anchors

Checklist rows this tracker is meant to move:

- `docs/requirements/checklist.md:377-378` -- governed agent lifecycle remains partial because simulation/test console, saved evals, and traffic controls are missing
- `docs/requirements/checklist.md:413-430` -- NFQ clinic booking scope
- `docs/requirements/checklist.md:40-41` -- VOX Phase 1 blockers: no public web chat/widget APIs and no KB approval flow
- `docs/requirements/checklist.md:54` -- pre-V2 contracts already landed; do not rebuild them
- `docs/requirements/checklist.md:226-233` -- live call ops, transcript, recordings, and historical conversation review
- `docs/requirements/checklist.md:53` -- operator-grade observability is materially in-product but still missing unified product depth

UI-requirements anchors:

- `docs/requirements/ui-requirements.md:14` -- `/admin/agent-definitions` still lacks saved tests/evals and browser preview
- `docs/requirements/ui-requirements.md:229-230` -- simulation sandbox and traffic shifting are TBD
- `docs/requirements/ui-requirements.md:573-575` -- sandbox simulation, saved eval scenarios, compare runs, traffic shifting are TBD
- `docs/requirements/ui-requirements.md:100` -- clinic tenant workflow is partial and still needs stronger live handoff + call-ops continuity

V2 anchors:

- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md:2617-2656` -- Phase 1: schema-first connectors and package governance
- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md:2660-2695` -- Phase 2: voice control plane
- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md:2700-2742` -- Phase 3: web chat and website sales surface

Observability anchors for P0:

- `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md` -- latency and operator-evidence truth already have a concrete backlog; do not invent a second observability strategy
- `docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md` -- use the case/evidence-rail direction for tenant/admin investigation, but only the clinic/operator slice needed for P0

NFQ source-distribution anchor:

- `docs/milestones/exec-plans/nfq_source_distribution_separation.md` -- source-level separation and test partitioning for NFQ handoff
- `docs/milestones/exec-plans/clinic_go_live_gate_checklist.md` -- blunt launch gate separating clinic runtime truth, post-`P0` console debt, and NFQ source-handoff readiness

## 5. Ruthless Order Of Work

### P0: Finish NFQ Clinic Booking

Why first:

- It is the top user priority.
- It is already mostly built.
- It closes real checklist rows instead of opening new speculative fronts.

Definition of done:

- A caller can start a clinic flow in local `k3d` and reach a booked outcome without requiring a real clinic integration.
- The booking path can use local/mock scheduling + CRM/notification fallbacks where real provider integrations are absent, but the user-visible outcome must still be "booked".
- Clinic operator can move from live call -> transcript/latency inspection -> booking/follow-up outcome without guessing.
- The full conversation is visible in UI through `/call-ops`, `/call-ops/history`, and `/observability`.
- Key metrics are visible in UI for the same run:
  - voice-to-voice / first speech
  - LLM first token / TTS first byte / STT finalization
  - STT / LLM / TTS component duration
  - tool wait / workflow-blocked wait when relevant
- Clinic proof is honest: deterministic `k3d`/browser runs are green, UI flows are verified, and real-provider proofs stay explicitly separate from repo-only claims.

Primary checklist targets:

- `docs/requirements/checklist.md:424,428-430`
- `docs/requirements/checklist.md:425-427` are now explicit post-`P0` clinic-console follow-up rows, not booked-call/runtime `P0` blockers
- secondary reinforcement of `docs/requirements/checklist.md:415-423`

Concrete task stack:

1. Make the deterministic clinic call path end in a booked state in local `k3d`, even when real clinic integrations are absent.
2. Keep the fallback path boring and explicit:
   - local/mock scheduling or seeded clinic adapter
   - local/mock post-call sync where real CRM is absent
   - local/mock notification delivery where real SMS provider is absent
3. Finish clinic handoff continuity in UI.
4. Tighten bookings follow-up and selected-call context clarity.
5. Surface full conversation and key latency evidence in the operator UI using the existing call-ops/history/observability rails.
6. Tighten operator-facing copy and next-step guidance for clinic staff.
7. Re-verify the clinic browser rehearsal, call-ops, history, bookings, and observability flows on desktop and mobile.
8. Update checklist proof only after the flows are actually verified.

Latest progress (2026-03-18):

- clinic bookings detail now links directly into the selected call's conversation evidence instead of forcing staff to search again
- `/call-ops/history` now accepts `?call_id=...` deep links and auto-opens the matching call detail
- targeted browser proof now covers the clinic continuity path from `/bookings` -> `/call-ops/history` -> `/observability/sessions/[call_id]`
- proof command: `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && NEXT_E2E_PORT=3116 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3116 pnpm -C apps/web playwright:test e2e/clinic-bookings.spec.ts --project=chromium`
- local `k3d` is now the only authoritative runtime proof lane for this tracker; old Compose-era clinic proof is retired and does not close `P0`
- the booked-outcome and inbound-call clinic proofs in `packages/platform-core/tests/e2e/` are both green again in the authoritative local `k3d` lane
- inbound caller proof remains the real last-mile truth: a `/webhooks/livekit/room-started` clinic call must reach a confirmed booked outcome, persist transcript rows, expose call trace + observability run detail, and link operator evidence back into the selected clinic case inside the cluster-backed lane
- root cause fixed during this proof: the clinic extraction YAML had drifted from the registered extraction schema, so post-call booking detail stayed fail-closed until the schema text matched the registered contract again
- `tools/scripts/run_clinic_booked_outcome_e2e.sh` now passes in local `k3d`, so the deterministic booked-outcome lane is green in the authoritative runtime instead of only in old Compose-era proof
- root cause fixed during inbound proof hardening: `tools/scripts/k3d-test-e2e.sh` was using a raw JSON literal inside `${VAR:-...}`, which appended an extra `}` whenever `GROVE_LITELLM_MOCK_RESPONSE` was already set and kept poisoning the temporal-worker env with `...null}}`
- the fix is now mechanical instead of hopeful: the default mock JSON moved into a heredoc, the clinic wrapper still generates the payload via `uv run python`, `_call_llm()` short-circuits directly on the parsed mock, and the harness now refuses to preserve an invalid pre-existing worker mock env during cleanup
- root cause fixed during the final `k3d` rerun: stale `k3d-${K3D_CLUSTER_NAME}-tools` containers could survive an interrupted import and brick the next cluster-backed proof before the clinic call even started
- the import fix is now mechanical too: both `tools/scripts/k3d-up.sh` and `tools/scripts/k3d-sync-app-runtime.sh` remove stale tools containers before invoking `k3d image import`
- `tools/scripts/run_clinic_inbound_confirmed_booking_e2e.sh` is green again in local `k3d`; the latest fully traced authoritative run produced `call_id=df77a985-0aab-5af9-a460-d8b2117b985b`, `tenant_id=88f6483d-46c6-48e6-918c-5d1057050789`, `trace_id=11111111111111111111111111111111`, and the live API served `200` for `/clinic/booking-results/{call_id}`, `/calls/{call_id}/trace`, and `/observability/runs/call_session/{call_id}`
- operator continuity is now bidirectional for clinic calls: `/bookings` already deep-linked into `/call-ops/history` and `/observability`, and inbound-call observability detail now derives the clinic solution context cleanly enough to link back into `/bookings?call_id=...#clinic-selected-case`
- `source "$HOME/.nvm/nvm.sh" && nvm use 22 >/dev/null && tools/scripts/run_local_pre_pr_ci.sh --full` now clears docs policy, checklist evidence, API inventory, architecture, lint, pyright, `apps/web` build, the full `apps/web` Playwright suite, `tools/scripts/run_web_ui_harness.sh`, and the cluster-backed clinic runtime proofs before it dies in untouched `packages/grove` baseline debt (`test_file_size.py` plus three `runtime/graph.py` cases); that is real repo noise, but it is not a clinic `P0` regression
- the authoritative `k3d` lane now includes Tempo and Loki alongside Prometheus/Grafana, so trace/log/metric proof comes from the same local cluster that runs the clinic call instead of from old Compose-era sidecars
- the reminder-path `notification_deliveries` noise is gone from the latest authoritative call: traces still show `sol.notifications.send_notification`, but they no longer include `sol.notifications.record_delivery`, and Loki returns no `notification_deliveries` / `record_delivery` matches for the passing `call_id`
- the latest review-driven harness fixes are mechanical, not ceremonial: `run_local_pre_pr_ci.sh` no longer leaks the clinic confirmed-booking mock into unrelated `packages/platform-core/tests/e2e` runs, `obs_backend.sh` now port-forwards against the worktree-scoped `k3d-${K3D_CLUSTER_NAME}` context instead of whatever kubectl happened to target, and the inbound wrapper keeps the worker env long enough for Prometheus to scrape tenant-scoped metrics before cleanup
- the last concrete local review findings are now fixed and covered by targeted tests instead of hand-waving: `run_local_pre_pr_ci.sh` no longer leaks the clinic confirmed-booking mock into unrelated `packages/platform-core/tests/e2e` runs, reminder workflows preserve the legacy send path unless `notifications_enabled` is explicitly `False`, and inbound webhook metadata only stamps `solution_name` when the compiled plugin is still tenant-enabled
- the latest remote `P2` is fixed too: real-provider `k3d` runs now force a temporal-worker rollout whenever the existing `GROVE_LITELLM_MOCK_RESPONSE` is invalid JSON, so setup cannot silently leave broken mock state behind just because the desired real-provider value is empty
- the follow-up API-key local review found two more honest `P2`s and both are now fixed: the parent inbound orchestrator no longer records appointment reminders as `SCHEDULED` when `notifications` is disabled, and the authoritative inbound `k3d` proof now generates a future appointment date plus asserts the derived reminder `send_at` is still in the future before the run counts as valid proof
- PR readiness no longer false-fails on missing OTLP proof: the source PR body and GitHub PR body now keep each TraceQL / LogQL / PromQL command and its captured output in the same fenced block, which is what `tools/scripts/check_pr_readiness.py` actually enforces
- CI runtime smoke no longer false-fails on slow `uv run` startup: the Compose-only `platform-api-e2e` and `temporal-worker-e2e` health checks now use a 90-second `start_period`, which matches the observed 78-84 second warm-up budget instead of marking the branch red before either service can answer `/health` or `/ready`
- the runtime/proof merge path for clinic `P0` is now closed in GitHub instead of living in proof-branch limbo: PR `#603` merged the mainline clinic lane, and PR `#608` merged the post-merge `P2` cleanup for lazy clinic mock generation, default-enabled plugin metadata, runtime-env restore, OTLP-ready PR evidence, and checklist-batch isolation
- the merged clinic runtime/proof lane is now closed honestly: the clinic handoff-console follow-up rows (`Agent hands off to human operator...`, `Agent transfers immediately...`, `Agent redirects to human...`; currently `docs/requirements/checklist.md:425-427`) remain partial, but they are now tracked as explicit post-`P0` clinic-console work instead of blockers for booked-call/runtime `P0` closure
- local consolidation is now complete instead of aspirational: the current repo/worktree is the authoritative local checkout, and the old draft-branch `#589` path is dead
- local clinic runtime setup is now past the fake-ready stage: tenant `nfq_clinic_local` is active, `appointment_booking` is enabled, platform defaults version `local_k3d_defaults_20260319` exists, and governed agent `clinic-registration` is published for tenant `32c12c01-3dfb-4901-82ed-1ad709d8b7bf`
- the remaining blocker for a real inbound clinic call is no longer tenant setup or empty secrets. Local `platform-runtime-secrets` now carries the real Telnyx / LiveKit / Soniox values, the clinic tenant has a real DID mapping to governed agent `clinic-registration`, and the cluster pods were restarted onto that secret state
- the real blocker is public SIP/RTP reachability to the self-hosted `livekit-sip` service: local `k3d` runs self-hosted `livekit-livekit-server` plus `livekit-sip`, but the service is only reachable on the Docker bridge and local `*.localtest.me` hosts still resolve to `127.0.0.1`
- `POST /webhooks/livekit/room-started` is still the internal inbound-routing hop after SIP acceptance, but it is not the first missing network leg; Telnyx cannot reliably reach the laptop-local self-hosted SIP ingress until a public tunnel or public environment exists

Authoritative OTLP evidence from the latest inbound `k3d` clinic run:

```bash
tools/scripts/obs_traceql.sh 'trace_id:11111111111111111111111111111111' 2h | jq '[.batches[] | {service: ([.resource.attributes[] | select(.key=="service.name") | .value.stringValue][0]), spans: ([.scopeSpans[].spans[] | .name] | unique)}]'
```

```json
[
  {
    "service": "platform-api",
    "spans": [
      "http POST /webhooks/livekit/room-started"
    ]
  },
  {
    "service": "temporal-worker",
    "spans": [
      "temporal.activity:extract_call_data",
      "temporal.activity:grove.execute_post_call_workflows",
      "temporal.activity:grove.grove_post_call_activity",
      "temporal.activity:grove.persist_call_runtime_events",
      "temporal.activity:grove.persist_call_runtime_snapshot",
      "temporal.activity:grove.persist_transcript_segments",
      "temporal.activity:grove.pre_call_activity",
      "temporal.activity:platform.persist_call_extraction",
      "temporal.activity:platform.record_usage",
      "temporal.activity:platform.reserve_call_budget",
      "temporal.activity:platform_post_call_activity",
      "temporal.activity:sol.appointment_booking.record_post_call_action_receipt",
      "temporal.activity:sol.appointment_booking.render_appointment_reminder_sms",
      "temporal.activity:sol.appointment_booking.render_confirmation_sms",
      "temporal.activity:sol.appointment_booking.resolve_reminder_settings",
      "temporal.activity:sol.appointment_booking.sync_patient_record",
      "temporal.activity:sol.notifications.send_notification"
    ]
  }
]
```

```bash
tools/scripts/obs_logql.sh '{namespace="platform"} |= "df77a985-0aab-5af9-a460-d8b2117b985b"' 2h 50 | jq '[.data.result[] | {service: (.stream.service_name // .stream.service // .stream.app // "unknown"), samples: ((.values | map(.[1]))[:6])}]'
```

```json
[
  {
    "service": "temporal-worker",
    "samples": [
      "\u001b[2m2026-03-17T11:45:59.286354Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mgrove_post_call_activity      \u001b[0m \u001b[36mconversation_id\u001b[0m=\u001b[35m8aba6528-a848-58a7-8e09-b49b86edd34c\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mduration_ms\u001b[0m=\u001b[35m42000\u001b[0m \u001b[36mmessage_count\u001b[0m=\u001b[35m0\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36moutcome\u001b[0m=\u001b[35mcompleted\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35md29892287ba32390\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.890594Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mgrove_post_call_activity      \u001b[0m \u001b[36mconversation_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mduration_ms\u001b[0m=\u001b[35m42000\u001b[0m \u001b[36mmessage_count\u001b[0m=\u001b[35m0\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36moutcome\u001b[0m=\u001b[35mcompleted\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35m2fd2daf6e184f270\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.859706Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mpersist_call_runtime_snapshot \u001b[0m \u001b[36mcall_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcall_state\u001b[0m=\u001b[35mcompleted\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35md40d92a04d47f1cf\u001b[0m \u001b[36mtenant_schema\u001b[0m=\u001b[35mtenant_e2e0a0b2c06\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m \u001b[36mturn_count\u001b[0m=\u001b[35m1\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.835045Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mpersist_call_runtime_events   \u001b[0m \u001b[36mcall_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mevent_count\u001b[0m=\u001b[35m1\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35m9108584f1b2d6095\u001b[0m \u001b[36mtenant_schema\u001b[0m=\u001b[35mtenant_e2e0a0b2c06\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.822949Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mpersist_call_runtime_events   \u001b[0m \u001b[36mcall_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mevent_count\u001b[0m=\u001b[35m1\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35ma27e33ab8360775d\u001b[0m \u001b[36mtenant_schema\u001b[0m=\u001b[35mtenant_e2e0a0b2c06\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.819513Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mpersist_call_runtime_events   \u001b[0m \u001b[36mcall_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mevent_count\u001b[0m=\u001b[35m1\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35m1d0002926eeaa1c5\u001b[0m \u001b[36mtenant_schema\u001b[0m=\u001b[35mtenant_e2e0a0b2c06\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m",
      "\u001b[2m2026-03-17T12:03:27.795351Z\u001b[0m [\u001b[32m\u001b[1minfo     \u001b[0m] \u001b[1mpersist_call_runtime_snapshot \u001b[0m \u001b[36mcall_id\u001b[0m=\u001b[35mdf77a985-0aab-5af9-a460-d8b2117b985b\u001b[0m \u001b[36mcall_state\u001b[0m=\u001b[35min_progress\u001b[0m \u001b[36mcorrelation_id\u001b[0m=\u001b[35m00-11111111111111111111111111111111-2222222222222222-01\u001b[0m \u001b[36mmodule\u001b[0m=\u001b[35mgrove\u001b[0m \u001b[36mspan_id\u001b[0m=\u001b[35m9a16300599f81bcc\u001b[0m \u001b[36mtenant_schema\u001b[0m=\u001b[35mtenant_e2e0a0b2c06\u001b[0m \u001b[36mtrace_id\u001b[0m=\u001b[35m11111111111111111111111111111111\u001b[0m \u001b[36mturn_count\u001b[0m=\u001b[35m1\u001b[0m"
    ]
  },
  {
    "service": "platform-api",
    "samples": [
      "INFO:     10.42.1.4:37776 - \"GET /observability/runs/call_session/df77a985-0aab-5af9-a460-d8b2117b985b HTTP/1.1\" 200 OK",
      "INFO:     10.42.1.4:37776 - \"GET /calls/df77a985-0aab-5af9-a460-d8b2117b985b/trace HTTP/1.1\" 200 OK",
      "INFO:     10.42.1.4:37776 - \"GET /clinic/booking-results/df77a985-0aab-5af9-a460-d8b2117b985b HTTP/1.1\" 200 OK",
      "{\"call_id\": \"df77a985-0aab-5af9-a460-d8b2117b985b\", \"correlation_id\": \"00-11111111111111111111111111111111-2222222222222222-01\", \"event\": \"Started InboundCallOrchestratorWorkflow\", \"level\": \"info\", \"logger\": \"platform_core.voice.webhook\", \"room_name\": \"e2e-clinic-confirmed-6450f611\", \"span_id\": \"492e95f79dbf6c9c\", \"tenant_id\": \"88f6483d-46c6-48e6-918c-5d1057050789\", \"timestamp\": \"2026-03-17T12:03:27\", \"trace_id\": \"11111111111111111111111111111111\", \"workflow_id\": \"platform.inbound/df77a985-0aab-5af9-a460-d8b2117b985b\"}"
    ]
  }
]
```

```bash
tools/scripts/obs_promql.sh 'first_speech_latency_ms_count{tenant_id="88f6483d-46c6-48e6-918c-5d1057050789",outcome="completed"}' | jq '.data.result'
```

```json
[
  {
    "metric": {
      "__name__": "first_speech_latency_ms_count",
      "container": "temporal-worker",
      "endpoint": "health",
      "instance": "10.42.1.32:8081",
      "job": "platform-temporal-worker",
      "namespace": "platform",
      "outcome": "completed",
      "pod": "platform-temporal-worker-5d69677cdf-d9gw9",
      "service": "platform-temporal-worker",
      "tenant_id": "88f6483d-46c6-48e6-918c-5d1057050789"
    },
    "value": [
      1773749277.979,
      "1"
    ]
  }
]
```

Negative log proof from the same live run:

```bash
tools/scripts/obs_logql.sh '{namespace="platform"} |= "df77a985-0aab-5af9-a460-d8b2117b985b" |= "notification_deliveries"' 2h 20 | jq '.data.result'
```

```json
[]
```

```bash
tools/scripts/obs_logql.sh '{namespace="platform"} |= "df77a985-0aab-5af9-a460-d8b2117b985b" |= "record_delivery"' 2h 20 | jq '.data.result'
```

```json
[]
```

Do not dilute P0 with:

- generic simulation sandbox UI
- VOX widget polish
- broad observability redesign not required for clinic operator flow
- a brand-new standalone clinic console if `/call-ops`, `/call-ops/history`, `/bookings`, and `/observability` can satisfy the operator journey

### P1: Finish V2 Phase 1 Only

Why second:

- It improves real operator/admin ergonomics now.
- It is the least speculative V2 slice.
- It supports both NFQ and VOX without requiring a full channel/runtime leap.

Current status:

- implementation is complete and merged as PR `#575`
- there is no remaining honest Phase 1 scope unless a regression appears
- if this lane expands into Phase 2 or Phase 3 work under the excuse of "cleanup", that is self-inflicted trash

Definition of done:

- Connector governance is schema-first enough that operators are not editing mystery JSON.
- Package governance and artifact/profile boundaries are enforced cleanly enough that later V2 work does not rot immediately.

Primary V2 target:

- `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md:2617-2656`

Concrete task stack:

1. Keep package/discovery/profile enforcement boring and mechanical.
2. Refuse any "while we're here" Phase 2/3 spillover.
3. Do not reopen schema/catalog scope unless a real `P1` or `P2` review finding proves something is still wrong.

### P2: Solution Workbench Composition And Client Distribution

**Status: In progress; implementation landed, but M12 still has real remaining work (2026-03-26)**

What shipped:

- `SolutionUIManifest` type + per-solution manifests (`#616` DONE)
- Manifest-driven nav in `tenant-shell.tsx` replacing hardcoded solution conditionals (composition landed; `#617` still open for landing-route resolution)
- Solution UI moved from `apps/web/src/features/` to `apps/web/src/solutions/` with API clients and dashboard widgets
- Export script `tools/scripts/export-client.sh` with client manifests for NFQ/VOX (`#619` DONE)
- Architecture isolation tests enforcing no cross-solution imports
- Shared tenant pages now consume generated manifest/widget registries plus shared `lib/api/*` wrappers so exported client builds do not import stripped `apps/web/src/solutions/*` sources
- Tenant shell now composes different nav sections for `client_operator` vs `client_admin` from the same manifest registry (`#615` still open until repo-standard UI proof is backfilled)
- Shared observability workspace now accepts solution-contributed coverage metadata instead of a closed hard-coded subject list (`#618` partial)
- Structured agent settings editor replacing raw YAML textarea with form panels
- Agent definition UX: list/detail split, dynamic starters, flow preview, one-click publish (PR #634)

What remains:

- `#615` repo-standard shell/layout UI proof backfill
- `#617` landing-route precedence beyond the current static role map
- `#618` deeper queue/case/evidence enrichers beyond coverage metadata

Primary checklist targets:

- `docs/requirements/checklist.md:45` — **ADVANCED** by manifest-driven composition
- `docs/requirements/checklist.md:51` — **ADVANCED** by export script + client manifests
- `docs/requirements/checklist.md:54` — **ADVANCED** by manifest-owned observability coverage in the shared workspace; still not closed

Remaining concrete tasks:

1. Backfill the M12 T06 shell/layout proof package so `#615` can close honestly.
2. Finish M12 T02 landing-route precedence so `#617` stops at a static role map.
3. Keep `#618` focused on richer shared case/evidence primitives instead of inventing another observability page.

### P2b: VOX Readiness Prep For Week 0

Why third:

- VOX starts in two weeks.
- VOX has hard blockers that should be made explicit before execution starts.
- Pretending VOX can start from current state without this prep is trash.

Definition of done:

- One brutally clear VOX start plan exists.
- VOX blockers vs “startable now” scope is explicit.
- The team knows which items are foundation, which are phase-1 critical, and which are deferred.

Primary checklist targets:

- `docs/requirements/checklist.md:40-41`
- `docs/requirements/checklist.md:123-133`
- `docs/requirements/checklist.md:209`

Concrete task stack:

1. Read and normalize `docs/requirements/vox.md` into checklist-mapped work packages.
2. Use the workbench/distribution contract from issues `#614-#619` to separate “startable with current repo” from “blocked by missing APIs/workflows”.
3. Freeze the VOX week-0 scope to public ingress, widget/chat, lead capture/delivery, and KB approval fundamentals.
4. Refuse to blend VOX Phase 1 with later VOX nurture/scheduling/OMA fantasies.

### P2c: NFQ Source Distribution Separation

Why in the same priority band:

- source handoff is not solved by runtime gating or hidden nav
- NFQ receiving VOX/private solution code would be amateur-hour failure
- this is now directly coupled to the workbench composition contract and the customer source-export boundary

Definition of done:

- NFQ handoff is allowlist-based and mechanically reproducible
- excluded VOX/private solutions and tests are physically absent from the export
- proof runs against the filtered export, not against upstream trust

Concrete task stack:

1. Reactivate `docs/milestones/exec-plans/nfq_source_distribution_separation.md` with the new workbench/distribution contract in mind.
2. Turn the current profile/export ideas into one mechanical export/check pipeline.
3. Prove what NFQ receives with filtered-source checks instead of “we won't ship that folder” nonsense.

### P3: NFQ Requirements Sanity Pass

Why fourth:

- NFQ is closer to shipped truth than VOX.
- This is mostly a sanity pass, not a greenfield plan.

Definition of done:

- `docs/requirements/nfq.md` is mapped to current checklist truth.
- Remaining NFQ delivery gaps are explicit and ranked.

Concrete task stack:

1. Review `docs/requirements/nfq.md`.
2. Mark “already true”, “partial”, and “missing”.
3. Keep only the remaining NFQ gaps that still matter after clinic completion.

## 6. Why V2 Phase 2/3 Are Not Active Yet

### Why not V2 Phase 2 now

`docs/milestones/exec-plans/v2_canonical_architecture_refresh.md` Phase 2 is a control-plane rewrite across the same surfaces clinic still needs for last-mile closure:

- `apps/api/src/platform_api/routes/calls.py`
- `apps/api/src/platform_api/routes/observability.py`
- `apps/web/src/app/(tenant)/call-ops/page.tsx`

Starting that while clinic handoff and operator continuity are still partial is how you create churn, merge pain, and two half-true control-plane stories at once.

### Why not V2 Phase 3 now

Phase 3 is the web-chat / public-ingress / website-sales surface. It is strategically important for VOX, but it is still a larger cross-layer move:

- new public ingress contracts
- widget/chat session runtime
- public chat UI/API surfaces
- content/guardrail binding

That work should start only after:

1. clinic P0 is stable enough that it stops stealing operational attention
2. V2 Phase 1 governance is strong enough that Phase 3 does not start from schema/config chaos
3. VOX week-0 scope is frozen so the team does not build the wrong public surface

## 7. Parallel Work Model

These tracks can run in parallel without lying to ourselves about coupling.

### Lane A: Clinic closure

Scope:

- `apps/web/src/app/(tenant)/call-ops/**`
- `apps/web/src/solutions/appointment-booking/**`
- clinic-focused solution polish in `solutions/appointment_booking/**`

Output:

- booked-in-k3d clinic flow
- full-conversation visibility in UI
- latency truth in operator UI
- clinic handoff continuity
- bookings follow-up clarity
- operator-friendly UX proof

### Lane B: V2 Phase 1 governance

Scope:

- `packages/platform-core/**` connector/catalog/schema work
- `apps/api/**` connector/schema exposure
- minimal `apps/web/**` connector UI/API glue only if required for schema-first operator UX

Output:

- schema-first connector governance
- package/profile/artifact enforcement

### Lane C: VOX start-plan normalization

Scope:

- `docs/requirements/vox.md`
- `docs/requirements/checklist.md`
- execution planning docs only

Output:

- one week-0 VOX plan with explicit blockers, startable slices, and deferrals

### Lane D: NFQ sanity pass

Scope:

- `docs/requirements/nfq.md`
- checklist reconciliation only

Output:

- explicit remaining NFQ gap list after clinic close

### Lane E: NFQ source distribution separation

Scope:

- `docs/milestones/exec-plans/nfq_source_distribution_separation.md`
- `docs/milestones/exec-plans/nfq-source-distribution-release-migration-plan.md`
- `docker/profiles/**`
- artifact/source export and test-partition planning only

Output:

- one NFQ source-handoff plan that makes source boundaries and test boundaries explicit
- no fake claim that build-profile Dockerfiles alone solve source-code handoff

### Work that should not run in parallel right now

- V2 Phase 2 control-plane rewrite
- V2 Phase 3 web-chat/channel-runtime buildout
- simulation/test console UI
- traffic-splitting UI
- broad observability redesign beyond clinic/operator truth
- repo-wide test-tree reorganization not directly needed for the first NFQ source-handoff slice

## 8. Current PR Queue Mapping

Use the current PR queue as execution lanes, not as independent hobby branches.

### Directly aligned with current priority

- `fix(web): harden admin UI workflows and observability surfaces` -- supports deployment/operator usability; keep only work that helps clinic/admin truth
- `feat(platform): finish v2 phase 1 connector governance` -- this is the right V2 slice now
- `feat(observability): harden admin UX and deepen v2 case detail` -- keep only if it improves clinic/operator reality or V2 Phase 1 grounding

### Useful, but below clinic finish line

- `feat(observability): normalize channel session runs` -- pull it upward only if it materially improves transcript/latency consistency for the clinic operator flow

### VOX/public-ingress relevant but should not steal clinic focus this week

- `feat(public-ingress): add privacy offboard cleanup hooks`
- `feat(reports): add public response-time truth`
- `feat(reports): add widget analytics intake`
- `feat(reports): add public ingress KPI truth`
- `feat(api): add v2 public registration links`
- `feat(api): add v2 public recommendations`
- `feat(api): add v2 public escalation handoff`

### Hygiene but not strategic driver

- `fix(ci): repair stalled scheduler suites`

## 9. Completion Estimate

Treat these numbers as management truth, not fake precision.

### Clinic booking slice

Checklist rows `413-429` currently show:

- `14` repo-complete rows
- `3` partial rows

That is about `91%` complete by raw checklist-row coverage.

Do not trust that number blindly.

The raw checklist still shows the hard last-mile operator rows:

- `424`
- `425`
- `426`

The clarified P0 bar in this tracker is stricter and narrower than the raw row count:

- booked outcome in local `k3d` without real clinic integrations
- full conversation visible in UI
- latency truth visible in UI

Booked-call/runtime clinic `P0` should now be managed as `100%`.

Why:

- the booked-outcome path, transcript visibility, latency truth, and authoritative local `k3d` proof lane are real and merged
- the closing PRs for that runtime/proof work are merged: `#603` for clinic `P0` mainline and `#608` for the clinic follow-up `P2`s
- the checklist now treats the clinic handoff-console follow-up rows (`Agent hands off to human operator...`, `Agent transfers immediately...`, `Agent redirects to human...`; currently `docs/requirements/checklist.md:425-427`) as explicit post-`P0` work instead of runtime-proof blockers
- pretending that follow-up is finished would still be trash, but it is no longer a reason to say the booked-call/runtime `P0` lane itself is open

### Clinic console follow-up

Manage this as roughly `60-70%`.

Why:

- the backend handoff routes, urgency metadata, and operator continuity path are real
- the repo still does not have a full clinic support console with unified logs/audio/support workflow depth
- those rows remain partial in `docs/requirements/checklist.md:425-427`, but they are now tracked separately from booked-call/runtime `P0`

### V2 Phase 1

Manage this as `100%`.

Why:

- implementation is done and merged
- PR `#575` is already closed by merge
- there is no remaining Phase 1 product scope to argue about unless a regression appears

### VOX week-0 readiness

Manage as roughly `10-15%`.

Why:

- blockers are visible
- some public-ingress foundation work is landing
- but the actual VOX start contract is not normalized or frozen yet

### NFQ source distribution separation

Manage as `80-85%`.

Why:

- export script `tools/scripts/export-client.sh` is real and tested
- client manifests `distribution/clients/{nfq,vox}.yaml` define contracted solutions
- architecture isolation tests enforce no cross-solution imports
- solution UI is now isolated in `apps/web/src/solutions/` with per-solution manifests
- remaining gap: API route-level filtering for non-contracted solution routes inside `apps/api/` (future work)

## 10. What Not To Start Yet

These are rabbit holes unless P0 and P1 are under control:

- full simulation/test console UI for governed agents
- traffic-splitting UI
- generalized deployment-wide “perfect observability” rebuild
- a new observability information architecture beyond what is already captured in the observability plans
- broad V2 Phase 2 control-plane rewrite
- V2 Phase 3 channel/runtime expansion beyond what VOX start actually needs
- generic solution-management UI framework
- billing/pricing/admin polish not tied to an immediate requirement

Post-P0 cleanup backlog:

- remove redundant `solution_slug` usage if `solution_name` is already the stable machine/public key; this is now allowed only as post-`P0` cleanup, not as a reason to reopen clinic delivery

## 11. Weekly Execution Board

### This Week

Strict cap: only the first three outcomes count as this week's real work.

- [ ] Open and merge the architecture/delivery-protection PR that lands `solution_workbench_composition_and_distribution_plan.md` plus the relevant `k3d` local-stack/script doc updates
- [ ] Use issues `#614-#619` to lock the workbench/source-handoff backlog before VOX implementation starts pretending it has a shell contract
- [ ] Read `docs/requirements/vox.md` and convert it into a week-0 VOX start plan

Only if the three items above are under control:

- [ ] Reactivate the NFQ handoff lane with an explicit allowlist + test partition anchored to the shared workbench/source-handoff contract
- [ ] Decide how the post-`P0` clinic-console follow-up rows (`docs/requirements/checklist.md:425-427`) should be sequenced without pretending they are already complete

### Next Week

- [ ] Freeze VOX critical path: public ingress, widget/chat, KB approval, lead capture/delivery
- [ ] Decide explicitly what is blocked vs what can start
- [ ] Turn NFQ source separation into a mechanical profile/export/check pipeline instead of a draft promise
- [ ] Keep M12 aligned with reality: T06 proof backfill, T02 landing-route precedence, T08/T09 shared observability enrichers

### Week After VOX Kickoff

- [ ] Start only the VOX slices that are startable without lying
- [ ] If public-ingress/widget foundations are still partial, keep VOX delivery framed as foundation-first, not fake feature-complete

## 12. Progress Tracker

| Lane | Priority | Status | Owner | Next move | Exit condition |
| --- | --- | --- | --- | --- | --- |
| NFQ clinic booked-call/runtime proof | P0 | Complete | Jakit | keep the merged proof path from PRs `#603` and `#608` stable and do not reopen it unless a real regression appears | clinic call can book in local `k3d` and the operator can inspect transcript + latency truth in UI |
| Clinic handoff/support console follow-up | P0 follow-up | In progress | Jakit | complete the clinic handoff-console rows in `docs/requirements/checklist.md:425-427` without pretending they still block booked-call/runtime `P0` closure | the clinic handoff/support console rows are `Repo ✅` or explicitly de-scoped further |
| V2 Phase 1 connector governance | P1 | Complete | Jakit | do not reopen scope unless a real regression appears; PR `#575` is merged | PR `#575` is merged or explicitly blocked by an external dependency |
| Solution workbench composition + client distribution | P2 | In progress | Jakit | keep M12 aligned with reality: `#615` UI-proof backfill, `#617` landing-route resolution, `#618` shared observability enrichers | `#615` closed with repo-standard UI proof recorded, `#617` closed, `#618` closed |
| VOX readiness plan | P2 | Pending | Jakit | normalize `vox.md` into deliverable scope using the workbench/source-handoff contract from issues `#614-#619` | one explicit start plan with blockers and week-0 scope |
| NFQ source distribution separation | P2 | Substantially complete | Jakit | export script + client manifests + isolation tests shipped in PR `#625`; remaining: API route filtering in `apps/api/` | NFQ can receive only in-scope source and tests without VOX/other-solution leakage |
| NFQ sanity pass | P3 | Pending | Jakit | review `nfq.md` after clinic close | NFQ remaining gaps are explicit and ranked |

## 13. Decision Filter

Before starting any new task, ask:

1. Does this close a clinic row in `413-430`?
2. If not, does it make the booked-in-k3d clinic flow or transcript/latency truth more real?
3. If not, does it close V2 Phase 1?
4. If not, does it unblock VOX start in two weeks?
5. If not, is it strictly required for NFQ source handoff?
6. If not, why are we touching it now?

If the answer to checks 1-5 is "no", it is probably a distraction wearing architecture makeup.
