from dataclasses import dataclass


@dataclass(frozen=True)
class CategoryTier:
    category: str
    difficulty: str


LEVEL_TITLES = {
    1: "Initiate",
    2: "Analyst",
    3: "Strategist",
    4: "Risk Manager",
    5: "Volatility Trader",
    6: "Senior Strategist",
    7: "Portfolio Lead",
    8: "Head Trader",
    9: "Master Trader",
    10: "Desk Head",
}

LEVEL_UNLOCKS: dict[int, list[CategoryTier]] = {
    # Foundation — absolute basics
    1: [
        CategoryTier("iv_analysis", "beginner"),
        CategoryTier("realized_vol", "beginner"),
        CategoryTier("fundamentals", "beginner"),
    ],
    # Core — builds on foundation
    2: [
        CategoryTier("greeks", "beginner"),
        CategoryTier("order_flow", "beginner"),
        CategoryTier("iv_analysis", "intermediate"),
    ],
    3: [
        CategoryTier("technical_analysis", "beginner"),
        CategoryTier("sentiment", "beginner"),
        CategoryTier("macro", "beginner"),
        CategoryTier("greeks", "intermediate"),
    ],
    # Specialization — domain-specific
    4: [
        CategoryTier("skew", "beginner"),
        CategoryTier("term_structure", "beginner"),
        CategoryTier("event_vol", "beginner"),
        CategoryTier("tail_risk", "beginner"),
    ],
    5: [
        CategoryTier("correlation", "beginner"),
        CategoryTier("microstructure", "beginner"),
        CategoryTier("fixed_income", "beginner"),
        CategoryTier("seasonality", "beginner"),
        CategoryTier("commodities", "beginner"),
        CategoryTier("geopolitical", "beginner"),
    ],
    # Advanced — combining specializations
    6: [
        CategoryTier("vol_surface", "beginner"),
        CategoryTier("position_sizing", "beginner"),
        CategoryTier("trade_structuring", "beginner"),
        CategoryTier("risk_management", "beginner"),
        CategoryTier("alt_data", "beginner"),
        CategoryTier("crypto", "beginner"),
    ],
    # Expert — mastery-level synthesis
    7: [
        CategoryTier("exotic_structures", "beginner"),
        CategoryTier("portfolio_mgmt", "beginner"),
        CategoryTier("pit_tooling", "beginner"),
    ],
    # Intermediate tiers
    8: [CategoryTier(c, "intermediate") for c in [
        "realized_vol", "fundamentals", "order_flow",
        "technical_analysis", "sentiment", "macro",
        "skew", "term_structure", "event_vol", "tail_risk",
    ]],
    9: [CategoryTier(c, "intermediate") for c in [
        "correlation", "microstructure", "fixed_income", "seasonality",
        "commodities", "geopolitical", "vol_surface", "position_sizing",
        "trade_structuring", "risk_management", "alt_data", "crypto",
    ]] + [CategoryTier(c, "advanced") for c in [
        "iv_analysis", "greeks", "order_flow",
    ]],
    # Advanced tiers
    10: [CategoryTier(c, "advanced") for c in [
        "realized_vol", "fundamentals", "technical_analysis", "sentiment",
        "macro", "skew", "term_structure", "event_vol", "tail_risk",
        "correlation", "microstructure", "fixed_income", "seasonality",
        "commodities", "geopolitical", "vol_surface", "position_sizing",
        "trade_structuring", "risk_management", "alt_data", "crypto",
        "exotic_structures", "portfolio_mgmt", "pit_tooling",
    ]],
}

# Prerequisite map: category → parent category that must be mastered first.
# Foundation categories (iv_analysis, realized_vol, fundamentals) have no prerequisites.
CATEGORY_PREREQUISITES: dict[str, str] = {
    # Core ← Foundation
    "greeks": "iv_analysis",
    "order_flow": "realized_vol",
    "technical_analysis": "realized_vol",
    "sentiment": "fundamentals",
    "macro": "fundamentals",
    # Specialization ← Core
    "skew": "greeks",
    "term_structure": "greeks",
    "event_vol": "greeks",
    "tail_risk": "greeks",
    "correlation": "order_flow",
    "microstructure": "order_flow",
    "fixed_income": "macro",
    "seasonality": "technical_analysis",
    "commodities": "macro",
    "geopolitical": "sentiment",
    # Advanced ← Specialization
    "vol_surface": "skew",
    "position_sizing": "correlation",
    "trade_structuring": "term_structure",
    "risk_management": "tail_risk",
    "alt_data": "seasonality",
    "crypto": "microstructure",
    # Expert ← Advanced
    "exotic_structures": "vol_surface",
    "portfolio_mgmt": "position_sizing",
    "pit_tooling": "risk_management",
}

MASTERY_THRESHOLD = 70.0
MASTERY_SCENARIO_COUNT = 10
MASTERY_DECAY_RATE = 0.05
MASTERY_DECAY_FLOOR_PCT = 0.50
MASTERY_RECENCY_WEIGHT = 2.0
DIFFICULTY_MULTIPLIER = {"beginner": 1.0, "intermediate": 1.5, "advanced": 2.0}

# XP thresholds per level (Duolingo-style exponential curve)
XP_THRESHOLDS = [0, 0, 60, 180, 380, 720, 1250, 2050, 3250, 5050, 8000]

# Scenario XP
XP_BASE = 50
PERFECT_SCORE_BONUS = 25       # bonus when overall_score >= 4.5
NO_HINTS_BONUS = 10            # bonus when hints_used == 0
DAILY_FIRST_SCENARIO_BONUS = 25  # first scenario completed today
STREAK_XP_PER_DAY = 5          # XP per streak day
STREAK_XP_MAX = 50             # max streak bonus
HINT_XP_PENALTY = 0.20         # 20% XP reduction per hint used
XP_FLOOR = 5                   # minimum XP per activity

# MCQ Quick Fire XP
MCQ_XP_CORRECT_GOOD = 20
MCQ_XP_CORRECT_WEAK = 12
MCQ_XP_WRONG_GOOD = 8
MCQ_XP_WRONG_WEAK = 3
MCQ_STREAK_BONUS = 5
MCQ_STREAK_MAX_BONUS = 25
DAILY_FIRST_MCQ_BONUS = 15     # first MCQ session today
MCQ_JUSTIFY_MAX_CHARS = 200
RUBRIC_DIMENSIONS = ["reasoning", "terminology", "trade_logic", "risk_awareness"]

# Peer Review XP
PEER_REVIEW_BASE_XP = 15
PEER_REVIEW_QUALITY_BONUS = 10
PEER_REVIEW_QUALITY_THRESHOLD = 0.8
PEER_REVIEW_MAX_PER_RESPONSE = 3

SCENARIO_CATEGORIES = [
    "iv_analysis", "realized_vol", "greeks", "order_flow", "macro",
    "term_structure", "skew", "correlation", "event_vol", "tail_risk",
    "position_sizing", "trade_structuring", "vol_surface", "microstructure",
    "risk_management", "pit_tooling",
    "sentiment", "technical_analysis", "fixed_income", "seasonality",
    "exotic_structures", "fundamentals", "commodities", "crypto",
    "geopolitical", "alt_data", "portfolio_mgmt",
]
