# Radiology Tech Digital Platform — Architecture (Draft)

Status: Draft  
Last updated: 2026-02-24  

This document proposes a system architecture for a radiology technologist platform with two modules:
1) **Clinical Companion** (shift-time SOP + checklists + grounded assistant)  
2) **Academy** (continuing education / accreditation-oriented learning)

## 1) Hard Constraints and Reality Checks

### Requirements given (incomplete, high-risk)
- Users **can enter patient factors** (e.g., age, weight, renal function).
- **Offline** usage is required.
- Accreditation rules, authoring model, and integrations are unknown.

### Why this matters (don’t ignore it)
- **Patient factors + offline** creates a real risk of storing sensitive clinical data on devices (even without identifiers).
  - **MVP stance (recommended):** forbid patient identifiers; treat patient factors as optional and **do not persist by default**.
  - If offline persistence of patient factors is required, this becomes a **device governance + security** program (MDM, encryption, retention, audit).
- If the product **recommends scan parameters based on patient factors**, you are drifting into regulated clinical decision support territory.
  - **MVP stance (recommended):** the assistant is *interpretation + explanation* of **approved SOPs**, not a generator of patient-tailored protocols.

## 2) Goals / Non-Goals (MVP-oriented)

### Goals
- Fast, reliable SOP lookup by modality → region → indication → equipment profile.
- Checklists for positioning / acquisition / quality assessment / post-exam.
- Grounded assistant with citations to approved SOP sections.
- Multi-tenant support (hospital networks / training orgs) with RBAC and audit trails.
- Offline access to **published** SOP content and checklists.

### Non-goals (for first release)
- DICOM/PACS/RIS integration.
- Image analysis (“quality analysis” via pixels).
- Offline LLM assistant.
- Fully automated accreditation compliance across countries (until standards are known).

## 3) Product Surfaces (Users and Apps)

### Clinical Companion (Technologist)
- Primary: SOP navigation + checklists + “Ask about this SOP” assistant.
- Offline-first for **published** content.
- Patient factors: allowed as **ephemeral inputs** (no storage by default).

### Academy (Learner)
- Courses, assignments, quizzes/exams, certificates, hour tracking.
- Online-first (offline optional later).

### Admin / Editorial (Tenant-level)
- SOP authoring (structured), localization workflow, publishing, versioning.
- Review/approval workflow (clinical governance).
- Course authoring (if Academy is in scope).

## 4) Architecture Overview (Logical)

### Components
- **Client apps**
  - Clinical Companion (PWA; native later only if needed)
  - Academy Web (web)
  - Admin Portal (web)
- **Backend**
  - API (FastAPI): tenancy, RBAC, content APIs, learning APIs, audit APIs
  - Assistant service (Grove-based): retrieval + grounded response generation
  - Temporal workers: durable workflows (approval, publishing, certificate issuance)
- **Data**
  - Postgres (system of record)
  - Postgres + pgvector (embeddings; same DB for STTCPW)
  - Object storage for attachments (PDFs, images, videos)

### ASCII Component Diagram

```
+-------------------+       +-------------------+       +-------------------+
| Clinical Companion|       |   Academy Web     |       |  Admin / Editorial|
| (PWA; offline SOP)|       | (LMS UI)          |       | (CMS + governance)|
+---------+---------+       +---------+---------+       +---------+---------+
          |                           |                           |
          | HTTPS (OIDC)              | HTTPS (OIDC)              | HTTPS (OIDC)
          v                           v                           v
+------------------------------ API (FastAPI) ------------------------------+
| Tenancy/RBAC | Content APIs | Learning APIs | Audit APIs | Media signing  |
+--------------------+--------------------+--------------------+-------------+
                     |                    |                    |
                     |                    |                    |
                     v                    v                    v
           +----------------+     +----------------+    +-------------------+
           | Assistant Svc  |     | Temporal Worker|    | Object Storage    |
           | (Grove; RAG)   |     | (Workflows)    |    | (PDF/video/img)   |
           +--------+-------+     +--------+-------+    +---------+---------+
                    |                      |                       |
                    | SQL                  | SQL                   | signed URLs
                    v                      v                       v
+------------------------------- Postgres ----------------------------------+
| Tenant schemas: content, learning, audit pointers, device sync manifests  |
| Shared: auth mapping (optional), global catalogs (optional)               |
| + pgvector: embeddings for published content                              |
+---------------------------------------------------------------------------+
```

