# M13.1: Autonomous Telephony Evaluation and Voice Quality Guardrails -- Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Evaluation domain model and persistence | Not Started | |
| T02 | Telnyx evaluation adapter | Not Started | |
| T03 | Deterministic scenario DSL and artifact model | Not Started | |
| T04 | Inbound synthetic caller workflow | Not Started | |
| T05 | Outbound synthetic callee workflow | Not Started | |
| T06 | Scoring and evidence correlation | Not Started | |
| T07 | API and operator surface for runs/results | Not Started | |
| T08 | Scheduling, docs, and rollout guardrails | Not Started | |

## Notes

This milestone is a follow-on to M13, not a continuation of the current `fix/inbound-call-race` PR. The planning intent is explicit:

- merge the current voice-runtime and observability hardening first
- keep the autonomous telephony evaluator as a separate planning and implementation track
- avoid putting durable runtime logic into `tools/scripts/**`
- keep implementation PRs reviewer-atomic by landing the subsystem in small slices

The core insight captured here is that M13 exposed two different problem classes:

1. call setup and routing failures
2. conversation-quality failures after answer

M13 fixed enough of class (1) to prove that the remaining regression is class (2). M13.1 exists to make class (2) reproducible and scorable without a human handset.
