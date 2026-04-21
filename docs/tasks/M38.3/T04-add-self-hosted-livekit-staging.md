# T04: Add Self-Hosted LiveKit and LiveKit SIP to GCP Staging

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03

## Description

Deploy self-hosted LiveKit Server and LiveKit SIP in the NFQ GCP staging
cluster. This is the key staging difference from production, which currently
uses LiveKit Cloud.

## Subtasks

- [ ] **LiveKit Server**: Add staging manifests or Helm values for LiveKit
      Server with staging API keys and webhook configuration.
- [ ] **LiveKit SIP**: Add staging LiveKit SIP runtime with public SIP/RTP
      reachability.
- [ ] **Network contract**: Codify firewall, service, and load-balancer
      requirements for SIP signaling, RTP, and WebRTC.
- [ ] **Runtime mode**: Set `LIVEKIT_DEPLOYMENT_MODE=self_hosted` and use
      self-hosted API/WS/browser URLs in staging config.
- [ ] **Health proof**: Verify LiveKit and SIP readiness before provisioning
      carrier resources.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/kubernetes/overlays/gcp/staging/**livekit**` | Create/Modify | Staging LiveKit Server and SIP manifests or values |
| `infrastructure/terraform/gcp/nfq/environments/staging/**` | Modify | Firewall, public IP, or load-balancer inputs required for SIP/RTP |
| `tests/architecture/nfq/gcp/test_staging_overlay_runtime_contracts.py` | Modify | Guard self-hosted LiveKit mode and ports |
| `docs/tasks/M38.3/PROGRESS.md` | Modify | Track LiveKit readiness and network evidence |

## Implementation Notes

- LiveKit Cloud URLs must not appear in the staging rendered runtime config.
- The Telnyx carrier path needs reachable SIP signaling and media. Kubernetes
  readiness alone is not proof.
- Keep LiveKit webhook routing internal where practical; expose only what the
  carrier and browser clients require.

## Acceptance Criteria

- [ ] Staging LiveKit Server and LiveKit SIP are deployed and ready.
- [ ] Staging exposes required SIP/RTP/WebRTC paths.
- [ ] Staging runtime config declares `LIVEKIT_DEPLOYMENT_MODE=self_hosted`.
- [ ] A synthetic or CLI LiveKit room check succeeds before real PSTN testing.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Related: `wiki/systems/voice.md`
