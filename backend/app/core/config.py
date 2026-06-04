"""VerdictChain core configuration loaded from environment variables."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings sourced from .env or OS environment."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/verdictchain"

    # ── JWT Authentication ──────────────────────────────────────────────
    SECRET_KEY: str = "verdictchain-hackathon-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # ── Walrus Storage ──────────────────────────────────────────────────
    WALRUS_STORAGE_PROVIDER: str = "tatum"  # tatum | direct
    WALRUS_PUBLISHER_URL: str = ""  # direct mode only; use an authenticated mainnet publisher URL
    WALRUS_AGGREGATOR_URL: str = "https://aggregator.walrus-mainnet.walrus.space"
    WALRUS_EPOCHS: int = 4

    # ── Sui Blockchain ──────────────────────────────────────────────────
    SUI_NETWORK: str = "devnet"
    SUI_SENDER_ADDRESS: str = "0x0000000000000000000000000000000000000000000000000000000000000000"
    SUI_NOTARY_PACKAGE_ID: str = ""
    SUI_NOTARY_MODULE: str = "verdictchain_notary"
    SUI_NOTARY_FUNCTION: str = "seal_evidence"
    SUI_CLI_ENABLED: bool = False
    SUI_CLI_PATH: str = "sui"
    SUI_GAS_BUDGET: int = 10000000
    SUI_CLI_TIMEOUT_SECONDS: int = 25

    # ── Tatum ───────────────────────────────────────────────────────────
    TATUM_API_KEY: str = "your-tatum-api-key"
    TATUM_API_URL: str = "https://api.tatum.io"
    TATUM_RPC_URL: str = "https://sui-devnet.gateway.tatum.io"
    TATUM_MCP_URL: str = "https://mcp.tatum.io"

    # ── DeepSeek AI ─────────────────────────────────────────────────────
    DEEPSEEK_API_KEY: str = "your-deepseek-api-key"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-v4-flash"

    # ── Optional Media Extraction Providers ─────────────────────────────
    AUDIO_TRANSCRIPTION_PROVIDER: str = "none"  # none | deepgram
    DEEPGRAM_API_KEY: str = ""

    # ── Server ──────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:8000"]'

    # ── File Upload ─────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_MIME_TYPES: str = (
        "application/pdf,image/png,image/jpeg,image/webp,video/mp4,audio/wav,"
        "audio/mpeg,text/plain,text/csv,application/json,"
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    # ── Derived helpers ─────────────────────────────────────────────────
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_mime_list(self) -> List[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",")]

    @property
    def cors_origin_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]


settings = Settings()
