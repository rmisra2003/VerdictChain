"""VerdictChain service layer – public singletons."""

from __future__ import annotations

from app.services.walrus_service import walrus_service
from app.services.tatum_service import tatum_service
from app.services.sui_service import sui_service
from app.services.tatum_mcp_service import tatum_mcp_service
from app.services.deepseek_service import deepseek_service
from app.services.trust_score_service import trust_score_service

__all__ = [
    "walrus_service",
    "tatum_service",
    "sui_service",
    "tatum_mcp_service",
    "deepseek_service",
    "trust_score_service",
]
