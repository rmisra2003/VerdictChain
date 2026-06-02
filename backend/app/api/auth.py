"""Authentication endpoints: register, login, current user."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.repository import user_repo
from app.schemas.schemas import TokenResponse, UserCreate, UserLogin, UserResponse
from app.api.deps import get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    existing = await user_repo.get_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = await user_repo.create(db, {
        "email": body.email,
        "name": body.name,
        "hashed_password": hash_password(body.password),
        "wallet_address": body.wallet_address,
    })

    await log_action(db, action="register", entity_type="user", entity_id=user.id, user_id=user.id)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a JWT access token."""
    user = await user_repo.get_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user.id)})

    await log_action(db, action="login", entity_type="user", entity_id=user.id, user_id=user.id)

    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
