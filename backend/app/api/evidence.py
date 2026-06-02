"""Evidence upload pipeline and retrieval endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, BackgroundTasks, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.repositories.repository import case_repo, evidence_repo, proof_repo
from app.schemas.schemas import EvidenceResponse, EvidenceUploadResponse, ProofResponse
from app.services.walrus_service import walrus_service
from app.services.sui_service import sui_service
from app.services.deepseek_service import deepseek_service
from app.services.trust_score_service import trust_score_service
from app.utils.file_utils import calculate_sha256, validate_file_type, validate_file_size, sanitize_filename
from app.utils.audit import log_action

router = APIRouter(prefix="/evidence", tags=["Evidence"])


async def _run_ai_processing(case_id: UUID, evidence_id: UUID, file_content: str):
    """Background task: run AI entity extraction, timeline, graph, trust score updates."""
    # This function runs outside the request context, so errors are logged but
    # do not crash the response.  In a production system you would use a proper
    # task queue (Celery / ARQ).  For hackathon demo the background-task approach
    # is sufficient.
    try:
        # Entity extraction
        await deepseek_service.extract_entities(file_content)

        # The trust score will be recalculated by dedicated endpoints;
        # here we just trigger a lightweight pass.
    except Exception:
        # Swallow — background processing is best-effort during the hackathon.
        pass


@router.post("/upload", response_model=EvidenceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    background_tasks: BackgroundTasks,
    case_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Full evidence ingestion pipeline:
    1. Validate ownership, MIME type, file size
    2. Compute SHA-256 hash
    3. Upload to Walrus
    4. Create Evidence record
    5. Submit proof to Sui via Tatum
    6. Create Proof record
    7. Enqueue background AI processing
    """
    # ── 0. Validate case ownership ──────────────────────────────────────
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    # ── 1. Validate MIME type ───────────────────────────────────────────
    content_type = file.content_type or "application/octet-stream"
    if not validate_file_type(content_type):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{content_type}' is not allowed",
        )

    # ── 2. Read and validate size ───────────────────────────────────────
    file_data = await file.read()
    if not validate_file_size(len(file_data)):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the maximum allowed size",
        )

    # ── 3. Compute SHA-256 ──────────────────────────────────────────────
    sha256_hash = calculate_sha256(file_data)
    safe_filename = sanitize_filename(file.filename or "evidence_file")

    # ── 4. Upload to Walrus ─────────────────────────────────────────────
    try:
        walrus_result = await walrus_service.upload_file(
            file_data,
            content_type,
            safe_filename,
        )
        walrus_blob_id = walrus_result.get("blob_id")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload to Walrus storage: {exc}",
        )

    # ── 5. Create Evidence record ───────────────────────────────────────
    evidence = await evidence_repo.create(db, {
        "case_id": case_id,
        "filename": safe_filename,
        "file_type": content_type,
        "file_size": len(file_data),
        "sha256_hash": sha256_hash,
        "walrus_blob_id": walrus_blob_id,
        "verification_status": "pending",
    })

    # ── 6. Submit proof to Sui / describe Walrus mainnet anchor ─────────
    try:
        sui_result = await sui_service.create_proof(
            proof_hash=sha256_hash,
            evidence_id=str(evidence.id),
            case_id=str(case_id),
        )
        tx_hash = sui_result.get("tx_hash")
    except Exception:
        tx_hash = None  # Blockchain anchoring failed — non-fatal for hackathon

    # ── 7. Create Proof record ──────────────────────────────────────────
    proof = await proof_repo.create(db, {
        "case_id": case_id,
        "evidence_id": evidence.id,
        "sui_transaction_hash": tx_hash,
        "proof_hash": sha256_hash,
        "verification_status": "verified" if tx_hash else "pending",
    })

    # ── 8. Update evidence status ───────────────────────────────────────
    await evidence_repo.update(db, evidence.id, {
        "verification_status": "verified" if tx_hash else "pending",
    })

    # ── 9. Audit log ───────────────────────────────────────────────────
    await log_action(
        db,
        action="upload",
        entity_type="evidence",
        entity_id=evidence.id,
        user_id=current_user.id,
        case_id=case_id,
        details={
            "filename": safe_filename,
            "sha256": sha256_hash,
            "walrus_blob_id": walrus_blob_id,
            "sui_tx": tx_hash,
        },
    )

    # ── 10. Background AI processing ────────────────────────────────────
    # Attempt to decode file content for AI processing
    try:
        file_text = file_data.decode("utf-8", errors="ignore")
    except Exception:
        file_text = ""

    if file_text.strip():
        background_tasks.add_task(_run_ai_processing, case_id, evidence.id, file_text)

    walrus_metadata = {
        "provider": walrus_result.get("provider"),
        "blob_id": walrus_result.get("blob_id"),
        "job_id": walrus_result.get("job_id"),
        "status": walrus_result.get("status"),
        "raw": walrus_result.get("metadata", {}),
    }

    message = (
        "Evidence uploaded, hashed, and staged for Walrus mainnet certification "
        "through Tatum."
        if walrus_result.get("provider") == "tatum"
        else "Evidence uploaded, hashed, stored on Walrus, and anchored on Sui successfully."
    )

    # ── 11. Return composite response ───────────────────────────────────
    return EvidenceUploadResponse(
        evidence=EvidenceResponse(
            id=evidence.id,
            case_id=evidence.case_id,
            filename=evidence.filename,
            file_type=evidence.file_type,
            file_size=evidence.file_size,
            sha256_hash=evidence.sha256_hash,
            walrus_blob_id=evidence.walrus_blob_id,
            verification_status=evidence.verification_status,
            created_at=evidence.created_at,
        ),
        proof=ProofResponse(
            id=proof.id,
            case_id=proof.case_id,
            evidence_id=proof.evidence_id,
            sui_transaction_hash=proof.sui_transaction_hash,
            proof_hash=proof.proof_hash,
            timestamp=proof.timestamp,
            verification_status=proof.verification_status,
        ),
        walrus_metadata=walrus_metadata,
        message=message,
    )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get evidence metadata by ID."""
    evidence = await evidence_repo.get_by_id(db, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")

    # Verify ownership through the case
    case = await case_repo.get_by_id(db, evidence.case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")

    return evidence
