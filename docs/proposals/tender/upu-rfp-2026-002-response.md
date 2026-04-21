# Tender Response — RFP-2026-002

## AI Solutions for Reverse Logistics Project for Circular Electronics Management

> **Bidder:** [Full Legal Entity Name]
> **Address:** [Company Address, Lithuania]
> **Contact:** [Contact Person], [Phone], [Email]
> **Date:** 27 February 2026
> **Validity:** This tender is valid for a minimum period of 120 days from the submission date.

---

## 1. Cover Letter

Dear Secretary of the Tenders and Procurements Committee,

We hereby submit our tender in response to RFP-2026-002 — AI Solutions for Reverse Logistics Project for Circular Electronics Management, published on 13 January 2026.

[Full Legal Entity Name] ("the Bidder") confirms that it has read, understands, and accepts all provisions of this call for tenders, including the UPU General Terms and Conditions for the Provision of Services.

We are a technology company specializing in AI-powered enterprise platforms, headquartered in Lithuania with operational reach across the European Union and emerging markets. Our flagship product, **manibo.ai**, is a production-grade multi-tenant AI platform that powers intelligent automation, agent-based workflows, and data-driven decision-making across industries. We believe this platform provides an ideal foundation for the UPU's reverse logistics initiative, enabling rapid deployment of all six required modules while minimizing development risk and cost.

Our proposed solution leverages manibo.ai's existing multi-tenant architecture, AI agent framework, and workflow orchestration engine to deliver a fully operational minimum viable platform within 8 weeks, with the remaining engagement period dedicated to multi-country deployment, training, and operational support.

This tender is submitted by the undersigned, duly authorized to act on behalf of the Bidder and to legally bind the Bidder to the terms and conditions of this call for tenders.

Respectfully submitted,

**[Authorized Signatory Name]**
[Title]
[Full Legal Entity Name]

---

## 2. Executive Summary

**manibo.ai** is an existing, production-ready multi-tenant AI platform designed for rapid deployment of intelligent applications. Rather than building a reverse logistics platform from scratch, we propose configuring and extending manibo.ai with six domain-specific solution modules tailored to the UPU's circular electronics management requirements.

**Key advantages of our approach:**

- **80% platform reuse** — The core AI agent framework, multi-tenant infrastructure, workflow engine, and integration layer already exist in production. Only domain-specific customization is required, dramatically reducing delivery risk and cost.
- **Multi-tenant by design** — Six pilot countries are provisioned as isolated tenants with per-country configuration (languages, postal workflows, regulations, recycler networks), sharing a single cost-efficient deployment.
- **AI-native architecture** — Built-in support for multi-model AI (GPT-4, Claude, Gemini, and open-source models) enables sophisticated device valuation, safety classification, and data extraction without vendor lock-in.
- **Proven durability** — Temporal-based workflow orchestration ensures that long-running logistics processes (collection, valuation, routing, recycling, reporting) execute reliably with automatic retry, audit trails, and state persistence.
- **Budget efficiency** — By leveraging existing platform infrastructure, we deliver the complete solution for **26,000 CHF** — 13% below the budgetary ceiling — including 12 months of cloud hosting, AI consumption, and operational support.

**Proposed total budget: 26,000 CHF** (all-inclusive)

**Delivery timeline:**
- Weeks 1--3: Discovery and requirements validation with UPU and participating DOs
- Weeks 4--10: Platform configuration, module development, integration testing
- Weeks 11--16: Multi-country deployment, localization, end-to-end testing
- Weeks 17--24: Training, documentation, pilot launch support
- Months 7--12: Operational monitoring, bi-weekly reporting, continuous improvement, final handover

---

## 3. Bidder Information

### 3.1 Company Structure

| Field | Details |
|-------|---------|
| Legal name | [Full Legal Entity Name] |
| Incorporation | Lithuania, EU |
| Type | Private limited company |
| Headquarters | [Address], Lithuania |
| Employees | [Number] |
| Subsidiaries | None |

### 3.2 Financial Information

| Metric | Value |
|--------|-------|
| Annual turnover (2025) | [Amount] EUR |
| Net profit (2025) | [Amount] EUR |
| Equity | [Amount] EUR |

*Audited financial statements available upon request.*

### 3.3 Company History

