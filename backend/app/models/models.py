"""VerdictChain SQLAlchemy ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, List, Optional

from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# 1. User
# ---------------------------------------------------------------------------
class User(Base):
    """Registered user of the VerdictChain platform."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    cases: Mapped[List[CaseVault]] = relationship(
        "CaseVault", back_populates="owner", lazy="selectin"
    )
    audit_logs: Mapped[List[AuditLog]] = relationship(
        "AuditLog", back_populates="user", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!s} email={self.email!r}>"


# ---------------------------------------------------------------------------
# 2. CaseVault
# ---------------------------------------------------------------------------
class CaseVault(Base):
    """A forensic investigation case containing evidence and analysis."""

    __tablename__ = "case_vaults"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )  # active | archived | closed
    trust_score: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ── Relationships ──────────────────────────────────────────────────
    owner: Mapped[User] = relationship(
        "User", back_populates="cases", lazy="selectin"
    )
    evidences: Mapped[List[Evidence]] = relationship(
        "Evidence", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )
    proofs: Mapped[List[Proof]] = relationship(
        "Proof", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )
    timelines: Mapped[List[Timeline]] = relationship(
        "Timeline", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )
    reports: Mapped[List[InvestigationReport]] = relationship(
        "InvestigationReport", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )
    graph_snapshots: Mapped[List[GraphSnapshot]] = relationship(
        "GraphSnapshot", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List[AuditLog]] = relationship(
        "AuditLog", back_populates="case", lazy="selectin",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_case_vaults_owner_id", "owner_id"),
        Index("ix_case_vaults_status", "status"),
    )

    def __repr__(self) -> str:
        return (
            f"<CaseVault id={self.id!s} title={self.title!r} "
            f"status={self.status!r}>"
        )


# ---------------------------------------------------------------------------
# 3. Evidence
# ---------------------------------------------------------------------------
class Evidence(Base):
    """A piece of evidence (file) uploaded to a case."""

    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    walrus_blob_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending | verified | failed | tampered
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    case: Mapped[CaseVault] = relationship(
        "CaseVault", back_populates="evidences", lazy="selectin"
    )
    proofs: Mapped[List[Proof]] = relationship(
        "Proof", back_populates="evidence", lazy="selectin",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_evidence_case_id", "case_id"),
        Index("ix_evidence_sha256_hash", "sha256_hash"),
    )

    def __repr__(self) -> str:
        return (
            f"<Evidence id={self.id!s} filename={self.filename!r} "
            f"status={self.verification_status!r}>"
        )


# ---------------------------------------------------------------------------
# 4. Proof
# ---------------------------------------------------------------------------
class Proof(Base):
    """On-chain proof record linking evidence to a blockchain transaction."""

    __tablename__ = "proofs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="CASCADE"), nullable=False
    )
    evidence_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False
    )
    sui_transaction_hash: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    proof_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    verification_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending | verified | failed

    # ── Relationships ──────────────────────────────────────────────────
    case: Mapped[CaseVault] = relationship(
        "CaseVault", back_populates="proofs", lazy="selectin"
    )
    evidence: Mapped[Evidence] = relationship(
        "Evidence", back_populates="proofs", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_proofs_case_id", "case_id"),
        Index("ix_proofs_evidence_id", "evidence_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Proof id={self.id!s} proof_hash={self.proof_hash!r} "
            f"status={self.verification_status!r}>"
        )


# ---------------------------------------------------------------------------
# 5. Timeline
# ---------------------------------------------------------------------------
class Timeline(Base):
    """AI-generated chronological timeline for a case."""

    __tablename__ = "timelines"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="CASCADE"), nullable=False
    )
    walrus_blob_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    timeline_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    case: Mapped[CaseVault] = relationship(
        "CaseVault", back_populates="timelines", lazy="selectin"
    )

    __table_args__ = (Index("ix_timelines_case_id", "case_id"),)

    def __repr__(self) -> str:
        return f"<Timeline id={self.id!s} case_id={self.case_id!s}>"


# ---------------------------------------------------------------------------
# 6. InvestigationReport
# ---------------------------------------------------------------------------
class InvestigationReport(Base):
    """AI-generated investigation report for a case."""

    __tablename__ = "investigation_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="CASCADE"), nullable=False
    )
    walrus_blob_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    report_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    case: Mapped[CaseVault] = relationship(
        "CaseVault", back_populates="reports", lazy="selectin"
    )

    __table_args__ = (Index("ix_investigation_reports_case_id", "case_id"),)

    def __repr__(self) -> str:
        return f"<InvestigationReport id={self.id!s} case_id={self.case_id!s}>"


# ---------------------------------------------------------------------------
# 7. GraphSnapshot
# ---------------------------------------------------------------------------
class GraphSnapshot(Base):
    """AI-generated relationship graph snapshot for a case."""

    __tablename__ = "graph_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="CASCADE"), nullable=False
    )
    walrus_blob_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    graph_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    case: Mapped[CaseVault] = relationship(
        "CaseVault", back_populates="graph_snapshots", lazy="selectin"
    )

    __table_args__ = (Index("ix_graph_snapshots_case_id", "case_id"),)

    def __repr__(self) -> str:
        return f"<GraphSnapshot id={self.id!s} case_id={self.case_id!s}>"


# ---------------------------------------------------------------------------
# 8. AuditLog
# ---------------------------------------------------------------------------
class AuditLog(Base):
    """Immutable audit trail entry for any significant platform action."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("case_vaults.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # e.g. upload, verify, generate_report
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, nullable=True
    )
    details: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────
    user: Mapped[Optional[User]] = relationship(
        "User", back_populates="audit_logs", lazy="selectin"
    )
    case: Mapped[Optional[CaseVault]] = relationship(
        "CaseVault", back_populates="audit_logs", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_case_id", "case_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id!s} action={self.action!r} "
            f"entity_type={self.entity_type!r}>"
        )
