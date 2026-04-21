# T02: Add Command Record and Lifecycle Model

> **Milestone**: M8-v2-voice-control-plane
> **Status**: Complete
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Checklist Rows**: `docs/requirements/checklist.md:231` — audited manual takeover operator flow.

---

## Activation Guardrails

1. **Planning-only backlog** — do not implement until the active tracker explicitly activates M8
2. **Requirement-first** — replace the planning-only checklist placeholder with exact checklist row(s) before coding
3. **After activation: One Task = One Commit** — commit message: `feat: M8 T02 - add command record and lifecycle model`
4. **After activation: One Milestone = One PR** — reserved branch: `feat/M8-v2-voice-control-plane`
5. Update `docs/tasks/M8/PROGRESS.md` after completing

---

## Description

Add the durable command record that the current platform is missing. Today manual takeover commands signal workflows directly. This task introduces a write-ahead command model with explicit lifecycle state so command handling becomes auditable and replayable instead of "signal and hope."

## Subtasks

- [x] **Create command record model** in `packages/platform-core/src/platform_core/control_plane/commands.py`
- [x] **Add persistence migration** for control-plane command records
- [x] **Define lifecycle states**: received, authorized, rejected, executing, completed, failed
- [x] **Persist command before dispatch** for manual takeover actions
- [x] **Attach correlation/audit fields**: tenant, actor, target, causation, correlation
- [x] **Add API/integration tests** proving the command row exists before workflow dispatch is acknowledged

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/control_plane/commands.py` | Create | Durable command record types and persistence helpers |
| `packages/platform-core/src/platform_core/alembic/versions/` | Create | Migration for tenant-scoped command record table next to other call-state tables |
| `apps/api/src/platform_api/routes/calls.py` | Modify | Persist command records before signaling workflows |
| `packages/platform-core/tests/integration/test_control_plane_command_records.py` | Create | Run tenant-schema migration and assert command-row persistence/lifecycle ordering |
| `apps/api/tests/integration/test_calls.py` | Modify | Verify manual takeover command lifecycle behavior through the API |
| `apps/api/tests/integration/test_audit_events.py` | Modify | Verify audit correlation stays intact as supporting evidence |

## Implementation Notes

- Keep this scoped to the smallest honest command set first: manual takeover only.
- Do not build generic command dispatch orchestration yet. One small command domain is enough to prove the pattern.
- Durable command rows are the source of command truth; audit remains supporting evidence, not the command record itself.
- Command rows are tenant-scoped call state. Keep them colocated with other call truth unless a deployment-scoped justification is documented first.
- Avoid coupling command persistence to WebSocket work. This task must stand on its own.
- Proof must include a real tenant-schema migration/integration path. API tests that bypass durable persistence are not enough.

## Acceptance Criteria

- [x] Control-plane command records persist before workflow signaling
- [x] Command lifecycle state exists and is updated deterministically
- [x] Manual takeover actions use the command model
- [x] Command rows carry actor, tenant, target, and correlation metadata
- [x] `uv run pytest packages/platform-core/tests/integration/test_control_plane_command_records.py apps/api/tests/integration/test_calls.py apps/api/tests/integration/test_audit_events.py -q --tb=short` passes
- [x] If the implementation touches `apps/*/src/**`, `packages/*/src/**`, or `solutions/*/src/**`, the PR body includes `OTLP spans emitted: Yes` plus captured output from `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh`

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
- Related: [T01-define-canonical-control-plane-envelopes.md](./T01-define-canonical-control-plane-envelopes.md)