[Full Legal Entity Name] was founded in [Year] with a focus on AI-powered enterprise solutions. The company developed the **manibo.ai** platform to address the growing demand for intelligent automation in logistics, government services, and enterprise operations. The platform is built on years of research and development in large language models, durable workflow orchestration, and multi-tenant SaaS architecture.

### 3.4 Market Position

The company operates in the European AI platform market, with specialization in:

- **AI agent platforms** — Configurable, multi-model AI agents for enterprise workflows
- **Durable workflow orchestration** — Temporal-based execution for mission-critical processes
- **Multi-tenant SaaS deployment** — Isolated, configurable environments for diverse client requirements
- **Voice and digital channel integration** — Real-time communication via LiveKit, WebRTC, and SIP

### 3.5 Relevant Experience

| Project | Description | Relevance |
|---------|-------------|-----------|
| manibo.ai platform development | Multi-tenant AI agent platform with configurable workflows, integrations, and reporting | Core platform for this tender |
| AI-powered voice agent deployments | Production voice agents handling customer interactions across multiple countries and languages | Multi-country, multi-language AI deployment |
| Logistics workflow automation | Durable workflow orchestration for multi-step logistics processes with retry logic and audit trails | Reverse logistics workflow design |
| IoT and hardware integration projects | API-based integration with sensors, kiosks, and automated systems | Smart locker and IoT connectivity |

---

## 4. Subcontractor Information

No subcontractors will be engaged for this project. All services will be delivered directly by the Bidder's in-house team of three consultants as described in Section 5.9.

---

## 5. Technical Proposal

### 5.1 Solution Overview

We propose deploying the UPU Reverse Logistics solution as a set of **six Solution modules** on the **manibo.ai** platform. This approach leverages the platform's existing multi-tenant architecture, AI agent framework, and workflow orchestration engine, requiring only domain-specific configuration and customization rather than ground-up development.

#### Platform Architecture

```
+---------------------------------------------------------------------+
|                    UPU REVERSE LOGISTICS SOLUTION                    |
|                      on manibo.ai Platform                          |
+--------------------------+------------------------------------------+
|   CONSUMER WEB PORTAL    |         ADMIN DASHBOARD                  |
|   - Device photo upload  |   - Compliance & reporting               |
|   - Valuation display    |   - Recycler management                  |
|   - Pickup scheduling    |   - Country-level analytics              |
|   - Real-time tracking   |   - Regulatory data exports              |
|   - Payment interaction  |   - System configuration                 |
+--------------------------+------------------------------------------+
|                     API GATEWAY & AUTHENTICATION                     |
|             Multi-tenant: 6 pilot countries as tenants               |
|              Role-based access: DO, Recycler, Admin                  |
+---------------------------------------------------------------------+
|   SOLUTION MODULES (configurable per country)                        |
|  +-------------+ +--------------+ +-------------+ +-------------+   |
|  |     AI      | |   Recycler   | |    Postal   | | Packaging & |   |
|  |  Valuation  | | Marketplace  | |  Logistics  | |   Safety    |   |
|  |   Module    | |    Module    | |   Module    | |   Module    |   |
|  +-------------+ +--------------+ +-------------+ +-------------+   |
|  +----------------------+  +------------------------------------+   |
|  |    Compliance &      |  |      Consumer Interface            |   |
|  |  Reporting Module    |  |      Orchestration Module          |   |
|  +----------------------+  +------------------------------------+   |
+---------------------------------------------------------------------+
|               GROVE AI AGENT FRAMEWORK (proprietary)                 |
|  - Config-driven AI agents (YAML definitions)                        |
|  - Multi-model support (GPT-4, Claude, Gemini, open-source)         |
|  - Durable workflow orchestration (Temporal)                         |
|  - Plugin & tool system for domain extensions                        |
|  - Conversation & state persistence (PostgreSQL)                     |
|  - Real-time event streaming                                         |
+---------------------------------------------------------------------+
|               INTEGRATION LAYER                                      |
|  - Postal system API connectors   - IoT sensor data ingestion        |
|  - Smart locker / kiosk APIs      - Payment gateway bridges          |
|  - QR / UID tracking interfaces   - Regulatory data export adapters  |
|  - DO operational system bridges  - Webhook event handlers           |
+---------------------------------------------------------------------+
```

#### Key Technical Capabilities

