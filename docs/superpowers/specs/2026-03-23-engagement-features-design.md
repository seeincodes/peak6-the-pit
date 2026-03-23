# The Pit — Engagement Features Design

**Date:** 2026-03-23
**Status:** Draft
**Scope:** Two feature bundles to improve engagement, learning outcomes, and social dynamics

---

## Overview

Two new feature systems for The Pit:

1. **Market Events** — Time-limited collaborative challenges tied to themed scenario pools
2. **Skill Trees & Mentorship** — Visual progression mapping + mentor-mentee pairing

These address three identified gaps: users dropping off after initial scenarios, gamification without depth, and a predominantly solo experience.

**Build order:** Market Events first (leverages existing infrastructure), then Skill Trees & Mentorship.

### Prerequisites

Before building these features, the following existing gaps must be addressed:

1. **Org-scoped leaderboards** — Existing leaderboard queries are global (no `org_id` filter). Must add org-scoping to leaderboard and badge queries before building event-scoped leaderboards on top.
2. **Notifications table** — No notification system exists. Add a `notifications` table (id, user_id, type, title, body, metadata JSONB, read_at, created_at) and basic delivery mechanism. Required by mentorship nudges, mentor request inbox, and event banners.

---

## Feature 1: Market Events

### Concept

Time-limited events (1–2 weeks) built around themed market scenarios. All org users participate against the same scenario pool. Individual + team scoring, event-exclusive badges, and post-event debriefs.

### Data Model

#### `market_events`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| title | VARCHAR | e.g., "Volatility Crush Week" |
| description | TEXT | Event theme/context |
| theme | VARCHAR | Thematic tag for grouping |
| start_at | TIMESTAMPTZ | Event start |
| end_at | TIMESTAMPTZ | Event end |
| scenario_pool | JSONB | Array of {category, difficulty} combos |
| scoring_config | JSONB | See schema below |
| max_scenarios_per_user | INT | Completion target (e.g., 20). Nullable = unlimited |
| status | VARCHAR | draft / active / completed |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |

**`scoring_config` schema:**
```json
{
  "xp_multiplier": 1.5,
  "dimension_weights": {
    "reasoning": 0.3,
    "terminology": 0.2,
    "trade_logic": 0.3,
    "risk_awareness": 0.2
  },
  "completion_bonus": 50,
  "perfect_score_bonus": 100
}
```

#### `event_participations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_id | UUID | FK → market_events |
| user_id | UUID | FK → users |
| team_identifier | VARCHAR | Team/cohort label for this event |
| individual_score | FLOAT | Running total |
| scenarios_completed | INT | Count |
| best_dimension_scores | JSONB | {reasoning, terminology, trade_logic, risk_awareness} |
| joined_at | TIMESTAMPTZ | |

Unique constraint: (event_id, user_id)

Note: `team_identifier` is set at join time (defaults to `users.cohort` but can be overridden by admin for event-specific team assignments). This decouples event teams from the user's permanent cohort.

#### `event_team_scores`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| event_id | UUID | FK → market_events |
| team_identifier | VARCHAR | Matches event_participations.team_identifier |
| aggregate_score | FLOAT | Sum/avg of member scores |
| member_count | INT | |

#### Event Badges

Badge definitions remain as **reusable templates** in the existing `badges` table. Event-specific awards are tracked on `user_badges`:

- Add `event_id` (nullable UUID FK → market_events) to `user_badges` table
- Change unique constraint from `(user_id, badge_id)` to `(user_id, badge_id, event_id)` using a partial unique index:
  - `CREATE UNIQUE INDEX uq_user_badge_event ON user_badges (user_id, badge_id, event_id) WHERE event_id IS NOT NULL`
  - `CREATE UNIQUE INDEX uq_user_badge_permanent ON user_badges (user_id, badge_id) WHERE event_id IS NULL`
- This keeps badge definitions as templates (e.g., "Event Champion") while allowing users to earn the same badge across multiple events

#### Event-Response Linkage

Add nullable `event_id` (FK → market_events) to the `responses` table. When a scenario is generated via the event endpoint, the response is tagged with the event. The grading flow detects event-linked responses and updates `event_participations.individual_score` and `scenarios_completed` after grading completes.

