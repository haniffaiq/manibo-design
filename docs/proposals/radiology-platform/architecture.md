# RadTech Platform — Technical Architecture

## AI-Powered Digital Platform for Radiology Technologists

> Clinical Decision Support & Accredited Professional Development
>
> Version 1.0 | February 2026

---

## 1. Executive Summary

RadTech Platform is a dual-module digital solution designed to standardize radiology technologist practice and professional development across healthcare institutions. The platform addresses a critical gap: rapid deployment of CT/MRI equipment in regional and district hospitals outpaces the harmonization of technologist competencies, resulting in inconsistent image quality, unnecessary repeat examinations, increased patient radiation exposure, and uneven service levels between regions.

The platform consists of:

- **Module A — Clinical App**: A mobile-first application providing real-time, standardized guidance for CT and MRI examinations (patient positioning, scanning parameters, quality checklists, post-examination recommendations)
- **Module B — Accredited Learning Platform**: A web-based LMS offering themed professional development courses with interactive cases, assessments, certification, and academic hour tracking for license renewal
- **AI Assistant Layer**: A RAG-based (Retrieval-Augmented Generation) intelligent assistant that operates across both modules, providing contextual protocol guidance, quality analysis, and adaptive learning — grounded exclusively in a validated medical knowledge base

**Key differentiators:**
- Equipment-specific protocols (GE, Siemens, Philips — adapted per scanner model and field strength)
- Validated medical knowledge base (not free-form LLM generation)
- Full audit trail for regulatory compliance
- Multi-language support (EN, LT, RU, UZ) for international deployment
- Offline-capable clinical app for reliable hospital use

---

## 2. Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                                  │
├────────────────────────────┬────────────────────────────────────────────┤
│   MODULE A: Clinical App   │   MODULE B: Learning Platform              │
│   (PWA — Mobile-first)     │   (Web Application)                        │
│                            │                                            │
│   • Patient positioning    │   • Course catalog (by anatomy/modality)   │
│   • CT/MRI protocols       │   • Interactive case-based learning        │
│   • Scanning parameters    │   • Practical exercises & simulations      │
│   • Quality checklists     │   • Assessments & certification            │
│   • Post-exam guidance     │   • Academic hour tracking                 │
│   • Equipment selection    │   • Progress analytics                     │
├────────────────────────────┴────────────────────────────────────────────┤
│                      AI ASSISTANT LAYER                                  │
│                                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │   Clinical    │  │   Quality    │  │   Learning   │                  │
│   │    Mode       │  │   Analysis   │  │    Mode      │                  │
│   │              │  │    Mode      │  │              │                  │
│   │ Real-time    │  │ Artifact     │  │ Theory       │                  │
│   │ protocol     │  │ diagnosis    │  │ explanation  │                  │
│   │ assistance   │  │ guidance     │  │ & quizzing   │                  │
│   └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
│   RAG Pipeline: Query → Retrieval → Context Assembly → LLM → Response   │
│   Grounded in validated medical knowledge base — NO hallucination risk   │
│   Full audit trail on every query                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                    APPLICATION BACKEND                                    │
│                                                                          │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                 │
│   │    Content     │ │     User      │ │  Assessment   │                 │
│   │  Management    │ │  Management   │ │    Engine     │                 │
│   │               │ │               │ │               │                 │
│   │ SOPs          │ │ Auth (OIDC)   │ │ Test bank     │                 │
│   │ Protocols     │ │ Roles/Perms   │ │ Scoring       │                 │
│   │ Courses       │ │ Progress      │ │ Certificates  │                 │
│   │ Media assets  │ │ Institutions  │ │ Academic hrs  │                 │
│   └───────────────┘ └───────────────┘ └───────────────┘                 │
│                                                                          │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                 │
│   │   Analytics    │ │ Localization  │ │  Integration  │                 │
│   │  & Reporting   │ │    Engine     │ │     APIs      │                 │
│   │               │ │               │ │               │                 │
│   │ Usage metrics │ │ EN, LT, RU,  │ │ Accreditation │                 │
│   │ Quality KPIs  │ │ UZ + more    │ │ bodies        │                 │
│   │ Competency    │ │ RTL support  │ │ Hospital EHR  │                 │
│   │ dashboards    │ │ Content i18n │ │ Equipment DBs │                 │
│   └───────────────┘ └───────────────┘ └───────────────┘                 │
├─────────────────────────────────────────────────────────────────────────┤
│                    KNOWLEDGE BASE                                        │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │            Validated Medical Knowledge Repository                │   │
│   ├─────────────────┬─────────────────┬─────────────────────────────┤   │
│   │  CT Protocols   │  MRI Protocols  │  Equipment Specifications   │   │
│   │  by anatomy     │  by anatomy     │  GE / Siemens / Philips     │   │
│   │  by indication  │  by indication  │  by model & field strength  │   │
│   ├─────────────────┼─────────────────┼─────────────────────────────┤   │
│   │  Positioning    │  Quality        │  Safety & Contrast          │   │
│   │  Guidelines     │  Criteria       │  Protocols                  │   │
│   │  with images    │  checklists     │  dose optimization          │   │
│   └─────────────────┴─────────────────┴─────────────────────────────┘   │
│                                                                          │
│   Content authored & validated by certified radiologists and              │
│   radiology technologists. Version-controlled. Audit-logged.             │
├─────────────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                            │
│                                                                          │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│   │  PostgreSQL   │ │  Vector DB   │ │   Object     │ │  Audit Log   │  │
│   │              │ │  (pgvector)  │ │   Storage    │ │  (append-    │  │
│   │ Users        │ │              │ │              │ │   only)      │  │
│   │ Progress     │ │ SOP embed-   │ │ Medical      │ │              │  │
│   │ Certificates │ │ dings for    │ │ images       │ │ All AI       │  │
│   │ Courses      │ │ RAG retrieval│ │ Course media │ │ queries      │  │
│   │ Institutions │ │              │ │ Positioning  │ │ All actions  │  │
│   │ Equipment    │ │              │ │ diagrams     │ │ Immutable    │  │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module A — Clinical Decision Support App

