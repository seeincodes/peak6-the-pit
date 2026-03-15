"""Authentication service — password hashing, JWT tokens."""
import bcrypt
import datetime
from uuid import UUID

from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.organization import Organization
from app.models.user import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: UUID) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=settings.jwt_expiration_minutes
    )
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> UUID | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_org_and_email(db: AsyncSession, org_slug: str, email: str) -> User | None:
    result = await db.execute(
        select(User)
        .join(Organization, Organization.id == User.org_id)
        .where(Organization.slug == org_slug.lower(), User.email == email.lower())
    )
    return result.scalar_one_or_none()


async def get_org_by_slug(db: AsyncSession, org_slug: str) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.slug == org_slug.lower()))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    org_id: UUID,
    email: str,
    password: str,
    display_name: str,
    role: str = "ta",
    ta_phase: int = 1,
) -> User:
    user = User(
        org_id=org_id,
        email=email.lower(),
        password_hash=hash_password(password),
        display_name=display_name,
        role=role,
        ta_phase=ta_phase,
        xp_total=0,
        level=1,
        streak_days=0,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
