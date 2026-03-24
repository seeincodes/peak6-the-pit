"""Badge catalog seed data."""

from app.constants import SCENARIO_CATEGORIES

BADGE_CATALOG = [
    # Milestone badges
    {"slug": "first_steps", "name": "First Steps", "description": "Complete your first scenario", "icon": "footprints", "category": "milestone", "tier": "bronze", "sort_order": 1},
    {"slug": "rising_star", "name": "Rising Star", "description": "Reach Level 3", "icon": "star", "category": "milestone", "tier": "bronze", "sort_order": 2},
    {"slug": "veteran", "name": "Veteran", "description": "Reach Level 7", "icon": "medal", "category": "milestone", "tier": "silver", "sort_order": 3},
    {"slug": "desk_head", "name": "Desk Head", "description": "Reach Level 10", "icon": "crown", "category": "milestone", "tier": "gold", "sort_order": 4},
    {"slug": "century_club", "name": "Century Club", "description": "Accumulate 100 XP", "icon": "gem", "category": "milestone", "tier": "bronze", "sort_order": 5},
    {"slug": "xp_thousandaire", "name": "XP Thousandaire", "description": "Accumulate 1,000 XP", "icon": "trophy", "category": "milestone", "tier": "silver", "sort_order": 6},
    {"slug": "xp_legend", "name": "XP Legend", "description": "Accumulate 3,000 XP", "icon": "sparkles", "category": "milestone", "tier": "gold", "sort_order": 7},
    # Activity badges
    {"slug": "on_fire", "name": "On Fire", "description": "Maintain a 7-day streak", "icon": "flame", "category": "activity", "tier": "bronze", "sort_order": 20},
    {"slug": "unstoppable", "name": "Unstoppable", "description": "Maintain a 30-day streak", "icon": "rocket", "category": "activity", "tier": "silver", "sort_order": 21},
    {"slug": "quick_draw", "name": "Quick Draw", "description": "Complete 10 Quick Fire rounds", "icon": "zap", "category": "activity", "tier": "bronze", "sort_order": 22},
    {"slug": "sharpshooter", "name": "Sharpshooter", "description": "Get 5 correct Quick Fires in a row", "icon": "target", "category": "activity", "tier": "silver", "sort_order": 23},
    {"slug": "perfectionist", "name": "Perfectionist", "description": "Score 5/5 on any scenario", "icon": "award", "category": "activity", "tier": "gold", "sort_order": 24},
]

# Event badges
BADGE_CATALOG += [
    {"slug": "event_warrior", "name": "Event Warrior", "description": "Complete 5 events", "icon": "calendar", "category": "events", "tier": "silver", "sort_order": 20},
    {"slug": "event_champion", "name": "Event Champion", "description": "Finish top 3 in any event", "icon": "trophy", "category": "events", "tier": "gold", "sort_order": 21},
]

# Skill tree badges
BADGE_CATALOG += [
    {"slug": "tree_climber", "name": "Tree Climber", "description": "Master 5 skill tree nodes", "icon": "git-branch", "category": "skills", "tier": "silver", "sort_order": 22},
    {"slug": "full_canopy", "name": "Full Canopy", "description": "Master all Tier 1 nodes", "icon": "tree-pine", "category": "skills", "tier": "gold", "sort_order": 23},
]

# Mentorship badges
BADGE_CATALOG += [
    {"slug": "sherpa", "name": "Sherpa", "description": "Mentor 3 mentees to goal completion", "icon": "heart", "category": "mentorship", "tier": "gold", "sort_order": 24},
    {"slug": "guided", "name": "Guided", "description": "Complete all mentorship goals", "icon": "compass", "category": "mentorship", "tier": "silver", "sort_order": 25},
]

# Mastery badges — one per category
for i, cat in enumerate(SCENARIO_CATEGORIES):
    display = cat.replace("_", " ").title()
    BADGE_CATALOG.append({
        "slug": f"master_{cat}",
        "name": f"{display} Master",
        "description": f"Master {display} at advanced difficulty",
        "icon": "brain",
        "category": "mastery",
        "tier": "gold",
        "sort_order": 100 + i,
    })
