from app.prompts.prompt_builder import get_category_display, get_genre_guidance


def test_get_category_display_known_category():
    assert get_category_display("iv_analysis") == "Implied Volatility Analysis"


def test_get_category_display_unknown_category():
    assert get_category_display("my_custom_genre") == "My Custom Genre"


def test_get_genre_guidance_known_category():
    text = get_genre_guidance("macro", "scenario")
    assert "rate" in text.lower() or "yield" in text.lower()


def test_get_genre_guidance_default_fallback():
    text = get_genre_guidance("my_custom_genre", "mcq")
    assert "distractors" in text.lower()
