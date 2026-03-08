"""Tests for leaderboard utilities."""
from app.routers.leaderboard import _start_of_week


def test_start_of_week_is_monday():
    result = _start_of_week()
    assert result.weekday() == 0  # Monday
    assert result.hour == 0
    assert result.minute == 0
