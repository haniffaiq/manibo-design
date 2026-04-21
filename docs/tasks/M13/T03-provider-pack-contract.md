# T03: Provider-pack contract + capability matrix

> **Milestone**: M13-telephony-management
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01
> **Planning Note**: Planning backlog only. Created from explicit human request on 2026-04-01. Do not implement until M13 is explicitly activated.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M13 T03 - define telephony provider-pack contract`

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

Define the Layer-3 provider-pack interface for telephony providers and capture the capability matrix for Telnyx and Genesys. This task ensures the platform core stays generic while provider-specific provisioning and sync behavior lives in installable provider packs. Supported providers are deployment-composed within the current hard-coded provider set (`telnyx`, `genesys`); operator surfaces must discover which of those packs are installed for this deployment, but adding a brand-new provider kind still requires a platform-core enum/schema expansion.

## Subtasks

- [x] **Define provider-pack interface**: account validation, trunk sync, number sync, number acquisition, reconciliation hooks.
- [x] **Document capability flags**: capability discovery drives API and UI availability.
- [x] **Map Telnyx and Genesys implementations**: identify common contract and provider-specific gaps.
- [x] **Publish supported providers from installed packs**: provider-account APIs expose deployment-aware provider options instead of a fake universal provider list. This applies to the current supported provider kinds (`telnyx`, `genesys`), not arbitrary new provider identities.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/platform-core/src/platform_core/telephony/providers/base.py` | Create | Generic provider-pack interface |
| `solutions/provider_telnyx/src/provider_telnyx/telephony.py` | Create | Telnyx provider-pack implementation scaffold |
| `solutions/provider_genesys/src/provider_genesys/telephony.py` | Create | Genesys provider-pack implementation scaffold |

## Implementation Notes

- Capability flags must drive UI state. Unsupported provider actions do not get fake CTAs.
- Keep provider-pack imports one-way through Layer-2 contracts only.
- Provider-account creation must reject provider kinds that are not installed in this deployment.

## Acceptance Criteria

- [x] Provider-pack interface is explicit and layer-safe.
- [x] Telnyx and Genesys capability differences are modeled without fake parity.
- [x] Platform core can reason about providers through one contract.
- [x] API consumers can discover supported providers from installed packs before creating provider accounts.
- [x] The task documents the current boundary explicitly: installable packs compose the supported provider set per deployment, but introducing a new provider kind still requires Layer-2/schema work.

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [voice.md](../../arch/maps/voice.md)
