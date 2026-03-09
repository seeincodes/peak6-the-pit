"""Tests for users router (profile update)."""
import pytest
from pydantic import ValidationError

from app.routers.users import UpdateProfileRequest, PRESET_AVATARS


def test_update_profile_request_valid():
    """Valid profile update fields pass validation."""
    req = UpdateProfileRequest(display_name="New Name", avatar_id="bull", bio="Vol desk")
    assert req.display_name == "New Name"
    assert req.avatar_id == "bull"
    assert req.bio == "Vol desk"


def test_update_profile_request_partial():
    """Partial updates are allowed (all optional)."""
    req = UpdateProfileRequest(display_name="Only Name")
    assert req.display_name == "Only Name"
    assert req.avatar_id is None
    assert req.bio is None


def test_update_profile_request_display_name_min_length():
    """Empty display_name fails validation."""
    with pytest.raises(ValidationError):
        UpdateProfileRequest(display_name="")


def test_update_profile_request_display_name_max_length():
    """Display name over 100 chars fails."""
    with pytest.raises(ValidationError):
        UpdateProfileRequest(display_name="x" * 101)


def test_update_profile_request_bio_max_length():
    """Bio over 200 chars fails."""
    with pytest.raises(ValidationError):
        UpdateProfileRequest(bio="x" * 201)


def test_preset_avatars_includes_valid_ids():
    """PRESET_AVATARS contains expected values for update_profile validation."""
    assert "default" in PRESET_AVATARS
    assert "bull" in PRESET_AVATARS
    assert "bear" in PRESET_AVATARS
    assert "crown" in PRESET_AVATARS
