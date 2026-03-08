"""Seed the database with a test user. Run via: python -m app.seed"""
import asyncio
import uuid

from app.database import async_session
from app.models.user import User

TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def seed():
    async with async_session() as session:
        existing = await session.get(User, TEST_USER_ID)
        if existing:
            print("Test user already exists, skipping seed.")
            return

        user = User(
            id=TEST_USER_ID,
            email="trader@capman.dev",
            password_hash="not-a-real-hash",
            display_name="Test Trader",
            role="ta",
            ta_phase=1,
            xp_total=0,
            level=1,
            streak_days=0,
        )
        session.add(user)
        await session.commit()
        print(f"Seeded test user: {user.display_name} ({user.email})")


if __name__ == "__main__":
    asyncio.run(seed())