### User Flow

1. **Admin creates event** — Picks theme, selects categories/difficulties for the scenario pool, sets dates, configures scoring weights and max scenarios. Available from Admin Dashboard.
2. **Event goes live** — Banner appears on Training Hub. Dedicated Event Hub page shows countdown timer, event leaderboard, and scenario launcher. Status transitions: `draft → active` triggered automatically at `start_at` via background cron job, or manually via `POST /api/events/{id}/activate`.
3. **Users participate** — Complete scenarios from the event pool. Scores feed both personal XP (via existing system) and event-specific leaderboard. Team scores aggregate automatically from member participations via `team_identifier`.
4. **Event ends** — Status transitions to `completed` automatically at `end_at` via cron, or manually via `POST /api/events/{id}/finalize`. Final standings frozen. Event badges awarded automatically:
   - Top 3 individual finishers
   - Participation badge (≥1 scenario completed)
   - Perfect score badge (any 100% scenario during event)
   - Team winner badge (all members of winning team)
   - Completion badge (hit `max_scenarios_per_user` target)
5. **Post-event debrief** — Aggregate stats page: hardest scenarios, average scores by category, standout responses (anonymized or opt-in), model answers for event scenarios.
6. **Event history** — Past events browsable with results. Users can compare personal performance across events over time.

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events` | List events (active, upcoming, past) — org-scoped |
| GET | `/api/events/{id}` | Event detail + user's participation |
| POST | `/api/events` | Create event (admin) |
| PUT | `/api/events/{id}` | Update event (admin, draft only for structural changes) |
| DELETE | `/api/events/{id}` | Delete event (admin, draft status only) |
| POST | `/api/events/{id}/activate` | Manually activate a draft event (admin) |
| POST | `/api/events/{id}/finalize` | Manually end and score an event (admin) |
| POST | `/api/events/{id}/join` | Join event |
| GET | `/api/events/{id}/leaderboard` | Event leaderboard (individual + team) — org-scoped |
| GET | `/api/events/{id}/debrief` | Post-event stats and model answers |
| POST | `/api/events/{id}/scenarios/generate` | Generate scenario from event pool (tags response with event_id) |

### Pages

- **Event Hub** (`/events`) — List of active, upcoming, and past events with status badges and countdown timers
- **Event Detail** (`/events/:id`) — Leaderboard, personal progress, scenario launcher, team standings
- **Admin Event Creator** (`/admin/events/new`) — Form with theme picker, category/difficulty selector, date range, scoring config, max scenarios, preview
- **Admin Event Manager** (`/admin/events/:id`) — Edit, activate, finalize, view participation stats
- **Post-Event Debrief** (`/events/:id/debrief`) — Aggregate stats, hardest scenarios, model answers, standout responses

### Integration with Existing Systems

- **Scenario engine** — Scenarios generated from event pool config (category + difficulty filters), same RAG pipeline
- **Grading** — Standard grading agent. After grading, if `response.event_id` is set, update `event_participations` (score + count). XP multiplier from `scoring_config` applied via existing `xp_transactions`
- **XP** — Event scenarios award normal XP × `scoring_config.xp_multiplier` via existing `xp_transactions`
- **Badges** — Existing badge award pipeline. Event badges tracked via `user_badges.event_id`
- **Leaderboard** — New event-scoped leaderboard queries (requires prerequisite: org-scoped base queries)
- **Activity feed** — New event types: `event_joined`, `event_scenario_completed`, `event_badge_earned`

Note: `event_completed` (originally "finished all event scenarios") is replaced by `event_scenario_completed` per scenario. If `max_scenarios_per_user` is set and the user hits it, an `event_target_reached` event fires instead.

---

## Feature 2: Skill Trees & Mentorship

### Part A: Skill Trees

#### Concept

An interactive visual skill tree replacing flat category lists. Each node represents one of the 27 trading categories, organized into dependency tiers. Shows mastery state, prerequisites, and clear progression paths.

#### Data Model

##### `skill_nodes`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| org_id | UUID | FK → organizations (nullable for defaults) |
| category | VARCHAR | Maps to existing 27 categories |
| display_name | VARCHAR | Human-readable name |
| description | TEXT | What this skill covers |
| icon | VARCHAR | Icon identifier |
| prerequisites | JSONB | Array of category slugs required |
| position_x | FLOAT | Canvas X position for rendering |
| position_y | FLOAT | Canvas Y position for rendering |
| tier | INT | 1–4 (Foundations → Market Mastery) |
| is_hidden | BOOLEAN | Default false. Org override to hide a default node |

Seeded with default tree (org_id = NULL). Orgs can customize by creating org-specific rows.

**Query precedence:** Return all nodes where `org_id = current_org` UNION all default nodes where `org_id IS NULL AND category NOT IN (select category from skill_nodes where org_id = current_org)`. Filter out rows where `is_hidden = true`.

##### `user_skill_mastery`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| category | VARCHAR | Category slug |
| mastery_level | FLOAT | 0–100, computed |
| peak_mastery | FLOAT | Highest mastery_level ever achieved |
| scenarios_completed | INT | Total attempts in category |
| avg_score | FLOAT | Weighted recent average |
| last_attempt_at | TIMESTAMPTZ | For decay calculation |

This is a cached/materialized view derived from existing `grades` + `responses` data. Refreshed on each scenario completion or via periodic background job.

#### Mastery Calculation — Replaces Existing System

**Important:** The new mastery calculation **replaces** the existing `check_mastery()` function in `progression.py`. The existing constants `MASTERY_THRESHOLD = 3.5` and `MASTERY_SCENARIO_COUNT = 5` are superseded.

**New calculation:**
- Weighted average of last 10 scenario scores in the category (up from 5)
- Scores normalized to 0–100 scale (existing scores are 0–5, multiply by 20)
- Recency bias: most recent scores weighted 2x
- **Decay:** mastery decreases by 5% per week of inactivity in that category. Floor: 50% of `peak_mastery`. Encourages revisiting and prevents stale mastery claims.
- `peak_mastery` updated whenever `mastery_level` exceeds current peak
- Recalculated on each scenario completion; background job runs daily for decay

**Migration path:** Update `check_mastery()` to use the new calculation. Existing progression gates (category unlocks) use the same mastery — "mastered" = ≥ 70 on the 0–100 scale (equivalent to the old 3.5/5.0 threshold). `MASTERY_SCENARIO_COUNT` updated from 5 to 10.

#### Tier Structure

| Tier | Name | Example Categories |
|------|------|--------------------|
| 1 | Foundations | options_basics, market_structure, terminology |
| 2 | Core Greeks | delta, gamma, theta, vega, rho |
| 3 | Advanced Strategies | spreads, straddles, iron_condors, risk_reversals |
| 4 | Market Mastery | vol_surface, order_flow, macro_analysis, earnings_plays |

#### Node States

| State | Condition | Visual |
|-------|-----------|--------|
| Locked | Prerequisites not mastered | Grayscale, lock icon |
| Available | Prerequisites met, 0 attempts | Outlined, pulsing glow |
| In Progress | 1+ attempts, < 70% mastery | Partially filled, colored |
| Mastered | ≥ 70% mastery | Gold, checkmark, particle effect |

#### Node Interaction

Clicking a node opens a detail panel showing:
- Mastery percentage with progress ring
- Recent scores (last 5)
- Dimension breakdown radar chart (reuse existing Recharts component)
- Recommended next scenario difficulty
- "Start Training" button → navigates to Training Hub filtered to that category
- Prerequisites list (with links to those nodes)

#### Pages

- **Skill Tree** (`/skills`) — Full interactive canvas with pan/zoom. Replaces or supplements existing category selection on Training Hub.
- **Node Detail** — Slide-out panel or modal with stats and training launcher

#### Frontend Approach

- Canvas rendering: SVG-based with Framer Motion for transitions (consistent with existing animation stack)
- Pan/zoom: lightweight library (e.g., `react-zoom-pan-pinch`)
- Responsive: simplified list/grid view on mobile, full tree on desktop

### Part B: Mentorship

#### Concept

Structured mentor-mentee pairing where experienced traders guide newer ones. Mentors earn XP for mentee progress, creating aligned incentives.

#### Data Model

##### `mentorships`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| mentor_id | UUID | FK → users |
| mentee_id | UUID | FK → users |
| status | VARCHAR | active / completed / cancelled / declined |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | Nullable |
| notes | TEXT | Mentor's private notes |

Enforced via partial unique index (PostgreSQL):
```sql
CREATE UNIQUE INDEX uq_active_mentorship ON mentorships (mentor_id, mentee_id) WHERE status = 'active';
```
This prevents duplicate active mentorships per pair while allowing historical records.

##### `mentorship_goals`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| mentorship_id | UUID | FK → mentorships |
| category | VARCHAR | Target category slug |
| target_mastery | FLOAT | Goal mastery level (0–100) |
| current_mastery | FLOAT | Snapshot, updated on change |
| created_at | TIMESTAMPTZ | |
| achieved_at | TIMESTAMPTZ | Nullable |

#### Eligibility

- **Mentor:** ≥ 3 mastered categories (70%+ mastery) AND level ≥ 5. Can also be admin-assigned.
- **Mentee:** Any user. Max 1 active mentor at a time.
- **Mentor capacity:** Max 3 active mentees per mentor (configurable per org).

#### Pairing Flow

1. **Mentor opt-in** — Eligible users toggle "Available as Mentor" in profile settings. Their mastered categories become visible to potential mentees.
2. **Mentee requests** — From Mentorship Hub, browse available mentors filtered by category strengths. Send request with a note about learning goals.
3. **Mentor accepts/declines** — Via notifications (requires prerequisite: notifications table). Accepting creates the mentorship. Declining sets status to `declined`.
4. **Admin override** — Admins can directly assign pairs from the Admin Dashboard.
5. **System suggestions** — Optionally, system suggests mentor matches based on: mentor strengths aligning with mentee's weakest skill tree nodes.

#### Shared Goals

- Mentor and mentee collaboratively set 2–3 category mastery goals
- Goals reference skill tree nodes — visible on both users' skill trees with a shared indicator
- Progress updates in real-time as mentee completes scenarios

#### Mentor Rewards (XP)

Via existing `xp_transactions` with `source = "mentorship"`:

| Mentee Milestone | Mentor XP |
|------------------|-----------|
| Mentee completes a goal | 100 XP |
| Mentee levels up | 150 XP |
| Mentee earns a badge | 50 XP |
| Mentee completes 10 scenarios | 75 XP |

Configurable per org in a `mentorship_config` JSONB on `organizations` table.

#### Mentor Dashboard

- List of active mentees with at-a-glance stats (level, streak, recent activity)
- Per-mentee: skill tree overlay showing shared goals + progress
- Goal management (add/edit/mark complete)
- Activity timeline (mentee's recent completions, scores, badges)
- "Send Nudge" button → creates notification for mentee (via notifications table)

#### Mentee View

- Current mentor profile with their mastered categories
- Shared goals with progress bars
- "Request Review" button → creates a `PeerReview` with `review_type = "mentor"` and `requested_reviewer_id = mentor_id`. Mentor dashboard shows pending mentor reviews filtered by `requested_reviewer_id = current_user.id`.

**PeerReview model changes required:**
- Add `review_type` column: VARCHAR, values "peer" (default) | "mentor"
- Add `requested_reviewer_id` column: nullable UUID FK → users

#### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/skills/tree` | Get skill tree nodes for org (with precedence logic) |
| GET | `/api/skills/mastery` | Get current user's mastery across all categories |
| GET | `/api/skills/mastery/{category}` | Detailed mastery for one category |
| GET | `/api/mentorships` | List user's mentorships (as mentor or mentee) |
| POST | `/api/mentorships/request` | Mentee requests a mentor |
| PUT | `/api/mentorships/{id}/accept` | Mentor accepts request |
| PUT | `/api/mentorships/{id}/decline` | Mentor declines request |
| PUT | `/api/mentorships/{id}/cancel` | Cancel active mentorship |
| PUT | `/api/mentorships/{id}/complete` | Mark mentorship as completed |
| GET | `/api/mentorships/{id}/goals` | List shared goals |
| POST | `/api/mentorships/{id}/goals` | Create a goal |
| PUT | `/api/mentorships/{id}/goals/{goal_id}` | Update goal |
| POST | `/api/mentorships/{id}/nudge` | Send nudge notification |
| GET | `/api/mentors/available` | List available mentors (for mentee browsing) |
| PUT | `/api/users/me/mentor-status` | Toggle mentor availability |

