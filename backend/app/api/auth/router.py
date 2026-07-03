"""
app/api/auth/router.py
Authentication endpoints:
  POST /api/v1/auth/login    — login with username/password
  POST /api/v1/auth/refresh  — refresh access token
  POST /api/v1/auth/logout   — revoke refresh token
  GET  /api/v1/auth/me       — get current user profile
"""
from fastapi import APIRouter, Request, status

from app.core.dependencies import CurrentUser, DBSession
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services import auth_service
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", summary="Login with username and password")
async def login(
    body: LoginRequest,
    db: DBSession,
    request: Request,
):
    user = await auth_service.authenticate_user(db, body.username, body.password)
    if not user:
        return error_response(
            message="Invalid username or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    access_token, refresh_token, expires_in = await auth_service.create_tokens(user)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        },
        message="Login successful",
    )


@router.post("/refresh", summary="Refresh access token")
async def refresh_token(body: RefreshRequest, db: DBSession):
    result = await auth_service.refresh_access_token(db, body.refresh_token)
    if not result:
        return error_response(
            message="Invalid or expired refresh token",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    access_token, refresh_token, expires_in = result
    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        },
        message="Token refreshed",
    )


@router.post("/logout", summary="Revoke refresh token")
async def logout(body: LogoutRequest):
    await auth_service.logout_user(body.refresh_token)
    return success_response(message="Logged out successfully")


@router.get("/me", summary="Get current user profile")
async def get_me(current_user: CurrentUser):
    return success_response(
        data=UserResponse.model_validate(current_user).model_dump(mode="json"),
        message="User profile fetched",
    )
