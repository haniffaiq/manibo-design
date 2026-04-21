# T04: Write `wiki/solutions/` pages (7 files)

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02 (directory exists), T02a (history context available)

---

## Description

Write 7 comprehensive pages under `wiki/solutions/`, one per active solution. Each covers: purpose, primary track (VOX/NFQ/both), tools, workflows, activities, manifest, external integrations, tests, boundary rules.

Content sources: Agent 3 audit report (all 11 solutions), T02a history digests (platform-features.md).

`outbound_campaigns` is deleted in T01 — no page for it.

## Pages to write

| Page | Solution | LOC | Track | Key content |
|------|----------|-----|-------|-------------|
| `appointment-booking.md` | `solutions/appointment_booking/` | 6.4K | NFQ | 6 Grove tools, AppointmentReminderWorkflow, clinic webhook CRM adapter, knowledge base, observability enricher |
| `driver-verification.md` | `solutions/driver_verification/` | 1.9K | VOX | DriverVerificationWorkflow, discrepancy detection, CSV import, telematics dependency |
| `lead-capture.md` | `solutions/lead_capture/` | 668 | both | LeadCaptureWorkflow, multilingual prompting, CRM webhook |
| `schedule-management.md` | `solutions/schedule_management/` | 596 | VOX | ScheduleChangeWorkflow (parse → validate → execute), plugin with empty tools |
| `telematics-ingestion.md` | `solutions/telematics_ingestion/` | 557 | VOX | TelematicsEventWorkflow, webhook signature verify, idempotency, driver_verification hard dep |
| `notifications.md` | `solutions/notifications/` | 478 | both | 2 activities, TelnyxSmsConfig, optional dependency for appointment_booking + operations_monitor |
| `provider-packs.md` | `solutions/provider_genesys/` + `provider_telnyx/` | 258+931 | both | ProviderPackManifest vs SolutionManifest, number search, telephony_numbers.py |

Each page structure:
- **What it does** (2–3 sentences)
- **Track** (VOX / NFQ / both)
- **Tools** (Grove tools registered, if any)
- **Workflows and activities** (table: name, purpose)
- **External integrations** (DB tables, APIs, other solutions)
- **Manifest** (path, key entries)
- **Tests** (count, coverage areas)
- **Boundary rules** (no cross-solution imports, contracts mediate cross-solution data)
- **ASCII diagram** (the main flow for this solution)
- **Cross-links** to architecture/platform-core.md, systems/contracts.md, history/platform-features.md
- 100–200 lines per page

## Implementation Notes

- **Read source code.** `Read` each `solutions/<name>/src/<name>/manifest.py` + key source files before writing.
- **Read history digest** `wiki/history/platform-features.md` for design context (especially for appointment-booking and driver-verification which have rich milestone history).
- **Provider packs bundled** into one page because they share the `ProviderPackManifest` pattern and are structurally different from business solutions.
- **call_monitoring (312 LOC) and operations_monitor (306 LOC)** are thin — don't create standalone pages. Mention them briefly in `wiki/architecture/platform-core.md` under the calls/observability cluster.

## Acceptance Criteria

- [ ] 7 files exist under `wiki/solutions/`
- [ ] Each has at least 1 ASCII diagram
- [ ] Each has cross-links to architecture and systems pages
- [ ] No "outbound_campaigns" page exists
- [ ] No "invariant" / "entities" jargon
- [ ] `uv run pytest tests/architecture/ -q` passes

## Verification

```bash
for f in appointment-booking driver-verification lead-capture schedule-management \
         telematics-ingestion notifications provider-packs; do
  test -f "wiki/solutions/$f.md" && echo "OK: $f" || echo "FAIL: $f"
done
test ! -f wiki/solutions/outbound-campaigns.md
for f in wiki/solutions/*.md; do
  grep -q '^+\-\|^|' "$f" && echo "OK diagram: $f" || echo "FAIL: $f"
done
! rg 'invariant' wiki/solutions/
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Source: Agent 3 audit report + T02a history digest (platform-features.md)
