from app.services.progression import (
    get_unlocked_categories,
    check_mastery,
    compute_level,
)
from app.constants import CategoryTier


def test_level_1_unlocks():
    unlocked = get_unlocked_categories(level=1)
    assert CategoryTier("iv_analysis", "beginner") in unlocked
    assert CategoryTier("greeks", "beginner") not in unlocked


def test_level_3_unlocks():
    unlocked = get_unlocked_categories(level=3)
    assert CategoryTier("iv_analysis", "beginner") in unlocked
    assert CategoryTier("greeks", "beginner") in unlocked
    assert CategoryTier("order_flow", "beginner") in unlocked
    assert CategoryTier("iv_analysis", "intermediate") in unlocked


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
    # Need all level 1 unlocks (iv_analysis + realized_vol beginner) to reach level 2,
    # plus all level 2 unlocks (greeks beginner, iv_analysis intermediate, fundamentals beginner) to reach level 3
    masteries = {
        ("iv_analysis", "beginner"),
        ("realized_vol", "beginner"),
        ("greeks", "beginner"),
        ("iv_analysis", "intermediate"),
        ("fundamentals", "beginner"),
    }
    assert compute_level(masteries) == 3


def test_compute_level_no_masteries():
    assert compute_level(set()) == 1
