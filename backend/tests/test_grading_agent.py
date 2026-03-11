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
    xp = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0)
    assert xp == int(20 * 1.0 * (4.0 / 5.0))


def test_compute_xp_intermediate_with_streak():
    xp = compute_xp(overall_score=5.0, difficulty="intermediate", streak_days=3)
    base = int(20 * 1.5 * (5.0 / 5.0))
    streak_bonus = min(3 * 2, 20)
    assert xp == base + streak_bonus


def test_compute_xp_with_hints_penalty():
    xp_no_hints = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=0)
    xp_one_hint = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=1)
    xp_two_hints = compute_xp(overall_score=4.0, difficulty="beginner", streak_days=0, hints_used=2)
    # 1 hint = 20% penalty, 2 hints = 40% penalty
    assert xp_one_hint == int(xp_no_hints * 0.80)
    assert xp_two_hints == int(xp_no_hints * 0.60)
    # minimum 1 XP even with max hints
    xp_max = compute_xp(overall_score=1.0, difficulty="beginner", streak_days=0, hints_used=5)
    assert xp_max >= 1