| Capability | Implementation |
|-----------|---------------|
| **Multi-tenancy** | Schema-per-tenant PostgreSQL isolation with row-level security. Each pilot country operates as an independent tenant with isolated data, configuration, and user access. |
| **AI agents** | Configurable via YAML. Each module deploys one or more AI agents with domain-specific tools (device recognition, safety classification, compliance extraction). Agents can be updated without code changes. |
| **Durable workflows** | Temporal-based orchestration ensures multi-step processes (collection, valuation, routing, recycling) execute reliably with automatic retry, state persistence, and audit trails. |
| **Multi-model AI** | Provider-agnostic LLM access via LiteLLM. Supports GPT-4/4V, Claude, Gemini, and open-source models. Models can be swapped per-module or per-country without code changes. |
| **API-first integration** | RESTful APIs with webhook support for postal system connectivity, IoT data ingestion, payment flows, and external system interoperability. |
| **Real-time events** | PostgreSQL-based event streaming for live tracking updates, status notifications, and dashboard refresh. |
| **Localization** | Multi-language support at platform level. Country-specific configurations include language, postal workflow parameters, regulatory requirements, and recycler capacity definitions. |

### 5.2 Module-by-Module Coverage

#### Module 1: AI Valuation Module

**RFP requirement:** Automated device identification, condition assessment, and market valuation.

**Status: Fully covered by manibo.ai AI agent framework.**

This module enables automated device identification and condition assessment using manibo.ai's multi-model AI agent framework.

**Technical approach:**
- **Device identification** — A dedicated AI agent processes consumer-uploaded photos using vision-capable models (GPT-4V, Gemini Vision). The agent identifies device make, model, and specifications from images, cross-referencing against a maintained device database.
- **Condition assessment** — The AI agent evaluates visible physical condition (screen damage, housing integrity, port condition) and prompts consumers for functional status (power-on, battery health, screen responsiveness) through structured questionnaires.
- **Market valuation** — Combines device identification and condition data with real-time market pricing feeds and recycler bid data to generate fair-market and material-recovery valuations.
- **Confidence scoring** — Each valuation includes a confidence score. Low-confidence assessments are flagged for human review.

**Configuration:** The valuation agent is defined in YAML, making it adjustable per country (e.g., different device databases, pricing feeds, or assessment criteria) without code changes.

#### Module 2: Recycler Marketplace Module

**RFP requirement:** Recycler onboarding, qualification, bid management, and performance tracking.

**Status: Fully covered by Temporal workflow orchestration and marketplace solution module.**

This module manages the lifecycle of recycler engagement using Temporal durable workflows.

**Technical approach:**
- **Recycler onboarding** — A multi-step onboarding workflow verifies recycler credentials, certifications (e.g., WEEE compliance, R2/e-Stewards), processing capacities, and geographic coverage. Workflow steps include document upload, verification, and approval routing.
- **Bid management** — When devices are assessed, qualified recyclers receive automated bid requests based on device type, volume, and location. Bids are collected, ranked, and presented through the admin dashboard.
- **Transaction simulation** — End-to-end transaction workflows simulate the complete recycler engagement from bid acceptance through material delivery confirmation and payment settlement.
- **Performance tracking** — Recycler performance metrics (response time, bid competitiveness, processing quality) are tracked and used for ranking and compliance monitoring.

**Configuration:** Recycler qualification criteria, bid rules, and performance thresholds are configurable per country.

#### Module 3: Postal Logistics Integration Module

**RFP requirement:** Integration with DO operational systems for pickup, tracking, routing, and financial flows.

**Status: Fully covered by API integration layer and Temporal activity framework.**

This module integrates postal operational workflows with the platform using API connectors and Temporal activities.

**Technical approach:**
- **Pickup scheduling** — Consumers schedule device collection through the portal. The platform generates pickup requests compatible with DO operational systems via REST API and webhook integration.
- **Label generation** — Automated shipping label creation with barcodes, QR codes, and handling instructions. Labels include hazard classification data from the Packaging and Safety module.
- **Real-time tracking** — Bidirectional tracking integration: the platform publishes tracking events to consumers and ingests status updates from DO tracking systems.
- **Routing optimization** — Workflow-based routing that matches collected devices to the optimal recycler based on location, capacity, device type, and current bid status.
- **Financial-payment data flows** — Integration with DO financial services infrastructure for consumer payment disbursement (valuation credits), recycler settlement, and DO service fees. Payment data flows are modeled as Temporal activities with audit trails.

