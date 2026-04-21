# T01: Extract useActionState hook

> **Milestone**: M22-admin-shared-patterns
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: None

## Description

Every admin page (settings, users, tenants, agent-definitions, releases, phone-numbers) defines identical action plumbing:

```ts
const [actionBusy, setActionBusy] = useState(false);
const [actionError, setActionError] = useState<string | null>(null);
const [actionNotice, setActionNotice] = useState<string | null>(null);

async function runAction<T>(action: () => Promise<T>): Promise<T | null> {
  setActionBusy(true); setActionError(null); setActionNotice(null);
  try { return await action(); }
  catch (err) { setActionError(toErrorMessage(err)); return null; }
  finally { setActionBusy(false); }
}
```

Plus hand-rolled error/notice banner JSX in each page.

Extract into a hook that composes with the existing `useNotice` hook from `apps/web/src/hooks/use-notice.ts`.

## Subtasks

- [x] **Create `apps/web/src/hooks/use-action-state.ts`** — hook returning `{ busy, error, notice, run, clearError, clearNotice }`
- [x] **Create `apps/web/src/components/action-banners.tsx`** — `<ActionBanners error={...} notice={...} />` component replacing the per-page error/notice JSX
- [x] **Add vitest tests** for the hook (success, error, busy lifecycle)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/hooks/use-action-state.ts` | Create | Shared hook |
| `apps/web/src/components/action-banners.tsx` | Create | Error/notice banner component |
| `apps/web/tests/use-action-state.test.ts` | Create | Unit tests |

## Implementation Notes

- `run()` should accept `onSuccess?: (result: T) => void` callback for setting notice text per-call
- Error extraction should use the same `toErrorMessage(err)` pattern (extract to a shared util if not already)
- Compose with existing `useNotice` (auto-dismiss) for the notice, keep error sticky until cleared
- `busy` should disable all action buttons — consumers pass `disabled={busy}` to their buttons

## Acceptance Criteria

- [x] Hook covers the full action lifecycle: busy → success/error → notice/error display
- [x] `ActionBanners` renders error and notice with existing banner styles
- [x] Vitest tests pass
- [x] Types check clean
