"""Mastery-gated progression system."""
from app.constants import (
    LEVEL_UNLOCKS,
    MASTERY_THRESHOLD,
    MASTERY_SCENARIO_COUNT,
    LEVEL_TITLES,
    CategoryTier,
)


def get_unlocked_categories(level: int) -> set[CategoryTier]:
    """Return all category/difficulty pairs unlocked at a given level."""
    unlocked = set()
    for lvl in range(1, level + 1):
        for ct in LEVEL_UNLOCKS.get(lvl, []):
            unlocked.add(ct)
    return unlocked


def check_mastery(scores: list[float]) -> bool:
    """Check if a list of scores meets mastery requirements."""
    if len(scores) < MASTERY_SCENARIO_COUNT:
        return False
    recent = scores[-MASTERY_SCENARIO_COUNT:]
    return (sum(recent) / len(recent)) >= MASTERY_THRESHOLD


def compute_level(masteries: set[tuple[str, str]]) -> int:
    """Compute the highest level achieved given a set of mastered category/difficulty pairs."""
    level = 1
    for lvl in range(2, 11):
        required = LEVEL_UNLOCKS.get(lvl, [])
        if not required:
            continue
        prev_unlocks = set()
        for prev_lvl in range(1, lvl):
            for ct in LEVEL_UNLOCKS.get(prev_lvl, []):
                prev_unlocks.add((ct.category, ct.difficulty))
        if prev_unlocks.issubset(masteries):
            level = lvl
        else:
            break
    return level


def get_level_title(level: int) -> str:
    return LEVEL_TITLES.get(level, f"Level {level}")
