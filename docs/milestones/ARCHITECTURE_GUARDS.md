# Milestone Architecture Guards

Cross-cutting layer constraints that apply to ALL milestones. Read before implementing any milestone.

## Layer Placement Rules (Quick Reference)

| Code | Layer | Lives in | May import |
|------|-------|----------|------------|
| Agent runtime, tools, temporal primitives | 1 (Grove) | `packages/grove/` | stdlib + third-party only |
| Auth, tenancy, solution registry, gating, connectors, public ingress | 2 (Platform Core) | `packages/platform-core/` | Layer 1 |
| Business solutions, plugins, migrations, API routers | 3 (Solutions) | `solutions/*/` | Layers 1 + 2 |
| Composition, transports, UI shells | 4 (Apps) | `apps/*/` | Layers 1 + 2 + 3 |

## Guards by Domain (with milestone references)

### 1. Grove Independence (Layer 1)

**Rule:** Grove is product-agnostic. No platform, tenant, or business-specific logic.

| Guard | Milestone | What to watch |
|-------|-----------|---------------|
| Webhook sender action is NOT a Grove WorkflowAction | M14 T06 | Webhook sending is platform governance, not a generic execution primitive. Implement in `packages/platform-core/actions/` or `apps/temporal-worker/`. |
| Tool catalog governance metadata is NOT in Grove | M18 T02 | Grove owns the runtime tool registry (`packages/grove/src/grove/tools/registry.py`). Platform Core wraps it with risk classification, ownership, and provider policy in `packages/platform-core/tool_catalog/`. |
| Public ingress session lifecycle is NOT in Grove | M4 T01-T03 | Guest sessions, anonymous tokens, widget bootstrap are Platform Core responsibilities (`packages/platform-core/public_ingress/`). Grove provides channel adapter primitives; Platform Core owns the session lifecycle. |

### 2. No Cross-Solution Imports (Layer 3)

**Rule:** Solutions never import other solutions. Cross-solution contracts live in Platform Core.

| Guard | Milestone | What to watch |
|-------|-----------|---------------|
| Email adapter is in Platform Core, not in lead_capture | M9 T02 | `packages/platform-core/connectors/` owns the email adapter interface. Solutions reference it via Platform Core contract. |
| Lead type is in Platform Core, not exported from lead_capture | M6, M9, M02 | If M6 (lead capture) defines a `Lead` type that M9 (FNA) or M02 (journey tracking) needs, that type must live in `packages/platform-core/contracts/`. |
| Cross-solution data types (Lead, Driver, Booking) are Platform Core contracts | M11 | Architecture test: `grep -r "from.*solutions/" solutions/*/src/` must return zero cross-solution imports. |
| Solution UI packages never import @solution/{other} | M11 | Each solution's `ui/` package imports from `@grove/ui` and shared `apps/web` types, never from other solution UI packages. |

### 3. App Shell Thinness (Layer 4)

**Rule:** Apps are composition shells — transport, wiring, and UI rendering only. No business logic.

| Guard | Milestone | What to watch |
|-------|-----------|---------------|
| Dashboard health logic is API rendering, not computation | M20 T06 | Health rollups come from `GET /health` API (Platform Core). Dashboard renders conditionally based on API response — no health computation in `apps/web`. |
| Call-ops intervention logic is API calls, not state machines | M21 T04-T09 | All escalation, takeover, transfer logic lives in Platform Core APIs. Call-ops components call APIs and render results — no business rules in React components. |
| Workflow retry is an API call, not a Temporal direct call | M15 T04 | Retry goes through `POST /workflows/executions/{id}/retry` (Platform Core route), not a direct Temporal client call from the web app. |

### 4. Frontend Solution Isolation (Layer 3 Web)

**Rule:** Solution web UI is a separate npm package, excluded by workspace config for non-contracted clients.

