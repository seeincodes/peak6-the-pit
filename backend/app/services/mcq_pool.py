"""MCQ pool backed by the persistent mcq_bank table.

Serves MCQs from the database bank (least-served first). Falls back to
live AI generation if the bank is empty for a given slot, and saves the
result back to the bank for future requests.
"""
import asyncio

from sqlalchemy import select, update

from app.database import async_session
from app.models.mcq_bank import MCQBank
from app.services.scenario_engine import generate_mcq


async def get_from_pool(category: str, difficulty: str) -> dict | None:
    """Pull least-served MCQ from the bank. Returns full mcq_data dict or None."""
    async with async_session() as db:
        result = await db.execute(
            select(MCQBank)
            .where(MCQBank.category == category, MCQBank.difficulty == difficulty)
            .order_by(MCQBank.times_served, MCQBank.created_at)
            .limit(1)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None

        await db.execute(
            update(MCQBank)
            .where(MCQBank.id == row.id)
            .values(times_served=MCQBank.times_served + 1)
        )
        await db.commit()

        return {
            "category": category,
            "difficulty": difficulty,
            "content": row.content,
            "context_chunks": [],
        }


async def refill(category: str, difficulty: str) -> None:
    """Generate one MCQ via AI and save it to the bank for future use."""
    try:
        async with async_session() as db:
            mcq_data = await generate_mcq(db, category, difficulty)
            content = mcq_data.get("content")
            if content:
                db.add(MCQBank(category=category, difficulty=difficulty, content=content))
                await db.commit()
    except Exception:
        pass


def spawn_refill(category: str, difficulty: str) -> None:
    """Spawn background task to generate and bank one MCQ."""
    asyncio.create_task(refill(category, difficulty))


async def prewarm(categories: list[tuple[str, str]]) -> None:
    """Check bank levels and spawn refills for empty slots."""
    for category, difficulty in categories:
        async with async_session() as db:
            result = await db.execute(
                select(MCQBank.id)
                .where(MCQBank.category == category, MCQBank.difficulty == difficulty)
                .limit(1)
            )
            if result.scalar_one_or_none() is None:
                spawn_refill(category, difficulty)
