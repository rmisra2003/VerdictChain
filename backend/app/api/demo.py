"""Hackathon demo bootstrap endpoint.

This route is disabled by default. Enable it only for the public hackathon
deployment when you want the frontend demo to create a reusable demo account
and case without exposing a long-lived JWT in client environment variables.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.repositories.repository import case_repo, user_repo
from app.utils.audit import log_action

router = APIRouter(prefix="/demo", tags=["Demo"])

DEMO_EMAIL = "demo@verdictchain.local"
DEMO_PASSWORD = "VerdictChainDemo2026!"


@router.post("/bootstrap")
async def bootstrap_demo(db: AsyncSession = Depends(get_db)):
    """Create or reuse a demo user/case and return a short demo session."""
    if not settings.ENABLE_DEMO_BOOTSTRAP:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo bootstrap is disabled",
        )

    user = await user_repo.get_by_email(db, DEMO_EMAIL)
    if user is None:
        user = await user_repo.create(
            db,
            {
                "email": DEMO_EMAIL,
                "name": "VerdictChain Demo Investigator",
                "hashed_password": hash_password(DEMO_PASSWORD),
                "wallet_address": settings.SUI_SENDER_ADDRESS,
            },
        )
        await log_action(
            db,
            action="demo_register",
            entity_type="user",
            entity_id=user.id,
            user_id=user.id,
        )

    cases = await case_repo.get_by_owner(db, user.id, limit=1)
    if cases:
        case = cases[0]
    else:
        case = await case_repo.create(
            db,
            {
                "title": "Hackathon Mainnet Evidence Vault",
                "description": (
                    "Public demo vault for sealing evidence hashes with Tatum "
                    "Sui RPC and Walrus mainnet storage."
                ),
                "owner_id": user.id,
                "trust_score": 75.0,
            },
        )
        await log_action(
            db,
            action="demo_create_case",
            entity_type="case_vault",
            entity_id=case.id,
            user_id=user.id,
            case_id=case.id,
        )

    return {
        "access_token": create_access_token(data={"sub": str(user.id)}),
        "token_type": "bearer",
        "case_id": str(case.id),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
        },
    }