#### Pages

- **Mentorship Hub** (`/mentorship`) — Browse available mentors, see active mentorships, request/manage
- **Mentor Dashboard** (`/mentorship/dashboard`) — Mentee list, goals, activity, nudge
- **Shared Goals** (within mentorship detail) — Goal cards with progress bars and skill tree link

---

## Cross-Cutting Concerns

### Activity Feed Integration

New event types for the existing activity feed:

| Event Type | Trigger |
|------------|---------|
| `event_joined` | User joins a market event |
| `event_scenario_completed` | User completes a scenario within an event |
| `event_target_reached` | User hits max_scenarios_per_user for the event |
| `event_badge_earned` | Event-exclusive badge awarded |
| `skill_mastered` | User reaches 70%+ mastery in a category |
| `mentorship_started` | Mentor-mentee pair formed |
| `mentorship_goal_achieved` | Mentee hits a shared goal |

### Badge Additions

| Badge | Trigger | Tier |
|-------|---------|------|
| Event Warrior | Complete 5 events | Silver |
| Event Champion | Finish top 3 in any event | Gold |
| Tree Climber | Master 5 skill tree nodes | Silver |
| Full Canopy | Master all Tier 1 nodes | Gold |
| Sherpa | Mentor 3 mentees to goal completion | Gold |
| Guided | Complete all mentorship goals | Silver |

