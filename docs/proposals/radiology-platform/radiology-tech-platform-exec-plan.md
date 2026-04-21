# Radiology Tech Digital Platform — High-Level Execution Plan (Draft)

Status: Draft  
Last updated: 2026-02-24  

This plan assumes an MVP that is defensible: **offline SOP companion + checklists + grounded assistant (online)**.
It explicitly avoids “patient-tailored protocol recommendations” until intended use and regulatory pathway are decided.

## 0) Weeks 0–2: Kill Ambiguity (Mandatory)

Deliverables (written, signed off):
- **Intended Use Statement (1 page):**
  - What the product does.
  - What it explicitly does not do.
  - Whether it recommends scan parameters vs displays approved SOPs.
- **Data Classification Statement (1 page):**
  - Whether patient factors are allowed, and whether they are stored (server/device).
  - “No patient identifiers” rule for MVP (recommended).
- **Editorial model decision:**
  - Centralized content vs per-hospital overrides (and conflict rules).
- **Accreditation decision:**
  - Either pick one target standard/country OR formally defer Academy from MVP.

If you can’t answer these, you don’t have requirements; you have a pitch deck.

## 1) MVP Track A (Recommended): Clinical Companion First (Weeks 3–12)

### A1. Content schema + CMS (Weeks 3–6)
- Implement structured SOP model (versioned, citeable sections, checklists).
- Admin UI for editing, review state, and publishing.
- Attachments support (store + signed URLs).

Acceptance criteria:
- Published SOP is immutable and addressable by section ID for citations.
- Every change is auditable (who/what/when).

### A2. Offline bundle + device sync (Weeks 5–8)
- Create “published content bundle” manifest per tenant+locale+version.
- Clinical Companion PWA caches published bundles and attachments.
- Offline supports navigation + keyword search + checklists.

Acceptance criteria:
- Airplane mode still shows latest downloaded published SOPs.
- Offline mode does not depend on the assistant.

### A3. Grounded assistant (online) (Weeks 7–12)
- Ingestion pipeline: chunk + embed + store in pgvector with metadata filters.
- Retrieval: tenant+locale+modality/region/indication/equipment filters.
- Response constraints: citations required; refusal on low evidence.
- Append-only assistant audit logs.

Acceptance criteria:
- Every answer includes citations to SOP section IDs.
- If retrieval returns nothing relevant, system refuses instead of hallucinating.

## 2) MVP Track B (Optional): Academy (Weeks 13–24)

Only start this once accreditation standards are chosen.

### B1. Minimal LMS primitives (Weeks 13–18)
- Courses + lessons + assessments + attempts + progress events.

### B2. Certificate issuance (Weeks 17–22)
- Temporal workflow: exam passed → certificate record issued (idempotent) → audit event.

### B3. Reporting (Weeks 21–24)
- Exportable hour/certificate records per learner + tenant.

## 3) Workstreams (Parallel, Continuous)

### Security + compliance posture
- Strict RBAC, audit trails, immutable publishing.
- Decide on patient factor handling:
  - **Recommended MVP:** allow entry but do not persist; warn users; scrub logs.
  - If persistence is required: define retention, encryption, access controls, and breach response.

### Content operations (this is the real cost center)
- Content acquisition, structuring, and review.
- Localization process (UI + SOP content are separate problems).

## 4) One App or Two? Implementation Decision

### Default MVP (fastest): one Next.js app, multiple shells
- `Clinical` shell (PWA offline caching)
- `Academy` shell
- `Admin` shell

Move to two-client setup only if hospitals require managed devices + stronger offline guarantees:
- Clinical Companion becomes native (React Native) or hardened PWA with MDM assumptions.

## 5) Risks (Top 5)
- Regulatory blowback from “patient-tailored recommendations” without a pathway.
- Offline requirement turning into a device governance/MDM project.
- Underestimating content engineering + review capacity (3–5× common miss).
- Multi-language SOP localization effort dwarfing software.
- Accreditation complexity exploding once a real standard is selected.
