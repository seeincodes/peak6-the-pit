"""Seed the database with demo data for all features. Run via: python -m app.seed"""
import asyncio
import os
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select

from app.database import async_session
from app.models.user import User
from app.models.scenario import Scenario
from app.models.response import Response
from app.models.grade import Grade
from app.models.activity_event import ActivityEvent
from app.models.bookmark import Bookmark
from app.models.badge import Badge, UserBadge
from app.models.learning_path import LearningPath, UserPathProgress
from app.models.peer_review import PeerReview
from app.services.auth import hash_password

# ───────────────────────── Stable UUIDs ──────────────────────────

# Users
U1 = uuid.UUID("00000000-0000-0000-0000-000000000001")
U2 = uuid.UUID("00000000-0000-0000-0000-000000000002")
U3 = uuid.UUID("00000000-0000-0000-0000-000000000003")
U4 = uuid.UUID("00000000-0000-0000-0000-000000000004")
U5 = uuid.UUID("00000000-0000-0000-0000-000000000005")

# Prod users
P1 = uuid.UUID("00000000-0000-0000-0000-000000000010")
P2 = uuid.UUID("00000000-0000-0000-0000-000000000011")
P3 = uuid.UUID("00000000-0000-0000-0000-000000000012")

# Scenarios
S = [uuid.UUID(f"20000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 21)]

# Responses
R = [uuid.UUID(f"30000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 21)]

# Grades
G = [uuid.UUID(f"40000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 21)]

# Bookmarks
BK = [uuid.UUID(f"50000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 11)]

# Activity events
AE = [uuid.UUID(f"60000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 31)]

# Peer reviews
PR = [uuid.UUID(f"70000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 6)]

# Path progress
PP = [uuid.UUID(f"80000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 6)]

# Learning path IDs (from path_seed.py)
LP_OPTIONS_BASICS = uuid.UUID("10000000-0000-0000-0000-000000000007")
LP_GREEKS = uuid.UUID("10000000-0000-0000-0000-000000000001")
LP_VOL_SURFACE = uuid.UUID("10000000-0000-0000-0000-000000000002")
LP_RISK_MGMT = uuid.UUID("10000000-0000-0000-0000-000000000003")
LP_MACRO = uuid.UUID("10000000-0000-0000-0000-000000000004")

# Backward compat
TEST_USER_ID = U1


# ───────────────────────── Users ─────────────────────────────────

TEST_USERS = [
    {
        "id": U1,
        "email": "trader@capman.dev",
        "password": "trader123",
        "display_name": "Test Trader",
        "role": "ta",
        "avatar_id": "chart",
        "bio": "Learning the ropes of options trading.",
        "ta_phase": 1,
        "xp_total": 120,
        "level": 2,
        "streak_days": 3,
        "cohort": "spring-2026",
        "has_onboarded": True,
    },
    {
        "id": U2,
        "email": "alex@capman.dev",
        "password": "alex123",
        "display_name": "Alex Chen",
        "role": "ta",
        "avatar_id": "lightning",
        "bio": "Volatility enthusiast. Delta-neutral or bust.",
        "ta_phase": 2,
        "xp_total": 3125,
        "level": 4,
        "streak_days": 5,
        "cohort": "spring-2026",
        "has_onboarded": True,
    },
    {
        "id": U3,
        "email": "maria@capman.dev",
        "password": "maria123",
        "display_name": "Maria Santos",
        "role": "ta",
        "avatar_id": "crown",
        "bio": "Former physicist turned quant. Skew is my edge.",
        "ta_phase": 3,
        "xp_total": 7000,
        "level": 7,
        "streak_days": 12,
        "cohort": "spring-2026",
        "has_onboarded": True,
    },
    {
        "id": U4,
        "email": "james@capman.dev",
        "password": "james123",
        "display_name": "James Kim",
        "role": "intern",
        "avatar_id": "rocket",
        "bio": "Finance major grinding levels. Catch me on the leaderboard.",
        "ta_phase": None,
        "xp_total": 1125,
        "level": 3,
        "streak_days": 2,
        "cohort": "spring-2026",
        "has_onboarded": True,
    },
    {
        "id": U5,
        "email": "priya@capman.dev",
        "password": "priya123",
        "display_name": "Priya Patel",
        "role": "ta",
        "avatar_id": "brain",
        "bio": "Risk manager at heart. Building systematic frameworks.",
        "ta_phase": 4,
        "xp_total": 8000,
        "level": 10,
        "streak_days": 15,
        "cohort": "spring-2026",
        "has_onboarded": True,
    },
]

PROD_USERS = [
    {
        "id": P1,
        "email": "demo@capman.dev",
        "password": "demo2026",
        "display_name": "Demo Trader",
        "role": "ta",
        "avatar_id": "chart",
        "bio": "Demo account for exploring CapMan AI.",
        "ta_phase": 2,
        "xp_total": 650,
        "level": 3,
        "streak_days": 3,
        "cohort": "demo",
        "has_onboarded": True,
    },
    {
        "id": P2,
        "email": "admin@capman.dev",
        "password": "admin2026",
        "display_name": "Admin User",
        "role": "admin",
        "avatar_id": "shield",
        "bio": None,
        "ta_phase": None,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
        "cohort": "demo",
        "has_onboarded": True,
    },
    {
        "id": P3,
        "email": "advanced@capman.dev",
        "password": "advanced2026",
        "display_name": "Advanced Demo",
        "role": "ta",
        "avatar_id": "diamond",
        "bio": "Power user showcasing all features.",
        "ta_phase": 4,
        "xp_total": 8750,
        "level": 10,
        "streak_days": 21,
        "cohort": "demo",
        "has_onboarded": True,
    },
]


# ───────────────────────── Scenarios ─────────────────────────────

DEMO_SCENARIOS = [
    {
        "id": S[0], "category": "iv_analysis", "difficulty": "beginner",
        "content": {
            "title": "SPY IV Spike Analysis",
            "question": "SPY 30-day IV has jumped from 18 to 28 over two sessions while the index dropped 3%. Is this IV level justified or overshooting? What trades would you consider?",
            "context": "S&P 500 ETF options chain showing elevated put skew and term structure in backwardation.",
        },
    },
    {
        "id": S[1], "category": "greeks", "difficulty": "beginner",
        "content": {
            "title": "Delta Hedging a Long Straddle",
            "question": "You're long a 30-delta straddle on AAPL with 14 DTE. The stock rallies 2%. Walk through your delta-hedging decision.",
            "context": "AAPL at $185, straddle struck at $185, current delta +0.15 after the move.",
        },
    },
    {
        "id": S[2], "category": "order_flow", "difficulty": "beginner",
        "content": {
            "title": "Unusual Options Activity",
            "question": "You notice 10x average volume in NVDA weekly 140 calls with mostly buying on the ask. How do you interpret this flow and would you follow it?",
            "context": "NVDA trading at $135, earnings in 8 days. IV rank at 75th percentile.",
        },
    },
    {
        "id": S[3], "category": "macro", "difficulty": "beginner",
        "content": {
            "title": "FOMC Volatility Setup",
            "question": "FOMC announces rates unchanged but signals hawkish forward guidance. VIX drops from 22 to 19. Explain this reaction and identify trading opportunities.",
            "context": "Market was pricing 70% chance of a hold. Treasury yields jumped 8bps on the long end.",
        },
    },
    {
        "id": S[4], "category": "term_structure", "difficulty": "beginner",
        "content": {
            "title": "Vol Term Structure Inversion",
            "question": "TSLA's vol term structure is deeply inverted — 1-week IV at 65%, 1-month at 48%, 3-month at 42%. What is the market telling you? How would you trade this?",
            "context": "TSLA earnings in 4 days. Stock has moved 8%+ on the last 3 earnings.",
        },
    },
    {
        "id": S[5], "category": "skew", "difficulty": "intermediate",
        "content": {
            "title": "Put Skew Flattening Trade",
            "question": "QQQ 25-delta put skew has flattened from 8 vol points to 3 over a month while the index rallied 5%. Is this normal? How would you position?",
            "context": "Historically QQQ skew averages 5-7 vol points in low-vol environments.",
        },
    },
    {
        "id": S[6], "category": "position_sizing", "difficulty": "beginner",
        "content": {
            "title": "Sizing a Butterfly Spread",
            "question": "You want to put on an iron butterfly on SPX with max risk of 2% of your $500K portfolio. Walk through your sizing process.",
            "context": "SPX at 5200, targeting the 5200 butterfly. Wings 50 points wide.",
        },
    },
    {
        "id": S[7], "category": "trade_structuring", "difficulty": "intermediate",
        "content": {
            "title": "Earnings Straddle vs Strangle",
            "question": "META earnings tomorrow. IV at 55%, expected move $18. Compare a straddle vs 25-delta strangle. Which do you prefer and why?",
            "context": "META at $520. Last 4 earnings moves: +12%, -4%, +7%, -9%.",
        },
    },
    {
        "id": S[8], "category": "risk_management", "difficulty": "intermediate",
        "content": {
            "title": "Portfolio Stress Test",
            "question": "Your portfolio is long gamma on tech names, short vega on financials. A banking crisis headline hits. Walk through your immediate risk management steps.",
            "context": "Correlation spike to 0.85 across sectors. VIX jumps 6 points.",
        },
    },
    {
        "id": S[9], "category": "realized_vol", "difficulty": "beginner",
        "content": {
            "title": "Realized vs Implied Divergence",
            "question": "AMZN 30-day realized vol is 22% but 30-day IV is 35%. Is this a systematic selling opportunity? What could go wrong?",
            "context": "AMZN has earnings in 3 weeks. Historical vol tends to pick up 2 weeks before earnings.",
        },
    },
    {
        "id": S[10], "category": "correlation", "difficulty": "beginner",
        "content": {
            "title": "Cross-Asset Correlation Breakdown",
            "question": "Stock-bond correlation just flipped positive after being negative for 2 years. What are the implications for a multi-asset options portfolio?",
            "context": "Fed signaling higher-for-longer. Both equities and bonds selling off.",
        },
    },
    {
        "id": S[11], "category": "event_vol", "difficulty": "beginner",
        "content": {
            "title": "Binary Event Pricing",
            "question": "A biotech has FDA approval decision tomorrow. Options are pricing a 40% move. The stock is at $50. How would you trade this binary event?",
            "context": "Historical FDA events show 60% approval rate for this drug type. Similar biotechs moved 30-50%.",
        },
    },
    {
        "id": S[12], "category": "tail_risk", "difficulty": "beginner",
        "content": {
            "title": "Tail Hedge Construction",
            "question": "Design a tail risk hedge for a $10M equity portfolio that costs no more than 50bps per quarter. What instruments and strikes would you use?",
            "context": "VIX at 14. SPX put skew is rich at 25-delta. Seeking protection for a >10% drawdown.",
        },
    },
    {
        "id": S[13], "category": "fundamentals", "difficulty": "beginner",
        "content": {
            "title": "Call vs Put Basics",
            "question": "Explain the difference between buying a call and buying a put. When would you use each? Give an example with a stock at $100.",
            "context": "Introductory options scenario for new traders.",
        },
    },
    {
        "id": S[14], "category": "sentiment", "difficulty": "beginner",
        "content": {
            "title": "Put-Call Ratio Signal",
            "question": "The equity put-call ratio has spiked to 1.4, well above its 90-day average of 0.85. Is this bullish or bearish? How would you use this signal?",
            "context": "Market has sold off 4% in a week. Fear & Greed index at 'Extreme Fear'.",
        },
    },
    {
        "id": S[15], "category": "technical_analysis", "difficulty": "beginner",
        "content": {
            "title": "Support Level Vol Play",
            "question": "SPY is sitting on its 200-day moving average after a 7% pullback. How do you combine technical analysis with options strategy selection?",
            "context": "SPY at 480 (200 DMA). RSI oversold at 28. Volume elevated on down days.",
        },
    },
    {
        "id": S[16], "category": "vol_surface", "difficulty": "beginner",
        "content": {
            "title": "Vol Surface Anomaly",
            "question": "You notice MSFT's vol surface has a kink — the 95-strike put has 2 vol points more than the 90 or 100 strikes. What could cause this and would you trade it?",
            "context": "MSFT at $420. The 95-put corresponds to a key technical support level.",
        },
    },
    {
        "id": S[17], "category": "microstructure", "difficulty": "beginner",
        "content": {
            "title": "Bid-Ask Spread Analysis",
            "question": "You want to sell a vertical spread on a mid-cap stock. The bid-ask on each leg is $0.10 wide but the spread's combined market is $0.30 wide. How do you get executed?",
            "context": "Average daily volume is 5,000 contracts. Open interest is 20,000 at your strikes.",
        },
    },
    {
        "id": S[18], "category": "fixed_income", "difficulty": "beginner",
        "content": {
            "title": "Yield Curve Implications",
            "question": "The 2s10s yield curve just uninverted after being inverted for 18 months. What does this mean for equity markets and how does it affect your options positioning?",
            "context": "Fed expected to cut rates 3 times this year. Long end yields rising.",
        },
    },
    {
        "id": S[19], "category": "seasonality", "difficulty": "beginner",
        "content": {
            "title": "January Effect & Vol Seasonality",
            "question": "It's late December. Historically, vol tends to compress into year-end and expand in January. How would you position for this seasonal pattern?",
            "context": "VIX at 13. Tax-loss selling complete. Low volume holiday trading.",
        },
    },
]

# ───────────────────────── Responses & Grades ────────────────────

def _make_responses_and_grades(now: datetime):
    """Generate demo responses and grades for multiple users across scenarios."""
    items = []
    dim_scores_templates = [
        {"reasoning": 4.0, "terminology": 4.5, "trade_logic": 3.5, "risk_awareness": 4.0},
        {"reasoning": 3.5, "terminology": 3.0, "trade_logic": 4.0, "risk_awareness": 3.5},
        {"reasoning": 5.0, "terminology": 4.5, "trade_logic": 4.5, "risk_awareness": 5.0},
        {"reasoning": 3.0, "terminology": 3.5, "trade_logic": 3.0, "risk_awareness": 3.0},
        {"reasoning": 4.5, "terminology": 4.0, "trade_logic": 4.5, "risk_awareness": 4.0},
    ]
    feedbacks = [
        "Good analysis of the IV dynamics. Consider discussing the vol risk premium more explicitly.",
        "Solid understanding of the basics. Work on connecting Greek sensitivities to P&L impact.",
        "Excellent work! Your systematic approach to risk management is impressive.",
        "Decent attempt. Try to incorporate more quantitative reasoning into your trade rationale.",
        "Strong trade logic. Your skew analysis shows deep understanding of vol surface dynamics.",
    ]
    overall_scores = [4.0, 3.5, 4.8, 3.0, 4.3]

    # User assignments: (user_id, scenario_indices, response_indices, grade_indices)
    assignments = [
        (U1, [0, 1, 13], [0, 1, 2], [0, 1, 2]),
        (U2, [2, 3, 4, 5], [3, 4, 5, 6], [3, 4, 5, 6]),
        (U3, [6, 7, 8, 9, 10], [7, 8, 9, 10, 11], [7, 8, 9, 10, 11]),
        (U4, [11, 12], [12, 13], [12, 13]),
        (U5, [14, 15, 16, 17, 18, 19], [14, 15, 16, 17, 18, 19], [14, 15, 16, 17, 18, 19]),
    ]

    for user_id, s_idxs, r_idxs, g_idxs in assignments:
        for i, (si, ri, gi) in enumerate(zip(s_idxs, r_idxs, g_idxs)):
            template_i = i % len(dim_scores_templates)
            items.append({
                "response": {
                    "id": R[ri],
                    "user_id": user_id,
                    "scenario_id": S[si],
                    "conversation": {
                        "turns": [
                            {"role": "system", "content": DEMO_SCENARIOS[si]["content"]["question"]},
                            {"role": "user", "content": f"[Demo response for {DEMO_SCENARIOS[si]['content']['title']}]"},
                        ],
                    },
                    "is_complete": True,
                    "submitted_at": now - timedelta(hours=ri * 6),
                },
                "grade": {
                    "id": G[gi],
                    "response_id": R[ri],
                    "dimension_scores": dim_scores_templates[template_i],
                    "overall_score": overall_scores[template_i],
                    "feedback": feedbacks[template_i],
                    "confidence": 0.85,
                    "graded_by": "ai",
                    "graded_at": now - timedelta(hours=ri * 6 - 1),
                },
            })
    return items


# ───────────────────────── Activity Events ───────────────────────

def _make_activity_events(now: datetime):
    """Generate demo activity events for the feed — recent so they appear in the 7-day window."""
    events = [
        # completed_scenario events
        {"id": AE[0], "user_id": U1, "event_type": "completed_scenario",
         "payload": {"category": "iv_analysis", "score": 4.0, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=2)},
        {"id": AE[1], "user_id": U2, "event_type": "completed_scenario",
         "payload": {"category": "order_flow", "score": 3.5, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=4)},
        {"id": AE[2], "user_id": U3, "event_type": "completed_scenario",
         "payload": {"category": "risk_management", "score": 4.8, "difficulty": "intermediate"},
         "created_at": now - timedelta(hours=6)},
        {"id": AE[3], "user_id": U5, "event_type": "completed_scenario",
         "payload": {"category": "sentiment", "score": 4.3, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=8)},
        {"id": AE[4], "user_id": U4, "event_type": "completed_scenario",
         "payload": {"category": "event_vol", "score": 3.0, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=10)},
        {"id": AE[5], "user_id": U2, "event_type": "completed_scenario",
         "payload": {"category": "macro", "score": 4.0, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=14)},
        {"id": AE[6], "user_id": U3, "event_type": "completed_scenario",
         "payload": {"category": "position_sizing", "score": 4.5, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=18)},

        # completed_mcq events
        {"id": AE[7], "user_id": U1, "event_type": "completed_mcq",
         "payload": {"category": "greeks", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=3)},
        {"id": AE[8], "user_id": U4, "event_type": "completed_mcq",
         "payload": {"category": "iv_analysis", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=5)},
        {"id": AE[9], "user_id": U2, "event_type": "completed_mcq",
         "payload": {"category": "term_structure", "is_correct": False, "score": 0},
         "created_at": now - timedelta(hours=12)},
        {"id": AE[10], "user_id": U5, "event_type": "completed_mcq",
         "payload": {"category": "skew", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=16)},

        # path events
        {"id": AE[11], "user_id": U1, "event_type": "path_step_completed",
         "payload": {"path_name": "Options Basics Foundation", "step_number": 2, "step_title": "Moneyness"},
         "created_at": now - timedelta(hours=1)},
        {"id": AE[12], "user_id": U2, "event_type": "path_step_completed",
         "payload": {"path_name": "Greeks Fundamentals", "step_number": 4, "step_title": "Theta & Time Decay"},
         "created_at": now - timedelta(hours=7)},
        {"id": AE[13], "user_id": U5, "event_type": "path_completed",
         "payload": {"path_name": "Options Basics Foundation"},
         "created_at": now - timedelta(hours=20)},
        {"id": AE[14], "user_id": U3, "event_type": "path_step_completed",
         "payload": {"path_name": "Risk Management Essentials", "step_number": 5, "step_title": "Risk Frameworks"},
         "created_at": now - timedelta(hours=24)},

        # earned_badge events (not in COMPLETED_TYPES but good for full feed view)
        {"id": AE[15], "user_id": U3, "event_type": "earned_badge",
         "payload": {"name": "On Fire", "icon": "flame"},
         "created_at": now - timedelta(hours=22)},
        {"id": AE[16], "user_id": U5, "event_type": "earned_badge",
         "payload": {"name": "Desk Head", "icon": "crown"},
         "created_at": now - timedelta(hours=30)},

        # level_up events
        {"id": AE[17], "user_id": U1, "event_type": "level_up",
         "payload": {"new_level": 2, "level_title": "Analyst"},
         "created_at": now - timedelta(hours=26)},
        {"id": AE[18], "user_id": U2, "event_type": "level_up",
         "payload": {"new_level": 4, "level_title": "Risk Manager"},
         "created_at": now - timedelta(hours=48)},

        # streak milestone
        {"id": AE[19], "user_id": U3, "event_type": "streak_milestone",
         "payload": {"streak_days": 10},
         "created_at": now - timedelta(hours=36)},

        # More completed events to fill out the feed
        {"id": AE[20], "user_id": U3, "event_type": "completed_scenario",
         "payload": {"category": "trade_structuring", "score": 4.5, "difficulty": "intermediate"},
         "created_at": now - timedelta(hours=28)},
        {"id": AE[21], "user_id": U5, "event_type": "completed_scenario",
         "payload": {"category": "technical_analysis", "score": 4.0, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=32)},
        {"id": AE[22], "user_id": U1, "event_type": "completed_mcq",
         "payload": {"category": "fundamentals", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=34)},
        {"id": AE[23], "user_id": U4, "event_type": "completed_scenario",
         "payload": {"category": "tail_risk", "score": 3.5, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=38)},
        {"id": AE[24], "user_id": U2, "event_type": "completed_mcq",
         "payload": {"category": "greeks", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=40)},
        {"id": AE[25], "user_id": U5, "event_type": "completed_scenario",
         "payload": {"category": "vol_surface", "score": 4.8, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=44)},
        {"id": AE[26], "user_id": U3, "event_type": "completed_mcq",
         "payload": {"category": "macro", "is_correct": True, "score": 1},
         "created_at": now - timedelta(hours=50)},
        {"id": AE[27], "user_id": U1, "event_type": "completed_scenario",
         "payload": {"category": "greeks", "score": 3.5, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=54)},
        {"id": AE[28], "user_id": U4, "event_type": "path_step_completed",
         "payload": {"path_name": "Options Basics Foundation", "step_number": 1, "step_title": "Call vs Put Basics"},
         "created_at": now - timedelta(hours=56)},
        {"id": AE[29], "user_id": U5, "event_type": "completed_scenario",
         "payload": {"category": "microstructure", "score": 4.5, "difficulty": "beginner"},
         "created_at": now - timedelta(hours=60)},
    ]
    return events


# ───────────────────────── Bookmarks ─────────────────────────────

DEMO_BOOKMARKS = [
    {"id": BK[0], "user_id": U1, "scenario_id": S[0], "tag": "reference"},
    {"id": BK[1], "user_id": U1, "scenario_id": S[1], "tag": "retry"},
    {"id": BK[2], "user_id": U2, "scenario_id": S[3], "tag": "reference"},
    {"id": BK[3], "user_id": U2, "scenario_id": S[5], "tag": "retry"},
    {"id": BK[4], "user_id": U3, "scenario_id": S[8], "tag": "reference"},
    {"id": BK[5], "user_id": U3, "scenario_id": S[9], "tag": "reference"},
    {"id": BK[6], "user_id": U4, "scenario_id": S[11], "tag": "retry"},
    {"id": BK[7], "user_id": U5, "scenario_id": S[14], "tag": "reference"},
    {"id": BK[8], "user_id": U5, "scenario_id": S[16], "tag": "reference"},
    {"id": BK[9], "user_id": U5, "scenario_id": S[19], "tag": "retry"},
]

# ───────────────────────── Path Progress ─────────────────────────

DEMO_PATH_PROGRESS = [
    {"id": PP[0], "user_id": U1, "path_id": LP_OPTIONS_BASICS, "current_step": 2},
    {"id": PP[1], "user_id": U2, "path_id": LP_GREEKS, "current_step": 4},
    {"id": PP[2], "user_id": U3, "path_id": LP_RISK_MGMT, "current_step": 5},
    {"id": PP[3], "user_id": U4, "path_id": LP_OPTIONS_BASICS, "current_step": 1},
    # Priya completed the options basics path
    {"id": PP[4], "user_id": U5, "path_id": LP_OPTIONS_BASICS, "current_step": 8, "completed": True},
]


# ───────────────────────── Main Seed Function ────────────────────

async def seed():
    is_prod = os.environ.get("SEED_PROD", "").lower() in ("true", "1", "yes")
    users_to_seed = PROD_USERS if is_prod else TEST_USERS
    now = datetime.utcnow()

    async with async_session() as session:
        # ── 1. Users ──
        for user_data in users_to_seed:
            existing = await session.get(User, user_data["id"])
            if existing:
                # Update fields that may have changed
                for field in ("avatar_id", "bio", "cohort", "has_onboarded", "xp_total", "level", "streak_days"):
                    if field in user_data:
                        setattr(existing, field, user_data[field])
                print(f"  Updated: {user_data['display_name']}")
            else:
                user = User(
                    id=user_data["id"],
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    display_name=user_data["display_name"],
                    role=user_data["role"],
                    avatar_id=user_data.get("avatar_id", "default"),
                    bio=user_data.get("bio"),
                    ta_phase=user_data["ta_phase"],
                    xp_total=user_data["xp_total"],
                    level=user_data["level"],
                    streak_days=user_data["streak_days"],
                    cohort=user_data.get("cohort"),
                    has_onboarded=user_data.get("has_onboarded", True),
                )
                session.add(user)
                print(f"  Seeded: {user.display_name} ({user.email})")

        await session.flush()

        # ── 2. Scenarios ──
        for s_data in DEMO_SCENARIOS:
            existing = await session.get(Scenario, s_data["id"])
            if not existing:
                session.add(Scenario(**s_data))
        print(f"  Scenarios: {len(DEMO_SCENARIOS)}")

        await session.flush()

        # ── 3. Responses & Grades ──
        rg_items = _make_responses_and_grades(now)
        for item in rg_items:
            r_data = item["response"]
            if not await session.get(Response, r_data["id"]):
                session.add(Response(**r_data))
            g_data = item["grade"]
            if not await session.get(Grade, g_data["id"]):
                session.add(Grade(**g_data))
        print(f"  Responses & Grades: {len(rg_items)}")

        await session.flush()

        # ── 4. Activity Events ──
        events = _make_activity_events(now)
        for ae_data in events:
            if not await session.get(ActivityEvent, ae_data["id"]):
                session.add(ActivityEvent(**ae_data))
        print(f"  Activity Events: {len(events)}")

        # ── 5. Bookmarks ──
        for bk_data in DEMO_BOOKMARKS:
            if not await session.get(Bookmark, bk_data["id"]):
                session.add(Bookmark(**bk_data))
        print(f"  Bookmarks: {len(DEMO_BOOKMARKS)}")

        # ── 6. Badge Awards ──
        badge_slugs_to_award = {
            U1: ["first_steps"],
            U2: ["first_steps", "rising_star", "century_club", "xp_thousandaire"],
            U3: ["first_steps", "rising_star", "veteran", "century_club", "xp_thousandaire", "xp_legend", "on_fire"],
            U4: ["first_steps", "century_club"],
            U5: ["first_steps", "rising_star", "veteran", "desk_head", "century_club", "xp_thousandaire", "xp_legend", "on_fire", "perfectionist"],
        }

        badge_award_count = 0
        for user_id, slugs in badge_slugs_to_award.items():
            for slug in slugs:
                badge_row = (await session.execute(
                    select(Badge).where(Badge.slug == slug)
                )).scalar_one_or_none()
                if not badge_row:
                    continue
                # Check if already awarded
                existing_ub = (await session.execute(
                    select(UserBadge).where(
                        UserBadge.user_id == user_id,
                        UserBadge.badge_id == badge_row.id,
                    )
                )).scalar_one_or_none()
                if not existing_ub:
                    session.add(UserBadge(user_id=user_id, badge_id=badge_row.id))
                    badge_award_count += 1
        print(f"  Badge Awards: {badge_award_count}")

        # ── 7. Learning Path Progress ──
        for pp_data in DEMO_PATH_PROGRESS:
            path_exists = await session.get(LearningPath, pp_data["path_id"])
            if not path_exists:
                continue
            existing_pp = (await session.execute(
                select(UserPathProgress).where(
                    UserPathProgress.user_id == pp_data["user_id"],
                    UserPathProgress.path_id == pp_data["path_id"],
                )
            )).scalar_one_or_none()
            if not existing_pp:
                progress = UserPathProgress(
                    id=pp_data["id"],
                    user_id=pp_data["user_id"],
                    path_id=pp_data["path_id"],
                    current_step=pp_data["current_step"],
                    completed_at=now if pp_data.get("completed") else None,
                )
                session.add(progress)
        print(f"  Path Progress: {len(DEMO_PATH_PROGRESS)}")

        # ── 8. Peer Reviews ──
        demo_peer_reviews = [
            {
                "id": PR[0], "reviewer_id": U2, "response_id": R[0],
                "dimension_scores": {"reasoning": 4.0, "terminology": 3.5, "trade_logic": 4.0, "risk_awareness": 3.5},
                "feedback": "Good framework for analyzing the IV spike. Consider discussing vol mean reversion timelines.",
                "quality_score": 0.82,
            },
            {
                "id": PR[1], "reviewer_id": U3, "response_id": R[3],
                "dimension_scores": {"reasoning": 3.5, "terminology": 4.0, "trade_logic": 3.5, "risk_awareness": 4.0},
                "feedback": "Nice order flow interpretation. Be more specific about position sizing based on the unusual activity.",
                "quality_score": 0.78,
            },
            {
                "id": PR[2], "reviewer_id": U5, "response_id": R[7],
                "dimension_scores": {"reasoning": 4.5, "terminology": 4.5, "trade_logic": 5.0, "risk_awareness": 4.5},
                "feedback": "Excellent butterfly sizing methodology. The risk budgeting approach is well thought out.",
                "quality_score": 0.95,
            },
            {
                "id": PR[3], "reviewer_id": U1, "response_id": R[12],
                "dimension_scores": {"reasoning": 3.0, "terminology": 3.0, "trade_logic": 3.5, "risk_awareness": 3.0},
                "feedback": "Decent start on binary event pricing. Look into the breakeven analysis more carefully.",
                "quality_score": 0.65,
            },
            {
                "id": PR[4], "reviewer_id": U3, "response_id": R[14],
                "dimension_scores": {"reasoning": 4.0, "terminology": 4.5, "trade_logic": 4.0, "risk_awareness": 4.5},
                "feedback": "Strong sentiment analysis. Good connection between put-call ratio and contrarian positioning.",
                "quality_score": 0.88,
            },
        ]

        for pr_data in demo_peer_reviews:
            if not await session.get(PeerReview, pr_data["id"]):
                session.add(PeerReview(**pr_data))
        print(f"  Peer Reviews: {len(demo_peer_reviews)}")

        await session.commit()

    env = "production" if is_prod else "development"
    print(f"\nSeed complete ({env})")
    print(f"  Users: {len(users_to_seed)}")
    print(f"  Scenarios: {len(DEMO_SCENARIOS)}")
    print(f"  Feed Events: 30")
    print(f"  All features populated for demo!")


if __name__ == "__main__":
    asyncio.run(seed())
