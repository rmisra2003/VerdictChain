"""Sui blockchain proof service.

Provides a high-level interface for creating and verifying on-chain
evidence proofs.  Under the hood every RPC call is routed through the
:pymod:`app.services.tatum_service` for read/verification paths.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from app.core.config import settings
from app.services.tatum_service import tatum_service

logger = logging.getLogger(__name__)

_PLACEHOLDER_KEYS = {"your-tatum-api-key", ""}


class SuiService:
    """High-level async service for Sui proof operations."""

    def __init__(self) -> None:
        self._sender: str = settings.SUI_SENDER_ADDRESS
        self._network: str = settings.SUI_NETWORK
        self._notary_package_id: str = settings.SUI_NOTARY_PACKAGE_ID
        self._module: str = settings.SUI_NOTARY_MODULE
        self._function: str = settings.SUI_NOTARY_FUNCTION
        self._cli_path: str = settings.SUI_CLI_PATH
        self._gas_budget: int = settings.SUI_GAS_BUDGET

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def _is_placeholder(self) -> bool:
        return settings.TATUM_API_KEY in _PLACEHOLDER_KEYS

    def _ensure_configured(self) -> None:
        if self._is_placeholder:
            raise RuntimeError("TATUM_API_KEY must be configured before Sui proof operations.")

    async def _run_sui_cli(self, *args: str) -> dict[str, Any]:
        """Run the local Sui CLI and parse JSON output."""
        process = await asyncio.create_subprocess_exec(
            self._cli_path,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(
                f"sui {' '.join(args)} failed: {stderr.decode(errors='replace').strip()}"
            )

        text = stdout.decode(errors="replace")
        json_start = text.find("{")
        if json_start == -1:
            raise RuntimeError(f"Sui CLI did not return JSON: {text.strip()}")
        return json.loads(text[json_start:])

    async def _ensure_cli_env(self) -> None:
        """Ensure local Sui CLI calls target the configured network."""
        process = await asyncio.create_subprocess_exec(
            self._cli_path,
            "client",
            "active-env",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _stderr = await process.communicate()
        current_env = stdout.decode(errors="replace").strip()
        if current_env == self._network:
            return

        switch = await asyncio.create_subprocess_exec(
            self._cli_path,
            "client",
            "switch",
            "--env",
            self._network,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _stdout, stderr = await switch.communicate()
        if switch.returncode != 0:
            raise RuntimeError(
                f"Failed to switch Sui CLI to {self._network}: "
                f"{stderr.decode(errors='replace').strip()}"
            )

    async def _create_proof_with_cli(
        self,
        proof_hash: str,
        evidence_id: str,
        case_id: str,
    ) -> dict[str, Any]:
        """Call the deployed notary package through the local Sui CLI."""
        await self._ensure_cli_env()
        data = await self._run_sui_cli(
            "client",
            "call",
            "--package",
            self._notary_package_id,
            "--module",
            self._module,
            "--function",
            self._function,
            "--args",
            proof_hash,
            evidence_id,
            case_id,
            "--gas-budget",
            str(self._gas_budget),
            "--json",
        )
        status = data.get("effects", {}).get("status", {}).get("status", "unknown")
        digest = data.get("digest", "")
        return {
            "tx_hash": digest,
            "status": status,
            "proof_hash": proof_hash,
            "evidence_id": evidence_id,
            "case_id": case_id,
            "network": self._network,
            "sender": self._sender,
            "timestamp": int(time.time() * 1000),
            "data": data,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def create_proof(
        self,
        proof_hash: str,
        evidence_id: str,
        case_id: str,
    ) -> dict[str, Any]:
        """Submit an evidence proof to the Sui blockchain.

        Returns:
            dict with ``tx_hash``, ``status``, ``proof_hash``, ``network``,
            ``timestamp``, and optional ``data``.
        """
        self._ensure_configured()

        if not self._notary_package_id:
            latest_checkpoint = await tatum_service.get_latest_checkpoint()
            logger.info(
                "No Sui notary package configured; relying on Walrus mainnet "
                "certification as the on-chain evidence anchor."
            )
            return {
                "tx_hash": None,
                "status": "walrus_anchor_pending",
                "proof_hash": proof_hash,
                "evidence_id": evidence_id,
                "case_id": case_id,
                "network": self._network,
                "sender": self._sender,
                "latest_checkpoint": latest_checkpoint,
                "timestamp": int(time.time() * 1000),
            }

        if settings.SUI_CLI_ENABLED:
            return await self._create_proof_with_cli(proof_hash, evidence_id, case_id)

        # Real submission via Tatum RPC. The signed transaction bytes must be
        # produced by a Sui signer/notary worker outside this service.
        tx_data: dict[str, Any] = {
            "tx_bytes": "",  # Would be the BCS-serialised Move call.
            "signatures": [],
            "proof_hash": proof_hash,
            "evidence_id": evidence_id,
            "case_id": case_id,
        }
        result = await tatum_service.submit_transaction(tx_data)
        return {
            "tx_hash": result["tx_hash"],
            "status": result["status"],
            "proof_hash": proof_hash,
            "evidence_id": evidence_id,
            "case_id": case_id,
            "network": self._network,
            "sender": self._sender,
            "timestamp": int(time.time() * 1000),
            "data": result.get("data"),
        }

    async def verify_proof(self, tx_hash: str) -> dict[str, Any]:
        """Verify that a proof transaction exists on Sui.

        Returns:
            dict with ``tx_hash``, ``verified`` (bool), ``status``, and
            optional ``data``.
        """
        self._ensure_configured()

        result = await tatum_service.verify_transaction(tx_hash)
        return {
            "tx_hash": tx_hash,
            "verified": result.get("verified", False),
            "status": result.get("status", "unknown"),
            "network": self._network,
            "data": result.get("data"),
        }

    async def get_transaction(self, tx_hash: str) -> dict[str, Any]:
        """Return the full transaction details for *tx_hash*."""
        self._ensure_configured()

        return await tatum_service.get_transaction_data(tx_hash)

    async def get_proof(self, proof_hash: str) -> dict[str, Any]:
        """Look up a proof record by its content hash."""
        self._ensure_configured()

        return await tatum_service.get_proof_data(proof_hash)


# Module-level singleton
sui_service = SuiService()
