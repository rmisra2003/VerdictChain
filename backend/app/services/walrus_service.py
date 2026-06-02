"""Walrus decentralized-storage service.

Provides async helpers for uploading through Tatum's Walrus API or an
authenticated direct publisher, then verifying blobs through a Walrus
aggregator.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Re-usable timeout for every Walrus call (connect / read / write / pool).
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
_PLACEHOLDER_KEYS = {"your-tatum-api-key", ""}


class WalrusService:
    """Async client for the Walrus blob-storage network."""

    def __init__(self) -> None:
        self._provider: str = settings.WALRUS_STORAGE_PROVIDER.lower()
        self._tatum_api_url: str = settings.TATUM_API_URL.rstrip("/")
        self._tatum_api_key: str = settings.TATUM_API_KEY
        self._publisher_url: str = settings.WALRUS_PUBLISHER_URL.rstrip("/")
        self._aggregator_url: str = settings.WALRUS_AGGREGATOR_URL.rstrip("/")
        self._epochs: int = settings.WALRUS_EPOCHS

    @property
    def _use_tatum_storage(self) -> bool:
        return self._provider == "tatum" and self._tatum_api_key not in _PLACEHOLDER_KEYS

    def _tatum_headers(self) -> dict[str, str]:
        return {"x-api-key": self._tatum_api_key}

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload_file(
        self,
        file_data: bytes,
        content_type: str,
        filename: str = "evidence.bin",
    ) -> dict[str, Any]:
        """Upload raw bytes to Walrus and return blob metadata.

        In hackathon/mainnet mode this uses Tatum's Walrus storage API, which
        stages the file and asynchronously certifies it on Walrus mainnet. The
        immediate response includes a job ID and pre-computed blob ID.

        The publisher may respond with either ``newlyCreated`` (first time)
        or ``alreadyCertified`` (content-addressed duplicate).  Both cases
        are normalised into a consistent return dict.

        Returns:
            dict with keys ``blob_id``, ``status``, and raw ``metadata``.
        """
        if self._use_tatum_storage:
            return await self._upload_with_tatum(file_data, content_type, filename)

        if not self._publisher_url:
            raise RuntimeError(
                "WALRUS_PUBLISHER_URL is required when WALRUS_STORAGE_PROVIDER=direct. "
                "Use Tatum storage or configure an authenticated Walrus mainnet publisher."
            )

        url = f"{self._publisher_url}/v1/blobs?epochs={self._epochs}"
        headers = {"Content-Type": content_type}

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                response = await client.put(url, content=file_data, headers=headers)
                response.raise_for_status()
                data: dict[str, Any] = response.json()

                # Normalise the two possible response shapes.
                if "newlyCreated" in data:
                    blob_object = data["newlyCreated"]["blobObject"]
                    blob_id: str = blob_object["blobId"]
                    status = "newly_created"
                elif "alreadyCertified" in data:
                    blob_object = data["alreadyCertified"]["blobObject"] if "blobObject" in data["alreadyCertified"] else data["alreadyCertified"]
                    blob_id = data["alreadyCertified"].get("blobId") or blob_object.get("blobId", "")
                    status = "already_certified"
                else:
                    # Fallback – grab whatever blob id the API returned.
                    blob_id = data.get("blobId", "")
                    blob_object = data
                    status = "unknown"

                logger.info("Walrus upload complete – blob_id=%s status=%s", blob_id, status)
                return {
                    "blob_id": blob_id,
                    "status": status,
                    "provider": "direct",
                    "metadata": blob_object,
                }

            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Walrus upload failed (HTTP %s): %s",
                    exc.response.status_code,
                    exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error("Walrus upload network error: %s", exc)
                raise

    async def _upload_with_tatum(
        self,
        file_data: bytes,
        content_type: str,
        filename: str,
    ) -> dict[str, Any]:
        """Upload bytes through Tatum's Walrus mainnet storage API."""
        url = f"{self._tatum_api_url}/v4/data/storage/upload"
        files = {"file": (filename, file_data, content_type)}

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                response = await client.post(
                    url,
                    files=files,
                    headers=self._tatum_headers(),
                )
                response.raise_for_status()
                data: dict[str, Any] = response.json()

                job_id = (
                    data.get("jobId")
                    or data.get("job_id")
                    or data.get("id")
                    or ""
                )
                blob_id = (
                    data.get("blobId")
                    or data.get("blob_id")
                    or data.get("quiltId")
                    or data.get("quilt_id")
                    or ""
                )
                status = data.get("status") or data.get("state") or "PENDING"

                logger.info(
                    "Tatum Walrus upload staged – job_id=%s blob_id=%s status=%s",
                    job_id,
                    blob_id,
                    status,
                )
                return {
                    "blob_id": blob_id,
                    "job_id": job_id,
                    "status": status,
                    "provider": "tatum",
                    "metadata": data,
                }
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Tatum Walrus upload failed (HTTP %s): %s",
                    exc.response.status_code,
                    exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error("Tatum Walrus upload network error: %s", exc)
                raise

    async def get_upload_status(self, job_id: str) -> dict[str, Any]:
        """Return the current Tatum Walrus upload job status."""
        if not self._use_tatum_storage:
            return {"job_id": job_id, "provider": "direct", "status": "unknown"}

        url = f"{self._tatum_api_url}/v4/data/storage/upload/{job_id}"
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.get(url, headers=self._tatum_headers())
            response.raise_for_status()
            data: dict[str, Any] = response.json()
            data.setdefault("job_id", job_id)
            data.setdefault("provider", "tatum")
            return data

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    async def download_file(self, blob_id: str) -> bytes:
        """Download raw blob contents by *blob_id*."""
        url = f"{self._aggregator_url}/v1/blobs/{blob_id}"

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Walrus download failed (HTTP %s): %s",
                    exc.response.status_code,
                    exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error("Walrus download network error: %s", exc)
                raise

    # ------------------------------------------------------------------
    # Metadata / verification
    # ------------------------------------------------------------------

    async def get_blob_metadata(self, blob_id: str) -> dict[str, Any]:
        """Retrieve metadata (headers) for a blob without downloading it."""
        url = f"{self._aggregator_url}/v1/blobs/{blob_id}"

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                response = await client.head(url)
                response.raise_for_status()
                return {
                    "blob_id": blob_id,
                    "content_type": response.headers.get("content-type", "application/octet-stream"),
                    "content_length": int(response.headers.get("content-length", 0)),
                    "exists": True,
                }
            except httpx.HTTPStatusError:
                return {"blob_id": blob_id, "exists": False}
            except httpx.RequestError as exc:
                logger.error("Walrus metadata request error: %s", exc)
                return {"blob_id": blob_id, "exists": False}

    async def verify_blob(self, blob_id: str) -> bool:
        """Return ``True`` when the blob exists and is reachable."""
        meta = await self.get_blob_metadata(blob_id)
        return meta.get("exists", False)

    # ------------------------------------------------------------------
    # JSON convenience wrappers
    # ------------------------------------------------------------------

    async def upload_json(self, data: dict[str, Any]) -> str:
        """Serialise *data* to JSON, upload it, and return the blob_id."""
        payload = json.dumps(data, separators=(",", ":"), sort_keys=True).encode()
        result = await self.upload_file(payload, content_type="application/json")
        return result["blob_id"]

    async def download_json(self, blob_id: str) -> dict[str, Any]:
        """Download a blob that was stored as JSON and return the parsed dict."""
        raw = await self.download_file(blob_id)
        return json.loads(raw)


# Module-level singleton
walrus_service = WalrusService()
