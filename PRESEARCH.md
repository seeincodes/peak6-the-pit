# CapMan AI Gauntlet — Pre-Research Plan

> Project: CapMan AI — Gamified Scenario Training & MTSS Agent
> Last Updated: March 2026

---

## 1. What We Know (Confirmed from Research)

### About the Partner Organization

- Large proprietary options market maker, tech-first DNA with sophisticated proprietary trading technology
- Active stack includes **Python, React, Docker, AWS, and PostgreSQL** — aligns directly with the proposal's Python/AI + frontend split
- "Atlas" is presumed to be internal proprietary trading tooling platform (Python-based, limited docs)
- Internal conviction for gamified financial education — strong precedent for this project's approach

### About the TA Training Program

- The **Trading Associate (TA) program** is an 18-month, 4-phase structured program: Basic Training → Basic Trading → Long-term Rotations → Managing Individual Portfolios
- TAs obtain their **Series 57 license** within 2 months of start
- Key pain point confirmed via internal reviews: _"not a lot of time to build tooling or dig into data since trading days are so packed"_ — educator bandwidth IS the bottleneck, exactly as stated in the problem statement

### Audience Tiers (All In Scope)

| Tier                | Program                      | Duration    | Key Needs                                                 |
| ------------------- | ---------------------------- | ----------- | --------------------------------------------------------- |
| Trading Associates  | 18-month TA program          | Ongoing     | Phase-aware difficulty, MTSS tracking, deep grading       |
| Bootcamp Interns    | 1-week intensive (May / Aug) | Short-burst | Lighter exposure, high engagement, fast feedback          |
| Experienced Traders | Upskilling / peer review     | Ad hoc      | Peer review role, scenario validation, advanced scenarios |

> **Design Recommendation:** Lock the TA program as the **primary design persona**. Intern and experienced trader modes should be configuration variants, not separate builds.

---

## 2. Proposed System Architecture

### Three-Layer Model

```
┌─────────────────────────────────────────────────────┐
│           LAYER 3: Gamification & MTSS              │
│   React frontend · XP · Leaderboards · God View     │
├─────────────────────────────────────────────────────┤
│         LAYER 2: Grading & Probing Agent            │
│   LLM · Rubric Engine · Socratic Follow-ups         │
├─────────────────────────────────────────────────────┤
│           LAYER 1: Scenario Engine                  │
│   Python · RAG · CapMan Lexicon · Atlas (hooks)     │
└─────────────────────────────────────────────────────┘
```

### Layer 1 — Scenario Engine (Python / LLM + RAG)

- RAG pipeline ingests the **Volatility Trading Data Framework** and future CapMan lexicon documents to enforce proprietary terminology and options logic
- Generates contextually accurate, non-static scenarios across 15+ volatility data categories (IV metrics, Order Flow, Greeks, Macro, Tail Risk, etc.)
- Scenario "types" are modular plug-in categories — new types added without rebuilding the engine
- **Atlas integration lives here** as optional Python hooks; design as progressive enrichment, not a hard dependency, so MVP does not block on Atlas documentation gaps

### Layer 2 — Grading & Probing Agent (LLM)

- Evaluates **reasoning quality**, not just final answers
- Rubric system anchored to CapMan's actual trading philosophy and proprietary concepts
- Asks Socratic follow-up probes: _"Why that strike?" / "What does the IV skew tell you here?" / "How does the term structure change your thesis?"_
- **Educator correlation benchmarking is required before launch** — minimum 50–100 human-graded examples needed as ground truth dataset; this work must begin in Week 1

### Layer 3 — Gamification & MTSS Layer (React + Data Pipeline)

- XP system, dynamic leaderboards, head-to-head competitive challenges, peer review queue
- **MTSS "God View" educator dashboard** classifies users by skill dimension (e.g., strong on Greeks, weak on macro indicators) — not just aggregate score
- Tiered difficulty auto-adjusts by user role (TA phase, intern, experienced trader)
- MTSS tier auto-classification feeds real-time intervention data to educators

---

## 3. Phased Build Recommendation

### Phase 0 — Foundation (Weeks 1–2)

**Goal: Prove AI grading correlates with human educator on 20 test cases**

- RAG pipeline over the Volatility Framework document
- Basic scenario generator (3 scenario types)
- Static grading rubric
- No gamification yet
- Atlas integration: not required

### Phase 1 — Core MVP (Weeks 3–5)

**Goal: End-to-end functional training loop**

- Full scenario engine: 8–10 scenario categories
- Probing agent with follow-up question logic
- XP system and basic leaderboard
- Atlas integration as enrichment (not dependency)
- Individual learner skill dimension dashboard

### Phase 2 — Gauntlet Features (Weeks 6–8)

