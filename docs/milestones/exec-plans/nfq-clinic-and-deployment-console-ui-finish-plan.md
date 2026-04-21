# Execution Plan: NFQ Clinic Tenant + Deployment Console UI Finish

> **Status:** Completed (repo scope)
> **Created:** 2026-03-09
> **Owner:** Unassigned
> **Track:** Epic

## 1. Feature Definition

**Goal:** Finish the NFQ clinic tenant console and deployment console to a real operator/admin-ready state, starting with fail-closed web access control and ending with verified browser workflows instead of doc fiction. The work explicitly includes governed-agent prompt/version UX, test/eval planning, rollout controls, and session observability, because those are the real missing product slices.

**Checklist rows this plan is intended to advance:**
- `docs/requirements/checklist.md` rows for auth/access control and solution visibility: 66, 74, 78, 80
- `docs/requirements/checklist.md` rows for agent management/backoffice: 98, 379, 383
- `docs/requirements/checklist.md` rows for live call operations and reporting: 223-245
- `docs/requirements/checklist.md` rows for NFQ clinic tenant operations: 414, 424-430

**Evidence expectation (when Completed):**
- Code pointers for web route-role enforcement and clinic/deployment console workflows
- `pnpm -C apps/web check-types`
- `pnpm -C apps/web test`
- `pnpm -C apps/web exec playwright test ...` on a supported Node runtime
- `tools/scripts/run_web_ui_harness.sh ...` artifacts
- Chrome DevTools MCP + Playwright MCP verification artifacts for changed desktop and mobile flows

**Acceptance Criteria:**
- [ ] `/admin/**` routes fail closed for non-`super_admin` users in the web shell, not just in backend API middleware.
- [ ] Deployment console critical NFQ provider flows are usable end-to-end: dashboard, tenants, phone numbers, users, health, security, settings, solutions, assistants, releases.
- [ ] Provider assistant lifecycle is usable for real work: create definition, create draft version, inspect artifact, submit/review/publish, understand what changed, and move safely between released versions.
- [ ] Provider assistant lifecycle fails closed with actionable guidance: if deployment-level platform defaults are missing, `/admin/agent-definitions` blocks draft creation and points operators to `/admin/settings` instead of surfacing a raw backend 400.
- [ ] NFQ clinic tenant flows are usable end-to-end: dashboard, call ops, call history, bookings, clinic knowledge base, integrations, team, settings.
- [ ] Live monitoring answers the operator questions that matter: what happened, which LangGraph nodes ran, which route was selected, how long each stage took, and whether a person needs to step in now.
- [ ] Clinic operator workflow is continuous across live call handling and post-call follow-up: a user can move from active call context to booking follow-up context without guessing what happens next.
- [ ] Agent testing/evaluation and traffic-splitting requirements are either shipped in UI or explicitly blocked by documented API prerequisites; no vague “later” bucket remains.
- [ ] Requirement docs and checklist rows match shipped UI reality and verification evidence.

**Scope Boundaries:**

Included:
- Web auth/access hardening for tenant vs deployment route scopes
- Deployment console work needed for NFQ provider operations
- Provider assistant lifecycle UX: prompt/config editing, version history, review/publish, artifact inspection, release handoff
- Agent testing/evaluation and rollout-control planning tied to concrete backend prerequisites
- Session observability UX for tenant and deployment operators
- Clinic tenant UI work needed for NFQ clinic delivery
- Browser verification and evidence capture on supported Node versions

Excluded:
- VOX public chat widget
- Outbound campaign UI
- Generic tenant `/solutions` catalog page
- Generic per-solution settings framework beyond what NFQ clinic needs now
- Full billing/pricing/invoices backoffice
- Full Telnyx-style assistant-builder parity across every optional surface
- Full clinic handoff command center beyond the MVP operator workflow

---

## 2. Phase Plan

### Phase 1: Fail-Closed Web Access

**Objective:** Remove the fake sense of completion around auth by making the web shell enforce route-role boundaries before any provider UI renders.

