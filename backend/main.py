"""VerdictChain local development server runner."""

from __future__ import annotations

import uvicorn

from app.core.config import settings
from app.main import app  # noqa: F401

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
