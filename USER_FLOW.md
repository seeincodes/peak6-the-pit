# The Pit — User Flow

## Primary Flow: Trading Associate Scenario Training

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   LOGIN      │────▶│  DASHBOARD   │────▶│  SELECT MODE         │
│              │     │  XP, Level,  │     │  ○ Solo Practice     │
│  JWT Auth    │     │  Streak,     │     │  ○ Head-to-Head      │
│  Role check  │     │  Leaderboard │     │  ○ Peer Review Queue │
└──────────────┘     └──────────────┘     └──────────┬───────────┘
                                                     │
                     ┌───────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  SCENARIO PRESENTATION                              ~2 sec   │
│                                                              │
│  Category: IV Skew Analysis                                  │
│  Difficulty: Intermediate                                    │
│  Context: [RAG-retrieved market data + Pit lexicon]       │
│                                                              │
│  "Given the following IV surface for SPX options...          │
│   What trade would you put on and why?"                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [User types response]                                │    │
│  └──────────────────────────────────────────────────────┘    │
│                                              [Submit ▶]      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  SOCRATIC PROBING (1–3 follow-ups)                  ~3 sec   │
│                                                              │
│  AI: "Why did you choose that strike over the 25-delta      │
│       put? What does the skew tell you about demand?"        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  [User elaborates reasoning]                          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                              [Submit ▶]      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  GRADE & FEEDBACK                                   ~5 sec   │
│                                                              │
│  Overall: 4.2 / 5.0          +85 XP ★                       │
│                                                              │
│  Reasoning Quality:  ████░  4/5                              │
│  Terminology:        █████  5/5                              │
│  Trade Logic:        ███░░  3/5                              │
│  Risk Awareness:     ████░  4/5                              │
│                                                              │
│  Feedback: "Strong reasoning on skew interpretation.         │
│  Consider how term structure affects your strike             │
│  selection — the front-month vol is elevated..."             │
│                                                              │
│  [Next Scenario]  [Review Details]  [Back to Dashboard]      │
└──────────────────────────────────────────────────────────────┘
```

## Educator Flow: MTSS God View

```
┌──────────────┐     ┌──────────────────────────────────────────┐
│  EDUCATOR    │────▶│  GOD VIEW DASHBOARD                      │
│  LOGIN       │     │                                          │
│              │     │  Cohort: TA 2026-Q1  ▼                   │
│              │     │                                          │
│              │     │  ┌─── Tier 1 (On Track) ────────────┐   │
│              │     │  │ ██ Alice  ██ Bob  ██ Carol        │   │
│              │     │  └──────────────────────────────────┘   │
│              │     │  ┌─── Tier 2 (Targeted Support) ────┐   │
│              │     │  │ ██ Dave  ██ Eve                    │   │
│              │     │  └──────────────────────────────────┘   │
│              │     │  ┌─── Tier 3 (Intensive) ───────────┐   │
│              │     │  │ ██ Frank                           │   │
│              │     │  └──────────────────────────────────┘   │
│              │     │                                          │
│              │     │  [Click learner for drill-down]          │
└──────────────┘     └──────────────────┬───────────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────────┐
                     │  LEARNER DRILL-DOWN: Frank               │
                     │                                          │
                     │  Skill Radar:        Trajectory:         │
                     │      IV ●            Score ─────/        │
                     │     /    \                  /             │
                     │  Macro    Greeks         ──/              │
                     │     \    /              /                 │
                     │      Flow              Week 1  2  3      │
                     │                                          │
                     │  Weak: Macro (avg 2.1), Order Flow (2.4) │
                     │  Strong: Greeks (4.3), IV (4.0)          │
                     │                                          │
                     │  Recommendation: Assign Macro-focused    │
                     │  scenarios; pair with Alice for peer     │
                     │  review on Order Flow.                   │
                     └──────────────────────────────────────────┘
```

## API Endpoints

### Authentication
| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ access_token, user }` |
| POST | `/api/auth/register` | `{ email, password, display_name, role }` | `{ user }` |
| GET | `/api/auth/me` | Bearer token | `{ user }` |

### Scenarios
| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/scenarios/generate` | `{ category?, difficulty?, user_id }` | `{ scenario }` |
| GET | `/api/scenarios/:id` | — | `{ scenario }` |

### Responses & Grading
| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/responses` | `{ scenario_id, answer_text }` | `{ response, probe_question? }` |
| POST | `/api/responses/:id/continue` | `{ answer_text }` | `{ probe_question?, grade? }` |
| GET | `/api/responses/:id/grade` | — | `{ grade, feedback, xp_earned }` |

### Gamification
| Method | Endpoint | Request | Response |
|---|---|---|---|
| GET | `/api/leaderboard` | `?role=&cohort=&period=` | `{ rankings[] }` |
| GET | `/api/users/:id/stats` | — | `{ xp, level, streak, dimension_scores }` |
| POST | `/api/matches/queue` | `{ user_id }` | `{ match_id, status }` |
| WS | `/ws/match/:id` | — | Real-time match events |

### Peer Review
| Method | Endpoint | Request | Response |
|---|---|---|---|
| GET | `/api/peer-review/queue` | — | `{ responses_to_review[] }` |
| POST | `/api/peer-review` | `{ response_id, dimension_scores, feedback }` | `{ review, xp_earned }` |

### MTSS (Educator)
| Method | Endpoint | Request | Response |
|---|---|---|---|
| GET | `/api/mtss/dashboard` | `?cohort=&tier=` | `{ learners_by_tier }` |
| GET | `/api/mtss/learner/:id` | — | `{ skill_radar, trajectory, recommendations }` |
| GET | `/api/mtss/cohort/:id/report` | — | `{ aggregate_stats, tier_distribution }` |

## Example Queries

| Query / Scenario Prompt | Category | Expected Reasoning |
|---|---|---|
| "SPX 30-day IV is at 18, 90-day at 22. The term structure is in contango. A CPI print is tomorrow. How do you position?" | Term Structure + Event Vol | Identify contango, anticipate vol crush post-event, consider front-month vs. back-month positioning |
| "You see aggressive put buying in single-stock options with IV rising but the underlying flat. What's happening and what do you do?" | Order Flow + IV Analysis | Recognize informed flow, distinguish hedging vs. directional, consider skew implications |
| "Your short gamma position has theta of +$5K/day but you're approaching a Fed meeting. Walk through your risk." | Greeks + Macro | Quantify gamma risk near event, discuss delta hedging costs, consider rolling or reducing |
