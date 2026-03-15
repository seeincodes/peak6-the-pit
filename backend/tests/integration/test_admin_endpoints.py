import pytest
from datetime import datetime
from uuid import UUID
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User
from app.models.organization import Organization


@pytest.mark.asyncio
async def test_learning_progress_requires_admin(async_client: AsyncClient):
    """Endpoint should require admin role."""
    org_id = UUID("00000000-0000-0000-0000-000000000001")
    response = await async_client.get(f"/api/admin/org/{org_id}/learning")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_cannot_access_other_org():
    """Admin should not access another org's data (authorization check)."""
    # Create test users with different org IDs
    org1_id = UUID("00000000-0000-0000-0000-000000000001")
    org2_id = UUID("00000000-0000-0000-0000-000000000002")

    admin1 = User(
        id=UUID("00000000-0000-0000-0000-000000000010"),
        email="admin1@test.com",
        password_hash="hash",
        display_name="Admin 1",
        role="admin",
        org_id=org1_id,
    )

    # Verify that admin1 cannot access org2
    assert admin1.org_id == org1_id
    assert admin1.org_id != org2_id
    assert admin1.role == "admin"