**Input:**
- Spec sections: `docs/requirements/checklist.md` rows 74, 78, 80
- Source files: `apps/web/src/middleware.ts`, `apps/web/src/app/(deployment)/admin/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/lib/auth.ts`
- Dependencies from prior phases: none

**Deliverables:**
- `apps/web/src/middleware.ts` -- route-role aware redirect logic for deployment vs tenant paths
- `apps/web/src/app/(deployment)/admin/layout.tsx` -- explicit server-side super-admin guard
- `apps/web/tests/middleware.test.ts` -- coverage for admin route rejection and tenant/admin redirects
- `apps/web/e2e/auth-flow.spec.ts` and/or `apps/web/e2e/routes.spec.ts` -- browser proof for fail-closed behavior

**Tests:**
- `apps/web/tests/middleware.test.ts`
- `apps/web/tests/auth-session-route.test.ts`
- `apps/web/e2e/auth-flow.spec.ts`
- `apps/web/e2e/routes.spec.ts`

**Verification gate:**
```bash
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/middleware.test.ts tests/auth-session-route.test.ts tests/auth-oidc-routes.test.ts
pnpm -C apps/web exec playwright test e2e/auth-flow.spec.ts e2e/routes.spec.ts --project=chromium
```

**Context budget:** ~35K tokens

**Depends on:** none

**Can run in parallel with:** none -- sequential foundation

### Phase 2: Provider Backoffice Fit-for-Use

**Objective:** Finish the provider backoffice surfaces NFQ actually needs, with special focus on governed assistants as a product surface instead of a raw admin afterthought.

**Input:**
- Spec sections: `docs/requirements/checklist.md` rows 66, 78, 80, 98, 379, 383
- Source files: `apps/web/src/app/(deployment)/admin/page.tsx`, `apps/web/src/app/(deployment)/admin/tenants/page.tsx`, `apps/web/src/app/(deployment)/admin/phone-numbers/page.tsx`, `apps/web/src/app/(deployment)/admin/users/page.tsx`, `apps/web/src/app/(deployment)/admin/health/page.tsx`, `apps/web/src/app/(deployment)/admin/security/page.tsx`, `apps/web/src/app/(deployment)/admin/settings/page.tsx`, `apps/web/src/app/(deployment)/admin/solutions/page.tsx`, `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx`, `apps/web/src/app/(deployment)/admin/releases/page.tsx`
- Dependencies from prior phases: Phase 1

**Deliverables:**
- Deployment console pages with consistent empty states, error states, and next-step guidance
- Clear tenant-selection and routing workflows for clinic operations support
- No dead-end admin controls presented as if fully shipped
- Governed assistant lifecycle page that reads like an operator tool, not a schema dump: clearer version history, what-changed cues, publish state, artifact inspection, and release handoff context
- Explicit doc callout for what is still impossible because there is no simulation/test or traffic-split backend API
- Updated admin Playwright coverage for critical provider flows

**Tests:**
- `apps/web/tests/admin-tenants-api.test.ts`
- `apps/web/tests/admin-users-api.test.ts`
- `apps/web/tests/admin-health-api.test.ts`
- `apps/web/tests/admin-security-api.test.ts`
- `apps/web/tests/admin-settings-api.test.ts`
- `apps/web/tests/admin-agent-definitions-api.test.ts`
- `apps/web/tests/admin-releases-api.test.ts`
- `apps/web/tests/phone-numbers-api.test.ts`
- `apps/web/e2e/admin-dashboard.spec.ts`
- `apps/web/e2e/admin-agent-definitions.spec.ts`
- `apps/web/e2e/admin-tenants.spec.ts`
- `apps/web/e2e/admin-phone-numbers.spec.ts`
- `apps/web/e2e/admin-users.spec.ts`
- `apps/web/e2e/admin-health.spec.ts`
- `apps/web/e2e/admin-releases.spec.ts`
- `apps/web/e2e/admin-security.spec.ts`
- `apps/web/e2e/admin-settings.spec.ts`
- `apps/web/e2e/admin-solutions.spec.ts`

