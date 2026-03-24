"""Seed the database with demo data for all features. Run via: python -m app.seed"""
import asyncio
import hashlib
import os
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update

from app.database import async_session
from app.models.user import User
from app.models.organization import Organization
from app.models.scenario import Scenario
from app.models.response import Response
from app.models.grade import Grade
from app.models.activity_event import ActivityEvent
from app.models.bookmark import Bookmark
from app.models.badge import Badge, UserBadge
from app.models.learning_path import LearningPath, UserPathProgress
from app.models.peer_review import PeerReview
from app.services.auth import hash_password


def _stable_uuid(namespace: str, index: int) -> uuid.UUID:
    """Deterministic UUID from namespace + index so seed is idempotent."""
    return uuid.UUID(hashlib.md5(f"{namespace}:{index}".encode()).hexdigest())


# ───────────────────────── Stable UUIDs ──────────────────────────

# Users
U1 = uuid.UUID("00000000-0000-0000-0000-000000000001")
U2 = uuid.UUID("00000000-0000-0000-0000-000000000002")
U3 = uuid.UUID("00000000-0000-0000-0000-000000000003")
U4 = uuid.UUID("00000000-0000-0000-0000-000000000004")
U5 = uuid.UUID("00000000-0000-0000-0000-000000000005")
U6 = uuid.UUID("00000000-0000-0000-0000-000000000006")
U7 = uuid.UUID("00000000-0000-0000-0000-000000000007")
U8 = uuid.UUID("00000000-0000-0000-0000-000000000008")
U9 = uuid.UUID("00000000-0000-0000-0000-000000000009")
U10 = uuid.UUID("00000000-0000-0000-0000-00000000000a")
U11 = uuid.UUID("00000000-0000-0000-0000-00000000000b")

# Prod users
P1 = uuid.UUID("00000000-0000-0000-0000-000000000010")
P2 = uuid.UUID("00000000-0000-0000-0000-000000000011")
P3 = uuid.UUID("00000000-0000-0000-0000-000000000012")
P4 = uuid.UUID("00000000-0000-0000-0000-000000000013")
P5 = uuid.UUID("00000000-0000-0000-0000-000000000014")
P6 = uuid.UUID("00000000-0000-0000-0000-000000000015")
P7 = uuid.UUID("00000000-0000-0000-0000-000000000016")
P8 = uuid.UUID("00000000-0000-0000-0000-000000000017")
P9 = uuid.UUID("00000000-0000-0000-0000-000000000018")
P10 = uuid.UUID("00000000-0000-0000-0000-000000000019")

