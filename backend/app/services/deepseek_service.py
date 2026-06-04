"""DeepSeek AI service for forensic investigation intelligence.

Uses the OpenAI Python SDK pointed at DeepSeek's API endpoint.
Every public method constructs a tailored system + user prompt, calls
the chat completions API, and returns structured data parsed from the
model's JSON response.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_PLACEHOLDER_KEYS = {"your-deepseek-api-key", ""}

client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url=settings.DEEPSEEK_BASE_URL,
)


class DeepSeekService:
    """Async service wrapping DeepSeek chat completions."""

    def __init__(self) -> None:
        self._model: str = settings.DEEPSEEK_MODEL

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    @property
    def _is_placeholder(self) -> bool:
        return settings.DEEPSEEK_API_KEY in _PLACEHOLDER_KEYS

    def _ensure_configured(self) -> None:
        if self._is_placeholder:
            raise RuntimeError("DEEPSEEK_API_KEY must be configured for AI analysis.")

    async def _chat(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> str:
        """Send a chat-completion request and return the assistant text."""
        try:
            response = await client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error("DeepSeek API error: %s", exc)
            raise

    async def _chat_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any] | list[Any]:
        """Call ``_chat`` and parse the result as JSON.

        The model is explicitly instructed to respond with JSON only,
        but we still strip markdown fences if present.
        """
        raw = await self._chat(
            system_prompt,
            user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        cleaned = raw.strip()
        # Strip markdown code fences the model sometimes adds.
        if cleaned.startswith("```"):
            first_newline = cleaned.index("\n")
            cleaned = cleaned[first_newline + 1 :]
        if cleaned.endswith("```"):
            cleaned = cleaned[: cleaned.rfind("```")]
        cleaned = cleaned.strip()
        return json.loads(cleaned)

    # ------------------------------------------------------------------
    # Entity extraction
    # ------------------------------------------------------------------

    async def extract_entities(self, text: str) -> dict[str, Any]:
        """Extract forensic entities from *text*.

        Returns a dict with keys: ``people``, ``organizations``,
        ``amounts``, ``dates``, ``contracts``, ``payments``,
        ``relationships``.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a forensic investigation AI specializing in entity extraction. "
            "Analyse the provided text and extract ALL relevant entities. "
            "Respond ONLY with valid JSON — no commentary, no markdown fences.\n\n"
            "JSON schema:\n"
            '{"people": [{"name": str, "role": str, "mentions": int}],\n'
            ' "organizations": [{"name": str, "type": str, "mentions": int}],\n'
            ' "amounts": [{"value": str, "currency": str, "context": str}],\n'
            ' "dates": [{"date": str, "context": str}],\n'
            ' "contracts": [{"id": str, "parties": [str], "value": str}],\n'
            ' "payments": [{"from": str, "to": str, "amount": str, "date": str}],\n'
            ' "relationships": [{"from": str, "to": str, "type": str}]}'
        )
        user_prompt = f"Extract entities from the following text:\n\n{text}"
        result = await self._chat_json(system_prompt, user_prompt)
        return result  # type: ignore[return-value]

    async def analyze_evidence(
        self,
        *,
        filename: str,
        content_type: str,
        sha256_hash: str,
        extracted_text: str,
        extraction_metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Summarize one evidence artifact into graph/report-ready JSON."""
        self._ensure_configured()

        system_prompt = (
            "You are a forensic evidence-intelligence analyst. Convert the "
            "provided extracted evidence text and metadata into concise, "
            "courtroom-friendly structured JSON. If the text is sparse or "
            "metadata-only, say that explicitly and avoid inventing facts. "
            "Respond ONLY with valid JSON.\n\n"
            "JSON schema:\n"
            '{"summary": str,\n'
            ' "key_observations": [str],\n'
            ' "people": [{"name": str, "role": str, "confidence": float}],\n'
            ' "organizations": [{"name": str, "type": str, "confidence": float}],\n'
            ' "amounts": [{"value": str, "currency": str, "context": str}],\n'
            ' "dates": [{"date": str, "context": str}],\n'
            ' "locations": [{"name": str, "context": str}],\n'
            ' "relationships": [{"from": str, "to": str, "type": str, "evidence": str}],\n'
            ' "risk_flags": [{"flag": str, "severity": "low"|"medium"|"high"|"critical", "rationale": str}],\n'
            ' "recommended_next_steps": [str],\n'
            ' "confidence": float}'
        )
        user_prompt = (
            f"Filename: {filename}\n"
            f"Content type: {content_type}\n"
            f"SHA-256: {sha256_hash}\n"
            f"Extraction metadata:\n{json.dumps(extraction_metadata, default=str)}\n\n"
            f"Extracted evidence text:\n{extracted_text or '[No extracted text available]'}"
        )
        result = await self._chat_json(system_prompt, user_prompt, max_tokens=4096)
        return result if isinstance(result, dict) else {"summary": "", "items": result}

    # ------------------------------------------------------------------
    # Summarisation
    # ------------------------------------------------------------------

    async def generate_summary(
        self,
        evidence_texts: list[str],
        case_title: str,
    ) -> str:
        """Generate an executive summary across multiple evidence texts."""
        self._ensure_configured()

        system_prompt = (
            "You are a forensic analyst. Write a concise executive summary "
            "of the evidence presented. Highlight key findings, suspicious "
            "patterns, and recommended next steps. Use plain English."
        )
        combined = "\n---\n".join(evidence_texts)
        user_prompt = (
            f"Case: {case_title}\n\nEvidence documents:\n{combined}\n\n"
            "Write an executive summary."
        )
        return await self._chat(system_prompt, user_prompt, temperature=0.4, max_tokens=2048)

    # ------------------------------------------------------------------
    # Document comparison
    # ------------------------------------------------------------------

    async def compare_documents(
        self,
        doc1: str,
        doc2: str,
    ) -> dict[str, Any]:
        """Find contradictions and similarities between two documents.

        Returns:
            dict with ``contradictions``, ``similarities``,
            ``risk_level``, and ``summary``.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a forensic document analyst. Compare the two documents "
            "and identify contradictions, similarities, and risk level. "
            "Respond ONLY with valid JSON.\n\n"
            "JSON schema:\n"
            '{"contradictions": [{"topic": str, "doc1_claim": str, "doc2_claim": str, "severity": str}],\n'
            ' "similarities": [{"topic": str, "description": str}],\n'
            ' "risk_level": "low"|"medium"|"high"|"critical",\n'
            ' "summary": str}'
        )
        user_prompt = f"Document 1:\n{doc1}\n\nDocument 2:\n{doc2}"
        result = await self._chat_json(system_prompt, user_prompt)
        return result  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Timeline generation
    # ------------------------------------------------------------------

    async def generate_timeline(
        self,
        evidence_list: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Generate a chronological timeline from evidence metadata.

        Each evidence dict should ideally contain ``title``, ``date``,
        ``description``, and ``type``.

        Returns:
            A sorted list of timeline event dicts.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a forensic timeline analyst. Given a list of evidence "
            "items, construct a chronological timeline of events. "
            "Respond ONLY with a JSON array.\n\n"
            "Each element schema:\n"
            '{"date": str, "title": str, "description": str, '
            '"evidence_ids": [str], "significance": "low"|"medium"|"high"|"critical"}'
        )
        user_prompt = f"Evidence items:\n{json.dumps(evidence_list, default=str)}"
        result = await self._chat_json(system_prompt, user_prompt, max_tokens=4096)
        return result  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Full report
    # ------------------------------------------------------------------

    async def generate_report(
        self,
        case_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a comprehensive investigation report.

        Returns a dict with sections: ``executive_summary``,
        ``key_findings``, ``timeline``, ``contradictions``,
        ``risk_assessment``, ``recommendations``.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a senior forensic investigator. Generate a comprehensive "
            "investigation report for the case data provided. "
            "Respond ONLY with valid JSON.\n\n"
            "JSON schema:\n"
            '{"executive_summary": str,\n'
            ' "key_findings": [{"finding": str, "severity": str, "evidence_refs": [str]}],\n'
            ' "timeline": [{"date": str, "event": str, "significance": str}],\n'
            ' "contradictions": [{"description": str, "severity": str}],\n'
            ' "risk_assessment": {"level": str, "factors": [str], "score": int},\n'
            ' "recommendations": [{"action": str, "priority": str, "rationale": str}]}'
        )
        user_prompt = f"Case data:\n{json.dumps(case_data, default=str)}"
        result = await self._chat_json(system_prompt, user_prompt, max_tokens=8192)
        return result  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Trust-score AI component
    # ------------------------------------------------------------------

    async def calculate_trust_score(
        self,
        verification_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Use AI to calculate a 0–100 trust score with a breakdown.

        Returns:
            dict with ``score``, ``level``, and ``breakdown``.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a trust-assessment engine. Analyse the verification data "
            "and return a trust score from 0 to 100. "
            "Respond ONLY with valid JSON.\n\n"
            "JSON schema:\n"
            '{"score": int,\n'
            ' "level": "Critical"|"Low"|"Medium"|"High"|"Very High",\n'
            ' "breakdown": {\n'
            '   "hash_verification": int,\n'
            '   "blockchain_validation": int,\n'
            '   "evidence_completeness": int,\n'
            '   "consistency": int,\n'
            '   "source_reliability": int\n'
            ' },\n'
            ' "reasoning": str}'
        )
        user_prompt = f"Verification data:\n{json.dumps(verification_data, default=str)}"
        result = await self._chat_json(system_prompt, user_prompt)
        return result  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Investigation graph
    # ------------------------------------------------------------------

    async def generate_graph_data(
        self,
        entities: list[dict[str, Any]],
        evidence_list: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Generate nodes and edges for an investigation graph.

        Returns:
            dict with ``nodes`` and ``edges`` lists.
        """
        self._ensure_configured()

        system_prompt = (
            "You are a forensic link-analysis AI. Given entities and evidence, "
            "generate a graph structure with nodes and edges representing "
            "relationships. Respond ONLY with valid JSON.\n\n"
            "JSON schema:\n"
            '{"nodes": [{"id": str, "label": str, "type": str, "metadata": dict}],\n'
            ' "edges": [{"source": str, "target": str, "label": str, "weight": float}]}'
        )
        user_prompt = (
            f"Entities:\n{json.dumps(entities, default=str)}\n\n"
            f"Evidence:\n{json.dumps(evidence_list, default=str)}"
        )
        result = await self._chat_json(system_prompt, user_prompt, max_tokens=8192)
        return result  # type: ignore[return-value]

# Module-level singleton
deepseek_service = DeepSeekService()
