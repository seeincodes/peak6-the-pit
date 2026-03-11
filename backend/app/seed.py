"""Seed the database with test users. Run via: python -m app.seed"""
import asyncio
import os
import uuid

from app.database import async_session
from app.models.user import User
from app.services.auth import hash_password

# Stable UUIDs for test users
TEST_USERS = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "email": "trader@capman.dev",
        "password": "trader123",
        "display_name": "Test Trader",
        "role": "ta",
        "ta_phase": 1,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000002"),
        "email": "alex@capman.dev",
        "password": "alex123",
        "display_name": "Alex Chen",
        "role": "ta",
        "ta_phase": 2,
        "xp_total": 3125,
        "level": 4,
        "streak_days": 5,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
        "email": "maria@capman.dev",
        "password": "maria123",
        "display_name": "Maria Santos",
        "role": "ta",
        "ta_phase": 3,
        "xp_total": 7000,
        "level": 7,
        "streak_days": 12,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000004"),
        "email": "james@capman.dev",
        "password": "james123",
        "display_name": "James Kim",
        "role": "intern",
        "ta_phase": None,
        "xp_total": 1125,
        "level": 3,
        "streak_days": 2,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000005"),
        "email": "priya@capman.dev",
        "password": "priya123",
        "display_name": "Priya Patel",
        "role": "ta",
        "ta_phase": 4,
        "xp_total": 8000,
        "level": 10,
        "streak_days": 15,
    },
]

PROD_USERS = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000010"),
        "email": "demo@capman.dev",
        "password": "demo2026",
        "display_name": "Demo Trader",
        "role": "ta",
        "ta_phase": 1,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000011"),
        "email": "admin@capman.dev",
        "password": "admin2026",
        "display_name": "Admin User",
        "role": "admin",
        "ta_phase": None,
        "xp_total": 0,
        "level": 1,
        "streak_days": 0,
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000012"),
        "email": "advanced@capman.dev",
        "password": "advanced2026",
        "display_name": "Advanced Demo",
        "role": "ta",
        "ta_phase": 4,
        "xp_total": 8750,
        "level": 10,
        "streak_days": 21,
    },
]

# Keep backward compat for any imports
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def seed():
    is_prod = os.environ.get("SEED_PROD", "").lower() in ("true", "1", "yes")
    users_to_seed = PROD_USERS if is_prod else TEST_USERS

    async with async_session() as session:
        for user_data in users_to_seed:
            existing = await session.get(User, user_data["id"])
            if existing:
                print(f"  User {user_data['display_name']} already exists, skipping.")
                continue

            user = User(
                id=user_data["id"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                display_name=user_data["display_name"],
                role=user_data["role"],
                ta_phase=user_data["ta_phase"],
                xp_total=user_data["xp_total"],
                level=user_data["level"],
                streak_days=user_data["streak_days"],
            )
            session.add(user)
            print(f"  Seeded: {user.display_name} ({user.email})")

        await session.commit()

    env = "production" if is_prod else "development"
    print(f"Seed complete ({env}): {len(users_to_seed)} users")


if __name__ == "__main__":
    asyncio.run(seed())
