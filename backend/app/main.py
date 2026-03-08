from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, scenarios, responses, users, auth, mcq


@asynccontextmanager
async def lifespan(app: FastAPI):
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
app.include_router(responses.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(mcq.router)
