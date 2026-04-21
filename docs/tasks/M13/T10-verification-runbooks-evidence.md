# T10: Verification, runbooks, and proof harness for multi-provider telephony

> **Milestone**: M13-telephony-management
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01-T09
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T10 - add telephony verification and runbook proof`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M13-telephony-management`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M13/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M13/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Define and implement the proof path for the whole multi-provider telephony control plane. This includes backend tests, provider-pack tests, browser flows, MCP inspection artifacts, API inventory regeneration, and operator runbook updates.

## Subtasks

- [ ] **Define backend proof**: API, platform-core, and provider-pack coverage by capability slice.
- [ ] **Define UI proof**: desktop/mobile MCP verification plus full Playwright and harness expectations.
- [ ] **Update runbooks and inventory**: refresh ops docs, API inventory, and evidence paths.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/ops/phone-number-onboarding.md` | Modify | Replace manual/env operator workflow with control-plane runbook |
| `wiki/ops/inbound-voice-routing.md` | Modify | Update routing verification with inventory-backed model |
| `docs/arch/generated/api_inventory.md` | Modify | Regenerated after telephony API changes |

## Implementation Notes

- This milestone will touch both backend and UI surfaces, so proof must include both.
- Browser verification is mandatory for operator workflows; do not wave it away with unit tests.

## Acceptance Criteria

- [ ] Verification commands cover backend, UI, MCP browser proof, and API inventory.
- [ ] Runbooks explain Telnyx and Genesys operator flows without env-driven number management.
- [ ] Evidence requirements are explicit before implementation starts.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [README.md](../../milestones/README.md)
