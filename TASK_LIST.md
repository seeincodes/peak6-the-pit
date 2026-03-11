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

---

## Phase 4: UX & Learning Improvements (Post-MVP)

**Goal: Improve learning outcomes, engagement, and retention**

*Ordered by highest impact / easiest implementation*

### 4.1 Surface Hints System with XP Tradeoff *(Quick Win)* ✅
- [x] Surface existing `hints` array from scenario JSON in `ScenarioCard.tsx`
- [x] Add progressive reveal UI (show one hint at a time)
- [x] Apply -20% XP penalty per hint used in `services/grading_agent.py`
- [x] Pass hints_used count through `routers/scenarios.py` submission flow
- [x] Update `GradeReveal.tsx` to show "hints used" in XP breakdown

**Files:** `ScenarioCard.tsx`, `GradeReveal.tsx`, `TrainingPage.tsx`, `routers/scenarios.py`, `services/grading_agent.py`

### 4.2 Per-Attempt Radar Chart in Grade Reveal *(Quick Win)* ✅
- [x] Reuse existing `RadarScoreChart.tsx` component in `GradeReveal.tsx`
- [x] Feed individual attempt dimension_scores (reasoning, terminology, trade_logic, risk_awareness) instead of aggregates
- [x] Style as a compact inline chart below the overall score

**Files:** `GradeReveal.tsx`, `charts/RadarScoreChart.tsx`

### 4.3 Category Mastery Progress Bars *(Quick Win)* ✅
- [x] Add new backend endpoint `GET /performance/category-summary` returning attempts + avg score per category
- [x] Create `CategoryProgress.tsx` component with mini progress bars
- [x] Integrate into category selector on `TrainingPage.tsx`

**Files:** `TrainingPage.tsx`, new `components/CategoryProgress.tsx`, `routers/performance.py`

### 4.4 Model Answer Toggle *(Quick Win)* ✅
- [x] Add "Show Model Answer" button in `GradeReveal.tsx`
- [x] Create backend endpoint `POST /responses/{id}/model-answer` that generates an ideal response via Claude + RAG context
- [x] Add model answer prompt template to `prompts/grading_rubric.py`
- [x] Display model answer in expandable section with dimension callouts

**Files:** `GradeReveal.tsx`, `routers/responses.py`, `services/grading_agent.py`, `prompts/grading_rubric.py`

### 4.5 Progress Celebrations & Micro-Feedback *(Quick Win)* ✅
- [x] Enhance `LevelUpModal.tsx` with full-screen animation + confetti (Framer Motion)
- [x] Create `BadgeUnlockModal.tsx` with confetti effect on badge earn
- [x] Add "Personal Best!" notification when user beats their high score in a category
- [x] Trigger celebrations from `TrainingPage.tsx` and `QuickFirePage.tsx` after grade/XP response

**Files:** `LevelUpModal.tsx`, new `components/BadgeUnlockModal.tsx`, `TrainingPage.tsx`, `QuickFirePage.tsx`

### 4.6 Quick Fire Timer & Score Card *(Quick Win)* ✅
- [x] Add optional countdown timer toggle (30s/60s/off) to `QuickFirePage.tsx`
- [x] Create `QuickFireScoreCard.tsx` showing running tally (correct/total, avg justification quality)
- [x] Add "Lightning Round" mode: 10 questions, timed, summary at end with total XP
- [x] Auto-advance on timer expiry (mark as wrong)

**Files:** `QuickFirePage.tsx`, `MCQCard.tsx`, new `components/QuickFireScoreCard.tsx`

### 4.7 Mistake Journal / Review Mode *(Medium)* ✅
- [x] Create `ReviewPage.tsx` with paginated list of past attempts + grades
- [x] Add route `/review` in `App.tsx` and nav link in `Sidebar.tsx`
- [x] Add backend endpoint `GET /responses/history` with filters (category, score range, date range)
- [x] Show scenario, user response, AI feedback, and dimension scores per attempt
- [x] Add "Retry This Scenario" button linking back to training

**Files:** new `pages/ReviewPage.tsx`, `App.tsx`, `Sidebar.tsx`, `routers/responses.py`

### 4.8 Scenario Bookmarking & Favorites *(Medium)* ✅
- [x] Create `user_bookmarks` table (user_id, scenario_id, tag, created_at) + Alembic migration
- [x] Create `models/bookmark.py` and `routers/bookmarks.py` (CRUD endpoints)
- [x] Add bookmark icon toggle on `ScenarioCard.tsx` and `GradeReveal.tsx`
- [x] Create `BookmarksPage.tsx` showing saved scenarios with tag filters
- [x] Add route `/bookmarks` in `App.tsx` and nav link in `Sidebar.tsx`

**Files:** new `models/bookmark.py`, new `routers/bookmarks.py`, `ScenarioCard.tsx`, `GradeReveal.tsx`, new `pages/BookmarksPage.tsx`, `App.tsx`, `Sidebar.tsx`, Alembic migration

### 4.9 Session Goals & Daily Challenges *(Medium)* ✅
- [x] Create `daily_challenges` table (id, user_id, challenge_type, target, progress, bonus_xp, date, completed) + migration
- [x] Build `services/challenges.py` with daily challenge generation logic (3 challenges per day, rotating types)
- [x] Create `routers/challenges.py` with `GET /challenges/today` and `POST /challenges/{id}/progress`
- [x] Create `DailyChallengeCard.tsx` component showing today's challenges with progress bars
- [x] Integrate into `TrainingPage.tsx` header and `Sidebar.tsx` indicator
- [x] Auto-award bonus XP on challenge completion

