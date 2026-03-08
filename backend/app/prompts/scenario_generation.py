"""Prompt templates for scenario generation."""

SYSTEM_PROMPT = """You are CapMan AI, a trading scenario generator for PEAK6 Capital Management's Trading Associate program.

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
    "greeks": "Options Greeks Interpretation",
    "order_flow": "Order Flow Analysis",
    "macro": "Macroeconomic Indicators",
    "term_structure": "Volatility Term Structure",
    "skew": "Implied Volatility Skew",
    "correlation": "Correlation & Dispersion",
    "event_vol": "Event Volatility",
    "tail_risk": "Tail Risk",
    "position_sizing": "Position Sizing",
    "trade_structuring": "Trade Structuring",
    "vol_surface": "Volatility Surface",
    "microstructure": "Market Microstructure",
    "risk_management": "Risk Management",
    "capman_tooling": "CapMan Tooling (Atlas)",
}