### 3.1 Purpose

A mobile-first Progressive Web Application (PWA) used by radiology technologists during their daily clinical work. Provides instant access to standardized protocols, positioning guidelines, and quality checklists — adapted to the specific equipment available at their institution.

### 3.2 User Journey

```
Technologist opens app
        │
        ▼
Select modality: [CT] or [MRI]
        │
        ▼
Select anatomical region: Chest / Neuro / MSK / Abdomen / ...
        │
        ▼
Select specific examination (by indication)
        │
        ├──► Patient Positioning
        │    • Body position (supine/prone/lateral)
        │    • Limb placement
        │    • Contrast requirement
        │    • Special notes
        │
        ├──► Scanning Parameters
        │    • Filtered by equipment (GE/Siemens/Philips)
        │    • Filtered by scanner model (1.5T/3T, 64/128-slice)
        │    • Adult / Pediatric differentiation
        │    • Low-dose protocol option
        │    • Localizer guidance
        │    • Contrast injection rate & catheter size
        │
        ├──► Quality Checklist
        │    □ Full anatomical coverage?
        │    □ Motion artifacts absent?
        │    □ Contrast phase matches indication?
        │    □ Spatial resolution adequate?
        │    □ SNR acceptable?
        │
        └──► Post-Examination Guidance
             • Additional sequences/phases needed?
             • Findings requiring immediate action?
             • Documentation requirements
```

### 3.3 Key Technical Features

