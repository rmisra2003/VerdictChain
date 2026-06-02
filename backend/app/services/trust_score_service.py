"""Trust-score calculation engine.

Computes a composite 0–100 trust score for a case by evaluating five
independent dimensions:

* **hash_verification** – are all evidence hashes still valid?
* **walrus_integrity** – are all Walrus blobs reachable?
* **blockchain_validation** – have proofs been anchored on chain?
* **evidence_completeness** – is evidence metadata complete?
* **contradiction** – are there document contradictions?

The final score is a weighted average of the dimension scores.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.walrus_service import walrus_service
from app.services.sui_service import sui_service

logger = logging.getLogger(__name__)

# Weights for each scoring dimension (must sum to 1.0).
_WEIGHTS: dict[str, float] = {
    "hash_verification": 0.25,
    "walrus_integrity": 0.20,
    "blockchain_validation": 0.25,
    "evidence_completeness": 0.15,
    "contradiction": 0.15,
}

# Level boundaries (upper-bound inclusive).
_LEVEL_BOUNDARIES: list[tuple[int, str]] = [
    (30, "Critical"),
    (50, "Low"),
    (70, "Medium"),
    (90, "High"),
    (100, "Very High"),
]


def _score_to_level(score: float) -> str:
    """Map a numeric score to a human-readable level."""
    rounded = int(round(score))
    for upper, label in _LEVEL_BOUNDARIES:
        if rounded <= upper:
            return label
    return "Very High"


class TrustScoreService:
    """Calculate a trust score for a case by inspecting its evidence and proofs."""

    async def calculate(
        self,
        case_id: UUID,
        db: AsyncSession,
    ) -> dict[str, Any]:
        """Compute and return the trust score for *case_id*.

        Returns:
            dict with ``score`` (float 0–100), ``level`` (str), and
            ``breakdown`` (dict of dimension → individual score).
        """
        # ── Fetch evidence rows ──────────────────────────────────────
        evidence_rows = await self._get_evidence(case_id, db)
        proof_rows = await self._get_proofs(case_id, db)

        # ── Dimension scores ─────────────────────────────────────────
        hash_score = await self._hash_verification_score(evidence_rows)
        walrus_score = await self._walrus_integrity_score(evidence_rows)
        chain_score = await self._blockchain_validation_score(proof_rows)
        completeness_score = self._evidence_completeness_score(evidence_rows)
        contradiction_score = self._contradiction_score(evidence_rows)

        breakdown: dict[str, float] = {
            "hash_verification": round(hash_score, 2),
            "walrus_integrity": round(walrus_score, 2),
            "blockchain_validation": round(chain_score, 2),
            "evidence_completeness": round(completeness_score, 2),
            "contradiction": round(contradiction_score, 2),
        }

        # Weighted total
        total = sum(breakdown[dim] * _WEIGHTS[dim] for dim in _WEIGHTS)
        total = round(min(max(total, 0.0), 100.0), 2)

        return {
            "score": total,
            "level": _score_to_level(total),
            "breakdown": breakdown,
            "evidence_count": len(evidence_rows),
            "proof_count": len(proof_rows),
        }

    # ------------------------------------------------------------------
    # Data fetching helpers
    # ------------------------------------------------------------------

    async def _get_evidence(
        self,
        case_id: UUID,
        db: AsyncSession,
    ) -> list[Any]:
        """Fetch evidence rows for *case_id*.

        We import the model lazily to avoid circular-import issues at
        module-load time (models may not yet be defined when this
        module is first imported).
        """
        try:
            from app.models.models import Evidence

            stmt = select(Evidence).where(Evidence.case_id == case_id)
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as exc:
            logger.warning(
                "Could not query evidence for case %s: %s – returning empty list",
                case_id,
                exc,
            )
            return []

    async def _get_proofs(
        self,
        case_id: UUID,
        db: AsyncSession,
    ) -> list[Any]:
        """Fetch blockchain proof rows linked to *case_id*."""
        try:
            from app.models.models import Proof

            stmt = select(Proof).where(Proof.case_id == case_id)
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as exc:
            logger.warning(
                "Could not query proofs for case %s: %s – returning empty list",
                case_id,
                exc,
            )
            return []

    # ------------------------------------------------------------------
    # Dimension scorers
    # ------------------------------------------------------------------

    async def _hash_verification_score(self, evidence_rows: list[Any]) -> float:
        """Score how many evidence hashes are consistent (0–100).

        If *sha256_hash* is stored we recompute it from the file content
        on Walrus and compare.  When there is no evidence at all we
        return a neutral 50.
        """
        if not evidence_rows:
            return 50.0

        valid = 0
        total = 0
        for ev in evidence_rows:
            stored_hash: str | None = getattr(ev, "sha256_hash", None)
            blob_id: str | None = getattr(ev, "walrus_blob_id", None) or getattr(ev, "blob_id", None)
            if not stored_hash:
                # No hash stored → can't verify, count as partial.
                continue
            total += 1
            if not blob_id:
                # Hash exists but no blob to verify against.
                continue
            try:
                data = await walrus_service.download_file(blob_id)
                computed = hashlib.sha256(data).hexdigest()
                if computed == stored_hash:
                    valid += 1
            except Exception:
                logger.debug("Hash verification failed for blob %s", blob_id)

        if total == 0:
            return 50.0
        return (valid / total) * 100.0

    async def _walrus_integrity_score(self, evidence_rows: list[Any]) -> float:
        """Score blob reachability on Walrus (0–100)."""
        if not evidence_rows:
            return 50.0

        reachable = 0
        total = 0
        for ev in evidence_rows:
            blob_id: str | None = getattr(ev, "walrus_blob_id", None) or getattr(ev, "blob_id", None)
            if not blob_id:
                continue
            total += 1
            try:
                if await walrus_service.verify_blob(blob_id):
                    reachable += 1
            except Exception:
                pass

        if total == 0:
            return 50.0
        return (reachable / total) * 100.0

    async def _blockchain_validation_score(self, proof_rows: list[Any]) -> float:
        """Score on-chain proof verification (0–100)."""
        if not proof_rows:
            return 50.0

        verified = 0
        total = len(proof_rows)
        for proof in proof_rows:
            tx_hash: str | None = getattr(proof, "sui_transaction_hash", None)
            if not tx_hash:
                continue
            try:
                result = await sui_service.verify_proof(tx_hash)
                if result.get("verified"):
                    verified += 1
            except Exception:
                pass

        return (verified / total) * 100.0

    @staticmethod
    def _evidence_completeness_score(evidence_rows: list[Any]) -> float:
        """Score metadata completeness (0–100).

        Each piece of evidence is checked for a set of expected fields.
        """
        if not evidence_rows:
            return 50.0

        expected_fields = [
            "filename",
            "sha256_hash",
            "file_type",
            "file_size",
            "walrus_blob_id",
        ]
        total_fields = len(evidence_rows) * len(expected_fields)
        filled = 0
        for ev in evidence_rows:
            for field in expected_fields:
                value = getattr(ev, field, None)
                if value is not None and value != "":
                    filled += 1

        return (filled / total_fields) * 100.0

    @staticmethod
    def _contradiction_score(evidence_rows: list[Any]) -> float:
        """Heuristic contradiction score (0–100).

        Higher is *better* (fewer contradictions).  For the hackathon
        demo this returns a simple heuristic based on evidence volume.
        Real implementation would cross-reference AI-extracted entities.
        """
        if not evidence_rows:
            return 50.0

        # More evidence pieces → slightly lower contradiction score
        # (more potential for conflict).  This is a placeholder heuristic
        # until the AI contradiction detector is wired in.
        count = len(evidence_rows)
        if count <= 2:
            return 90.0
        if count <= 5:
            return 75.0
        if count <= 10:
            return 65.0
        return 55.0


# Module-level singleton
trust_score_service = TrustScoreService()
