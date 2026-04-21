# T08: Delete dead shims, add entropy guards, and prove API inventory stability

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T03, T05, T06, T07

---

## Description

Finish the milestone with the explicit garbage-collection and enforcement pass:
delete flat shims proven obsolete by the earlier work, tighten the route-root
allowlist and file-size guards, and prove the published API surface did not
drift during the cleanup.

## Subtasks

- [ ] **Delete dead shims**: remove flat import shims proven unused after the
      earlier tasks update their callers.
- [ ] **Add contract and size guards**: extend architecture tests or repo
      file-size checks so banned route-root support modules and selected hotspot
      files fail mechanically.
- [ ] **Prove inventory stability**: regenerate and check the API inventory so
      the cleanup does not silently change published routes.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tests/architecture/test_platform_api_route_topology.py` | Modify | Keep topology and allowed-shim assertions aligned with the cleaned surface. |
| `tests/architecture/test_platform_api_route_contract.py` | Modify | Tighten the route-root and banned-name contract after deletions. |
| `tests/architecture/test_repo_file_size.py` | Modify | Add or tighten the route-file ceilings for the M36.1 hotspot files. |
| `docs/arch/generated/api_inventory.json` | Modify | Refresh recorded source-module paths after the cleanup. |
| `docs/tasks/M36.1/PROGRESS.md` | Modify | Record final verification evidence for the milestone. |

## Implementation Notes

- Deletion still needs proof from the earlier caller inventory and import-surface
  checks. If a shim remains because of one caller, state that caller explicitly.
- The guard should prevent entropy from returning, not punish unrelated files.
- Keep inventory regeneration in the same task that updates the final guards.

## Acceptance Criteria

- [ ] Dead shims proven unused are deleted.
- [ ] Mechanical checks fail if the route contract or selected M36.1 route files
      regrow.
- [ ] `tools/scripts/check_api_inventory.py` passes after the cleanup.
- [ ] Final milestone verification evidence is captured in `PROGRESS.md`.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on:
  - [T03-split-workflows-router-into-router-schemas-and-history.md](T03-split-workflows-router-into-router-schemas-and-history.md)
  - [T05-split-browser-voice-routes-into-router-schemas-and-runtime.md](T05-split-browser-voice-routes-into-router-schemas-and-runtime.md)
  - [T06-split-live-call-and-history-routes-into-smaller-package-modules.md](T06-split-live-call-and-history-routes-into-smaller-package-modules.md)
  - [T07-split-tenancy-tenants-routes-and-normalize-telephony-route-support.md](T07-split-tenancy-tenants-routes-and-normalize-telephony-route-support.md)
