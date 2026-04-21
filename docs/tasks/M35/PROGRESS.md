# M35: Env Settings Centralization — Progress

## Task Status

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Define shared low-level settings fragments and service entrypoint contract | Not Started | — |
| T08 | Centralize shared Grove execution-path runtime env readers | Not Started | — |
| T02 | Migrate platform-api and platform-core runtime readers to service-owned settings | Not Started | — |
| T03 | Migrate temporal worker and voice worker runtime readers to service-owned settings | Blocked on M13 T11 | — |
| T04 | Centralize web env contract and loader usage | Not Started | — |
| T05 | Rework root, app, and solution `.env.example` ownership | Not Started | — |
| T06 | Preserve deployment compatibility and document runtime proof expectations | Blocked on M13 T11 | — |
| T07 | Migrate surviving solution runtime env readers to explicit owners | Not Started | — |

## Notes

- Planning-only milestone. No implementation starts until the human explicitly activates M35.
- Design artifact: `wiki/queries/2026-04-09-design-env-settings-centralization.md`
- Chosen direction: shared low-level Python settings fragments plus service-owned entrypoints; web env modules split by server-only vs `NEXT_PUBLIC_*`; phase 1 keeps current deployment injection compatible.
- Solution-owned env examples are part of the scope, but only for solutions with real env-backed runtime ownership.
- Shared Grove execution-path env readers now have an explicit task owner (`T08`) instead of being implied under app-shell tasks.
- Telephony-heavy slices (`T03`, `T06`) stay blocked on active M13 T11 work before implementation begins.
