# M27: Browser Screenshot Verification & Manual QA Checklist

## How to run

```bash
# 1. Start the dev server
pnpm --filter @nfq/web dev

# 2. Open browser at http://localhost:3000

# 3. Run Playwright visual tests (generates baseline screenshots)
pnpm --filter @nfq/web playwright:test -- tests/visual/ --update-snapshots

# 4. Screenshots saved to: apps/web/tests/visual/m27-console-craft.spec.ts-snapshots/
```

## QA Checklist

### Active Calls Page (`/call-ops`)

- [x] **Card-per-call layout**: Each call renders as an individual card (not a DataTable row)
- [x] **Button hierarchy**: Each card shows exactly 2 primary buttons (Take over/Claim + Transfer) and 1 overflow menu ("...")
- [x] **Overflow menu**: Clicking "..." opens dropdown with: Support details, Listen in, Join call, Watch transcript
- [x] **Escalation badge**: Escalated calls show `<Badge variant="error">Urgent transfer</Badge>` or `<Badge variant="warning">Needs help</Badge>` from `@grove/ui`
- [x] **Urgent banner**: Transfer-requested calls show a red banner with inline Transfer + Join call buttons
- [x] **Performance collapsed**: SlowdownSummary + hotspot table are inside a `<details>` element, collapsed by default
- [x] **Performance expandable**: Clicking "Performance summary" expands the section

### Support Drawer (`/call-ops` → click overflow → Support details)

- [x] **Drawer component**: Opens using the shared `Drawer` from `@grove/ui` (not custom positioning)
- [x] **3-tier disclosure**:
  - Tier 1 (always visible): Live support workflow guidance + Session insights feed
  - Tier 2 (collapsed `<details>`): Performance metrics + Stack cards
  - Tier 3 (collapsed `<details>`): Assistant path + Support references
- [x] **Close button**: X button in the drawer header closes it

### Call History Page (`/call-ops/history`)

- [x] **Master-detail layout**: Left panel shows compact call list (~40%), right panel shows detail (~60%)
- [x] **Call selection**: Clicking a call in the left list loads its details on the right
- [x] **Empty state**: When no call is selected, right panel shows placeholder text
- [x] **Technical drawer**: "View technical details" button opens a Drawer with trace context + node table

### Alerts Page (`/call-ops/alerts`)

- [x] **Card-per-alert**: Each alert renders as a card (not DataTable row)
- [x] **Severity border**: Left border color matches severity (critical = red, warning = amber, info = gray)
- [x] **Relative timestamps**: Shows "2m ago" style timestamps with absolute time on hover
- [x] **Auto-refresh**: Page auto-refreshes every 10s via SWR (no manual Refresh button)
- [x] **Filter auto-apply**: Changing severity/status/since filters immediately updates results

### Deployment Dashboard (`/admin`)

- [x] **Health hero card**: Platform health is a prominent card spanning 2/3 width with accent border/background
- [x] **Error rate card**: Error rate card takes remaining 1/3 width
- [x] **Active calls count**: Hero card shows active calls count prominently
- [x] **Worker badges**: API and Temporal worker status badges visible in hero card
- [x] **Tenant count**: Tenant count integrated into hero card

### Sidebar Navigation (all tenant pages)

- [x] **Rounded-lg**: Nav items use `rounded-lg` (not `rounded-2xl`)
- [x] **Design tokens**: Borders use `var(--color-border)`, not `rgba()`
- [x] **Shadow tokens**: Active item shadow uses `var(--shadow-sm)`, not custom `rgba()`
- [x] **Badge pills**: NavItem supports optional badge pill (infrastructure in place)
- [x] **Title icon**: "K" icon uses `rounded-lg` and token-based border/shadow

### Escalation Modal

- [x] **No position hack**: Modal renders centered (no `top-8 max-h-[calc(100vh-4rem)]` override)

### Design Tokens (`packages/ui/src/tokens/brand.css`)

- [x] **`--color-error-100`**: `#fee2e2` exists
- [x] **`--color-warning-100`**: `#fef3c7` exists
- [x] **`--color-warning-200`**: `#fde68a` exists

### Shared Components

- [x] **StatusMessage**: All error/notice patterns use `StatusMessage` (no raw `<p>` errors, no `ActionBanners`, no `InlineNotice`)
- [x] **EscalationBadge deleted**: `apps/web/src/components/call-ops/escalation-badge.tsx` does not exist
- [x] **ActionBanners deleted**: `apps/web/src/components/action-banners.tsx` does not exist
- [x] **InlineNotice deleted**: `apps/web/src/components/inline-notice.tsx` does not exist

### DataTable

- [x] **Row hover**: DataTable body rows highlight with `hover:bg-[var(--color-bg-subtle)]`

## Playwright Visual Test Coverage

| Test | Screenshot | Covers |
|------|-----------|--------|
| call-ops card layout | `call-ops-card-layout.png` | T09, T10, T11, T12 |
| overflow menu open | `call-ops-overflow-open.png` | T03, T09 |
| performance expanded | `call-ops-performance-expanded.png` | T12 |
| alerts card layout | `alerts-card-layout.png` | T17, T18 |
| call history master-detail | `call-history-master-detail.png` | T15, T16 |
| admin dashboard hero | `admin-dashboard-hero.png` | T19 |
| sidebar styling | `sidebar-styling.png` | T06 |

## Verification Commands

```bash
# TypeScript
pnpm --filter @nfq/web check-types
pnpm --filter @grove/ui check-types

# Lint
pnpm --filter @nfq/web lint

# Unit tests
pnpm --filter @nfq/web test

# Visual regression
pnpm --filter @nfq/web playwright:test -- tests/visual/
```
