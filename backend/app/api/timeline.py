"""Timeline generation and retrieval endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import enforce_ai_rate_limit
from app.api.deps import get_current_user
from app.repositories.repository import case_repo, evidence_analysis_repo, evidence_repo, timeline_repo
from app.schemas.schemas import TimelineResponse
from app.services.deepseek_service import deepseek_service
from app.services.walrus_service import walrus_service
from app.utils.audit import log_action

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.post("/generate", response_model=TimelineResponse, status_code=status.HTTP_201_CREATED)
async def generate_timeline(
    request: Request,
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate an AI-powered chronological timeline from all case evidence."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await enforce_ai_rate_limit(request, current_user.id)

    evidences = await evidence_repo.get_by_case(db, case_id)
    analyses = await evidence_analysis_repo.get_by_case(db, case_id)
    analysis_by_evidence = {str(item.evidence_id): item for item in analyses}

    evidence_list = [
        {
            "id": str(e.id),
            "filename": e.filename,
            "file_type": e.file_type,
            "sha256_hash": e.sha256_hash,
            "verification_status": e.verification_status,
            "created_at": str(e.created_at),
            "analysis": _analysis_for_prompt(analysis_by_evidence.get(str(e.id))),
        }
        for e in evidences
    ]

    # Generate timeline via AI
    timeline_events = await deepseek_service.generate_timeline(evidence_list)
    timeline_json = {"events": timeline_events, "case_id": str(case_id), "evidence_count": len(evidences)}

    # Store in Walrus
    try:
        walrus_blob_id = await walrus_service.upload_json(timeline_json)
    except Exception:
        walrus_blob_id = None

    # Save to database
    timeline = await timeline_repo.create(db, {
        "case_id": case_id,
        "walrus_blob_id": walrus_blob_id,
        "timeline_json": timeline_json,
    })

    await log_action(
        db,
        action="generate_timeline",
        entity_type="timeline",
        entity_id=timeline.id,
        user_id=current_user.id,
        case_id=case_id,
    )

    return timeline


def _analysis_for_prompt(analysis) -> dict:
    if not analysis:
        return {}
    summary = analysis.summary_json or {}
    return {
        "media_kind": analysis.media_kind,
        "extraction_status": analysis.extraction_status,
        "summary": summary.get("summary"),
        "key_observations": summary.get("key_observations", []),
        "dates": (analysis.entities_json or {}).get("dates", []),
        "amounts": (analysis.entities_json or {}).get("amounts", []),
        "risk_flags": (analysis.entities_json or {}).get("risk_flags", []),
        "text_excerpt": analysis.text_excerpt,
    }


@router.get("/case/{case_id}", response_model=TimelineResponse)
async def get_case_timeline(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve the latest generated timeline for a specific case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    timeline = await timeline_repo.get_by_case(db, case_id)
    if timeline is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No timeline found for this case")

    return timeline


@router.get("/{timeline_id}", response_model=TimelineResponse)
async def get_timeline(
    timeline_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve a generated timeline by its ID."""
    timeline = await timeline_repo.get_by_id(db, timeline_id)
    if timeline is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline not found")

    case = await case_repo.get_by_id(db, timeline.case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline not found")

    return timeline
