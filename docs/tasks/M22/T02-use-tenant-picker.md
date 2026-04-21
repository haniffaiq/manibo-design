# T02: Extract useTenantPicker hook

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

Six admin pages duplicate the same tenant picker pattern:

```ts
const [selectedTenantId, setSelectedTenantId] = useState("");
const { data: tenantsData, isLoading: tenantsLoading } = useSWR(
  swrKeys.xxx(), () => listAdminTenants(500, 0), { revalidateOnFocus: false }
);
const tenants = tenantsData ?? EMPTY_TENANTS;
useEffect(() => {
  if (!selectedTenantId && tenants.length > 0) setSelectedTenantId(tenants[0].id);
}, [selectedTenantId, tenants]);
```

Plus near-identical `<Select>` JSX with the same placeholder/disabled logic.

## Subtasks

- [x] **Create `apps/web/src/hooks/use-tenant-picker.ts`** — hook returning `{ tenants, selectedTenantId, setSelectedTenantId, selectedTenant, loading, error }`
- [x] **Create `apps/web/src/components/tenant-select.tsx`** — ready-to-render `<TenantSelect>` component that the hook can return or that consumes the hook's state
- [x] **Add vitest tests** for auto-select-first behavior

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-tenant-picker.ts` | Create | Shared hook |
| `apps/web/src/components/tenant-select.tsx` | Create | Tenant selector component |
| `apps/web/tests/use-tenant-picker.test.ts` | Create | Unit tests |

## Implementation Notes

- Hook accepts `swrKey: string` param so each page can have its own cache entry (matching existing `swrKeys.*()` pattern)
- `include_non_production` option for pages that need demo/test tenants (settings does this)
- The `<TenantSelect>` component should accept `disabled` and `data-testid` props — existing E2E tests depend on specific test IDs
- Some pages do extra work on tenant change (phone-numbers clears edit state, agent-definitions clears starters). The hook should accept an `onTenantChange` callback.

## Acceptance Criteria

- [x] Hook handles SWR fetch, auto-select-first, loading/error state
- [x] `TenantSelect` renders the Radix Select with consistent styling
- [x] `onTenantChange` callback fires when tenant selection changes
- [x] Vitest tests cover auto-select and tenant change scenarios
