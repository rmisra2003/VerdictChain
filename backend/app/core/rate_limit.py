"""Simple in-process rate limits for expensive AI operations."""

from __future__ import annotations

import asyncio
import math
import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status

from app.core.config import settings


class InMemoryRateLimiter:
    """Sliding-window limiter suitable for a single backend process."""

    def __init__(self) -> None:
        self._hits: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        """Return ``(allowed, retry_after_seconds)`` for a rate-limit key."""
        if limit <= 0 or window_seconds <= 0:
            return True, 0

        now = time.monotonic()
        cutoff = now - window_seconds

        async with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = max(1, math.ceil(window_seconds - (now - bucket[0])))
                return False, retry_after

            bucket.append(now)
            return True, 0


ai_rate_limiter = InMemoryRateLimiter()


async def enforce_ai_rate_limit(
    request: Request,
    user_id: object | None,
    *,
    scope: str = "ai",
) -> None:
    """Apply a per-user AI rate limit, falling back to client IP."""
    identity = str(user_id) if user_id is not None else (
        request.client.host if request.client else "anonymous"
    )
    key = f"{scope}:{identity}"
    allowed, retry_after = await ai_rate_limiter.check(
        key,
        settings.AI_RATE_LIMIT_MAX_REQUESTS,
        settings.AI_RATE_LIMIT_WINDOW_SECONDS,
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "AI rate limit exceeded. "
                f"Try again in {retry_after} seconds."
            ),
            headers={"Retry-After": str(retry_after)},
        )
