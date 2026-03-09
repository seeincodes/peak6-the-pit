import datetime

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def utc_now_naive() -> datetime.datetime:
    """UTC now as timezone-naive for TIMESTAMP WITHOUT TIME ZONE columns."""
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


engine = create_async_engine(settings.database_url, echo=settings.app_env == "development")
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
