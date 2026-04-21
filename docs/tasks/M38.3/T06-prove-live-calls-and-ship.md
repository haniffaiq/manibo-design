# T06: Prove Live Calls, Compare Latency, and Ship the PR

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T05

## Description

Close M38.3 with live staging proof, latency comparison against production
LiveKit Cloud, documentation, and PR cleanup.

## Subtasks

- [ ] **Inbound proof**: Complete one real inbound PSTN call through staging
      self-hosted LiveKit.
- [ ] **Outbound proof**: Complete one real outbound PSTN call from staging.
- [ ] **Latency comparison**: Capture per-turn latency and compare against the
      production LiveKit Cloud baseline from 2026-04-20.
- [ ] **Observability proof**: Verify ESO/Reloader, workload, LiveKit, SIP,
      carrier, and call-runtime signals are visible.
- [ ] **Documentation**: Update the debug log, milestone progress, and
      `wiki/log.md`.
- [ ] **GC pass**: Remove any temporary staging scripts, comments, or unused
      config that should not ship.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md` | Modify | Link staging comparison results or move shared launch-readiness notes |
| `wiki/debug/YYYY-MM-DD-nfq-gcp-staging-livekit-bringup.md` | Create | Staging bring-up and live-call evidence |
| `docs/tasks/M38.3/PROGRESS.md` | Modify | Final task and verification status |
| `docs/milestones/M38.3-nfq-gcp-staging-environment.md` | Modify | Completion evidence |
| `wiki/log.md` | Modify | Append staging completion summary |

## Implementation Notes

- Use the same evidence shape as the production proof: carrier event IDs,
  LiveKit room, platform `call_id`, workflow id, worker logs, DB evidence, and
  per-turn latency.
- If staging self-hosted LiveKit is slower or unreliable, record that plainly.
  The goal is a truthful comparison, not proving a preferred answer.
- Do not switch production based only on one call. The result should feed the
  next launch-readiness decision.

## Acceptance Criteria

- [ ] Inbound staging call succeeds.
- [ ] Outbound staging call succeeds.
- [ ] Latency evidence is captured and compared to the production LiveKit Cloud
      baseline.
- [ ] Docs and task progress are updated.
- [ ] PR body can link to design, milestone, task progress, debug evidence, and
      verification commands.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Production baseline: `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`
