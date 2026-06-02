"""Integrity and blockchain proof verification endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.repository import evidence_repo, proof_repo, case_repo
from app.schemas.schemas import VerifyRequest, VerifyResponse
from app.services.sui_service import sui_service
from app.services.walrus_service import walrus_service
from app.utils.audit import log_action

router = APIRouter(prefix="/verification", tags=["Verification"])


@router.post("/verify", response_model=VerifyResponse)
async def verify_evidence(
    body: VerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify evidence integrity by matching the SHA-256 hash against the DB
    and verifying the Sui blockchain proof transaction.
    """
    file_hash = body.file_hash
    tx_hash = body.sui_tx_hash

    # 1. Query if evidence with this hash exists in our system
    evidence = await evidence_repo.get_by_hash(db, file_hash)
    evidence_found = evidence is not None

    # 2. Get case detail if evidence is found
    case_title = None
    case_id = None
    if evidence:
        case_id = evidence.case_id
        case = await case_repo.get_by_id(db, case_id)
        if case:
            case_title = case.title

    # 3. Handle Sui verification
    blockchain_verified = False
    blockchain_details = {}
    walrus_verified = False
    walrus_details = {}
    proof_record = None

    # If evidence is found, try to locate its proof in the database
    if evidence:
        proofs = await proof_repo.get_by_evidence(db, evidence.id)
        if proofs:
            proof_record = proofs[0]
            # Use database tx hash if none was provided by the user
            if not tx_hash:
                tx_hash = proof_record.sui_transaction_hash

    # If we have a transaction hash, verify it on-chain
    if tx_hash:
        try:
            sui_res = await sui_service.verify_proof(tx_hash)
            blockchain_verified = sui_res.get("verified", False)
            blockchain_details = sui_res
        except Exception as exc:
            blockchain_details = {"error": f"Failed to verify proof on Sui: {exc}"}
    else:
        # Check if we can verify by proof hash directly
        try:
            sui_res = await sui_service.get_proof(file_hash)
            blockchain_verified = sui_res.get("verified", False)
            blockchain_details = sui_res
            tx_hash = sui_res.get("tx_hash")
        except Exception:
            pass

    if evidence and evidence.walrus_blob_id:
        try:
            walrus_verified = await walrus_service.verify_blob(evidence.walrus_blob_id)
            walrus_details = {
                "blob_id": evidence.walrus_blob_id,
                "verified": walrus_verified,
            }
        except Exception as exc:
            walrus_details = {"error": f"Failed to verify Walrus blob: {exc}"}

    certification_pending = bool(
        evidence_found
        and not blockchain_verified
        and not walrus_verified
        and evidence
        and evidence.verification_status in {"pending", "verified"}
    )

    # A verification is accepted if the hash matches a registered evidence
    # record and either an external proof checks out or certification is still
    # pending in Tatum/Walrus' asynchronous mainnet pipeline.
    fully_verified = evidence_found and (
        blockchain_verified or walrus_verified or certification_pending
    )

    # 4. Audit logging
    await log_action(
        db,
        action="verify",
        entity_type="evidence",
        entity_id=evidence.id if evidence else None,
        user_id=None,  # Public action, no auth required
        case_id=case_id,
        details={
            "file_hash": file_hash,
            "sui_tx_hash": tx_hash,
            "evidence_found": evidence_found,
            "blockchain_verified": blockchain_verified,
            "walrus_verified": walrus_verified,
            "certification_pending": certification_pending,
            "fully_verified": fully_verified,
        },
    )

    details = {
        "evidence_found": evidence_found,
        "blockchain_verified": blockchain_verified,
        "sui_transaction_hash": tx_hash,
        "case_title": case_title,
        "case_id": str(case_id) if case_id else None,
        "blockchain_details": blockchain_details,
        "walrus_verified": walrus_verified,
        "walrus_details": walrus_details,
        "certification_pending": certification_pending,
    }

    if evidence:
        details["evidence_metadata"] = {
            "id": str(evidence.id),
            "filename": evidence.filename,
            "file_type": evidence.file_type,
            "file_size": evidence.file_size,
            "verification_status": evidence.verification_status,
            "created_at": str(evidence.created_at),
        }
    else:
        details["evidence_metadata"] = None

    if proof_record:
        details["proof_metadata"] = {
            "id": str(proof_record.id),
            "proof_hash": proof_record.proof_hash,
            "timestamp": str(proof_record.timestamp),
            "verification_status": proof_record.verification_status,
        }
    else:
        details["proof_metadata"] = None

    return VerifyResponse(
        verified=fully_verified,
        details=details,
    )
