# T07: Migrate surviving solution runtime env readers to explicit owners

> **Milestone**: M35-env-settings-centralization
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02, T03, T08

---

## Description

Close the solution layer gap after the app-owned contracts land. This task re-audits the remaining solution env readers, decides whether each variable is truly solution-owned or should move to an app/platform owner, and removes raw `os.environ` reads from surviving shipped solution code. It also covers solution-owned bridge readers that currently live in app-layer glue, where the env name is business-specific even though the consuming file is outside `solutions/*`.

## Subtasks

- [ ] **Re-audit surviving solution readers**: classify current solution env reads as solution-owned, app-owned, or cross-solution leaks that should be removed.
- [ ] **Migrate surviving readers**: replace raw env reads in solution runtime code with explicit typed owners or injected values.
- [ ] **Add solution-focused tests**: cover the migrated ownership decisions so the solution layer no longer bypasses the typed contract silently.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/api.py` | Modify selectively | Remove raw runtime env reads or move them behind an explicit owner |
| `solutions/appointment_booking/src/appointment_booking/eval_support.py` | Modify selectively | Remove raw solution env reads or document them as explicit solution-owned settings |
| `solutions/driver_verification/src/driver_verification` | Modify selectively | Add an explicit typed owner if `driver_verification` keeps a solution-owned runtime env contract |
| `apps/temporal-worker/src/temporal_worker/activities/target.py` | Modify selectively | Stop reading the `driver_verification` agent-definition env directly; inject a solution-owned or app-owned typed owner instead |
| `solutions/telematics_ingestion/src/telematics_ingestion/router.py` | Modify selectively | Remove raw runtime env reads or move them behind an explicit owner |
| `solutions/appointment_booking/tests/` | Modify/Create | Cover migrated env ownership decisions |
| `solutions/driver_verification/tests/temporal/` | Modify/Create | Cover the chosen ownership path for the `driver_verification` target-resolution env bridge |
| `solutions/telematics_ingestion/tests/` | Modify/Create | Cover migrated env ownership decisions |

## Implementation Notes

- Shared platform variables such as `LIVEKIT_*` should not remain hidden behind solution-local env reads if the true owner is the API or worker process.
- If a variable is still solution-owned after the re-audit, give it an explicit typed owner inside that solution instead of leaving `os.environ.get(...)` in shipped runtime code.
- Cross-solution bridge vars are suspicious by default. Prefer moving them to the app/platform owner or replacing them with injected configuration.
- `DRIVER_VERIFICATION_AGENT_DEFINITION_NAME` is the current concrete example: it is a solution-specific business knob consumed from `apps/temporal-worker/src/temporal_worker/activities/target.py`, so this task must either move ownership into `solutions/driver_verification` or replace the env read with an injected app-owned mapping.

## Acceptance Criteria

- [ ] Surviving shipped solution env readers are classified explicitly as solution-owned, app-owned, or removed.
- [ ] `appointment_booking`, `driver_verification`, and `telematics_ingestion` no longer bypass the typed contract with ad hoc runtime env reads in shipped code or app-layer bridge glue.
- [ ] Tests cover the chosen ownership path for every surviving solution runtime env reader.

## Verification

```bash
uv run ruff check \
  solutions/appointment_booking/src/appointment_booking \
  solutions/driver_verification/src/driver_verification \
  apps/temporal-worker/src/temporal_worker/activities/target.py \
  solutions/telematics_ingestion/src/telematics_ingestion

uv run pyright \
  solutions/appointment_booking/src/appointment_booking \
  solutions/driver_verification/src/driver_verification \
  apps/temporal-worker/src/temporal_worker/activities/target.py \
  solutions/telematics_ingestion/src/telematics_ingestion

uv run pytest \
  solutions/appointment_booking/tests \
  solutions/driver_verification/tests/temporal \
  solutions/telematics_ingestion/tests \
  -q --tb=short -k "env or booking or driver or telematics or target"

rg -nP "os\\.environ\\[[^\\]]+\\](?!\\s*=)|os\\.environ\\.get\\(|os\\.getenv\\(" \
  solutions/appointment_booking/src/appointment_booking \
  solutions/driver_verification/src/driver_verification \
  apps/temporal-worker/src/temporal_worker/activities/target.py \
  solutions/telematics_ingestion/src/telematics_ingestion
```

Review gate: if a solution env reader survives this task, the owning typed settings path must be explicit in code and reflected in tests.

## References

- Milestone: [M35-env-settings-centralization.md](../../milestones/M35-env-settings-centralization.md)
- Design: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
