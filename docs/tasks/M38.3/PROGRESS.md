# M38.3 Progress

## Status

Planning-only task pack created on 2026-04-20. Execution starts only after
explicit human activation of M38.3.

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Activate the staging Terraform contract and state | Not Started | - |
| T02 | Create the GCP staging Kubernetes overlay and public edge contract | Not Started | - |
| T03 | Codify staging Secret Manager, ESO, and Reloader sync | Not Started | - |
| T04 | Add self-hosted LiveKit and LiveKit SIP to GCP staging | Not Started | - |
| T05 | Provision dedicated staging telephony and runtime seed data | Not Started | - |
| T06 | Prove live calls, compare latency, and ship the PR | Not Started | - |

## Scratchpad

Objective: build a real NFQ GCP staging environment and use it to compare
self-hosted LiveKit latency against the production LiveKit Cloud baseline.

Assumptions:

- M38 created the staging Terraform root structure but did not create a
  deployable runtime overlay.
- M38.2 established GCP Secret Manager + ESO + Reloader as the NFQ/GCP
  production source-of-truth pattern.
- Staging must not reuse production DIDs, Telnyx resources, LiveKit resources,
  DNS names, or Secret Manager payloads.

Decisions:

- Use M38.3 as the NFQ/GCP staging submilestone.
- Keep this task pack planning-only until the human activates implementation.
- Keep NFQ/GCP architecture tests namespaced under `tests/architecture/nfq/gcp/`.

Risks:

- Self-hosted LiveKit requires public SIP/RTP reachability, not just a healthy
  GKE workload.
- Secret Manager payload mistakes can roll quickly through Reloader.
- Phone-number ownership must be strict to avoid stealing production traffic.

Next steps after activation:

1. Fill or verify the private staging tfvars and state bucket values.
2. Validate the five staging Terraform roots.
3. Add the `gcp/staging` overlay and render tests before touching live GCP.