## 5) Data Model (High-Level)

### Content (Clinical Companion)
- `sop_documents` (logical document per indication/protocol)
- `sop_versions` (immutable versions; published points to one version)
- `sop_sections` (structured, addressable sections for citation)
- `equipment_profiles` (e.g., CT 64-slice, MRI 1.5T/3T)
- `checklists` + `checklist_items`
- `attachments` (object storage + signed URLs; referenced by ID)
- `localizations` (per locale per version, with reviewer status)

### Assistant / Retrieval
- `kb_chunks` (chunk text + metadata + source section ID)
- `kb_embeddings` (pgvector) linked to chunks
- `assistant_audit_logs` (append-only): query, filters used, retrieved chunk IDs, model ID, output, user+tenant IDs

### Learning (Academy)
- `courses`, `course_versions`, `modules`, `lessons`
- `assessments`, `questions`, `attempts`, `scores`
- `enrollments`, `progress_events`
- `certificates` (immutable records; issuance workflow)

## 6) Key Workflows (Durable)

### 6.1 SOP approval → publish (governance)
```
Editor creates draft -> Reviewer approves -> Publish:
  - lock version immutability
  - build/update chunks + embeddings
  - emit audit event
  - update "offline content bundle" manifest
```

### 6.2 Assistant Q&A (grounded; online)
```
User question + selected context (modality/region/indication/equipment) ->
  API enforces tenant + role + locale ->
  Assistant retrieves (pgvector with filters) ->
  Model generates answer with citations to sop_section IDs ->
  API stores append-only audit log
```

### 6.3 Offline content sync (Clinical Companion)
```
Device requests "bundle manifest" (per tenant, locale, version) ->
  downloads latest published SOP bundle + attachments ->
  stores locally (encrypted if feasible) ->
  offline mode supports:
    - SOP navigation
    - keyword search
    - checklists
  offline mode does NOT support:
    - LLM assistant (MVP)
```

## 7) Tenancy, Auth, and Audit

### Tenancy
- Tenant = hospital network / institution / training provider.
- Optional subgrouping: facilities/sites inside a tenant (future).

### Auth
- OIDC-based SSO is the default assumption (hospital reality).
- RBAC must gate:
  - content editing vs consuming
  - clinical reviewer approvals
  - learner/course authoring

### Audit (minimum viable, append-only)
- Content governance actions (draft, approve, publish, unpublish).
- Assistant interactions (inputs + retrieval metadata + outputs).
- Certificate issuance events.

## 8) One App or Two? (Stop hand-waving)

You need **one backend** either way. The real choice is **one client app vs two client apps**.

### Option 1: One web app (Next.js) with three shells (recommended for MVP)
- One deployment, one login flow, shared UI primitives.
- Clinical Companion delivered as a **PWA** route group with offline caches.
- Academy delivered as standard web route group.
- Admin delivered as protected web route group.

Trade-off: offline + device security is weaker than a managed native app.

### Option 2: Two client apps (only if offline + data governance are serious)
- Clinical Companion: native (React Native) or hardened PWA with MDM assumptions.
- Academy/Admin: web.

Trade-off: more engineering and release overhead (two clients).

**Recommendation:** start with **Option 1** unless hospitals require MDM-managed devices and local persistence of clinical inputs.

## 9) Open Decisions (Blockers to finalize design)
- Intended use: “SOP companion” vs “parameter recommendation based on patient factors”.
- Whether patient factors are **stored** anywhere (server or device) and for how long.
- SOP authoring model: centralized vs per-hospital overrides and inheritance rules.
- Accreditation targets (if Academy is real): governing bodies, hour accounting rules, evidence requirements.
- Offline security posture: MDM requirement? encryption expectations? allowed device types?
