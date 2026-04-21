# T11: Expose LiveKit Voice Controls in the Structured Agent Editor

> **Milestone**: M8-v2-voice-control-plane
> **Status**: In progress (implementation landed; lint/typecheck pass; admin web proof still blocked by existing Playwright MCP and admin-route proof debt)
> **Estimate**: S (1-2h)
> **Depends on**: T09
> **Checklist Rows**: `docs/requirements/checklist.md:228-229` — deployment-admin assistant editing surface for voice runtime policy

---

## Description

The schema and runtime already supported several LiveKit 1.5.1 voice controls, but the deployment admin editor did not expose them. That gap was trash because it forced YAML-only edits for fields the platform already knew how to persist and map. This task closes the editor gap for endpointing mode, interruption mode, noise cancellation model, and filler-audio enablement.

## Subtasks

- [x] Expose `turn_detection.endpointing_mode`
- [x] Expose `turn_detection.interruption_mode`
- [x] Expose `noise_cancellation.model`
- [x] Expose `filler_audio.enabled`
- [x] Keep the editor aligned with the existing schema and mapper instead of inventing new config shapes
- [x] Capture repo-standard UI proof for the changed admin editor surface with both Chrome DevTools MCP and Playwright MCP on desktop/mobile

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/app/(deployment)/admin/agent-definitions/structured-agent-editor.tsx` | Modify | Expose the schema-backed LiveKit voice controls in the visual editor |

## Acceptance Criteria

- [x] Deployment admin editor exposes the schema-backed LiveKit endpointing and interruption mode fields
- [x] Deployment admin editor exposes filler-audio and noise-cancellation controls already supported by the schema
- [x] `pnpm -C apps/web check-types` passes
- [x] Changed admin editor flows are verified with both Chrome DevTools MCP and Playwright MCP on desktop and mobile, with screenshots/artifacts kept
- [x] `tools/scripts/e2e/run-web-e2e.sh` passes for the changed admin editor flows

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts e2e/admin-agent-channels.spec.ts
tools/scripts/e2e/run-web-e2e.sh e2e/admin-agent-definitions.spec.ts e2e/admin-agent-channels.spec.ts
```

Current verification state:

- `pnpm -C apps/web lint` passes
- `pnpm -C apps/web check-types` passes
- `pnpm -C apps/web exec playwright test e2e/admin-agent-definitions.spec.ts e2e/admin-agent-channels.spec.ts` currently returns `9 passed, 2 failed`; the failures are existing `admin-agent-definitions` route/runtime issues where `admin-agent-definitions-workflow-modal` never appears for two draft-version scenarios
- `tools/scripts/e2e/run-web-e2e.sh e2e/admin-agent-definitions.spec.ts e2e/admin-agent-channels.spec.ts` currently fails during the production build on existing page-data errors for `/admin/observability/workflow-runs/[...workflowPath]` and `/admin`
- manual Playwright MCP proof is still blocked in this session because the MCP tool transport is attached to a dead server connection; the local Codex MCP config is now pinned to Node 22, but a fresh Codex session is still required to pick that fix up

## References

- Milestone: [M8-v2-voice-control-plane.md](../../milestones/M8-v2-voice-control-plane.md)
