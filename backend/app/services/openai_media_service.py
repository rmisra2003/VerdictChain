"""OpenAI-backed image and audio extraction helpers."""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(90.0, connect=10.0)
_PLACEHOLDER_KEYS = {"", "your-openai-api-key"}


class OpenAIMediaService:
    """Thin REST client for OpenAI vision and transcription APIs."""

    def __init__(self) -> None:
        self._api_key = settings.OPENAI_API_KEY
        self._base_url = settings.OPENAI_BASE_URL.rstrip("/")
        self._vision_model = settings.OPENAI_VISION_MODEL
        self._audio_model = settings.OPENAI_AUDIO_MODEL

    @property
    def is_configured(self) -> bool:
        return self._api_key not in _PLACEHOLDER_KEYS

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}"}

    async def analyze_image(
        self,
        file_data: bytes,
        content_type: str,
        filename: str,
    ) -> tuple[str, dict[str, Any], list[str]]:
        """Return a visual evidence description and OCR-style text hints."""
        metadata: dict[str, Any] = {
            "openai_vision_enabled": self.is_configured,
            "openai_vision_model": self._vision_model if self.is_configured else None,
        }
        if not self.is_configured:
            return "", metadata, []

        image_data_url = (
            f"data:{content_type};base64,"
            f"{base64.b64encode(file_data).decode('ascii')}"
        )
        payload = {
            "model": self._vision_model,
            "max_output_tokens": settings.OPENAI_VISION_MAX_OUTPUT_TOKENS,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "You are assisting a forensic evidence system. "
                                "Extract all readable text from this image, then summarize "
                                "visually relevant forensic facts. Do not invent hidden facts. "
                                "Return concise plain text with sections: OCR_TEXT, "
                                "VISUAL_SUMMARY, POSSIBLE_ENTITIES, LIMITATIONS."
                            ),
                        },
                        {
                            "type": "input_image",
                            "image_url": image_data_url,
                        },
                    ],
                }
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(
                    f"{self._base_url}/responses",
                    json=payload,
                    headers={
                        **self._auth_headers(),
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "OpenAI image analysis failed for %s: HTTP %s",
                filename,
                exc.response.status_code,
            )
            return "", metadata, [f"OpenAI image analysis unavailable: HTTP {exc.response.status_code}."]
        except httpx.RequestError as exc:
            logger.warning("OpenAI image analysis network error for %s: %s", filename, exc)
            return "", metadata, ["OpenAI image analysis unavailable due to a network error."]

        metadata["openai_response_id"] = data.get("id")
        text = self._response_output_text(data)
        if not text.strip():
            return "", metadata, ["OpenAI image analysis returned no text."]
        return text.strip(), metadata, []

    async def transcribe_audio(
        self,
        file_data: bytes,
        content_type: str,
        filename: str,
    ) -> tuple[str, dict[str, Any], list[str]]:
        """Transcribe supported audio files through OpenAI."""
        metadata: dict[str, Any] = {
            "openai_audio_enabled": self.is_configured,
            "openai_audio_model": self._audio_model if self.is_configured else None,
        }
        if not self.is_configured:
            return "", metadata, ["OpenAI audio transcription is not configured."]

        max_bytes = settings.OPENAI_AUDIO_MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_data) > max_bytes:
            return (
                "",
                metadata,
                [
                    "Audio file exceeds the configured OpenAI transcription "
                    f"limit of {settings.OPENAI_AUDIO_MAX_FILE_SIZE_MB} MB."
                ],
            )

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(
                    f"{self._base_url}/audio/transcriptions",
                    headers=self._auth_headers(),
                    data={
                        "model": self._audio_model,
                        "response_format": "json",
                    },
                    files={
                        "file": (filename, file_data, content_type),
                    },
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "OpenAI audio transcription failed for %s: HTTP %s",
                filename,
                exc.response.status_code,
            )
            return "", metadata, [f"OpenAI audio transcription unavailable: HTTP {exc.response.status_code}."]
        except httpx.RequestError as exc:
            logger.warning("OpenAI audio transcription network error for %s: %s", filename, exc)
            return "", metadata, ["OpenAI audio transcription unavailable due to a network error."]

        text = str(data.get("text") or "").strip()
        metadata["openai_audio_duration"] = data.get("duration")
        if not text:
            return "", metadata, ["OpenAI audio transcription returned no text."]
        return text, metadata, []

    def _response_output_text(self, data: dict[str, Any]) -> str:
        if isinstance(data.get("output_text"), str):
            return data["output_text"]

        parts: list[str] = []
        for item in data.get("output", []) or []:
            if not isinstance(item, dict):
                continue
            for content in item.get("content", []) or []:
                if not isinstance(content, dict):
                    continue
                text = content.get("text")
                if isinstance(text, str) and text.strip():
                    parts.append(text)
        return "\n".join(parts)


openai_media_service = OpenAIMediaService()
