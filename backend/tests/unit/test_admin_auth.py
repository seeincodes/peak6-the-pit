import pytest
from fastapi import HTTPException
from app.middleware.auth import require_admin
from app.models.user import User


@pytest.mark.asyncio
async def test_require_admin_passes_for_admin():
    """require_admin should pass for admin users."""
    admin_user = User(
        id="123",
        email="admin@test.com",
        password_hash="hash",
        display_name="Admin",
        role="org_admin",
        org_id="456"
    )
    result = await require_admin(admin_user)
    assert result.role == "org_admin"


@pytest.mark.asyncio
async def test_require_admin_rejects_non_admin():
    """require_admin should reject non-admin users."""
    ta_user = User(
        id="123",
        email="ta@test.com",
        password_hash="hash",
        display_name="TA",
        role="analyst",
        org_id="456"
    )
    with pytest.raises(HTTPException) as exc_info:
        await require_admin(ta_user)
    assert exc_info.value.status_code == 403
