# Execution Plan: Clinic Go-Live Gate Checklist

> **Status:** Active
> **Created:** 2026-03-19
> **Owner:** Jakit
> **Track:** Go-live readiness / NFQ clinic

## 1. Goal

Turn the current clinic delivery truth into a blunt go-live gate so the team stops confusing:

- booked-call/runtime proof
- post-`P0` clinic-console depth
- NFQ source-handoff separation
- external legal/ops obligations

This checklist is for deciding whether clinics can go live, not for inventing more scope.

## 2. Source Anchors

- `docs/requirements/checklist.md:424-430`
- `docs/requirements/checklist.md:425-427`
- `docs/requirements/checklist.md:51`
- `docs/requirements/checklist.md:53-54`
- `docs/requirements/checklist.md:270-271`
- `docs/requirements/nfq.md`
- `docs/milestones/exec-plans/clinic_v2_vox_nfq_priority_tracker.md`
- `docs/milestones/exec-plans/nfq_source_distribution_separation.md`
- `docs/milestones/exec-plans/solution_workbench_composition_and_distribution_plan.md`
- `docs/milestones/exec-plans/compose_to_k3d_migration_and_test_split_plan.md`

## 3. Decision Rule

Use three buckets only:

- `Must-have before clinic go-live`
- `Can wait after first clinic launch`
- `External / commercial / legal`

Do not let post-`P0` UX debt pretend to be a runtime blocker.
Do not let runtime proof pretend to solve NFQ source-handoff separation.

## 4. Gate Table

| Area | Gate | Checklist / source anchor | Status | Bucket | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime truth | A real clinic call can complete in local `k3d` and end as `confirmed` without requiring a real clinic-system integration | `checklist.md:424,428-430`; `clinic_v2_vox_nfq_priority_tracker.md` | Mostly done | Must-have | Jakit | Repo already has deterministic `k3d` proof and merged clinic runtime lane; this still needs one fresh live proof in the exact launch path. |
| Operator evidence | Operators can inspect the same call in `/call-ops`, `/call-ops/history`, `/bookings`, and `/observability` without guessing | `checklist.md:226-233`, `424`, `430`, `53-54` | Mostly done | Must-have | Jakit | Existing product path is good enough for launch if the real call lands cleanly and evidence is visible. |
| Live production-style proof | One real call through the actual telephony path is observed end to end with transcript + logs + traces + metrics | `checklist.md:53-54`; `clinic_v2_vox_nfq_priority_tracker.md` | Open | Must-have | Jakit | This is the real confidence gate. `k3d` proof alone is not production proof. |
| Telephony readiness | Real inbound number / SIP routing is configured for the clinic launch tenant | `nfq.md`; `checklist.md` telephony rows | Open | Must-have | Jakit + NFQ ops | Do not claim launch if the number path still depends on a mock or half-wired route. |
| Booking fallback | If scheduling/CRM/SMS providers are absent or degraded, staff still have a clear manual operating path | `checklist.md:424,430` | Partially done | Must-have | Jakit + clinic ops | Current follow-up workspace is the fallback path; verify staff can actually use it during launch. |
| Handoff metadata | `handoff_reason` and structured call outcome persist into the call record | `checklist.md:428-429` | Done in repo | Must-have | Jakit | Required for operational trust and post-call handling. |
| Follow-up ownership | Staff can claim, assign, and resolve pending / failed / handed-off bookings | `checklist.md:430` | Done in repo | Must-have | Jakit | Already implemented; verify against the real tenant and real call. |
| Deployed login / access | Real operators can sign in and use the clinic tenant without auth breakage | `checklist.md:56`; `clinic_v2_vox_nfq_priority_tracker.md` | Open / must re-verify | Must-have | Jakit | If deployed login is unstable, launch is theater. |
| Post-`P0` clinic console | Rich handoff/support workflow for insurance, urgent transfer, and medical-question redirect | `checklist.md:425-427` | Partial | Can wait | Jakit | Keep visible, but do not lie that it blocks booked-call/runtime launch unless NFQ contract says so. |
| Unified support console | One polished clinic support console with logs/audio/unified support workflow | `checklist.md:425-427`; tracker follow-up note | Partial | Can wait | Jakit | This is product depth, not day-one launch truth. |
| Observability polish | Full single-rail transcript/log/audio timeline and deeper compare/incident surfaces | `checklist.md:53-54` | Partial | Can wait | Jakit | Important, but not the same as “can operators see enough evidence to work.” |
| NFQ source-handoff separation | NFQ receives only allowed shared code + allowed solutions; VOX/private code is physically excluded | `checklist.md:51`; `nfq_source_distribution_separation.md`; `solution_workbench_composition_and_distribution_plan.md` | Open | Must-have for NFQ source handoff | Jakit | This is a hard blocker for source delivery to NFQ, but not necessarily for proving one live clinic call. |
| Workbench separation | Shared workbench / manifest / export contract is real enough that NFQ clinic distribution does not leak VOX/private solution code | `checklist.md:45,51,54`; issues `#614-#619` | In progress | Must-have for NFQ source handoff | Jakit | Treat separately from the call-runtime proof. Live proof can happen first; source transfer cannot. |
| DPA / privacy / sub-processors | Customer legal and privacy launch paperwork is signed and disclosed | `checklist.md:270-271` and compliance rows | External | External / commercial / legal | Jakit + legal | Repo proof does not close this. |
| Provider launch ownership | On-call owner, rollback path, clinic operating instructions, and support escalation path are explicit | `nfq.md`; tracker | Open | Must-have | Jakit + NFQ ops | If nobody owns the launch window, do not launch. |

