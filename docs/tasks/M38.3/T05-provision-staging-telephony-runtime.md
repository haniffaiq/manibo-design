# T05: Provision Dedicated Staging Telephony and Runtime Seed Data

> **Milestone**: M38.3-nfq-gcp-staging-environment
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T04

## Description

Provision staging-only telephony resources and seed the platform runtime state
needed for a real call. This task connects the self-hosted LiveKit staging
runtime to a dedicated Telnyx DID and the NFQ tenant routing model.

## Subtasks

- [ ] **Dedicated DID**: Assign or purchase a staging DID that is not used by
      production, local, or CI.
- [ ] **Telnyx route**: Configure the staging Telnyx FQDN/SIP connection through
      codified scripts.
- [ ] **LiveKit SIP resources**: Use the self-hosted setup path to create
      staging inbound/outbound trunks and dispatch rules.
- [ ] **Secret bundles**: Store the resulting staging IDs and credentials in
      staging Secret Manager bundles.
- [ ] **Platform seed**: Seed tenant, published agent, trunk inventory, and
      phone-channel routing rows for staging.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/infra/setup_livekit_sip.py` | Modify if needed | Keep self-hosted staging provisioning deterministic |
| `tools/scripts/_setup_sip_telnyx.py` | Modify if needed | Keep Telnyx FQDN auth/route sync deterministic |
| `infrastructure/scripts/gcp/staging/**` | Create/Modify | Staging bootstrap entrypoints |
| `tests/architecture/test_setup_livekit_sip.py` | Modify if needed | Guard staging self-hosted provisioning contract |
| `docs/tasks/M38.3/PROGRESS.md` | Modify | Record resource IDs without secret payloads |

## Implementation Notes

- Do not reuse `+37052002593`; that number is currently routed to NFQ
  production.
- Do not print SIP passwords or Secret Manager payloads.
- Record non-secret identifiers: Telnyx connection ID, DID, LiveKit trunk IDs,
  dispatch rule ID, and platform `phone_channel_id`.

## Acceptance Criteria

- [ ] Staging has a dedicated DID.
- [ ] Telnyx routes the staging DID to the staging self-hosted SIP edge.
- [ ] LiveKit staging inbound and outbound trunks exist.
- [ ] Platform routing resolves the staging DID to tenant `nfq` and the staging
      agent.
- [ ] Runtime identifiers are stored in staging Secret Manager, not in git.

## References

- Milestone: `docs/milestones/M38.3-nfq-gcp-staging-environment.md`
- Related: `wiki/research/2026-04-16-telnyx-environment-number-ownership.md`
