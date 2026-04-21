# Web App (Layer 4)

This is the Next.js UI. Optimize for performance and avoid async waterfalls.

## Start here

- Contract first: `wiki/history/platform-features.md`
- Rules of the road: `wiki/architecture/frontend.md`

## Scope discipline

- Generated API inventory files are planning aids, not automatic scope.
- Trace UI work to the exact `wiki/history/platform-features.md` row(s) it closes or materially improves.
- During MVP, do not build for "operational completeness" unless the requirement explicitly asks for it.
- Current repo priority is enforced by `wiki/index.md`.

## Fast verification

```bash
pnpm -C apps/web lint
pnpm -C apps/web test
```
