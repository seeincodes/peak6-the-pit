"""Auth endpoints — org-aware login and invite-based signup."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.org_invite import OrgInvite
from app.models.organization import Organization
from app.models.user import User
from app.services.auth import (
    get_user_by_email,
    get_user_by_org_and_email,
    create_user,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    display_name: str
    invite_token: str


class LoginRequest(BaseModel):
    email: str
    password: str
    org_slug: str | None = None


class InvitePreviewResponse(BaseModel):
    org_slug: str
    org_name: str
    email: str
    role: str
    expires_at: str


def _extract_org_slug_from_host(host: str | None) -> str | None:
    if not host:
        return None
    host_no_port = host.split(":")[0].lower()
    # Ignore localhost/dev hosts where subdomain routing is not used.
    if host_no_port in {"localhost", "127.0.0.1"} or host_no_port.endswith(".local"):
        return None
    parts = host_no_port.split(".")
    if len(parts) < 3:
        return None
    return parts[0]


@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    invite = (
        await db.execute(select(OrgInvite).where(OrgInvite.token == req.invite_token))
    ).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.accepted_at is not None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite already used")
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")
    if req.email.lower() != invite.email.lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite email mismatch")

    existing_user = (
        await db.execute(
            select(User.id).where(User.org_id == invite.org_id, User.email == req.email.lower())
        )
    ).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = await create_user(
        db,
        org_id=invite.org_id,
        email=req.email,
        password=req.password,
        display_name=req.display_name,
        role=invite.role,
    )
    invite.accepted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    token = create_access_token(user.id)

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role,
            "org_id": str(user.org_id),
            "level": user.level,
            "xp_total": user.xp_total,
        },
    }


@router.post("/login")
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    org_slug = req.org_slug or _extract_org_slug_from_host(request.headers.get("host"))
    user = None
    if org_slug:
        user = await get_user_by_org_and_email(db, org_slug, req.email)
    else:
        user = await get_user_by_email(db, req.email.lower())
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id)

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role,
            "org_id": str(user.org_id),
            "level": user.level,
            "xp_total": user.xp_total,
        },
    }


@router.get("/invite/{invite_token}", response_model=InvitePreviewResponse)
async def get_invite_preview(invite_token: str, db: AsyncSession = Depends(get_db)):
    invite = (
        await db.execute(select(OrgInvite).where(OrgInvite.token == invite_token))
    ).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.accepted_at is not None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite already used")
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite expired")

    org = await db.get(Organization, invite.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization lookup failed")

    return InvitePreviewResponse(
        org_slug=org.slug,
        org_name=org.name,
        email=invite.email,
        role=invite.role,
        expires_at=invite.expires_at.replace(tzinfo=timezone.utc).isoformat(),
    )
