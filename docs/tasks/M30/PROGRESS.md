# M30: Agent Version Rollback Support — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Add previously_published status to version state machine | Done | 2026-03-28 |
| T02 | Change publish logic to set old live version to previously_published | Done | 2026-03-28 |
| T03 | Allow publish from previously_published status | Done | 2026-03-28 |
| T04 | Add explicit archive action on non-live versions in UI | Done | 2026-03-28 |
| T05 | Update version action buttons for new status transitions | Done | 2026-03-28 |
| T06 | Verification: publish, rollback, and archive flow | Done | 2026-03-28 |

## Notes

Canonical milestone branch: feat/M30-agent-version-rollback
Core change: publishing a new version no longer auto-archives the previous live version.
2026-03-28: milestone started in worktree `../manibo-m30` on branch `feat/M30-agent-version-rollback`.
Checklist row materially advanced by M30: row 98 (`Agents are versioned; rollback to previous version is possible`).
2026-03-28: M30 T01-T05 implemented end-to-end:
- added alembic migration `20260328_181000_agent_version_previously_published.py` so the public schema accepts `previously_published`
- publish now demotes the current live version to `previously_published` instead of auto-archiving it
- republishing a `previously_published` version now works as the rollback path
- archive is now an explicit operator action for `previously_published` and `rejected` versions
- admin agent definition detail page now shows `Previously live` with `Publish` and `Archive` actions, and keeps rejected versions archivable
2026-03-28: verification exposed and fixed two stale fail-open/runtime assumptions adjacent to the M30 work:
- governed agent compilation now fails closed when no platform defaults version exists instead of silently compiling with empty defaults
- pinned runtime artifact fetch now accepts `previously_published` versions so explicit version refs remain deterministic after a rollback candidate is demoted
2026-03-28: pre-M30 blocking web regressions fixed before T01-T06 implementation work:
- tenant dashboard and call-ops now surface partial/unavailable data honestly instead of rendering fallback zeros or empty states when upstream requests fail
- admin tenant solutions keeps unshipped rows visible so operators can disable mismatched enabled access
- `useTenantPicker` default reverted to production-only tenant listing; explicit non-production opt-in remains required
2026-03-28: audited current `useTenantPicker(...)` call sites after restoring the default; no admin deployment-control page kept a justified non-production opt-in.
2026-03-28: deployment-admin pages now pass `includeNonProduction: false` explicitly so rollback/releases/solutions/users/security/phone-number controls stay production-only even if the hook default changes again.
Checklist rows materially protected by this fix set: row 85 (tenant solution visibility) and analytics/reporting rows 245-248 plus 366.
Verification evidence:
- `pnpm -C apps/web check-types`
- `pnpm -C apps/web test -- tests/admin-agent-definition-detail-page.test.tsx tests/dashboard-page.test.tsx tests/call-ops-page.test.tsx tests/admin-solutions-page.test.tsx tests/use-tenant-picker.test.tsx`
- `pnpm -C apps/web test -- tests/dashboard-page.test.tsx tests/call-ops-page.test.tsx tests/admin-solutions-page.test.tsx tests/use-tenant-picker.test.tsx tests/admin-solutions-states.test.ts`
- `pnpm -C apps/web lint`
- `tools/scripts/e2e/run-web-e2e.sh --workers=1 e2e/admin-agent-definitions.spec.ts` (2026-03-28) now passes after restoring tenant-picker test IDs, fail-closed platform-defaults messaging, retire/artifact controls, and stale observability-route mocks
- `tools/scripts/e2e/run-web-e2e.sh --workers=1` (2026-03-28) now progresses past `apps/web/e2e/admin-agent-definitions.spec.ts`; the next unrelated failures surfaced later in the lane (`admin-dashboard`, `admin-solutions`, `admin-tenants`, `auth-flow`, `call-history`)
- Playwright MCP desktop proof: dashboard partial-failure warning and `—` placeholders captured in `tools/agents/artifacts/m30-browser-verification/playwright-dashboard-desktop.png`
- Playwright MCP mobile proof: admin solutions mismatch row stays visible and disable path remains available in `tools/agents/artifacts/m30-browser-verification/playwright-admin-solutions-mobile.png`
- Chrome DevTools MCP desktop proof: call-ops partial-failure warning and live-calls unavailable state captured in `tools/agents/artifacts/m30-browser-verification/chrome-call-ops-desktop.png`
- Chrome DevTools MCP mobile proof: admin solutions mismatch/unavailable states captured in `tools/agents/artifacts/m30-browser-verification/chrome-admin-solutions-mobile.png`
- Chrome DevTools DOM snapshot for admin mobile state: `tools/agents/artifacts/m30-browser-verification/chrome-admin-solutions-mobile-snapshot.txt`
- Full web UI harness attempted under Node 22.21.1 via `tools/scripts/e2e/run-web-e2e.sh --workers=1`; run reached Playwright execution but stopped on unrelated existing `apps/web/e2e/admin-agent-definitions.spec.ts` failures. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T142546Z`
- `pnpm -C apps/web test -- tests/admin-agent-definition-detail-page.test.tsx`
- `tools/scripts/e2e/run-web-e2e.sh --workers=1 e2e/operator-alerts.spec.ts e2e/team-management.spec.ts e2e/workbench-shells.spec.ts e2e/call-ops-live.spec.ts` passed on 2026-03-28 after removing dead alerts refresh assumptions, switching team role tests to Radix select helpers, aligning deployment nav expectations, and proving overflow-menu call-ops actions. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T160012Z`
- `tools/scripts/e2e/run-web-e2e.sh --workers=1 tests/visual/m27-console-craft.spec.ts` passed on 2026-03-28 after fixing active-call escalation mocks and recording the missing `call-ops-card-layout` baseline. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T160318Z`
- `tools/scripts/e2e/run-web-e2e.sh --workers=1` passed on 2026-03-28 with `126 passed (2.7m)`. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T160452Z`
- `pnpm -C apps/web playwright:test` passed on 2026-03-28 with `126 passed (53.3s)` under Node 22.21.1
- `uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -q --tb=short -k rollback`
- `uv run pytest packages/platform-core/tests/integration/test_agent_governance_registry.py -q --tb=short`
- `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short -k rollback`
- `uv run pytest apps/api/tests/integration/test_agent_definitions.py -q --tb=short`
- `pnpm -C apps/web test -- tests/admin-agent-definitions-api.test.ts tests/admin-agent-definition-detail-page.test.tsx`
- `uv run ruff check packages/platform-core/src/platform_core/agents/compiler.py packages/platform-core/src/platform_core/agents/governance.py packages/platform-core/src/platform_core/agents/published_artifacts.py packages/platform-core/tests/integration/test_agent_governance_registry.py apps/api/src/platform_api/routes/admin_agent_definitions.py apps/api/tests/integration/test_agent_definitions.py`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web check-types`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh --workers=1 e2e/admin-agent-definitions.spec.ts` passed on 2026-03-28 with `10 passed (22.6s)`. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T163606Z`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web playwright:test` passed on 2026-03-28 with `126 passed (58.5s)`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh --workers=1` passed on 2026-03-28 with `126 passed (2.7m)`. Harness artifacts: `tools/agents/artifacts/ui-harness/local-20260328T163813Z`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/review/pre-pr-ci.sh --with-review` passed on 2026-03-28 after repo checks, runtime smoke, and local post-CI review.
- PR #732 follow-up on 2026-03-28: new version drafts now prefer the newest platform-defaults baseline, and retiring a definition now returns `409` when active phone-number routing still points at it instead of silently breaking inbound voice.
- PR #732 follow-up on 2026-03-28: repaired the stale unit test import after the shared workflow-step helper move, and made `mintLiveKitToken(...)` call explicit endpoint literals so regenerated API inventory keeps `POST /calls/{call_id}/livekit-token` attached to its real web consumer.
- `uv run pytest packages/platform-core/tests/unit/test_agents/test_tenant_overrides.py -q --tb=short`
- `uv run python tools/scripts/generate_api_inventory.py`
- `uv run python tools/scripts/check_api_inventory.py`
- `uv run pytest tests/architecture/test_api_inventory_contract.py -q --tb=short`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web lint`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web check-types`
- PR #732 follow-up on 2026-03-28: fixed two local-review regressions before pushing again:
  - the agent test workbench no longer labels a `previously_published` rollback candidate as `draft`; the badge now follows the selected/default version’s actual lifecycle state
  - the tenant dashboard no longer flashes `Slowdown summary unavailable right now` during the initial SWR load before observability data resolves
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web test -- tests/dashboard-page.test.tsx`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh --workers=1 e2e/agent-test-workbench.spec.ts`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && pnpm -C apps/web playwright:test`
- `source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && tools/scripts/e2e/run-web-e2e.sh --workers=1`
- Playwright MCP desktop proof: tenant dashboard follow-up state captured in `tools/agents/artifacts/m30-browser-verification/playwright-dashboard-desktop-followup.png`
- Playwright MCP mobile proof: rollback-candidate workbench follow-up state captured in `tools/agents/artifacts/m30-browser-verification/playwright-agent-workbench-mobile-followup.png`
- Chrome DevTools MCP mobile proof: tenant dashboard follow-up state captured in `tools/agents/artifacts/m30-browser-verification/chrome-dashboard-mobile-followup.png`
- Chrome DevTools MCP desktop proof: rollback-candidate workbench follow-up state captured in `tools/agents/artifacts/m30-browser-verification/chrome-agent-workbench-desktop-followup.png`
- Playwright MCP desktop proof: admin rollback candidate state captured in `tools/agents/artifacts/m30-browser-verification/playwright-admin-agent-definitions-desktop.png`
- Playwright MCP mobile proof: admin rollback candidate state captured in `tools/agents/artifacts/m30-browser-verification/playwright-admin-agent-definitions-mobile.png`
- Chrome DevTools MCP desktop proof: admin rollback candidate state captured in `tools/agents/artifacts/m30-browser-verification/chrome-admin-agent-definitions-desktop.png`
- Chrome DevTools MCP mobile proof: admin rollback candidate state captured in `tools/agents/artifacts/m30-browser-verification/chrome-admin-agent-definitions-mobile.png`
- Worktree observability stack proof for the eventual PR body uses `tools/scripts/dev/compose-worktree.sh up`, seeded demo auth traffic against `/auth/me` and `/admin/tenants/00000000-0000-4000-a000-000000000001/agent-definitions`, then captured `tools/scripts/obs/traceql.sh`, `tools/scripts/obs/logql.sh`, and `tools/scripts/obs/promql.sh` output on 2026-03-28.
- `uv run pyright packages/platform-core/src/platform_core/agents/governance.py` is still blocked by pre-existing unknown-typed YAML normalization code at `packages/platform-core/src/platform_core/agents/governance.py:102-123`; M30 did not add new pyright failures there.
