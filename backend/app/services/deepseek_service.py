"""DeepSeek AI service for forensic investigation intelligence.

Uses the OpenAI Python SDK pointed at DeepSeek's API endpoint.
Every public method constructs a tailored system + user prompt, calls
the chat completions API, and returns structured data parsed from the
model's JSON response.

When the API key is a placeholder the methods return realistic mock
data so the rest of the stack can be developed and demoed independently.
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
        if self._is_placeholder:
            return self._mock_entities()

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

    # ------------------------------------------------------------------
    # Summarisation
    # ------------------------------------------------------------------

    async def generate_summary(
        self,
        evidence_texts: list[str],
        case_title: str,
    ) -> str:
        """Generate an executive summary across multiple evidence texts."""
        if self._is_placeholder:
            return self._mock_summary(case_title)

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
        if self._is_placeholder:
            return self._mock_comparison()

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
        if self._is_placeholder:
            return self._mock_timeline()

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
        if self._is_placeholder:
            return self._mock_report()

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
        if self._is_placeholder:
            return self._mock_trust_score()

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
        if self._is_placeholder:
            return self._mock_graph_data()

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

    # ==================================================================
    # Mock helpers (placeholder API key)
    # ==================================================================

    @staticmethod
    def _mock_entities() -> dict[str, Any]:
        return {
            "people": [
                {"name": "John Smith", "role": "CEO", "mentions": 5},
                {"name": "Jane Doe", "role": "CFO", "mentions": 3},
                {"name": "Robert Chen", "role": "Contractor", "mentions": 2},
            ],
            "organizations": [
                {"name": "Acme Corp", "type": "Corporation", "mentions": 7},
                {"name": "Global Trust Bank", "type": "Financial Institution", "mentions": 4},
            ],
            "amounts": [
                {"value": "2500000", "currency": "USD", "context": "Contract payment"},
                {"value": "750000", "currency": "USD", "context": "Wire transfer"},
            ],
            "dates": [
                {"date": "2024-01-15", "context": "Contract signing"},
                {"date": "2024-03-20", "context": "Payment date"},
            ],
            "contracts": [
                {"id": "CTR-2024-001", "parties": ["Acme Corp", "Global Trust Bank"], "value": "$2,500,000"},
            ],
            "payments": [
                {"from": "Acme Corp", "to": "Robert Chen", "amount": "$750,000", "date": "2024-03-20"},
            ],
            "relationships": [
                {"from": "John Smith", "to": "Acme Corp", "type": "CEO"},
                {"from": "Jane Doe", "to": "Acme Corp", "type": "CFO"},
                {"from": "Acme Corp", "to": "Global Trust Bank", "type": "banking_relationship"},
            ],
        }

    @staticmethod
    def _mock_summary(case_title: str) -> str:
        return (
            f"Executive Summary — {case_title}\n\n"
            "Analysis of the submitted evidence reveals a pattern of financial "
            "transactions that warrant further investigation. Key findings include "
            "irregular payment schedules, discrepancies between contracted amounts "
            "and actual disbursements, and potential conflicts of interest among "
            "named parties.\n\n"
            "Three high-priority items have been identified:\n"
            "1. A $750,000 payment to a contractor with no matching purchase order.\n"
            "2. Two conflicting dates referenced in separate documents.\n"
            "3. An undisclosed relationship between the signatory and the beneficiary.\n\n"
            "Recommended next steps: obtain original bank statements, interview "
            "named individuals, and cross-reference with public procurement records."
        )

    @staticmethod
    def _mock_comparison() -> dict[str, Any]:
        return {
            "contradictions": [
                {
                    "topic": "Payment amount",
                    "doc1_claim": "Payment was $500,000",
                    "doc2_claim": "Payment was $750,000",
                    "severity": "high",
                },
                {
                    "topic": "Contract date",
                    "doc1_claim": "Signed on January 15, 2024",
                    "doc2_claim": "Signed on February 1, 2024",
                    "severity": "medium",
                },
            ],
            "similarities": [
                {"topic": "Parties involved", "description": "Both documents reference Acme Corp and Global Trust Bank"},
                {"topic": "Project scope", "description": "Both describe infrastructure development work"},
            ],
            "risk_level": "high",
            "summary": (
                "Significant contradictions found in payment amounts and dates. "
                "The discrepancy of $250,000 between documents raises concerns "
                "about potential manipulation."
            ),
        }

    @staticmethod
    def _mock_timeline() -> list[dict[str, Any]]:
        return [
            {
                "date": "2024-01-15",
                "title": "Contract Execution",
                "description": "Initial contract signed between Acme Corp and Global Trust Bank",
                "evidence_ids": ["EV-001"],
                "significance": "high",
            },
            {
                "date": "2024-02-10",
                "title": "First Payment",
                "description": "Initial payment of $500,000 processed",
                "evidence_ids": ["EV-002"],
                "significance": "medium",
            },
            {
                "date": "2024-03-20",
                "title": "Irregular Transfer",
                "description": "Unscheduled wire transfer of $750,000 to contractor",
                "evidence_ids": ["EV-003", "EV-004"],
                "significance": "critical",
            },
        ]

    @staticmethod
    def _mock_report() -> dict[str, Any]:
        return {
            "executive_summary": (
                "This investigation has uncovered a series of financial irregularities "
                "spanning Q1 2024. Evidence suggests possible misappropriation of funds "
                "through inflated contractor payments and falsified documentation."
            ),
            "key_findings": [
                {
                    "finding": "Inflated contractor payments exceeding approved amounts by 50%",
                    "severity": "critical",
                    "evidence_refs": ["EV-001", "EV-003"],
                },
                {
                    "finding": "Falsified contract dates to circumvent approval deadlines",
                    "severity": "high",
                    "evidence_refs": ["EV-002"],
                },
                {
                    "finding": "Undisclosed conflict of interest between approver and beneficiary",
                    "severity": "high",
                    "evidence_refs": ["EV-004"],
                },
            ],
            "timeline": [
                {"date": "2024-01-15", "event": "Contract execution", "significance": "high"},
                {"date": "2024-02-10", "event": "First payment processed", "significance": "medium"},
                {"date": "2024-03-20", "event": "Irregular transfer detected", "significance": "critical"},
            ],
            "contradictions": [
                {"description": "Payment amount discrepancy ($500k vs $750k)", "severity": "high"},
                {"description": "Contract date mismatch across documents", "severity": "medium"},
            ],
            "risk_assessment": {
                "level": "high",
                "factors": [
                    "Large unexplained payments",
                    "Document inconsistencies",
                    "Undisclosed relationships",
                ],
                "score": 78,
            },
            "recommendations": [
                {
                    "action": "Obtain original bank statements for verification",
                    "priority": "high",
                    "rationale": "Needed to confirm actual transaction amounts",
                },
                {
                    "action": "Interview named individuals under formal caution",
                    "priority": "high",
                    "rationale": "Resolve contradictions between documents",
                },
                {
                    "action": "Cross-reference with public procurement records",
                    "priority": "medium",
                    "rationale": "Verify legitimacy of contract award process",
                },
            ],
        }

    @staticmethod
    def _mock_trust_score() -> dict[str, Any]:
        return {
            "score": 72,
            "level": "High",
            "breakdown": {
                "hash_verification": 90,
                "blockchain_validation": 85,
                "evidence_completeness": 60,
                "consistency": 55,
                "source_reliability": 70,
            },
            "reasoning": (
                "Evidence hashes are intact and blockchain proofs are valid. "
                "However, several pieces of evidence lack complete metadata "
                "and two documents contain contradictory claims."
            ),
        }

    @staticmethod
    def _mock_graph_data() -> dict[str, Any]:
        return {
            "nodes": [
                {"id": "person-1", "label": "John Smith", "type": "person", "metadata": {"role": "CEO"}},
                {"id": "person-2", "label": "Jane Doe", "type": "person", "metadata": {"role": "CFO"}},
                {"id": "person-3", "label": "Robert Chen", "type": "person", "metadata": {"role": "Contractor"}},
                {"id": "org-1", "label": "Acme Corp", "type": "organization", "metadata": {"type": "Corporation"}},
                {"id": "org-2", "label": "Global Trust Bank", "type": "organization", "metadata": {"type": "Bank"}},
                {"id": "payment-1", "label": "$750,000 Transfer", "type": "transaction", "metadata": {"date": "2024-03-20"}},
            ],
            "edges": [
                {"source": "person-1", "target": "org-1", "label": "CEO of", "weight": 1.0},
                {"source": "person-2", "target": "org-1", "label": "CFO of", "weight": 1.0},
                {"source": "org-1", "target": "org-2", "label": "banking relationship", "weight": 0.8},
                {"source": "org-1", "target": "payment-1", "label": "initiated", "weight": 0.9},
                {"source": "payment-1", "target": "person-3", "label": "paid to", "weight": 0.9},
            ],
        }


# Module-level singleton
deepseek_service = DeepSeekService()