### Admin Dashboard Extensions

- **Event Management** tab — Create/edit/activate/finalize events, view participation stats
- **Mentorship Overview** tab — Active pairings, goal completion rates, mentor utilization
- **Skill Mastery Heatmap** — Org-wide view of which categories are strong/weak (informs event themes)

### Testing Strategy

- Unit tests for mastery calculation (new weighted formula, recency bias, decay, peak tracking)
- Unit tests for event scoring (dimension weights, XP multiplier, completion detection)
- Integration tests for event lifecycle (create → join → complete scenarios → end → badge award)
- Integration tests for mentorship flow (request → accept → set goals → achieve → XP award)
- E2E tests for skill tree rendering and node interaction
- Load testing for event leaderboard queries under concurrent participation

---

## Implementation Order

### Phase 0: Prerequisites
1. Add `org_id` filtering to existing leaderboard queries
2. Add `org_id` filtering to existing badge queries
3. Create `notifications` table and basic delivery service
4. Add `review_type` and `requested_reviewer_id` columns to `PeerReview` model

### Phase 1: Market Events
1. Database migrations: `market_events`, `event_participations`, `event_team_scores`, `event_id` on `user_badges`, `event_id` on `responses`
2. Backend: event CRUD, participation tracking, event-scoped leaderboard queries
3. Backend: event lifecycle management (cron for auto-activation/completion, manual endpoints, badge awarding)
4. Backend: grading flow extension — detect event-linked responses, update participation scores
5. Frontend: Event Hub, Event Detail, Admin Event Creator/Manager
6. Frontend: Post-Event Debrief page
7. Integration: wire event scenarios to existing scenario engine + grading
8. Activity feed event types
9. Tests

### Phase 2: Skill Trees
1. Database migrations: `skill_nodes`, `user_skill_mastery` (with `peak_mastery`)
2. Backend: new mastery calculation service replacing `check_mastery()`, decay background job
3. Backend: skill tree API with org precedence logic
4. Seed default skill tree (27 categories, 4 tiers, prerequisites)
5. Frontend: interactive skill tree canvas with pan/zoom
6. Frontend: node detail panel with stats + training launcher
7. Integration: mastery recalculation on scenario completion
8. Tests

### Phase 3: Mentorship
1. Database migrations: `mentorships`, `mentorship_goals`, `mentorship_config` on organizations
2. Backend: pairing flow (request/accept/decline/cancel/complete), goal management, mentor XP rewards
3. Backend: mentor matching suggestions based on skill tree mastery
4. Frontend: Mentorship Hub, Mentor Dashboard, Shared Goals
5. Integration: mentor review via extended PeerReview, nudge via notifications
6. Admin: mentorship overview tab
7. Tests
