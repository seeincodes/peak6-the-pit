import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, scenarios, scenarios_stream, responses, users, auth, mcq, leaderboard, badges, performance, bookmarks, challenges, metrics, peer_review
from app.services.mcq_pool import prewarm as mcq_prewarm
from app.services.rag import prewarm_embeddings
from app.services.market_data import prewarm_market_data
from app.services.badge_seeder import seed_badges
from app.services.badge_service import check_and_award_badges
from app.models.user import User
from app.database import async_session


async def _safe(name: str, coro, timeout: float = 15):
    """Run a coroutine with a timeout; log but never crash."""
    try:
        await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        print(f"Warning: {name} timed out after {timeout}s, skipping")
    except Exception as e:
        print(f"Warning: {name} failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed badges (DB-only, safe to run)
    await _safe("badge seeding", _seed_badges())
    await _safe("badge awarding", _award_existing_badges())

    # Pre-warm caches (non-critical)
    await _safe("embedding prewarm", prewarm_embeddings(), timeout=30)
    await _safe("market data prewarm", prewarm_market_data())
    await _safe("MCQ prewarm", mcq_prewarm([
        ("iv_analysis", "beginner"),
        ("greeks", "beginner"),
        ("order_flow", "beginner"),
    ]))

    yield


async def _seed_badges():
    async with async_session() as db:
        count = await seed_badges(db)
        if count:
            print(f"Seeded {count} new badges")


async def _award_existing_badges():
    async with async_session() as db:
        from sqlalchemy import select
        users = (await db.execute(select(User))).scalars().all()
        total_awarded = 0
        for u in users:
            awarded = await check_and_award_badges(u.id, db)
            total_awarded += len(awarded)
        if total_awarded:
            await db.commit()
            print(f"Awarded {total_awarded} badges to existing users")


app = FastAPI(
    title="CapMan AI",
    description="Gamified Scenario Training & MTSS Agent",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(scenarios.router)
app.include_router(scenarios_stream.router)
app.include_router(responses.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(mcq.router)
app.include_router(leaderboard.router)
app.include_router(badges.router)
app.include_router(performance.router)
app.include_router(bookmarks.router)
app.include_router(challenges.router)
app.include_router(metrics.router)
app.include_router(peer_review.router)
