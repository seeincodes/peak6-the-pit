# CapMan AI — Task List

## Phase 0: Foundation (Weeks 1–2)

**Goal: Prove AI grading correlates with human educator on 20 test cases**

### 0.1 Project Setup
- [x] Initialize monorepo structure (Python backend + React frontend)
- [x] Configure Docker Compose for local development (PostgreSQL, Redis, backend, frontend)
- [ ] Set up CI pipeline (lint, test, build)
- [x] Configure environment variables and secrets management
- [x] Set up PostgreSQL database with initial schema migration

### 0.2 RAG Pipeline
- [ ] Ingest Volatility Trading Data Framework PDF into vector store
- [x] Implement chunking strategy (by category/section, ~500 token chunks with overlap)
- [x] Set up embedding model and vector database (pgvector in PostgreSQL)
- [x] Build retrieval API: given a scenario type, return relevant context chunks
- [ ] Test retrieval accuracy against 10 known queries from the framework

### 0.3 Basic Scenario Generator
- [x] Define scenario schema (type, difficulty, context, expected reasoning dimensions)
- [x] Implement 3 initial scenario types: IV Analysis, Greeks Interpretation, Order Flow
- [x] Build prompt templates that incorporate RAG context + CapMan lexicon constraints
- [ ] Generate 20 test scenarios and validate with human review

### 0.4 Static Grading Rubric
- [x] Define rubric dimensions (reasoning quality, terminology accuracy, trade logic, risk awareness)
- [x] Build grading prompt template with rubric scoring (1–5 per dimension)
- [ ] Grade 20 test responses and compare against human educator scores
- [ ] Document correlation results and calibration gaps

### 0.5 Database Schema (Core)
- [x] Users table (id, email, role, tier, ta_phase, created_at)
- [x] Scenarios table (id, type, difficulty, content, context_chunks, created_at)
- [x] Responses table (id, user_id, scenario_id, answer_text, submitted_at)
- [x] Grades table (id, response_id, dimension_scores, overall_score, feedback, graded_at)
- [ ] Create indexes for common query patterns

---

## Phase 1: Core MVP (Weeks 3–5)

**Goal: End-to-end functional training loop**

### 1.1 Full Scenario Engine
- [x] Expand to 8–10 scenario categories (add Macro, Tail Risk, Term Structure, Skew, Correlation, Event Vol)
- [ ] Implement modular scenario type plug-in architecture
- [x] Add difficulty scaling (Beginner / Intermediate / Advanced) per category
- [ ] Build scenario deduplication logic (embedding similarity check)
- [ ] Add Atlas integration hook interface (abstract Python class, no-op default)

### 1.2 Probing & Grading Agent
- [x] Implement Socratic follow-up question generation based on initial response
- [x] Build multi-turn conversation flow (scenario → response → probe → response → grade)
- [ ] Dynamic rubric weighting based on scenario type and difficulty
- [x] Implement grading confidence scoring (flag low-confidence grades for human review)
- [x] Build feedback generation (actionable, specific improvement suggestions)

### 1.3 Authentication & User Management
- [x] Implement JWT-based authentication
- [x] Role-based access control (TA, Intern, Experienced Trader, Educator, Admin)
- [x] User profile with TA program phase tracking
- [ ] Session management and activity logging

### 1.4 XP & Leaderboard System
- [x] Define XP award formula (base points × difficulty multiplier × quality bonus)
- [x] Implement XP ledger (append-only transaction log)
- [ ] Build leaderboard API (ranked by XP, filterable by role/cohort/time window)
- [x] Level progression system (XP thresholds for level-ups)
- [x] Streak tracking (consecutive days of practice)

### 1.5 React Frontend — Core UI
- [x] Scenario presentation view (context display, response input, timer)
- [x] Multi-turn probing conversation interface
- [x] Grade results view (dimension scores, feedback, XP earned)
- [ ] Leaderboard page
- [ ] Individual skill-dimension dashboard (radar chart of category performance)
- [x] Navigation and layout shell

### 1.6 API Layer
- [x] REST API endpoints: scenarios, responses, grades, users, leaderboard
- [ ] WebSocket setup for real-time leaderboard updates
- [ ] Rate limiting and input validation
- [x] API documentation (OpenAPI/Swagger)

---

## Phase 2: Gauntlet Features (Weeks 6–8)

**Goal: Full gamified, competitive, educator-ready platform**

### 2.1 Head-to-Head Competitive Mode
- [ ] Matchmaking engine (pair users by similar skill level)
- [ ] Shared scenario delivery to both players simultaneously
- [ ] Real-time score comparison via WebSocket
- [ ] Match result recording and ELO-style rating adjustment
- [ ] Challenge queue UI and live match interface

### 2.2 Peer Review Module
- [ ] Assign completed responses to peers for review
- [ ] Peer review rubric (simplified version of AI rubric)
- [ ] Review quality scoring (compare peer grades to AI grades)
- [ ] XP bonus for high-quality peer reviews
- [ ] Peer review queue UI

### 2.3 MTSS God View Dashboard
- [ ] Educator dashboard with learner grid (skill dimensions as columns)
- [ ] Automated Tier 1/2/3 classification algorithm
- [ ] Tier classification criteria: Tier 1 (on track), Tier 2 (needs targeted support), Tier 3 (intensive intervention)
- [ ] Drill-down per learner: scenario history, grade trajectory, weak dimensions
- [ ] Cohort-level aggregate views with filtering
- [ ] Intervention recommendation suggestions based on tier + weak dimensions

### 2.4 Tiered Difficulty & Role Configuration
- [ ] Auto-adjust scenario difficulty based on rolling performance window
- [ ] TA phase-aware difficulty mapping (Phase 1–4 of TA program)
- [ ] Intern mode: reduced complexity, faster scenarios, engagement-focused
- [ ] Experienced trader mode: advanced scenarios, peer review emphasis

### 2.5 Polish & Deployment
- [ ] Docker production configuration
- [ ] AWS deployment (ECS or EC2 + RDS PostgreSQL)
- [ ] Environment-specific configuration (dev, staging, prod)
- [ ] Load testing (target: 50 concurrent users)
- [ ] Error monitoring and alerting setup
- [ ] Final grading correlation benchmark (50+ examples)

---

## Phase 3: Final Submission

### 3.1 Evaluation Readiness
- [ ] Prepare demo scenarios showcasing all scenario types
- [ ] Record grading correlation metrics (AI vs. human educator)
- [ ] Document system architecture and design decisions
- [ ] Prepare 5-minute live demo flow

### 3.2 Reliability & Edge Cases
- [ ] Handle LLM API failures gracefully (retry, fallback messaging)
- [ ] Validate scenario quality (reject incoherent generated scenarios)
- [ ] Ensure graceful degradation without Atlas
- [ ] Test concurrent head-to-head matches under load

### 3.3 Submission
- [ ] Final code cleanup and documentation
- [ ] Deploy to production environment
- [ ] Submit deliverables per Gauntlet requirements
