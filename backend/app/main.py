"""VerdictChain FastAPI Main Application Entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, cases, evidence, graph, reports, timeline, verification
from app.core.config import settings
from app.core.database import init_db

# ── Logging Configuration ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan Context Manager ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Handles startup and shutdown application events."""
    logger.info("Initializing VerdictChain backend server...")
    try:
        # Create database tables automatically
        await init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.critical("Failed to initialize database tables: %s", exc)
        # We don't crash startup during development, but log it clearly
        if not settings.DEBUG:
            raise exc

    yield
    logger.info("VerdictChain backend shutting down...")


# ── FastAPI Instance ────────────────────────────────────────────────────────
app = FastAPI(
    title="VerdictChain API",
    description=(
        "AI-Powered Investigation Workspace with Walrus storage "
        "and Sui blockchain evidence integrity verification."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"], status_code=status.HTTP_200_OK)
async def health_check() -> JSONResponse:
    """System health check endpoint."""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "verdictchain-backend",
            "version": "1.0.0",
            "environment": "development" if settings.DEBUG else "production",
        }
    )


# ── API Routers ─────────────────────────────────────────────────────────────
# All routers are prefixed with /api to keep namespace distinct from frontend
app.include_router(auth.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(verification.router, prefix="/api")