**Integration points:** REST APIs, webhook handlers, and configurable data mappers for postal system interoperability. The platform provides a standard API contract; country-specific DO system adapters are configured during deployment.

#### Module 4: Packaging and Safety Module

**RFP requirement:** Packaging categorization, hazard flagging, and safe-handling guidance.

**Status: Fully covered by AI classification agent and safety knowledge base.**

This module uses AI classification for packaging requirements and hazard identification.

**Technical approach:**
- **Packaging categorization** — Based on device type and condition assessment, the system determines appropriate packaging requirements (anti-static bags, foam inserts, rigid boxes) and generates packaging instructions for consumers.
- **Hazard flagging** — An AI agent identifies devices requiring special handling (swollen lithium batteries, cracked screens with sharp edges, CRT displays with lead content, mercury-containing components). Flagged items trigger specific handling protocols.
- **Safe-handling guidance** — Auto-generated handling instructions for consumers, postal workers, and recyclers based on device classification and hazard status. Instructions comply with IATA Dangerous Goods Regulations where applicable.
- **Classification database** — A maintained reference database of device types mapped to packaging requirements and hazard categories, updatable per country.

#### Module 5: Compliance and Reporting Dashboard

**RFP requirement:** Data visualization, recovery metrics, and regulatory reporting.

**Status: Fully covered by Next.js admin dashboard with configurable reporting.**

This module provides data visualization and regulatory reporting through the admin dashboard.

**Technical approach:**
- **Real-time dashboards** — Next.js-based admin interface with configurable widgets: collection volumes, recovery rates, recycler performance, geographic distribution, financial flows, and pipeline status.
- **Recovery metrics** — Automated calculation of material recovery rates, e-waste diversion rates, and environmental impact metrics (CO2 equivalent avoided, raw materials recovered).
- **Regulatory reporting** — Exportable reports aligned with national e-waste regulations and UPU indicators. Report templates are configurable per country to match local regulatory requirements (EU WEEE Directive, national EPR schemes).
- **Data export** — CSV, PDF, and API-based data export for integration with UPU reporting systems and national regulatory databases.
- **Audit trail** — Immutable audit log of all platform actions for compliance verification.

#### Module 6: Consumer Web/App Interface

**RFP requirement:** Consumer-facing interface for device submission, valuation, scheduling, tracking, and payment.

**Status: Fully covered by Next.js progressive web application.**

This module provides the consumer-facing experience through a responsive web application.

**Technical approach:**
- **Progressive web application** — Responsive design optimized for mobile devices (primary use case) and desktop browsers. Installable as PWA for app-like experience without app store deployment.
- **Photo upload and AI valuation** — Guided photo capture workflow with real-time AI feedback on image quality. Valuation results displayed within seconds.
- **Pickup scheduling** — Calendar-based scheduling integrated with DO pickup availability. Address validation and coverage checking.
- **Real-time tracking** — Status timeline showing device journey from collection through valuation, routing, recycling, and payment. Push notifications for status changes.
- **Payment interactions** — Display of valuation amount, payment method selection (bank transfer, mobile money, postal money order), and payment status tracking.
- **Multi-language** — Interface localized per country, configurable at the tenant level.

### 5.3 Architecture Details

#### Data Flow Architecture

```
Consumer Device Submission Flow:
=================================

Consumer --> [Photo Upload] --> AI Valuation Agent --> [Device ID + Condition]
                                                              |
            +---------------------------------------------+
            v
    [Packaging & Safety Classification] --> Handling Instructions
            |
            v
    [Recycler Marketplace] --> Bid Collection --> Best Match Selection
            |
            v
    [Postal Logistics] --> Label Generation --> Pickup Scheduling
            |                                         |
            v                                         v
    [Tracking Integration] <---- DO Tracking System Updates
            |
            v
    [Payment Processing] --> Consumer Payment + Recycler Settlement
            |
            v
    [Compliance Reporting] --> Metrics Aggregation --> Dashboard + Exports
```

#### Multi-Country Deployment Model

