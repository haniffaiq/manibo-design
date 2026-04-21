# T17: Alerts — SWR Auto-Refresh, Remove Refresh Button

> **Milestone**: M27-console-craft-progressive-disclosure
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — Commit message: `feat: M27 T17 - alerts SWR auto-refresh`
2. **One Milestone = One PR** — Branch: `feat/M27-console-craft`
3. **Follow CLAUDE.md** — Read root AGENTS.md and this milestone doc first.

---

## Description

The alerts page uses manual state management (`useState` + `useCallback` + `useEffect`) instead of SWR, and requires operators to click a "Refresh" button to reload data. Migrate to SWR with `refreshInterval: 10_000` for auto-polling. Remove the Refresh button (per UX decision: no manual refresh buttons). Filters auto-apply on change.

## Subtasks

- [x] **Replace manual state** with `useSWR`:
  - Key: `swrKeys.operatorAlerts({ severity, status, since })` (add to `swr-keys.ts`)
  - Fetcher: the existing `listOperatorEvents` call
  - Options: `{ refreshInterval: 10_000, revalidateOnFocus: false }`
- [x] **Remove Refresh button** — replace with "Updated Xs ago" timestamp using SWR's `data` timestamp
- [x] **Auto-apply filters**: Remove the explicit "Refresh" click handler. SWR revalidates when the key changes (filters in the key).
- [x] **Keep ack/resolve actions** as manual mutations with `useSWRConfig().mutate` to optimistically update

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/call-ops/alerts/page.tsx` | Modify | Migrate to SWR |
| `apps/web/src/lib/swr-keys.ts` | Modify | Add operatorAlerts key factory |

## Implementation Notes

- The SWR key should include filter values so that changing a filter automatically triggers a refetch.
- Example key: `["operator-alerts", severity, status, since]`.
- The "Updated Xs ago" can be derived from a `useRef` that stores the last fetch time, updated in SWR's `onSuccess`.
- For ack/resolve: after the API call succeeds, use `mutate(key)` to refetch, or optimistically update the local data.
- Remove `refreshEvents` callback, `loading` state, `events` state — SWR handles all of this.

## Acceptance Criteria

- [x] Alerts page uses SWR with 10s refresh interval
- [x] No "Refresh" button — data auto-updates
- [x] Changing a filter automatically refetches (no submit button)
- [x] Ack and Resolve actions still work and update the list
- [x] Error state still displayed when fetch fails
- [x] `pnpm --filter @nfq/web check-types` passes

## References

- Milestone: [M27-console-craft-progressive-disclosure.md](../../milestones/M27-console-craft-progressive-disclosure.md)
- Critique finding #8: Alerts no auto-refresh
- UX decision (M21 PROGRESS.md): "No manual refresh buttons"
