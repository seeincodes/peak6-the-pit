from datetime import datetime, timedelta
import secrets
from urllib.parse import urlparse
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import require_admin
from app.models.org_invite import OrgInvite
from app.models.organization import Organization
from app.models.user import User
from app.schemas.admin import (
    LearningProgressResponse,
    ActivityResponse,
    ContentPerformanceResponse,
    OrgUsersPerformanceResponse,
)
from app.services.analytics import (
    get_learning_progress,
    get_activity_metrics,
    get_content_performance,
    get_org_users_performance,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class CreateInviteRequest(BaseModel):
    email: str
    role: str = Field(default="analyst")
    expires_in_days: int = Field(default=7, ge=1, le=30)


class CreateInviteResponse(BaseModel):
    invite_token: str
    signup_url: str
    email: str
    role: str
    expires_at: str


ALLOWED_ROLES = {"intern", "analyst", "associate", "trainer", "org_admin"}


def _is_super_admin(user: User) -> bool:
    return user.role == "org_admin" and user.email.lower().endswith("@peak6.com")


def _can_manage_invites_for_org(user: User, target_org_id: UUID) -> bool:
    return user.org_id == target_org_id or _is_super_admin(user)


def _org_signup_url(org_slug: str, invite_token: str) -> str:
    parsed = urlparse(settings.frontend_url)
    scheme = parsed.scheme or "https"
    host = parsed.netloc or parsed.path
    if host.startswith("localhost") or host.startswith("127.0.0.1"):
        return f"{settings.frontend_url.rstrip('/')}/signup?invite={invite_token}"
    host_no_port, *port_part = host.split(":")
    if host_no_port.startswith(f"{org_slug}."):
        org_host = host
    else:
        org_host = f"{org_slug}.{host_no_port}"
        if port_part:
            org_host = f"{org_host}:{port_part[0]}"
    return f"{scheme}://{org_host}/signup?invite={invite_token}"


@router.get("/org/{org_id}/learning", response_model=LearningProgressResponse)
async def get_org_learning_progress(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Get learning progress analytics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates with defaults
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_learning_progress(db, org_id, start, end)


@router.get("/org/{org_id}/activity", response_model=ActivityResponse)
async def get_org_activity(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
    granularity: str = "daily",
):
    """Get activity metrics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_activity_metrics(db, org_id, start, end)


@router.get("/org/{org_id}/scenarios", response_model=ContentPerformanceResponse)
async def get_org_content_performance(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
    difficulty: str | None = None,
    category: str | None = None,
):
    """Get content performance analytics for admin's organization."""
    # Verify admin owns this org
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Parse dates
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_content_performance(
        db, org_id, start, end, difficulty=difficulty, category=category
    )


@router.get("/org/{org_id}/users", response_model=OrgUsersPerformanceResponse)
async def get_org_users(
    org_id: UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Get per-user analytics for admin's organization."""
    if admin_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    start = datetime.fromisoformat(start_date) if start_date else (end - timedelta(days=30))

    return await get_org_users_performance(db, org_id, start, end)


@router.post("/org/{org_id}/invites", response_model=CreateInviteResponse)
async def create_org_invite(
    org_id: UUID,
    req: CreateInviteRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create invite token for org-scoped signup."""
    if not _can_manage_invites_for_org(admin_user, org_id):
        raise HTTPException(status_code=403, detail="Unauthorized")
    if req.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    if req.role == "org_admin" and not _is_super_admin(admin_user):
        raise HTTPException(
            status_code=403,
            detail="Only super admin can invite org_admin users",
        )

    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing_pending = (
        await db.execute(
            select(OrgInvite)
            .where(
                OrgInvite.org_id == org_id,
                OrgInvite.email == req.email.lower(),
                OrgInvite.accepted_at.is_(None),
                OrgInvite.expires_at > datetime.utcnow(),
            )
            .order_by(OrgInvite.created_at.desc())
        )
    ).scalar_one_or_none()

    if existing_pending:
        token = existing_pending.token
        expires_at = existing_pending.expires_at
        role = existing_pending.role
    else:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=req.expires_in_days)
        role = req.role
        invite = OrgInvite(
            org_id=org_id,
            email=req.email.lower(),
            role=role,
            token=token,
            expires_at=expires_at,
            created_by_user_id=admin_user.id,
        )
        db.add(invite)
        await db.commit()

    signup_url = _org_signup_url(org.slug, token)
    return CreateInviteResponse(
        invite_token=token,
        signup_url=signup_url,
        email=req.email.lower(),
        role=role,
        expires_at=expires_at.isoformat() + "Z",
    )
