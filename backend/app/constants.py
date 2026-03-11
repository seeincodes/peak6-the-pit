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
    1: [
        CategoryTier("iv_analysis", "beginner"),
        CategoryTier("realized_vol", "beginner"),
    ],
    2: [
        CategoryTier("greeks", "beginner"),
        CategoryTier("iv_analysis", "intermediate"),
        CategoryTier("fundamentals", "beginner"),
    ],
    3: [
        CategoryTier("order_flow", "beginner"),
        CategoryTier("greeks", "intermediate"),
        CategoryTier("technical_analysis", "beginner"),
        CategoryTier("sentiment", "beginner"),
    ],
    4: [
        CategoryTier("macro", "beginner"),
        CategoryTier("term_structure", "beginner"),
        CategoryTier("fixed_income", "beginner"),
        CategoryTier("seasonality", "beginner"),
    ],
    5: [
        CategoryTier("skew", "beginner"),
        CategoryTier("correlation", "beginner"),
        CategoryTier("event_vol", "beginner"),
        CategoryTier("tail_risk", "beginner"),
        CategoryTier("commodities", "beginner"),
        CategoryTier("geopolitical", "beginner"),
    ],
    6: [
        CategoryTier("order_flow", "intermediate"),
        CategoryTier("macro", "intermediate"),
        CategoryTier("position_sizing", "beginner"),
        CategoryTier("trade_structuring", "beginner"),
        CategoryTier("crypto", "beginner"),
        CategoryTier("alt_data", "beginner"),
    ],
    7: [
        CategoryTier("vol_surface", "beginner"),
        CategoryTier("microstructure", "beginner"),
        CategoryTier("risk_management", "beginner"),
        CategoryTier("capman_tooling", "beginner"),
        CategoryTier("exotic_structures", "beginner"),
        CategoryTier("portfolio_mgmt", "beginner"),
    ],
    8: [CategoryTier(c, "intermediate") for c in [
        "skew", "correlation", "event_vol", "tail_risk",
        "position_sizing", "trade_structuring",
        "realized_vol", "technical_analysis", "sentiment",
        "fundamentals", "fixed_income", "seasonality",
    ]],
    9: [CategoryTier(c, "intermediate") for c in [
        "vol_surface", "microstructure", "risk_management", "capman_tooling",
        "commodities", "geopolitical", "crypto", "alt_data",
        "exotic_structures", "portfolio_mgmt",
    ]] + [CategoryTier(c, "advanced") for c in [
        "iv_analysis", "greeks", "order_flow",
    ]],
    10: [CategoryTier(c, "advanced") for c in [
        "macro", "term_structure", "skew", "correlation", "event_vol",
        "tail_risk", "position_sizing", "trade_structuring",
        "vol_surface", "microstructure", "risk_management", "capman_tooling",
        "realized_vol", "technical_analysis", "sentiment", "fundamentals",
        "fixed_income", "seasonality", "commodities", "geopolitical",
        "crypto", "alt_data", "exotic_structures", "portfolio_mgmt",
    ]],
}

MASTERY_THRESHOLD = 3.5
MASTERY_SCENARIO_COUNT = 5
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
    "risk_management", "capman_tooling",
    "sentiment", "technical_analysis", "fixed_income", "seasonality",
    "exotic_structures", "fundamentals", "commodities", "crypto",
    "geopolitical", "alt_data", "portfolio_mgmt",
]