| Guard | Milestone | What to watch |
|-------|-----------|---------------|
| Solution pages live in `solutions/{name}/ui/`, not `apps/web/src/solutions/` | M11 T02-T03 | After M11, `apps/web/src/solutions/` contains only generated registry files. |
| Solution UI packages are optional workspace members | M11 T06 | `docker/profiles/*/pnpm-workspace.yaml` only lists contracted solution UIs. |
| Generated registry is the only link between apps/web and solution UI | M11 T04-T05 | No hardcoded imports from `@solution/*` in apps/web source. Generator produces dynamic imports based on installed workspace packages. |
| M21 T16 (bookings decomposition) happens INSIDE solutions/appointment_booking/ui/ | M21 T16 | Components go to `solutions/appointment_booking/ui/src/components/`, not `apps/web/src/solutions/`. |

### 5. Integration Hub vs Interactive Channel Runtime

**Rule:** Request/response integrations and live channel runtimes are different subsystems. Do not smear them together.

| Guard | Milestone | What to watch |
|-------|-----------|---------------|
| Notification adapters are NOT interactive channel runtimes | M14 T03-T07 | CRM/email/SMS/Slack-notification live in `packages/platform-core/connectors/`. Website widget chat and WhatsApp interactive live under the future runtime track using a future shared Layer 2 channel-runtime package family in `packages/platform-core/` plus Layer 3 channel packages/provider packs. The exact Layer 2 package path stays TBD until that track is activated. Future Slack-interactive work stays out of backlog until a real requirement exists. |
| Provider account/runtime is NOT a connector row | M14.1-M14.3 | Account auth state, webhook registration state, runtime state, health, restart/backoff, and session/thread routing belong to channel runtime state, not `public.connectors`. Future Slack-interactive work follows the same rule if it is ever required. |
| Mapping boundary is fixed | M14 T01-T07 | Workflow/extraction maps source data into canonical payload. Connector config maps canonical payload into provider payload. Do not leak HubSpot/Slack/SMTP payload shapes into workflow definitions. |
| Webhook delivery stays in Platform Core / worker | M14 T07 | Reuse the existing Platform Core / Temporal webhook delivery path. Do not reintroduce a Grove `WorkflowAction` for provider webhook sending. |

ASCII split:

```text
+---------------------------+    +---------------------------+    +---------------------------+
| notification adapter      |    | interactive channel       |    | provider account/runtime  |
| request/response send     |    | runtime                   |    | tenant-scoped installed   |
| CRM / email / SMS /       |    | widget / WhatsApp /       |    | channel state             |
| Slack notification        |    | future Slack interactive  |    | auth + webhook + health   |
+---------------------------+    +---------------------------+    +---------------------------+
```

## Mechanical Enforcement

These guards should become architecture tests:

```python
# tests/architecture/test_layer_guards.py

def test_no_product_specific_grove_actions():
    """Webhook, notification, CRM actions must NOT be in packages/grove/"""
    grove_actions = glob("packages/grove/src/grove/actions/*.py")
    for action_file in grove_actions:
        content = read(action_file)
        assert "webhook" not in content.lower()
        assert "notification" not in content.lower()
        assert "crm" not in content.lower()

def test_no_cross_solution_imports():
    """Solutions never import from other solutions"""
    for solution_dir in glob("solutions/*/src/"):
        for py_file in glob(f"{solution_dir}/**/*.py"):
            for line in read_imports(py_file):
                assert not is_cross_solution_import(line, solution_dir)

def test_no_cross_solution_ui_imports():
    """Solution UI packages never import @solution/{other}"""
    for ui_dir in glob("solutions/*/ui/src/"):
        for ts_file in glob(f"{ui_dir}/**/*.{ts,tsx}"):
            for line in read_imports(ts_file):
                assert "@solution/" not in line or is_same_solution(line, ui_dir)

def test_platform_core_owns_shared_contracts():
    """Cross-solution types (Lead, Driver, Booking) live in platform-core"""
    # Any type exported by a solution that is imported by another solution
    # should instead be in packages/platform-core/contracts/
    pass
```