# Scenarios — sized for all 27 categories
S = [uuid.UUID(f"20000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 30)]

# Bookmarks
BK = [uuid.UUID(f"50000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 11)]

# Activity events
AE = [uuid.UUID(f"60000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 31)]

# Peer reviews
PR = [uuid.UUID(f"70000000-0000-0000-0000-{str(i).zfill(12)}") for i in range(1, 40)]

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
        "email": "trader@thepit.dev",
        "password": "trader123",
        "display_name": "Test Trader",
        "role": "analyst",
        "avatar_id": "chart",
        "bio": "Learning the ropes of options trading.",
        "ta_phase": 1,
        "xp_total": 50,          # Level 1 (< 60)
        "level": 1,
        "streak_days": 3,
        "cohort": "spring-2026",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U2,
        "email": "alex@thepit.dev",
        "password": "alex123",
        "display_name": "Alex Chen",
        "role": "analyst",
        "avatar_id": "lightning",
        "bio": "Volatility enthusiast. Delta-neutral or bust.",
        "ta_phase": 2,
        "xp_total": 400,         # Level 4 (380–719)
        "level": 4,
        "streak_days": 5,
        "cohort": "spring-2026",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U3,
        "email": "maria@thepit.dev",
        "password": "maria123",
        "display_name": "Maria Santos",
        "role": "analyst",
        "avatar_id": "crown",
        "bio": "Former physicist turned quant. Skew is my edge.",
        "ta_phase": 3,
        "xp_total": 2100,        # Level 7 (2050–3249)
        "level": 7,
        "streak_days": 12,
        "cohort": "spring-2026",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U4,
        "email": "james@thepit.dev",
        "password": "james123",
        "display_name": "James Kim",
        "role": "intern",
        "avatar_id": "rocket",
        "bio": "Finance major grinding levels. Catch me on the leaderboard.",
        "ta_phase": None,
        "xp_total": 200,         # Level 3 (180–379)
        "level": 3,
        "streak_days": 2,
        "cohort": "spring-2026",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U5,
        "email": "priya@thepit.dev",
        "password": "priya123",
        "display_name": "Priya Patel",
        "role": "analyst",
        "avatar_id": "brain",
        "bio": "Risk manager at heart. Building systematic frameworks.",
        "ta_phase": 4,
        "xp_total": 8000,        # Level 10 (8000+)
        "level": 10,
        "streak_days": 15,
        "cohort": "spring-2026",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U6,
        "email": "admin@peak6.com",
        "password": "peak62026",
        "display_name": "Peak6 Super Admin",
        "role": "org_admin",
        "avatar_id": "shield",
        "bio": "Cross-org demo super admin account.",
        "ta_phase": None,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
        "cohort": "peak6-admin",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": U7,
        "email": "admin@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Admin",
        "role": "org_admin",
        "avatar_id": "shield",
        "bio": None,
        "ta_phase": None,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": U8,
        "email": "analyst1@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Analyst One",
        "role": "analyst",
        "avatar_id": "chart",
        "bio": "Acme desk analyst for org-scoped demos.",
        "ta_phase": 2,
        "xp_total": 240,
        "level": 3,
        "streak_days": 4,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": U9,
        "email": "associate@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Associate",
        "role": "associate",
        "avatar_id": "crown",
        "bio": "Associate trader account for advanced demo paths.",
        "ta_phase": 3,
        "xp_total": 1200,
        "level": 6,
        "streak_days": 8,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": U10,
        "email": "trainer@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Trainer",
        "role": "trainer",
        "avatar_id": "brain",
        "bio": "Trainer account for learning oversight demos.",
        "ta_phase": 4,
        "xp_total": 2600,
        "level": 7,
        "streak_days": 11,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": U11,
        "email": "intern@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Intern",
        "role": "intern",
        "avatar_id": "rocket",
        "bio": "Intern account for first-week training demo.",
        "ta_phase": 1,
        "xp_total": 80,
        "level": 2,
        "streak_days": 1,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
]

PROD_USERS = [
    {
        "id": P1,
        "email": "demo@thepit.dev",
        "password": "demo2026",
        "display_name": "Demo Trader",
        "role": "analyst",
        "avatar_id": "chart",
        "bio": "Demo account for exploring The Pit.",
        "ta_phase": 2,
        "xp_total": 200,         # Level 3 (180–379)
        "level": 3,
        "streak_days": 3,
        "cohort": "demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P2,
        "email": "admin@peak6.com",
        "password": "peak62026",
        "display_name": "Peak6 Super Admin",
        "role": "org_admin",
        "avatar_id": "shield",
        "bio": "Cross-org admin account for invite management demos.",
        "ta_phase": None,
        "xp_total": 0,           # Level 1
        "level": 1,
        "streak_days": 0,
        "cohort": "peak6-admin",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P3,
        "email": "advanced@thepit.dev",
        "password": "advanced2026",
        "display_name": "Advanced Demo",
        "role": "analyst",
        "avatar_id": "diamond",
        "bio": "Power user showcasing all features.",
        "ta_phase": 4,
        "xp_total": 8000,        # Level 10 (8000+)
        "level": 10,
        "streak_days": 21,
        "cohort": "demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P4,
        "email": "admin@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Admin",
        "role": "org_admin",
        "avatar_id": "shield",
        "bio": None,
        "ta_phase": None,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": P5,
        "email": "trader2@thepit.dev",
        "password": "demo2026",
        "display_name": "The Pit Trader Two",
        "role": "analyst",
        "avatar_id": "lightning",
        "bio": "Additional pit desk user for org-only admin demos.",
        "ta_phase": 2,
        "xp_total": 450,
        "level": 4,
        "streak_days": 6,
        "cohort": "demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P6,
        "email": "associate@thepit.dev",
        "password": "demo2026",
        "display_name": "The Pit Associate",
        "role": "associate",
        "avatar_id": "crown",
        "bio": "Associate-level account for progression demos.",
        "ta_phase": 3,
        "xp_total": 1600,
        "level": 6,
        "streak_days": 10,
        "cohort": "demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P7,
        "email": "intern@thepit.dev",
        "password": "demo2026",
        "display_name": "The Pit Intern",
        "role": "intern",
        "avatar_id": "rocket",
        "bio": "Intern account for onboarding demos.",
        "ta_phase": 1,
        "xp_total": 90,
        "level": 2,
        "streak_days": 2,
        "cohort": "demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000099",
    },
    {
        "id": P8,
        "email": "analyst1@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Analyst One",
        "role": "analyst",
        "avatar_id": "chart",
        "bio": "Acme desk analyst for org demo coverage.",
        "ta_phase": 2,
        "xp_total": 250,
        "level": 3,
        "streak_days": 5,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": P9,
        "email": "associate@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Associate",
        "role": "associate",
        "avatar_id": "diamond",
        "bio": "Associate account for strategy demos.",
        "ta_phase": 3,
        "xp_total": 1400,
        "level": 6,
        "streak_days": 9,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
    {
        "id": P10,
        "email": "trainer@acme.dev",
        "password": "acme2026",
        "display_name": "Acme Trainer",
        "role": "trainer",
        "avatar_id": "brain",
        "bio": "Trainer account for coaching demos.",
        "ta_phase": 4,
        "xp_total": 2600,
        "level": 7,
        "streak_days": 12,
        "cohort": "acme-demo",
        "has_onboarded": True,
        "org_id": "00000000-0000-0000-0000-000000000100",
    },
]


# ───────────────────────── Scenarios ─────────────────────────────

DEMO_SCENARIOS = [
    # ── Foundation (Level 1) ──
    {"id": S[0], "category": "iv_analysis", "difficulty": "beginner",
     "content": {"title": "SPY IV Spike Analysis",
                 "question": "SPY 30-day IV has jumped from 18 to 28 over two sessions while the index dropped 3%. Is this IV level justified or overshooting? What trades would you consider?",
                 "context": "S&P 500 ETF options chain showing elevated put skew and term structure in backwardation."}},
    {"id": S[1], "category": "realized_vol", "difficulty": "beginner",
     "content": {"title": "Realized vs Implied Divergence",
                 "question": "AMZN 30-day realized vol is 22% but 30-day IV is 35%. Is this a systematic selling opportunity? What could go wrong?",
                 "context": "AMZN has earnings in 3 weeks. Historical vol tends to pick up 2 weeks before earnings."}},
    {"id": S[2], "category": "fundamentals", "difficulty": "beginner",
     "content": {"title": "Call vs Put Basics",
                 "question": "Explain the difference between buying a call and buying a put. When would you use each? Give an example with a stock at $100.",
                 "context": "Introductory options scenario for new traders."}},
    # ── Core (Level 2–3) ──
    {"id": S[3], "category": "greeks", "difficulty": "beginner",
     "content": {"title": "Delta Hedging a Long Straddle",
                 "question": "You're long a 30-delta straddle on AAPL with 14 DTE. The stock rallies 2%. Walk through your delta-hedging decision.",
                 "context": "AAPL at $185, straddle struck at $185, current delta +0.15 after the move."}},
    {"id": S[4], "category": "order_flow", "difficulty": "beginner",
     "content": {"title": "Unusual Options Activity",
                 "question": "You notice 10x average volume in NVDA weekly 140 calls with mostly buying on the ask. How do you interpret this flow and would you follow it?",
                 "context": "NVDA trading at $135, earnings in 8 days. IV rank at 75th percentile."}},
    {"id": S[5], "category": "technical_analysis", "difficulty": "beginner",
     "content": {"title": "Support Level Vol Play",
                 "question": "SPY is sitting on its 200-day moving average after a 7% pullback. How do you combine technical analysis with options strategy selection?",
                 "context": "SPY at 480 (200 DMA). RSI oversold at 28. Volume elevated on down days."}},
    {"id": S[6], "category": "sentiment", "difficulty": "beginner",
     "content": {"title": "Put-Call Ratio Signal",
                 "question": "The equity put-call ratio has spiked to 1.4, well above its 90-day average of 0.85. Is this bullish or bearish? How would you use this signal?",
                 "context": "Market has sold off 4% in a week. Fear & Greed index at 'Extreme Fear'."}},
    {"id": S[7], "category": "macro", "difficulty": "beginner",
     "content": {"title": "FOMC Volatility Setup",
                 "question": "FOMC announces rates unchanged but signals hawkish forward guidance. VIX drops from 22 to 19. Explain this reaction and identify trading opportunities.",
                 "context": "Market was pricing 70% chance of a hold. Treasury yields jumped 8bps on the long end."}},
    # ── Specialization (Level 4–5) ──
    {"id": S[8], "category": "skew", "difficulty": "beginner",
     "content": {"title": "Put Skew Flattening Trade",
                 "question": "QQQ 25-delta put skew has flattened from 8 vol points to 3 over a month while the index rallied 5%. Is this normal? How would you position?",
                 "context": "Historically QQQ skew averages 5-7 vol points in low-vol environments."}},
    {"id": S[9], "category": "term_structure", "difficulty": "beginner",
     "content": {"title": "Vol Term Structure Inversion",
                 "question": "TSLA's vol term structure is deeply inverted — 1-week IV at 65%, 1-month at 48%, 3-month at 42%. What is the market telling you?",
                 "context": "TSLA earnings in 4 days. Stock has moved 8%+ on the last 3 earnings."}},
    {"id": S[10], "category": "event_vol", "difficulty": "beginner",
     "content": {"title": "Binary Event Pricing",
                 "question": "A biotech has FDA approval decision tomorrow. Options are pricing a 40% move. How would you trade this binary event?",
                 "context": "Historical FDA events show 60% approval rate for this drug type. Similar biotechs moved 30-50%."}},
    {"id": S[11], "category": "tail_risk", "difficulty": "beginner",
     "content": {"title": "Tail Hedge Construction",
                 "question": "Design a tail risk hedge for a $10M equity portfolio that costs no more than 50bps per quarter.",
                 "context": "VIX at 14. SPX put skew is rich at 25-delta. Seeking protection for a >10% drawdown."}},
    {"id": S[12], "category": "correlation", "difficulty": "beginner",
     "content": {"title": "Cross-Asset Correlation Breakdown",
                 "question": "Stock-bond correlation just flipped positive after being negative for 2 years. What are the implications for a multi-asset options portfolio?",
                 "context": "Fed signaling higher-for-longer. Both equities and bonds selling off."}},
    {"id": S[13], "category": "microstructure", "difficulty": "beginner",
     "content": {"title": "Bid-Ask Spread Analysis",
                 "question": "You want to sell a vertical spread on a mid-cap stock. The bid-ask on each leg is $0.10 wide but the spread's combined market is $0.30 wide. How do you get executed?",
                 "context": "Average daily volume is 5,000 contracts. Open interest is 20,000 at your strikes."}},
    {"id": S[14], "category": "fixed_income", "difficulty": "beginner",
     "content": {"title": "Yield Curve Implications",
                 "question": "The 2s10s yield curve just uninverted after being inverted for 18 months. What does this mean for equity markets?",
                 "context": "Fed expected to cut rates 3 times this year. Long end yields rising."}},
    {"id": S[15], "category": "seasonality", "difficulty": "beginner",
     "content": {"title": "January Effect & Vol Seasonality",
                 "question": "It's late December. Historically, vol compresses into year-end and expands in January. How would you position?",
                 "context": "VIX at 13. Tax-loss selling complete. Low volume holiday trading."}},
    {"id": S[16], "category": "commodities", "difficulty": "beginner",
     "content": {"title": "Oil Vol Regime Change",
                 "question": "Crude oil IV has doubled in a week after OPEC surprise cuts. How do you evaluate commodity vol regimes vs equity vol?",
                 "context": "WTI at $85. Backwardation steepening. Gasoline crack spreads widening."}},
    {"id": S[17], "category": "geopolitical", "difficulty": "beginner",
     "content": {"title": "Geopolitical Risk Premium",
                 "question": "A major shipping lane disruption sends defense stocks up 8% and travel stocks down 5%. How do you price geopolitical risk in options?",
                 "context": "VIX jumped 4 points. Safe-haven flows into treasuries and gold."}},
    # ── Advanced (Level 6) ──
    {"id": S[18], "category": "vol_surface", "difficulty": "beginner",
     "content": {"title": "Vol Surface Anomaly",
                 "question": "MSFT's vol surface has a kink — the 95-strike put has 2 vol points more than the 90 or 100 strikes. What could cause this?",
                 "context": "MSFT at $420. The 95-put corresponds to a key technical support level."}},
    {"id": S[19], "category": "position_sizing", "difficulty": "beginner",
     "content": {"title": "Sizing a Butterfly Spread",
                 "question": "You want to put on an iron butterfly on SPX with max risk of 2% of your $500K portfolio. Walk through your sizing process.",
                 "context": "SPX at 5200, targeting the 5200 butterfly. Wings 50 points wide."}},
    {"id": S[20], "category": "trade_structuring", "difficulty": "beginner",
     "content": {"title": "Earnings Straddle vs Strangle",
                 "question": "META earnings tomorrow. IV at 55%, expected move $18. Compare a straddle vs 25-delta strangle. Which do you prefer?",
                 "context": "META at $520. Last 4 earnings moves: +12%, -4%, +7%, -9%."}},
    {"id": S[21], "category": "risk_management", "difficulty": "beginner",
     "content": {"title": "Portfolio Stress Test",
                 "question": "Your portfolio is long gamma on tech names, short vega on financials. A banking crisis headline hits. Walk through your risk management steps.",
                 "context": "Correlation spike to 0.85 across sectors. VIX jumps 6 points."}},
    {"id": S[22], "category": "alt_data", "difficulty": "beginner",
     "content": {"title": "Satellite Data for Earnings",
                 "question": "Satellite imagery shows Target store parking lots 30% fuller than last year pre-earnings. How do you incorporate this into an options trade?",
                 "context": "TGT earnings in 3 days. IV at 40%. Consensus expects flat same-store sales."}},
    {"id": S[23], "category": "crypto", "difficulty": "beginner",
     "content": {"title": "BTC Vol Around Halving",
                 "question": "Bitcoin halving is 2 weeks away. BTC options IV term structure is steeply inverted. How do you trade the event?",
                 "context": "BTC at $65K. 1-week IV 80%, 1-month IV 55%. Deribit OI concentrated at $70K strike."}},
    # ── Expert (Level 7) ──
    {"id": S[24], "category": "exotic_structures", "difficulty": "beginner",
     "content": {"title": "Barrier Option Pricing",
                 "question": "A client wants a knock-in put on SPX that activates if the index drops below 4800. How do you price and hedge this vs a vanilla put?",
                 "context": "SPX at 5200. Client wants downside protection but at a lower premium than vanilla."}},
    {"id": S[25], "category": "portfolio_mgmt", "difficulty": "beginner",
     "content": {"title": "Multi-Strategy Portfolio Allocation",
                 "question": "You manage a $50M options portfolio with vol arb, dispersion, and tail hedge strategies. How do you allocate risk budget across them?",
                 "context": "VIX at 16. Correlation at 0.35. Realized < implied by 3 vol points across the board."}},
    {"id": S[26], "category": "pit_tooling", "difficulty": "beginner",
     "content": {"title": "The Pit Risk Dashboard Design",
                 "question": "Design the key metrics and alerts for a real-time options portfolio risk dashboard. What should a PM see at a glance?",
                 "context": "Building internal tooling for a multi-PM options desk."}},
]

# ───────────────────────── Responses & Grades ────────────────────

# Build a lookup from category → scenario index
_CAT_TO_SCENARIO = {}
for _i, _s in enumerate(DEMO_SCENARIOS):
    _CAT_TO_SCENARIO[_s["category"]] = _i

# Categories each user has mastered (determines which nodes they can unlock).
# Must align with CATEGORY_PREREQUISITES chains and user levels.
_USER_MASTERY: dict[uuid.UUID, list[str]] = {
    # Level 1 — no mastery needed, only foundation categories visible
    U1: ["iv_analysis", "realized_vol", "fundamentals"],
    # Level 4 — mastered foundation + some core
    U2: ["iv_analysis", "realized_vol", "fundamentals",
         "greeks", "order_flow", "technical_analysis", "sentiment", "macro"],
    # Level 7 — deep mastery through specialization and advanced
    U3: ["iv_analysis", "realized_vol", "fundamentals",
         "greeks", "order_flow", "technical_analysis", "sentiment", "macro",
         "skew", "term_structure", "event_vol", "tail_risk", "correlation",
         "microstructure", "fixed_income", "seasonality", "commodities", "geopolitical",
         "vol_surface", "position_sizing", "trade_structuring", "risk_management"],
    # Level 3 — foundation mastered
    U4: ["iv_analysis", "realized_vol", "fundamentals"],
    # Level 10 — everything mastered
    U5: ["iv_analysis", "realized_vol", "fundamentals",
         "greeks", "order_flow", "technical_analysis", "sentiment", "macro",
         "skew", "term_structure", "event_vol", "tail_risk", "correlation",
         "microstructure", "fixed_income", "seasonality", "commodities", "geopolitical",
         "vol_surface", "position_sizing", "trade_structuring", "risk_management",
         "alt_data", "crypto",
         "exotic_structures", "portfolio_mgmt", "pit_tooling"],
    # Production advanced demo user should mirror full mastery at level 10
    P3: ["iv_analysis", "realized_vol", "fundamentals",
         "greeks", "order_flow", "technical_analysis", "sentiment", "macro",
         "skew", "term_structure", "event_vol", "tail_risk", "correlation",
         "microstructure", "fixed_income", "seasonality", "commodities", "geopolitical",
         "vol_surface", "position_sizing", "trade_structuring", "risk_management",
         "alt_data", "crypto",
         "exotic_structures", "portfolio_mgmt", "pit_tooling"],
}

FEEDBACKS = [
    "Good analysis of the IV dynamics. Consider discussing the vol risk premium more explicitly.",
    "Solid understanding of the basics. Work on connecting Greek sensitivities to P&L impact.",
    "Excellent work! Your systematic approach to risk management is impressive.",
    "Decent attempt. Try to incorporate more quantitative reasoning into your trade rationale.",
    "Strong trade logic. Your skew analysis shows deep understanding of vol surface dynamics.",
]

# ── Realistic trainee answers per category ──────────────────────
# Each category has 3 tiers: weak (score ~3), solid (score ~3.5-4), strong (score ~4.5)
# The conversation also includes an AI probe and follow-up for depth.

_TRAINEE_ANSWERS: dict[str, list[dict]] = {
    "iv_analysis": [
        {"answer": "The IV jump from 18 to 28 is significant — that's over a 50% increase. Given the 3% SPX drop, some vol expansion is expected, but this seems like an overshoot. Historically, SPY IV at 28 is in the 85th percentile. I'd look to sell strangles or put spreads to capture the elevated premium.",
         "probe": "You mention the 85th percentile — but how does the current realized vol compare? And does backwardation in the term structure change your view?",
         "followup": "Good point. Realized vol over the past 10 days is probably around 20-22%, so there's a meaningful gap. Backwardation suggests the market expects near-term turbulence to resolve. That supports selling front-month premium, maybe a put ratio spread to stay net short vega but with downside protection."},
        {"answer": "IV jumping from 18 to 28 is a big move. The 3% index drop triggered fear in the market. I think the IV is a bit high because the market tends to overreact. I'd consider selling puts since IV should come back down eventually.",
         "probe": "What's your framework for deciding whether IV is 'too high' vs. justified? Saying 'the market overreacts' isn't a tradeable thesis.",
         "followup": "Fair criticism. I should compare to the vol risk premium — the spread between implied and subsequent realized vol. If IV is 28 but realized ends up being 22, that 6-point premium is sellable. I'd also check the VIX term structure to see if the inversion confirms short-term panic."},
        {"answer": "The IV spike to 28 looks justified given elevated put skew and backwardation. The 3% drop compresses the vol surface from the left, pushing ATM IV higher. I'd compare the current vol risk premium to its 6-month average — if we're 1.5+ standard deviations above, I'd sell 25-delta strangles with 30-45 DTE to ride mean reversion while keeping defined risk via wing protection.",
         "probe": "Strong framework. What's your stop-loss if IV continues to expand — say to 35?",
         "followup": "I'd set a hard stop at 2x the initial credit received. Additionally, if realized vol starts exceeding 25%, the short vol thesis weakens and I'd cut. I'd also monitor the put skew differential — if 25-delta put vol exceeds 35, the tail risk pricing suggests I should exit."},
    ],
    "realized_vol": [
        {"answer": "With AMZN realized vol at 22% and IV at 35%, there's a 13-point spread. That looks like a selling opportunity since IV is overpricing future moves. I'd sell straddles or strangles to capture the premium.",
         "probe": "You're ignoring a crucial detail in the scenario. What event is coming up, and how does it affect the realized vol calculation?",
         "followup": "Right, earnings in 3 weeks. Historical vol picks up before earnings, so the realized vol will likely increase from 22%. The IV at 35% might actually be fairly priced if realized jumps to 30%+ around the event. I should wait until the earnings setup crystallizes before deciding to sell vol."},
        {"answer": "The 13-point gap between realized and implied is notable but context matters. AMZN has earnings in 3 weeks and vol historically picks up 2 weeks prior. Current 22% realized is probably the low point. I'd estimate pre-earnings realized could reach 28-32%. So the real gap is more like 3-7 points, which is closer to fair value for a mega-cap ahead of a binary event.",
         "probe": "How would you structure a trade that profits if your thesis is correct?",
         "followup": "If I think IV is only slightly overpriced, a pure vol sell is too risky. Instead, I'd use a calendar spread — sell the weekly that captures earnings and buy the monthly. This lets me profit from the term structure normalization post-earnings while having long vega protection if the stock moves more than expected."},
        {"answer": "The gap is wide but misleading. I'd compare to the pre-earnings implied-to-realized premium historically for AMZN. If the typical premium is 10 points pre-earnings and we're at 13, there's only 3 points of 'excess' to harvest. Not enough edge for a naked short vol trade given the asymmetric risk around earnings.",
         "probe": "So what would you actually trade here?",
         "followup": "I'd sell a 1-week out put spread below the expected move range, collecting elevated premium while capping downside. Then closer to earnings, I'd evaluate a straddle sell vs. a butterfly centered on the ATM strike for the earnings week itself."},
    ],
    "fundamentals": [
        {"answer": "A call gives you the right to buy stock at the strike price, and a put gives you the right to sell. With a stock at $100, if I buy a $105 call for $3, I profit if the stock goes above $108 (strike + premium). If I buy a $95 put for $2, I profit if it drops below $93.",
         "probe": "Good start. Can you explain the risk/reward profile of each? What's the maximum loss and maximum gain?",
         "followup": "For the call: max loss is the $3 premium, max gain is theoretically unlimited since the stock can keep rising. For the put: max loss is the $2 premium, max gain is $93 (if stock goes to zero, I can sell at $95 minus the $2 cost). Calls are used for bullish bets, puts for bearish bets or portfolio protection."},
        {"answer": "Buying a call means you want the stock to go up. Buying a put means you want it to go down. For a $100 stock, you'd buy a call if you think it goes higher and buy a put if you think it drops.",
         "probe": "That's the directional view, but can you explain what happens at expiration with specific strikes and premiums?",
         "followup": "Okay, if I buy a $100 call for $5, at expiration I need the stock above $105 to profit. At $110 I'd make $5 ($110 - $100 - $5 premium). For a $100 put at $4, I need the stock below $96. At $90, I'd make $6 ($100 - $90 - $4 premium). Below the breakeven you profit, above the breakeven you lose the premium."},
        {"answer": "Calls and puts are the building blocks of all options strategies. A call at the $100 strike with $3 premium has a breakeven at $103, convex upside, and a defined max loss of $3. A put at $100 with $4 premium breaks even at $96 with profit accelerating to the downside. The key insight is asymmetric payoffs — you risk the premium for leveraged exposure. I'd buy calls when I'm bullish with a defined catalyst (earnings, product launch) and puts for hedging or when technical support breaks.",
         "probe": "You mentioned convexity. How does that differ from just being long stock?",
         "followup": "The convexity of options means your delta increases as the trade moves in your favor. Long stock is always delta 1.0 — linear. A call starts at, say, delta 0.50 and increases toward 1.0 as it goes ITM. This means options give you accelerating gains relative to your capital at risk. That's the core advantage: non-linear payoffs."},
    ],
    "greeks": [
        {"answer": "With the straddle now at +0.15 delta after a 2% rally, I need to decide whether to hedge. Since it's a long straddle, I want to capture gamma by delta hedging. I'd sell shares to neutralize the delta. With 14 DTE, gamma is significant so I should hedge frequently.",
         "probe": "How do you decide on hedge frequency? What's the tradeoff between hedging often vs. less frequently?",
         "followup": "More frequent hedging captures more gamma P&L but incurs more transaction costs and slippage. Less frequent hedging means larger moves between rebalances, which can be profitable in trendy markets but costly in choppy ones. The textbook answer is to hedge at intervals proportional to 1/gamma, but practically I'd hedge when delta exceeds ±0.20 from neutral."},
        {"answer": "After the 2% rally, the straddle delta is +0.15. I would sell approximately 15 shares of AAPL per straddle to get back to delta-neutral. I should consider theta decay since 14 DTE means I'm losing about $X per day, so the gamma P&L from hedging needs to exceed theta costs.",
         "probe": "You mentioned theta vs. gamma tradeoff. Can you quantify when gamma scalping is profitable?",
         "followup": "Gamma scalping profits when realized vol exceeds implied vol. If I paid 30% IV for the straddle but the stock realizes 35% vol, the cumulative gamma hedging profits should exceed the theta burn. The breakeven is roughly when daily realized moves exceed the implied daily move (IV / sqrt(252)). At 30% IV, that's about 1.9% daily. AAPL moved 2%, so today's hedge was profitable."},
        {"answer": "Delta is +0.15 post-rally. With 14 DTE on AAPL at $185, each straddle controls 100 shares, so I'm effectively long 15 deltas. I'd sell 15 shares to rebalance. Key considerations: (1) gamma is elevated at 14 DTE so I'll need to rehedge frequently, (2) the 2% move generated gamma P&L that partially offsets my theta, (3) I should monitor vega — if IV drops post-move, the straddle loses value from vol compression even if gamma scalping is positive.",
         "probe": "Excellent. What about second-order effects — how does vanna impact your hedge here?",
         "followup": "Vanna — the sensitivity of delta to changes in vol — matters here because the rally likely compressed IV (vol tends to drop on rallies). Lower IV means my call delta is slightly higher and put delta slightly lower than a pure delta model suggests. This creates a small positive delta bias beyond the +0.15, meaning I might need to sell a few more shares than the simple delta calculation implies. Most traders ignore vanna for standard hedging, but it matters for precision at larger sizes."},
    ],
    "order_flow": [
        {"answer": "10x average volume in NVDA weekly 140 calls with buying on the ask is strongly bullish flow. Someone is aggressively accumulating upside exposure ahead of earnings. With the stock at $135, these calls are 3.7% OTM. I'd follow the flow and buy some calls too.",
         "probe": "Before blindly following, what else do you need to check? Could this flow be something other than a directional bet?",
         "followup": "Good point — I should check if it's opening or closing interest, whether there's corresponding stock or put activity (could be a hedge), and if it's one large trade or many small ones. It could be a covered call roll, a hedge for a short stock position, or a volatility trade. I'd look at the options time & sales to see the actual transaction details and check put activity on the same chain."},
        {"answer": "The 10x volume on the ask signals aggressive buying. At 75th percentile IV rank, premium is already elevated, so this buyer is paying up for upside. With earnings in 8 days, this could be an informed trade. However, I'd want to verify: is this opening interest? If OI increases the next day, it confirms new positioning. I'd consider a bull call spread (buy 140, sell 145) to reduce my premium outlay given rich IV.",
         "probe": "Smart to use a spread. How does the IV rank affect your structure choice?",
         "followup": "At the 75th percentile IV rank, I'm paying above-average premium. Buying naked calls is expensive and requires a larger move to break even. A spread sells some of that rich premium back, reducing my net vega exposure. I'm essentially expressing a directional view while being net short vol — profitable if NVDA rallies to $140-145 but IV crushes post-earnings."},
    ],
    "technical_analysis": [
        {"answer": "SPY at its 200 DMA after a 7% pullback with RSI at 28 is a classic oversold bounce setup. Historically the 200 DMA acts as strong support. I'd buy calls anticipating a bounce, probably 2-3 weeks out at the $480-485 strikes.",
         "probe": "How do you combine the technical setup with options-specific considerations like IV levels?",
         "followup": "After a 7% pullback, IV is likely elevated, so buying calls outright means paying expensive premium. I'd use a bull put spread instead — sell the $475 put and buy the $470 put. This way I collect premium (benefiting from high IV), and I'm positioned for the bounce thesis. If SPY holds the 200 DMA, IV will drop and the spread decays in my favor."},
    ],
    "sentiment": [
        {"answer": "A put-call ratio at 1.4 vs the 0.85 average, combined with Extreme Fear on the sentiment index, is a contrarian bullish signal. Excessive put buying often marks short-term bottoms as retail hedges into the panic. Historically, readings above 1.2 on the equity PCR have preceded 2-4 week rallies about 70% of the time.",
         "probe": "When does the contrarian signal fail? What would invalidate this thesis?",
         "followup": "The contrarian signal fails in genuine bear markets where fundamentals deteriorate — 2008 and early 2020 saw elevated PCR for months as the market kept falling. I'd look for credit spreads widening, earnings estimate revisions turning negative, or the VIX term structure remaining inverted for more than 2 weeks as invalidation signals. The key is distinguishing panic (buyable) from legitimate risk repricing (not buyable)."},
    ],
    "macro": [
        {"answer": "Rates unchanged but hawkish forward guidance — VIX dropping from 22 to 19 makes sense because the uncertainty is removed. Even though the guidance was hawkish, the market was pricing 70% chance of a hold, so the decision itself wasn't a surprise. The VIX drop is driven by event resolution, not the content of the decision.",
         "probe": "But treasury yields jumped 8bps on the long end. How does that create opportunities?",
         "followup": "The yield curve steepening (long end up) while VIX drops creates a divergence. Rate-sensitive sectors like utilities and REITs should underperform, while banks might benefit from the steeper curve. I'd look at buying puts on TLT (betting long-end rates continue higher) and selling vol on SPY (capturing the VIX crush). The TLT put skew should be relatively cheap since rates moving higher is the consensus direction."},
    ],
    "skew": [
        {"answer": "QQQ put skew flattening from 8 to 3 vol points during a rally is expected — as the index rises, demand for downside protection decreases. But 3 points is historically cheap. Historically skew averages 5-7 in low-vol environments. This creates an opportunity to buy skew cheaply through put spreads or risk reversals.",
         "probe": "How would you implement a 'long skew' position practically?",
         "followup": "I'd buy a 25-delta put and sell a 25-delta call — a risk reversal. This is long skew because I benefit if skew steepens back toward its mean. If QQQ pulls back, put skew will expand and my put gains more than the call. I'd size it to be roughly delta-neutral initially. Alternatively, a put ratio backspread (sell 1 ATM put, buy 2 OTM puts) gives direct exposure to skew expansion on a selloff."},
    ],
    "term_structure": [
        {"answer": "TSLA's deeply inverted term structure (1W at 65%, 1M at 48%, 3M at 42%) tells me the market is pricing a massive near-term event — earnings in 4 days. The historical 8%+ moves justify elevated front-end vol. The key question is whether 65% IV adequately prices the binary risk or if it's over/underpriced relative to the expected move.",
         "probe": "How would you extract the implied move from the straddle price?",
         "followup": "The ATM straddle price divided by the stock price gives the implied move. If the weekly straddle costs $30 with TSLA at $250, the implied move is 12%. Compare to the 8%+ historical average — the market is pricing a wider move than history suggests. If I think 8-10% is more likely, I'd sell the straddle or an iron butterfly to capture the overpriced premium. But TSLA earnings are notoriously unpredictable, so I'd keep the position small."},
    ],
    "event_vol": [
        {"answer": "A biotech with 40% implied move on an FDA decision is pricing massive binary risk. With a 60% approval rate, I'd think about the expected value. On approval, the stock probably rallies 30-50%. On rejection, it drops 40-60%. I'd use a risk reversal — buy OTM calls and sell OTM puts — to get long exposure with reduced premium if I have an edge on the approval probability.",
         "probe": "What if you don't have an edge on the outcome? How do you trade the vol itself?",
         "followup": "Without a directional edge, I'd trade the volatility. If the 40% implied move is higher than the likely actual move, I'd sell a straddle or iron butterfly. If it's lower, I'd buy the straddle. Given similar biotechs moved 30-50%, the 40% implied seems fairly priced. In that case, I might skip the binary entirely or do a delta-neutral butterfly to profit from the actual move landing in a specific range."},
    ],
    "tail_risk": [
        {"answer": "For a $10M portfolio spending 50bps/quarter ($12,500), I'd buy SPX put spreads. Specifically, buy the 90% strike put and sell the 80% strike put — this covers a 10-20% drawdown. With VIX at 14, puts are relatively cheap. I'd roll quarterly and use the rich 25-delta skew by selling further OTM puts to finance the hedge.",
         "probe": "The 25-delta skew is rich — how does that affect your structure choice?",
         "followup": "Rich skew at 25-delta means I'm paying a premium for those puts. To stay within budget, I'd use a put spread ratio: buy 1 at the 90% strike and sell 2 at the 80% strike. This is cheaper because I'm selling into the rich skew. The risk is that in a crash beyond 20%, the ratio works against me, but for a >10% drawdown hedge this is efficient. Alternatively, I'd look at VIX call spreads as a cheaper proxy for tail protection."},
    ],
    "correlation": [
        {"answer": "Stock-bond correlation flipping positive means diversification breaks down — both assets fall together. For a multi-asset options portfolio, this means: (1) portfolio vol increases because the hedging benefit of bonds disappears, (2) I need to resize positions for higher portfolio-level risk, and (3) traditional risk parity allocations need adjustment.",
         "probe": "How do you hedge a portfolio when your primary hedge (bonds) is also losing value?",
         "followup": "I'd look at alternatives: long VIX calls (convex protection that doesn't depend on stock-bond correlation), gold exposure (historically a positive-correlation regime diversifier), and cash. For the options book specifically, I'd reduce net vega exposure since correlated selloffs tend to spike vol broadly, and I'd move toward more defined-risk structures like spreads rather than naked positions."},
    ],
    "microstructure": [
        {"answer": "The $0.30 combined spread on a vertical (when individual legs are $0.10 wide) suggests legging risk and wide markets. I'd place a limit order at the mid-price of the spread and be patient. If no fill after 10 minutes, I'd improve my price by $0.02 increments. Working the order as a single spread rather than legging into individual options avoids execution risk.",
         "probe": "What about other execution tactics for mid-cap options with moderate liquidity?",
         "followup": "I could try working the order slightly above mid toward the natural price. I'd also check if there's more liquidity at a nearby strike — sometimes shifting one strike can dramatically improve execution. Timing matters too: spreads often fill better during the first hour of trading when market makers are most active. I could also call the floor broker for a price improvement if the size is meaningful enough."},
    ],
    "fixed_income": [
        {"answer": "The 2s10s curve uninverting after 18 months is historically a recession warning signal — the inversion predicts recession, and uninversion often occurs as the recession begins. However, the context matters: if the Fed is cutting rates, the front end drops, steepening the curve. For equities, this is typically a risk-off signal initially, but markets often rally once rate cuts begin.",
         "probe": "How do you translate this macro view into specific options trades?",
         "followup": "I'd position for increased equity vol with long straddles on SPY or QQQ, expecting larger moves regardless of direction during the regime transition. For sector rotation, I'd buy calls on defensive sectors (utilities, staples) and puts on cyclicals (industrials, discretionary). I'd also look at TLT calls since rate cuts should push long-term bond prices up, though the rising long-end yields complicate this."},
    ],
    "seasonality": [
        {"answer": "Year-end vol compression with VIX at 13 and upcoming January expansion is a classic seasonal pattern. I'd buy January VIX calls or calendar spreads — sell December, buy January — to capture the vol expansion cheaply. The low volume holiday period makes this a low-risk entry.",
         "probe": "How reliable is the January effect for options positioning? What could disrupt it?",
         "followup": "It works about 65-70% of years. Disruptions include: a geopolitical event during the holiday break, a major macro surprise (China devaluation in Jan 2016), or a continuation of year-end tax-loss selling into January. I'd keep the position sized at 1-2% of portfolio max loss and set a clear stop if VIX drops below 11 — that would signal something unusual in the vol regime."},
    ],
    "commodities": [
        {"answer": "Oil IV doubling after OPEC surprise cuts is a regime change signal. Commodity vol behaves differently from equity vol — it tends to be more persistent (vol clustering) and responds more to supply shocks than demand shocks. The backwardation steepening suggests physical tightness. I'd be cautious selling vol here because commodity vol regimes can last months.",
         "probe": "How do you evaluate whether the new vol regime is properly priced or overshooting?",
         "followup": "I'd compare to historical OPEC-driven vol events. In 2014 and 2020, oil vol stayed elevated for 3-6 months post-shock. If current IV is pricing a 2-week event and the fundamentals suggest a longer regime, vol is underpriced. I'd look at the oil term structure — if the front month is in deep backwardation but 6-month IV hasn't moved much, there's a calendar spread opportunity buying longer-dated vol."},
    ],
    "geopolitical": [
        {"answer": "Geopolitical risk is hard to price because it's discontinuous — events escalate or de-escalate unpredictably. The VIX jump of 4 points and safe-haven flows suggest the market is pricing a meaningful risk premium. I'd look at defense sector calls (elevated earnings expectations) and airline/travel puts (cost headwinds). The key is position sizing — keep it small because geopolitical risks can reverse quickly on diplomatic developments.",
         "probe": "How long does geopolitical risk premium typically persist in options markets?",
         "followup": "Research shows geopolitical events have a half-life of about 1-2 weeks in options markets unless the situation escalates materially. The initial VIX spike tends to revert within 5-10 trading days. So if I'm selling premium on the geopolitical fear, I'd use short-dated structures (1-2 week expirations) to capture the fastest decay. But I'd maintain a small tail hedge in case escalation is real — maybe a VIX call spread as insurance."},
    ],
    "vol_surface": [
        {"answer": "The 2 vol point kink at the 95 strike on MSFT is likely caused by concentrated open interest or hedging flows at a key technical level. Market makers are short a lot of gamma at that strike, driving up the local vol. The fact that it corresponds to a support level reinforces this — dealers are hedging customer protective puts that cluster at round numbers and technical levels.",
         "probe": "How would you trade this anomaly? Is it an opportunity or noise?",
         "followup": "If the kink is persistent (lasts more than a few days), it suggests structural demand at that strike. I'd look to sell the 95-put and buy the 90 and 100 puts — a butterfly centered at 95 — to capture the local vol richness. The risk is that the support level breaks and the kink becomes justified. I'd monitor the open interest changes at 95 strike daily to see if the positioning shifts."},
    ],
    "position_sizing": [
        {"answer": "With a $500K portfolio and 2% max risk ($10,000), I need to size the butterfly. An iron butterfly on SPX at 5200 with 50-point wings has a max loss equal to the wing width minus the credit received. If I collect $35 in credit, my max loss is $50 - $35 = $15 per spread. So I can do $10,000 / ($15 × 100) = 6.67, rounded down to 6 contracts.",
         "probe": "That's the mechanical sizing. But what about risk-adjusted sizing? Should you use the full 2% here?",
         "followup": "No, the 2% is my hard limit, not my target. For a butterfly, the probability of max loss is relatively low (only if SPX moves beyond the wings), but the probability of losing some portion is moderate. I'd apply a Kelly-adjusted sizing: if my edge is 15% and the win rate is 65%, Kelly suggests about 0.3x the max size. So I'd do 2 contracts instead of 6, keeping real risk at about $3,000. This leaves room to scale in if the setup improves."},
    ],
    "trade_structuring": [
        {"answer": "For META earnings with IV at 55% and an expected $18 move, the straddle costs roughly $18 (the expected move). The 25-delta strangle is cheaper — maybe $10-12 — but needs a larger move to profit. Given META's mixed earnings history (+12%, -4%, +7%, -9%), the average absolute move is 8%, which on a $520 stock is $41.60. Both the straddle and strangle would be profitable on that average move, but the strangle has better percentage returns if the move is large.",
         "probe": "You're buying vol into earnings. What about the other side — selling premium?",
         "followup": "Selling makes sense if I think the expected move is overpriced. The implied move is ~$18 (3.5%), but historical average is ~8% ($41.60). Wait — that means the straddle is actually underpriced relative to history! So buying the straddle is the better trade here. I'd buy the straddle and plan to close immediately after the earnings move, before IV crush on the remaining extrinsic value."},
    ],
    "risk_management": [
        {"answer": "With long gamma on tech and short vega on financials, a banking crisis is the worst-case scenario for the financials leg — vol spikes in financials causing losses on the short vega. Meanwhile, tech might actually benefit as a safe haven initially. My steps: (1) immediately assess the financial short vega P&L impact, (2) consider closing or hedging the financials position, (3) check if the tech long gamma is generating enough P&L to offset, (4) review correlation exposure.",
         "probe": "The scenario says correlation spiked to 0.85. How does that affect your portfolio risk?",
         "followup": "Correlation at 0.85 means sector diversification isn't working — everything moves together. My tech 'safe haven' assumption breaks down. The VIX jump of 6 points hurts my short vega in financials severely. I need to act fast: buy back the financial short vega (take the loss), and potentially reduce the tech long gamma too since the portfolio is now highly directional. The immediate priority is cutting gross exposure to reduce the correlation risk."},
    ],
    "alt_data": [
        {"answer": "30% fuller parking lots vs. last year is a strong signal for TGT same-store sales beating expectations. If consensus expects flat SSS but satellite data suggests 30% more traffic, there's a meaningful informational edge. I'd buy call spreads ahead of earnings — the $180/$195 call spread with 3 DTE, risking the premium on the thesis that TGT beats and guides up.",
         "probe": "How much confidence do you place in satellite data? What are the limitations?",
         "followup": "Satellite data has improved but has limitations: parking lot traffic doesn't equal revenue (basket size matters), weather can distort comparisons, and the data might already be priced in if hedge funds have the same feeds. I'd cross-reference with credit card data trends and web traffic if available. Given these caveats, I'd size the position at 50% of what I would with a high-conviction fundamental thesis."},
    ],
    "crypto": [
        {"answer": "The inverted term structure before the halving makes sense — the event is a known catalyst with uncertain impact. The 1-week at 80% vs 1-month at 55% gap of 25 vol points is very steep. Historically, halvings have been followed by bullish trends over 6-12 months, but the immediate reaction is often muted. I'd sell the front-week straddle and buy the 1-month straddle — a calendar spread to capture the term structure normalization post-event.",
         "probe": "What are the structural differences in crypto options markets that affect this trade?",
         "followup": "Crypto options have unique features: 24/7 trading (theta accrues differently), Deribit is the main venue with different margin rules, the vol smile is typically more symmetric than equity (less put skew), and liquidity is concentrated at BTC round-number strikes ($65K, $70K). The $70K OI concentration suggests dealers are short calls there, creating a potential gamma squeeze if BTC rallies through it. I'd position my calendar slightly bullish — buy the 1-month $70K call, sell the 1-week $70K call."},
    ],
    "exotic_structures": [
        {"answer": "A knock-in put that activates at SPX 4800 with the index at 5200 is ~7.7% OTM on the barrier. Pricing requires a barrier model (not Black-Scholes). The knock-in put is cheaper than a vanilla put because it only provides protection after a significant drawdown. I'd price using a closed-form barrier formula or Monte Carlo simulation with the local vol surface. The hedge involves dynamic delta hedging near the barrier, where gamma explodes.",
         "probe": "What are the hedging challenges as the spot approaches the 4800 barrier level?",
         "followup": "Near the barrier, the knock-in put has massive negative gamma (the delta jumps discontinuously from ~0 to a large negative number as the barrier is hit). This makes dynamic hedging extremely difficult — the dealer needs to sell a lot of stock right when the market is dropping fast. This 'barrier risk' is why knock-in options trade at a premium to their model value. I'd manage this by pre-hedging with vanilla puts near 4800 to smooth the gamma profile."},
    ],
    "portfolio_mgmt": [
        {"answer": "With $50M across three strategies and VIX at 16, I'd allocate based on expected risk-adjusted returns and correlation benefits. Vol arb gets 40% ($20M) since realized < implied by 3 points — that's the core edge. Dispersion gets 35% ($17.5M) since correlation at 0.35 allows single-stock vs index trades. Tail hedge gets 25% ($12.5M) as insurance against correlation spikes. I'd dynamically rebalance monthly based on regime indicators.",
         "probe": "What triggers would cause you to reallocate between strategies?",
         "followup": "Key triggers: (1) if VIX rises above 25, reduce vol arb allocation since short vol strategies have negative skewness in high-vol regimes; (2) if correlation rises above 0.6, reduce dispersion since the single-stock vs index vol spread compresses; (3) if both happen simultaneously, increase tail hedge to 40% since it's a crisis regime. I'd also monitor the P&L Sharpe of each strategy on a rolling 30-day basis — if any strategy's Sharpe drops below 0.5, I'd reduce its allocation until conditions improve."},
    ],
    "pit_tooling": [
        {"answer": "A PM risk dashboard should show at a glance: (1) Portfolio Greeks — net delta, gamma, vega, theta with P&L attribution, (2) Var/CVaR at 95th and 99th percentile, (3) Largest position concentrations by sector and single name, (4) Margin utilization and buying power, (5) Correlation heat map across positions, (6) Real-time P&L vs daily targets/limits.",
         "probe": "What alerts should trigger automatic notifications to the PM?",
         "followup": "Critical alerts: breach of daily loss limit (hard stop), delta exposure exceeding ±X% of NAV, correlation spike above threshold, any single position exceeding concentration limit, margin utilization above 80%, and unusual volume/price action in top 10 positions. I'd also add a 'regime change' alert that monitors VIX term structure inversions, credit spread widening, and correlation regime shifts — these are leading indicators of systemic risk that require portfolio-level action."},
    ],
}

# Fallback answer for categories without specific content
_DEFAULT_ANSWERS = [
    {"answer": "Looking at this scenario, I'd start by identifying the key risk factors and opportunities. The market context suggests we need to consider both the fundamental drivers and the technical setup before choosing a strategy. I'd lean toward a defined-risk approach given current conditions.",
     "probe": "Can you be more specific about what 'defined-risk approach' means in this context?",
     "followup": "I'd use a vertical spread or iron condor to limit my max loss while still capturing the thesis. The specific structure depends on my directional view and the current IV percentile — if IV is high, I'd prefer selling premium with spreads; if IV is low, I'd buy premium with debit spreads."},
    {"answer": "The setup here presents an interesting opportunity. I'd analyze the implied vol surface relative to historical patterns and compare the current pricing to what fundamentals suggest. My focus would be on finding asymmetric risk/reward — situations where the market is mispricing one side of the distribution.",
     "probe": "What specific metrics would you use to assess whether the market is 'mispricing'?",
     "followup": "I'd compare current IV rank and percentile to the 12-month range, look at the vol risk premium (implied minus realized), and examine the skew relative to its own history. If put skew is in the 90th percentile but the fundamental outlook hasn't changed, the puts are likely overpriced and I'd sell put spreads."},
    {"answer": "This requires a systematic analysis. First, I'd quantify the expected move and compare it to the options-implied move. Then I'd assess whether the risk/reward ratio favors being long or short vol. Finally, I'd structure the trade to match my conviction level and risk tolerance.",
     "probe": "Walk me through the quantitative framework you'd use.",
     "followup": "Step 1: Calculate the ATM straddle price as a percentage of the underlying — that's the implied move. Step 2: Compare to the trailing 30-day realized move and any upcoming catalysts. Step 3: If implied > expected, sell premium via condors or butterflies. If implied < expected, buy straddles or strangles. Size to 1-2% of portfolio max loss."},
]


# Score patterns for 5 attempts. All average >= 3.5 for mastery.
# "typical" — mixed scores, avg ~3.7, does NOT trigger 3-consecutive >= 4.0 promotion.
# "strong"  — all high scores, avg ~4.3, DOES trigger promotion suggestion.
# "growing" — starts weak, finishes strong, avg ~3.7, does NOT trigger promotion
#             (consecutive check is most-recent-first, and the most recent score dips).
# "weak"    — recent low scores, avg ~2.8, still meets mastery bar but triggers demotion concern.
_SCORE_TYPICAL = [3.5, 4.0, 3.5, 3.8, 3.7]
_SCORE_STRONG = [4.5, 4.2, 4.0, 4.3, 4.5]
_SCORE_GROWING = [3.2, 3.5, 3.8, 4.0, 3.6]
_SCORE_WEAK = [3.5, 3.0, 2.0, 1.8, 1.5]

# Per-user, which categories get "strong" scores (trigger promotion suggestions).
# Only categories that have their NEXT difficulty unlocked at the user's level can generate promotions.
_STRONG_CATEGORIES: dict[uuid.UUID, set[str]] = {
    U1: set(),                                    # Level 1, no intermediate unlocked
    U2: {"greeks", "iv_analysis"},                # L4: greeks/int@3, iv_analysis/int@2
    U3: {"greeks", "skew", "term_structure",
         "risk_management"},                       # L7: all beginner, mastered enough for int
    U4: set(),                                    # Level 3, greeks/int@3 only
    U5: {"greeks", "vol_surface"},                  # L10: 2 promotions only
}

# Per-user, which categories get "weak" recent scores (generates recommendation emphasis).
_WEAK_CATEGORIES: dict[uuid.UUID, set[str]] = {
    U1: set(),
    U2: {"macro", "technical_analysis"},           # struggling — shows in recommendations
    U3: set(),
    U4: {"realized_vol"},
    U5: set(),
}


def _make_responses_and_grades(
    now: datetime,
    valid_user_ids: set[uuid.UUID] | None = None,
):
    """Generate 5 graded responses per mastered category per user for mastery proof."""
    from app.constants import MASTERY_SCENARIO_COUNT
    items = []
    counter = 0

    for user_id, categories in _USER_MASTERY.items():
        if valid_user_ids is not None and user_id not in valid_user_ids:
            continue
        strong = _STRONG_CATEGORIES.get(user_id, set())
        weak = _WEAK_CATEGORIES.get(user_id, set())
        for cat_idx, cat in enumerate(categories):
            si = _CAT_TO_SCENARIO.get(cat)
            if si is None:
                continue
            scenario = DEMO_SCENARIOS[si]

            if cat in strong:
                scores = _SCORE_STRONG
            elif cat in weak:
                scores = _SCORE_WEAK
            elif cat_idx % 3 == 0:
                scores = _SCORE_GROWING
            else:
                scores = _SCORE_TYPICAL

            for attempt in range(MASTERY_SCENARIO_COUNT):
                counter += 1
                r_id = _stable_uuid("response", counter)
                g_id = _stable_uuid("grade", counter)
                score = scores[attempt % len(scores)]

                # Build realistic conversation
                cat_answers = _TRAINEE_ANSWERS.get(cat, _DEFAULT_ANSWERS)
                ans_data = cat_answers[attempt % len(cat_answers)]
                conv = [
                    {"role": "system", "content": scenario["content"]["question"]},
                    {"role": "user", "content": ans_data["answer"]},
                ]
                if "probe" in ans_data:
                    conv.append({"role": "assistant", "content": ans_data["probe"]})
                if "followup" in ans_data:
                    conv.append({"role": "user", "content": ans_data["followup"]})

                items.append({
                    "response": {
                        "id": r_id,
                        "user_id": user_id,
                        "scenario_id": S[si],
                        "conversation": conv,
                        "is_complete": True,
                        "submitted_at": now - timedelta(hours=counter * 2),
                    },
                    "grade": {
                        "id": g_id,
                        "response_id": r_id,
                        "dimension_scores": {
                            "reasoning": score,
                            "terminology": min(score + 0.2, 5.0),
                            "trade_logic": max(score - 0.2, 1.0),
                            "risk_awareness": score,
                        },
                        "overall_score": round(score, 1),
                        "feedback": FEEDBACKS[attempt % len(FEEDBACKS)],
                        "confidence": 0.85,
                        "graded_by": "ai",
                        "graded_at": now - timedelta(hours=counter * 2 - 1),
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
    {"id": BK[3], "user_id": U2, "scenario_id": S[8], "tag": "retry"},
    {"id": BK[4], "user_id": U3, "scenario_id": S[18], "tag": "reference"},
    {"id": BK[5], "user_id": U3, "scenario_id": S[21], "tag": "reference"},
    {"id": BK[6], "user_id": U4, "scenario_id": S[2], "tag": "retry"},
    {"id": BK[7], "user_id": U5, "scenario_id": S[24], "tag": "reference"},
    {"id": BK[8], "user_id": U5, "scenario_id": S[25], "tag": "reference"},
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
    seed_clean = os.environ.get("SEED_CLEAN", "").lower() in ("true", "1", "yes")
    users_to_seed = PROD_USERS if is_prod else TEST_USERS
    now = datetime.utcnow()

    # Ensure demo organizations exist before users.
    organizations = [
        Organization(
            id=uuid.UUID("00000000-0000-0000-0000-000000000099"),
            name="The Pit",
            slug="thepit",
        ),
        Organization(
            id=uuid.UUID("00000000-0000-0000-0000-000000000100"),
            name="Acme",
            slug="acme",
        ),
    ]
    cleanup_org_id = uuid.UUID("00000000-0000-0000-0000-000000000199")
    if seed_clean:
        organizations.append(
            Organization(
                id=cleanup_org_id,
                name="Sandbox Archive",
                slug="sandbox-archive",
            )
        )

    async with async_session() as session:
        for org in organizations:
            existing_org = await session.get(Organization, org.id)
            if existing_org:
                existing_org.name = org.name
                if hasattr(existing_org, "slug"):
                    existing_org.slug = org.slug
            else:
                session.add(org)
        await session.commit()

    async with async_session() as session:
        if seed_clean:
            seed_user_ids = {user_data["id"] for user_data in users_to_seed}
            result = await session.execute(
                update(User)
                .where(
                    User.org_id.in_(
                        [
                            uuid.UUID("00000000-0000-0000-0000-000000000099"),
                            uuid.UUID("00000000-0000-0000-0000-000000000100"),
                        ]
                    ),
                    ~User.id.in_(seed_user_ids),
                )
                .values(org_id=cleanup_org_id)
            )
            moved_count = int(result.rowcount or 0)
            if moved_count > 0:
                print(f"  Cleanup moved non-seed users: {moved_count}")

        # ── 1. Users ──
        for user_data in users_to_seed:
            existing = await session.get(User, user_data["id"])
            if existing:
                # Keep seeded demo accounts fully deterministic so README credentials always work.
                existing.email = user_data["email"].lower()
                existing.password_hash = hash_password(user_data["password"])
                existing.display_name = user_data["display_name"]
                existing.role = user_data["role"]
                existing.avatar_id = user_data.get("avatar_id", "default")
                existing.bio = user_data.get("bio")
                existing.ta_phase = user_data["ta_phase"]
                existing.xp_total = user_data["xp_total"]
                existing.level = user_data["level"]
                existing.streak_days = user_data["streak_days"]
                existing.cohort = user_data.get("cohort")
                existing.has_onboarded = user_data.get("has_onboarded", True)
                existing.org_id = user_data["org_id"]
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
                    org_id=user_data["org_id"],
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
        valid_user_ids = {user_data["id"] for user_data in users_to_seed}
        rg_items = _make_responses_and_grades(now, valid_user_ids=valid_user_ids)
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
            if ae_data["user_id"] not in valid_user_ids:
                continue
            if not await session.get(ActivityEvent, ae_data["id"]):
                session.add(ActivityEvent(**ae_data))
        print(f"  Activity Events: {len(events)}")

        # ── 5. Bookmarks ──
        for bk_data in DEMO_BOOKMARKS:
            if bk_data["user_id"] not in valid_user_ids:
                continue
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
            if user_id not in valid_user_ids:
                continue
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
            if pp_data["user_id"] not in valid_user_ids:
                continue
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
        # Build a map of (user_id, category) → list of response IDs
        _user_cat_responses: dict[tuple[uuid.UUID, str], list[uuid.UUID]] = {}
        for item in rg_items:
            uid = item["response"]["user_id"]
            sid = item["response"]["scenario_id"]
            cat = next((s["category"] for s in DEMO_SCENARIOS if s["id"] == sid), None)
            if cat:
                _user_cat_responses.setdefault((uid, cat), []).append(item["response"]["id"])

        def _resp(user_id: uuid.UUID, category: str, attempt: int = 0) -> uuid.UUID | None:
            resps = _user_cat_responses.get((user_id, category))
            return resps[attempt] if resps and attempt < len(resps) else None

        review_data = [
            # ── Reviews ON U1's responses (Test Trader, level 1) ──
            # U2 reviews U1's IV analysis
            (U2, U1, "iv_analysis", 0,
             {"reasoning": 3, "terminology": 3, "overall": 3},
             "Reasonable start on IV analysis. You identified the spike correctly but didn't discuss whether the vol risk premium is justified relative to realized. Try comparing to historical IV percentile.", 0.72),
            (U2, U1, "iv_analysis", 2,
             {"reasoning": 4, "terminology": 3, "overall": 3},
             "Better than your earlier attempt — the reasoning around put skew was solid. Terminology could be tighter; use 'backwardation' instead of 'inverted term structure' for vol curves.", 0.76),
            # U3 reviews U1's realized vol
            (U3, U1, "realized_vol", 1,
             {"reasoning": 3, "terminology": 4, "overall": 3},
             "You correctly flagged the realized vs implied gap but missed the earnings catalyst. Always check the event calendar when vol divergence is this wide — the gap may be rational.", 0.80),
            # U5 reviews U1's fundamentals
            (U5, U1, "fundamentals", 0,
             {"reasoning": 4, "terminology": 4, "overall": 4},
             "Clean explanation of calls vs puts. The $100 stock example was effective. Next time, also mention intrinsic vs extrinsic value to show deeper understanding.", 0.88),
            (U5, U1, "fundamentals", 3,
             {"reasoning": 4, "terminology": 5, "overall": 4},
             "Excellent improvement. Terminology is spot-on now and the payoff diagrams you described make the explanation very clear.", 0.92),

            # ── Reviews ON U2's responses (Alex Chen, level 4) ──
            # U3 reviews U2's greeks
            (U3, U2, "greeks", 0,
             {"reasoning": 4, "terminology": 4, "overall": 4},
             "Strong delta hedging walkthrough. Your explanation of gamma's role in the rebalance frequency was particularly good. Consider adding vega exposure discussion for the straddle.", 0.85),
            (U3, U2, "greeks", 2,
             {"reasoning": 5, "terminology": 4, "overall": 5},
             "This is excellent work. The connection between gamma P&L and hedging frequency shows real understanding. The P&L attribution breakdown was professional-grade.", 0.94),
            # U5 reviews U2's order flow
            (U5, U2, "order_flow", 1,
             {"reasoning": 4, "terminology": 3, "overall": 4},
             "Good read on the unusual activity signal. Be more precise about distinguishing opening vs closing trades — 'buying on the ask' alone doesn't confirm directional intent if it's a hedge.", 0.78),
            # U1 reviews U2's sentiment
            (U1, U2, "sentiment", 0,
             {"reasoning": 3, "terminology": 3, "overall": 3},
             "Solid connection between put-call ratio and contrarian signals. The fear index reference adds context. Could strengthen by discussing what invalidates the signal.", 0.70),
            # U4 reviews U2's macro
            (U4, U2, "macro", 3,
             {"reasoning": 4, "terminology": 4, "overall": 4},
             "Your FOMC analysis was well-structured. Liked the distinction between the rate decision and forward guidance — that's often where the real trade is. Nice catch on the long-end yield move.", 0.83),

            # ── Reviews ON U3's responses (Maria Santos, level 7) ──
            # U5 reviews U3's skew
            (U5, U3, "skew", 0,
             {"reasoning": 5, "terminology": 5, "overall": 5},
             "Outstanding skew analysis. Your framework for mean-reverting skew vs structural changes is exactly how a vol desk would think about it. The historical context really strengthens the trade thesis.", 0.96),
            # U2 reviews U3's risk management
            (U2, U3, "risk_management", 1,
             {"reasoning": 4, "terminology": 4, "overall": 4},
             "Thorough stress test approach. The correlation spike scenario was well-handled. One thing to add: cross-Greek interactions under stress (e.g., vanna effects when vol and spot move together).", 0.82),
            # U5 reviews U3's vol surface
            (U5, U3, "vol_surface", 2,
             {"reasoning": 5, "terminology": 5, "overall": 5},
             "The kink analysis is sophisticated — linking it to pinned OI at the support level shows practical market knowledge beyond textbook vol surface theory. Great work.", 0.97),
            # U2 reviews U3's term structure
            (U2, U3, "term_structure", 0,
             {"reasoning": 4, "terminology": 5, "overall": 4},
             "Good term structure inversion analysis. The TSLA earnings context was well-integrated. Consider discussing calendar spread opportunities when front-month IV is this elevated.", 0.84),
            # U1 reviews U3's event vol
            (U1, U3, "event_vol", 2,
             {"reasoning": 3, "terminology": 4, "overall": 4},
             "Your binary event framework is clear. The comparison to historical FDA moves gives good context for whether options are over/underpricing the event.", 0.75),

            # ── Reviews ON U4's responses (James Kim, level 3) ──
            # U1 reviews U4's fundamentals
            (U1, U4, "fundamentals", 0,
             {"reasoning": 3, "terminology": 3, "overall": 3},
             "Decent basics but the call/put explanation could be more concrete. Try using a specific dollar example to show the max profit/loss profile.", 0.68),
            # U2 reviews U4's iv analysis
            (U2, U4, "iv_analysis", 1,
             {"reasoning": 3, "terminology": 2, "overall": 3},
             "You're on the right track with IV analysis but watch the terminology — 'volatility is high' is vague. Quote the IV rank/percentile and compare to realized vol for a complete picture.", 0.62),
            # U3 reviews U4's realized vol
            (U3, U4, "realized_vol", 2,
             {"reasoning": 3, "terminology": 3, "overall": 3},
             "You identified the realized vs implied gap, which is the key observation. To improve, discuss window selection for realized vol (10-day vs 30-day) and why it matters for the trade.", 0.71),
            (U5, U4, "realized_vol", 4,
             {"reasoning": 4, "terminology": 3, "overall": 3},
             "Improved reasoning over earlier attempts. The systematic selling opportunity analysis was better structured this time. Keep building on the quantitative side.", 0.74),

            # ── Reviews ON U5's responses (Priya Patel, level 10) ──
            # U3 reviews U5's exotic structures
            (U3, U5, "exotic_structures", 0,
             {"reasoning": 5, "terminology": 5, "overall": 5},
             "Masterful barrier option analysis. The comparison of knock-in put delta profile vs vanilla is exactly the kind of insight clients need. Hedging discussion was professional-grade.", 0.98),
            # U3 reviews U5's portfolio mgmt
            (U3, U5, "portfolio_mgmt", 1,
             {"reasoning": 5, "terminology": 5, "overall": 5},
             "The risk budget allocation framework is comprehensive. Loved the dynamic rebalancing triggers based on vol regime changes. This reads like an actual PM allocation memo.", 0.96),
            # U2 reviews U5's vol surface
            (U2, U5, "vol_surface", 0,
             {"reasoning": 5, "terminology": 4, "overall": 5},
             "Incredible depth on the vol surface anomaly. The kink explanation tied to OI pinning and technical levels was insightful. One of the best analyses I've reviewed.", 0.91),
            # U2 reviews U5's greeks
            (U2, U5, "greeks", 2,
             {"reasoning": 5, "terminology": 5, "overall": 5},
             "Textbook-perfect delta hedging explanation with practical nuances about transaction costs and hedge frequency. The gamma scalping discussion adds real value.", 0.93),
            # U1 reviews U5's sentiment
            (U1, U5, "sentiment", 0,
             {"reasoning": 4, "terminology": 5, "overall": 5},
             "Very thorough sentiment analysis. The multi-factor approach combining put-call ratio, VIX, and breadth indicators gives a much more reliable signal. Learned a lot from this.", 0.85),
        ]

        demo_peer_reviews = []
        for i, (reviewer, author, cat, attempt, scores, fb, qs) in enumerate(review_data):
            resp_id = _resp(author, cat, attempt)
            if not resp_id:
                continue
            demo_peer_reviews.append({
                "id": PR[i],
                "reviewer_id": reviewer,
                "response_id": resp_id,
                "dimension_scores": scores,
                "feedback": fb,
                "quality_score": qs,
                "created_at": now - timedelta(hours=i * 3 + 1),
            })

        for pr_data in demo_peer_reviews:
            if not await session.get(PeerReview, pr_data["id"]):
                session.add(PeerReview(**pr_data))
        print(f"  Peer Reviews: {len(demo_peer_reviews)}")

        await session.commit()

    env = "production" if is_prod else "development"
    print(f"\nSeed complete ({env})")
    print(f"  Users: {len(users_to_seed)}")
    print(f"  Scenarios: {len(DEMO_SCENARIOS)}")
    print(f"  All features populated for demo!")


if __name__ == "__main__":
    asyncio.run(seed())
