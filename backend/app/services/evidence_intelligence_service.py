"""Evidence intelligence orchestration.

This service turns uploaded evidence bytes into extracted text, DeepSeek
analysis JSON, graph-ready entity data, and a Walrus-backed AI artifact.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.deepseek_service import deepseek_service
from app.services.media_extraction_service import media_extraction_service
from app.services.walrus_service import walrus_service

logger = logging.getLogger(__name__)


class EvidenceIntelligenceService:
    """Run media extraction and DeepSeek analysis for one evidence file."""

    async def analyze_upload(
        self,
        *,
        file_data: bytes,
        content_type: str,
        filename: str,
        sha256_hash: str,
    ) -> dict[str, Any]:
        """Return a database-ready evidence analysis payload."""
        extraction = await media_extraction_service.extract(
            file_data=file_data,
            content_type=content_type,
            filename=filename,
        )
        metadata = extraction.as_metadata()

        summary_json = self._fallback_summary(
            filename=filename,
            content_type=content_type,
            sha256_hash=sha256_hash,
            extraction_status=extraction.extraction_status,
            metadata=metadata,
        )
        deepseek_warnings: list[str] = []
        try:
            summary_json = await deepseek_service.analyze_evidence(
                filename=filename,
                content_type=content_type,
                sha256_hash=sha256_hash,
                extracted_text=extraction.extracted_text,
                extraction_metadata=metadata,
            )
        except Exception as exc:
            logger.warning("DeepSeek evidence analysis failed for %s: %s", filename, exc)
            deepseek_warnings.append(f"DeepSeek analysis unavailable: {exc}")

        metadata["deepseek_warnings"] = deepseek_warnings
        entities_json = self._entities_from_summary(summary_json)

        artifact = {
            "type": "verdictchain.evidence_analysis.v1",
            "filename": filename,
            "content_type": content_type,
            "sha256_hash": sha256_hash,
            "media_kind": extraction.media_kind,
            "extraction_status": extraction.extraction_status,
            "text_excerpt": extraction.text_excerpt,
            "summary": summary_json,
            "entities": entities_json,
            "metadata": metadata,
        }
        walrus_blob_id = None
        try:
            walrus_blob_id = await walrus_service.upload_json(artifact)
        except Exception as exc:
            logger.warning("Failed to store evidence analysis artifact on Walrus: %s", exc)
            metadata.setdefault("warnings", []).append(
                f"AI artifact Walrus storage failed: {exc}"
            )

        return {
            "media_kind": extraction.media_kind,
            "extraction_status": extraction.extraction_status,
            "extracted_text": extraction.extracted_text or None,
            "text_excerpt": extraction.text_excerpt or None,
            "summary_json": summary_json,
            "entities_json": entities_json,
            "extraction_metadata": metadata,
            "walrus_blob_id": walrus_blob_id,
        }

    def _fallback_summary(
        self,
        *,
        filename: str,
        content_type: str,
        sha256_hash: str,
        extraction_status: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "summary": (
                f"{filename} was registered as {content_type}. "
                f"Text intelligence status: {extraction_status}."
            ),
            "key_observations": [
                "Raw file hash and storage proof are available for verification.",
                "DeepSeek analysis becomes richer when OpenAI/Tesseract media extraction returns readable text or transcript data.",
            ],
            "people": [],
            "organizations": [],
            "amounts": [],
            "dates": [],
            "locations": [],
            "relationships": [],
            "risk_flags": [],
            "recommended_next_steps": [
                "Verify the SHA-256 fingerprint from the public verifier.",
                "Upload text-rich evidence, readable images, or short audio clips for richer analysis.",
            ],
            "confidence": 0.35 if extraction_status == "metadata_only" else 0.55,
            "sha256_hash": sha256_hash,
            "metadata": metadata,
        }

    def _entities_from_summary(self, summary_json: dict[str, Any]) -> dict[str, Any]:
        return {
            "people": summary_json.get("people", []) or [],
            "organizations": summary_json.get("organizations", []) or [],
            "amounts": summary_json.get("amounts", []) or [],
            "dates": summary_json.get("dates", []) or [],
            "locations": summary_json.get("locations", []) or [],
            "relationships": summary_json.get("relationships", []) or [],
            "risk_flags": summary_json.get("risk_flags", []) or [],
        }


evidence_intelligence_service = EvidenceIntelligenceService()
