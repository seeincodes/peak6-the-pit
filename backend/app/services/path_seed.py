"""Seed data for learning paths."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learning_path import LearningPath


LEARNING_PATHS = [
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000001"),
        "slug": "greeks-fundamentals",
        "name": "Greeks Fundamentals",
        "description": "Master the core Greeks (Delta, Gamma, Theta, Vega) from basic concepts through practical application in trading decisions.",
        "icon": "TrendingUp",
        "difficulty_level": "beginner",
        "estimated_minutes": 90,
        "display_order": 1,
        "steps": [
            {
                "step_number": 1,
                "title": "Delta Basics",
                "description": "Understand delta as the rate of change of option price relative to underlying price. Interpret delta as a directional exposure measure.",
                "category": "greeks",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Gamma & Convexity",
                "description": "Learn how gamma measures the rate of change of delta and why convexity matters for option positions.",
                "category": "greeks",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "Theta & Time Decay",
                "description": "Analyze how time decay affects option premiums differently across moneyness and time to expiration.",
                "category": "greeks",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Vega & Volatility Sensitivity",
                "description": "Understand how changes in implied volatility affect option prices and how to manage vega exposure.",
                "category": "greeks",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 5,
                "title": "Greeks in Practice",
                "description": "Apply all four Greeks together to evaluate a multi-leg options position and manage risk.",
                "category": "greeks",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
        ],
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000002"),
        "slug": "vol-surface-mastery",
        "name": "Volatility Surface Mastery",
        "description": "Progress from basic IV concepts through skew, term structure, and full vol surface analysis for trading opportunities.",
        "icon": "BarChart3",
        "difficulty_level": "mixed",
        "estimated_minutes": 150,
        "display_order": 2,
        "steps": [
            {
                "step_number": 1,
                "title": "Implied Volatility Foundations",
                "description": "Interpret implied volatility levels, understand the relationship between IV and option prices, and identify high/low IV environments.",
                "category": "iv_analysis",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Historical vs Implied Vol",
                "description": "Compare realized volatility to implied volatility to identify potential mispricings and mean-reversion opportunities.",
                "category": "realized_vol",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "Volatility Skew Analysis",
                "description": "Analyze put-call skew, understand why skew exists, and identify opportunities from skew dislocations.",
                "category": "skew",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Term Structure of Volatility",
                "description": "Evaluate the volatility term structure, understand contango vs backwardation in vol, and trade calendar spreads.",
                "category": "term_structure",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 5,
                "title": "IV Analysis at Intermediate Level",
                "description": "Apply IV analysis to real market scenarios with multiple factors, including earnings events and macro catalysts.",
                "category": "iv_analysis",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
            {
                "step_number": 6,
                "title": "Full Surface Interpretation",
                "description": "Read and trade the full 3D volatility surface: strike, expiry, and vol. Identify surface anomalies and relative value.",
                "category": "vol_surface",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
        ],
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000003"),
        "slug": "risk-management-essentials",
        "name": "Risk Management Essentials",
        "description": "Learn to size positions, manage portfolio risk, and protect against tail events using systematic risk frameworks.",
        "icon": "Shield",
        "difficulty_level": "mixed",
        "estimated_minutes": 120,
        "display_order": 3,
        "steps": [
            {
                "step_number": 1,
                "title": "Position Sizing Basics",
                "description": "Learn fundamental position sizing techniques: fixed fractional, Kelly criterion, and max risk per trade.",
                "category": "position_sizing",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Greeks-Based Risk",
                "description": "Understand portfolio Greeks and how to measure and manage directional, volatility, and time risk.",
                "category": "greeks",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "Tail Risk & Extreme Events",
                "description": "Identify tail risk exposures, understand fat tails in return distributions, and implement tail hedging strategies.",
                "category": "tail_risk",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Risk Management Frameworks",
                "description": "Apply VaR, stress testing, and scenario analysis to a portfolio of options positions.",
                "category": "risk_management",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 5,
                "title": "Correlation & Diversification",
                "description": "Analyze cross-asset correlations and understand how diversification breaks down during market stress.",
                "category": "correlation",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
        ],
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000004"),
        "slug": "market-macro-mastery",
        "name": "Market & Macro Mastery",
        "description": "Connect macroeconomic analysis to options trading through rates, events, and cross-asset vol drivers.",
        "icon": "Globe",
        "difficulty_level": "mixed",
        "estimated_minutes": 120,
        "display_order": 4,
        "steps": [
            {
                "step_number": 1,
                "title": "Macro Indicators for Traders",
                "description": "Learn which macroeconomic indicators (CPI, NFP, FOMC) move markets and how to position around them.",
                "category": "macro",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Interest Rates & Fixed Income",
                "description": "Understand the relationship between interest rates, yield curves, and equity/option valuations.",
                "category": "fixed_income",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "Event-Driven Volatility",
                "description": "Analyze how events (earnings, FOMC, geopolitical) create vol spikes and how to trade event premium.",
                "category": "event_vol",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Geopolitical Risk Assessment",
                "description": "Evaluate how geopolitical events impact cross-asset volatility and develop scenario-based trading plans.",
                "category": "geopolitical",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 5,
                "title": "Macro Synthesis",
                "description": "Synthesize multiple macro factors to form a comprehensive market outlook and options strategy.",
                "category": "macro",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
        ],
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000005"),
        "slug": "trade-structuring-bootcamp",
        "name": "Trade Structuring Bootcamp",
        "description": "Learn to design and structure multi-leg options trades: spreads, straddles, butterflies, and custom payoffs.",
        "icon": "Layers",
        "difficulty_level": "intermediate",
        "estimated_minutes": 100,
        "display_order": 5,
        "steps": [
            {
                "step_number": 1,
                "title": "Fundamentals of Options Payoffs",
                "description": "Review call/put payoff diagrams and understand how combining options creates new risk profiles.",
                "category": "fundamentals",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Order Flow & Execution",
                "description": "Understand how order flow data reveals institutional positioning and helps with trade timing.",
                "category": "order_flow",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "Basic Trade Structures",
                "description": "Construct vertical spreads, straddles, and strangles. Understand when each structure is optimal.",
                "category": "trade_structuring",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Sizing Your Structures",
                "description": "Apply position sizing principles specifically to multi-leg structures and manage margin requirements.",
                "category": "position_sizing",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 5,
                "title": "Advanced Structuring",
                "description": "Design ratio spreads, butterflies, and condors based on vol surface views and market outlook.",
                "category": "trade_structuring",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
        ],
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000006"),
        "slug": "iv-vs-rv-trader",
        "name": "IV vs RV Trader",
        "description": "Specialize in the core volatility trading skill: comparing implied to realized volatility and capturing the spread.",
        "icon": "Activity",
        "difficulty_level": "beginner",
        "estimated_minutes": 80,
        "display_order": 6,
        "steps": [
            {
                "step_number": 1,
                "title": "What Is Implied Volatility?",
                "description": "Understand IV as the market's forecast of future vol, how it is derived from option prices, and what drives it.",
                "category": "iv_analysis",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 2,
                "title": "Measuring Realized Volatility",
                "description": "Calculate and interpret realized volatility using different measurement windows and methodologies.",
                "category": "realized_vol",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
            {
                "step_number": 3,
                "title": "The Volatility Risk Premium",
                "description": "Analyze the persistent gap between IV and RV, understand why it exists, and how traders harvest it.",
                "category": "iv_analysis",
                "difficulty": "intermediate",
                "required_score": 3.5,
            },
            {
                "step_number": 4,
                "title": "Seasonality in Volatility",
                "description": "Identify seasonal patterns in volatility — earnings cycles, year-end effects, and holiday patterns.",
                "category": "seasonality",
                "difficulty": "beginner",
                "required_score": 3.5,
            },
        ],
    },
]


async def seed_learning_paths(db: AsyncSession) -> int:
    """Seed learning paths if they don't exist. Returns count of new paths."""
    count = 0
    for path_data in LEARNING_PATHS:
        existing = await db.get(LearningPath, path_data["id"])
        if existing:
            continue
        path = LearningPath(**path_data)
        db.add(path)
        count += 1
    if count:
        await db.commit()
    return count
