from app.services.progression import (
    get_unlocked_categories,
    check_mastery,
    compute_level,
    _prerequisites_met,
)
from app.constants import CategoryTier


def test_level_1_unlocks():
    unlocked = get_unlocked_categories(level=1)
    assert CategoryTier("iv_analysis", "beginner") in unlocked
    assert CategoryTier("realized_vol", "beginner") in unlocked
    assert CategoryTier("fundamentals", "beginner") in unlocked
    assert CategoryTier("greeks", "beginner") not in unlocked


def test_level_3_unlocks():
    unlocked = get_unlocked_categories(level=3)
    assert CategoryTier("iv_analysis", "beginner") in unlocked
    assert CategoryTier("greeks", "beginner") in unlocked
    assert CategoryTier("order_flow", "beginner") in unlocked
    assert CategoryTier("iv_analysis", "intermediate") in unlocked
    assert CategoryTier("technical_analysis", "beginner") in unlocked
    assert CategoryTier("sentiment", "beginner") in unlocked
    assert CategoryTier("macro", "beginner") in unlocked


def test_check_mastery_not_enough_scenarios():
    scores = [4.0, 4.0, 4.0]
    assert check_mastery(scores) is False


def test_check_mastery_below_threshold():
    scores = [3.0, 3.0, 3.0, 3.0, 3.0]
    assert check_mastery(scores) is False


def test_check_mastery_passes():
    scores = [4.0, 3.5, 4.5, 3.5, 4.0]
    assert check_mastery(scores) is True


def test_compute_level_from_masteries():
    # Level 1 has iv_analysis, realized_vol, fundamentals (beginner).
    # Level 2 has greeks, order_flow (beginner) + iv_analysis (intermediate).
    # Mastering all of level 1+2 unlocks level 3.
    masteries = {
        ("iv_analysis", "beginner"),
        ("realized_vol", "beginner"),
        ("fundamentals", "beginner"),
        ("greeks", "beginner"),
        ("order_flow", "beginner"),
        ("iv_analysis", "intermediate"),
    }
    assert compute_level(masteries) == 3


def test_compute_level_no_masteries():
    assert compute_level(set()) == 1


def test_prerequisites_met_foundation():
    assert _prerequisites_met("iv_analysis", set()) is True
    assert _prerequisites_met("realized_vol", set()) is True
    assert _prerequisites_met("fundamentals", set()) is True


def test_prerequisites_met_child_needs_parent():
    assert _prerequisites_met("greeks", set()) is False
    assert _prerequisites_met("greeks", {"iv_analysis"}) is True


def test_prerequisites_met_deep_chain():
    # exotic_structures ← vol_surface ← skew ← greeks ← iv_analysis
    assert _prerequisites_met("exotic_structures", set()) is False
    assert _prerequisites_met("exotic_structures", {"vol_surface"}) is False
    assert _prerequisites_met("exotic_structures", {"vol_surface", "skew"}) is False
    assert _prerequisites_met(
        "exotic_structures", {"vol_surface", "skew", "greeks", "iv_analysis"}
    ) is True
