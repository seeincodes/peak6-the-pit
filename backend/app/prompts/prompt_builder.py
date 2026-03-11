"""Prompt-building utilities for genre/category-specific guidance."""
from __future__ import annotations

from typing import Literal

from app.prompts.scenario_generation import CATEGORY_DISPLAY

PromptKind = Literal["scenario", "mcq"]


GENRE_GUIDANCE: dict[str, dict[PromptKind, str]] = {
    "iv_analysis": {
        "scenario": "Emphasize IV rank/percentile, realized-vs-implied spread, and catalyst timing.",
        "mcq": "Test IV rank interpretation and when rich/cheap implied vol changes trade selection.",
    },
    "order_flow": {
        "scenario": "Include unusual activity, volume-vs-open-interest context, and execution nuance.",
        "mcq": "Probe whether flow is informed hedging/speculation and what confirmations are needed.",
    },
    "macro": {
        "scenario": "Tie rate/yield/inflation data to volatility regime and cross-asset implications.",
        "mcq": "Test first-order and second-order effects of macro releases on options positioning.",
    },
    "risk_management": {
        "scenario": "Center position sizing, stop logic, scenario stress, and tail-risk controls.",
        "mcq": "Assess risk-reward asymmetry, downside containment, and hedge trade-offs.",
    },
    "technical_analysis": {
        "scenario": "Use concrete levels/structure and how they inform strike/tenor selection.",
        "mcq": "Focus on translating chart structure into options structure and risk placement.",
    },
}


DEFAULT_GENRE_GUIDANCE = {
    "scenario": "Use concrete market observations, explicit trade-offs, and clear risk framing.",
    "mcq": "Use plausible distractors that reflect common reasoning mistakes in this category.",
}


def get_category_display(category: str) -> str:
    return CATEGORY_DISPLAY.get(category, category.replace("_", " ").title())


def get_genre_guidance(category: str, kind: PromptKind) -> str:
    category_guidance = GENRE_GUIDANCE.get(category)
    if category_guidance and category_guidance.get(kind):
        return category_guidance[kind]
    return DEFAULT_GENRE_GUIDANCE[kind]

