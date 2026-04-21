# T07: Split tenancy tenants routes and normalize telephony route support

> **Milestone**: M36.1-platform-api-route-entropy-phase2
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T01, T02

---

## Description

Refactor `tenancy/tenants.py` so tenant lifecycle routes stop owning inline
schemas, OIDC provider request models, export helpers, and span annotation
logic, and normalize the remaining telephony route support seams so telephony
also follows the package contract instead of keeping route-root support-module
patterns alive.

## Subtasks

- [ ] **Move tenant schemas**: extract tenant lifecycle and OIDC provider models
      into `apps/api/src/platform_api/routes/tenancy/tenant_schemas.py`.
- [ ] **Move tenant service helpers**: extract tenant-row listing, export
      helpers, and onboarding compatibility/service logic into
      `apps/api/src/platform_api/routes/tenancy/tenant_service.py`.
- [ ] **Normalize telephony support**: replace route-root telephony support
      naming with package-local telephony dependencies, presenters, or error
      mapping seams.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/platform_api/routes/tenancy/tenants.py` | Modify | Thin route file after moving schemas and helpers out. |
| `apps/api/src/platform_api/routes/tenancy/tenant_schemas.py` | Create | Tenant lifecycle and OIDC provider route models. |
| `apps/api/src/platform_api/routes/tenancy/tenant_service.py` | Create | Listing/export/onboarding helper functions. |
| `apps/api/src/platform_api/routes/telephony/*` | Modify | Normalize telephony route support into package-local owners. |
| `apps/api/tests/...` | Modify | Update tenancy/telephony tests that import or patch moved helpers. |

## Implementation Notes

- Keep the existing route factory names and auth behavior unchanged.
- `_annotate_span(...)` should survive only if it remains genuinely local; if
  multiple tenancy or telephony files need it, give it one package-local owner.
- Do not use this task to redesign tenant exports, OIDC behavior, or telephony
  product behavior.

## Acceptance Criteria

- [ ] `tenancy/tenants.py` is below 500 LOC.
- [ ] Tenant route schemas no longer live inline in `tenants.py`.
- [ ] Telephony route support no longer depends on a route-root `*_support`
      module pattern.
- [ ] Focused tenancy and telephony API tests remain green with no inventory drift.

## References

- Milestone: [M36.1-platform-api-route-entropy-phase2.md](../../milestones/M36.1-platform-api-route-entropy-phase2.md)
- Depends on:
  - [T01-define-and-enforce-platform-api-route-package-contract.md](T01-define-and-enforce-platform-api-route-package-contract.md)
  - [T02-evict-root-level-route-support-modules-into-package-local-owners.md](T02-evict-root-level-route-support-modules-into-package-local-owners.md)
