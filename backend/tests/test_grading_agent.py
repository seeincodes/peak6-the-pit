import json
from app.services.grading_agent import parse_grade_json, parse_probe_json, compute_xp


def test_parse_grade_json():
    raw = json.dumps({
        "dimension_scores": {"reasoning": 4, "terminology": 3, "trade_logic": 4, "risk_awareness": 3},
        "overall_score": 3.7,
        "feedback": "Good analysis but improve risk discussion.",
        "confidence": 0.85,
    })
    result = parse_grade_json(raw)
    assert result["overall_score"] == 3.7
    assert result["dimension_scores"]["reasoning"] == 4


def test_parse_probe_json():
    raw = json.dumps({
        "probe_question": "Why that strike?",
        "probe_rationale": "Testing delta understanding",
    })
    result = parse_probe_json(raw)
    assert "strike" in result["probe_question"]


def test_compute_xp_beginner():
    # base = int(50 * 1.0 * 0.8) = 40, no_hints_bonus = 10 -> 50
    xp = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0)
    assert xp == 40 + 10  # base + no_hints_bonus


def test_compute_xp_intermediate_with_streak():
    # base = int(50 * 1.5 * 1.0) = 75, streak = min(3*5, 50) = 15
    # perfect_bonus = 25 (score 5.0 >= 4.5), no_hints_bonus = 10
    xp = compute_xp(overall_score=5.0, difficulty="intermediate", streak_days=3)
    assert xp == 75 + 15 + 25 + 10  # base + streak + perfect + no_hints


def test_compute_xp_with_hints_penalty():
    # No hints: base = int(50 * 1.0 * 0.8) = 40, no_hints_bonus = 10 -> 50
    xp_no_hints = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=0)
    assert xp_no_hints == 50

    # 1 hint: base = int(40 * 0.80) = 32, no no_hints_bonus -> 32
    xp_one_hint = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=1)
    assert xp_one_hint == 32

    # 2 hints: base = int(40 * 0.60) = 24 -> 24
    xp_two_hints = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=2)
    assert xp_two_hints == 24

    # minimum 5 XP even with max hints (capped at 80% penalty)
    xp_max = compute_xp(overall_score=1.0, difficulty="beginner", streak_days=0, hints_used=5)
    assert xp_max >= 5


def test_compute_xp_perfect_score_bonus():
    # Score 4.5+ triggers perfect bonus of 25
    xp_perfect = compute_xp(overall_score=4.5, difficulty="beginner", streak_days=0)
    xp_not_perfect = compute_xp(overall_score=4.4, difficulty="beginner", streak_days=0)
    assert xp_perfect > xp_not_perfect
    # Perfect: base=int(50*0.9)=45 + perfect=25 + no_hints=10 = 80
    assert xp_perfect == 80


def test_compute_xp_daily_first_bonus():
    xp_first = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, is_daily_first=True)
    xp_not_first = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, is_daily_first=False)
    assert xp_first == xp_not_first + 25  # DAILY_FIRST_SCENARIO_BONUS


def test_compute_xp_all_bonuses():
    # Perfect beginner, no hints, 10-day streak, daily first
    xp = compute_xp(overall_score=5.0, difficulty="beginner", streak_days=10, is_daily_first=True)
    # base=50, streak=50, perfect=25, no_hints=10, daily=25 = 160
    assert xp == 160
