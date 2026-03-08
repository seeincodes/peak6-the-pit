"""Tests for MCQ grading service."""
import pytest
from app.services.grading_agent import compute_mcq_xp


def test_mcq_xp_correct_good_no_streak():
    assert compute_mcq_xp(True, "good", 0) == 8


def test_mcq_xp_correct_good_with_streak():
    assert compute_mcq_xp(True, "good", 3) == 8 + 6  # 8 + 3*2


def test_mcq_xp_correct_good_max_streak():
    assert compute_mcq_xp(True, "good", 10) == 8 + 8  # capped at 8


def test_mcq_xp_correct_weak_no_streak():
    assert compute_mcq_xp(True, "weak", 0) == 5


def test_mcq_xp_correct_weak_with_streak():
    assert compute_mcq_xp(True, "weak", 3) == 5 + 3  # 5 + 3*1


def test_mcq_xp_wrong():
    assert compute_mcq_xp(False, "good", 5) == 1
    assert compute_mcq_xp(False, "weak", 0) == 1