**Files:** new `models/challenge.py`, new `services/challenges.py`, new `routers/challenges.py`, new `components/DailyChallengeCard.tsx`, `TrainingPage.tsx`, `Sidebar.tsx`, Alembic migration

### 4.10 Onboarding Flow *(Medium)* ✅
- [x] Add `has_onboarded` boolean to `users` table + migration
- [x] Create `OnboardingModal.tsx` with step-through guided tour (4 steps: welcome, modes, XP, compete)
- [x] Trigger on first login in `TrainingPage.tsx` (check `has_onboarded` flag)
- [x] Add `PATCH /users/me/onboard` endpoint to mark complete
- [x] Skip tour option on first step

**Files:** new `components/OnboardingModal.tsx`, `TrainingPage.tsx`, `models/user.py`, `routers/users.py`, Alembic migration

### 4.11 Spaced Repetition for Weak Areas *(Large)*
- [ ] Build `services/recommendation.py` analyzing grade history to identify weak categories + dimensions
- [ ] Implement weighted scoring algorithm (recent attempts weighted higher, low scores weighted higher)
- [ ] Add `GET /scenarios/recommended` endpoint returning prioritized category + difficulty
- [ ] Create "Recommended for You" section on `TrainingPage.tsx` above category selector
- [ ] Track recommendation acceptance rate for algorithm tuning

**Files:** new `services/recommendation.py`, `routers/scenarios.py`, `TrainingPage.tsx`

### 4.12 Adaptive Difficulty Engine *(Large)*
- [ ] Build `services/difficulty_engine.py` with rolling window analysis (last 5 attempts per category)
- [ ] Auto-promote: 3+ consecutive scores ≥ 4.0 → suggest next difficulty
- [ ] Auto-demote: 3+ consecutive scores ≤ 2.0 → suggest easier difficulty
- [ ] Integrate into `routers/scenarios.py` scenario generation flow
- [ ] Add difficulty suggestion UI in `TrainingPage.tsx` (user can accept/override)

**Files:** new `services/difficulty_engine.py`, `routers/scenarios.py`, `services/scenario_engine.py`, `TrainingPage.tsx`

### 4.13 Concept Explainers Before Scenarios *(Large)*
- [ ] Add `GET /categories/{slug}/primer` endpoint pulling top RAG chunks for a category
- [ ] Create `ConceptPrimer.tsx` component rendering primer as a "Learn First" tab
- [ ] Integrate into `TrainingPage.tsx` category detail view (tabs: Learn First | Practice)
- [ ] Track primer views in user activity for engagement metrics

**Files:** new `components/ConceptPrimer.tsx`, `TrainingPage.tsx`, `routers/scenarios.py`, `services/rag.py`

### 4.14 Peer Comparison Insights *(Large)*
- [ ] Extend `GET /performance/dashboard` to include anonymized cohort averages per dimension and category
- [ ] Add cohort overlay lines/bars to `PerformanceCharts.tsx` (score trend, category bars, dimension radar)
- [ ] Add toggle "Show cohort average" in dashboard UI

**Files:** `charts/PerformanceCharts.tsx`, `routers/performance.py`

### 4.15 Guided Learning Paths *(Large)*
- [ ] Design path schema: `learning_paths` table (id, slug, name, category, steps JSON, difficulty_progression) + migration
- [ ] Create `user_path_progress` table (user_id, path_id, current_step, completed_at) + migration
- [ ] Build `routers/paths.py` with CRUD + progress tracking endpoints
- [ ] Create `LearningPathPage.tsx` with step-by-step UI, progress bar, and locked/unlocked steps
- [ ] Add route `/paths` in `App.tsx` and nav link in `Sidebar.tsx`
- [ ] Seed initial paths for core categories (Greeks Fundamentals, Vol Surface Mastery, etc.)

**Files:** new `models/learning_path.py`, new `routers/paths.py`, new `pages/LearningPathPage.tsx`, `App.tsx`, `Sidebar.tsx`, `services/progression.py`, Alembic migration

### 4.16 Weekly Recap Notifications *(Large)*
- [ ] Build `services/recap.py` aggregating weekly stats (XP earned, rank change, attempts, best/worst category)
- [ ] Add `GET /users/me/weekly-recap` endpoint
- [ ] Create `WeeklyRecapModal.tsx` shown on first login of the week
- [ ] Track last recap shown date on user model

**Files:** new `services/recap.py`, new `routers/recap.py`, new `components/WeeklyRecapModal.tsx`, `TrainingPage.tsx`, `models/user.py`, Alembic migration

### 4.17 Team/Cohort Leaderboards *(Large)*
- [ ] Add `cohort` field to `users` table + migration
- [ ] Extend `routers/leaderboard.py` with `GET /leaderboard/teams` endpoint (group by role/ta_phase/cohort)
- [ ] Add "Teams" tab to `LeaderboardPage.tsx` with team aggregate XP + member list
- [ ] Assign cohorts during signup or via admin

**Files:** `LeaderboardPage.tsx`, `routers/leaderboard.py`, `models/user.py`, Alembic migration

### 4.18 Discussion Thread per Scenario *(Large)*
- [ ] Create `discussion_posts` table (id, scenario_id, user_id, content, is_anonymous, created_at) + migration
- [ ] Create `models/discussion.py` and `routers/discussions.py` (CRUD + list by scenario)
- [ ] Create `DiscussionThread.tsx` component showing anonymized peer strategies
- [ ] Integrate into `GradeReveal.tsx` as "See How Others Approached This" section
- [ ] Add basic moderation (report, hide) for educator role

**Files:** new `models/discussion.py`, new `routers/discussions.py`, new `components/DiscussionThread.tsx`, `GradeReveal.tsx`, Alembic migration