| Feature | Implementation |
|---------|---------------|
| **Offline mode** | Service Worker caching of SOPs, protocols, and positioning data. Critical for hospitals with unreliable connectivity. |
| **Equipment profiles** | Technologist configures their scanner(s) once. All protocol recommendations are automatically filtered to their equipment. |
| **Quick search** | Full-text + semantic search across all protocols and SOPs. Type a clinical scenario → get protocol recommendation in seconds. |
| **AI Assistant** | Context-aware chatbot (Clinical Mode) for real-time protocol questions. Responses grounded in validated knowledge base only. |
| **Favorites & history** | Frequently used protocols pinned for one-tap access. Recent examination history for quick reference. |

### 3.4 Regulatory Positioning

The Clinical App is positioned as a **reference and educational tool**, providing standardized protocol information equivalent to a digital SOP manual. It does **not** make diagnostic decisions, control medical equipment, or directly influence treatment.

Regulatory classification analysis will be conducted during MVP development to determine whether CE marking under MDR 2017/745 is required. The current design intentionally stays within the boundary of informational/educational tools by:
- Presenting validated reference information, not generating diagnostic conclusions
- Requiring the technologist to apply professional judgment
- Not interfacing directly with imaging equipment
- Not processing patient data

---

## 4. Module B — Accredited Learning Platform

### 4.1 Purpose

A web-based Learning Management System (LMS) for structured professional development. Radiology technologists complete themed courses, earn certificates, and accumulate academic hours required for professional license renewal.

### 4.2 Course Structure

```
Course Catalog
├── CT Modules
│   ├── Chest CT (theory + SOPs + cases + assessment)
│   ├── Neuro CT
│   ├── Abdominal CT
│   ├── MSK CT
│   ├── Cardiac CT
│   ├── Pediatric CT
│   └── CT Angiography
│
├── MRI Modules
│   ├── Neuro MRI (theory + SOPs + cases + assessment)
│   ├── MSK MRI
│   ├── Abdominal MRI
│   ├── Cardiac MRI
│   ├── Breast MRI
│   └── Pediatric MRI
│
├── Cross-cutting Modules
│   ├── Radiation Safety & Dose Optimization
│   ├── Contrast Agent Administration
│   ├── Patient Safety & Communication
│   └── Image Quality Assurance
│
└── Equipment-Specific Modules
    ├── GE Healthcare Systems
    ├── Siemens Healthineers Systems
    └── Philips Healthcare Systems
```

### 4.3 Learning Flow

```
Enroll in course
        │
        ▼
Theoretical Foundation
(structured content with medical illustrations)
        │
        ▼
SOP Walkthrough
(step-by-step protocol execution with visual guides)
        │
        ▼
Practical Cases
(case-based scenarios: "What is the correct protocol for this patient?")
        │
        ▼
Interactive Exercises
("What went wrong in this examination?" — artifact identification,
 parameter correction simulation, quality assessment)
        │
        ▼
Assessment
(multiple choice + case-based questions, passing threshold: 80%)
        │
        ▼
Certificate & Academic Hours
(downloadable certificate, hours logged to profile,
 integration with accreditation body APIs where available)
```

### 4.4 Key Technical Features

| Feature | Implementation |
|---------|---------------|
| **Accreditation integration** | API connectivity with national professional bodies for automatic academic hour reporting |
| **Adaptive learning** | AI tracks error patterns → recommends targeted review modules |
| **Case library** | Growing repository of real-world cases (anonymized) with expert commentary |
| **Progress dashboards** | Individual progress, institutional aggregate views, competency heat maps |
| **Certificate generation** | Automated PDF certificates with unique verification codes |
| **Institutional management** | Hospital admins can assign courses, track team compliance, generate reports |

---

## 5. AI Assistant Architecture

### 5.1 Design Philosophy

The AI Assistant is **not a general-purpose chatbot**. It is a domain-specific, retrieval-grounded assistant that:

