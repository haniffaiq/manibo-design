# T09: Verify Integration Depth

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: M (2-4h)
> **Depends on**: T01, T02, T03, T04, T05, T06, T07, T08
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens broader M14 scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T09 - verify integration depth`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: run the broader milestone proof for connector-governance hardening only if a new checklist row or real regression explicitly reopens that scope. This is not part of the current M14 backlog.

## Subtasks

- [ ] Run focused pytest for connector, public-integration, and webhook paths
- [ ] Run pyright and ruff on touched Platform Core/API files
- [ ] Run frontend lint/typecheck and integrations E2E coverage
- [ ] Capture OTLP evidence for any `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**` changes: `OTLP spans emitted: Yes` plus TraceQL, LogQL, and PromQL commands with captured output
- [ ] Regenerate/check API inventory when API or API-consuming surfaces move, and confirm consumer alignment in the proof
- [ ] Capture the verification commands/output in progress or PR notes

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M14/PROGRESS.md` | Modify | Mark verification task complete with date when done |

## Implementation Notes

- Do not mark M14 done without both backend and UI proof.
- If a provider adapter lands without test coverage, fix that in the relevant task instead of pretending T09 can paper over it.
- If any implementation task touches `src/` files, OTLP evidence is mandatory for merge readiness, not an optional follow-up.

## Acceptance Criteria

- [ ] Connector and provider adapter tests pass
- [ ] Outgoing webhook integration proof passes
- [ ] Integrations UI lint/typecheck and E2E proof pass
- [ ] OTLP proof is captured whenever the milestone changes `src/` files
- [ ] API inventory is regenerated/checked whenever API or API-consuming contracts move
- [ ] Verification commands are captured with the milestone progress

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
