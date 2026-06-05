"""Report generation and retrieval endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import enforce_ai_rate_limit
from app.api.deps import get_current_user
from app.repositories.repository import case_repo, evidence_analysis_repo, evidence_repo, report_repo
from app.schemas.schemas import ReportResponse
from app.services.deepseek_service import deepseek_service
from app.services.walrus_service import walrus_service
from app.utils.audit import log_action

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    request: Request,
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate a full AI investigation report for a case, store in Walrus."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await enforce_ai_rate_limit(request, current_user.id)

    # Gather all evidence for the case
    evidences = await evidence_repo.get_by_case(db, case_id)
    analyses = await evidence_analysis_repo.get_by_case(db, case_id)
    analysis_by_evidence = {str(item.evidence_id): item for item in analyses}

    case_data = {
        "case_id": str(case.id),
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "trust_score": case.trust_score,
        "evidence_count": len(evidences),
        "evidence_items": [
            {
                "id": str(e.id),
                "filename": e.filename,
                "file_type": e.file_type,
                "sha256_hash": e.sha256_hash,
                "walrus_blob_id": e.walrus_blob_id,
                "verification_status": e.verification_status,
                "created_at": str(e.created_at),
                "analysis": _analysis_for_prompt(analysis_by_evidence.get(str(e.id))),
            }
            for e in evidences
        ],
    }

    # Generate report via DeepSeek AI
    report_json = await deepseek_service.generate_report(case_data)

    # Store report in Walrus
    try:
        walrus_blob_id = await walrus_service.upload_json(report_json)
    except Exception:
        walrus_blob_id = None

    # Save to database
    report = await report_repo.create(db, {
        "case_id": case_id,
        "walrus_blob_id": walrus_blob_id,
        "report_json": report_json,
    })

    await log_action(
        db,
        action="generate_report",
        entity_type="investigation_report",
        entity_id=report.id,
        user_id=current_user.id,
        case_id=case_id,
    )

    return report


def _analysis_for_prompt(analysis) -> dict:
    if not analysis:
        return {}
    summary = analysis.summary_json or {}
    entities = analysis.entities_json or {}
    return {
        "media_kind": analysis.media_kind,
        "extraction_status": analysis.extraction_status,
        "summary": summary.get("summary"),
        "key_observations": summary.get("key_observations", []),
        "risk_flags": summary.get("risk_flags", []),
        "recommended_next_steps": summary.get("recommended_next_steps", []),
        "entities": entities,
        "text_excerpt": analysis.text_excerpt,
        "ai_artifact_walrus_blob_id": analysis.walrus_blob_id,
    }


@router.get("/case/{case_id}", response_model=ReportResponse)
async def get_case_report(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve the latest generated investigation report for a specific case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    report = await report_repo.get_by_case(db, case_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No report found for this case")

    return report


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve a generated investigation report by its ID."""
    report = await report_repo.get_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    case = await case_repo.get_by_id(db, report.case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    return report
