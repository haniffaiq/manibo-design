# T09: FE Adopt Typed Solution Enrichers in Shared Case Detail and Evidence Rail

> **Milestone**: M12-workbench-composition
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T08
> **Checklist Rows**: `docs/requirements/checklist.md:54` — operator-grade observability still lacks richer shared evidence depth in the product UI.

---

## Activation Guardrails

1. Do not start this before `T08` lands. Frontend guesswork against an unstable backend contract is garbage.
2. Keep the shared workspace shared. Do not fork clinic-only or driver-only panels.
3. One task = one commit:
   - `feat: M12 T09 - render typed shared observability enrichers`
4. Update `docs/tasks/M12/PROGRESS.md` when done.

---

## Description

Render backend-provided typed solution enrichers inside the existing shared case detail and evidence rail. The operator should see richer solution context in the same shared workspace, not via solution-specific observability forks.

## Subtasks

- [x] Add frontend types for the shared enricher contract
- [x] Extend the detail loader/client to carry the new response fields
- [x] Render enricher sections inside shared case detail
- [x] Render supporting evidence items inside the shared evidence rail
- [x] Add at least one solution-specific example to prove the shared rendering path
- [x] Keep empty/no-enricher states quiet and boring
- [x] Add Vitest coverage for the rendering helpers/components

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/lib/api/observability.ts` | Modify | Consume typed shared enricher response fields |
| `apps/web/src/components/observability/use-case-detail.ts` | Modify | Surface shared enrichers from the detail response |
| `apps/web/src/components/observability/case-record-panel.tsx` | Modify | Render typed solution detail sections in the shared case view |
| `apps/web/src/components/observability/evidence-rail.tsx` | Modify | Render typed solution evidence items without forking the rail |
| `apps/web/src/components/observability/domain-logic.ts` | Modify | Add formatters/helpers for shared enricher primitives |
| `apps/web/tests/` | Modify/Create | Unit coverage for shared enricher rendering |
| `apps/web/e2e/observability.spec.ts` | Modify | Prove shared workspace rendering with real enrichers once stable |

## Implementation Notes

- The shared workspace already has the right surfaces. Reuse them.
- Additive UI only:
  - keep current transcript/timeline/recording behavior
  - render enrichers as extra structured sections/items
- Do not let each solution provide custom React components. That is how this becomes unmaintainable.
- If the API shape is well-designed, most frontend work should be formatting + placement, not special casing.
- Keep solution-specific copy plain and operator-readable.

## PR Slices

### PR 1 — Typed client plumbing

- Extend API client types
- Thread shared enrichers through loader/state hooks
- Add unit tests for no-enricher and simple-enricher states

### PR 2 — Shared rendering

- Render case-detail sections and evidence items in the shared workspace
- Add frontend tests for clinic and one second solution example

### PR 3 — UI proof

- Update Playwright/shared workspace proof once the backend contract is stable
- Capture desktop + mobile verification artifacts per repo UI gate

## Acceptance Criteria

- [x] Shared observability frontend types include the new typed enricher contract
- [x] Shared case detail renders backend-provided solution enrichers without forking per-solution screens
- [x] Shared evidence rail can render backend-provided solution evidence items
- [x] Empty/no-enricher runs still render cleanly
- [x] `pnpm -C apps/web exec vitest run tests/observability-api.test.ts tests/observability-workspace.test.ts` or the exact new frontend test targets pass
- [x] `pnpm -C apps/web exec playwright test e2e/observability.spec.ts --project=chromium` passes once the backend contract is available
- [x] The eventual implementation PR follows the repo UI gate: Chrome DevTools verification, Playwright verification, screenshots/artifacts, and `tools/scripts/e2e/run-web-e2e.sh`
- [x] If `apps/web/src/**` changes, the eventual implementation PR must satisfy the OTLP evidence gate: `OTLP spans emitted: Yes` plus TraceQL, LogQL, and PromQL commands with captured output

## References

- Milestone: [M12-workbench-composition.md](../../milestones/M12-workbench-composition.md)
- Progress: [PROGRESS.md](./PROGRESS.md)
- Issue: `#618`