```
                    +-------------------------+
                    |    manibo.ai Cloud       |
                    |    (Shared Platform)     |
                    +-------------------------+
                    |   Platform Core          |
                    |   - Auth & SSO           |
                    |   - API Gateway          |
                    |   - AI Model Registry    |
                    |   - Workflow Engine       |
                    +-----------+-------------+
                                |
        +----------+----------+-+--------+----------+----------+
        v          v          v          v          v          v
   +---------++---------++---------++---------++---------++---------+
   |Country A||Country B||Country C||Country D||Country E||Country F|
   | Tenant  || Tenant  || Tenant  || Tenant  || Tenant  || Tenant  |
   +---------++---------++---------++---------++---------++---------+
   |- Config ||- Config ||- Config ||- Config ||- Config ||- Config |
   |- Lang   ||- Lang   ||- Lang   ||- Lang   ||- Lang   ||- Lang   |
   |- DO API ||- DO API ||- DO API ||- DO API ||- DO API ||- DO API |
   |- Rules  ||- Rules  ||- Rules  ||- Rules  ||- Rules  ||- Rules  |
   |- Data   ||- Data   ||- Data   ||- Data   ||- Data   ||- Data   |
   +---------++---------++---------++---------++---------++---------+
```

Each country operates as an isolated tenant with:
- **Dedicated data schema** — Full data isolation per country (PostgreSQL schema-per-tenant)
- **Country-specific configuration** — Language, postal workflows, regulations, recycler networks, payment methods
- **Dedicated DO API integration** — Per-country connectors to national postal system APIs
- **Local compliance rules** — Country-specific regulatory requirements and reporting templates
- **Independent user management** — Separate user accounts and role assignments per country

#### Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Authentication** | OIDC/JWT-based authentication. Configurable identity provider per country. |
| **Authorization** | Role-based access control (Consumer, DO Operator, Recycler, Country Admin, UPU Admin). |
| **Data isolation** | Schema-per-tenant with row-level security. Cross-tenant data access is architecturally impossible. |
| **Encryption** | TLS 1.3 in transit. AES-256 at rest. Temporal workflow payloads encrypted with per-tenant keys. |
| **Audit** | Immutable append-only audit logs for all data access and state transitions. |
| **API security** | Rate limiting, input validation, OWASP Top 10 protections. |

#### Hardware and Software Integration

The platform provides an API-first integration layer designed for interoperability with diverse hardware and software ecosystems:

| Integration Target | Approach |
|-------------------|----------|
| **Smart lockers** | REST API for locker status, reservation, and unlock commands. Webhook callbacks for deposit/retrieval events. Compatible with standard smart locker APIs (Parcel Pending, InPost, Quadient). |
| **Kiosks** | Web-based kiosk interface (same consumer portal, kiosk mode). Camera API for device photo capture. Receipt printing via standard thermal printer protocols. |
| **IoT sensors** | MQTT/HTTP data ingestion for weight sensors, environmental monitors (temperature, humidity), and tamper detection. |
| **QR/UID tagging** | QR code generation and scanning via consumer portal. UID assignment and lookup API for device-level tracking throughout the reverse logistics chain. |
| **Postal counter systems** | REST API integration with DO counter software for acceptance scanning, weight capture, and label printing. |
| **Sorting systems** | Webhook-based event integration with automated sorting equipment for routing decisions based on device classification. |
| **DO IT environments** | Configurable API adapters with data mapping for integration with national postal IT systems (tracking, addressing, financial). |

### 5.4 Methodology

Our methodology follows an iterative, test-driven approach designed to deliver a working MVP rapidly and then refine through UPU feedback. The approach is optimized for the reality of multi-stakeholder coordination: actual development is concentrated in approximately 10 weeks, while the remaining engagement period supports country-by-country deployment, training, and operational support at the pace dictated by UPU and DO communication cycles.

#### Phase 1: Discovery and Requirements Validation (Weeks 1--3)

**Objective:** Validate requirements, map country-specific parameters, define integration specifications.

| Activity | Deliverable |
|----------|------------|
| Kickoff workshop with UPU project team | Validated requirements matrix |
| Country-specific parameter mapping (6 countries: languages, regulations, DO APIs, recycler networks, payment methods) | Country configuration specifications |
| Integration requirements assessment per DO | API integration specifications |
| Device database scope definition | Initial device taxonomy |
| AI model selection and benchmarking (vision models for device identification) | Model selection report |

**UPU involvement:** 2--3 remote workshops (2 hours each), document review.

#### Phase 2: Platform Configuration and MVP Build (Weeks 4--10)

**Objective:** Configure manibo.ai, develop six solution modules, integrate and test.