**Verification gate:**
```bash
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/admin-tenants-api.test.ts tests/admin-users-api.test.ts tests/admin-health-api.test.ts tests/admin-security-api.test.ts tests/admin-settings-api.test.ts tests/admin-agent-definitions-api.test.ts tests/admin-releases-api.test.ts tests/phone-numbers-api.test.ts
pnpm -C apps/web exec playwright test e2e/admin-dashboard.spec.ts e2e/admin-agent-definitions.spec.ts e2e/admin-tenants.spec.ts e2e/admin-phone-numbers.spec.ts e2e/admin-users.spec.ts e2e/admin-health.spec.ts e2e/admin-releases.spec.ts e2e/admin-security.spec.ts e2e/admin-settings.spec.ts e2e/admin-solutions.spec.ts --project=chromium
```

**Context budget:** ~45K tokens

**Depends on:** Phase 2

**Can run in parallel with:** none -- keep provider UI ownership coherent

### Phase 3: Testing, Rollout, and Observability Closure

**Objective:** Close the biggest product gap between the current console and the Telnyx/LiveKit bar: draft validation, rollout safety, and session understanding.

**Input:**
- Spec sections: `docs/requirements/checklist.md` rows 98, 223-245, 379, 383
- Source files: `apps/web/src/app/(deployment)/admin/agent-definitions/page.tsx`, `apps/web/src/app/(deployment)/admin/releases/page.tsx`, `apps/web/src/app/(deployment)/admin/health/page.tsx`, `apps/web/src/app/(tenant)/call-ops/page.tsx`, `apps/web/src/app/(tenant)/call-ops/history/page.tsx`, `apps/web/src/lib/api/call-observability.ts`, `apps/web/src/lib/api/call-history.ts`
- Dependencies from prior phases: Phase 2 for UX baseline; backend prerequisite review for any new simulation/traffic APIs

**Deliverables:**
- Assistant version history and publish flow that clearly answer “what changed” and “what is live now”
- Explicit decision record for missing backend APIs: simulation/test runs, saved eval suites, compare-runs UX, and traffic distribution
- Tenant and deployment observability surfaces upgraded toward a unified session-insights model: transcript, runtime events, route path, LangGraph node timing, recording access, and correlation references stitched into one mental model
- Deployment admin visibility beyond rollups: clear path from cross-tenant hotspots to the affected tenant/session
- Updated docs that separate shipped observability from target-state LiveKit-style insights parity

**Tests:**
- `apps/web/tests/call-observability-api.test.ts`
- `apps/web/tests/call-history-api.test.ts`
- `apps/web/tests/admin-agent-definitions-api.test.ts`
- `apps/web/tests/admin-releases-api.test.ts`
- `apps/web/e2e/call-ops-live.spec.ts`
- `apps/web/e2e/call-history.spec.ts`
- `apps/web/e2e/admin-agent-definitions.spec.ts`
- `apps/web/e2e/admin-health.spec.ts`
- `apps/web/e2e/admin-releases.spec.ts`

**Verification gate:**
```bash
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/call-history-api.test.ts tests/call-observability-api.test.ts tests/admin-agent-definitions-api.test.ts tests/admin-releases-api.test.ts
pnpm -C apps/web exec playwright test e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/admin-agent-definitions.spec.ts e2e/admin-health.spec.ts e2e/admin-releases.spec.ts --project=chromium
```

**Context budget:** ~55K tokens

**Depends on:** Phase 2

**Can run in parallel with:** none -- observability/test planning depends on the provider workflow being clear first

### Phase 4: NFQ Clinic Tenant Workflow Completion

**Objective:** Finish the clinic tenant workflow around the real staff journey instead of leaving call handling and booking follow-up as adjacent screens.

**Input:**
- Spec sections: `docs/requirements/checklist.md` rows 223-245, 414, 424-430
- Source files: `apps/web/src/solutions/appointment-booking/bookings-page.tsx`, `apps/web/src/app/(tenant)/call-ops/page.tsx`, `apps/web/src/app/(tenant)/call-ops/history/page.tsx`, `apps/web/src/app/(tenant)/dashboard/page.tsx`, `apps/web/src/app/(tenant)/integrations/page-client.tsx`, `apps/web/src/app/(tenant)/settings/recordings/page-client.tsx`, `apps/web/src/components/tenant-shell.tsx`
- Dependencies from prior phases: Phase 1 for access control, Phase 3 for observability model

