import pytest
from uuid import UUID

from app.config import settings
from app.models.user import User
from app.routers.admin import (
    _can_manage_invites_for_org,
    _is_super_admin,
    _org_signup_url,
)


def _admin_user(email: str, org_id: str = "00000000-0000-0000-0000-000000000099") -> User:
    return User(
        id=UUID("00000000-0000-0000-0000-000000000011"),
        email=email,
        password_hash="hash",
        display_name="Admin",
        role="org_admin",
        org_id=UUID(org_id),
    )


def test_super_admin_email_detection():
    assert _is_super_admin(_admin_user("admin@peak6.com")) is True
    assert _is_super_admin(_admin_user("admin@thepit.dev")) is False


def test_cross_org_invite_access_requires_super_admin():
    target_org = UUID("00000000-0000-0000-0000-000000000100")
    same_org_admin = _admin_user("admin@thepit.dev", org_id="00000000-0000-0000-0000-000000000100")
    other_org_admin = _admin_user("admin@thepit.dev")
    super_admin = _admin_user("admin@peak6.com")

    assert _can_manage_invites_for_org(same_org_admin, target_org) is True
    assert _can_manage_invites_for_org(other_org_admin, target_org) is False
    assert _can_manage_invites_for_org(super_admin, target_org) is True


@pytest.mark.parametrize(
    ("frontend_url", "org_slug", "token", "expected"),
    [
        (
            "https://thepit.up.railway.app",
            "acme",
            "tok_123",
            "https://acme.thepit.up.railway.app/signup?invite=tok_123",
        ),
        (
            "https://acme.thepit.up.railway.app",
            "acme",
            "tok_456",
            "https://acme.thepit.up.railway.app/signup?invite=tok_456",
        ),
        (
            "http://localhost:5173",
            "acme",
            "tok_789",
            "http://localhost:5173/signup?invite=tok_789",
        ),
    ],
)
def test_org_signup_url_generation(frontend_url: str, org_slug: str, token: str, expected: str):
    original_frontend_url = settings.frontend_url
    try:
        settings.frontend_url = frontend_url
        assert _org_signup_url(org_slug, token) == expected
    finally:
        settings.frontend_url = original_frontend_url
