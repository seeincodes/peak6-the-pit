from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, scenarios, scenarios_stream, responses, users, auth, mcq, leaderboard
from app.services.mcq_pool import prewarm


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm MCQ pool for instant Quick Fire load
    await prewarm([
        ("iv_analysis", "beginner"),
        ("greeks", "beginner"),
        ("order_flow", "beginner"),
    ])
    yield


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