**Goal: Full gamified, competitive, educator-ready platform**

- Head-to-head competitive mode
- Peer review module
- MTSS God View educator dashboard
- Tiered difficulty by user role and TA phase
- Automated MTSS tier classification (Tier 1 / 2 / 3)

---

## 4. Critical Open Questions

These gaps must be resolved before architecture is finalized. Leaving them open will cause scope drift or blockers mid-build.

### On Atlas Integration

- [ ] What does Atlas actually output — real-time market data, historical data, or both?
- [ ] Is there a Python SDK, or are we hitting raw endpoints?
- [ ] Can Atlas be called in a **sandboxed/simulated mode**, or does it touch live market infrastructure?
- [ ] Who owns Atlas access permissions for a non-production training environment?

### On Grading Calibration

- [ ] Who are the 2–3 senior traders who will serve as the **human grading benchmark panel**?
- [ ] Does CapMan have an existing rubric for evaluating TA responses, or does it need to be built from scratch alongside this project?
- [ ] What is the acceptable grading latency — under 5 seconds per response, or is 15–30s acceptable for complex probing chains?

### On MTSS Framework

- [ ] Is the MTSS Tier 1/2/3 classification criteria already defined, or does this project define it?
- [ ] Who owns the God View dashboard — educators, team leads, or HR?
- [ ] Does performance data need to connect to any existing HR/LMS systems (e.g., Workday)?

### On Scope & Timeline

- [ ] What is the Gauntlet competition deadline / presentation date?
- [ ] Is the deliverable a **prototype/demo** or a **production-ready MVP**?
- [ ] Does the winning team build it out post-Gauntlet, or does a separate engineering team pick it up?

### On Data & Compliance

- [ ] What is CapMan's data classification policy for sending proprietary trading logic to **external LLM APIs**?
- [ ] Is on-premise or private cloud deployment required, or is a managed API (Anthropic / OpenAI) acceptable?
- [ ] Do scenario responses constitute trading-related communications subject to FINRA recordkeeping rules?

---

## 5. Risk Register

| Risk                               | Severity | Likelihood | Mitigation                                                                         |
| ---------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| Atlas docs too sparse to integrate | High     | High       | Build scenario engine in standalone mode first; Atlas = progressive enhancement    |
| Grading calibration drift          | High     | Medium     | Start human-graded ground truth dataset in Week 1, not Week 6                      |
| LLM data compliance blocker        | Critical | Medium     | Get legal yes/no on external API use before finalizing architecture                |
| Audience divergence (3 tiers)      | Medium   | High       | Lock TA as primary persona; others are config variants                             |
| Real-time competitive latency      | Medium   | Low        | Profile grading agent early; cache scenario generation where possible              |
| MTSS criteria undefined            | Medium   | Medium     | Propose a draft Tier 1/2/3 rubric in Phase 0; get educator sign-off before Phase 2 |

---

## 6. What Each Deliverable Must Emphasize

### Engineering MVP Scoping Doc

Focus on the **Atlas integration interface contract**, grading rubric data schema, and the RAG document ingestion pipeline. Define what "done" looks like for Phase 0 before Phase 1 is designed. Every feature must map to a measurable success criterion from the proposal.

### Executive Pitch Deck

Lead with scalability and retention metrics — the business case, not the tech. Frame CapMan AI as the **internal, proprietary-grade version of Zogo** applied to trader development. The God View MTSS dashboard is the executive hook: it turns a subjective _"how's your TA doing?"_ into a data-driven, real-time intervention system. Tie the ROI narrative to reduced educator bandwidth cost and increased TA throughput.

### Full Technical Build Plan

Modular architecture diagram, sprint-by-sprint breakdown, and a clear **Atlas decision tree**: works → enrich scenarios; doesn't work → degrade gracefully to standalone mode. Include grading rubric data schema, RAG chunking strategy for the Volatility Framework doc, and MTSS tier classification logic as appendices.

---

## 7. Source Documents In Scope for RAG Pipeline

| Document                                              | Purpose                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Volatility_Trading_Data_Framework.pdf`               | Primary RAG knowledge base — 20 categories, 200+ data points covering IV, Greeks, Order Flow, Macro, Tail Risk, and more |
| `Gamified_Scenario_Trading_Training___MTSS_Agent.pdf` | Product requirements — success criteria, functional requirements, and technical constraints                              |
| CapMan Lexicon Docs _(to be provided)_                | Enforce proprietary terminology and trading nuances in scenario generation                                               |
| Atlas API Docs _(to be provided)_                     | Python integration hooks for tooling-relevant scenario enrichment                                                        |

---

_Pre-research compiled using public data, Glassdoor TA program reviews, careers pages, and the provided source documents._
