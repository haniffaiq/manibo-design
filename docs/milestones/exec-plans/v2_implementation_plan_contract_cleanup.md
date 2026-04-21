# V2 Implementation Plan Contract Cleanup

Date: 2026-03-15
Owner: Codex
Status: Completed

## Checklist anchors

- `docs/requirements/checklist.md:40` — VOX public web chat ingress / widget APIs remain an architectural blocker.
- `docs/requirements/checklist.md:54` — pre-V2 contract prep is real, but the V2 implementation plan still needs a cleaner, enforceable contract.

## Objective

Clean up `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md` so it stays an implementation plan with a binding target
contract for V2 work, not a competing canonical architecture document.

## Why this work exists

The review found eight real problems:

1. the plan was presenting itself as a second architecture source of truth
2. terminology was fighting the canonical `organization` vocabulary
3. Layer 3 package-family ideas were ahead of the repo’s current mechanical enforcement
4. public-ingress message truth was underspecified
5. guest-token authority vs path authority was ambiguous
6. artifact/composition pinning was asserted but not modeled in run/session records
7. control-plane replay envelopes were missing scope/audience separation
8. package-family discovery claims had no matching CI/tooling proof path

## Planned edits

1. Reframe the V2 section as a pre-canonical implementation contract.
2. Keep canonical architecture terminology aligned with `organization`, while allowing `tenant` in current-code landing
   zones.
3. Add explicit guardrail language that new package families cannot outrun boundary tests, profile verification, and graph
   tooling.
4. Add guest-session control and persisted public chat message/session records.
5. Make path-vs-token mismatch fail closed in the public-ingress contract.
6. Add `composition_version` / `artifact_hash` pinning to public chat sessions and workflow run links.
7. Add `scope_mode` / `audience_kind` to control-plane envelopes, outbox records, and replay cursors.
8. Tie new package families to explicit tooling/test landing zones in the implementation phases.

## Outcome

1. The V2 section is now explicitly a pre-canonical implementation contract, not a replacement architecture spec.
2. Canonical vocabulary stays aligned with `organization`; `tenant` is now clearly limited to current-code and landing-zone usage inside this plan.
3. Package-family expansion now requires dependency/profile/graph guardrail updates in the same implementation slice.
4. Public-ingress resource truth now includes guest-session control plus persisted public chat session/message records.
5. Guest-session path/token mismatches now fail closed in the implementation contract.
6. Public chat bootstrap/session records and workflow run links now carry `composition_version` and `artifact_hash` pins.
7. Control-plane envelopes/replay contracts now include `scope_mode` and `audience_kind`.
8. Observability ownership is delegated to `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`, and the phase plan now names the tooling/test landing zones needed for additional package families.

## Notes

- This cleanup is doc-first. No code changes are expected unless the plan text would otherwise keep contradicting current
  mechanical enforcement.
- Observability implementation sequencing and proof ownership already live in
  `docs/milestones/exec-plans/platform_observability_backend_execution_plan.md`; the V2 plan should reference that work, not fork it.
- `wiki/architecture/architecture.md` stays canonical until the V2 contract is reviewed and intentionally absorbed.