## 5.1 Current Local Checkpoint (2026-03-19)

What is actually true right now:

- local `grove-local` was rebuilt from scratch after Docker cleanup and stale `grove-ci-*` cluster removal
- required local workloads are healthy:
  - `platform-api`
  - `platform-temporal-worker`
  - `agent-worker`
  - `livekit-sip`
  - `platform-web`
  - `tempo`
  - `loki`
  - `prometheus`
- cluster-backed clinic proof is green again against `grove-local`:
  - `packages/platform-core/tests/e2e/test_wave9_clinic_booking_compose.py`
  - `packages/platform-core/tests/e2e/test_wave9_clinic_inbound_confirmed_booking_compose.py`
- local runtime is now provisioned far enough for a real NFQ clinic tenant path:
  - deployment-level platform defaults version `local_k3d_defaults_20260319` exists
  - tenant `nfq_clinic_local` is active
  - tenant `nfq_clinic_local` has `appointment_booking` enabled
  - governed agent definition `clinic-registration` is published for tenant `32c12c01-3dfb-4901-82ed-1ad709d8b7bf`
- local runtime config was manually corrected after `k3d` sync drift:
  - `NEXT_PUBLIC_SOLUTIONS=appointment_booking` is now live in the running `platform-web` and `platform-api` pods
  - this is a local runtime patch, not a real fix to the helper scripts

What is still blocking a true local carrier-backed clinic call:

- `infra/k8s/overlays/local-k3s/secrets.env` now exists and the cluster `platform-runtime-secrets` Secret has real LiveKit / Telnyx / Soniox values, including SIP credentials
- the tenant now has a real DID mapping in `public.phone_numbers`:
  - tenant `32c12c01-3dfb-4901-82ed-1ad709d8b7bf`
  - phone number `+37052002593`
  - SIP trunk `ST_g6mPqDTq3DDs`
  - governed agent `clinic-registration`
- the remaining blocker is public SIP/RTP reachability to the self-hosted `livekit-sip` service, not tenant setup or empty secrets:
  - local `k3d` does run self-hosted `livekit-livekit-server` plus `livekit-sip`
  - Telnyx-backed PSTN still requires public reachability to SIP signaling and RTP port ranges
  - the local `livekit-sip` service is only exposed on the Docker bridge (`EXTERNAL-IP 172.18.0.3`), which is not publicly reachable from Telnyx
  - `api.grove.localtest.me`, `app.grove.localtest.me`, and `sip.grove.localtest.me` resolving to `127.0.0.1` is additional proof that this stack is laptop-local, not carrier-reachable
  - `POST /webhooks/livekit/room-started` is still part of the inbound flow, but it is not the primary external blocker here; the PSTN call cannot hit the self-hosted SIP service cleanly in the first place without a public ingress path
- Soniox is available in the local cluster, but known clinic risk remains:
  - conversational Lithuanian STT is good enough to test
  - long digit / personal-code capture is still weaker than the happier-path conversation flows and should fail closed if it mishears

## 5. Launch Recommendation

### Clinics can launch when all of these are true

1. One real clinic call runs through the actual telephony path and reaches a valid booking or explicit handoff outcome.
2. The same call is visible in the operator product surfaces with enough evidence to act.
3. Real operator access works in the deployed environment.
4. Manual fallback handling is clear when automation or integrations fail.
5. Legal / privacy / support ownership is explicitly in place.

### Clinics should not wait for these

1. A perfect unified clinic handoff console.
2. A full logs/audio/transcript single-rail product.
3. Full workbench/source-handoff separation, unless the immediate step is handing source to NFQ.

### NFQ source handoff must still wait for these

1. Allowlist-based export lane.
2. Shared app-tree filtering that physically excludes VOX/private slices.
3. Workbench/solution composition contract landing far enough to make that export honest.

## 6. Immediate Next Proof

The highest-signal next step is:

1. Expose the self-hosted SIP path publicly or use a publicly reachable environment instead of the laptop-local `k3d` ingress.
2. Route one real Telnyx-backed inbound call to the registrator flow.
4. Confirm:
   - call reached the tenant
   - transcript persisted
   - booking outcome persisted
   - `/bookings`, `/call-ops/history`, `/observability` all show the same case
   - Tempo / Loki / Prometheus evidence exists for the exact call correlation
5. Record the result in the tracker before making any stronger launch claim.
