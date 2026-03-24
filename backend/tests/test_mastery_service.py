"""Tests for mastery_service computation functions."""
import pytest
from app.services.mastery_service import compute_mastery_level, apply_decay


def test_compute_mastery_basic():
    """10 scores of 4.0 → 80.0 (4.0 * 20 = 80)."""
    scores = [4.0] * 10
    result = compute_mastery_level(scores)
    assert abs(result - 80.0) < 0.01


def test_compute_mastery_recency_bias():
    """Recency bias: same average score but placed at end weights higher than start.

    Uniform scores both give avg*20 regardless of position, but when comparing
    a low-recent vs high-recent set with the same simple average, the high-recent
    set must score higher due to recency weighting.
    """
    # 15 scores: 10 old low scores (outside the window) + 5 recent high scores
    # The window takes the last 10, so: 5 old-low (1.0) + 5 recent-high (5.0)
    # With recency weighting the 5.0s at the end are weighted more → result > simple avg
    scores = [1.0] * 10 + [5.0] * 5
    result = compute_mastery_level(scores)
    # Simple avg of last 10 = (5*1.0 + 5*5.0)/10 = 3.0 → 60.0
    # With recency bias, the 5.0s at positions 5-9 get higher weights → above 60
    simple_avg_result = 3.0 * 20.0
    assert result > simple_avg_result, f"Recency bias should push result above {simple_avg_result}, got {result}"
    # Also verify the scores themselves: old low outside window shouldn't count
    # Last 10 are: [1,1,1,1,1,5,5,5,5,5] with recency on the 5s
    assert result > 60.0, f"Expected > 60, got {result}"


def test_compute_mastery_empty():
    """Empty score list → 0.0."""
    assert compute_mastery_level([]) == 0.0


def test_apply_decay():
    """80.0 mastery after 1 week of inactivity → ~76.0 (5% decay)."""
    result = apply_decay(80.0, 80.0, 1)
    expected = 80.0 * 0.95
    assert abs(result - expected) < 0.01, f"Expected ~{expected}, got {result}"


def test_apply_decay_floor():
    """80.0 mastery after 50 weeks → floor at 40.0 (50% of peak=80)."""
    result = apply_decay(80.0, 80.0, 50)
    assert abs(result - 40.0) < 0.01, f"Expected 40.0, got {result}"