1. **Only answers from validated knowledge** — Every response is generated using RAG (Retrieval-Augmented Generation) over a curated, medically validated knowledge base. The LLM never generates answers from its general training data alone.
2. **Provides structured responses** — Protocol recommendations follow a consistent format (protocol name, parameters, contrast, positioning, common pitfalls).
3. **Maintains full audit trail** — Every query and response is logged immutably for regulatory compliance and quality assurance.
4. **Operates in three modes** — Clinical (real-time), Quality Analysis, and Learning — each with tailored behavior.

### 5.2 RAG Pipeline Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│  Query Analysis  │  ← Classify intent, extract entities
│  & Enrichment    │    (modality, anatomy, equipment, indication)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vector Search   │  ← Semantic search over SOP embeddings
│  (pgvector)      │    Top-K relevant documents retrieved
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Context         │  ← Assemble retrieved SOPs + equipment specs
│  Assembly        │    + user's equipment profile + query context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Generation  │  ← Generate response grounded in retrieved context
│  (GPT-4 / Claude │    System prompt enforces: "Answer ONLY from
│   / open-source) │    provided context. If not found, say so."
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response        │  ← Format as structured protocol recommendation
│  Formatting      │    Add source citations, confidence indicator
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Audit Log       │  ← Log query, retrieved docs, response, timestamp
│  (immutable)     │    For regulatory compliance and quality review
└─────────────────┘
```

### 5.3 AI Modes

#### Clinical Mode (Real-time Assistant)

**Use case:** Technologist needs immediate protocol guidance during patient examination.

**Example interaction:**
> **Technologist:** "Patient with suspected pulmonary embolism. 64-slice GE CT. Recommended protocol?"
>
> **AI Response:**
> - **Protocol:** CT Pulmonary Angiography (CTPA)
> - **Positioning:** Supine, arms above head
> - **Scan range:** Above aortic arch to below diaphragm
> - **Parameters:** 120 kVp, auto-mA (100-400), 0.625mm slice, pitch 1.375
> - **Contrast:** 60-80ml at 4-5 ml/s, 18G catheter, bolus tracking on pulmonary trunk
> - **Common pitfalls:** Timing of bolus, Valsalva artifact, incomplete coverage
> - **Source:** SOP-CT-CHEST-007, validated 2025-11-15

#### Quality Analysis Mode

**Use case:** Reviewing completed examination quality.

**Example interaction:**
> **Technologist:** "Motion artifacts in chest CT. What could I have done differently?"
>
> **AI Response:**
> - **Likely causes:** Patient breathing during scan, insufficient breath-hold instruction, scan time too long
> - **Corrections:** Shorter rotation time, faster pitch, clearer patient instruction protocol, consider prospective respiratory gating
> - **SOP Reference:** Quality Criteria QC-CT-003, Section 4.2
> - **Recommended learning module:** "CT Artifact Management" (Module CT-QA-02)

#### Learning Mode (Adaptive Tutor)

**Use case:** Studying or reviewing concepts during professional development.

**Example interaction:**
> **Technologist:** "Explain the difference between T1 and T2 weighted MRI sequences in clinical context."
>
> **AI Response:**
> [Structured explanation with clinical examples, tissue contrast tables, and a mini-quiz to test understanding]

### 5.4 Knowledge Base Management

| Aspect | Approach |
|--------|----------|
| **Content authoring** | Medical experts (certified radiologists + senior technologists) create and validate all SOPs and protocols |
| **Version control** | Every SOP is versioned. Changes tracked with author, date, and rationale. |
| **Review cycle** | Annual review of all content. Equipment-specific updates when new scanner models are released. |
| **Quality gate** | No content enters the knowledge base without expert validation. AI cannot learn from unvalidated sources. |
| **Embedding pipeline** | Content is chunked, embedded, and indexed in vector database. Re-indexed on every content update. |

---

## 6. Multi-Language & Localization

| Language | Region | Status |
|----------|--------|--------|
| English (EN) | International baseline | MVP |
| Lithuanian (LT) | Lithuania, Baltic region | MVP |
| Russian (RU) | Central Asia, Baltic Russian speakers | Phase 2 |
| Uzbek (UZ) | Uzbekistan | Phase 2 |
| Kazakh (KK) | Kazakhstan | Phase 2 |

**Localization architecture:**
- All UI strings externalized via i18n framework
- Medical content translated by qualified medical translators (not machine translation alone)
- AI Assistant responds in the user's selected language
- Equipment terminology preserved in original (English) with localized descriptions
- RTL layout support prepared for future Arabic/Farsi markets

---

## 7. Technical Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Clinical App** | Next.js PWA (mobile-first) | Offline capability, installable, no app store dependency |
| **Learning Platform** | Next.js (web) | SEO, SSR for course content, responsive design |
| **Backend API** | Python + FastAPI | High performance, async, type-safe, excellent ML ecosystem |
| **AI/LLM** | LiteLLM (multi-provider) | Provider-agnostic: GPT-4, Claude, Gemini, or open-source medical LLMs |
| **RAG Pipeline** | LangChain / LlamaIndex | Mature retrieval pipeline with chunking, embedding, reranking |
| **Vector Database** | PostgreSQL + pgvector | Single database for both relational and vector data. Simplicity. |
| **Primary Database** | PostgreSQL | Users, courses, progress, certificates, institutions, equipment profiles |
| **Object Storage** | S3-compatible (MinIO / GCS) | Medical images, course media, positioning diagrams, certificate PDFs |
| **Audit Log** | PostgreSQL (append-only table) | Immutable log of all AI queries and responses for regulatory compliance |
| **Authentication** | OIDC / JWT | Institutional SSO support, individual accounts, role-based access |
| **Hosting** | EU Cloud (GCP europe-west / Hetzner) | GDPR compliance, data residency in EU |
| **CI/CD** | GitHub Actions | Automated testing, deployment, knowledge base re-indexing |
| **Monitoring** | Prometheus + Grafana | Platform health, AI response times, usage analytics |

---

## 8. Data Architecture

### 8.1 Data Model (Simplified)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Institutions   │────▶│     Users        │────▶│    Enrollments   │
│                 │     │                 │     │                 │
│ id              │     │ id              │     │ user_id         │
│ name            │     │ institution_id  │     │ course_id       │
│ country         │     │ role            │     │ progress        │
│ equipment[]     │     │ language        │     │ score           │
│ subscription    │     │ equipment_prefs │     │ completed_at    │
└─────────────────┘     └─────────────────┘     │ certificate_id  │
                                                 └─────────────────┘
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Courses       │────▶│    Modules       │────▶│   Assessments    │
│                 │     │                 │     │                 │
│ id              │     │ id              │     │ id              │
│ modality (CT/MRI)│     │ course_id       │     │ module_id       │
│ anatomy         │     │ type (theory/   │     │ questions[]     │
│ level           │     │  sop/case/test) │     │ passing_score   │
│ academic_hours  │     │ content         │     │ time_limit      │
│ accreditation_id│     │ order           │     └─────────────────┘
└─────────────────┘     └─────────────────┘
                                                 ┌─────────────────┐
┌─────────────────┐     ┌─────────────────┐     │  Certificates    │
│      SOPs        │     │  AI Audit Log    │     │                 │
│                 │     │                 │     │ id              │
│ id              │     │ id              │     │ user_id         │
│ modality        │     │ user_id         │     │ course_id       │
│ anatomy         │     │ mode            │     │ issued_at       │
│ indication      │     │ query           │     │ verification_code│
│ equipment_type  │     │ retrieved_docs[]│     │ academic_hours  │
│ parameters      │     │ response        │     │ pdf_url         │
│ positioning     │     │ timestamp       │     └─────────────────┘
│ quality_criteria│     │ (immutable)     │
│ version         │     └─────────────────┘
│ validated_by    │
│ validated_at    │
│ embedding_vector│
└─────────────────┘
```

