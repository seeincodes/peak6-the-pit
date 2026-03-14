"""Tests for constants and configuration."""
from app.constants import (
    CategoryTier,
    LEVEL_TITLES,
    LEVEL_UNLOCKS,
    MASTERY_THRESHOLD,
    MASTERY_SCENARIO_COUNT,
    DIFFICULTY_MULTIPLIER,
    SCENARIO_CATEGORIES,
    MCQ_XP_CORRECT_GOOD,
    MCQ_XP_CORRECT_WEAK,
    MCQ_XP_WRONG_WEAK,
)


def test_category_tier():
    ct = CategoryTier("iv_analysis", "beginner")
    assert ct.category == "iv_analysis"
    assert ct.difficulty == "beginner"
    assert ct == CategoryTier("iv_analysis", "beginner")


def test_level_titles():
    assert LEVEL_TITLES[1] == "Initiate"
    assert LEVEL_TITLES[10] == "Desk Head"
    assert len(LEVEL_TITLES) == 10


def test_level_unlocks_level_1():
    unlocks = LEVEL_UNLOCKS[1]
    assert CategoryTier("iv_analysis", "beginner") in unlocks
    assert CategoryTier("realized_vol", "beginner") in unlocks
    assert CategoryTier("fundamentals", "beginner") in unlocks
    assert len(unlocks) == 3


def test_level_unlocks_level_2():
    unlocks = LEVEL_UNLOCKS[2]
    assert CategoryTier("greeks", "beginner") in unlocks
    assert CategoryTier("order_flow", "beginner") in unlocks
    assert CategoryTier("iv_analysis", "intermediate") in unlocks
    assert len(unlocks) == 3


def test_mastery_constants():
    assert MASTERY_THRESHOLD == 3.5
    assert MASTERY_SCENARIO_COUNT == 5


def test_difficulty_multiplier():
    assert DIFFICULTY_MULTIPLIER["beginner"] == 1.0
    assert DIFFICULTY_MULTIPLIER["intermediate"] == 1.5
    assert DIFFICULTY_MULTIPLIER["advanced"] == 2.0


def test_scenario_categories():
    assert "iv_analysis" in SCENARIO_CATEGORIES
    assert "pit_tooling" in SCENARIO_CATEGORIES
    assert len(SCENARIO_CATEGORIES) == 27


def test_mcq_xp_constants():
    assert MCQ_XP_CORRECT_GOOD == 20
    assert MCQ_XP_CORRECT_WEAK == 12
    assert MCQ_XP_WRONG_WEAK == 3