**Deliverables:**
- Stronger call-ops -> bookings context transfer for handoff and follow-up cases
- Clinic dashboard wording and CTAs that direct staff to live work, not generic metrics theater
- Bookings workspace polish around queue prioritization, selected-call clarity, and automation readiness
- Integration/setup cues that explain what clinic staff must do next in plain language
- Tenant navigation and page copy aligned to clinic-operator tasks

**Tests:**
- `apps/web/tests/dashboard-api.test.ts`
- `apps/web/tests/clinic-bookings-api.test.ts`
- `apps/web/tests/clinic-knowledge-base-api.test.ts`
- `apps/web/tests/call-history-api.test.ts`
- `apps/web/tests/call-observability-api.test.ts`
- `apps/web/e2e/dashboard.spec.ts`
- `apps/web/e2e/call-ops-live.spec.ts`
- `apps/web/e2e/call-history.spec.ts`
- `apps/web/e2e/clinic-bookings.spec.ts`
- `apps/web/e2e/clinic-knowledge-base.spec.ts`
- `apps/web/e2e/integrations.spec.ts`

**Verification gate:**
```bash
pnpm -C apps/web check-types
pnpm -C apps/web test -- tests/dashboard-api.test.ts tests/clinic-bookings-api.test.ts tests/clinic-knowledge-base-api.test.ts tests/call-history-api.test.ts tests/call-observability-api.test.ts tests/connectors-api.test.ts
pnpm -C apps/web exec playwright test e2e/dashboard.spec.ts e2e/call-ops-live.spec.ts e2e/call-history.spec.ts e2e/clinic-bookings.spec.ts e2e/clinic-knowledge-base.spec.ts e2e/integrations.spec.ts --project=chromium
```

**Context budget:** ~25K tokens

**Depends on:** Phase 3

**Can run in parallel with:** none -- keep clinic workflow ownership coherent

### Phase 5: Browser Proof, Harness, and Doc Closure

**Objective:** Replace mocked confidence with real evidence and close the documentation loop.

**Input:**
- Spec sections: `docs/requirements/checklist.md` rows 66, 74, 78, 80, 98, 223-245, 379, 383, 414, 424-430
- Source files: `apps/web/playwright.config.ts`, `tools/scripts/run_web_ui_harness.sh`, updated web pages/tests, requirement docs
- Dependencies from prior phases: Phases 2, 3, and 4

**Deliverables:**
- Supported-Node browser runs for the changed deployment and tenant flows
- `tools/agents/artifacts/ui-harness/...` evidence bundle
- Desktop and mobile verification artifacts from Chrome DevTools MCP and Playwright MCP
- Updated checklist proof text and execution-plan progress notes

**Tests:**
- Full `apps/web` Vitest suite
- Full `apps/web` Playwright suite
- `tools/scripts/run_web_ui_harness.sh`

**Verification gate:**
```bash
nvm use 20 || nvm use 22
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/run_web_ui_harness.sh
```

**Context budget:** ~25K tokens

**Depends on:** Phases 2, 3, and 4

**Can run in parallel with:** none -- final integration gate

---

## 3. Execution Graph

```text
Phase 1 (Fail-Closed Web Access)
        |
        v
Phase 2 (Provider Backoffice)
        |
        v
Phase 3 (Testing + Observability)
        |
        v
Phase 4 (Clinic Tenant Workflow)
        |
        v
Phase 5 (Browser Proof + Docs)
```

---

## 4. Execution Protocol

For each phase, the supervisor follows this sequence:

1. Gather the exact checklist rows and page/API files in scope.
2. Build the smallest implementation slice that materially improves an identified row.
3. Run the phase verification gate immediately.
4. Preserve artifacts for browser validation, not just terminal logs.
5. Update `docs/requirements/checklist.md` only after the evidence is real.

