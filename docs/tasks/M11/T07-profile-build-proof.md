# T07: Profile Build Proof

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T06

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T07 - profile build proof`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Prove that the profile-based workspace filtering actually works by building `apps/web` under three configurations: all solutions, NFQ-only solutions, and zero solutions. This validates that the registry generator and dynamic imports handle missing solutions gracefully without build errors.

## Subtasks

- [x] **Build with all solutions** — full workspace, `pnpm -C apps/web build` succeeds
- [x] **Build with NFQ-only solutions** — using licensed-platform profile workspace, build succeeds
- [x] **Build with zero solutions** — empty solution workspace, build succeeds (empty registry)
- [x] **Create build proof script** — `tools/scripts/profile-build-proof.sh` that automates all 3 builds
- [x] **Add CI step or script** to run profile build proof

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `tools/scripts/profile-build-proof.sh` | Create | Script that runs `pnpm -C apps/web build` for all 3 profiles |

## Acceptance Criteria

- [x] Next.js builds cleanly with all solutions installed
- [x] Next.js builds cleanly with NFQ-only solutions (licensed-platform profile)
- [x] Next.js builds cleanly with zero solutions (empty profile)
- [x] Build proof script exists and is executable
- [x] No TypeScript errors, no missing import errors in any profile

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Depends on: T06 (profile-specific workspaces)
