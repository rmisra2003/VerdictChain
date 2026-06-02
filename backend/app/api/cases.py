"""Case Vault CRUD endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.repositories.repository import case_repo, evidence_repo
from app.schemas.schemas import CaseCreate, CaseUpdate, CaseResponse
from app.utils.audit import log_action

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new investigation case vault."""
    case = await case_repo.create(db, {
        "title": body.title,
        "description": body.description,
        "owner_id": current_user.id,
    })

    await log_action(
        db,
        action="create_case",
        entity_type="case_vault",
        entity_id=case.id,
        user_id=current_user.id,
        case_id=case.id,
    )

    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        status=case.status,
        trust_score=case.trust_score,
        owner_id=case.owner_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidence_count=0,
    )


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all cases owned by the current user."""
    cases = await case_repo.get_by_owner(db, current_user.id, skip=skip, limit=limit)
    result = []
    for c in cases:
        evs = await evidence_repo.get_by_case(db, c.id)
        result.append(CaseResponse(
            id=c.id,
            title=c.title,
            description=c.description,
            status=c.status,
            trust_score=c.trust_score,
            owner_id=c.owner_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            evidence_count=len(evs),
        ))
    return result


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific case vault by ID."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    evs = await evidence_repo.get_by_case(db, case.id)
    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        status=case.status,
        trust_score=case.trust_score,
        owner_id=case.owner_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidence_count=len(evs),
    )


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: UUID,
    body: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a case vault."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    case = await case_repo.update(db, case_id, update_data)

    await log_action(
        db,
        action="update_case",
        entity_type="case_vault",
        entity_id=case.id,
        user_id=current_user.id,
        case_id=case.id,
        details=update_data,
    )

    evs = await evidence_repo.get_by_case(db, case.id)
    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        status=case.status,
        trust_score=case.trust_score,
        owner_id=case.owner_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        evidence_count=len(evs),
    )


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a case vault and all associated data."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    await log_action(
        db,
        action="delete_case",
        entity_type="case_vault",
        entity_id=case.id,
        user_id=current_user.id,
        case_id=case.id,
    )

    await case_repo.delete(db, case_id)