### Gate Escalation Protocol

1. First failure: fix the implementation or test directly.
2. Second failure: shrink the phase to the blocking sub-surface.
3. Third failure: stop and record the dependency or environment blocker explicitly.

### Integration Gate

After Phases 2, 3, and 4 merge:

```bash
nvm use 20 || nvm use 22
pnpm -C apps/web check-types
pnpm -C apps/web test
pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/run_web_ui_harness.sh
```

---

## 5. Risks and Non-Goals

- The current shell/runtime must switch off Node `25.x` before Playwright or the UI harness will run. Treat this as a hard environment prerequisite, not an optional cleanup.
- The repo does not currently expose simulation/test-run or traffic-splitting APIs for governed agents. If those are required for this phase, call them out as backend prerequisites immediately instead of faking them with frontend-only theater.
- Do not inflate scope into VOX public-chat, outbound campaigns, or generic admin billing just because related APIs exist.
- Do not call the clinic console “done” when live handoff workflow still requires operators to bounce between pages without clear context.

---

## 6. Files Modified

| File | Phase | Change |
|------|-------|--------|
| `docs/requirements/ui-requirements.md` | Planning | Correct current UI reality and gap statements |
| `docs/requirements/checklist.md` | Planning | Correct overstated UI claims and align proof targets |
| `docs/milestones/exec-plans/nfq-clinic-and-deployment-console-ui-finish-plan.md` | Planning | Add execution sequence for remaining UI work |

---

## 7. Progress Tracking

| Phase | Status | Date | Tests | Notes |
|-------|--------|------|-------|-------|
| 1 | Completed | 2026-03-09 | `pnpm -C apps/web check-types`; `pnpm -C apps/web test -- tests/middleware.test.ts tests/auth-session-route.test.ts tests/auth-oidc-routes.test.ts`; `tools/scripts/run_web_ui_harness.sh` | Fail-closed route-role enforcement landed; PR `#407` |
| 2 | Completed | 2026-03-16 | targeted admin Vitest + Playwright + harness | Provider backoffice/operator polish landed; release rollout screen was further simplified into a tenant-first rollout flow with clearer package terminology, persistent package details, and advanced JSON demoted for builder-only use. |
| 3 | Completed | 2026-03-09 | targeted observability/admin Vitest + Playwright + harness | Session-insights + rollout-guardrail closure landed; missing backend APIs explicitly documented; PR `#409` |
| 4 | Completed | 2026-03-09 | targeted clinic Vitest + Playwright + harness | Clinic operator continuity across dashboard/call-ops/bookings/integrations landed; PR `#410` |
| 5 | Completed | 2026-03-09 | `pnpm -C apps/web check-types`; `pnpm -C apps/web test`; `pnpm -C apps/web exec playwright test --project=chromium`; `tools/scripts/run_web_ui_harness.sh` | Full repo-scope browser/test proof captured under `tools/agents/artifacts/ui-harness/local-20260309T210317Z`; manual browser artifacts under `tools/agents/artifacts/manual-phase4-20260309` |

### Final Evidence Notes

- Full web Vitest: 31 files / 179 tests passed on Node `v22.21.1`.
- Full Playwright suite: 72 tests passed on Chromium.
- Full UI harness: `tools/agents/artifacts/ui-harness/local-20260309T210317Z`.
- Manual browser artifacts: `tools/agents/artifacts/manual-phase4-20260309`.
- Remaining product gaps after this execution are documented intentionally, not hidden:
  - governed-agent test/eval compare-runs and traffic split still need backend APIs
  - clinic/live support workflow is materially better but still not a full unified command center
  - deployed-site proof remains separate from repo proof

---

## 8. Cross-References

- Architecture: `docs/arch/arch_spine.md`
- Current status: `wiki/architecture/architecture.md (status section)`
- UI requirements: `docs/requirements/ui-requirements.md`
- Delivery matrix: `docs/requirements/checklist.md`
- NFQ product scope: `docs/requirements/nfq.md`
- Browser harness: `tools/scripts/run_web_ui_harness.sh`
