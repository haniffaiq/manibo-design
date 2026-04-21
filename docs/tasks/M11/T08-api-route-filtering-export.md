# T08: API Route Filtering in Export Script

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T08 - API route filtering in export script`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Ensure the export script correctly excludes non-contracted solutions so their API routes don't exist in the exported source.

**Important:** Solution API routes are NOT separate files in `apps/api/`. They are defined INSIDE each solution package (`solutions/{name}/src/{name}/routes/`) and mounted dynamically at runtime via solution manifests (`api_router_specs`/`api_routers` in each manifest.py). There are no solution-specific route files under `apps/api/src/` to prune.

This means API route filtering is actually **solution directory filtering** — if the export doesn't include `solutions/lead_capture/`, the lead_capture routes physically don't exist, and the dynamic router mount finds nothing to load.

## Subtasks

- [x] **Verify existing export** already excludes non-contracted solution directories (the primary defense)
- [x] **Verify `apps/api/` has no solution-specific files** that would leak routes for excluded solutions
- [x] **Check for any hardcoded solution references** in `apps/api/src/platform_api/main.py` or `bootstrap.py` that would break when a solution is absent
- [x] **Verify graceful degradation** — `apps/api/` starts cleanly when a contracted solution's package is not installed (entry point discovery returns empty, no import error)
- [x] **Add export verification step** — after export, attempt to start the API and confirm only contracted solution routes are mountable

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/artifact/export-client.sh` | Modify | Verify solution directory filtering covers API routes |
| `apps/api/src/platform_api/main.py` | Verify | No hardcoded solution imports (should be dynamic discovery only) |

## Implementation Notes

The platform already uses `importlib.metadata.entry_points(group="platform.solutions")` for discovery. If a solution package isn't installed, its routes don't mount. The export script's primary job is ensuring the `solutions/` directory only contains contracted packages — that's sufficient for API route exclusion.

Do NOT attempt to "prune route files from apps/api/" — there aren't any solution-specific route files there. The routes live inside the solution packages themselves.

## Acceptance Criteria

- [x] Export excludes non-contracted solution directories from `solutions/`
- [x] No hardcoded solution imports exist in `apps/api/src/` (all discovery is dynamic)
- [x] Exported `apps/api/` starts without import errors when non-contracted solutions are absent
- [x] `grep -r "lead_capture" /tmp/export/apps/api/` returns zero matches
- [x] Export script still works for existing clients without regression

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Dynamic route mounting: `apps/api/src/platform_api/main.py` uses solution manifest discovery
- Client manifest: `distribution/clients/nfq.yaml`