| Activity | Deliverable |
|----------|------------|
| Configure multi-tenant platform for 6 countries | Platform deployment (cloud) |
| Develop AI Valuation agent (vision + LLM pipeline) | Working valuation module |
| Develop Recycler Marketplace workflows | Recycler onboarding and bidding |
| Build Postal Logistics integration layer | API connectors + label generation |
| Develop Packaging and Safety classification | Hazard detection + guidance |
| Build Compliance and Reporting dashboard | Admin analytics dashboard |
| Build Consumer Web Portal | Consumer-facing application |
| Integration testing across all modules | Test report |

**Development approach:**
- **Test-driven development (TDD)** — Every feature starts with test specification. This eliminates the need for separate QA personnel while maintaining high quality.
- **Continuous integration** — Automated test suite runs on every code change. No module ships without passing all tests.
- **Bi-weekly demos** — Working software demonstrated to UPU every two weeks for feedback and course correction.

#### Phase 3: Multi-Country Deployment (Weeks 11--16)

**Objective:** Deploy and configure the platform for each of the six pilot countries.

| Activity | Deliverable |
|----------|------------|
| Country-specific tenant provisioning | 6 configured country environments |
| Language localization per country | Localized interfaces |
| DO API integration per country | Connected postal system APIs |
| Recycler network configuration per country | Active recycler profiles |
| Regulatory compliance mapping per country | Compliance report templates |
| End-to-end testing per country | Per-country test reports |

**Testing includes:**
- Data-flow validation (consumer submission through valuation, routing, recycling, and reporting)
- API connectivity checks (DO systems, payment systems)
- Hardware-integration tests (smart lockers, kiosks, IoT — simulated or live where available)
- Functional performance, reliability, and security verification

#### Phase 4: Training and Pilot Launch (Weeks 17--24)

**Objective:** Train UPU and DO personnel, launch pilot operations, establish support processes.

| Activity | Deliverable |
|----------|------------|
| Training sessions for UPU headquarters staff | Training completion records |
| Training sessions for DO operators (6 countries, remote) | Per-country training materials |
| Technical documentation | System architecture document, API reference, configuration guide |
| User documentation | Consumer guide, DO operator manual, recycler guide, admin manual |
| Pilot launch support | Go-live support for each country |

#### Phase 5: Operational Support and Handover (Months 7--12)

**Objective:** Monitor pilot operations, optimize, and prepare for scale-up.

| Activity | Deliverable |
|----------|------------|
| Platform monitoring and incident response | Monthly operational reports |
| Bi-weekly progress reports to UPU | 12 bi-weekly reports |
| Performance optimization based on pilot data | Optimization log |
| Constraint identification and resolution | Issue tracker |
| Final handover package | Lessons learned, scale-up recommendations, replication guide |

### 5.5 Risk Management

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slow DO API integration due to legacy systems | High | Medium | Provide mock API layer for pilot; integrate real APIs incrementally |
| Country communication delays | High | Medium | Front-load country-independent work; deploy countries in parallel where possible |
| AI valuation accuracy for diverse device types | Medium | Medium | Start with most common device categories; expand through pilot data collection |
| Regulatory differences across 6 countries | Medium | Low | Configurable compliance templates per tenant; engage UPU for regulatory guidance |
| Hardware ecosystem diversity | Low | Low | API-first integration; hardware-specific adapters only where needed |

### 5.6 Continuity and Backup Procedures

- **Source code** — Maintained in version-controlled repository with automated backups.
- **Platform data** — Daily automated PostgreSQL backups with 30-day retention. Point-in-time recovery capability.
- **Infrastructure** — Cloud deployment with automatic failover. 99.5% uptime SLA during pilot.
- **Team continuity** — All three consultants maintain shared documentation and cross-functional knowledge. Any team member can perform critical operations.
- **Consultant replacement** — In the event that the UPU requests replacement of a consultant, the Bidder will propose a replacement with equivalent qualifications within 10 business days, subject to UPU approval.

### 5.7 Project Management and Communication

| Mechanism | Frequency | Description |
|-----------|-----------|-------------|
| Bi-weekly progress report | Every 2 weeks | Written report per Section 4.7 of the RFP (timesheets + deliverable status) |
| Demo session | Every 2 weeks | Live demonstration of working software (remote video call) |
| UPU project channel | Ongoing | Dedicated communication channel (email / Teams / Slack as preferred by UPU) |
| Monthly steering call | Monthly | High-level progress review with UPU project leadership |
| Issue tracker | Ongoing | Shared issue tracker for bug reports, feature requests, and questions |