### 8.2 Data Residency & Privacy

| Principle | Implementation |
|-----------|---------------|
| **GDPR compliance** | All personal data stored in EU region. Data processing agreements with cloud providers. |
| **No patient data** | The platform does NOT process, store, or transmit any patient data or medical images from actual examinations. |
| **Anonymized analytics** | Usage analytics are aggregated and anonymized. No individual tracking beyond necessary platform function. |
| **Data portability** | Users can export their certificates, progress, and academic hours in standard formats. |
| **Right to erasure** | User accounts can be fully deleted with all associated data. Audit logs are retained (anonymized) per regulatory requirements. |

---

## 9. Security Architecture

| Layer | Measures |
|-------|---------|
| **Authentication** | OIDC/JWT with institutional SSO support. MFA available for admin accounts. |
| **Authorization** | Role-based: Technologist, Institutional Admin, Content Author, Platform Admin |
| **Transport** | TLS 1.3 for all communications |
| **Data at rest** | AES-256 encryption for database and object storage |
| **API security** | Rate limiting, input validation, OWASP Top 10 protections |
| **AI safety** | Prompt injection protection, output filtering, response grounding verification |
| **Audit** | Immutable audit log for all AI interactions and administrative actions |
| **Penetration testing** | Annual third-party security assessment |

