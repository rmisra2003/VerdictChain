"""Tatum MCP (Model Context Protocol) client for AI-driven blockchain queries.

The MCP endpoint exposes a higher-level, AI-friendly API on top of raw
blockchain data.  When the Tatum API key is a placeholder the client
returns realistic mock data so the hackathon demo functions end-to-end.
"""

from __future__ import annotations

import hashlib
import logging
import time
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
_PLACEHOLDER_KEYS = {"your-tatum-api-key", ""}


class TatumMCPService:
    """Async client for the Tatum MCP blockchain-query service."""

    def __init__(self) -> None:
        self._mcp_url: str = settings.TATUM_MCP_URL.rstrip("/")
        self._api_key: str = settings.TATUM_API_KEY

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def _is_placeholder(self) -> bool:
        return self._api_key in _PLACEHOLDER_KEYS

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-api-key": self._api_key,
        }

    async def _post(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        """POST to the MCP service and return the JSON body."""
        url = f"{self._mcp_url}/{endpoint.lstrip('/')}"
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=self._headers())
            response.raise_for_status()
            return response.json()

    async def _get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """GET from the MCP service and return the JSON body."""
        url = f"{self._mcp_url}/{endpoint.lstrip('/')}"
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=self._headers())
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _sim_hash(seed: str) -> str:
        return hashlib.sha256(seed.encode()).hexdigest()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def verify_blockchain_state(self, tx_hash: str) -> dict[str, Any]:
        """Verify the current on-chain state of a transaction.

        Returns:
            dict with ``tx_hash``, ``verified``, ``status``, ``block_height``,
            ``timestamp``, and ``confirmations``.
        """
        if self._is_placeholder:
            return {
                "tx_hash": tx_hash,
                "verified": True,
                "status": "simulated",
                "block_height": 1_000_000 + abs(hash(tx_hash)) % 100_000,
                "timestamp": int(time.time() * 1000),
                "confirmations": 12,
                "network": f"sui-{settings.SUI_NETWORK}",
            }

        try:
            result = await self._post(
                "v1/blockchain/verify",
                {"tx_hash": tx_hash, "network": f"sui-{settings.SUI_NETWORK}"},
            )
            return {
                "tx_hash": tx_hash,
                "verified": result.get("verified", False),
                "status": result.get("status", "unknown"),
                "block_height": result.get("block_height"),
                "timestamp": result.get("timestamp"),
                "confirmations": result.get("confirmations", 0),
                "network": f"sui-{settings.SUI_NETWORK}",
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("MCP verify_blockchain_state error: %s", exc)
            raise

    async def retrieve_transaction_history(
        self,
        address: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Retrieve recent transactions for *address*.

        Returns:
            A list of transaction summary dicts.
        """
        if self._is_placeholder:
            now_ms = int(time.time() * 1000)
            return [
                {
                    "tx_hash": self._sim_hash(f"{address}-{i}"),
                    "timestamp": now_ms - i * 60_000,
                    "status": "success",
                    "type": "proof_submission",
                    "network": f"sui-{settings.SUI_NETWORK}",
                }
                for i in range(min(limit, 5))
            ]

        try:
            result = await self._get(
                "v1/blockchain/transactions",
                {"address": address, "limit": limit, "network": f"sui-{settings.SUI_NETWORK}"},
            )
            return result.get("transactions", [])
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("MCP retrieve_transaction_history error: %s", exc)
            raise

    async def retrieve_wallet_metadata(self, address: str) -> dict[str, Any]:
        """Return metadata about a wallet / account address.

        Returns:
            dict with ``address``, ``balance``, ``object_count``, ``status``.
        """
        if self._is_placeholder:
            return {
                "address": address,
                "balance": "1000000000",
                "object_count": 3,
                "status": "simulated",
                "network": f"sui-{settings.SUI_NETWORK}",
                "created_at": int(time.time() * 1000) - 86_400_000,
            }

        try:
            result = await self._get(
                "v1/blockchain/wallet",
                {"address": address, "network": f"sui-{settings.SUI_NETWORK}"},
            )
            return {
                "address": address,
                "balance": result.get("balance", "0"),
                "object_count": result.get("object_count", 0),
                "status": "live",
                "network": f"sui-{settings.SUI_NETWORK}",
                "data": result,
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("MCP retrieve_wallet_metadata error: %s", exc)
            raise

    async def validate_proof_records(
        self,
        proof_hashes: list[str],
    ) -> dict[str, Any]:
        """Batch-validate a list of proof hashes against the chain.

        Returns:
            dict with ``total``, ``valid``, ``invalid``, and per-hash
            ``results`` list.
        """
        if self._is_placeholder:
            results = [
                {
                    "proof_hash": ph,
                    "valid": True,
                    "tx_hash": self._sim_hash(ph),
                    "status": "simulated",
                }
                for ph in proof_hashes
            ]
            return {
                "total": len(proof_hashes),
                "valid": len(proof_hashes),
                "invalid": 0,
                "results": results,
            }

        try:
            result = await self._post(
                "v1/blockchain/validate",
                {"proof_hashes": proof_hashes, "network": f"sui-{settings.SUI_NETWORK}"},
            )
            results_list: list[dict[str, Any]] = result.get("results", [])
            valid_count = sum(1 for r in results_list if r.get("valid"))
            return {
                "total": len(proof_hashes),
                "valid": valid_count,
                "invalid": len(proof_hashes) - valid_count,
                "results": results_list,
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("MCP validate_proof_records error: %s", exc)
            raise


# Module-level singleton
tatum_mcp_service = TatumMCPService()
