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
    1: [CategoryTier("iv_analysis", "beginner")],
    2: [CategoryTier("greeks", "beginner"), CategoryTier("iv_analysis", "intermediate")],
    3: [CategoryTier("order_flow", "beginner"), CategoryTier("greeks", "intermediate")],
    4: [CategoryTier("macro", "beginner"), CategoryTier("term_structure", "beginner")],
    5: [
        CategoryTier("skew", "beginner"),
        CategoryTier("correlation", "beginner"),
        CategoryTier("event_vol", "beginner"),
        CategoryTier("tail_risk", "beginner"),
    ],
    6: [
        CategoryTier("order_flow", "intermediate"),
        CategoryTier("macro", "intermediate"),
        CategoryTier("position_sizing", "beginner"),
        CategoryTier("trade_structuring", "beginner"),
    ],
    7: [
        CategoryTier("vol_surface", "beginner"),
        CategoryTier("microstructure", "beginner"),
        CategoryTier("risk_management", "beginner"),
        CategoryTier("capman_tooling", "beginner"),
    ],
    8: [CategoryTier(c, "intermediate") for c in [
        "skew", "correlation", "event_vol", "tail_risk",
        "position_sizing", "trade_structuring",
    ]],
    9: [CategoryTier(c, "intermediate") for c in [
        "vol_surface", "microstructure", "risk_management", "capman_tooling",
    ]] + [CategoryTier(c, "advanced") for c in [
        "iv_analysis", "greeks", "order_flow",
    ]],
    10: [CategoryTier(c, "advanced") for c in [
        "macro", "term_structure", "skew", "correlation", "event_vol",
        "tail_risk", "position_sizing", "trade_structuring",
        "vol_surface", "microstructure", "risk_management", "capman_tooling",
    ]],
}

MASTERY_THRESHOLD = 3.5
MASTERY_SCENARIO_COUNT = 5
DIFFICULTY_MULTIPLIER = {"beginner": 1.0, "intermediate": 1.5, "advanced": 2.0}
XP_BASE = 20
RUBRIC_DIMENSIONS = ["reasoning", "terminology", "trade_logic", "risk_awareness"]

SCENARIO_CATEGORIES = [
    "iv_analysis", "greeks", "order_flow", "macro", "term_structure",
    "skew", "correlation", "event_vol", "tail_risk", "position_sizing",
    "trade_structuring", "vol_surface", "microstructure", "risk_management",
    "capman_tooling",
]