---

## 10. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CDN (CloudFlare / GCP)                     │
│              Static assets, PWA shell, media cache             │
├──────────────────────────────────────────────────────────────┤
│                     Load Balancer (HTTPS)                      │
├──────────┬───────────────────────┬───────────────────────────┤
│          │                       │                           │
│  ┌───────▼───────┐  ┌───────────▼───────────┐  ┌───────────▼──────┐ │
│  │  Web Frontend  │  │   API Backend          │  │  AI Service       │ │
│  │  (Next.js)     │  │   (FastAPI)            │  │  (RAG Pipeline)   │ │
│  │  2+ replicas   │  │   2+ replicas          │  │  2+ replicas      │ │
│  └───────────────┘  └───────────┬───────────┘  └────────┬─────────┘ │
│                                  │                       │           │
│                     ┌────────────▼───────────────────────▼─────┐    │
│                     │         PostgreSQL + pgvector             │    │
│                     │         (Primary + Read Replica)          │    │
│                     └──────────────────────────────────────────┘    │
│                     ┌──────────────────────────────────────────┐    │
│                     │         Object Storage (S3/GCS)           │    │
│                     └──────────────────────────────────────────┘    │
│                                                                      │
│                     EU Region (GDPR Compliant)                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Scaling Strategy

| Phase | Users | Infrastructure |
|-------|-------|---------------|
| **MVP** (6 months) | 50-200 | Single region, minimal replicas |
| **Growth** (12-18 months) | 200-2,000 | Auto-scaling, read replicas, CDN optimization |
| **Scale** (18-36 months) | 2,000-20,000 | Multi-region (EU + Central Asia), dedicated AI compute |

---

## 11. MVP Roadmap (6 Months)

### Phase 1: Foundation (Months 1-2)

| Deliverable | Description |
|------------|-------------|
| SOP knowledge base | Structure and digitize SOPs for 2 pilot areas (Chest CT + Neuro MRI) |
| Data model & API | Core backend: users, institutions, SOPs, equipment profiles |
| Authentication | OIDC-based auth with institutional and individual accounts |
| Knowledge base pipeline | Embedding pipeline for SOP content, pgvector index |

### Phase 2: Clinical App MVP (Months 3-4)

| Deliverable | Description |
|------------|-------------|
| Clinical App (PWA) | Protocol lookup by modality → anatomy → indication → equipment |
| AI Assistant v1 | Clinical Mode: protocol questions answered from knowledge base |
| Equipment profiles | GE, Siemens, Philips scanner configuration |
| Offline support | Service Worker caching for protocol data |

