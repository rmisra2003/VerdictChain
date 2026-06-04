"""VerdictChain Pydantic v2 request / response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  AUTH SCHEMAS                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class UserResponse(BaseModel):
    """Schema for user data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    created_at: datetime


class TokenResponse(BaseModel):
    """Schema for JWT token returned after authentication."""

    access_token: str
    token_type: str = "bearer"


class UserRegisterRequest(BaseModel):
    """Request body for creating an email/password user session."""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    """Request body for creating an email/password session."""

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  CASE SCHEMAS                                                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class CaseCreate(BaseModel):
    """Schema for creating a new investigation case."""

    title: str = Field(..., min_length=1, max_length=512)
    description: str = Field(..., min_length=1)


class CaseUpdate(BaseModel):
    """Schema for partially updating an existing case."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=512)
    description: Optional[str] = Field(default=None, min_length=1)
    status: Optional[str] = Field(
        default=None, pattern=r"^(active|archived|closed)$"
    )


class CaseResponse(BaseModel):
    """Schema for case data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    status: str
    trust_score: float
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  EVIDENCE SCHEMAS                                                      ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class EvidenceResponse(BaseModel):
    """Schema for evidence metadata returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    sha256_hash: str
    walrus_blob_id: Optional[str] = None
    verification_status: str
    created_at: datetime


class EvidenceAnalysisResponse(BaseModel):
    """Schema for extracted evidence intelligence returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    evidence_id: uuid.UUID
    media_kind: str
    extraction_status: str
    extracted_text: Optional[str] = None
    text_excerpt: Optional[str] = None
    summary_json: Dict[str, Any] = Field(default_factory=dict)
    entities_json: Dict[str, Any] = Field(default_factory=dict)
    extraction_metadata: Dict[str, Any] = Field(default_factory=dict)
    walrus_blob_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EvidenceUploadResponse(BaseModel):
    """Schema returned after a successful evidence upload."""

    evidence: EvidenceResponse
    proof: Optional[ProofResponse] = None
    analysis: Optional[EvidenceAnalysisResponse] = None
    walrus_metadata: Dict[str, Any] = Field(default_factory=dict)
    message: str = "Evidence uploaded successfully"


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  PROOF SCHEMAS                                                         ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class ProofResponse(BaseModel):
    """Schema for blockchain proof data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    evidence_id: uuid.UUID
    sui_transaction_hash: Optional[str] = None
    proof_hash: str
    timestamp: datetime
    verification_status: str


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  TIMELINE SCHEMAS                                                      ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class TimelineResponse(BaseModel):
    """Schema for AI-generated timeline data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    walrus_blob_id: Optional[str] = None
    timeline_json: Dict[str, Any]
    created_at: datetime


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  INVESTIGATION REPORT SCHEMAS                                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class ReportResponse(BaseModel):
    """Schema for AI-generated investigation report returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    walrus_blob_id: Optional[str] = None
    report_json: Dict[str, Any]
    created_at: datetime


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  GRAPH SNAPSHOT SCHEMAS                                                ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class GraphResponse(BaseModel):
    """Schema for AI-generated relationship graph returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    case_id: uuid.UUID
    walrus_blob_id: Optional[str] = None
    graph_json: Dict[str, Any]
    created_at: datetime


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  VERIFICATION SCHEMAS                                                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class VerifyRequest(BaseModel):
    """Schema for requesting evidence verification."""

    file_hash: str = Field(..., min_length=64, max_length=64)
    sui_tx_hash: Optional[str] = Field(default=None, max_length=255)


class VerifyResponse(BaseModel):
    """Schema for the result of an evidence verification check."""

    verified: bool
    details: Dict[str, Any]


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  TRUST SCORE SCHEMAS                                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class TrustScoreResponse(BaseModel):
    """Schema for the computed trust score of a case."""

    score: float = Field(..., ge=0.0, le=100.0)
    level: str  # e.g. "low", "medium", "high", "verified"
    breakdown: Dict[str, Any]


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  AUDIT LOG SCHEMAS                                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════╝


class AuditLogResponse(BaseModel):
    """Schema for audit trail entries returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    case_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: Optional[uuid.UUID] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


# ── Forward-reference resolution ──────────────────────────────────────────
# EvidenceUploadResponse references ProofResponse which is defined after it,
# so we rebuild the model to resolve the forward reference.
EvidenceUploadResponse.model_rebuild()
