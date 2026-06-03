"""Authentication endpoints for email/password sessions and current user lookup."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.repository import user_repo
from app.schemas.schemas import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalise_email(email: str) -> str:
    return email.strip().lower()


@router.post("/register", response_model=TokenResponse)
async def register_with_email(
    body: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create an investigator account and return a JWT session."""
    email = _normalise_email(str(body.email))
    name = body.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required.",
        )

    existing_user = await user_repo.get_by_email(db, email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email.",
        )

    user = await user_repo.create(db, {
        "email": email,
        "name": name,
        "hashed_password": hash_password(body.password),
    })
    token = create_access_token(data={"sub": str(user.id)})

    await log_action(
        db,
        action="email_register",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
    )

    return TokenResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
async def login_with_email(
    body: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify email/password credentials and return a JWT session."""
    email = _normalise_email(str(body.email))
    user = await user_repo.get_by_email(db, email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(data={"sub": str(user.id)})

    await log_action(
        db,
        action="email_login",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
    )

    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
