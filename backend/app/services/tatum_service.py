"""Tatum RPC service for Sui blockchain communication.

Wraps the Tatum REST / JSON-RPC gateway so the rest of the application
can submit and query Sui transactions without dealing with raw HTTP.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
_PLACEHOLDER_KEYS = {"your-tatum-api-key", ""}


class TatumService:
    """Low-level async client for the Tatum JSON-RPC / REST API."""

    def __init__(self) -> None:
        self._rpc_url: str = settings.TATUM_RPC_URL.rstrip("/")
        self._api_key: str = settings.TATUM_API_KEY

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def _is_placeholder(self) -> bool:
        """Return *True* when the configured API key is not a real key."""
        return self._api_key in _PLACEHOLDER_KEYS

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-api-key": self._api_key,
        }

    async def _post(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Send a JSON-RPC request to Tatum and return the result."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                self._rpc_url,
                json=payload,
                headers=self._headers(),
            )
            response.raise_for_status()
            return response.json()

    def _ensure_configured(self) -> None:
        if self._is_placeholder:
            raise RuntimeError("TATUM_API_KEY must be configured for live Tatum RPC calls.")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def submit_transaction(self, tx_data: dict[str, Any]) -> dict[str, Any]:
        """Submit a signed transaction to Sui via Tatum RPC.

        Returns:
            dict containing ``tx_hash``, ``status``, and raw ``data``.
        """
        self._ensure_configured()

        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_executeTransactionBlock",
                "params": [
                    tx_data.get("tx_bytes", ""),
                    tx_data.get("signatures", []),
                    {"showEffects": True, "showEvents": True},
                    "WaitForLocalExecution",
                ],
            }
            result = await self._post(payload)
            digest = result.get("result", {}).get("digest", "")
            return {
                "tx_hash": digest,
                "status": "submitted",
                "data": result.get("result", {}),
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum submit_transaction error: %s", exc)
            raise

    async def verify_transaction(self, tx_hash: str) -> dict[str, Any]:
        """Verify that a transaction exists and return its status."""
        self._ensure_configured()

        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getTransactionBlock",
                "params": [tx_hash, {"showEffects": True}],
            }
            result = await self._post(payload)
            effects = result.get("result", {}).get("effects", {})
            status = effects.get("status", {}).get("status", "unknown")
            return {
                "tx_hash": tx_hash,
                "verified": status == "success",
                "status": status,
                "data": result.get("result", {}),
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum verify_transaction error: %s", exc)
            raise

    async def get_latest_checkpoint(self) -> dict[str, Any]:
        """Return the latest Sui checkpoint via Tatum's Sui RPC gateway."""
        self._ensure_configured()

        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getLatestCheckpointSequenceNumber",
                "params": [],
            }
            result = await self._post(payload)
            return {
                "sequence_number": result.get("result"),
                "status": "live",
                "network": settings.SUI_NETWORK,
                "data": result,
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum get_latest_checkpoint error: %s", exc)
            raise

    async def get_wallet_data(self, address: str) -> dict[str, Any]:
        """Retrieve wallet / object information for *address*."""
        self._ensure_configured()

        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_getBalance",
                "params": [address, "0x2::sui::SUI"],
            }
            result = await self._post(payload)
            return {
                "address": address,
                "balance": result.get("result", {}).get("totalBalance", "0"),
                "status": "live",
                "data": result.get("result", {}),
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum get_wallet_data error: %s", exc)
            raise

    async def get_transaction_data(self, tx_hash: str) -> dict[str, Any]:
        """Return the full transaction block for *tx_hash*."""
        self._ensure_configured()

        try:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getTransactionBlock",
                "params": [
                    tx_hash,
                    {"showInput": True, "showEffects": True, "showEvents": True},
                ],
            }
            result = await self._post(payload)
            tx = result.get("result", {})
            return {
                "tx_hash": tx_hash,
                "status": "live",
                "sender": tx.get("transaction", {}).get("data", {}).get("sender", ""),
                "timestamp": tx.get("timestampMs"),
                "effects": tx.get("effects", {}),
                "events": tx.get("events", []),
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum get_transaction_data error: %s", exc)
            raise

    async def get_proof_data(self, proof_hash: str) -> dict[str, Any]:
        """Look up on-chain proof metadata by *proof_hash*.

        In production this should query the deployed Sui Move notary events
        or dynamic fields associated with the proof hash.
        """
        self._ensure_configured()

        try:
            # Query a dynamic field / event associated with the proof hash.
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "suix_queryEvents",
                "params": [
                    {"MoveEventField": {"path": "/proof_hash", "value": proof_hash}},
                    None,
                    1,
                    False,
                ],
            }
            result = await self._post(payload)
            events = result.get("result", {}).get("data", [])
            if events:
                event = events[0]
                return {
                    "proof_hash": proof_hash,
                    "verified": True,
                    "status": "live",
                    "timestamp": event.get("timestampMs"),
                    "tx_hash": event.get("id", {}).get("txDigest", ""),
                }
            return {
                "proof_hash": proof_hash,
                "verified": False,
                "status": "not_found",
            }
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            logger.error("Tatum get_proof_data error: %s", exc)
            raise


# Module-level singleton
tatum_service = TatumService()
