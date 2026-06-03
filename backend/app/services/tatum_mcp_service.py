"""Tatum MCP (Model Context Protocol) client for AI-driven blockchain queries.

The MCP endpoint exposes a higher-level, AI-friendly API on top of raw
blockchain data.
"""

from __future__ import annotations

import logging
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

    def _ensure_configured(self) -> None:
        if self._is_placeholder:
            raise RuntimeError("TATUM_API_KEY must be configured for Tatum MCP calls.")

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

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def verify_blockchain_state(self, tx_hash: str) -> dict[str, Any]:
        """Verify the current on-chain state of a transaction.

        Returns:
            dict with ``tx_hash``, ``verified``, ``status``, ``block_height``,
            ``timestamp``, and ``confirmations``.
        """
        self._ensure_configured()

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
        self._ensure_configured()

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
        self._ensure_configured()

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
        self._ensure_configured()

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
