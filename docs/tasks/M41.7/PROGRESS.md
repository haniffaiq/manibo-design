# M41.7: Agent Builder Governed Starter Repair — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Restore governed starter creation and legacy route focus | Done | 2026-04-20 |
| T02 | Align builder YAML round-trip with runtime voice schema and repair web tests | Done | 2026-04-20 |
| T03 | Ship PR proof, review-thread evidence, and merge watch | In Progress | - |

## Notes

- This milestone backfills the missing tracking that review comments on `#961`
  and `#962` already reference without repurposing the parked M41.5 planning
  slot on `main`.
- `#961` is the canonical M41.7 PR.
- `#962` is a stacked branch that contains useful builder fixes mixed with
  unrelated M40 call-ops scope, so the valid fixes should be folded into `#961`
  instead of merging the whole PR.
- Verification completed so far:
  - `pnpm -C apps/web lint`
  - `pnpm -C apps/web check-types`
  - `pnpm -C apps/web test`
  - Chrome DevTools + Playwright route-focus proof on `/admin/agent-definitions`
- Local UI harness run `local-20260420T190225Z` surfaced stale Playwright specs
  that still expect the pre-builder modal/release-lane shell. The product flow
  under test rendered correctly, but the harness still needs follow-on spec
  alignment if CI requires that suite.
