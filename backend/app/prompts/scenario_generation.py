"""Prompt templates for scenario generation."""

SYSTEM_PROMPT = """You are CapMan AI, a trading scenario generator for options trading training.

You create realistic options trading scenarios that test a trader's analytical reasoning. Each scenario must:
- Be grounded in real market dynamics (not textbook toy problems)
- Use proper CapMan/options market terminology
- Require multi-step reasoning to answer well
- Have a clear analytical framework for evaluation

You output JSON only. No markdown, no commentary outside the JSON."""

SCENARIO_TEMPLATE = """Generate a {difficulty} difficulty trading scenario in the category: {category_display}.

Use the following context from the Volatility Trading Data Framework to ground the scenario:

<context>
{rag_context}
</context>

Output a JSON object with exactly these fields:
{{
  "title": "Short descriptive title (5-10 words)",
  "setup": "Market context paragraph (3-5 sentences describing the current market state, data points, and relevant observations)",
  "question": "The specific analytical question the trader must answer (1-2 sentences)",
  "hints": ["hint1", "hint2"],
  "expected_dimensions": ["which rubric dimensions this scenario primarily tests"]
}}

Difficulty guidelines:
- beginner: Single concept, explicit data, straightforward analysis
- intermediate: Multiple concepts interact, some data must be inferred, requires trade-offs
- advanced: Complex multi-factor analysis, ambiguous data, multiple valid approaches"""

CATEGORY_DISPLAY = {
    "iv_analysis": "Implied Volatility Analysis",
    "realized_vol": "Realized (Historical) Volatility",
    "greeks": "Options Greeks Interpretation",
    "order_flow": "Order Flow Analysis",
    "macro": "Macroeconomic Indicators",
    "term_structure": "Volatility Term Structure",
    "skew": "Implied Volatility Skew",
    "correlation": "Correlation & Relative Value",
    "event_vol": "Event-Driven Volatility",
    "tail_risk": "Tail Risk & Extremes",
    "position_sizing": "Position Sizing",
    "trade_structuring": "Trade Structuring",
    "vol_surface": "Volatility Surface",
    "microstructure": "Market Microstructure",
    "risk_management": "Risk Management",
    "capman_tooling": "CapMan Tooling (Atlas)",
    "sentiment": "Sentiment & Behavioral Data",
    "technical_analysis": "Technical Analysis & Price Action",
    "fixed_income": "Interest Rate & Fixed Income",
    "seasonality": "Seasonality & Time-Based Data",
    "exotic_structures": "Exotic & Structural Data",
    "fundamentals": "Fundamental Equity Data",
    "commodities": "Commodity & Energy Data",
    "crypto": "Cryptographic Asset Data",
    "geopolitical": "Global Political & Legal Data",
    "alt_data": "Alternative Data & Big Data",
    "portfolio_mgmt": "Portfolio Management Metrics",
}
