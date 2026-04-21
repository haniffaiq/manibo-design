# T08: Integration Setup Wizard UI

> **Milestone**: M14-integration-depth
> **Status**: Parked future note
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02, T03, T04, T05, T06, T07
> **Checklist Rows**: Dependency context and non-regression rows only: "Integration adapters are tenant-configurable without per-tenant code forks (credentials, endpoints, field mappings are configuration, not code)", "CRM/sales inbox integration: structured lead data delivered in agreed format (API, webhook, or structured email)", "Email sending: automated emails for follow-up sequences and notifications", "SMS sending: notifications to contacts", and "Notification delivery is confirmed (delivery receipts or fallback if preferred channel fails)". Do not treat this task as active requirement advancement until M14 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — not part of the current M14 backlog. Do not implement unless a new checklist row or real regression explicitly reopens this scope.
2. **After activation: One Task = One Commit** — commit message: `feat: M14 T08 - add integration setup wizard ui`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M14-integration-depth`
4. Follow CLAUDE.md, docs/milestones/CLAUDE.md
5. Update `docs/tasks/M14/PROGRESS.md` after completing

---

## Description

Parked future note only: upgrade the existing tenant integrations page into a setup wizard only if a new checklist row or real regression explicitly reopens this scope. The page already exists, but this is not part of the current M14 backlog.

## Subtasks

- [ ] Add multi-instance connector creation/editing flows to the integrations page
- [ ] Surface provider schema fields and field mappings from the connector catalog
- [ ] Add test-send and health-check actions where the adapter supports them
- [ ] Keep the flow as a multi-step form, not a builder UI
- [ ] Add UI and API contract coverage for the wizard flow
- [ ] Verify the changed flows on desktop and mobile with Chrome DevTools MCP and Playwright MCP
- [ ] Run the full `apps/web` Playwright suite and `tools/scripts/e2e/run-web-e2e.sh`, then keep the proof artifacts
- [ ] Regenerate/check API inventory if the wizard changes connector or solution-config API contracts, and confirm consumer alignment

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(tenant)/integrations/page-client.tsx` | Modify | Setup wizard UI on top of existing integrations page |
| `apps/web/src/lib/api/connectors.ts` | Modify | API client support for new connector/routing fields |
| `apps/web/tests/connectors-api.test.ts` | Modify | API client contract coverage |
| `apps/web/e2e/integrations.spec.ts` | Modify | Wizard flow E2E coverage |

## Implementation Notes

- Reuse the existing integrations page instead of building a second admin surface.
- This task depends on the backend contract being real first. If the connector/routing contract is still moving, do not fake the UI.
- UI verification is mandatory here: desktop + mobile browser proof, full Playwright E2E, and the harness run are part of done.
- If this task touches any `src/` paths, the eventual PR must satisfy the OTLP evidence gate captured in `T09`; UI proof alone is not enough.

## Acceptance Criteria

- [ ] Tenant admins can create and edit multi-instance connector records through the UI
- [ ] The UI surfaces provider schema fields and connector field mappings
- [ ] Test-send and health-check flows are available where supported
- [ ] UI/API tests cover the main wizard flow
- [ ] Required desktop/mobile browser proof and harness artifacts are captured for the PR
- [ ] API inventory is regenerated/checked when API contracts move, and consumer alignment is called out explicitly

## References

- Milestone: [M14-integration-depth.md](../../milestones/M14-integration-depth.md)
