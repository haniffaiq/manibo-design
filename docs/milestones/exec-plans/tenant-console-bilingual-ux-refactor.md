# Execution Plan: Tenant Console Bilingual UX Refactor

> **Status:** Active
> **Created:** 2026-03-09
> **Owner:** Codex
> **Track:** Epic

## 1. Feature Definition

**Goal:** Refactor the tenant console into a plain-language, clinic-operator-friendly UI with a tenant-locked language setting supporting English and Lithuanian.

**Evidence expectation (when Completed):**
- Code pointers:
  - `apps/api/src/platform_api/routes/tenant_settings.py`
  - `apps/api/src/platform_api/routes/tenants.py`
  - `apps/web/src/app/(tenant)/**`
- Test commands:
  - `uv run pytest apps/api/tests/integration/test_tenant_settings.py apps/api/tests/integration/test_tenants.py -q --tb=short`
  - `pnpm --filter @nfq/web check-types`
  - `pnpm --filter @nfq/web exec playwright test --project=chromium`
  - `tools/scripts/run_web_ui_harness.sh`

**Acceptance Criteria:**
- [ ] Tenant UI language is stored on `public.tenants` and constrained to `en` or `lt`.
- [ ] Tenant admins can read/update tenant locale through tenant settings; super admins can override it from deployment admin.
- [ ] Tenant shell and tenant pages use a shared bilingual copy system and locale-aware formatting.
- [ ] Clinic/operator-facing pages use simpler, lower-noise UI and plain-language copy.
- [ ] Full tenant UI verification passes, including Playwright and harness checks with artifacts.

**Checklist rows materially advanced:**
- `docs/requirements/checklist.md:429` clinic operators can claim, assign, and resolve follow-up work
- `docs/requirements/checklist.md:424` agent hands off to human operator
- `docs/requirements/checklist.md:425` urgent transfer handling
- `docs/requirements/checklist.md:423` reminder scheduling/settings visibility
- `docs/requirements/checklist.md` clinic knowledge-base review row

**Scope Boundaries:**

Included:
- Tenant pages under `apps/web/src/app/(tenant)/**`
- Tenant locale storage, API, and tenant settings UI
- Admin-tenant locale override support

Excluded:
- Deployment-admin-wide visual redesign
- Translation of backend domain data like doctor names, clinic names, specialties, addresses
- Route renames or broader IA churn outside tenant clarity fixes

---

## 2. Phase Plan

### Phase 1: Tenant Locale Source of Truth

**Objective:** Add tenant locale storage plus tenant/admin API access.

**Deliverables:**
- `packages/platform-core/src/platform_core/alembic_public/versions/20260309_120000_tenant_ui_locale.py`
- `packages/platform-core/src/platform_core/tenancy/admin_service.py`
- `apps/api/src/platform_api/routes/tenant_settings.py`
- `apps/api/src/platform_api/routes/tenants.py`
- `apps/api/tests/integration/test_tenant_settings.py`
- `apps/api/tests/integration/test_tenants.py`

**Verification gate:**
```bash
uv run pytest apps/api/tests/integration/test_tenant_settings.py apps/api/tests/integration/test_tenants.py -q --tb=short
```

**Depends on:** none

### Phase 2: Tenant Locale Web Infrastructure

**Objective:** Add typed locale APIs, dictionaries, provider/hooks, and locale-aware formatting helpers for tenant UI.

**Deliverables:**
- `apps/web/src/lib/api/tenant-settings.ts`
- `apps/web/src/lib/tenant-locale.tsx`
- `apps/web/src/lib/tenant-copy.ts`
- supporting tests under `apps/web/tests/**`

**Verification gate:**
```bash
pnpm --filter @nfq/web check-types
pnpm --filter @nfq/web exec vitest run apps/web/tests/*
```

**Depends on:** Phase 1

### Phase 3: Tenant Shell and Page Refactor

**Objective:** Apply the bilingual operator-first system to tenant shell and tenant pages, with deeper UX cleanup on clinic/operator-critical screens.

**Deliverables:**
- `apps/web/src/app/(tenant)/layout.tsx`
- `apps/web/src/components/sidebar-nav.tsx`
- `apps/web/src/app/(tenant)/settings/recordings/page.tsx`
- tenant pages and clinic features under `apps/web/src/app/(tenant)/**`
- deployment admin tenant locale override in `apps/web/src/app/(deployment)/admin/tenants/page.tsx`

**Verification gate:**
```bash
pnpm --filter @nfq/web check-types
pnpm --filter @nfq/web exec playwright test --project=chromium
tools/scripts/run_web_ui_harness.sh
```

**Depends on:** Phase 2

### Phase 4: UI Proof and Artifact Capture

**Objective:** Validate changed tenant flows on desktop/mobile with both browser stacks and keep artifacts.

**Deliverables:**
- Playwright desktop/mobile artifacts
- Chrome DevTools MCP desktop/mobile artifacts
- updated notes if residual failures remain external/unrelated

**Verification gate:**
```bash
pnpm --filter @nfq/web exec playwright test --project=chromium
tools/scripts/run_web_ui_harness.sh
```

**Depends on:** Phase 3

---

## 3. Execution Graph

```text
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4
```

---

## 4. Execution Protocol

1. Add the simplest stable tenant locale model first.
2. Prove role gating and persistence before touching UI.
3. Centralize tenant copy and formatting instead of sprinkling ad hoc strings.
4. Refactor shell and pages in descending operator importance:
   - settings
   - clinic knowledge base
   - bookings
   - call ops/history/alerts
   - dashboard
   - activity/integrations/team/automations
5. Run the full web verification gate and keep artifacts.

---

## 5. Rules

- Tenant locale is tenant-owned, not browser-owned.
- Supported locales are exactly `en` and `lt`.
- Domain payload values stay source-of-truth and are not translated.
- Use plain language for operator UI; avoid technical labels where simpler words exist.
- Keep the visual system calm, low-noise, and consistent.

---

## 6. Progress Tracking

| Phase | Status | Date | Tests | Notes |
|-------|--------|------|-------|-------|
| 1 | Done | 2026-03-09 | `uv run pytest apps/api/tests/integration/test_tenant_settings.py apps/api/tests/integration/test_tenants.py -q --tb=short` | Tenant locale schema + API landed |
| 2 | In Progress | 2026-03-09 | — | Web locale layer next |
| 3 | Pending |  |  |  |
| 4 | Pending |  |  |  |