### 5.8 Existing Implementations and References

The manibo.ai platform is currently deployed in production environments handling:

- **Multi-tenant AI agent deployments** — Production AI agents serving multiple organizational tenants with isolated data and configuration
- **Durable workflow orchestration** — Temporal-based workflows managing complex multi-step processes with automatic retry and state persistence
- **Multi-language, multi-country operations** — Platform configured for operations across multiple European countries with localized interfaces
- **Voice and digital channel integration** — Real-time voice AI agents with SIP telephony integration (LiveKit), demonstrating hardware-software ecosystem integration capability
- **Logistics workflow automation** — AI-powered outbound campaign orchestration with contact management, outcome tracking, and post-interaction data extraction

*Reference letters and work completion certificates available upon request.*

### 5.9 Team Composition

#### Consultant 1: Simonas Jakubonis — Team Lead and AI/ML Architect

**Role:** Project leadership, AI/ML architecture, platform configuration, stakeholder communication.

**Qualifications:**
- Lead AI Software Engineer with extensive experience in production AI systems
- Architect of the manibo.ai platform and underlying Grove AI framework
- Deep expertise in LLM integration (GPT-4, Claude, Gemini), multi-model orchestration, and AI agent design
- Experience with durable workflow orchestration (Temporal), real-time voice AI (LiveKit), and multi-tenant SaaS architecture
- Proficient in Python, TypeScript, PostgreSQL, cloud infrastructure

*Detailed CV provided in Appendix A.*

#### Consultant 2: Evaldas [SURNAME] — Senior Full-Stack Developer and Systems Integrator

**Role:** Full-stack web development, systems integration, API development, hardware connectivity.

**Qualifications:**
- Senior Web Developer with broad experience in enterprise application development
- Expertise in Next.js, React, Node.js, and modern web technologies
- Experience integrating digital platforms with external systems, APIs, and hardware interfaces
- Track record in multi-stakeholder project delivery
- Proficient in database design, REST API development, and cloud deployment

*Detailed CV provided in Appendix A.*

#### Consultant 3: Hanif [SURNAME] — Full-Stack AI/ML Engineer

**Role:** AI model development, data pipeline engineering, module implementation, testing.

**Qualifications:**
- Full-Stack AI/ML Engineer with experience in computer vision, NLP, and data-driven applications
- Experience building and deploying machine learning models for classification, valuation, and data extraction
- Proficient in Python, TensorFlow/PyTorch, and cloud-based ML services
- Experience with test-driven development and continuous integration
- Familiarity with IoT data ingestion and sensor integration

*Detailed CV provided in Appendix A.*

---

## 6. Pricing Structure

All prices are in Swiss Francs (CHF), net of VAT, and inclusive of all costs (travel, communication, tools, infrastructure, hosting, AI consumption).

### 6.1 Manpower

| Role | Daily Rate (CHF) | Days | Total (CHF) |
|------|------------------|------|-------------|
| Team Lead and AI/ML Architect | 750 | 8 | 6,000 |
| Full-Stack AI/ML Engineer | 650 | 12 | 7,800 |
| Senior Full-Stack Developer and Integrator | 550 | 10 | 5,500 |
| **Manpower Subtotal** | | **30** | **19,300** |

### 6.2 Infrastructure and Platform (12 months)

| Item | Cost (CHF) |
|------|------------|
| Cloud hosting (compute, database, CDN) | 2,200 |
| AI model API consumption (GPT-4V, Gemini, embeddings) | 1,800 |
| manibo.ai platform license (pilot, 12 months) | 2,000 |
| Development tooling and CI/CD | 700 |
| **Infrastructure Subtotal** | **6,700** |

### 6.3 Total Budget

| Category | Amount (CHF) |
|----------|-------------|
| Manpower (30 days) | 19,300 |
| Infrastructure and Platform (12 months) | 6,700 |
| **Project Total** | **26,000** |

**Savings vs. budgetary ceiling: 4,000 CHF (13.3%)**

### 6.4 Monthly Reporting

Worked hours will be reported monthly with role, daily rate, and deliverable mapping. Infrastructure costs are fixed for the 12-month period.

### 6.5 Post-Pilot Continuity

Upon conclusion of the 12-month pilot, the UPU may extend use of the manibo.ai platform under a separate maintenance and licensing agreement. Terms to be negotiated at the UPU's discretion. The Bidder commits to providing a minimum 3-month transition period after pilot conclusion to ensure operational continuity.

