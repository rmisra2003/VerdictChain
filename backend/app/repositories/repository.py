"""Generic async repository pattern and model-specific repositories."""

from __future__ import annotations

import uuid
from typing import Any, Generic, List, Optional, Type, TypeVar

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    AuditLog,
    CaseVault,
    Evidence,
    GraphSnapshot,
    InvestigationReport,
    Proof,
    Timeline,
    User,
    WalletChallenge,
)

T = TypeVar("T")


class GenericRepository(Generic[T]):
    """Base repository providing common CRUD operations for any SQLAlchemy model.

    The model class is injected at instantiation so that every concrete
    repository can be used as a thin, stateless singleton.
    """

    def __init__(self, model: Type[T]) -> None:
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: uuid.UUID) -> Optional[T]:
        """Fetch a single record by its primary-key *id*."""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalars().first()

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> List[T]:
        """Return a paginated list of records."""
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, obj_data: dict[str, Any]) -> T:
        """Insert a new record from a plain dictionary and return it."""
        instance = self.model(**obj_data)
        db.add(instance)
        await db.flush()
        await db.refresh(instance)
        return instance

    async def update(
        self,
        db: AsyncSession,
        id: uuid.UUID,
        obj_data: dict[str, Any],
    ) -> Optional[T]:
        """Update an existing record. Returns the updated object or *None*."""
        instance = await self.get_by_id(db, id)
        if instance is None:
            return None
        for key, value in obj_data.items():
            setattr(instance, key, value)
        await db.flush()
        await db.refresh(instance)
        return instance

    async def delete(self, db: AsyncSession, id: uuid.UUID) -> bool:
        """Delete a record by *id*. Returns ``True`` if the row existed."""
        instance = await self.get_by_id(db, id)
        if instance is None:
            return False
        await db.delete(instance)
        await db.flush()
        return True

    async def count(self, db: AsyncSession) -> int:
        """Return total number of rows in the table."""
        result = await db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()


# ── User ────────────────────────────────────────────────────────────────────


