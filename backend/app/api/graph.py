"""Investigation graph generation and retrieval endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.repositories.repository import case_repo, evidence_repo, graph_repo
from app.schemas.schemas import GraphResponse
from app.services.deepseek_service import deepseek_service
from app.services.walrus_service import walrus_service
from app.utils.audit import log_action

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.post("/generate", response_model=GraphResponse, status_code=status.HTTP_201_CREATED)
async def generate_graph(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate an investigation entity-relationship graph for a case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    evidences = await evidence_repo.get_by_case(db, case_id)

    evidence_list = [
        {
            "id": str(e.id),
            "filename": e.filename,
            "file_type": e.file_type,
            "sha256_hash": e.sha256_hash,
            "verification_status": e.verification_status,
            "created_at": str(e.created_at),
        }
        for e in evidences
    ]

    # Extract entities from evidence first
    entities: list[dict] = []
    for ev in evidence_list:
        try:
            extracted = await deepseek_service.extract_entities(
                f"Evidence file: {ev['filename']}, type: {ev['file_type']}, "
                f"hash: {ev['sha256_hash']}, status: {ev['verification_status']}"
            )
            entities.append(extracted)
        except Exception:
            pass

    # Generate graph data
    graph_json = await deepseek_service.generate_graph_data(entities, evidence_list)

    # Store snapshot in Walrus
    try:
        walrus_blob_id = await walrus_service.upload_json(graph_json)
    except Exception:
        walrus_blob_id = None

    # Save to database
    graph = await graph_repo.create(db, {
        "case_id": case_id,
        "walrus_blob_id": walrus_blob_id,
        "graph_json": graph_json,
    })

    await log_action(
        db,
        action="generate_graph",
        entity_type="graph_snapshot",
        entity_id=graph.id,
        user_id=current_user.id,
        case_id=case_id,
    )

    return graph


@router.get("/{case_id}", response_model=GraphResponse)
async def get_graph(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get the latest graph snapshot for a case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    graph = await graph_repo.get_by_case(db, case_id)
    if graph is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No graph snapshot found for this case")

    return graph
