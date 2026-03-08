"""Tests for auth service."""
from app.services.auth import hash_password, verify_password, create_access_token, decode_access_token
from uuid import uuid4


def test_hash_and_verify_password():
    pw = "testpassword123"
    hashed = hash_password(pw)
    assert verify_password(pw, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_token():
    user_id = uuid4()
    token = create_access_token(user_id)
    decoded = decode_access_token(token)
    assert decoded == user_id


def test_decode_invalid_token():
    assert decode_access_token("invalid.token.here") is None
