# CapMan AI — Product Requirements Document

## Overview

CapMan AI is a gamified, AI-driven scenario training platform for options trading training. It automates scenario generation, response grading, and learner performance tracking — replacing the current manual, bandwidth-constrained training model with a scalable, engagement-driven system backed by an MTSS (Multi-Tier System of Supports) framework.

## Problem Statement

The TA training program relies on deep-repetition scenario practice, but educator bandwidth and market schedule constraints limit the volume of unique scenarios that can be delivered and graded. There is no centralized system for tracking granular skill-level performance, and the current process cannot scale to support bootcamp interns, experienced traders, and the long-term TA pipeline simultaneously.

## Target Users

| User Tier | Context | Why They Use It |
|---|---|---|
| **Trading Associates** | 18-month structured program (4 phases) | Phase-aware scenario practice, MTSS tracking, mastery progression |
| **Bootcamp Interns** | 1-week intensive (May/Aug cohorts) | High-engagement exposure, fast feedback loops |
| **Experienced Traders** | Upskilling / peer review | Advanced scenarios, peer review role, scenario validation |

> **Primary design persona:** Trading Associates. Intern and experienced trader modes are configuration variants, not separate builds.

## MVP Requirements

- [ ] RAG pipeline over Volatility Trading Data Framework document
- [ ] Dynamic scenario generator (minimum 8–10 volatility data categories)
- [ ] AI probing & grading agent that evaluates reasoning quality, not just final answers
- [ ] Socratic follow-up question logic ("Why that strike?", "What does the IV skew tell you?")
- [ ] Static + dynamic grading rubric anchored to CapMan trading philosophy
- [ ] XP system with points awarded per scenario completion and quality
- [ ] Basic leaderboard (ranked by mastery score and repetition volume)
- [ ] Individual learner skill-dimension dashboard (per-category performance)
- [ ] User authentication and role-based access (TA / Intern / Educator)
- [ ] Atlas integration hooks (progressive enrichment, not hard dependency)
- [ ] Educator grading correlation benchmark (minimum 50 human-graded examples)

## Final Submission Features

### Competitive & Social
- [ ] Head-to-head competitive analysis challenges with real-time matchmaking
- [ ] Peer review module for cross-evaluating responses
- [ ] Dynamic leaderboards with filtering by cohort, phase, and time window

### Educator Dashboard (MTSS God View)
- [ ] Real-time learner grouping by skill dimension (not aggregate score)
- [ ] Automated Tier 1/2/3 MTSS classification based on performance data
- [ ] Intervention recommendation engine for educators
- [ ] Cohort-level and individual trajectory visualization

### Advanced Scenarios
- [ ] 15+ volatility data categories (IV metrics, Order Flow, Greeks, Macro, Tail Risk)
- [ ] Tiered difficulty auto-adjustment by user role and TA program phase
- [ ] Scenario types as modular plug-ins (new categories without engine rebuild)
- [ ] Atlas-enriched scenarios when Atlas integration is available

## Performance Targets

| Metric | Target |
|---|---|
| AI grading ↔ human educator correlation | ≥ 85% agreement on rubric dimensions |
| Scenario generation latency | < 3 seconds per scenario |
| Grading + probing response latency | < 5 seconds standard; < 15 seconds complex probing chains |
| Concurrent users supported | ≥ 50 simultaneous sessions |
| Unique scenario generation capacity | 1,000+ unique scenarios without repetition |
| System uptime | ≥ 99% during trading hours |

## Scope Boundaries

### In Scope
- AI scenario generation using RAG over proprietary CapMan documents
- LLM-based grading with Socratic follow-up probing
- Gamification (XP, leaderboards, head-to-head, peer review)
- MTSS God View educator dashboard with tier classification
- Atlas integration as progressive enrichment (standalone-capable)
- Three user tiers (TA, Intern, Experienced Trader) as config variants
- Educator grading calibration benchmarking

### Out of Scope
- Live market data feeds or real-time trading execution
- Integration with HR/LMS systems (Workday, etc.)
- Mobile native applications (web-responsive only)
- FINRA compliance recordkeeping (flagged for legal review)
- Atlas as a hard dependency (must degrade gracefully)
- Custom LLM fine-tuning (use prompt engineering + RAG)