---

## 7. Delivery and Payment Schedule

### 7.1 Milestones and Deliverables

| Milestone | Target Date | Key Deliverables | Payment (CHF) |
|-----------|-------------|------------------|---------------|
| M1: Project kickoff + Discovery | Month 1 (Apr 2026) | Requirements matrix, country specs, integration specs | 5,200 |
| M2: MVP platform delivery | Month 3 (Jun 2026) | 6 modules configured, integration testing complete | 7,800 |
| M3: Multi-country deployment | Month 4 (Jul 2026) | 6 country tenants live, E2E testing passed | 5,200 |
| M4: Training + pilot launch | Month 6 (Sep 2026) | Training complete, documentation delivered, pilot operational | 3,900 |
| M5: Operational support + final handover | Month 12 (Mar 2027) | Final report, lessons learned, replication guide, handover package | 3,900 |
| **Total** | | | **26,000** |

### 7.2 Payment Terms

Payments are invoiced in arrears upon UPU acceptance of each milestone's deliverables. The UPU will make payment within 30 business days of receipt of invoice, per Section 3.7 of the call for tenders.

### 7.3 Bi-Weekly Reporting

In accordance with Section 4.7 of the RFP, the Vendor will provide the UPU with bi-weekly reports detailing:
- Services performed during the reporting period
- Hours worked per consultant (timesheets)
- Deliverable progress vs. plan
- Issues, risks, and mitigations
- Planned activities for the next period

---

## 8. Acceptance of UPU General Terms and Conditions

[Full Legal Entity Name] hereby confirms acceptance of the UPU General Terms and Conditions for the Provision of Services as attached to the call for tenders. The Bidder acknowledges that the final terms of any contract arising from this call for tenders shall be defined by the UPU.

---

## Appendix A: Consultant CVs

### A.1 Simonas Jakubonis — Team Lead and AI/ML Architect

**[TO BE COMPLETED — Insert full CV]**

Key highlights to include:
- Education and certifications
- Professional experience in AI/ML systems
- Platform architecture experience
- Multi-country project delivery
- Language capabilities (English, Lithuanian, [others])

### A.2 Evaldas [SURNAME] — Senior Full-Stack Developer and Integrator

**[TO BE COMPLETED — Insert full CV]**

Key highlights to include:
- Education and certifications
- Professional experience in web development and systems integration
- API development and hardware integration experience
- Project delivery track record
- Language capabilities

### A.3 Hanif [SURNAME] — Full-Stack AI/ML Engineer

**[TO BE COMPLETED — Insert full CV]**

Key highlights to include:
- Education and certifications
- Professional experience in AI/ML engineering
- Computer vision and data pipeline experience
- Test-driven development practice
- Language capabilities

---

## Appendix B: Architecture Diagrams

*High-resolution versions of the architecture diagrams presented in Section 5.1 and 5.3 are available upon request. The diagrams included in this document accurately represent the proposed solution architecture.*

### B.1 Platform Architecture Overview
*(See Section 5.1 — Platform Architecture diagram)*

### B.2 Data Flow Architecture
*(See Section 5.3 — Data Flow Architecture diagram)*

### B.3 Multi-Country Deployment Model
*(See Section 5.3 — Multi-Country Deployment Model diagram)*

### B.4 Integration Architecture

```
                        +------------------+
                        |   manibo.ai      |
                        |   Platform       |
                        +--------+---------+
                                 |
              +------------------+------------------+
              |                  |                   |
     +--------v--------+ +------v------+  +--------v--------+
     |  Postal Systems  | |  Hardware   |  |  External Svc   |
     |  Integration     | |  Layer      |  |  Integration    |
     +-----------------+ +-------------+  +-----------------+
     | - DO Tracking API| | - Smart     |  | - Payment       |
     | - Label Systems  | |   Lockers   |  |   Gateways      |
     | - Counter SW     | | - Kiosks    |  | - Recycler APIs |
     | - Sorting Systems| | - IoT       |  | - Regulatory    |
     | - Financial Svc  | |   Sensors   |  |   Databases     |
     | - Address DB     | | - QR/UID    |  | - Device Price  |
     +-----------------+ |   Scanners  |  |   Feeds         |
                          +-------------+  +-----------------+
```

---

*End of Tender Response*
