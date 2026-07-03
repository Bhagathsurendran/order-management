"""
tests/test_auth.py
Tests for authentication endpoints:
- Login success / failure
- Token refresh
- Logout
- Protected route access
"""
import pytest


@pytest.mark.asyncio
async def test_login_success(client, admin_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "Admin@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, admin_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_login_unknown_user(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "nobody", "password": "password123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client, auth_headers):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["username"] == "testadmin"
    assert data["data"]["role"] == "admin"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403  # No Bearer token


@pytest.mark.asyncio
async def test_token_refresh(client, admin_user):
    login = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "Admin@123"},
    )
    refresh_token = login.json()["data"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]


@pytest.mark.asyncio
async def test_logout(client, admin_user):
    login = await client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "Admin@123"},
    )
    refresh_token = login.json()["data"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
