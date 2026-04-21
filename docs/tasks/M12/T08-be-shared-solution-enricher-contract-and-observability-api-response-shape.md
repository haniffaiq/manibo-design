# T08: BE Shared Solution Enricher Contract + Observability API Response Shape

> **Milestone**: M12-workbench-composition
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T03, T04
> **Checklist Rows**: `docs/requirements/checklist.md:54` — operator-grade observability is in-product but still missing richer shared evidence depth.

---

## Activation Guardrails

1. Keep this brutally small. The goal is a typed shared evidence contract, not a plugin circus.
2. Do not let solution-specific payload shapes leak directly into the shared observability API.
3. One task = one commit:
   - `feat: M12 T08 - add shared observability enricher contract`
4. Update `docs/tasks/M12/PROGRESS.md` when done.

---

## Description

Define the shared backend contract for solution-contributed observability enrichers and extend the shared observability API so the workspace can render them. Today the shared workspace gets coverage badges from manifests and a few one-off hardcoded related links. That is not enough.

The backend needs to answer:

> “Given this case/run, what extra typed solution evidence should the shared workspace render?”

## Subtasks

- [x] Define the minimal typed shared enricher schema
- [x] Decide where the contract lives so both API and frontend types can reuse it
- [x] Add the new contract to shared observability API response models
- [x] Add one backend enricher mapper for appointment booking
- [x] Add one backend enricher mapper for driver verification or another shipped solution with real persisted detail
- [x] Keep generic observability core fields unchanged; enrichers are additive
- [x] Add integration coverage for the new API response shape

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/observability.py` | Modify | Add shared API models and response wiring for solution enrichers |
| `packages/platform-core/src/platform_core/observability/` | Create/Modify | Add typed backend enricher models/mappers if a shared platform location is needed |
| `solutions/appointment_booking/src/appointment_booking/api.py` | Modify | Map booking result / callback evidence into the shared enricher contract |
| `solutions/driver_verification/src/driver_verification/router.py` | Modify | Map discrepancy / document-review evidence into the shared enricher contract |
| `apps/web/src/lib/api/observability.ts` | Modify | Add typed client-side response fields for the new shared enrichers |
| `apps/api/tests/integration/test_observability*.py` | Modify/Create | Assert enriched shared response shape |

## Implementation Notes

- Start with a boring additive shape, for example:
  - `sections[]`
  - each section has `key`, `label`, `items[]`
  - each item has typed display primitives such as `label`, `value`, `severity`, `href`
- Shared enricher contract ownership belongs in Platform Core + API models, not the build-time solution manifest package.
- Do not send raw solution-specific blobs into the shared API.
- Do not make the manifest runtime-executable. If the UI later needs a tiny capability flag, keep that separate from the runtime enricher schema.
- Replace one-off hardcoded shared-detail solution hooks over time; do not multiply them.
- Appointment booking already has real extraction/result detail. Reuse that truth.
- Driver verification already has persisted result/discrepancy truth. Reuse that truth.
- This task stops at the shared API contract and backend mapping. Frontend rendering is `T09`.

## PR Slices

### PR 1 — Shared contract

- Add typed shared enricher models
- Extend observability API response models
- Add tests for empty/no-enricher output

### PR 2 — First real enricher

- Add appointment-booking mapping into the new shared contract
- Prove the enriched payload reaches the shared observability detail response

### PR 3 — Second real enricher

- Add driver-verification mapping or another shipped solution with honest persisted detail
- Extend integration coverage

## Acceptance Criteria

- [x] Shared observability API responses can carry typed solution enrichers
- [x] The new contract is additive and does not break current generic detail/timeline payloads
- [x] At least one shipped solution exposes real shared enricher data through the common API
- [x] The contract is typed and reusable by frontend code without `Record<string, unknown>` guessing
- [x] `uv run pytest apps/api/tests/integration -q --tb=short -k observability` passes for the affected shared-observability routes
- [x] If `apps/api/src/**`, `apps/web/src/**`, `packages/platform-core/src/**`, or `solutions/*/src/**` changes, the eventual implementation PR must satisfy the OTLP evidence gate: `OTLP spans emitted: Yes` plus TraceQL, LogQL, and PromQL commands with captured output

## References

- Milestone: [M12-workbench-composition.md](../../milestones/M12-workbench-composition.md)
- Progress: [PROGRESS.md](./PROGRESS.md)
- Issue: `#618`
