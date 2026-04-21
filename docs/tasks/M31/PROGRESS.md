# M31: Assistant-Centric Channel Management — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Add Channels tab to assistant detail page | Done | 2026-03-28 |
| T02 | Query phone numbers by agent_definition_id for channel list | Done | 2026-03-28 |
| T03 | Add phone channel form (create/pause/activate/remove) | Done | 2026-03-28 |
| T04 | Hide Phone Routing from sidebar, rename section to Assistants | Done | 2026-03-28 |
| T05 | Add channel type selector with coming soon for web chat and WhatsApp | Done | 2026-03-28 |
| T06 | Verification: channel management flow end-to-end | Done | 2026-03-28 |

## Notes

Canonical milestone branch: feat/M31-assistant-channels
Phase 1 only: phone channels wrapping existing phone_numbers API. No data migration.

## Verification Evidence

```
pnpm -C apps/web lint → No ESLint warnings or errors
pnpm -C apps/web check-types → tsc --noEmit (0 errors)
uv run ruff check → All checks passed!
uv run pyright → 0 errors, 0 warnings, 0 informations
```
