"""Skill tree seed — populates default SkillNode rows if not already present."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_node import SkillNode

# ---------------------------------------------------------------------------
# Tier assignment based on CATEGORY_PREREQUISITES depth:
#
# Tier 1 — Foundation (no prerequisites):
#   iv_analysis, realized_vol, fundamentals
#
# Tier 2 — Core (prereq is a Tier-1 category):
#   greeks (←iv_analysis), order_flow (←realized_vol),
#   technical_analysis (←realized_vol), sentiment (←fundamentals),
#   macro (←fundamentals)
#
# Tier 3 — Specialization (prereq is a Tier-2 category):
#   skew (←greeks), term_structure (←greeks), event_vol (←greeks),
#   tail_risk (←greeks), correlation (←order_flow),
#   microstructure (←order_flow), fixed_income (←macro),
#   seasonality (←technical_analysis), commodities (←macro),
#   geopolitical (←sentiment)
#
# Tier 4 — Advanced/Expert (prereq is a Tier-3 or Tier-4 category):
#   vol_surface (←skew), position_sizing (←correlation),
#   trade_structuring (←term_structure), risk_management (←tail_risk),
#   alt_data (←seasonality), crypto (←microstructure),
#   exotic_structures (←vol_surface), portfolio_mgmt (←position_sizing),
#   pit_tooling (←risk_management)
# ---------------------------------------------------------------------------

_NODES: list[dict] = [
    # ── Tier 1: Foundation ──────────────────────────────────────────────────
    {
        "category": "iv_analysis",
        "display_name": "IV Analysis",
        "description": "Understanding implied volatility, its drivers, and how to read vol surfaces.",
        "icon": "trending-up",
        "prerequisites": [],
        "position_x": 200.0,
        "position_y": 0.0,
        "tier": 1,
    },
    {
        "category": "realized_vol",
        "display_name": "Realized Volatility",
        "description": "Historical volatility measurement, EWMA, and vol forecasting fundamentals.",
        "icon": "bar-chart-2",
        "prerequisites": [],
        "position_x": 500.0,
        "position_y": 0.0,
        "tier": 1,
    },
    {
        "category": "fundamentals",
        "display_name": "Fundamentals",
        "description": "Core financial concepts: earnings, valuation, and market structure basics.",
        "icon": "book-open",
        "prerequisites": [],
        "position_x": 800.0,
        "position_y": 0.0,
        "tier": 1,
    },

    # ── Tier 2: Core ────────────────────────────────────────────────────────
    {
        "category": "greeks",
        "display_name": "Greeks",
        "description": "Delta, gamma, theta, vega, and higher-order sensitivities in option pricing.",
        "icon": "sliders",
        "prerequisites": ["iv_analysis"],
        "position_x": 100.0,
        "position_y": 150.0,
        "tier": 2,
    },
    {
        "category": "order_flow",
        "display_name": "Order Flow",
        "description": "Reading tape, dark pools, and the impact of institutional order flow on price.",
        "icon": "activity",
        "prerequisites": ["realized_vol"],
        "position_x": 400.0,
        "position_y": 150.0,
        "tier": 2,
    },
    {
        "category": "technical_analysis",
        "display_name": "Technical Analysis",
        "description": "Chart patterns, momentum indicators, and price action in volatile markets.",
        "icon": "line-chart",
        "prerequisites": ["realized_vol"],
        "position_x": 600.0,
        "position_y": 150.0,
        "tier": 2,
    },
    {
        "category": "sentiment",
        "display_name": "Sentiment",
        "description": "Market sentiment indicators, put/call ratios, and behavioral signals.",
        "icon": "thermometer",
        "prerequisites": ["fundamentals"],
        "position_x": 800.0,
        "position_y": 150.0,
        "tier": 2,
    },
    {
        "category": "macro",
        "display_name": "Macro",
        "description": "Interest rates, central bank policy, FX, and macro regime analysis.",
        "icon": "globe",
        "prerequisites": ["fundamentals"],
        "position_x": 1000.0,
        "position_y": 150.0,
        "tier": 2,
    },

    # ── Tier 3: Specialization ───────────────────────────────────────────────
    {
        "category": "skew",
        "display_name": "Skew",
        "description": "Volatility skew dynamics, risk reversal pricing, and skew trading strategies.",
        "icon": "arrow-up-right",
        "prerequisites": ["greeks"],
        "position_x": 0.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "term_structure",
        "display_name": "Term Structure",
        "description": "VIX futures term structure, roll yield, and calendar spread strategies.",
        "icon": "calendar",
        "prerequisites": ["greeks"],
        "position_x": 150.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "event_vol",
        "display_name": "Event Volatility",
        "description": "Earnings, macro events, and binary event pricing in options markets.",
        "icon": "zap",
        "prerequisites": ["greeks"],
        "position_x": 300.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "tail_risk",
        "display_name": "Tail Risk",
        "description": "Fat tails, black swans, and strategies for hedging extreme outcomes.",
        "icon": "alert-triangle",
        "prerequisites": ["greeks"],
        "position_x": 450.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "correlation",
        "display_name": "Correlation",
        "description": "Cross-asset correlation, dispersion trading, and correlation breakdowns.",
        "icon": "git-merge",
        "prerequisites": ["order_flow"],
        "position_x": 550.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "microstructure",
        "display_name": "Microstructure",
        "description": "Market microstructure, bid-ask dynamics, and latency arbitrage.",
        "icon": "cpu",
        "prerequisites": ["order_flow"],
        "position_x": 680.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "seasonality",
        "display_name": "Seasonality",
        "description": "Seasonal patterns in volatility, commodities, and equity markets.",
        "icon": "repeat",
        "prerequisites": ["technical_analysis"],
        "position_x": 780.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "geopolitical",
        "display_name": "Geopolitical Risk",
        "description": "Political risk, sanctions, and geopolitical event impact on markets.",
        "icon": "flag",
        "prerequisites": ["sentiment"],
        "position_x": 900.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "fixed_income",
        "display_name": "Fixed Income",
        "description": "Yield curves, duration, convexity, and rates options strategies.",
        "icon": "percent",
        "prerequisites": ["macro"],
        "position_x": 1000.0,
        "position_y": 300.0,
        "tier": 3,
    },
    {
        "category": "commodities",
        "display_name": "Commodities",
        "description": "Energy, metals, and agricultural commodity derivatives and vol dynamics.",
        "icon": "package",
        "prerequisites": ["macro"],
        "position_x": 1100.0,
        "position_y": 300.0,
        "tier": 3,
    },

    # ── Tier 4: Advanced / Expert ────────────────────────────────────────────
    {
        "category": "vol_surface",
        "display_name": "Vol Surface",
        "description": "Full volatility surface construction, SVI, and arbitrage-free models.",
        "icon": "layers",
        "prerequisites": ["skew"],
        "position_x": 0.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "trade_structuring",
        "display_name": "Trade Structuring",
        "description": "Multi-leg option structures: spreads, condors, strangles, and custom payoffs.",
        "icon": "tool",
        "prerequisites": ["term_structure"],
        "position_x": 150.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "risk_management",
        "display_name": "Risk Management",
        "description": "Portfolio-level risk limits, VaR, scenario analysis, and drawdown control.",
        "icon": "shield",
        "prerequisites": ["tail_risk"],
        "position_x": 300.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "position_sizing",
        "display_name": "Position Sizing",
        "description": "Kelly criterion, volatility-adjusted sizing, and portfolio heat management.",
        "icon": "maximize-2",
        "prerequisites": ["correlation"],
        "position_x": 450.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "crypto",
        "display_name": "Crypto",
        "description": "Crypto derivatives, perpetual swaps, funding rates, and DeFi volatility.",
        "icon": "hash",
        "prerequisites": ["microstructure"],
        "position_x": 600.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "alt_data",
        "display_name": "Alt Data",
        "description": "Alternative data sources: satellite, credit card, NLP signals in trading.",
        "icon": "database",
        "prerequisites": ["seasonality"],
        "position_x": 750.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "exotic_structures",
        "display_name": "Exotic Structures",
        "description": "Barrier options, variance swaps, cliquets, and structured product design.",
        "icon": "star",
        "prerequisites": ["vol_surface"],
        "position_x": 900.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "portfolio_mgmt",
        "display_name": "Portfolio Management",
        "description": "Multi-strategy portfolio construction, allocation, and performance attribution.",
        "icon": "briefcase",
        "prerequisites": ["position_sizing"],
        "position_x": 1000.0,
        "position_y": 500.0,
        "tier": 4,
    },
    {
        "category": "pit_tooling",
        "display_name": "Pit Tooling",
        "description": "Options analytics platforms, real-time risk systems, and desk workflow tools.",
        "icon": "settings",
        "prerequisites": ["risk_management"],
        "position_x": 1100.0,
        "position_y": 500.0,
        "tier": 4,
    },
]


async def seed_skill_tree(db: AsyncSession) -> int:
    """Insert default SkillNode rows that do not yet exist (by category where org_id IS NULL).

    Returns the count of newly inserted nodes.
    """
    existing = set(
        (await db.execute(
            select(SkillNode.category).where(SkillNode.org_id == None)  # noqa: E711
        )).scalars().all()
    )

    inserted = 0
    for node_data in _NODES:
        if node_data["category"] in existing:
            continue
        node = SkillNode(
            org_id=None,
            category=node_data["category"],
            display_name=node_data["display_name"],
            description=node_data["description"],
            icon=node_data["icon"],
            prerequisites=node_data["prerequisites"],
            position_x=node_data["position_x"],
            position_y=node_data["position_y"],
            tier=node_data["tier"],
            is_hidden=False,
        )
        db.add(node)
        inserted += 1

    if inserted:
        await db.commit()
    return inserted
