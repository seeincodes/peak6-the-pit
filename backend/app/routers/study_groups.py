"""Study group CRUD — path-based accountability groups."""
import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.database import get_db
from app.models.study_group import StudyGroup, StudyGroupMember
from app.models.learning_path import LearningPath, UserPathProgress
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/study-groups", tags=["study-groups"])


class CreateGroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    path_id: UUID


class JoinGroupRequest(BaseModel):
    invite_code: str = Field(min_length=6, max_length=8)


def _generate_invite_code() -> str:
    return secrets.token_hex(3).upper()  # 6 hex chars


@router.post("")
async def create_group(
    req: CreateGroupRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a study group for a learning path."""
    path = await db.get(LearningPath, req.path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    invite_code = _generate_invite_code()

    group = StudyGroup(
        name=req.name,
        path_id=req.path_id,
        invite_code=invite_code,
        created_by=user.id,
    )
    db.add(group)
    await db.flush()

    member = StudyGroupMember(group_id=group.id, user_id=user.id)
    db.add(member)
    await db.commit()

    return {
        "id": str(group.id),
        "name": group.name,
        "invite_code": invite_code,
        "path_id": str(group.path_id),
    }


@router.post("/join")
async def join_group(
    req: JoinGroupRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a study group by invite code."""
    result = await db.execute(
        select(StudyGroup).where(StudyGroup.invite_code == req.invite_code.upper())
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check capacity
    count_result = await db.execute(
        select(func.count()).where(StudyGroupMember.group_id == group.id)
    )
    member_count = count_result.scalar()
    if member_count >= group.max_members:
        raise HTTPException(status_code=400, detail="Group is full")

    # Check duplicate
    existing = await db.execute(
        select(StudyGroupMember).where(
            StudyGroupMember.group_id == group.id,
            StudyGroupMember.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already a member")

    member = StudyGroupMember(group_id=group.id, user_id=user.id)
    db.add(member)
    await db.commit()

    return {"id": str(group.id), "name": group.name, "path_id": str(group.path_id)}


@router.delete("/{group_id}/leave")
async def leave_group(
    group_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave a study group."""
    result = await db.execute(
        select(StudyGroupMember).where(
            StudyGroupMember.group_id == group_id,
            StudyGroupMember.user_id == user.id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this group")

    await db.delete(membership)
    await db.commit()
    return {"status": "left"}


@router.get("/my-groups")
async def get_my_groups(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all study groups the user belongs to."""
    stmt = (
        select(StudyGroup, LearningPath)
        .join(StudyGroupMember, StudyGroupMember.group_id == StudyGroup.id)
        .join(LearningPath, StudyGroup.path_id == LearningPath.id)
        .where(StudyGroupMember.user_id == user.id)
    )
    rows = (await db.execute(stmt)).all()

    groups = []
    for group, path in rows:
        count_result = await db.execute(
            select(func.count()).where(StudyGroupMember.group_id == group.id)
        )
        member_count = count_result.scalar()
        groups.append({
            "id": str(group.id),
            "name": group.name,
            "invite_code": group.invite_code,
            "path_id": str(path.id),
            "path_name": path.name,
            "member_count": member_count,
            "max_members": group.max_members,
        })

    return groups


@router.get("/{group_id}")
async def get_group_detail(
    group_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get group detail with member progress."""
    group = await db.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Verify user is a member
    membership = await db.execute(
        select(StudyGroupMember).where(
            StudyGroupMember.group_id == group_id,
            StudyGroupMember.user_id == user.id,
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    path = await db.get(LearningPath, group.path_id)

    # Get members with their path progress
    UPP = aliased(UserPathProgress)
    stmt = (
        select(User, StudyGroupMember, UPP)
        .join(StudyGroupMember, StudyGroupMember.user_id == User.id)
        .outerjoin(
            UPP,
            (UPP.user_id == User.id) & (UPP.path_id == group.path_id),
        )
        .where(StudyGroupMember.group_id == group_id)
        .order_by(StudyGroupMember.joined_at)
    )
    rows = (await db.execute(stmt)).all()

    total_steps = len(path.steps) if path and path.steps else 1

    members = []
    for u, _membership, progress in rows:
        current_step = progress.current_step if progress else 0
        is_completed = progress.completed_at is not None if progress else False
        pct = round((current_step / total_steps) * 100) if total_steps > 0 else 0
        if is_completed:
            pct = 100
        members.append({
            "user_id": str(u.id),
            "display_name": u.display_name,
            "avatar_id": u.avatar_id or "default",
            "current_step": current_step,
            "progress_pct": pct,
            "completed": is_completed,
        })

    return {
        "id": str(group.id),
        "name": group.name,
        "invite_code": group.invite_code,
        "path_id": str(group.path_id),
        "path_name": path.name if path else "",
        "max_members": group.max_members,
        "members": members,
    }