class UserRepository(GenericRepository[User]):
    """Repository with user-specific queries."""

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Look up a user by their unique email address."""
        result = await db.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalars().first()

    async def get_by_wallet(self, db: AsyncSession, wallet_address: str) -> Optional[User]:
        """Look up a user by bound Sui wallet address."""
        result = await db.execute(
            select(self.model).where(self.model.wallet_address == wallet_address)
        )
        return result.scalars().first()


# ── Case Vault ──────────────────────────────────────────────────────────────


class CaseRepository(GenericRepository[CaseVault]):
    """Repository with case-specific queries."""

    async def get_by_owner(
        self,
        db: AsyncSession,
        owner_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CaseVault]:
        """Return cases belonging to a specific owner."""
        result = await db.execute(
            select(self.model)
            .where(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_with_evidence_count(
        self,
        db: AsyncSession,
        case_id: uuid.UUID,
    ) -> Optional[tuple[CaseVault, int]]:
        """Return a ``(case, evidence_count)`` tuple or *None*."""
        stmt = (
            select(self.model, func.count(Evidence.id).label("evidence_count"))
            .outerjoin(Evidence, Evidence.case_id == self.model.id)
            .where(self.model.id == case_id)
            .group_by(self.model.id)
        )
        result = await db.execute(stmt)
        row = result.first()
        if row is None:
            return None
        return (row[0], row[1])


# ── Evidence ────────────────────────────────────────────────────────────────


class EvidenceRepository(GenericRepository[Evidence]):
    """Repository with evidence-specific queries."""

    async def get_by_case(
        self, db: AsyncSession, case_id: uuid.UUID
    ) -> List[Evidence]:
        """Return all evidence items belonging to a case."""
        result = await db.execute(
            select(self.model).where(self.model.case_id == case_id)
        )
        return list(result.scalars().all())

    async def get_by_hash(
        self, db: AsyncSession, sha256_hash: str
    ) -> Optional[Evidence]:
        """Look up evidence by its SHA-256 content hash."""
        result = await db.execute(
            select(self.model).where(self.model.sha256_hash == sha256_hash)
        )
        return result.scalars().first()


# ── Proof ───────────────────────────────────────────────────────────────────


class ProofRepository(GenericRepository[Proof]):
    """Repository with proof-specific queries."""

    async def get_by_evidence(
        self, db: AsyncSession, evidence_id: uuid.UUID
    ) -> List[Proof]:
        """Return proofs linked to a specific piece of evidence."""
        result = await db.execute(
            select(self.model).where(self.model.evidence_id == evidence_id)
        )
        return list(result.scalars().all())

    async def get_by_case(
        self, db: AsyncSession, case_id: uuid.UUID
    ) -> List[Proof]:
        """Return all proofs for a given case."""
        result = await db.execute(
            select(self.model).where(self.model.case_id == case_id)
        )
        return list(result.scalars().all())

    async def get_by_tx_hash(
        self, db: AsyncSession, tx_hash: str
    ) -> Optional[Proof]:
        """Look up a proof by its blockchain transaction hash."""
        result = await db.execute(
            select(self.model).where(self.model.sui_transaction_hash == tx_hash)
        )
        return result.scalars().first()


# ── Timeline ────────────────────────────────────────────────────────────────


class TimelineRepository(GenericRepository[Timeline]):
    """Repository with timeline-specific queries."""

    async def get_by_case(
        self, db: AsyncSession, case_id: uuid.UUID
    ) -> Optional[Timeline]:
        """Return the most recent timeline for a case."""
        result = await db.execute(
            select(self.model)
            .where(self.model.case_id == case_id)
            .order_by(desc(self.model.created_at))
            .limit(1)
        )
        return result.scalars().first()


# ── Investigation Report ────────────────────────────────────────────────────


class ReportRepository(GenericRepository[InvestigationReport]):
    """Repository with report-specific queries."""

    async def get_by_case(
        self, db: AsyncSession, case_id: uuid.UUID
    ) -> Optional[InvestigationReport]:
        """Return the most recent investigation report for a case."""
        result = await db.execute(
            select(self.model)
            .where(self.model.case_id == case_id)
            .order_by(desc(self.model.created_at))
            .limit(1)
        )
        return result.scalars().first()


# ── Graph Snapshot ──────────────────────────────────────────────────────────


class GraphRepository(GenericRepository[GraphSnapshot]):
    """Repository with graph-snapshot-specific queries."""

    async def get_by_case(
        self, db: AsyncSession, case_id: uuid.UUID
    ) -> Optional[GraphSnapshot]:
        """Return the most recent graph snapshot for a case."""
        result = await db.execute(
            select(self.model)
            .where(self.model.case_id == case_id)
            .order_by(desc(self.model.created_at))
            .limit(1)
        )
        return result.scalars().first()


# ── Audit Log ───────────────────────────────────────────────────────────────


class AuditLogRepository(GenericRepository[AuditLog]):
    """Repository with audit-log-specific queries."""

    async def get_by_case(
        self,
        db: AsyncSession,
        case_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> List[AuditLog]:
        """Return audit entries for a specific case (newest first)."""
        result = await db.execute(
            select(self.model)
            .where(self.model.case_id == case_id)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> List[AuditLog]:
        """Return audit entries for a specific user (newest first)."""
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


# ── Module-level singletons ─────────────────────────────────────────────────

user_repo = UserRepository(User)
case_repo = CaseRepository(CaseVault)
evidence_repo = EvidenceRepository(Evidence)
proof_repo = ProofRepository(Proof)
timeline_repo = TimelineRepository(Timeline)
report_repo = ReportRepository(InvestigationReport)
graph_repo = GraphRepository(GraphSnapshot)
audit_log_repo = AuditLogRepository(AuditLog)
wallet_challenge_repo = GenericRepository(WalletChallenge)
