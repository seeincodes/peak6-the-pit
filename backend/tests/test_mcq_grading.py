"""Tests for MCQ grading service."""
from app.services.grading_agent import compute_mcq_xp


def test_mcq_xp_correct_good_no_streak():
    assert compute_mcq_xp(True, "good", 0) == 20


def test_mcq_xp_correct_good_with_streak():
    assert compute_mcq_xp(True, "good", 3) == 20 + 15  # 20 + 3*5


def test_mcq_xp_correct_good_max_streak():
    assert compute_mcq_xp(True, "good", 10) == 20 + 25  # capped at 25


def test_mcq_xp_correct_weak_no_streak():
    assert compute_mcq_xp(True, "weak", 0) == 12


def test_mcq_xp_correct_weak_with_streak():
    assert compute_mcq_xp(True, "weak", 3) == 12 + 6  # 12 + 3*2


def test_mcq_xp_wrong():
    assert compute_mcq_xp(False, "good", 5) == 8  # MCQ_XP_WRONG_GOOD
    assert compute_mcq_xp(False, "weak", 0) == 3  # MCQ_XP_WRONG_WEAK


def test_mcq_xp_daily_first_correct():
    xp = compute_mcq_xp(True, "good", 0, is_daily_first=True)
    assert xp == 20 + 15  # base + daily first bonus


def test_mcq_xp_daily_first_wrong():
    xp = compute_mcq_xp(False, "weak", 0, is_daily_first=True)
    assert xp == 3 + 15  # wrong_weak + daily first bonus