### Phase 3: Validation & Learning Platform (Months 5-6)

| Deliverable | Description |
|------------|-------------|
| Learning Platform v1 | 2 pilot courses (Chest CT, Neuro MRI) with full learning flow |
| Assessment engine | Multiple choice + case-based testing with scoring |
| Certificate generation | PDF certificates with verification codes |
| Pilot deployment | 1-2 hospitals for UX validation and feedback collection |
| CE regulatory analysis | Classification assessment for MDR applicability |

---

## 12. Business Model Options

| Model | Description | Target |
|-------|-------------|--------|
| **SaaS per institution** | Annual subscription per hospital/clinic. Tiered by number of technologists. | Hospital networks, private clinics |
| **Individual subscription** | Monthly/annual subscription for individual technologists. | Independent professionals |
| **National license** | Government/ministry-level license for nationwide deployment. | Health ministries, national bodies |
| **Accreditation model** | Revenue from accredited course fees and certification. | Professional development market |
| **Equipment vendor partnerships** | Co-branded modules with equipment manufacturers (GE, Siemens, Philips). | Scanner vendors |
| **Data analytics** (anonymized) | Aggregated competency insights for health systems planning. | Health policy makers |

---

## 13. Competitive Advantages

| Differentiator | Why it matters |
|---------------|---------------|
| **Equipment-specific protocols** | No other platform adapts recommendations per scanner model and field strength |
| **AI grounded in validated knowledge** | Not a general chatbot — responses come exclusively from expert-validated SOPs |
| **Clinical + Learning in one platform** | Same knowledge base serves both daily practice and professional development |
| **Multi-language from day one** | Designed for international deployment (EU + Central Asia) |
| **Offline-capable clinical app** | Works in hospital environments with unreliable connectivity |
| **Audit trail** | Full traceability for regulatory compliance and quality assurance |
| **Accreditation integration** | Direct academic hour reporting to professional bodies |

---

## 14. Regulatory Considerations

### CE Marking (MDR 2017/745)

The platform's regulatory classification depends on its intended use:

| Component | Classification | Rationale |
|-----------|---------------|-----------|
| **Clinical App** (reference mode) | Likely NOT a medical device | Provides standardized reference information. Does not make diagnostic decisions or control equipment. Equivalent to a digital textbook/SOP manual. |
| **AI Assistant** (protocol guidance) | Requires assessment | If AI recommendations influence clinical workflow, may qualify as Class I medical device software. Assessment needed. |
| **Learning Platform** | NOT a medical device | Educational/training tool with no clinical application. |

**Mitigation strategy:**
- MVP design intentionally stays within informational/educational boundaries
- CE regulatory assessment conducted in Phase 3 with qualified regulatory consultant
- Architecture supports adding CE compliance features (version locking, validated outputs, change control) if classification requires it
- Clear disclaimers that the platform supplements, not replaces, professional judgment

### Data Protection

- GDPR compliant (EU hosting, DPA with all providers)
- No patient data processed or stored
- Privacy by design and by default

---

## Appendix A: Technology Comparison

### Why RAG vs. Fine-tuned Medical LLM?

| Approach | Pros | Cons | Our Choice |
|----------|------|------|------------|
| **RAG** (Retrieval-Augmented Generation) | Grounded in known sources, easy to update, auditable, no retraining needed | Requires curated knowledge base, retrieval quality matters | **Selected** |
| **Fine-tuned LLM** | Potentially faster responses, captures nuanced patterns | Expensive to retrain, hard to audit, hallucination risk, regulatory concerns | Not selected |

RAG is selected because:
1. **Auditability** — Every response traces back to specific SOP documents
2. **Updateability** — New protocols are added by updating the knowledge base, not retraining a model
3. **Safety** — The LLM cannot invent medical information; it can only synthesize from retrieved, validated content
4. **Regulatory friendliness** — Transparent, traceable, and explainable

---

*End of Architecture Document*
