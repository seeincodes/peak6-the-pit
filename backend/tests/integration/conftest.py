import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.main import app
from app.database import get_db


@pytest.fixture
async def async_client():
    """Provide an async client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def db_session():
    """Provide an async database session for testing."""
    # Create in-memory SQLite database for testing
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    # Create tables
    async with engine.begin() as conn:
        # Import all models to ensure they're registered with Base
        from app.models.user import Base
        await conn.run_sync(Base.metadata.create_all)

    # Create session factory
    async_session_local = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_local() as session:
        yield session
        await session.rollback()

    await engine.dispose()
