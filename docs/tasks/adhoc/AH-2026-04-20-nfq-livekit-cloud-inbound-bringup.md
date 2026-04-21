# AH-2026-04-20: NFQ LiveKit Cloud Inbound Bring-Up

> **Milestone**: Adhoc production operations
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: M38.1 public NFQ runtime readiness

---

## Description

Prepare NFQ production on GCP for one real inbound PSTN proof call using
LiveKit Cloud. This is not the M13.1 autonomous telephony evaluator
implementation; it is the manual production bring-up needed before automated
evaluation can compare LiveKit Cloud and self-hosted LiveKit latency.

## Process Note

This task file was created late after the user called out the workflow miss.
The production operations should have been tracked here and in the debug log
before live changes were made.

## Subtasks

- [x] **Preflight**: Confirm branch/worktree state and avoid working directly on `main`.
- [x] **LiveKit/Telnyx provisioning**: Create or verify HVA LiveKit Cloud SIP resources and Telnyx routing for the NFQ production DID.
- [x] **GKE runtime patch**: Point NFQ production runtime config/secrets at LiveKit Cloud mode and restart affected deployments.
- [x] **Platform routing seed**: Create the published appointment-booking agent, provider account, trunk, number, and live binding rows after a rolled-back dry run.
- [x] **Cloud webhook**: Create and verify the HVA LiveKit Cloud webhook to `https://api.nfq.jakitlabs.com/webhooks/livekit/room-started`.
- [x] **Outbound API-style call attempt**: Place one controlled API-route-equivalent outbound call to `+37062700969` and capture LiveKit, platform, workflow, transcript, and outcome evidence.
- [x] **Automated inbound dial attempt**: Place one controlled provider-originated call attempt toward the NFQ DID and record whether it exercises the inbound path.
- [x] **Live inbound call proof**: Capture LiveKit, platform, workflow, and agent evidence from a successful inbound call.
- [x] **Codification plan**: Decide whether runtime values are codified through GitOps or GCP Secret Manager and record the follow-up.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md` | Create | Durable production bring-up log and evidence ledger |
| `docs/tasks/adhoc/AH-2026-04-20-nfq-livekit-cloud-inbound-bringup.md` | Create | Adhoc tracking task for the manual production proof |
| `docs/tasks/M38.1/PROGRESS.md` | Modify | Cross-link NFQ production telephony proof state from active NFQ readiness work |
| `wiki/log.md` | Modify | Session-level changelog entry |

## Acceptance Criteria

- [x] LiveKit Cloud SIP resources exist for the NFQ DID.
- [x] NFQ production runtime is configured for LiveKit Cloud mode.
- [x] NFQ production platform routing resolves `+37052002593` to a published appointment-booking voice agent.
- [x] HVA LiveKit Cloud webhook is configured and verified.
- [x] One API-style outbound call attempt is executed and classified.
- [x] One provider-originated inbound call attempt is executed and classified.
- [x] One live inbound call reaches platform orchestration and creates durable call evidence.
- [x] Runtime drift is either codified or named as follow-up before launch readiness is claimed.

## Completion Evidence

- Successful proof call command id:
  `nfq-inbound-final-codec-20260420T120112Z`
- LiveKit room: `call-_+37066106088_8Y7kEMYLfZRa`
- LiveKit room sid: `RM_XKR6ndRi4XXi`
- LiveKit participants:
  - `sip_+37066106088`
  - `agent-AJ_7h8rfWdgWh9t`
- Platform workflow:
  `platform.inbound/6f56529d-b30d-5e2a-81af-72ca79fff8f0`
- Telnyx inbound leg recorded `call.answered` and later normal clearing.
- Agent worker completed the first greeting turn:
  `voice_turn_complete flow_node=greeting latency_ms=9398 llm_roundtrips=1`.

Secret/codification follow-up completed in M38.2:

- NFQ GCP production runtime secret source of truth is GCP Secret Manager.
- External Secrets Operator syncs runtime bundles into Kubernetes Secrets.
- Reloader rolls affected Deployments after synced Secret/ConfigMap changes.
- ESO/Reloader and the runtime `ExternalSecret`/`ClusterSecretStore` readiness
  path now have NFQ/GCP Cloud Monitoring alert coverage in IaC.
- The `agent-worker` metrics-port conflict discovered during outbound proof is
  codified with `GROVE_AGENT_METRICS_PORT=9090` and `health:8081`.
- The Telnyx/LiveKit SIP credential drift discovered during outbound proof is
  codified in the setup scripts and architecture tests.

Outbound proof evidence:

- Call id: `93170626-9181-47a6-8b8e-394ca05a7821`
- Workflow id: `grove.call/93170626-9181-47a6-8b8e-394ca05a7821`
- Source: `+37052002593`
- Destination: `+37062700969`
- LiveKit room id: `RM_UQPMda68Vsvg`
- LiveKit participants:
  - `sip-93170626-9181-47a6-8b8e-394ca05a7821`
  - `agent-AJ_LkjxeDXDfRrk`
- Telnyx events: `call.initiated`, `call.bridged`, `call.answered`,
  `call.hangup normal_clearing`.
- Agent worker completed four voice turns, including `greeting latency_ms=1544`.
- Database evidence: `tenant_nfq.calls.state=completed`,
  `tenant_nfq.call_runtime_events=57`, `tenant_nfq.call_transcript_segments=8`.
- User confirmed the outbound handset received the call.

Launch-readiness follow-ups:

- route model still needs first-class outbound trunk resolution; this proof used
  explicit outbound trunk `ST_JPke2tbehKut`.
- outbound LiveKit rooms currently also start an inbound orchestrator.
- completed call row still leaves `outcome` and `ended_at` null.

## References

- Debug log: `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`
- Related progress: `docs/tasks/M38.1/PROGRESS.md`
- Evaluation planning: `docs/milestones/M13.1-telephony-autonomous-evaluation.md`
